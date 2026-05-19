import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import { users, notificationPreferences, sessions } from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import {
  createSession,
  getActiveSanction,
  hashToken,
} from '../lib/auth';
import { fetchActiveUser } from '../lib/users';
import { isUniqueViolation } from '../lib/dbError';

export const authRouter = Router();

const usernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Nome de usuário deve ter 3–30 caracteres alfanuméricos ou _');

const registerSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(50),
  email: z.string().email().max(255),
  password: z.string().min(8).max(72),
});

const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

function sessionMeta(req: AuthRequest) {
  return {
    userAgent: req.headers['user-agent'] ?? null,
    ipAddress: req.ip ?? null,
  };
}

// UC-01 Cadastro
authRouter.post('/register', async (req: AuthRequest, res) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) {
    // FA-01c — formato inválido
    return res
      .status(422)
      .json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const { username, displayName, email, password } = parse.data;

  try {
    const existing = await db
      .select({ username: users.username, email: users.email })
      .from(users)
      .where(
        and(
          isNull(users.deletedAt),
          // qualquer conta ativa com o mesmo username OU email
          eq(users.username, username),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      // FA-01a
      return res.status(409).json({ message: 'Nome de usuário indisponível' });
    }

    const emailInUse = await db
      .select({ id: users.id })
      .from(users)
      .where(and(isNull(users.deletedAt), eq(users.email, email)))
      .limit(1);

    if (emailInUse.length > 0) {
      // FA-01b
      return res.status(409).json({ message: 'E-mail já cadastrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [created] = await db
      .insert(users)
      .values({ username, email, displayName, passwordHash })
      .returning({ id: users.id });

    // UC-01 passo 5 — preferências de notificação com todos os campos true
    await db.insert(notificationPreferences).values({ userId: created.id });

    // UC-01 passo 6 — sessão + JWT
    const token = await createSession(created.id, sessionMeta(req));
    const user = await fetchActiveUser(created.id, { id: created.id });

    return res.status(201).json({ token, user });
  } catch (e: unknown) {
    // Corrida no índice único parcial (deleted_at IS NULL)
    if (isUniqueViolation(e)) {
      return res.status(409).json({ message: 'Nome de usuário ou e-mail indisponível' });
    }
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-02 Login
authRouter.post('/login', async (req: AuthRequest, res) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const { username, password } = parse.data;

  try {
    // FA-02d — conta deletada é tratada como inexistente
    const [account] = await db
      .select({ id: users.id, passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.username, username), isNull(users.deletedAt)))
      .limit(1);

    if (!account) {
      // FA-02a — mensagem genérica
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const ok = await bcrypt.compare(password, account.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // UC-02 passo 4 — sanção ativa
    const sanction = await getActiveSanction(account.id);
    if (sanction) {
      if (sanction.sanctionType === 'ban') {
        // FA-02c
        return res
          .status(403)
          .json({ message: 'Conta banida permanentemente', reason: sanction.reason });
      }
      // FA-02b
      return res.status(403).json({
        message: 'Conta suspensa',
        reason: sanction.reason,
        expiresAt: sanction.expiresAt,
      });
    }

    const token = await createSession(account.id, sessionMeta(req));
    const user = await fetchActiveUser(account.id, { id: account.id });

    return res.json({ token, user });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-03 Logout
authRouter.post('/logout', authMiddleware, async (req: AuthRequest, res) => {
  const authHeader = req.headers.authorization ?? '';
  const token = authHeader.slice(7);

  try {
    await db
      .update(sessions)
      .set({ revokedAt: new Date() })
      .where(
        and(eq(sessions.tokenHash, hashToken(token)), isNull(sessions.revokedAt)),
      );

    return res.json({ message: 'Logout realizado' });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

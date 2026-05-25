import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, asc, eq, isNull } from 'drizzle-orm';
import { db } from '../db';
import {
  users,
  follows,
  notifications,
  notificationPreferences,
} from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { revokeAllSessions } from '../lib/auth';
import { fetchActiveUser, isUuid, userPublicFields } from '../lib/users';
import { isUniqueViolation } from '../lib/dbError';

export const usersRouter = Router();

usersRouter.use(authMiddleware);

/** Resolve um usuário ativo por id (UUID) ou username, retornando só o id. */
async function resolveActiveUserId(param: string): Promise<string | null> {
  const match = isUuid(param)
    ? eq(users.id, param)
    : eq(users.username, param);

  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(and(match, isNull(users.deletedAt)))
    .limit(1);

  return row?.id ?? null;
}

const updateProfileSchema = z
  .object({
    displayName: z.string().trim().min(1).max(50),
    bio: z.string().max(160).nullable(),
    avatarUrl: z.string().max(2048).nullable(),
    coverUrl: z.string().max(2048).nullable(),
  })
  .partial();

// UC-05 Editar perfil — antes de `/:userId` para não ser capturada pelo param
usersRouter.patch('/me', async (req: AuthRequest, res) => {
  const parse = updateProfileSchema.safeParse(req.body);
  if (!parse.success) {
    // FA-05a
    return res
      .status(422)
      .json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const data = parse.data;
  if (Object.keys(data).length === 0) {
    return res.status(422).json({ message: 'Nenhum campo para atualizar' });
  }

  try {
    await db
      .update(users)
      .set(data)
      .where(and(eq(users.id, req.userId!), isNull(users.deletedAt)));

    const user = await fetchActiveUser(req.userId!, { id: req.userId! });
    return res.json(user);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

const deleteAccountSchema = z.object({ password: z.string().min(1) }).partial();

// UC-07 Excluir conta — soft delete + revogar sessões
usersRouter.delete('/me', async (req: AuthRequest, res) => {
  const parse = deleteAccountSchema.safeParse(req.body ?? {});
  const password = parse.success ? parse.data.password : undefined;

  try {
    // FA-07a — se a senha for enviada, ela precisa estar correta
    if (password !== undefined) {
      const [account] = await db
        .select({ passwordHash: users.passwordHash })
        .from(users)
        .where(and(eq(users.id, req.userId!), isNull(users.deletedAt)))
        .limit(1);

      if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
        return res.status(401).json({ message: 'Senha incorreta' });
      }
    }

    await db
      .update(users)
      .set({ deletedAt: new Date() })
      .where(and(eq(users.id, req.userId!), isNull(users.deletedAt)));

    await revokeAllSessions(req.userId!);

    return res.json({ message: 'Conta excluída' });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-04 Visualizar perfil (aceita id UUID ou username)
usersRouter.get('/:userId', async (req: AuthRequest, res) => {
  const param = req.params.userId as string;
  const by = isUuid(param) ? { id: param } : { username: param };

  try {
    const user = await fetchActiveUser(req.userId!, by);
    if (!user) {
      // FA-04a
      return res.status(404).json({ message: 'Perfil não encontrado' });
    }
    return res.json(user);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-08 Seguir
usersRouter.post('/:userId/follow', async (req: AuthRequest, res) => {
  const followerId = req.userId!;

  try {
    const targetId = await resolveActiveUserId(req.params.userId as string);
    if (!targetId) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }
    if (targetId === followerId) {
      // FA-08b
      return res
        .status(422)
        .json({ message: 'Não é possível seguir a si mesmo' });
    }

    await db.insert(follows).values({ followerId, followedId: targetId });

    // UC-08 passo 3 — notificação do tipo follow (respeita preferências)
    const [prefs] = await db
      .select({ notifyFollow: notificationPreferences.notifyFollow })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, targetId))
      .limit(1);

    if (!prefs || prefs.notifyFollow) {
      await db.insert(notifications).values({
        recipientId: targetId,
        actorId: followerId,
        type: 'follow',
      });
    }

    return res.status(201).json({ following: true });
  } catch (e: unknown) {
    // FA-08a — já segue (PK composta)
    if (isUniqueViolation(e)) {
      return res.status(409).json({ message: 'Você já segue este usuário' });
    }
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-09 Deixar de seguir
usersRouter.delete('/:userId/follow', async (req: AuthRequest, res) => {
  const followerId = req.userId!;

  try {
    const targetId = await resolveActiveUserId(req.params.userId as string);
    if (!targetId) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    const removed = await db
      .delete(follows)
      .where(
        and(
          eq(follows.followerId, followerId),
          eq(follows.followedId, targetId),
        ),
      )
      .returning({ followedId: follows.followedId });

    if (removed.length === 0) {
      // FA-09a
      return res.status(404).json({ message: 'Você não segue este usuário' });
    }

    return res.json({ following: false });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-10 Listar seguidores
usersRouter.get('/:userId/followers', async (req: AuthRequest, res) => {
  const param = req.params.userId as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const targetId = await resolveActiveUserId(param);
    if (!targetId) return res.status(404).json({ message: 'Usuário não encontrado' });

    const rows = await db
      .select(userPublicFields(req.userId!))
      .from(users)
      .innerJoin(follows, eq(follows.followerId, users.id))
      .where(and(eq(follows.followedId, targetId), isNull(users.deletedAt)))
      .orderBy(asc(follows.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(rows.map((row) => ({ ...row, isMe: row.id === req.userId })));
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-10 Listar seguindo
usersRouter.get('/:userId/following', async (req: AuthRequest, res) => {
  const param = req.params.userId as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const targetId = await resolveActiveUserId(param);
    if (!targetId) return res.status(404).json({ message: 'Usuário não encontrado' });

    const rows = await db
      .select(userPublicFields(req.userId!))
      .from(users)
      .innerJoin(follows, eq(follows.followedId, users.id))
      .where(and(eq(follows.followerId, targetId), isNull(users.deletedAt)))
      .orderBy(asc(follows.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(rows.map((row) => ({ ...row, isMe: row.id === req.userId })));
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

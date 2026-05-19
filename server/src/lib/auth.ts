import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { and, eq, gt, isNull, or } from 'drizzle-orm';
import { db } from '../db';
import { sessions, userSanctions } from '../../../db/schema';

/**
 * O middleware de autenticação identifica a sessão pelo `sessionId` do payload
 * do JWT; o `token_hash` é armazenado apenas como identificador único e auditável
 * do token emitido (SHA-256, pois o JWT excede o limite de 72 bytes do bcrypt).
 */
export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export type SessionMeta = {
  userAgent?: string | null;
  ipAddress?: string | null;
};

/**
 * Cria um registro em `sessions` e devolve o JWT assinado.
 * Usado por UC-01 (cadastro) e UC-02 (login).
 */
export async function createSession(userId: string, meta: SessionMeta): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET não configurado');

  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  const sessionId = crypto.randomUUID();

  const token = jwt.sign({ userId, sessionId }, secret, {
    expiresIn,
  } as jwt.SignOptions);

  const decoded = jwt.decode(token) as { exp: number };
  const expiresAt = new Date(decoded.exp * 1000);

  await db.insert(sessions).values({
    id: sessionId,
    userId,
    tokenHash: hashToken(token),
    userAgent: meta.userAgent ?? null,
    ipAddress: meta.ipAddress ?? null,
    expiresAt,
  });

  return token;
}

/**
 * Revoga todas as sessões ativas do usuário (UC-03, UC-07).
 */
export async function revokeAllSessions(userId: string): Promise<void> {
  await db
    .update(sessions)
    .set({ revokedAt: new Date() })
    .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
}

/**
 * Retorna a sanção ativa do usuário, se houver (UC-02, FA-02b/FA-02c).
 * - `ban`: sempre ativo enquanto não revogado.
 * - `suspension`: ativo enquanto não revogado e `expires_at` no futuro.
 */
export async function getActiveSanction(userId: string) {
  const now = new Date();
  const [sanction] = await db
    .select()
    .from(userSanctions)
    .where(
      and(
        eq(userSanctions.userId, userId),
        isNull(userSanctions.revokedAt),
        or(
          eq(userSanctions.sanctionType, 'ban'),
          and(
            eq(userSanctions.sanctionType, 'suspension'),
            gt(userSanctions.expiresAt, now),
          ),
        ),
      ),
    )
    .limit(1);

  return sanction ?? null;
}

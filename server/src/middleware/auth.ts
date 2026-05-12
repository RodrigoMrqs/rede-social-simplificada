import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../db';
import { sessions } from '../../../../db/schema';
import { eq } from 'drizzle-orm';

export type AuthRequest = Request & {
  userId?: string;
};

export async function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Não autorizado' });
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: string;
      sessionId: string;
    };

    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, payload.sessionId))
      .limit(1);

    if (!session || session.revokedAt !== null) {
      res.status(401).json({ message: 'Sessão revogada' });
      return;
    }

    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido' });
  }
}

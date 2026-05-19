import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { db } from '../db';
import { admins } from '../../../db/schema';
import { eq, isNull } from 'drizzle-orm';

export type AdminRequest = AuthRequest & {
  adminId?: string;
};

export async function adminMiddleware(
  req: AdminRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const [admin] = await db
    .select()
    .from(admins)
    .where(eq(admins.userId, req.userId!))
    .limit(1);

  if (!admin || admin.revokedAt !== null) {
    res.status(403).json({ message: 'Acesso negado' });
    return;
  }

  req.adminId = admin.id;
  next();
}

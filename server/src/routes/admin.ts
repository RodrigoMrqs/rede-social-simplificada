import { Router } from 'express';
import { and, count, desc, eq, isNotNull, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import { moderationLogs, posts, users, userSanctions } from '../../../db/schema';
import { authMiddleware } from '../middleware/auth';
import { adminMiddleware, AdminRequest } from '../middleware/adminAuth';
import { revokeAllSessions } from '../lib/auth';

export const adminRouter = Router();

adminRouter.use(authMiddleware, adminMiddleware);

// UC-19 / UC-22 — Dashboard com métricas
adminRouter.get('/dashboard', async (_req: AdminRequest, res) => {
  try {
    const [userRow] = await db.select({ total: count() }).from(users).where(isNull(users.deletedAt));
    const [postRow] = await db.select({ total: count() }).from(posts).where(isNull(posts.deletedAt));
    const [hiddenRow] = await db
      .select({ total: count() })
      .from(posts)
      .where(and(isNull(posts.deletedAt), isNotNull(posts.hiddenAt)));
    const recentPosts = await db
      .select()
      .from(posts)
      .where(isNull(posts.deletedAt))
      .orderBy(desc(posts.createdAt))
      .limit(10);

    return res.json({
      totalUsers: Number(userRow?.total ?? 0),
      totalPosts: Number(postRow?.total ?? 0),
      hiddenPosts: Number(hiddenRow?.total ?? 0),
      recentPosts,
    });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

const reasonSchema = z.object({ reason: z.string().min(1).max(500) });

// UC-20 Ocultar post
adminRouter.post('/posts/:postId/hide', async (req: AdminRequest, res) => {
  const parse = reasonSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Motivo é obrigatório' });
  }

  const postId = req.params.postId as string;
  const adminId = req.adminId!;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });
    if (post.hiddenAt) return res.status(409).json({ message: 'Post já está oculto' });

    await db.update(posts).set({ hiddenAt: new Date(), hiddenBy: adminId }).where(eq(posts.id, postId));

    await db.insert(moderationLogs).values({
      adminId,
      action: 'hide',
      postId,
      reason: parse.data.reason,
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-20 Restaurar post
adminRouter.post('/posts/:postId/restore', async (req: AdminRequest, res) => {
  const parse = reasonSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Motivo é obrigatório' });
  }

  const postId = req.params.postId as string;
  const adminId = req.adminId!;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });
    if (!post.hiddenAt) return res.status(409).json({ message: 'Post não está oculto' });

    await db.update(posts).set({ hiddenAt: null, hiddenBy: null }).where(eq(posts.id, postId));

    await db.insert(moderationLogs).values({
      adminId,
      action: 'restore',
      postId,
      reason: parse.data.reason,
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-20 Deletar post (admin)
adminRouter.delete('/posts/:postId', async (req: AdminRequest, res) => {
  const parse = reasonSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Motivo é obrigatório' });
  }

  const postId = req.params.postId as string;
  const adminId = req.adminId!;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });

    await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId));

    await db.insert(moderationLogs).values({
      adminId,
      action: 'delete',
      postId,
      reason: parse.data.reason,
    });

    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

const sanctionSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ban'), reason: z.string().min(1).max(500) }),
  z.object({
    type: z.literal('suspension'),
    reason: z.string().min(1).max(500),
    expiresAt: z.string().datetime(),
  }),
]);

// UC-21 Suspender / banir usuário
adminRouter.post('/users/:userId/sanction', async (req: AdminRequest, res) => {
  const parse = sanctionSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const userId = req.params.userId as string;
  const adminId = req.adminId!;

  try {
    const [user] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.id, userId), isNull(users.deletedAt)))
      .limit(1);

    if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });

    const [sanction] = await db
      .insert(userSanctions)
      .values({
        userId,
        appliedBy: adminId,
        sanctionType: parse.data.type,
        reason: parse.data.reason,
        expiresAt: parse.data.type === 'suspension' ? new Date(parse.data.expiresAt) : null,
      })
      .returning();

    await revokeAllSessions(userId);

    return res.status(201).json(sanction);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-21 Revogar sanção
adminRouter.post('/users/:userId/sanction/:sanctionId/revoke', async (req: AdminRequest, res) => {
  const sanctionId = req.params.sanctionId as string;
  const adminId = req.adminId!;
  const revokeReason = typeof req.body?.reason === 'string' ? req.body.reason : null;

  try {
    const [sanction] = await db
      .select()
      .from(userSanctions)
      .where(and(eq(userSanctions.id, sanctionId), isNull(userSanctions.revokedAt)))
      .limit(1);

    if (!sanction) return res.status(404).json({ message: 'Sanção não encontrada' });

    await db
      .update(userSanctions)
      .set({ revokedAt: new Date(), revokedBy: adminId, revokeReason })
      .where(eq(userSanctions.id, sanctionId));

    return res.json({ message: 'Sanção revogada' });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

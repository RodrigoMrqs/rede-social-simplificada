import { Router } from 'express';
import { and, desc, eq, isNull } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { db } from '../db';
import { notifications, users } from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const notificationsRouter = Router();

notificationsRouter.use(authMiddleware);

// UC-17 Listar notificações
notificationsRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  const actors = alias(users, 'actors');

  try {
    const rows = await db
      .select({
        id: notifications.id,
        type: notifications.type,
        postId: notifications.postId,
        commentId: notifications.commentId,
        createdAt: notifications.createdAt,
        readAt: notifications.readAt,
        actor: {
          id: actors.id,
          username: actors.username,
          displayName: actors.displayName,
          avatarUrl: actors.avatarUrl,
        },
      })
      .from(notifications)
      .innerJoin(actors, eq(actors.id, notifications.actorId))
      .where(eq(notifications.recipientId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(rows);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-17 Marcar como lida
notificationsRouter.patch('/:id/read', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const notifId = req.params.id as string;

  try {
    const [updated] = await db
      .update(notifications)
      .set({ readAt: new Date() })
      .where(
        and(
          eq(notifications.id, notifId),
          eq(notifications.recipientId, userId),
          isNull(notifications.readAt),
        ),
      )
      .returning({ id: notifications.id });

    if (!updated) return res.status(404).json({ message: 'Notificação não encontrada' });

    return res.json({ read: true });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// Badge de não-lidas
notificationsRouter.get('/unread-count', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// Marcar tudo como lido
notificationsRouter.post('/read-all', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-06 Ler preferências de notificação
notificationsRouter.get('/preferences', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-06 Atualizar preferências de notificação
notificationsRouter.patch('/preferences', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

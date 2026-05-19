import { Router } from 'express';
import { eq, and, isNull } from 'drizzle-orm';
import { z } from 'zod';
import { db } from '../db';
import {
  posts,
  postLikes,
  comments,
  notifications,
  notificationPreferences,
} from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const postsRouter = Router();

postsRouter.use(authMiddleware);

const contentSchema = z.object({
  content: z.string().min(1).max(280),
});

// UC-11 Publicar
postsRouter.post('/', async (req: AuthRequest, res) => {
  const parse = contentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Conteúdo inválido', errors: parse.error.errors });
  }

  try {
    const [post] = await db
      .insert(posts)
      .values({ authorId: req.userId!, content: parse.data.content })
      .returning();
    return res.status(201).json(post);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-12 Excluir post
postsRouter.delete('/:postId', async (req: AuthRequest, res) => {
  const postId = req.params.postId as string;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });
    if (post.authorId !== req.userId) return res.status(403).json({ message: 'Sem permissão' });

    await db.update(posts).set({ deletedAt: new Date() }).where(eq(posts.id, postId));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// Detalhe do post (UC-14)
postsRouter.get('/:postId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-13 Curtir
postsRouter.post('/:postId/like', async (req: AuthRequest, res) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt), isNull(posts.hiddenAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });

    await db.insert(postLikes).values({ userId, postId });

    if (post.authorId !== userId) {
      const [prefs] = await db
        .select({ notifyLike: notificationPreferences.notifyLike })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, post.authorId))
        .limit(1);

      if (!prefs || prefs.notifyLike) {
        await db.insert(notifications).values({
          recipientId: post.authorId,
          actorId: userId,
          type: 'like',
          postId,
        });
      }
    }

    return res.status(204).send();
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ message: 'Post já curtido' });
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-13 Descurtir
postsRouter.delete('/:postId/like', async (req: AuthRequest, res) => {
  const postId = req.params.postId as string;

  try {
    await db
      .delete(postLikes)
      .where(and(eq(postLikes.userId, req.userId!), eq(postLikes.postId, postId)));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-14 Comentar
postsRouter.post('/:postId/comments', async (req: AuthRequest, res) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;

  const parse = contentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Conteúdo inválido', errors: parse.error.errors });
  }

  try {
    const [post] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt), isNull(posts.hiddenAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });

    const [comment] = await db
      .insert(comments)
      .values({ postId, authorId: userId, content: parse.data.content })
      .returning();

    if (post.authorId !== userId) {
      const [prefs] = await db
        .select({ notifyComment: notificationPreferences.notifyComment })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, post.authorId))
        .limit(1);

      if (!prefs || prefs.notifyComment) {
        await db.insert(notifications).values({
          recipientId: post.authorId,
          actorId: userId,
          type: 'comment',
          postId,
          commentId: comment.id,
        });
      }
    }

    return res.status(201).json(comment);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-15 Repostar
postsRouter.post('/:postId/repost', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-23 Editar comentário
postsRouter.patch('/:postId/comments/:commentId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

// UC-24 Excluir comentário
postsRouter.delete('/:postId/comments/:commentId', async (_req: AuthRequest, res) => {
  res.status(501).json({ message: 'Not implemented' });
});

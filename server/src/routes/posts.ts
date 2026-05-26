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

// UC-11 Editar post (somente autor)
postsRouter.patch('/:postId', async (req: AuthRequest, res) => {
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
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt)))
      .limit(1);

    if (!post) return res.status(404).json({ message: 'Post não encontrado' });
    if (post.authorId !== userId) return res.status(403).json({ message: 'Sem permissão' });

    const [updated] = await db
      .update(posts)
      .set({ content: parse.data.content })
      .where(eq(posts.id, postId))
      .returning();

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
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
    const isUniqueViolation = e.code === '23505' || e.message?.includes('23505');
    if (isUniqueViolation) return res.status(409).json({ message: 'Post já curtido' });
    console.error('[like error]', e);
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
  } catch (e) {
    console.error('[unlike error]', e);
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
postsRouter.post('/:postId/repost', async (req: AuthRequest, res) => {
  const postId = req.params.postId as string;
  const userId = req.userId!;

  const parse = z.object({ content: z.string().max(280).optional() }).safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Conteúdo inválido', errors: parse.error.errors });
  }

  try {
    const [original] = await db
      .select()
      .from(posts)
      .where(and(eq(posts.id, postId), isNull(posts.deletedAt), isNull(posts.hiddenAt)))
      .limit(1);

    if (!original) return res.status(404).json({ message: 'Post não encontrado' });

    const isSimple = !parse.data.content || parse.data.content.trim() === '';

    const [repost] = await db
      .insert(posts)
      .values({
        authorId: userId,
        content: parse.data.content ?? '',
        repostOfId: postId,
        isRepostSimple: isSimple,
      })
      .returning();

    if (original.authorId !== userId) {
      const [prefs] = await db
        .select({ notifyRepost: notificationPreferences.notifyRepost })
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, original.authorId))
        .limit(1);

      if (!prefs || prefs.notifyRepost) {
        await db.insert(notifications).values({
          recipientId: original.authorId,
          actorId: userId,
          type: 'repost',
          postId,
        });
      }
    }

    return res.status(201).json(repost);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-23 Editar comentário
postsRouter.patch('/:postId/comments/:commentId', async (req: AuthRequest, res) => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };
  const userId = req.userId!;

  const parse = contentSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Conteúdo inválido', errors: parse.error.errors });
  }

  try {
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.postId, postId), isNull(comments.deletedAt)))
      .limit(1);

    if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' });
    if (comment.authorId !== userId) return res.status(403).json({ message: 'Sem permissão' });

    const [updated] = await db
      .update(comments)
      .set({ content: parse.data.content })
      .where(eq(comments.id, commentId))
      .returning();

    return res.json(updated);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-24 Excluir comentário (soft delete)
postsRouter.delete('/:postId/comments/:commentId', async (req: AuthRequest, res) => {
  const { postId, commentId } = req.params as { postId: string; commentId: string };
  const userId = req.userId!;

  try {
    const [comment] = await db
      .select()
      .from(comments)
      .where(and(eq(comments.id, commentId), eq(comments.postId, postId), isNull(comments.deletedAt)))
      .limit(1);

    if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' });
    if (comment.authorId !== userId) return res.status(403).json({ message: 'Sem permissão' });

    await db.update(comments).set({ deletedAt: new Date() }).where(eq(comments.id, commentId));
    return res.status(204).send();
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

import { Router } from 'express';
import { and, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { posts, users } from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { userPublicFields } from '../lib/users';

export const searchRouter = Router();

searchRouter.use(authMiddleware);

// UC-18 Busca de usuários e posts via tsvector
searchRouter.get('/', async (req: AuthRequest, res) => {
  const q = (req.query.q as string)?.trim();
  const type = req.query.type as string | undefined; // 'users' | 'posts' | undefined = ambos
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  if (!q) return res.status(400).json({ message: 'Parâmetro q é obrigatório' });

  try {
    const result: { users?: unknown[]; posts?: unknown[] } = {};

    if (!type || type === 'users') {
      const userRows = await db
        .select(userPublicFields(req.userId!))
        .from(users)
        .where(
          and(
            isNull(users.deletedAt),
            sql`to_tsvector('portuguese', ${users.username} || ' ' || ${users.displayName} || ' ' || COALESCE(${users.bio}, '')) @@ plainto_tsquery('portuguese', ${q})`,
          ),
        )
        .limit(limit)
        .offset(offset);

      result.users = userRows.map((row) => ({ ...row, isMe: row.id === req.userId }));
    }

    if (!type || type === 'posts') {
      const postRows = await db
        .select({
          id: posts.id,
          authorId: posts.authorId,
          content: posts.content,
          repostOfId: posts.repostOfId,
          isRepostSimple: posts.isRepostSimple,
          createdAt: posts.createdAt,
        })
        .from(posts)
        .where(
          and(
            isNull(posts.deletedAt),
            isNull(posts.hiddenAt),
            sql`to_tsvector('portuguese', ${posts.content}) @@ plainto_tsquery('portuguese', ${q})`,
          ),
        )
        .orderBy(
          sql`ts_rank(to_tsvector('portuguese', ${posts.content}), plainto_tsquery('portuguese', ${q})) DESC`,
        )
        .limit(limit)
        .offset(offset);

      result.posts = postRows;
    }

    return res.json(result);
  } catch (e) {
    console.error('[search error]', e);
    return res.status(500).json({ message: 'Erro interno' });
  }
});

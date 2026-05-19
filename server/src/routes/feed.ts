import { Router } from 'express';
import { eq, and, isNull, desc, lt, inArray, notInArray, sql } from 'drizzle-orm';
import { db } from '../db';
import { posts, follows, users } from '../../../db/schema';
import { authMiddleware, AuthRequest } from '../middleware/auth';

export const feedRouter = Router();

feedRouter.use(authMiddleware);

const PAGE_SIZE = 20;
const DISCOVERY_SIZE = 5;

function postFields(userId: string) {
  return {
    id: posts.id,
    content: posts.content,
    createdAt: posts.createdAt,
    repostOfId: posts.repostOfId,
    isRepostSimple: posts.isRepostSimple,
    author: {
      id: users.id,
      username: users.username,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
    },
    likesCount: sql<number>`(SELECT COUNT(*) FROM post_likes WHERE post_id = ${posts.id})::int`,
    isLikedByMe: sql<boolean>`EXISTS(SELECT 1 FROM post_likes WHERE post_id = ${posts.id} AND user_id = ${userId}::uuid)`,
    commentsCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND deleted_at IS NULL)::int`,
  };
}

// UC-16 Feed — posts de seguidos + descoberta, ordenados por created_at
feedRouter.get('/', async (req: AuthRequest, res) => {
  const userId = req.userId!;
  const cursor = req.query.cursor as string | undefined;
  const cursorDate = cursor ? new Date(cursor) : undefined;

  try {
    const followedRows = await db
      .select({ followedId: follows.followedId })
      .from(follows)
      .where(eq(follows.followerId, userId));

    const authorIds = [userId, ...followedRows.map((r) => r.followedId)];

    const baseConditions = [isNull(posts.deletedAt), isNull(posts.hiddenAt)];
    if (cursorDate) baseConditions.push(lt(posts.createdAt, cursorDate) as any);

    const join = and(eq(posts.authorId, users.id), isNull(users.deletedAt));

    const [followedPosts, discoveryPosts] = await Promise.all([
      db
        .select(postFields(userId))
        .from(posts)
        .innerJoin(users, join)
        .where(and(inArray(posts.authorId, authorIds), ...baseConditions))
        .orderBy(desc(posts.createdAt))
        .limit(PAGE_SIZE),

      db
        .select(postFields(userId))
        .from(posts)
        .innerJoin(users, join)
        .where(and(notInArray(posts.authorId, authorIds), ...baseConditions))
        .orderBy(desc(posts.createdAt))
        .limit(DISCOVERY_SIZE),
    ]);

    const seen = new Set<string>();
    const merged = [...followedPosts, ...discoveryPosts]
      .filter((p) => (seen.has(p.id) ? false : seen.add(p.id) && true))
      .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime())
      .slice(0, PAGE_SIZE + 1);

    const hasMore = merged.length > PAGE_SIZE;
    const items = merged.slice(0, PAGE_SIZE);
    const nextCursor = hasMore ? items[items.length - 1].createdAt?.toISOString() : null;

    return res.json({ items, nextCursor });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

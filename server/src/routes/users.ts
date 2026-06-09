import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { and, asc, desc, eq, isNull, lt, sql } from 'drizzle-orm';
import { db } from '../db';
import {
  users,
  follows,
  notifications,
  notificationPreferences,
  posts,
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

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(72),
});

const updatePreferencesSchema = z
  .object({
    notifyFollow: z.boolean(),
    notifyLike: z.boolean(),
    notifyComment: z.boolean(),
    notifyRepost: z.boolean(),
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

// UC-06 Alterar senha
usersRouter.patch('/me/password', async (req: AuthRequest, res) => {
  const parse = changePasswordSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const { currentPassword, newPassword } = parse.data;

  try {
    const [account] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(and(eq(users.id, req.userId!), isNull(users.deletedAt)))
      .limit(1);

    if (!account || !(await bcrypt.compare(currentPassword, account.passwordHash))) {
      return res.status(401).json({ message: 'Senha atual incorreta' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db
      .update(users)
      .set({ passwordHash })
      .where(and(eq(users.id, req.userId!), isNull(users.deletedAt)));

    return res.json({ message: 'Senha alterada com sucesso' });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-06 Buscar preferências de notificação
usersRouter.get('/me/preferences', async (req: AuthRequest, res) => {
  try {
    const [prefs] = await db
      .select({
        notifyFollow: notificationPreferences.notifyFollow,
        notifyLike: notificationPreferences.notifyLike,
        notifyComment: notificationPreferences.notifyComment,
        notifyRepost: notificationPreferences.notifyRepost,
      })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.userId!))
      .limit(1);

    if (!prefs) return res.status(404).json({ message: 'Preferências não encontradas' });
    return res.json(prefs);
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

// UC-06 Atualizar preferências de notificação
usersRouter.patch('/me/preferences', async (req: AuthRequest, res) => {
  const parse = updatePreferencesSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ message: 'Dados inválidos', errors: parse.error.errors });
  }

  const data = parse.data;
  if (Object.keys(data).length === 0) {
    return res.status(400).json({ message: 'Nenhum campo para atualizar' });
  }

  try {
    await db
      .update(notificationPreferences)
      .set(data)
      .where(eq(notificationPreferences.userId, req.userId!));

    const [prefs] = await db
      .select({
        notifyFollow: notificationPreferences.notifyFollow,
        notifyLike: notificationPreferences.notifyLike,
        notifyComment: notificationPreferences.notifyComment,
        notifyRepost: notificationPreferences.notifyRepost,
      })
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, req.userId!))
      .limit(1);

    return res.json(prefs);
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

async function listFollowRelation(
  req: AuthRequest,
  res: any,
  direction: 'followers' | 'following',
) {
  const param = req.params.userId as string;
  const page = Math.max(1, parseInt(req.query.page as string) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit as string) || 20));
  const offset = (page - 1) * limit;

  try {
    const targetId = await resolveActiveUserId(param);
    if (!targetId) return res.status(404).json({ message: 'Usuário não encontrado' });

    const joinCondition =
      direction === 'followers'
        ? and(eq(follows.followerId, users.id), eq(follows.followedId, targetId))
        : and(eq(follows.followedId, users.id), eq(follows.followerId, targetId));

    const rows = await db
      .select(userPublicFields(req.userId!))
      .from(users)
      .innerJoin(follows, joinCondition)
      .where(isNull(users.deletedAt))
      .orderBy(asc(follows.createdAt))
      .limit(limit)
      .offset(offset);

    return res.json(rows.map((row) => ({ ...row, isMe: row.id === req.userId })));
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
}

// UC-10 Listar seguidores
usersRouter.get('/:userId/followers', (req: AuthRequest, res) =>
  listFollowRelation(req, res, 'followers'),
);

// UC-10 Listar seguindo
usersRouter.get('/:userId/following', (req: AuthRequest, res) =>
  listFollowRelation(req, res, 'following'),
);

// UC-04 Posts de um usuário específico
usersRouter.get('/:userId/posts', async (req: AuthRequest, res) => {
  const param = req.params.userId as string;
  const cursor = req.query.cursor as string | undefined;
  const PAGE_SIZE = 20;

  try {
    const targetId = await resolveActiveUserId(param);
    if (!targetId) return res.status(404).json({ message: 'Usuário não encontrado' });

    const userId = req.userId ?? '00000000-0000-0000-0000-000000000000';
    const conditions: any[] = [
      eq(posts.authorId, targetId),
      isNull(posts.deletedAt),
      isNull(posts.hiddenAt),
    ];
    if (cursor) conditions.push(lt(posts.createdAt, new Date(cursor)));

    const rows = await db
      .select({
        id: posts.id,
        authorId: posts.authorId,
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
        likedByMe: sql<boolean>`EXISTS(SELECT 1 FROM post_likes WHERE post_id = ${posts.id} AND user_id = ${userId}::uuid)`,
        commentsCount: sql<number>`(SELECT COUNT(*) FROM comments WHERE post_id = ${posts.id} AND deleted_at IS NULL)::int`,
      })
      .from(posts)
      .innerJoin(users, and(eq(posts.authorId, users.id), isNull(users.deletedAt)))
      .where(and(...conditions))
      .orderBy(desc(posts.createdAt))
      .limit(PAGE_SIZE + 1);

    const hasMore = rows.length > PAGE_SIZE;
    const items = rows.slice(0, PAGE_SIZE);
    return res.json({
      items,
      nextCursor: hasMore ? items[items.length - 1].createdAt?.toISOString() : null,
    });
  } catch {
    return res.status(500).json({ message: 'Erro interno' });
  }
});

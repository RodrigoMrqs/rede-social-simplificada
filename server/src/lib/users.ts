import { and, eq, isNull, sql } from 'drizzle-orm';
import { db } from '../db';
import { users } from '../../../db/schema';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}

/**
 * Campos públicos do perfil (UC-04), no formato esperado pelo tipo `User`
 * do frontend, acrescido de `isFollowing`/`isMe` por conveniência da tela
 * de perfil. `viewerId` é o usuário autenticado que está visualizando.
 */
export function userPublicFields(viewerId: string) {
  return {
    id: users.id,
    username: users.username,
    displayName: users.displayName,
    bio: users.bio,
    avatarUrl: users.avatarUrl,
    coverUrl: users.coverUrl,
    isPrivate: users.isPrivate,
    createdAt: users.createdAt,
    deletedAt: users.deletedAt,
    followersCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE followed_id = ${users.id})::int`,
    followingCount: sql<number>`(SELECT COUNT(*) FROM follows WHERE follower_id = ${users.id})::int`,
    isFollowing: sql<boolean>`EXISTS(SELECT 1 FROM follows WHERE follower_id = ${viewerId}::uuid AND followed_id = ${users.id})`,
  };
}

export type PublicUser = Awaited<ReturnType<typeof fetchActiveUser>>;

/**
 * Busca um usuário ativo (`deleted_at IS NULL`) por id ou username e o
 * devolve já no formato público, com `isMe` calculado para o `viewerId`.
 * Retorna `null` se não existir ou estiver deletado.
 */
export async function fetchActiveUser(
  viewerId: string,
  by: { id: string } | { username: string },
) {
  const match =
    'id' in by ? eq(users.id, by.id) : eq(users.username, by.username);

  const [row] = await db
    .select(userPublicFields(viewerId))
    .from(users)
    .where(and(match, isNull(users.deletedAt)))
    .limit(1);

  if (!row) return null;
  return { ...row, isMe: row.id === viewerId };
}

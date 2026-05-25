import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const { mockDb, push, clear, UID, OTHER } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const OTHER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const q: unknown[][] = [];

  function chain(r: unknown[] = []): any {
    const p = Promise.resolve(r);
    const o: any = {};
    for (const m of ['from','where','innerJoin','leftJoin','orderBy','limit','offset','set','values','returning'])
      o[m] = () => o;
    o.then = p.then.bind(p);
    o.catch = p.catch.bind(p);
    o.finally = p.finally.bind(p);
    return o;
  }

  return {
    mockDb: { select: () => chain(q.shift()), insert: () => chain(q.shift()), update: () => chain(q.shift()), delete: () => chain(q.shift()) },
    push: (...rs: unknown[][]) => q.push(...rs),
    clear: () => { q.length = 0; },
    UID,
    OTHER,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const follower = { id: OTHER, username: 'follower', displayName: 'Follower', avatarUrl: null };
const following = { id: OTHER, username: 'following', displayName: 'Following', avatarUrl: null };

beforeEach(() => clear());

describe('UC-10 — GET /users/:userId/followers', () => {
  it('retorna lista de seguidores com 200', async () => {
    push([{ id: OTHER }], [follower]);

    const res = await request(app).get(`/users/${OTHER}/followers`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ ...follower, isMe: false }]);
  });

  it('retorna lista vazia quando usuário não tem seguidores', async () => {
    push([{ id: OTHER }], []);

    const res = await request(app).get(`/users/${OTHER}/followers`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('retorna 404 quando usuário não existe', async () => {
    push([]);

    const res = await request(app).get(`/users/${OTHER}/followers`);

    expect(res.status).toBe(404);
  });

  it('marca isMe = true quando o seguidor é o próprio usuário autenticado', async () => {
    push([{ id: OTHER }], [{ ...follower, id: UID }]);

    const res = await request(app).get(`/users/${OTHER}/followers`);

    expect(res.status).toBe(200);
    expect(res.body[0].isMe).toBe(true);
  });
});

describe('UC-10 — GET /users/:userId/following', () => {
  it('retorna lista de seguidos com 200', async () => {
    push([{ id: OTHER }], [following]);

    const res = await request(app).get(`/users/${OTHER}/following`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ ...following, isMe: false }]);
  });

  it('retorna 404 quando usuário não existe', async () => {
    push([]);

    const res = await request(app).get(`/users/${OTHER}/following`);

    expect(res.status).toBe(404);
  });

  it('retorna lista vazia quando usuário não segue ninguém', async () => {
    push([{ id: OTHER }], []);

    const res = await request(app).get(`/users/${OTHER}/following`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });
});

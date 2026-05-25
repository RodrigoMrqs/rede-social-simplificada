import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const { mockDb, push, clear, UID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
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
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const userResult = { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', username: 'noam', displayName: 'Noam' };
const postResult = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc', content: 'post de teste', authorId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' };

beforeEach(() => clear());

describe('UC-18 — GET /search', () => {
  it('retorna 400 quando q não é fornecido', async () => {
    const res = await request(app).get('/search');

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/q/);
  });

  it('retorna usuários e posts quando type não é especificado', async () => {
    push([userResult], [postResult]);

    const res = await request(app).get('/search?q=noam');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.users[0].username).toBe('noam');
  });

  it('retorna apenas usuários quando type=users', async () => {
    push([userResult]);

    const res = await request(app).get('/search?q=noam&type=users');

    expect(res.status).toBe(200);
    expect(res.body.users).toHaveLength(1);
    expect(res.body.posts).toBeUndefined();
  });

  it('retorna apenas posts quando type=posts', async () => {
    push([postResult]);

    const res = await request(app).get('/search?q=teste&type=posts');

    expect(res.status).toBe(200);
    expect(res.body.posts).toHaveLength(1);
    expect(res.body.users).toBeUndefined();
  });

  it('retorna listas vazias quando não há resultados', async () => {
    push([], []);

    const res = await request(app).get('/search?q=xyzabcnaoexiste');

    expect(res.status).toBe(200);
    expect(res.body.users).toEqual([]);
    expect(res.body.posts).toEqual([]);
  });
});

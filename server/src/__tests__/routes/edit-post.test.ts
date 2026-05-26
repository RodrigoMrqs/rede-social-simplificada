import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';

const { mockDb, push, clear, UID, OTHER, POST_ID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const OTHER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const POST_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
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
    UID, OTHER, POST_ID,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const post = { id: POST_ID, authorId: UID, content: 'Original', deletedAt: null };

beforeEach(() => clear());

describe('UC-11 — PATCH /posts/:postId', () => {
  it('edita post e retorna 200 com conteúdo atualizado', async () => {
    const updated = { ...post, content: 'Editado' };
    push([post], [updated]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Editado');
  });

  it('retorna 403 quando usuário não é o autor', async () => {
    push([{ ...post, authorId: OTHER }]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(403);
  });

  it('retorna 404 quando post não existe', async () => {
    push([]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(404);
  });

  it('retorna 400 quando content está vazio', async () => {
    const res = await request(app)
      .patch(`/posts/${POST_ID}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando content excede 280 caracteres', async () => {
    const res = await request(app)
      .patch(`/posts/${POST_ID}`)
      .send({ content: 'a'.repeat(281) });

    expect(res.status).toBe(400);
  });
});

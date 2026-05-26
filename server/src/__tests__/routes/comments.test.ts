import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { chain } from '../helpers/testChain';

const { mockDb, push, clear, UID, OTHER, POST_ID, COMMENT_ID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const OTHER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const POST_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const COMMENT_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const q: unknown[][] = [];

  return {
    mockDb: { select: () => chain(q.shift()), insert: () => chain(q.shift()), update: () => chain(q.shift()), delete: () => chain(q.shift()) },
    push: (...rs: unknown[][]) => q.push(...rs),
    clear: () => { q.length = 0; },
    UID, OTHER, POST_ID, COMMENT_ID,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const post = { id: POST_ID, authorId: UID, content: 'Post', deletedAt: null, hiddenAt: null };
const comment = { id: COMMENT_ID, postId: POST_ID, authorId: UID, content: 'Comentário', deletedAt: null };

beforeEach(() => clear());

describe('UC-14 — POST /posts/:postId/comments', () => {
  it('cria comentário e retorna 201', async () => {
    push([post], [comment]);

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: 'Comentário' });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(COMMENT_ID);
  });

  it('retorna 400 quando content está vazio', async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando content excede 280 caracteres', async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: 'a'.repeat(281) });

    expect(res.status).toBe(400);
  });

  it('retorna 404 quando post não existe', async () => {
    push([]);

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: 'Comentário' });

    expect(res.status).toBe(404);
  });

  it('cria notificação quando autor do post é diferente do comentador', async () => {
    const postByOther = { ...post, authorId: OTHER };
    push([postByOther], [comment], [{ notifyComment: true }], []);

    const res = await request(app)
      .post(`/posts/${POST_ID}/comments`)
      .send({ content: 'Comentário' });

    expect(res.status).toBe(201);
  });
});

describe('UC-23 — PATCH /posts/:postId/comments/:commentId', () => {
  it('edita comentário e retorna 200', async () => {
    const updated = { ...comment, content: 'Editado' };
    push([comment], [updated]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Editado');
  });

  it('retorna 403 quando usuário não é o autor', async () => {
    push([{ ...comment, authorId: OTHER }]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(403);
  });

  it('retorna 404 quando comentário não existe', async () => {
    push([]);

    const res = await request(app)
      .patch(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(404);
  });

  it('retorna 400 quando content é inválido', async () => {
    const res = await request(app)
      .patch(`/posts/${POST_ID}/comments/${COMMENT_ID}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });
});

describe('UC-24 — DELETE /posts/:postId/comments/:commentId', () => {
  it('exclui comentário e retorna 204', async () => {
    push([comment], []);

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(204);
  });

  it('retorna 403 quando usuário não é o autor', async () => {
    push([{ ...comment, authorId: OTHER }]);

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(403);
  });

  it('retorna 404 quando comentário não existe', async () => {
    push([]);

    const res = await request(app)
      .delete(`/posts/${POST_ID}/comments/${COMMENT_ID}`);

    expect(res.status).toBe(404);
  });
});

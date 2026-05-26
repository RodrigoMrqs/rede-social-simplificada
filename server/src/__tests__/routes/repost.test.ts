import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { chain } from '../helpers/testChain';

const { mockDb, push, clear, UID, POST_ID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const POST_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const q: unknown[][] = [];

  return {
    mockDb: { select: () => chain(q.shift()), insert: () => chain(q.shift()), update: () => chain(q.shift()), delete: () => chain(q.shift()) },
    push: (...rs: unknown[][]) => q.push(...rs),
    clear: () => { q.length = 0; },
    UID, POST_ID,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const originalPost = { id: POST_ID, authorId: UID, content: 'Original', deletedAt: null, hiddenAt: null };

beforeEach(() => clear());

describe('UC-15 — POST /posts/:postId/repost', () => {
  it('repost simples (sem comentário) retorna 201', async () => {
    const repost = { id: 'new-id', authorId: UID, content: '', repostOfId: POST_ID, isRepostSimple: true };
    push([originalPost], [repost]);

    const res = await request(app)
      .post(`/posts/${POST_ID}/repost`)
      .send({});

    expect(res.status).toBe(201);
    expect(res.body.isRepostSimple).toBe(true);
    expect(res.body.repostOfId).toBe(POST_ID);
  });

  it('repost com comentário (quote) retorna 201', async () => {
    const repost = { id: 'new-id', authorId: UID, content: 'Minha opinião', repostOfId: POST_ID, isRepostSimple: false };
    push([originalPost], [repost]);

    const res = await request(app)
      .post(`/posts/${POST_ID}/repost`)
      .send({ content: 'Minha opinião' });

    expect(res.status).toBe(201);
    expect(res.body.isRepostSimple).toBe(false);
    expect(res.body.content).toBe('Minha opinião');
  });

  it('retorna 404 quando post original não existe', async () => {
    push([]);

    const res = await request(app)
      .post(`/posts/${POST_ID}/repost`)
      .send({});

    expect(res.status).toBe(404);
  });

  it('retorna 400 quando comentário excede 280 caracteres', async () => {
    const res = await request(app)
      .post(`/posts/${POST_ID}/repost`)
      .send({ content: 'a'.repeat(281) });

    expect(res.status).toBe(400);
  });

  it('repost de post de outro usuário dispara notificação', async () => {
    const postByOther = { ...originalPost, authorId: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb' };
    const repost = { id: 'new-id', authorId: UID, content: '', repostOfId: POST_ID, isRepostSimple: true };
    push([postByOther], [repost], [{ notifyRepost: true }], []);

    const res = await request(app)
      .post(`/posts/${POST_ID}/repost`)
      .send({});

    expect(res.status).toBe(201);
  });
});

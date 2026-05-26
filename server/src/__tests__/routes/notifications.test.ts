import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { chain } from '../helpers/testChain';

const { mockDb, push, clear, UID, NOTIF_ID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const NOTIF_ID = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const q: unknown[][] = [];

  return {
    mockDb: { select: () => chain(q.shift()), insert: () => chain(q.shift()), update: () => chain(q.shift()), delete: () => chain(q.shift()) },
    push: (...rs: unknown[][]) => q.push(...rs),
    clear: () => { q.length = 0; },
    UID, NOTIF_ID,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const notif = {
  id: NOTIF_ID,
  type: 'like',
  postId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  commentId: null,
  createdAt: new Date().toISOString(),
  readAt: null,
  actor: { id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', username: 'outro', displayName: 'Outro', avatarUrl: null },
};

beforeEach(() => clear());

describe('UC-17 — GET /notifications', () => {
  it('retorna lista de notificações com 200', async () => {
    push([notif]);

    const res = await request(app).get('/notifications');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(NOTIF_ID);
    expect(res.body[0].type).toBe('like');
  });

  it('retorna lista vazia quando não há notificações', async () => {
    push([]);

    const res = await request(app).get('/notifications');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('aceita parâmetro de paginação', async () => {
    push([]);

    const res = await request(app).get('/notifications?page=2&limit=10');

    expect(res.status).toBe(200);
  });
});

describe('UC-17 — PATCH /notifications/:id/read', () => {
  it('marca notificação como lida e retorna { read: true }', async () => {
    push([{ id: NOTIF_ID }]);

    const res = await request(app).patch(`/notifications/${NOTIF_ID}/read`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ read: true });
  });

  it('retorna 404 quando notificação não existe ou já está lida', async () => {
    push([]);

    const res = await request(app).patch(`/notifications/${NOTIF_ID}/read`);

    expect(res.status).toBe(404);
  });
});

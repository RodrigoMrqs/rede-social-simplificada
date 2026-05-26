import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { chain } from '../helpers/testChain';

const { mockDb, push, clear, UID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const q: unknown[][] = [];

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
vi.mock('bcryptjs', () => ({
  default: {
    compare: (plain: string, hash: string) => Promise.resolve(plain === hash),
    hash: (_plain: string, _rounds: number) => Promise.resolve('hashed'),
  },
}));

import { createApp } from '../../app';
const app = createApp();

const defaultPrefs = {
  notifyFollow: true,
  notifyLike: true,
  notifyComment: true,
  notifyRepost: true,
};

beforeEach(() => clear());

describe('UC-06 — PATCH /users/me/password', () => {
  it('altera senha com sucesso e retorna 200', async () => {
    push([{ passwordHash: 'senha123' }], []);

    const res = await request(app)
      .patch('/users/me/password')
      .send({ currentPassword: 'senha123', newPassword: 'novasenha456' });

    expect(res.status).toBe(200);
    expect(res.body.message).toBeTruthy();
  });

  it('retorna 401 quando senha atual está incorreta', async () => {
    push([{ passwordHash: 'correta' }]);

    const res = await request(app)
      .patch('/users/me/password')
      .send({ currentPassword: 'errada', newPassword: 'novasenha456' });

    expect(res.status).toBe(401);
  });

  it('retorna 400 quando newPassword tem menos de 8 caracteres', async () => {
    const res = await request(app)
      .patch('/users/me/password')
      .send({ currentPassword: 'senha123', newPassword: 'curta' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando campos obrigatórios estão ausentes', async () => {
    const res = await request(app)
      .patch('/users/me/password')
      .send({ newPassword: 'novasenha456' });

    expect(res.status).toBe(400);
  });
});

describe('UC-06 — GET /users/me/preferences', () => {
  it('retorna preferências de notificação com 200', async () => {
    push([defaultPrefs]);

    const res = await request(app).get('/users/me/preferences');

    expect(res.status).toBe(200);
    expect(res.body.notifyFollow).toBe(true);
    expect(res.body.notifyLike).toBe(true);
    expect(res.body.notifyComment).toBe(true);
    expect(res.body.notifyRepost).toBe(true);
  });

  it('retorna 404 quando preferências não existem', async () => {
    push([]);

    const res = await request(app).get('/users/me/preferences');

    expect(res.status).toBe(404);
  });
});

describe('UC-06 — PATCH /users/me/preferences', () => {
  it('atualiza preferências e retorna 200 com novo estado', async () => {
    const updated = { ...defaultPrefs, notifyFollow: false };
    push([], [updated]);

    const res = await request(app)
      .patch('/users/me/preferences')
      .send({ notifyFollow: false });

    expect(res.status).toBe(200);
    expect(res.body.notifyFollow).toBe(false);
  });

  it('retorna 400 quando body está vazio', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .send({});

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando valor não é boolean', async () => {
    const res = await request(app)
      .patch('/users/me/preferences')
      .send({ notifyFollow: 'sim' });

    expect(res.status).toBe(400);
  });
});

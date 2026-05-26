import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { chain } from '../helpers/testChain';

const { mockDb, push, clear, UID, OTHER, CONV_ID, MSG_ID } = vi.hoisted(() => {
  const UID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  const OTHER = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
  const CONV_ID = 'cccccccc-cccc-cccc-cccc-cccccccccccc';
  const MSG_ID = 'dddddddd-dddd-dddd-dddd-dddddddddddd';
  const q: unknown[][] = [];

  return {
    mockDb: { select: () => chain(q.shift()), insert: () => chain(q.shift()), update: () => chain(q.shift()), delete: () => chain(q.shift()) },
    push: (...rs: unknown[][]) => q.push(...rs),
    clear: () => { q.length = 0; },
    UID, OTHER, CONV_ID, MSG_ID,
  };
});

vi.mock('../../db', () => ({ db: mockDb }));
vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
  optionalAuthMiddleware: (req: any, _: any, next: any) => { req.userId = UID; next(); },
}));

import { createApp } from '../../app';
const app = createApp();

const message = { id: MSG_ID, conversationId: CONV_ID, senderId: UID, content: 'Original', deletedAt: null };

beforeEach(() => clear());

describe('UC-27 — PATCH /messages/:conversationId/:messageId', () => {
  it('edita mensagem e retorna 200 com conteúdo atualizado', async () => {
    const updated = { ...message, content: 'Editado' };
    push([message], [updated]);

    const res = await request(app)
      .patch(`/messages/${CONV_ID}/${MSG_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(200);
    expect(res.body.content).toBe('Editado');
  });

  it('retorna 403 quando usuário não é o remetente', async () => {
    push([{ ...message, senderId: OTHER }]);

    const res = await request(app)
      .patch(`/messages/${CONV_ID}/${MSG_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(403);
  });

  it('retorna 404 quando mensagem não existe ou foi deletada', async () => {
    push([]);

    const res = await request(app)
      .patch(`/messages/${CONV_ID}/${MSG_ID}`)
      .send({ content: 'Editado' });

    expect(res.status).toBe(404);
  });

  it('retorna 400 quando content está vazio', async () => {
    const res = await request(app)
      .patch(`/messages/${CONV_ID}/${MSG_ID}`)
      .send({ content: '' });

    expect(res.status).toBe(400);
  });

  it('retorna 400 quando content excede 1000 caracteres', async () => {
    const res = await request(app)
      .patch(`/messages/${CONV_ID}/${MSG_ID}`)
      .send({ content: 'a'.repeat(1001) });

    expect(res.status).toBe(400);
  });
});

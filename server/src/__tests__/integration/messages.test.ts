import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ─── IDs de teste em formato UUID válido (necessário para validação Zod) ──────

const TEST_USER_ID = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const OTHER_USER_ID = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

// ─── Mock db ──────────────────────────────────────────────────────────────────

function buildMockDb() {
  const chain: Record<string, unknown> = {};
  const chainMethods = ['from', 'where', 'limit', 'orderBy', 'set', 'returning'];
  chainMethods.forEach((m) => {
    chain[m] = vi.fn(() => chain);
  });
  chain.then = (res: (v: unknown) => void) => Promise.resolve([]).then(res);

  return {
    select: vi.fn(() => chain),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'mock-id' }])),
      })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
    _chain: chain,
  };
}

vi.mock('../../db', () => ({ db: buildMockDb() }));

vi.mock('../../middleware/auth', () => ({
  authMiddleware: (req: any, _res: any, next: any) => {
    req.userId = TEST_USER_ID;
    next();
  },
  AuthRequest: {},
}));

import { db } from '../../db';
import { messagesRouter } from '../../routes/messages';

type MockDb = ReturnType<typeof buildMockDb>;
const mockDb = db as unknown as MockDb;

// ─── App de teste ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/messages', messagesRouter);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockConversation = {
  id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  userAId: TEST_USER_ID,
  userBId: OTHER_USER_ID,
  createdAt: new Date().toISOString(),
};

const mockMessage = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  conversationId: mockConversation.id,
  senderId: TEST_USER_ID,
  content: 'Olá!',
  readAt: null,
  deletedAt: null,
  createdAt: new Date().toISOString(),
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Cria uma chain isolada que resolve para `result` ao ser awaited. */
function makeChain(result: unknown[]) {
  const ch: Record<string, unknown> = {};
  ['from', 'where', 'limit', 'orderBy', 'set', 'returning'].forEach((m) => {
    ch[m] = vi.fn(() => ch);
  });
  ch.then = (res: (v: unknown) => void) => Promise.resolve(result).then(res);
  return ch;
}

/**
 * Redefine todas as implementações do mock após vi.resetAllMocks().
 * vi.resetAllMocks() limpa tanto o histórico quanto as filas de mockReturnValueOnce.
 */
function resetMockDb() {
  (mockDb.select as any).mockImplementation(() => mockDb._chain);
  const chainMethods = ['from', 'where', 'limit', 'orderBy', 'set', 'returning'];
  chainMethods.forEach((m) => {
    (mockDb._chain as any)[m].mockImplementation(() => mockDb._chain);
  });
  mockDb._chain.then = (res: (v: unknown) => void) => Promise.resolve([]).then(res);
  (mockDb.insert as any).mockImplementation(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(() => Promise.resolve([{ id: 'mock-id' }])),
    })),
  }));
  (mockDb.update as any).mockImplementation(() => ({
    set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })),
  }));
}

// ─── GET /messages ────────────────────────────────────────────────────────────

describe('GET /messages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-40 — retorna 200 com lista de conversas', async () => {
    mockDb._chain.then = (res: (v: unknown) => void) =>
      Promise.resolve([mockConversation]).then(res);

    const response = await request(app).get('/messages');

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body[0].id).toBe(mockConversation.id);
  });

  it('retorna 200 com array vazio quando não há conversas', async () => {
    const response = await request(app).get('/messages');
    expect(response.status).toBe(200);
    expect(response.body).toEqual([]);
  });
});

// ─── POST /messages ───────────────────────────────────────────────────────────

describe('POST /messages', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-41 — cria conversa e envia primeira mensagem, retorna 201', async () => {
    (mockDb.select as any)
      .mockReturnValueOnce(makeChain([{ id: OTHER_USER_ID }]))  // destinatário existe
      .mockReturnValueOnce(makeChain([]));                       // conversa ainda não existe

    (mockDb.insert as any).mockImplementation(() => {
      const returning = vi.fn()
        .mockResolvedValueOnce([mockConversation])  // cria conversa
        .mockResolvedValueOnce([mockMessage]);       // cria mensagem
      return { values: vi.fn(() => ({ returning })) };
    });

    const response = await request(app)
      .post('/messages')
      .send({ recipientId: OTHER_USER_ID, content: 'Olá!' });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('conversation');
    expect(response.body).toHaveProperty('message');
  });

  it('CT-42 — reutiliza conversa existente ao enviar mensagem', async () => {
    (mockDb.select as any)
      .mockReturnValueOnce(makeChain([{ id: OTHER_USER_ID }]))   // destinatário existe
      .mockReturnValueOnce(makeChain([mockConversation]));        // conversa já existe

    (mockDb.insert as any).mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn().mockResolvedValueOnce([mockMessage]),
      })),
    }));

    const response = await request(app)
      .post('/messages')
      .send({ recipientId: OTHER_USER_ID, content: 'Oi de novo!' });

    expect(response.status).toBe(201);
    expect(response.body.conversation.id).toBe(mockConversation.id);
  });

  it('CT-43 — rejeita mensagem para si mesmo e retorna 422', async () => {
    const response = await request(app)
      .post('/messages')
      .send({ recipientId: TEST_USER_ID, content: 'Oi eu mesmo' });

    expect(response.status).toBe(422);
    expect(response.body.message).toMatch(/si mesmo/i);
  });

  it('retorna 400 com body inválido', async () => {
    const response = await request(app).post('/messages').send({ content: 'sem recipientId' });
    expect(response.status).toBe(400);
  });

  it('retorna 404 quando destinatário não existe', async () => {
    const nonExistentId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
    (mockDb.select as any).mockReturnValueOnce(makeChain([]));  // usuário não encontrado

    const response = await request(app)
      .post('/messages')
      .send({ recipientId: nonExistentId, content: 'Olá!' });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/não encontrado/i);
  });
});

// ─── GET /messages/:conversationId ───────────────────────────────────────────

describe('GET /messages/:conversationId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-44 — retorna 200 com conversa e lista de mensagens', async () => {
    (mockDb.select as any)
      .mockReturnValueOnce(makeChain([mockConversation]))  // conversa encontrada
      .mockReturnValueOnce(makeChain([mockMessage]));       // mensagens da conversa

    const response = await request(app).get(`/messages/${mockConversation.id}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('conversation');
    expect(response.body).toHaveProperty('messages');
    expect(response.body.messages).toHaveLength(1);
  });

  it('CT-45 — retorna 404 quando conversa não pertence ao usuário', async () => {
    (mockDb.select as any).mockReturnValueOnce(makeChain([]));  // conversa não encontrada

    const response = await request(app).get('/messages/ffffffff-ffff-ffff-ffff-ffffffffffff');

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/não encontrada/i);
  });
});

// ─── DELETE /messages/:conversationId/:messageId ─────────────────────────────

describe('DELETE /messages/:conversationId/:messageId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-46 — deleta mensagem própria e retorna 204', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockMessage]);

    const response = await request(app).delete(
      `/messages/${mockConversation.id}/${mockMessage.id}`,
    );

    expect(response.status).toBe(204);
  });

  it('CT-47 — retorna 403 ao tentar deletar mensagem de outro usuário', async () => {
    const othersMessage = { ...mockMessage, senderId: OTHER_USER_ID };
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([othersMessage]);

    const response = await request(app).delete(
      `/messages/${mockConversation.id}/${mockMessage.id}`,
    );

    expect(response.status).toBe(403);
    expect(response.body.message).toMatch(/sem permissão/i);
  });

  it('retorna 404 quando mensagem não existe', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([]);

    const response = await request(app).delete(
      `/messages/${mockConversation.id}/ffffffff-ffff-ffff-ffff-ffffffffffff`,
    );

    expect(response.status).toBe(404);
  });
});

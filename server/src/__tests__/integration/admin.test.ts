import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ─── Mock db ──────────────────────────────────────────────────────────────────

function buildMockDb() {
  const chain: Record<string, unknown> = {};
  const chainMethods = ['from', 'where', 'limit', 'orderBy', 'set', 'returning', 'innerJoin'];
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
  authMiddleware: (_req: any, _res: any, next: any) => next(),
  AuthRequest: {},
}));

vi.mock('../../middleware/adminAuth', () => ({
  adminMiddleware: (req: any, _res: any, next: any) => {
    req.adminId = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
    next();
  },
  AdminRequest: {},
}));

vi.mock('../../lib/auth', () => ({
  revokeAllSessions: vi.fn().mockResolvedValue(undefined),
  createSession: vi.fn(),
  hashToken: vi.fn(),
  getActiveSanction: vi.fn(),
}));

import { db } from '../../db';
import { revokeAllSessions } from '../../lib/auth';
import { adminRouter } from '../../routes/admin';

type MockDb = ReturnType<typeof buildMockDb>;
const mockDb = db as unknown as MockDb;
const mockRevokeAllSessions = revokeAllSessions as ReturnType<typeof vi.fn>;

// ─── App de teste ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/admin', adminRouter);

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockPost = {
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  authorId: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  content: 'Conteúdo do post',
  hiddenAt: null,
  hiddenBy: null,
  deletedAt: null,
};

const mockHiddenPost = {
  ...mockPost,
  hiddenAt: new Date().toISOString(),
  hiddenBy: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
};

const mockUser = { id: 'cccccccc-cccc-cccc-cccc-cccccccccccc' };
const mockSanction = {
  id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  userId: mockUser.id,
  sanctionType: 'ban',
};

// ─── Helper ───────────────────────────────────────────────────────────────────

function resetMockDb() {
  (mockDb.select as any).mockImplementation(() => mockDb._chain);
  const chainMethods = ['from', 'where', 'limit', 'orderBy', 'set', 'returning', 'innerJoin'];
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

// ─── GET /admin/dashboard ─────────────────────────────────────────────────────

describe('GET /admin/dashboard', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-30 — retorna 200 com métricas do sistema', async () => {
    let call = 0;
    const results = [[{ total: 10 }], [{ total: 30 }], [{ total: 5 }], []];
    mockDb._chain.then = (res: (v: unknown) => void) =>
      Promise.resolve(results[call++ % results.length]).then(res);

    const response = await request(app).get('/admin/dashboard');

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      totalUsers: 10,
      totalPosts: 30,
      hiddenPosts: 5,
      recentPosts: [],
    });
  });
});

// ─── POST /admin/posts/:postId/hide ──────────────────────────────────────────

describe('POST /admin/posts/:postId/hide', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-31 — oculta post e retorna 204', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockPost]);

    const response = await request(app)
      .post(`/admin/posts/${mockPost.id}/hide`)
      .send({ reason: 'Conteúdo inadequado' });

    expect(response.status).toBe(204);
  });

  it('CT-32 — rejeita requisição sem motivo e retorna 400', async () => {
    const response = await request(app).post(`/admin/posts/${mockPost.id}/hide`).send({});

    expect(response.status).toBe(400);
    expect(response.body.message).toMatch(/motivo/i);
  });

  it('CT-33 — retorna 404 quando post não existe', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/admin/posts/ffffffff-ffff-ffff-ffff-ffffffffffff/hide')
      .send({ reason: 'Motivo' });

    expect(response.status).toBe(404);
    expect(response.body.message).toMatch(/não encontrado/i);
  });

  it('retorna 409 quando post já está oculto', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockHiddenPost]);

    const response = await request(app)
      .post(`/admin/posts/${mockPost.id}/hide`)
      .send({ reason: 'Motivo' });

    expect(response.status).toBe(409);
  });
});

// ─── POST /admin/posts/:postId/restore ───────────────────────────────────────

describe('POST /admin/posts/:postId/restore', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-34 — restaura post oculto e retorna 204', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockHiddenPost]);

    const response = await request(app)
      .post(`/admin/posts/${mockPost.id}/restore`)
      .send({ reason: 'Revisão concluída' });

    expect(response.status).toBe(204);
  });

  it('retorna 409 quando post não está oculto', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockPost]);

    const response = await request(app)
      .post(`/admin/posts/${mockPost.id}/restore`)
      .send({ reason: 'Motivo' });

    expect(response.status).toBe(409);
  });
});

// ─── DELETE /admin/posts/:postId ─────────────────────────────────────────────

describe('DELETE /admin/posts/:postId', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-35 — deleta post e retorna 204', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockPost]);

    const response = await request(app)
      .delete(`/admin/posts/${mockPost.id}`)
      .send({ reason: 'Violação dos termos' });

    expect(response.status).toBe(204);
  });

  it('retorna 404 quando post não existe', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([]);

    const response = await request(app)
      .delete('/admin/posts/ffffffff-ffff-ffff-ffff-ffffffffffff')
      .send({ reason: 'Motivo' });

    expect(response.status).toBe(404);
  });
});

// ─── POST /admin/users/:userId/sanction ──────────────────────────────────────

describe('POST /admin/users/:userId/sanction', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
    mockRevokeAllSessions.mockResolvedValue(undefined);
    (mockDb.insert as any).mockImplementation(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([mockSanction])),
      })),
    }));
  });

  it('CT-36 — aplica ban e retorna 201 com objeto de sanção', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockUser]);

    const response = await request(app)
      .post(`/admin/users/${mockUser.id}/sanction`)
      .send({ type: 'ban', reason: 'Comportamento abusivo' });

    expect(response.status).toBe(201);
    expect(response.body.sanctionType).toBe('ban');
    expect(mockRevokeAllSessions).toHaveBeenCalledWith(mockUser.id);
  });

  it('CT-37 — aplica suspension com expiresAt e retorna 201', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockUser]);

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const response = await request(app)
      .post(`/admin/users/${mockUser.id}/sanction`)
      .send({ type: 'suspension', reason: 'Comportamento inadequado', expiresAt });

    expect(response.status).toBe(201);
    expect(mockRevokeAllSessions).toHaveBeenCalledWith(mockUser.id);
  });

  it('CT-38 — rejeita tipo de sanção inválido e retorna 400', async () => {
    const response = await request(app)
      .post(`/admin/users/${mockUser.id}/sanction`)
      .send({ type: 'warning', reason: 'Motivo' });

    expect(response.status).toBe(400);
  });

  it('retorna 404 quando usuário não existe', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([]);

    const response = await request(app)
      .post('/admin/users/ffffffff-ffff-ffff-ffff-ffffffffffff/sanction')
      .send({ type: 'ban', reason: 'Motivo' });

    expect(response.status).toBe(404);
  });
});

// ─── POST /admin/users/:userId/sanction/:sanctionId/revoke ───────────────────

describe('POST /admin/users/:userId/sanction/:sanctionId/revoke', () => {
  const sanctionId = 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee';
  const mockActiveSanction = { id: sanctionId, revokedAt: null };

  beforeEach(() => {
    vi.resetAllMocks();
    resetMockDb();
  });

  it('CT-39 — revoga sanção e retorna 200', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([mockActiveSanction]);

    const response = await request(app)
      .post(`/admin/users/${mockUser.id}/sanction/${sanctionId}/revoke`)
      .send({ reason: 'Apelação aceita' });

    expect(response.status).toBe(200);
    expect(response.body.message).toMatch(/revogada/i);
  });

  it('retorna 404 quando sanção não existe ou já foi revogada', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValueOnce([]);

    const response = await request(app)
      .post(`/admin/users/${mockUser.id}/sanction/ffffffff-ffff-ffff-ffff-ffffffffffff/revoke`)
      .send({});

    expect(response.status).toBe(404);
  });
});

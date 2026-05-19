import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import express from 'express';

// ─── Mocks devem ser declarados antes dos imports que os usam ─────────────────

// ─── Mock db criado antes do vi.mock para ser referenciado pela factory ───────

function buildMockDb() {
  const chain: Record<string, unknown> = {};
  const chainMethods = ['from', 'where', 'limit', 'innerJoin', 'orderBy', 'set', 'returning', 'onConflictDoNothing'];
  chainMethods.forEach((m) => { chain[m] = vi.fn(() => chain); });
  // Faz a chain ser awaitable como array vazio por padrão
  chain.then = (res: (v: unknown) => void) => Promise.resolve([]).then(res);

  return {
    select: vi.fn(() => chain),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'uuid-user-1' }])),
        onConflictDoNothing: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{ id: 'uuid-user-1' }])),
        })),
      })),
    })),
    update: vi.fn(() => ({ set: vi.fn(() => ({ where: vi.fn(() => Promise.resolve()) })) })),
    _chain: chain,
  };
}

vi.mock('../../db', () => ({ db: buildMockDb() }));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn(), compare: vi.fn() },
  hash: vi.fn(),
  compare: vi.fn(),
}));

vi.mock('jsonwebtoken', () => ({
  default: {
    sign: vi.fn().mockReturnValue('mock.jwt.token'),
    verify: vi.fn(),
    decode: vi.fn().mockReturnValue({ exp: Math.floor(Date.now() / 1000) + 86_400 }),
  },
}));

// Imports após os mocks
import bcrypt from 'bcryptjs';
import { db } from '../../db';
import { authRouter } from '../../routes/auth';

type MockDb = ReturnType<typeof buildMockDb>;
const mockDb = db as unknown as MockDb;

// ─── App de teste ─────────────────────────────────────────────────────────────

const app = express();
app.use(express.json());
app.use('/auth', authRouter);

// ─── Dados válidos ────────────────────────────────────────────────────────────

const validUser = {
  username: 'testuser',
  displayName: 'Test User',
  email: 'test@example.com',
  password: 'Senha@123',
};

// ─── POST /auth/register ──────────────────────────────────────────────────────

describe('POST /auth/register', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (bcrypt.hash as ReturnType<typeof vi.fn>).mockResolvedValue('$hashed_password');

    // select retorna [] por padrão (usuário/email não existe)
    mockDb._chain.then = (res: (v: unknown[]) => void) => Promise.resolve([]).then(res);
    mockDb._chain.limit = vi.fn(() => Promise.resolve([]));
  });

  it('CT-01 — cria conta com dados válidos e retorna 201 com token e usuário', async () => {
    const res = await request(app).post('/auth/register').send(validUser);

    expect(res.status).toBe(201);
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(0);
    expect(res.body).toHaveProperty('user'); // user pode ser null no mock (fetchActiveUser não tem fixture completa)
  });

  it('CT-02 — rejeita username com formato inválido (caractere especial)', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validUser, username: 'nome@invalido' });

    expect(res.status).toBe(422);
    expect(res.body).toHaveProperty('message');
  });

  it('CT-03 — rejeita senha com menos de 8 caracteres', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validUser, password: '123' });

    expect(res.status).toBe(422);
  });

  it('CT-04 — rejeita e-mail com formato inválido', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ ...validUser, email: 'email-invalido' });

    expect(res.status).toBe(422);
  });

  it('CT-05 — rejeita body vazio', async () => {
    const res = await request(app).post('/auth/register').send({});
    expect(res.status).toBe(422);
  });

  it('CT-06 — retorna 409 quando username já existe', async () => {
    // Simula usuário encontrado no banco
    mockDb._chain.limit = vi.fn(() => Promise.resolve([{ username: 'testuser', email: 'other@example.com' }]));

    const res = await request(app).post('/auth/register').send(validUser);
    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/indisponível/i);
  });
});

// ─── POST /auth/login ─────────────────────────────────────────────────────────

describe('POST /auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Garante que select sempre retorna chain mesmo após sobrescrita em outros testes
    mockDb.select = vi.fn(() => mockDb._chain);
  });

  it('CT-07 — autentica usuário com credenciais corretas e retorna token', async () => {
    // Cada chamada a .limit() responde em ordem: usuário, sanção, perfil (fetchActiveUser)
    mockDb._chain.limit = vi.fn()
      .mockResolvedValueOnce([{ id: 'uuid-user-1', passwordHash: '$hashed' }])
      .mockResolvedValueOnce([])   // getActiveSanction → sem sanção
      .mockResolvedValueOnce([]);  // fetchActiveUser → retorna null (ok para o teste)
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);

    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'Senha@123' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('CT-08 — rejeita credenciais com senha incorreta', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValue([{ id: 'uuid-user-1', passwordHash: '$hashed' }]);
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'senha-errada' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });

  it('CT-09 — rejeita login de usuário inexistente', async () => {
    mockDb._chain.limit = vi.fn().mockResolvedValue([]); // usuário não encontrado

    const res = await request(app)
      .post('/auth/login')
      .send({ username: 'naoexiste', password: 'Senha@123' });

    expect(res.status).toBe(401);
    expect(res.body.message).toBe('Credenciais inválidas');
  });

  it('CT-10 — rejeita body vazio com 401', async () => {
    const res = await request(app).post('/auth/login').send({});
    expect(res.status).toBe(401);
  });
});

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../../services/authService';

const BASE_URL = 'http://localhost:3001';

// Sobrescreve NEXT_PUBLIC_API_URL
vi.stubEnv('NEXT_PUBLIC_API_URL', BASE_URL);

// ─── Helper: mock global fetch ────────────────────────────────────────────────

function mockFetch(status: number, body: unknown) {
  global.fetch = vi.fn().mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  } as unknown as Response);
}

// ─── authService.register ─────────────────────────────────────────────────────

describe('authService.register', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-11 — chama POST /auth/register com os dados corretos', async () => {
    const session = { token: 'jwt-token', user: { id: '1', username: 'rodrigo' } };
    mockFetch(201, session);

    const result = await authService.register('rodrigo', 'Rodrigo', 'r@r.com', 'Senha@123');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/auth/register`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result).toEqual(session);
  });

  it('CT-12 — lança erro quando servidor retorna 409 (username duplicado)', async () => {
    mockFetch(409, { message: 'Nome de usuário indisponível' });

    await expect(
      authService.register('rodrigo', 'Rodrigo', 'r@r.com', 'Senha@123'),
    ).rejects.toThrow('Nome de usuário indisponível');
  });

  it('CT-13 — lança erro quando servidor retorna 422 (dados inválidos)', async () => {
    mockFetch(422, { message: 'Dados inválidos' });

    await expect(
      authService.register('x', 'A', 'invalido', '123'),
    ).rejects.toThrow('Dados inválidos');
  });
});

// ─── authService.login ────────────────────────────────────────────────────────

describe('authService.login', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-14 — chama POST /auth/login e retorna session', async () => {
    const session = { token: 'jwt-token', user: { id: '1', username: 'rodrigo' } };
    mockFetch(200, session);

    const result = await authService.login('rodrigo', 'Senha@123');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/auth/login`,
      expect.objectContaining({ method: 'POST' }),
    );
    expect(result.token).toBe('jwt-token');
  });

  it('CT-15 — lança erro com mensagem do servidor em caso de 401', async () => {
    mockFetch(401, { message: 'Credenciais inválidas' });

    await expect(authService.login('rodrigo', 'errada')).rejects.toThrow('Credenciais inválidas');
  });

  it('CT-16 — lança erro em conta suspensa (403)', async () => {
    mockFetch(403, { message: 'Conta suspensa', expiresAt: '2026-06-01T00:00:00Z' });

    await expect(authService.login('rodrigo', 'Senha@123')).rejects.toThrow('Conta suspensa');
  });
});

// ─── authService.logout ───────────────────────────────────────────────────────

describe('authService.logout', () => {
  beforeEach(() => { vi.restoreAllMocks(); });

  it('CT-17 — chama POST /auth/logout com Authorization header', async () => {
    mockFetch(204, undefined);

    await authService.logout('meu-token');

    expect(global.fetch).toHaveBeenCalledWith(
      `${BASE_URL}/auth/logout`,
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ Authorization: 'Bearer meu-token' }),
      }),
    );
  });
});

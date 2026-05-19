import { describe, it, expect, vi } from 'vitest';

vi.mock('../../db', () => ({ db: {} }));
import {
  usernameSchema,
  postContentSchema,
  passwordSchema,
  registerSchema,
  loginSchema,
  isBanActive,
  isSuspensionActive,
} from '../../lib/validation';
import { isUniqueViolation, pgErrorCode } from '../../lib/dbError';
import { hashToken } from '../../lib/auth';

// ─── Username ─────────────────────────────────────────────────────────────────

describe('usernameSchema', () => {
  it('aceita username válido com letras, números e underscore', () => {
    expect(usernameSchema.safeParse('rodrigo_01').success).toBe(true);
  });

  it('rejeita username com menos de 3 caracteres', () => {
    expect(usernameSchema.safeParse('ab').success).toBe(false);
  });

  it('rejeita username com mais de 30 caracteres', () => {
    expect(usernameSchema.safeParse('a'.repeat(31)).success).toBe(false);
  });

  it('rejeita username com espaços', () => {
    expect(usernameSchema.safeParse('nome invalido').success).toBe(false);
  });

  it('rejeita username com caracteres especiais', () => {
    expect(usernameSchema.safeParse('nome@123').success).toBe(false);
  });

  it('aceita exatamente 3 caracteres', () => {
    expect(usernameSchema.safeParse('abc').success).toBe(true);
  });

  it('aceita exatamente 30 caracteres', () => {
    expect(usernameSchema.safeParse('a'.repeat(30)).success).toBe(true);
  });
});

// ─── Conteúdo de post (280 chars) ─────────────────────────────────────────────

describe('postContentSchema', () => {
  it('aceita post com até 280 caracteres', () => {
    expect(postContentSchema.safeParse('Olá mundo!').success).toBe(true);
  });

  it('aceita post com exatamente 280 caracteres', () => {
    expect(postContentSchema.safeParse('a'.repeat(280)).success).toBe(true);
  });

  it('rejeita post com 281 caracteres', () => {
    expect(postContentSchema.safeParse('a'.repeat(281)).success).toBe(false);
  });

  it('rejeita post vazio', () => {
    expect(postContentSchema.safeParse('').success).toBe(false);
  });
});

// ─── Senha ────────────────────────────────────────────────────────────────────

describe('passwordSchema', () => {
  it('aceita senha com 8 caracteres', () => {
    expect(passwordSchema.safeParse('Senha123').success).toBe(true);
  });

  it('rejeita senha com menos de 8 caracteres', () => {
    expect(passwordSchema.safeParse('curta').success).toBe(false);
  });

  it('rejeita senha com mais de 72 caracteres', () => {
    expect(passwordSchema.safeParse('a'.repeat(73)).success).toBe(false);
  });
});

// ─── Regras de sanção (ban / suspension) ──────────────────────────────────────

describe('isBanActive', () => {
  it('retorna true para ban sem revokedAt', () => {
    expect(isBanActive({ sanctionType: 'ban', expiresAt: null, revokedAt: null })).toBe(true);
  });

  it('retorna false para ban revogado', () => {
    expect(isBanActive({ sanctionType: 'ban', expiresAt: null, revokedAt: new Date() })).toBe(false);
  });

  it('retorna false para suspension', () => {
    expect(isBanActive({ sanctionType: 'suspension', expiresAt: new Date(), revokedAt: null })).toBe(false);
  });
});

describe('isSuspensionActive', () => {
  it('retorna true para suspension ativa no futuro', () => {
    const futureDate = new Date(Date.now() + 60_000);
    expect(isSuspensionActive({ sanctionType: 'suspension', expiresAt: futureDate, revokedAt: null })).toBe(true);
  });

  it('retorna false para suspension expirada', () => {
    const pastDate = new Date(Date.now() - 60_000);
    expect(isSuspensionActive({ sanctionType: 'suspension', expiresAt: pastDate, revokedAt: null })).toBe(false);
  });

  it('retorna false para suspension revogada', () => {
    const futureDate = new Date(Date.now() + 60_000);
    expect(isSuspensionActive({ sanctionType: 'suspension', expiresAt: futureDate, revokedAt: new Date() })).toBe(false);
  });

  it('retorna false para ban (não é suspension)', () => {
    expect(isSuspensionActive({ sanctionType: 'ban', expiresAt: null, revokedAt: null })).toBe(false);
  });
});

// ─── registerSchema e loginSchema (schemas compostos) ────────────────────────

describe('registerSchema', () => {
  it('aceita payload completo e válido', () => {
    expect(registerSchema.safeParse({
      username: 'rodrigo_01',
      displayName: 'Rodrigo',
      email: 'r@example.com',
      password: 'Senha@123',
    }).success).toBe(true);
  });

  it('rejeita quando qualquer campo obrigatório está ausente', () => {
    expect(registerSchema.safeParse({ username: 'rodrigo_01' }).success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('aceita username e password preenchidos', () => {
    expect(loginSchema.safeParse({ username: 'rodrigo_01', password: 'qualquer' }).success).toBe(true);
  });

  it('rejeita campos vazios', () => {
    expect(loginSchema.safeParse({ username: '', password: '' }).success).toBe(false);
  });
});

// ─── isUniqueViolation ────────────────────────────────────────────────────────

describe('isUniqueViolation', () => {
  it('detecta violação pelo code direto', () => {
    expect(isUniqueViolation({ code: '23505' })).toBe(true);
  });

  it('detecta violação pelo cause.code (driver Neon HTTP)', () => {
    expect(isUniqueViolation({ cause: { code: '23505' } })).toBe(true);
  });

  it('retorna false para outros erros', () => {
    expect(isUniqueViolation({ code: '23502' })).toBe(false);
  });

  it('retorna false para null', () => {
    expect(isUniqueViolation(null)).toBe(false);
  });
});

// ─── hashToken ────────────────────────────────────────────────────────────────

describe('hashToken', () => {
  it('retorna string hexadecimal de 64 chars (SHA-256)', () => {
    const hash = hashToken('meu.jwt.token');
    expect(hash).toHaveLength(64);
    expect(hash).toMatch(/^[0-9a-f]+$/);
  });

  it('é determinístico — mesmo token gera mesmo hash', () => {
    const token = 'token.de.teste';
    expect(hashToken(token)).toBe(hashToken(token));
  });

  it('tokens diferentes geram hashes diferentes', () => {
    expect(hashToken('token-a')).not.toBe(hashToken('token-b'));
  });
});

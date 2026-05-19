import { z } from 'zod';

export const usernameSchema = z
  .string()
  .regex(/^[a-zA-Z0-9_]{3,30}$/, 'Nome de usuário deve ter 3–30 caracteres alfanuméricos ou _');

export const postContentSchema = z
  .string()
  .min(1, 'Conteúdo não pode ser vazio')
  .max(280, 'Conteúdo não pode exceder 280 caracteres');

export const passwordSchema = z
  .string()
  .min(8, 'Senha deve ter no mínimo 8 caracteres')
  .max(72, 'Senha deve ter no máximo 72 caracteres');

export const registerSchema = z.object({
  username: usernameSchema,
  displayName: z.string().trim().min(1).max(50),
  email: z.string().email().max(255),
  password: passwordSchema,
});

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export type SanctionLike = {
  sanctionType: string;
  expiresAt: Date | null;
  revokedAt: Date | null;
};

export function isBanActive(s: SanctionLike): boolean {
  return s.sanctionType === 'ban' && s.revokedAt === null;
}

export function isSuspensionActive(s: SanctionLike): boolean {
  return (
    s.sanctionType === 'suspension' &&
    s.revokedAt === null &&
    s.expiresAt !== null &&
    new Date(s.expiresAt) > new Date()
  );
}

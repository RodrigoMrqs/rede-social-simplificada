/**
 * O driver `@neondatabase/serverless` (via Drizzle neon-http) embrulha o erro
 * do Postgres: o `code` SQLSTATE original fica em `error.cause.code`, não em
 * `error.code`. Este helper cobre ambos os formatos.
 */
export function pgErrorCode(e: unknown): string | undefined {
  const err = e as { code?: string; cause?: { code?: string } } | null;
  return err?.code ?? err?.cause?.code;
}

/** Violação de constraint UNIQUE / PRIMARY KEY (SQLSTATE 23505). */
export function isUniqueViolation(e: unknown): boolean {
  return pgErrorCode(e) === '23505';
}

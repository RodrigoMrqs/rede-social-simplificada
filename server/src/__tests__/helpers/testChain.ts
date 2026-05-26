/**
 * Cria um objeto que simula uma query Drizzle:
 * todos os métodos de encadeamento retornam o próprio objeto (fluent),
 * e o objeto é awaitable resolvendo para `result`.
 */
export function chain(result: unknown[] = []): any {
  const p = Promise.resolve(result);
  const o: any = {};
  for (const m of [
    'from', 'where', 'innerJoin', 'leftJoin', 'orderBy',
    'limit', 'offset', 'set', 'values', 'returning',
  ]) {
    o[m] = () => o;
  }
  o.then = p.then.bind(p);
  o.catch = p.catch.bind(p);
  o.finally = p.finally.bind(p);
  return o;
}

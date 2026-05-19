import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurado em server/.env');

  const sql = neon(url);

  const info = await sql`SELECT current_database() AS db, now() AS now`;
  const tables = await sql`
    SELECT count(*)::int AS n
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `;

  console.log(
    `✔ Conexão OK — banco="${info[0].db}", hora=${info[0].now}, ` +
      `tabelas públicas=${tables[0].n}`,
  );
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`✖ Conexão falhou: ${msg}`);
  process.exit(1);
});

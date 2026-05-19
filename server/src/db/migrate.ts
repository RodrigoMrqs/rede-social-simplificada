import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import ws from 'ws';
import { neonConfig, Client } from '@neondatabase/serverless';

// O driver serverless precisa de um WebSocket em ambiente Node para o
// protocolo "simple query" (várias instruções e blocos $$...$$ por execução).
neonConfig.webSocketConstructor = ws as unknown as typeof WebSocket;

async function main(): Promise<void> {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL não configurado em server/.env');

  const file = process.argv[2] ?? '0001_initial_migration.sql';
  const migrationPath = path.resolve(__dirname, '../../../db/migrations', file);
  const sqlText = fs.readFileSync(migrationPath, 'utf8');

  const client = new Client(url);
  await client.connect();

  try {
    await client.query('BEGIN');
    await client.query(sqlText);
    await client.query('COMMIT');
    console.log(`✔ Migration aplicada com sucesso: ${file}`);
  } catch (e) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw e;
  } finally {
    await client.end();
  }
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`✖ Falha na migration: ${msg}`);
  process.exit(1);
});

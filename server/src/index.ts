import 'dotenv/config';
import { createApp } from './app';
import { db } from './db';
import { sql } from 'drizzle-orm';

const app = createApp();
const PORT = process.env.PORT ?? 3001;

app.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
  // Warm up Neon connection pool on startup to avoid cold-start latency in first requests
  try {
    await db.execute(sql`SELECT 1`);
    console.log('DB connection warmed up');
  } catch (e) {
    console.warn('DB warmup failed:', e);
  }
});

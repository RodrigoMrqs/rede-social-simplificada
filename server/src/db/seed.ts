import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '.';
import { users, posts, notificationPreferences } from '../../../db/schema';
import { fetchFakerUsers, fetchFakerTexts } from '../lib/fakerApi';

function sanitizeUsername(raw: string, id: number): string {
  const base = raw
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 24);
  const safe = base.length >= 3 ? base : `user_${id}`;
  return `${safe}_${String(id).padStart(3, '0')}`;
}

async function seed() {
  console.log('Buscando dados da FakerAPI...');

  const [fakerUsers, fakerTexts] = await Promise.all([
    fetchFakerUsers(10),
    fetchFakerTexts(30),
  ]);

  console.log(`${fakerUsers.length} usuários e ${fakerTexts.length} textos encontrados.`);

  const passwordHash = await bcrypt.hash('Seed@12345', 10);
  const userIds: string[] = [];

  console.log('Criando usuários...');
  for (const fu of fakerUsers) {
    const username = sanitizeUsername(fu.username, fu.id);
    const email = `seed_${fu.id}_${fu.uuid.slice(-6)}@example.com`;

    try {
      const [created] = await db
        .insert(users)
        .values({
          username,
          email,
          displayName: username.replace(/_\d+$/, '').replace(/_/g, ' '),
          passwordHash,
          avatarUrl: fu.image,
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      if (created) {
        await db
          .insert(notificationPreferences)
          .values({ userId: created.id })
          .onConflictDoNothing();
        userIds.push(created.id);
        console.log(`  ✓ @${username}`);
      } else {
        const [existing] = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.username, username))
          .limit(1);
        if (existing) userIds.push(existing.id);
        console.log(`  ~ @${username} (já existe)`);
      }
    } catch (e) {
      console.warn(`  ✗ @${username}:`, e);
    }
  }

  if (userIds.length === 0) {
    console.log('Nenhum usuário disponível para criar posts.');
    process.exit(0);
  }

  console.log('Criando posts...');
  let created = 0;
  for (let i = 0; i < fakerTexts.length; i++) {
    const authorId = userIds[i % userIds.length];
    const content = fakerTexts[i].content.slice(0, 280);
    try {
      await db.insert(posts).values({ authorId, content });
      created++;
    } catch (e) {
      console.warn('  ✗ post ignorado:', e);
    }
  }

  console.log(`\nSeed concluído: ${userIds.length} usuários, ${created} posts inseridos.`);
  process.exit(0);
}

seed().catch((e) => {
  console.error('Seed falhou:', e);
  process.exit(1);
});

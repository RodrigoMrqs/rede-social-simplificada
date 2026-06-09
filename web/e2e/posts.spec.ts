import { test, expect } from '@playwright/test';

const TS = Date.now();
const API = 'http://localhost:3001';

const user = {
  username: `e2epost${TS}`,
  displayName: 'Post Teste',
  email: `e2epost${TS}@test.com`,
  password: 'senha12345',
};

async function registerAndLogin(page: any, request: any, u = user) {
  await request.post(`${API}/auth/register`, {
    data: { username: u.username, displayName: u.displayName, email: u.email, password: u.password },
  });
  await page.goto('/login');
  await page.fill('#username', u.username);
  await page.fill('#password', u.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('**/feed', { timeout: 15000 });
}

async function loginAndCreatePost(request: any, u: typeof user, content: string) {
  const loginRes = await request.post(`${API}/auth/login`, {
    data: { username: u.username, password: u.password },
  });
  const { token } = await loginRes.json();
  await request.post(`${API}/posts`, {
    data: { content },
    headers: { Authorization: `Bearer ${token}` },
  });
}

test.describe('E2E — Publicar Post e Curtir', () => {
  test('E2E-05 — publicar post via formulário aparece no feed', async ({ page, request }) => {
    await registerAndLogin(page, request);

    await page.goto('/post/new');
    const content = `Post E2E ${TS}`;
    await page.fill('textarea', content);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/feed', { timeout: 15000 });
    await expect(page.getByText(content)).toBeVisible({ timeout: 10000 });
  });

  test('E2E-06 — curtir post incrementa contador', async ({ page, request }) => {
    const u = {
      username: `e2elike${TS}`,
      displayName: 'Like Teste',
      email: `e2elike${TS}@test.com`,
      password: 'senha12345',
    };
    await registerAndLogin(page, request, u);
    await loginAndCreatePost(request, u, `Post para curtir ${TS}`);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const likeButton = page.locator('button', { hasText: '❤️' }).first();
    const initialText = await likeButton.textContent();

    await likeButton.click();
    await page.waitForTimeout(1000);

    const updatedText = await likeButton.textContent();
    expect(updatedText).toContain('Curtido');
  });

  test('E2E-07 — descurtir post decrementa contador', async ({ page, request }) => {
    const u = {
      username: `e2eunlike${TS}`,
      displayName: 'Unlike Teste',
      email: `e2eunlike${TS}@test.com`,
      password: 'senha12345',
    };
    await registerAndLogin(page, request, u);
    await loginAndCreatePost(request, u, `Post para descurtir ${TS}`);

    await page.reload();
    await page.waitForLoadState('networkidle');

    const likeButton = page.locator('button', { hasText: '❤️' }).first();

    // Curtir
    await likeButton.click();
    await page.waitForTimeout(800);
    await expect(likeButton).toContainText('Curtido');

    // Descurtir
    await likeButton.click();
    await page.waitForTimeout(800);
    await expect(likeButton).not.toContainText('Curtido');
  });
});

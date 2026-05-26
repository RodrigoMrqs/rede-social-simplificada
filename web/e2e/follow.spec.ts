import { test, expect } from '@playwright/test';

const TS = Date.now();
const API = 'http://localhost:3001';

const userA = {
  username: `e2efollower${TS}`,
  displayName: 'Seguidor Teste',
  email: `e2efollower${TS}@test.com`,
  password: 'senha12345',
};

const userB = {
  username: `e2etarget${TS}`,
  displayName: 'Alvo Teste',
  email: `e2etarget${TS}@test.com`,
  password: 'senha12345',
};

test.describe('E2E — Seguir e Deixar de Seguir', () => {
  test('E2E-08 — seguir usuário muda botão para "Seguindo"', async ({ page, request }) => {
    // Criar os dois usuários via API
    await request.post(`${API}/auth/register`, {
      data: { username: userA.username, displayName: userA.displayName, email: userA.email, password: userA.password },
    });
    await request.post(`${API}/auth/register`, {
      data: { username: userB.username, displayName: userB.displayName, email: userB.email, password: userB.password },
    });

    // Login como userA
    await page.goto('/login');
    await page.fill('#username', userA.username);
    await page.fill('#password', userA.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 15000 });

    // Navegar para o perfil de userB
    await page.goto(`/profile/${userB.username}`);
    await page.waitForLoadState('networkidle');

    const followButton = page.getByRole('button', { name: 'Seguir' });
    await expect(followButton).toBeVisible({ timeout: 8000 });
    await followButton.click();

    await expect(page.getByRole('button', { name: 'Seguindo' })).toBeVisible({ timeout: 8000 });
  });

  test('E2E-09 — deixar de seguir muda botão de volta para "Seguir"', async ({ page, request }) => {
    // Login como userA (userB já existe do teste anterior)
    await page.goto('/login');
    await page.fill('#username', userA.username);
    await page.fill('#password', userA.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/feed', { timeout: 15000 });

    await page.goto(`/profile/${userB.username}`);
    await page.waitForLoadState('networkidle');

    // Pode estar Seguindo ou Seguir dependendo da ordem de execução
    const seguindoBtn = page.getByRole('button', { name: 'Seguindo' });
    const seguirBtn = page.getByRole('button', { name: 'Seguir' });

    if (await seguindoBtn.isVisible()) {
      await seguindoBtn.click();
      await expect(seguirBtn).toBeVisible({ timeout: 8000 });
    } else {
      // Seguir primeiro, depois deixar de seguir
      await seguirBtn.click();
      await expect(seguindoBtn).toBeVisible({ timeout: 8000 });
      await seguindoBtn.click();
      await expect(seguirBtn).toBeVisible({ timeout: 8000 });
    }
  });
});

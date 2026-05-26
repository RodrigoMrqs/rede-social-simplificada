import { test, expect } from '@playwright/test';

const TS = Date.now();
const API = 'http://localhost:3001';

const mainUser = {
  username: `e2eauth${TS}`,
  displayName: 'Auth Teste',
  email: `e2eauth${TS}@test.com`,
  password: 'senha12345',
};

test.describe('E2E — Cadastro e Login', () => {
  test('E2E-01 — cadastro via formulário redireciona para /feed', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#username', mainUser.username);
    await page.fill('#displayName', mainUser.displayName);
    await page.fill('#email', mainUser.email);
    await page.fill('#password', mainUser.password);
    await page.fill('#confirmPassword', mainUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/feed', { timeout: 15000 });
    await expect(page).toHaveURL(/feed/);
  });

  test('E2E-02 — login com credenciais válidas redireciona para /feed', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#username', mainUser.username);
    await page.fill('#password', mainUser.password);
    await page.click('button[type="submit"]');

    await page.waitForURL('**/feed', { timeout: 15000 });
    await expect(page).toHaveURL(/feed/);
  });

  test('E2E-03 — login com senha incorreta exibe mensagem de erro', async ({ page }) => {
    await page.goto('/login');

    await page.fill('#username', mainUser.username);
    await page.fill('#password', 'senhaerrada');
    await page.click('button[type="submit"]');

    await expect(page.getByText(/credenciais/i)).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/login/);
  });

  test('E2E-04 — cadastro com username já existente exibe erro', async ({ page }) => {
    await page.goto('/register');

    await page.fill('#username', mainUser.username);
    await page.fill('#displayName', mainUser.displayName);
    await page.fill('#email', `outro${mainUser.email}`);
    await page.fill('#password', mainUser.password);
    await page.fill('#confirmPassword', mainUser.password);
    await page.click('button[type="submit"]');

    await expect(page.getByText(/indisponível|já existe|conflict/i)).toBeVisible({ timeout: 8000 });
  });
});

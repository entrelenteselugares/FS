import { type Page } from '@playwright/test';

/**
 * Logs in an admin user for Playwright tests.
 * Tries API login first to avoid UI flakiness, then falls back to UI login.
 */
export async function adminLogin(page: Page) {
  const ADMIN_EMAIL = 'contatofotosegundo@gmail.com';
  const ADMIN_SENHA = '123456';

  // Attempt API login using Playwright's request context.
  try {
    const response = await page.request.post('/api/auth/login', {
      data: { email: ADMIN_EMAIL, senha: ADMIN_SENHA },
    });
    if (response.ok()) {
      const { token, refreshToken } = await response.json();
      // Store tokens in localStorage as the app expects.
      await page.addInitScript(({ token, refreshToken }) => {
        localStorage.setItem('fs_token', token);
        localStorage.setItem('fs_refresh_token', refreshToken);
      }, { token, refreshToken });
      // Navigate directly to the admin dashboard.
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      return;
    }
  } catch (e) {
    console.warn('API login failed, falling back to UI login', e);
  }

  // UI fallback – open login page and perform manual sign‑in.
  await page.goto('/login');
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_SENHA);
  await page.click('button:has-text("Entrar")');
  // Wait until we land on an admin route.
  await page.waitForURL('**/admin**');
}

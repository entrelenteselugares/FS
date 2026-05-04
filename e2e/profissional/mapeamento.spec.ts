import { test, expect } from '@playwright/test';

test('Mapeamento do Dashboard Profissional', async ({ page }) => {
  const email = 'e2e-profissional@fotosegundo.test';
  
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await expect(page).toHaveURL(/.*profissional/, { timeout: 20000 });

  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/profissional/debug-profissional.png', fullPage: true });
});

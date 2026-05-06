import { test, expect } from '@playwright/test';

test('debug login', async ({ page }) => {
  const adminEmail = 'contatofotosegundo@gmail.com';
  const pass = '123456';

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(adminEmail);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'scratch/login-debug.png' });
  console.log('Current URL:', page.url());
  
  const isErrorVisible = await page.locator('text=Erro ao fazer login').isVisible();
  if (isErrorVisible) {
    console.log('❌ Login error visible');
  } else {
    console.log('✅ No login error visible');
  }
});

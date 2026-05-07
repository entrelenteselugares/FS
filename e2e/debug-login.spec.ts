import { test, expect } from '@playwright/test';

test('Debug Unidade Fixa Login', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  
  await page.waitForTimeout(3000);
  console.log('Current URL:', page.url());
  
  const text = await page.content();
  if (text.includes('Credenciais inválidas')) console.log('ERROR: Credenciais inválidas');
  if (text.includes('Inativo')) console.log('ERROR: Conta inativa');
  
  await page.screenshot({ path: 'debug-login.png' });
});

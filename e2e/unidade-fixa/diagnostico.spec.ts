import { test, expect } from '@playwright/test';

test('Diagnóstico de Campos Unidade Fixa', async ({ page }) => {
  const email = 'unidade-sp@brasil.com.br';
  
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await expect(page).toHaveURL(/.*unidade-fixa/, { timeout: 20000 });

  await page.getByRole('button', { name: /Configuração/i }).click();
  await page.waitForTimeout(3000);

  const slug = await page.locator('input[placeholder="UNIDADE-EXEMPLO"]').inputValue();
  const phone = await page.locator('input[placeholder="(00) 00000-0000"]').inputValue();
  
  console.log(`[DIAGNOSTICO] Slug Atual: "${slug}"`);
  console.log(`[DIAGNOSTICO] Telefone Atual: "${phone}"`);
  
  await page.screenshot({ path: 'c:/foto-segundo/e2e/unidade-fixa/debug-config-fields.png', fullPage: true });
});

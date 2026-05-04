import { test, expect } from '@playwright/test';

test('Mapeamento Detalhado da Unidade Fixa', async ({ page }) => {
  const email = 'membro2@fotosegundo.com.br';
  
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await expect(page).toHaveURL(/.*unidade-fixa/, { timeout: 20000 });

  // 1. Rede Técnica
  console.log('[DEBUG] Navegando para Rede Técnica...');
  await page.getByRole('button', { name: /Rede Técnica/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/unidade-fixa/debug-rede-tecnica.png', fullPage: true });

  // 2. Configuração
  console.log('[DEBUG] Navegando para Configuração...');
  await page.getByRole('button', { name: /Configuração/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/unidade-fixa/debug-configuracao.png', fullPage: true });
});

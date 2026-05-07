import { test, expect } from '@playwright/test';

test('Jornada do Profissional - Navegação e Validação', async ({ page }) => {
  const email = 'hibrido@brasil.com.br';
  
  console.log('[PRO] Iniciando login...');
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await expect(page).toHaveURL(/.*(profissional|dashboard)/, { timeout: 20000 });

  // 1. Financeiro
  console.log('[PRO] Verificando aba Financeiro...');
  await page.getByRole('button', { name: /Financeiro/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/profissional/debug-pro-financeiro.png', fullPage: true });
  await expect(page.getByText(/Repasses/i).first()).toBeVisible();

  // 2. Serviços
  console.log('[PRO] Verificando aba Serviços...');
  await page.getByRole('button', { name: /Serviços/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/profissional/debug-pro-servicos.png', fullPage: true });
  await expect(page.getByText(/GESTÃO DE ATIVOS/i).first()).toBeVisible();

  // 3. Meu Perfil
  console.log('[PRO] Verificando aba Meu Perfil...');
  await page.getByRole('button', { name: /Meu Perfil/i }).click();
  await page.waitForTimeout(2000);
  await page.screenshot({ path: 'c:/foto-segundo/e2e/profissional/debug-pro-perfil.png', fullPage: true });
  await expect(page.getByText(/MEU PERFIL/i).first()).toBeVisible();

  // Preenche nome se estiver vazio
  const nameInput = page.locator('input').first();
  if (!(await nameInput.inputValue())) {
    await nameInput.fill('E2E Profissional Teste');
    console.log('[PRO] Nome de operação preenchido.');
  }

  console.log('[PRO] ✅ Jornada do Profissional validada com sucesso.');
});

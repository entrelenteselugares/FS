import { test, expect, Page } from '@playwright/test';

const pass = '123456';

async function clearPopups(page: Page) {
  console.log('[ROBOT] Verificando popups...');
  await page.waitForTimeout(1000);
  
  const popups = [
    /IGNORAR POR ENQUANTO/i,
    /Entendi/i,
    /Fechar/i,
    /Ok/i,
    /ACESSAR CENTRAL/i
  ];

  for (const text of popups) {
    try {
      const btn = page.locator('button, [role="button"]').filter({ hasText: text }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`[ROBOT] Clicando em: ${text}`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }
    } catch (e) {}
  }

  await page.evaluate(() => {
    const overlays = document.querySelectorAll('.backdrop-blur-2xl, .fixed.inset-0.z-\\[8000\\]');
    overlays.forEach(el => (el as HTMLElement).style.display = 'none');
  }).catch(() => {});
}

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await page.waitForURL(/\/(profissional|unidade-fixa|franquia|minha-conta|admin)/, { timeout: 15000 });
  await clearPopups(page);
}

test.describe('Usability Robot: Dublin Accounts Simulation', () => {

  test('Profissional Dublin: navegação completa do painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional (pro1@dublin.com)');
    await login(page, 'pro1@dublin.com');
    await expect(page).toHaveURL(/.*\/profissional/);

    await expect(page.getByRole('button', { name: /Visão Geral/i })).toBeVisible();

    await clearPopups(page);
    await page.getByRole('button', { name: /Financeiro|Fluxo/i }).first().click();
    await expect(page.getByText(/Performance Financeira|Repasse Previsto/i).first()).toBeVisible({ timeout: 10000 });

    await clearPopups(page);
    await page.getByRole('button', { name: /Serviços|Monitor/i }).first().click();
    await expect(page.getByRole('heading', { name: /Matriz de Precificação|Vitrine|Monitor/i }).first()).toBeVisible({ timeout: 10000 });

    await clearPopups(page);
    await page.getByRole('button', { name: /Minha Rede|Equipe|Rede Técnica/i }).first().click();
    await expect(page.getByText(/Minha Rede e Alianças|Rede Técnica/i).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Meu Perfil/i }).click();
    await page.waitForTimeout(500);

    console.log('[ROBOT] ✅ Profissional Dublin OK');
  });

  test('Unidade Fixa Dublin: navegação do cartório/ponto fixo', async ({ page }) => {
    console.log('[ROBOT] Perfil: Unidade Fixa (unidade1@dublin.com)');
    await login(page, 'unidade1@dublin.com');
    await expect(page).toHaveURL(/.*\/unidade-fixa/);

    await page.getByRole('button', { name: /Agenda Tática/i }).click();
    await page.waitForTimeout(500);

    await page.getByRole('button', { name: /Monitor de Fila/i }).first().click();
    await expect(page.getByRole('heading', { name: /Monitor de Operação Phygital|Monitor de Fila/i }).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Fluxo Financeiro/i }).first().click();
    await expect(page.getByText(/Consolidação de Repasses|Fluxo Financeiro/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Unidade Fixa Dublin OK');
  });

  test('Cliente Dublin: navegação e acesso aos serviços', async ({ page }) => {
    console.log('[ROBOT] Perfil: Cliente (cliente1@dublin.com)');
    await login(page, 'cliente1@dublin.com');
    await expect(page).toHaveURL(/.*\/minha-conta/);
    await expect(page.getByRole('button', { name: /Minhas Memórias/i })).toBeVisible();

    await page.getByRole('button', { name: /Carrinho|Minha Carteira|Carteira/i }).first().click();
    await expect(page.getByText(/Saldo Disponível|Histórico de Transações/i).first()).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: /Meus Dados|Perfil/i }).first().click();
    await expect(page.getByText(/Dados do Perfil|Informações Pessoais/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Cliente Dublin OK');
  });

});

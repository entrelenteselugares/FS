import { test, expect } from '@playwright/test';

const EMAIL = 'franqueado@brasil.com.br';
const PASS = '123456';

// Forçamos 1 worker para evitar conflitos de sessão no mesmo usuário
test.describe.configure({ mode: 'serial' });

test.describe('📊 Franqueado: Hub B2B & Command Center Audit', () => {

  test('Protocol: Login & Hub B2B Initialization', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    
    // Redirecionamento automático para /franquia (via DashboardRedirect em App.tsx)
    await page.waitForURL(/\/franquia/);
    
    // Verifica o título do dashboard
    await expect(page.getByText(/Command Center/i)).toBeVisible();
    await expect(page.getByText(/Gestão de Franquia/i)).toBeVisible();
    
    console.log('✅ Login e Hub B2B validados.');
  });

  test('Protocol: Inventory & Print Credits Monitoring', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/franquia/);

    // Verifica o Monitor de Insumos
    await expect(page.getByText(/Monitor de Insumos/i)).toBeVisible();
    await expect(page.getByText(/Créditos de Foto/i)).toBeVisible();
    
    // Verifica botões de reabastecimento
    await expect(page.getByRole('button', { name: /Reabastecer Créditos/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Solicitar Kit Físico/i })).toBeVisible();
    
    console.log('✅ Monitor de Inventário e Créditos validado.');
  });

  test('Protocol: Network & Referral System', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/franquia/);

    // Verifica a seção Minha Rede
    await expect(page.getByText(/Minha Rede/i)).toBeVisible();
    
    // Verifica se o link de indicação está presente ou sendo gerado
    const refInput = page.locator('input[readonly]');
    await expect(refInput).toBeVisible();
    const val = await refInput.inputValue();
    expect(val.length).toBeGreaterThan(0);
    
    console.log('✅ Sistema de Indicação e Rede validado.');
  });

  test('Protocol: Finance & Passive Commissions', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/franquia/);

    // Verifica Widget de Renda Passiva
    await expect(page.getByText(/Renda Passiva/i)).toBeVisible();
    
    // Verifica lista de comissões recentes
    await expect(page.getByText(/Comissões Recentes/i)).toBeVisible();
    
    console.log('✅ Visão Financeira e Comissões validadas.');
  });

});

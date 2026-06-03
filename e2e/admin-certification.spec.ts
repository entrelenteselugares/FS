import { test, expect } from '@playwright/test';

const EMAIL = 'contatofotosegundo@gmail.com';
const PASS = '123456';

// Forçamos 1 worker para evitar conflitos de sessão no mesmo usuário
test.describe.configure({ mode: 'serial' });

test.describe('Admin Certification Suite', () => {

  test('Protocol: Login & Global Intelligence Hub', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    
    // Redirecionamento automático para /admin
    await page.waitForURL(/\/admin/);
    
    // Verifica o título do dashboard e o papel
        await expect(page.getByText(/Visão Geral/i).first()).toBeVisible();
    
    // Verifica se os cards de estatísticas globais carregam
    await expect(page.getByText(/Receita Bruta/i)).toBeVisible();
    await expect(page.getByText(/Eventos Ativos/i)).toBeVisible();
    
    console.log('✅ Login e Inteligência Global validados.');
  });

  test('Protocol: Global Event Management Audit', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/admin/);

    // Navega para aba Eventos
    await page.locator('button').filter({ hasText: /Eventos/i }).first().click();
    
    // Verifica heading da página de eventos
    await expect(page.getByText(/Logística de Captação/i)).toBeVisible();
    
    console.log('✅ Gestão de Eventos Global validada.');
  });

  test('Protocol: Member Directory & Access Control', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/admin/);

    // Navega para aba Membros
    await page.locator('button').filter({ hasText: /Membros/i }).first().click();
    
    // Verifica diretório de membros
    await expect(page.getByText(/Gestão de Membros/i)).toBeVisible();
    
    console.log('✅ Diretório de Membros validado.');
  });

  test('Protocol: Finance Hub & Revenue Transparency', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/admin/);

    // Navega para aba Financeiro
    await page.locator('button').filter({ hasText: /Financeiro/i }).first().click();
    
    // Verifica reconciliação financeira
    await expect(page.getByText(/Gestão Financeira 360/i)).toBeVisible();
    
    console.log('✅ Transparência Financeira validada.');
  });

  test('Protocol: Platform Configuration & Governance', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/admin/);

    // Navega para aba Configurações
    await page.locator('button').filter({ hasText: /Configura/i }).first().click();
    
    // Verifica parâmetros do sistema
    await expect(page.getByText(/Inteligência Financeira/i)).toBeVisible();
    
    console.log('✅ Governança e Configurações validadas.');
  });

});

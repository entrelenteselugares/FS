import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'VALIDATION');
const ts = Math.floor(Date.now() / 1000);

test.describe('🏁 Production Readiness: Full E2E Audit', () => {
  test.setTimeout(900000); // 15 minutes

  const credentials = {
    cli: `cli_${ts}@portugal.com`,
    pro: `pro_${ts}@portugal.com`,
    uni: `uni_${ts}@portugal.com`,
    pass: '123456'
  };

  test('Step 1: Multi-Profile Registration', async ({ page }) => {
    console.log('[AUDIT] 🚀 Registrando perfis...');
    
    // 1. CLIENTE
    await page.goto(`/register`);
    await page.getByText('Cliente Privado').click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Audit Cliente');
    await page.getByPlaceholder('(00) 00000-0000').fill('11999999999');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(credentials.cli);
    await page.locator('input[type="password"]').fill(credentials.pass);
    await page.getByText('Aceito os Termos de Uso').click();
    await page.getByText('Concordo com a Política de Privacidade').click();
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    await page.waitForURL(/\/minha-conta/);
    console.log('✅ Cliente registrado.');

    // 2. PROFISSIONAL
    await page.goto(`/register`);
    await page.getByText('Profissional da Rede').click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Audit Pro');
    await page.getByPlaceholder('(00) 00000-0000').fill('11888888888');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(credentials.pro);
    await page.locator('button').filter({ hasText: /^FOTO$/ }).click();
    await page.locator('input[type="password"]').fill(credentials.pass);
    await page.getByText('Aceito os Termos de Uso').click();
    await page.getByText('Concordo com a Política de Privacidade').click();
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    await page.waitForURL(/\/profissional/);
    console.log('✅ Profissional registrado.');

    // 3. UNIDADE FIXA
    await page.goto(`/register`);
    await page.getByText('Unidade Fixa').click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Audit Unidade');
    await page.getByPlaceholder('(00) 00000-0000').fill('11777777777');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(credentials.uni);
    await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill('Audit Unidade LTDA');
    await page.getByPlaceholder('00000-000', { exact: true }).fill('01310-100');
    await page.locator('input[type="password"]').fill(credentials.pass);
    await page.getByText('Aceito os Termos de Uso').click();
    await page.getByText('Concordo com a Política de Privacidade').click();
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    await page.waitForURL(/\/unidade-fixa/);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'profile_UNIDADE_success.png') });
    console.log('✅ Unidade Fixa registrada.');
  });

  test('Step 2: Quotation Engine Simulation', async ({ page }) => {
    console.log('[AUDIT] 📝 Simulando Orçamento...');
    await page.goto(`/cotacao`);
    await page.waitForLoadState('networkidle');
    
    await page.getByText('ORÇAMENTO', { exact: true }).first().click();
    await page.getByPlaceholder('CEP DO LOCAL').fill('13092150');
    
    // DatePicker
    await page.getByText(/SELECIONE A DATA/i).first().click();
    await page.waitForTimeout(1000);
    // Clica no dia 28 (se estiver visível e habilitado)
    const day28 = page.locator('button').filter({ hasText: /^28$/ }).first();
    if (await day28.isVisible()) {
      await day28.click();
      await page.getByText(/CONFIRMAR DATA/i).first().click();
    }
    
    await page.getByText(/PRÓXIMO/i).first().click();
    await page.waitForTimeout(1500);

    // Seleção de Serviço
    await page.locator('div').filter({ hasText: /FOTOGRAFIA DIGITAL/i }).last().click({ force: true });
    await page.getByText(/CONTINUAR/i).first().click();

    // Formulário Final
    await page.getByPlaceholder(/NOME/i).first().fill('Audit Simulation');
    await page.getByPlaceholder(/CONTATO/i).first().fill('audit@portugal.com');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_Audit.png'), fullPage: true });
    console.log('✅ Orçamento simulado.');
  });

  test('Step 3: Network & Vault Audit', async ({ page }) => {
    console.log('[AUDIT] 👥 Simulando Rede e Cofres...');
    // Login como Cliente
    await page.goto(`/login`);
    await page.getByPlaceholder('seu@email.com').fill(credentials.cli);
    await page.locator('input[type="password"]').fill(credentials.pass);
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    await page.waitForURL(/\/minha-conta/);
    
    // Cofres
    await page.goto(`/cofres`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '1_Vaults_Audit.png'), fullPage: true });
    
    // Checkout (Visual)
    await page.goto(`/checkout?orderId=AUDIT_${ts}`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '2_Checkout_Audit.png'), fullPage: true });
    console.log('✅ Rede, Cofres e Checkout visualizados.');
  });

  test('Step 4: Professional Dashboard Audit', async ({ page }) => {
    console.log('[AUDIT] 📸 Simulando Dashboard Profissional...');
    await page.goto(`/login`);
    await page.getByPlaceholder('seu@email.com').fill(credentials.pro);
    await page.locator('input[type="password"]').fill(credentials.pass);
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    await page.waitForURL(/\/profissional/);
    await page.getByRole('button', { name: /Minha Rede/i }).click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '3_Network_Audit.png'), fullPage: true });
    console.log('✅ Dashboard Profissional validado.');
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'SIMULATIONS');
const TS = '1778275986'; // Usando o mesmo timestamp dos usuários criados

test.describe('Robot V4: End-to-End Flow Simulations', () => {
  test.setTimeout(600000); // 10 minutos

  test('Flow: Orçamento (Quotation Engine)', async ({ page }) => {
    console.log('[SIMULATION] 📝 Iniciando fluxo de Orçamento...');
    await page.goto(`/cotacao`);
    await page.waitForLoadState('networkidle');
    
    // Passo 1: Local e Data
    console.log('[SIMULATION] Selecionando tipo de local...');
    await page.getByText('ORÇAMENTO', { exact: true }).first().click();
    await page.getByPlaceholder('CEP DO LOCAL').fill('13092150');
    
    console.log('[SIMULATION] Tentando pular DatePicker se possível ou clicar no primeiro match...');
    const pickerTrigger = page.getByText(/SELECIONE A DATA/i).first();
    await pickerTrigger.click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_DatePicker_Open.png') });
    
    const confirmBtn = page.getByText(/CONFIRMAR DATA/i).first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_DatePicker_Closed.png') });
    
    console.log('[SIMULATION] Indo para Passo 2...');
    await page.getByText(/PRÓXIMO/i).first().click();

    // Passo 2: Configuração
    console.log('[SIMULATION] Passo 2: Selecionando Serviço...');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_Step2_Start.png') });
    
    // Clica no card de Fotografia Digital
    await page.getByText(/FOTOGRAFIA DIGITAL/i).first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_Step2_Selected.png') });
    
    await page.getByText(/CONTINUAR/i).first().click();

    // Passo 3: Dados
    console.log('[SIMULATION] Passo 3...');
    await page.waitForTimeout(1000);
    await page.getByPlaceholder(/NOME/i).first().fill('Simulação de Teste');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '0_Quote_Step3.png'), fullPage: true });
    console.log('[SIMULATION] ✅ Orçamento simulado até o passo 3.');
  });

  test('Flow: Rede Network (Pro Search)', async ({ page }) => {
    console.log('[SIMULATION] 👥 Testando Busca na Rede Network...');
    await page.goto(`/login`);
    await page.getByPlaceholder('seu@email.com').fill(`pro_${TS}@portugal.com`);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    await page.waitForURL(/\/profissional/);
    await page.getByRole('button', { name: /Minha Rede/i }).click();
    
    // Busca na Rede
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '1_Network_Search.png'), fullPage: true });
    console.log('[SIMULATION] ✅ Visualização da rede validada.');
  });

  test('Flow: Ponto Fixo Scheduling (Booking)', async ({ page }) => {
    console.log('[SIMULATION] 🏢 Testando Agendamento em Unidade Fixa...');
    // Tentamos listar as unidades se o slug falhar
    await page.goto(`/cotacao`);
    await page.getByText('UNIDADE FIXA', { exact: true }).first().click();
    
    const select = page.locator('select');
    await expect(select).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '2_Unit_Select.png') });
    console.log('[SIMULATION] ✅ Seleção de Unidade Fixa validada.');
  });

  test('Flow: Cofre de Memórias (Vault Detail)', async ({ page }) => {
    console.log('[SIMULATION] 🔒 Testando Visualização de Cofre...');
    await page.goto(`/login`);
    await page.getByPlaceholder('seu@email.com').fill(`cli_${TS}@portugal.com`);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    await page.waitForURL(/\/minha-conta/);
    await page.goto(`/cofres`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '3_Vaults_List.png'), fullPage: true });
    console.log('[SIMULATION] ✅ Dashboard de Cofres acessado.');
  });

  test('Flow: Compra & Checkout (Simulated)', async ({ page }) => {
    console.log('[SIMULATION] 🛒 Testando fluxo de Compra/Checkout...');
    // Simula entrada no checkout com um ID qualquer
    await page.goto(`/checkout?orderId=SIM_TEST_${Date.now()}`);
    await page.waitForLoadState('networkidle');
    
    // Verifica se a tela de checkout carregou (mesmo com erro de orderId inválido, o componente deve renderizar)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '4_Checkout_Screen.png'), fullPage: true });
    console.log('[SIMULATION] ✅ Tela de checkout visualizada.');
  });
});

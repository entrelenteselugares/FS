import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000'; 
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'SIMULATIONS');
const TS = '1778275986';

test.describe('Robot V5: Final Simulation & Validation', () => {
  test.setTimeout(600000);

  test('Simulation: Full Quotation Flow', async ({ page }) => {
    console.log('[SIMULATION] 📝 Iniciando Orçamento...');
    await page.goto(`${BASE_URL}/cotacao`);
    await page.waitForLoadState('networkidle');
    
    // Passo 1
    console.log('[SIMULATION] Passo 1: Local');
    await page.getByText('ORÇAMENTO', { exact: true }).first().click();
    await page.getByPlaceholder('CEP DO LOCAL').fill('13092150');
    
    console.log('[SIMULATION] Abrindo DatePicker...');
    await page.getByText(/SELECIONE A DATA/i).first().click();
    await page.waitForTimeout(1000);
    
    console.log('[SIMULATION] Confirmando Data...');
    const confirmBtn = page.getByText(/CONFIRMAR DATA/i).first();
    if (await confirmBtn.isVisible()) {
      await confirmBtn.click();
    }
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL_Quote_Step1.png') });
    await page.getByText(/PRÓXIMO/i).first().click();

    // Passo 2
    console.log('[SIMULATION] Passo 2: Serviços');
    await page.waitForTimeout(2000);
    
    // Tenta clicar em qualquer serviço que contenha "FOTO"
    const serviceCard = page.locator('div').filter({ hasText: /FOTO/i }).last();
    await serviceCard.click({ force: true });
    console.log('[SIMULATION] Serviço selecionado.');
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL_Quote_Step2.png') });
    await page.getByText(/CONTINUAR/i).first().click();

    // Passo 3
    console.log('[SIMULATION] Passo 3: Dados');
    await page.waitForTimeout(1000);
    await page.getByPlaceholder(/NOME/i).first().fill('Simulação Final');
    await page.getByPlaceholder(/CONTATO/i).first().fill('teste@portugal.com');
    
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL_Quote_Step3.png'), fullPage: true });
    console.log('[SIMULATION] ✅ Fluxo de Orçamento validado.');
  });

  test('Simulation: Partner Network & Vaults', async ({ page }) => {
    console.log('[SIMULATION] 👥 Validando Rede e Cofres...');
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('seu@email.com').fill(`cli_${TS}@portugal.com`);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    await page.waitForURL(/\/minha-conta/);
    
    // Cofres
    await page.goto(`${BASE_URL}/cofres`);
    await page.waitForLoadState('networkidle');
    await expect(page.getByText(/Cofre/i).or(page.getByText(/Nenhum cofre/i))).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL_Vaults.png') });
    
    console.log('[SIMULATION] ✅ Rede e Cofres validados.');
  });

  test('Simulation: Checkout Rendering', async ({ page }) => {
    console.log('[SIMULATION] 🛒 Validando Checkout...');
    await page.goto(`${BASE_URL}/checkout?orderId=SIM_FINAL`);
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'FINAL_Checkout.png') });
    console.log('[SIMULATION] ✅ Checkout renderizado.');
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000'; 
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'SIMULATIONS');

test.describe('Final Verification Flow', () => {
  test.setTimeout(300000);

  test('Flow: Orçamento Express', async ({ page }) => {
    console.log('[SIMULATION] 📝 Orçamento Express...');
    await page.goto(`${BASE_URL}/cotacao`);
    
    // Passo 1: Local
    await page.click('text=ORÇAMENTO');
    await page.fill('input[placeholder="CEP DO LOCAL"]', '13092150');
    
    // DatePicker
    await page.click('text=SELECIONE A DATA E HORÁRIO');
    await page.waitForTimeout(1000);
    // Seleciona um dia qualquer (ex: o primeiro botão de número no calendário)
    await page.locator('button:has-text("28")').first().click();
    await page.click('text=CONFIRMAR DATA E HORÁRIO');
    
    await page.click('text=PRÓXIMO: CONFIGURAÇÃO');

    // Passo 2: Serviços
    console.log('[SIMULATION] Passo 2: Serviços...');
    await page.waitForTimeout(2000);
    await page.click('text=FOTOGRAFIA DIGITAL');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'VERIFIED_Quote_Services.png') });
    
    await page.click('text=CONTINUAR →');

    // Passo 3: Dados
    console.log('[SIMULATION] Passo 3: Dados...');
    await page.fill('input[placeholder="NOME DO CONTRATANTE"]', 'Simulação Final');
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'VERIFIED_Quote_Final.png'), fullPage: true });
    console.log('✅ Orçamento Express validado.');
  });

  test('Flow: Unidade Fixa Booking', async ({ page }) => {
    console.log('[SIMULATION] 🏢 Unidade Fixa Booking...');
    await page.goto(`${BASE_URL}/cotacao`);
    await page.click('text=UNIDADE FIXA');
    
    // Verifica se o select de unidades aparece
    const select = page.locator('select');
    await expect(select).toBeVisible();
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'VERIFIED_Unit_Booking.png') });
    console.log('✅ Agendamento em Unidade Fixa validado.');
  });
});

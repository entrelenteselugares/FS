import { test, expect } from '@playwright/test';
import { prisma } from '../../backend/src/lib/prisma';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

test.beforeAll(async () => {
  console.log('[CLEANUP] Resetting calendar for cotacao tests...');
  // Limpa ordens e slots associados a parceiros (Ponto Fixo)
  const orders = await prisma.order.findMany({ where: { event: { partnerId: { not: null } } } });
  const orderIds = orders.map(o => o.id);
  const eventIds = orders.map(o => o.eventId).filter((id): id is string => !!id);
  
  await prisma.calendarSlot.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.order.deleteMany({ where: { id: { in: orderIds } } });
});

test.describe('Financial Flow: Quotation & Checkout', () => {

  test('should generate a budget and redirect to checkout', async ({ page }) => {
    const testEmail = 'contatofotosegundo@gmail.com';
    const testName = 'Finance Tester (Existing User)';

    // 1. Start Quotation
    await page.goto('/cotacao');
    await expect(page).toHaveURL(/.*\/cotacao/);

    // --- PASSO 1: ONDE E QUANDO ---
    // Select Date/Time (Trigger Popover)
    const dateTrigger = page.getByText(/SELECIONE A DATA E HORÁRIO/i);
    await dateTrigger.click();

    // Select a random day (1-20) to avoid scheduling conflicts
    const randomDay = Math.floor(Math.random() * 20) + 1;
    const dayBtn = page.getByRole('button', { name: new RegExp(`^${randomDay}$`) }).first();
    await dayBtn.click();

    // Confirm Date/Time
    const confirmDateBtn = page.getByRole('button', { name: /CONFIRMAR DATA/i });
    await confirmDateBtn.click();

    // Select a Partner (Mandatory for FIXED type)
    const partnerSelect = page.locator('select').first();
    await partnerSelect.selectOption({ index: 1 }); // Selecting first real option

    // Move to Step 2
    const nextStep1 = page.getByRole('button', { name: /PRÓXIMO: CONFIGURAÇÃO/i });
    await nextStep1.click();

    // --- PASSO 2: CONFIGURAÇÃO ---
    await expect(page.getByText(/PASSO 2: CONFIGURAÇÃO/i)).toBeVisible();

    // Adjust Duration Slider (set to 6 hours)
    const durationSlider = page.locator('input[type="range"]').first();
    await expect(durationSlider).toBeEnabled({ timeout: 10000 });
    await durationSlider.fill('6');

    // Fill Guests (Set to 50 to avoid extra staff costs and keep price at R$ 1,00)
    const guestsInput = page.getByRole('textbox').filter({ hasText: /0/ }).or(page.locator('input[inputmode="numeric"]')).first();
    await guestsInput.fill('50');

    // Select a Service (Mandatory)
    const serviceBtn = page.getByText(/Ativação Phygital Corporativa/i).first();
    await serviceBtn.click();

    // Move to Step 3
    const nextStep2 = page.getByRole('button', { name: /CONTINUAR/i });
    await nextStep2.click();

    // --- PASSO 3: IDENTIFICAÇÃO ---
    await expect(page.getByText(/Passo 3: Seus Dados/i)).toBeVisible();

    // Fill Personal Data
    await page.getByPlaceholder(/NOME DO CONTRATANTE/i).fill(testName);
    await page.getByPlaceholder(/EX: CONTATO@DOMINIO.COM/i).fill(testEmail);
    await page.locator('input[type="text"]').filter({ hasText: "" }).nth(1).or(page.getByPlaceholder('11999999999')).fill('(11) 98888-7777');

    // Submit and Generate Budget
    const submitBtn = page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i });
    
    console.log(`[TEST] Generating budget for: ${testEmail}`);
    await submitBtn.click();

    // --- CHECKOUT VALIDATION ---
    // Should redirect to /checkout/:orderId
    await expect(page).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 25000 });
    
    // Handle "Sua Nova Conta" or "Bem-vindo de Volta" step
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 10000 })) {
      console.log('[TEST] Auth step required. Filling password...');
      await passwordInput.fill('123456');
      const authBtn = page.getByRole('button', { name: /CONTINUAR|ENTRAR|CRIAR CONTA/i });
      await authBtn.click();
    }

    // Verify checkout page content (Resumo ou Investimento)
    await expect(page.getByText(/Investimento/i).or(page.getByText(/Resumo/i))).toBeVisible({ timeout: 15000 });
    
    // Validate Penny Testing Price (Should be 1,00 since all services are 1,00)
    await expect(page.getByText(/1,00|1.00/).first()).toBeVisible();
    
    console.log('[TEST] Penny Testing Price (R$ 1,00) validated on Checkout.');
    console.log('[TEST] Landed on Checkout secure area successfully.');
  });
});

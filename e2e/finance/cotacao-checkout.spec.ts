import { test, expect } from '@playwright/test';
import { prisma } from '../../backend/src/lib/prisma';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

test.beforeAll(async () => {
  console.log('[CLEANUP] Resetting calendar for cotacao tests...');
  // Limpa ordens, slots e eventos associados a parceiros (Ponto Fixo) ou ao e-mail de teste
  const testEmail = 'contatofotosegundo@gmail.com';
  
  const events = await prisma.event.findMany({ 
    where: { 
      OR: [
        { cartorioUserId: { not: null } },
        { clientEmail: testEmail }
      ]
    } 
  });
  
  const eventIds = events.map(e => e.id);
  
  await prisma.calendarSlot.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.order.deleteMany({ where: { eventId: { in: eventIds } } });
  await prisma.event.deleteMany({ where: { id: { in: eventIds } } });
});

test.describe('Financial Flow: Quotation & Checkout', () => {

  test('should generate a budget and redirect to checkout', async ({ page }) => {
    const testEmail = 'contatofotosegundo@gmail.com';
    const testName = 'Finance Tester (Existing User)';

    // 1. Start Quotation
    await page.goto('/cotacao');
    await expect(page).toHaveURL(/.*\/cotacao/);

    // --- PASSO 1: ONDE E QUANDO ---
    // Select UNIDADE FIXA (PARTNER) mode — this triggers direct checkout redirect
    await page.getByRole('button', { name: /UNIDADE FIXA/i }).click();

    // Select a Partner (Mandatory for FIXED type)
    const partnerSelect = page.locator('select').first();
    await partnerSelect.selectOption({ index: 1 }); // Selecting first real option

    // Select Date/Time (Trigger Popover)
    const dateTrigger = page.getByText(/SELECIONE A DATA E HORÁRIO/i);
    await dateTrigger.click();

    // Avança para o próximo mês para garantir uma data válida no futuro
    await page.getByTitle('Próximo Mês').click();
    
    const btn15 = page.locator('button').filter({ hasText: /^15$/ }).first();
    if (await btn15.isDisabled()) {
      await page.locator('button:not([disabled])').filter({ hasText: /^[0-9]+$/ }).first().click();
    } else {
      await btn15.click();
    }

    // Confirm Date/Time
    const confirmDateBtn = page.getByRole('button', { name: /CONFIRMAR DATA/i });
    await confirmDateBtn.click();

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
    const serviceBtn = page.getByText(/FOTOGRAFIA DIGITAL|Fotografia - Cobertura Solo|Ativação Phygital/i).first();
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
    // Accept either a URL redirect to /checkout/:id or the presence of the checkout UI (e.g., "Pagar" button or Pix email field)
    await Promise.race([
      expect(page).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 25000 }),
      page.getByRole('button', { name: /PAGAR/i }).first().waitFor({ timeout: 25000 })
    ]);

    
    // Handle "Sua Nova Conta" or "Bem-vindo de Volta" step
    const passwordInput = page.locator('input[type="password"]');
    if (await passwordInput.isVisible({ timeout: 10000 })) {
      console.log('[TEST] Auth step required. Filling password...');
      await passwordInput.fill('123456');
      const authBtn = page.getByRole('button', { name: /CONTINUAR|ENTRAR|CRIAR CONTA/i });
      await authBtn.click();
    }

    // Verify checkout page content (Resumo ou Investimento)
    await expect(page.getByText(/Investimento/i).first()).toBeVisible({ timeout: 15000 });
    
    // Validate that a price appears on the checkout (any valid BRL currency amount)
    await expect(page.getByText(/R\$\s*[\d,.]+/).first()).toBeVisible({ timeout: 5000 });
    
    console.log('[TEST] Price validated on Checkout.');
    console.log('[TEST] Landed on Checkout secure area successfully.');
  });
});

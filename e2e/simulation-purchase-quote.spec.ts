import { test, expect, Page } from '@playwright/test';

/**
 * 🛍️ Simulation: Purchase & Quotation (Golden Stable v3.2)
 * 
 * Este robô simula o comportamento de um cliente interessado em:
 * 1. Solicitar um orçamento (Quotation) para um evento.
 * 2. Realizar uma compra vinculada a uma Unidade Fixa (Partner LP).
 */

const ts = Math.floor(Date.now() / 1000);

test.describe('🏁 Simulation: Business Flow Audit', () => {

  test('Step 1: Request a Quotation (Orçamento Express)', async ({ page }) => {
    console.log('[SIMULATION] Iniciando solicitação de orçamento...');
    await page.goto('/cotacao');
    await page.waitForLoadState('networkidle');

    // 1. Localização (Seleciona Orçamento para mostrar CEP)
    await page.getByRole('button', { name: /ORÇAMENTO/i }).click();
    await page.getByPlaceholder('CEP DO LOCAL').fill('13092150');
    
    // 2. Seleção de Data (Amanhã + 2)
    await page.getByText(/SELECIONE A DATA/i).first().click();
    await page.waitForTimeout(1000);
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 3);
    const dayStr = targetDate.getDate().toString();
    
    // Tenta encontrar o botão do dia no calendário
    const dayBtn = page.locator('button').filter({ hasText: new RegExp(`^${dayStr}$`) }).first();
    if (await dayBtn.isVisible()) {
      await dayBtn.click();
      await page.getByText(/CONFIRMAR DATA/i).first().click();
    }

    await page.getByText(/PRÓXIMO/i).first().click();
    await page.waitForTimeout(1500);

    // 3. Seleção de Serviço
    await page.getByText(/FOTOGRAFIA DIGITAL|EDIÇÃO/i).first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();

    // 4. Identificação do Lead
    await page.getByPlaceholder(/NOME/i).first().fill('Simulação de Lançamento');
    await page.getByPlaceholder(/CONTATO/i).first().fill(`lead_${ts}@fotosegundo.com`);
    await page.getByPlaceholder(/11999999999/i).first().fill('19999999999');
    await page.getByRole('button', { name: /RESERVAR|FINALIZAR/i }).first().click();
    
    // Validação do sucesso/redirecionamento
    await expect(page.getByText(/Solicitação Enviada|Resumo da Seleção|Finalizar Compra/i).first()).toBeVisible();
    console.log('✅ Orçamento Express validado.');
  });

  test('Step 2: Purchase Journey in Unidade Fixa', async ({ page }) => {
    console.log('[SIMULATION] Iniciando jornada de compra na Unidade...');
    
    // 1. Tenta acessar a landing page da unidade padrão de testes
    await page.goto('/p/unidade-teste');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    // Se redirecionar para a home (catch do PartnerLP) ou mostrar erro
    if (page.url().endsWith('/') || page.url().endsWith(':3000') || await page.getByText(/Página não encontrada/i).isVisible()) {
      console.log('[SIMULATION] Unidade "unidade-teste" não encontrada ou falhou ao carregar.');
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const partnerLink = page.locator('a[href^="/p/"]').first();
      if (await partnerLink.isVisible()) {
        await partnerLink.click();
      }
    }

    // 2. Valida elementos da Unidade Fixa (Midnight Luxury Theme)
    await expect(page.getByText(/Sobre a Unidade|Unidade Fixa Autorizada/i).first()).toBeVisible();
    
    // 3. Tenta entrar em um evento da unidade para comprar foto
    const eventCard = page.locator('div[class*="group cursor-pointer"]').first();
    if (await eventCard.isVisible()) {
      await eventCard.click();
      await page.waitForURL(/\/e\//);
      console.log('[SIMULATION] Galeria do evento da unidade aberta.');

      // Seleciona e compra
      const photo = page.locator('img').first();
      await photo.click();
      const buyBtn = page.getByRole('button', { name: /ADICIONAR|COMPRAR/i }).first();
      if (await buyBtn.isVisible()) {
        await buyBtn.click();
        console.log('[SIMULATION] Item adicionado ao carrinho.');
        
        // Vai para o checkout clicando no botão da sidebar
        const finalizeBtn = page.getByText(/Finalizar Compra/i).first();
        await finalizeBtn.click();
        
        await expect(page.getByText(/Resumo da Seleção|Total/i).first()).toBeVisible();
        console.log('✅ Checkout de unidade fixa validado.');
      }
    } else {
      // Se não houver eventos, valida o botão de Orçamento Express direto da unidade
      const quoteBtn = page.getByText(/INICIAR ORÇAMENTO EXPRESS/i);
      await expect(quoteBtn).toBeVisible();
      console.log('✅ Botão de Orçamento da Unidade validado.');
    }
  });

});

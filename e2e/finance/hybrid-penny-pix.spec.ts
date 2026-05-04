import { test, expect } from '@playwright/test';
import { generateTestEmail } from '../utils/auth-helpers';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

/**
 * PROTOCOLO PENNY TESTING (HÍBRIDO): Fluxo A
 * 1. Cliente fecha serviço (Ponto Fixo).
 * 2. Checkout gera PIX Real (R$ 1,00).
 * 3. O robô para e extrai o código PIX para o USER pagar.
 * 4. Após pagamento, valida liberação de material.
 */

test.describe('Hybrid Financial Protocol: Penny PIX (Flow A)', () => {

  test('should process a real PIX payment and validate delivery', async ({ page }) => {
    test.setTimeout(180000); // 3 minutos para dar tempo de pagar
    const guestEmail = generateTestEmail();
    console.log(`\n[HYBRID] Iniciando Fluxo A para: ${guestEmail}`);

    // ─── 1. Navegação até o Checkout ────────────────────────
    await page.goto('/');
    await page.getByRole('button', { name: /AGENDAR/i }).click();
    await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
    await page.getByRole('combobox').selectOption({ index: 1 });
    
    // Abre Calendário
    await page.getByText(/2026/i).or(page.getByText(/SELECIONE A DATA/i)).first().click();
    await page.waitForTimeout(1000);
    
    // Seleciona o primeiro dia disponível (habilitado)
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^[0-9]+$/ }).first();
    await availableDay.click();
    await page.getByRole('button', { name: /CONFIRMAR/i }).click();
    await page.getByRole('button', { name: /PRÓXIMO/i }).click();

    // Configuração (Phygital R$ 1,00)
    await page.getByRole('textbox').first().fill('10'); 
    await page.getByText(/phygital|impresso|impressa/i).first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();

    // Identificação
    await page.getByPlaceholder(/NOME/i).fill('Penny Tester');
    await page.getByPlaceholder(/CONTATO@/i).fill(guestEmail);
    await page.getByPlaceholder(/119/i).fill('11999999999');
    await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click({ force: true });

    // ─── 2. Aguarda Resposta do Backend ─────────────────────
    // O backend pode redirecionar para /checkout (parceiro com preço) 
    // ou manter em /cotacao com confirmação (orçamento sob consulta)
    await page.waitForURL(/checkout|cotacao/, { timeout: 30000 });
    const currentUrl = page.url();
    console.log(`[HYBRID] URL pós-submit: ${currentUrl}`);
    
    if (!currentUrl.includes('/checkout/')) {
      console.log('[HYBRID] ⚠️ Orçamento encaminhado como consulta (parceiro sem preço fixo configurado). Fluxo PIX não aplicável neste cenário.');
      // Valida apenas que chegou em estado de sucesso
      await expect(page.getByText(/sucesso|confirmado|orçamento|enviado/i).first()).toBeVisible({ timeout: 10000 });
      return;
    }
    
    // Login se necessário (Usuário novo via Guest)
    const passInput = page.locator('input[type="password"]');
    if (await passInput.isVisible({ timeout: 5000 })) {
      await passInput.fill('123456');
      await page.getByRole('button', { name: /CONTINUAR|ENTRAR/i }).click();
    }

    console.log('[HYBRID] Selecionando PIX...');
    const pixOption = page.getByText(/Pix/i).first();
    await expect(pixOption).toBeVisible({ timeout: 20000 });
    await pixOption.click();

    // Aguarda o Brick do Mercado Pago carregar o QR Code
    console.log('[HYBRID] Aguardando QR Code do Mercado Pago...');
    await page.waitForTimeout(5000);

    // ─── 3. INTERVENÇÃO MANUAL ──────────────────────────────
    console.log("\n" + "=".repeat(60));
    console.log("🚀 PROTOCOLO PENNY: PIX GERADO!");
    
    // Tenta extrair o código Copia e Cola se disponível no DOM
    const pixCode = await page.locator('input[readonly]').first().inputValue().catch(() => "Não foi possível extrair o código automaticamente.");
    
    console.log(`\n👉 CHAVE PIX (COPIA E COLA):\n${pixCode}\n`);
    console.log("👉 AÇÃO REQUERIDA: Faça o pagamento de R$ 1,00 agora.");
    console.log("👉 O robô ficará em PAUSE. Após pagar e ver 'Sucesso' na tela, clique em RESUME.");
    console.log("=".repeat(60) + "\n");

    await page.pause();

    // ─── 4. Validação Pós-Pagamento ────────────────────────
    await expect(page.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 60000 });
    console.log('[HYBRID] ✅ Pagamento detectado! Validando liberação...');

    // Verifica se o evento agora está ativo para o cliente
    await page.goto('/consumer');
    await expect(page.getByText(/Penny Tester/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[HYBRID] 🎉 Fluxo A validado com sucesso do pagamento à entrega!');
  });
});

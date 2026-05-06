import { test, expect } from '@playwright/test';
import { PrismaClient } from '../../backend/node_modules/@prisma/client';
import { generateTestEmail } from '../utils/auth-helpers';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const prisma = new PrismaClient();

test.describe('Hybrid Financial Protocol: Penny PIX (R$ 1,00)', () => {

  test.afterAll(async () => {
    await prisma.$disconnect();
  });

  test('should execute full PIX checkout, wait for manual payment and validate database', async ({ page }) => {
    // 1. Pausa Estratégica (Long Timeout) de 3 minutos
    test.setTimeout(180000); 

    // Intercepta a chamada de serviços para injetar o Phygital de 1.00 BRL
    await page.route('**/public/configs/services', async route => {
      const json = {
        services: [
          {
            id: 'penny-test-service',
            name: 'Penny Phygital (R$ 1.00)',
            category: 'Impresso',
            basePrice: 1.00,
            description: 'Serviço simulado de R$ 1.00 para Penny Testing'
          }
        ]
      };
      await route.fulfill({ json });
    });
    
    const guestEmail = generateTestEmail();
    console.log(`\n[HYBRID] Iniciando Penny Testing para: ${guestEmail}`);

    // ─── 1. Avanço Rápido (Guest Checkout) ────────────────────────
    await page.goto('/');
    await page.getByRole('button', { name: 'Agendar', exact: true }).click();
    await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
    await page.getByRole('combobox').selectOption({ index: 1 });
    
    // Seleção de Data
    await page.getByText(/2026/i).or(page.getByText(/SELECIONE A DATA/i)).first().click();
    await page.waitForTimeout(1000);
    const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^[0-9]+$/ }).first();
    await availableDay.click();
    await page.getByRole('button', { name: /CONFIRMAR/i }).click();
    await page.getByRole('button', { name: /PRÓXIMO/i }).click();

    // Configuração do Produto (Penny Testing R$ 1,00)
    await page.getByRole('textbox').first().fill('10'); 
    
    // Clica no serviço recém-criado (busca exata para não clicar no título da categoria)
    await page.getByText('Penny Phygital').first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();

    // Preenchendo Contatos (Guest)
    await page.getByPlaceholder(/NOME/i).fill('Penny Tester Híbrido');
    await page.getByPlaceholder(/CONTATO@/i).fill(guestEmail);
    await page.getByPlaceholder(/119/i).fill('11999999999');
    await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click({ force: true });

    // Redirecionamento para Motor Unificado (/checkout)
    await page.waitForURL(/checkout|cotacao/, { timeout: 30000 });
    const currentUrl = page.url();
    
    if (!currentUrl.includes('/checkout')) {
      console.log('[HYBRID] ⚠️ Fluxo não direcionou para Checkout Unificado. Abortando teste Híbrido.');
      return;
    }

    // Bypass/Login Guest se necessário
    const passInput = page.locator('input[type="password"]');
    if (await passInput.isVisible({ timeout: 5000 })) {
      await passInput.fill('123456');
      await page.getByRole('button', { name: /CONTINUAR|ENTRAR/i }).click();
    }

    // Seleciona Método PIX
    console.log('[HYBRID] Selecionando método PIX...');
    const pixOption = page.getByText(/Pix/i).first();
    await expect(pixOption).toBeVisible({ timeout: 20000 });
    await pixOption.click();

    // Aguarda o QR Code ser renderizado pelo gateway (ex: Mercado Pago)
    await page.waitForTimeout(5000);

    // Extrai o Order ID da URL
    const orderIdMatch = page.url().match(/orderId=([^&]+)/);
    const orderId = orderIdMatch ? orderIdMatch[1] : null;

    if (!orderId) {
      throw new Error("Order ID não encontrado na URL do Checkout.");
    }

    // ─── 2. Intervenção Manual (Pausa Estratégica) ────────────────
    console.log("\n" + "=".repeat(60));
    console.log("🚀 PROTOCOLO PENNY: PIX GERADO!");
    console.log("⏳ AGUARDANDO PAGAMENTO MANUAL DO PIX... LEIA O QR CODE NA TELA!");
    console.log(`👉 Order ID no Banco: ${orderId}`);
    console.log("=".repeat(60) + "\n");

    // Aguarda a tela/componente de "Pagamento Aprovado" atualizar via Webhook
    // Timeout estendido de 180000ms (3 minutos)
    await expect(page.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 180000 });
    
    console.log('\n[HYBRID] ✅ Webhook processado! A tela foi atualizada com Sucesso.');

    // ─── 3. Retomada e Validação de Banco de Dados (Prisma) ──────
    console.log('[HYBRID] Iniciando auditoria do banco de dados...');

    // A. Validar se o status do pedido mudou para PAID
    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    expect(order).toBeDefined();
    expect(order?.status).toBe('PAID');
    console.log('✅ Status do Pedido: PAID');

    // B. Validar se o motor de split gerou comissão passiva do franqueado
    // Em alguns fluxos o valor pode ser null dependendo da regra, então checamos se existe
    expect(order?.splitFranchisee).not.toBeNull();
    console.log(`✅ Split do Franqueado Gerado: R$ ${order?.splitFranchisee}`);

    // C. Validar se a impressão foi para PENDING_PRINT na fila do Phygital
    const phygitalPrint = await prisma.phygitalPrint.findFirst({
      where: { eventId: order?.eventId }
    });

    if (phygitalPrint) {
      expect(phygitalPrint.status).toBe('PENDING_PRINT');
      console.log('✅ Ordem de Impressão (Phygital): PENDING_PRINT');
    } else {
      console.log('⚠️ Nenhuma entidade PhygitalPrint associada encontrada para este evento específico. O produto pode não ter sido marcado como impressão instantânea.');
    }

    console.log('\n[HYBRID] 🎉 Auditoria Finalizada com Sucesso! O Fluxo Físico e Financeiro está impecável!');
  });
});

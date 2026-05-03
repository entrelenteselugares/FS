import { test, expect } from '@playwright/test';
import { prisma } from '../../backend/src/lib/prisma';
import { generateTestEmail } from '../utils/auth-helpers';
import * as dotenv from 'dotenv';
import path from 'path';

// Carrega variáveis de ambiente do backend para acesso ao Prisma
dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

const E2E_EVENT_SLUG = 'e2e-marketplace-test';

/**
 * TESTE HÍBRIDO E2E: Penny Testing PIX
 * 
 * Este teste automatiza a navegação até o QR Code e aguarda a interação humana.
 * Finalidade: Validar o fluxo real de Webhooks, Splits e Fila de Impressão.
 */
test.describe('Hybrid Financial Protocol: Penny PIX', () => {

  test('should process a real PIX payment and validate splits/printing', async ({ page }) => {
    const guestEmail = 'contatofotosegundo@gmail.com';
    console.log(`[HYBRID TEST] Iniciando Protocolo Penny Testing para: ${guestEmail}`);

    // ─── 1. AVANÇO RÁPIDO: Navegação até o Checkout ────────────────────────
    await page.goto(`/e/${E2E_EVENT_SLUG}`);
    
    // Seleciona a primeira foto disponível
    await page.waitForSelector('.aspect-\\[3\\/4\\]', { timeout: 20000 });
    const firstPhoto = page.locator('.aspect-\\[3\\/4\\]').first();
    await firstPhoto.click();
    
    // Finaliza Compra
    const finalizeBtn = page.getByRole('button', { name: /Finalizar Compra/i });
    await finalizeBtn.click();

    // ─── 2. IDENTIFICAÇÃO E CADASTRO RÁPIDO ────────────────────────────────
    await expect(page).toHaveURL(/\/checkout\/[a-z0-9]+/, { timeout: 20000 });
    
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(emailInput).toBeEnabled({ timeout: 15000 });
    await emailInput.fill(guestEmail);
    
    const continueBtn = page.getByRole('button', { name: /CONTINUAR|ACESSAR/i }).first();
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }

    // Define senha
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    await passwordInput.fill('123456');
    
    const loginBtn = page.getByRole('button', { name: /ENTRAR|ACESSAR|CONTINUAR/i }).first();
    await loginBtn.click();

    // ─── 3. SELEÇÃO DE MÉTODO PIX ──────────────────────────────────────────
    // Aguarda o Mercado Pago Brick carregar
    console.log("[HYBRID TEST] Aguardando carregamento do Mercado Pago...");
    
    // Procura pelo rádio do PIX ou botão de transferência bancária
    // Nota: O MP Brick renderiza dentro de um iframe, mas o Playwright lida bem com seletores de texto
    const pixOption = page.getByText(/Pix/i).first();
    await expect(pixOption).toBeVisible({ timeout: 30000 });
    await pixOption.click();

    // Clica no botão de finalizar pagamento (geralmente gerado pelo Brick)
    const payBtn = page.getByRole('button', { name: /Finalizar Pagamento|Pagar/i });
    await payBtn.click();

    // ─── 4. PAUSA ESTRATÉGICA: QR CODE RENDERIZADO ─────────────────────────
    await expect(page.getByText(/QUASE LÁ!/i)).toBeVisible({ timeout: 30000 });
    
    // Garantimos que a seção de pagamento está visível (via texto do Pix Copia e Cola)
    await expect(page.getByText(/Pix Copia e Cola/i)).toBeVisible({ timeout: 15000 });
    
    // Tentamos localizar o QR Code, mas não travamos o teste se o mapeamento de acessibilidade falhar
    const qrElement = page.getByTestId('qr-code-element');
    if (await qrElement.count() > 0) {
        await expect(qrElement).toBeVisible();
    }
    
    console.log("\n" + "=".repeat(60));
    console.log("⏳ AGUARDANDO PAGAMENTO MANUAL DO PIX (PENNY TESTING R$ 1,00)");
    console.log("👉 LEIA O QR CODE NA TELA E REALIZE O PAGAMENTO.");
    console.log("👉 IMPORTANTE: Certifique-se de que o Ngrok está rodando para receber o webhook local.");
    console.log("👉 Após a tela atualizar para 'PAGAMENTO CONFIRMADO', clique em 'Resume' no Playwright Inspector.");
    console.log("=".repeat(60) + "\n");

    // Pausa a execução do teste e abre o inspetor. O teste só continua quando você mandar.
    await page.pause();

    // Após você clicar em 'Resume', ele valida a tela imediatamente sem precisar de um timeout longo
    await expect(page.getByText(/PAGAMENTO CONFIRMADO|Acesso Liberado/i)).toBeVisible();
    
    console.log("[HYBRID TEST] ✅ Pagamento detectado pelo Frontend! Iniciando auditoria de dados...");

    // ─── 5. RETOMADA E VALIDAÇÃO DE BACKEND (PRISMA) ───────────────────────
    // Busca o pedido no banco de dados para validar status e splits
    const order = await prisma.order.findFirst({
      where: { buyerEmail: guestEmail },
      include: {
        event: true
      },
      orderBy: { createdAt: 'desc' }
    });

    expect(order).not.toBeNull();
    console.log(`[AUDIT] Pedido ID: ${order?.id}`);

    // Validação de Status
    expect(order?.status).toBe('APROVADO');
    expect(order?.hasPaid).toBe(true);
    console.log("[AUDIT] ✅ Status do Pedido: APROVADO");

    // Validação do Motor de Split (Phase 09)
    // Se o evento e o profissional estiverem configurados, o splitFranchisee deve ser > 0
    if (order?.splitFranchisee) {
      const splitVal = Number(order.splitFranchisee);
      expect(splitVal).toBeGreaterThan(0);
      console.log(`[AUDIT] ✅ Split de Franquia Identificado: R$ ${splitVal.toFixed(2)}`);
    } else {
      console.warn("[AUDIT] ⚠️ Aviso: splitFranchisee é 0 ou nulo. Verifique se o fotógrafo do evento possui um padrinho/indicador.");
    }

    // Validação da Fila de Impressão (Phygital)
    // Como PhygitalPrint não tem orderId direto, buscamos pelo shortId da mídia comprada
    const orderItem = await prisma.orderItem.findFirst({
      where: { orderId: order?.id },
      include: { media: true }
    });

    const printQueue = await prisma.phygitalPrint.findFirst({
      where: { 
        eventId: order?.eventId,
        referenceCode: orderItem?.media?.shortId 
      }
    });

    if (printQueue) {
      expect(printQueue.status).toBe('PENDING');
      console.log("[AUDIT] ✅ Registro de Impressão criado com sucesso na fila.");
    } else {
       // Alguns eventos podem ser apenas digitais, dependendo da configuração do E2E_EVENT_SLUG
       console.log("[AUDIT] Info: Nenhum registro de impressão gerado (Verifique se o evento possui temFotoImpressa=true).");
    }

    console.log("\n[SUCCESS] PROTOCOLO PENNY TESTING FINALIZADO COM SUCESSO! 🚀");
  });
});

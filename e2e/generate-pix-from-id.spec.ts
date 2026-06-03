import { test, expect } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

test('Gera PIX e Aguarda Sucesso', async ({ page }) => {
  const orderId = 'cmouqvkvp0001vzxczmxmgcbd';
  test.setTimeout(600000); 

  await page.goto(`/checkout?orderId=${orderId}`);
  await page.waitForLoadState('networkidle');
  
  console.log('[ROBO] Página de Checkout Carregada.');
  
  // Espera o Mercado Pago Brick carregar
  await page.waitForTimeout(10000);
  
  // 1. Seleciona a opção Pix
  const pixSelectors = [
    'text="Pix"',
    'text="PIX"',
    '.mp-bricks-payment-method-picker-item-label:has-text("Pix")',
    'button:has-text("Pix")'
  ];

  let foundPix = false;
  for (const selector of pixSelectors) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 5000 })) {
        await loc.click();
        foundPix = true;
        console.log(`[ROBO] Método Pix selecionado.`);
        break;
      }
    } catch (e) {}
  }

  if (!foundPix) {
    throw new Error('Não foi possível encontrar a opção PIX no checkout.');
  }

  // 2. Clica no botão "Pagar" para GERAR o QR Code
  // No Mercado Pago Bricks, após selecionar o método, é necessário clicar no botão de ação principal.
  console.log('[ROBO] Tentando clicar no botão "Pagar"...');
  await page.waitForTimeout(2000);
  
  const pagarSelectors = [
    'button:has-text("Pagar")',
    'text="Pagar"',
    '.mp-bricks-button',
    '#payment-brick-submit'
  ];

  let foundPagar = false;
  for (const selector of pagarSelectors) {
    try {
      const loc = page.locator(selector).first();
      if (await loc.isVisible({ timeout: 5000 })) {
        await loc.click();
        foundPagar = true;
        console.log(`[ROBO] Botão "Pagar" clicado! Gerando QR Code...`);
        break;
      }
    } catch (e) {}
  }

  if (!foundPagar) {
    // Tira um print de debug se falhar ao encontrar o botão pagar
    await page.screenshot({ path: 'ANOTAÇÕES/debug-pagar-nao-encontrado.png' });
    throw new Error('Não foi possível encontrar o botão "Pagar" para gerar o Pix.');
  }

  // 3. Aguarda o QR Code aparecer e tira o print real
  console.log('[ROBO] Aguardando renderização do QR Code...');
  await page.waitForTimeout(10000);
  
  // Procura pelo QR Code (pode ser uma imagem ou o SVG que renderizamos no CheckoutPage)
  await page.screenshot({ path: 'ANOTAÇÕES/pix-qr-code-real.png', fullPage: true });
  console.log('[ROBO] QR Code capturado com sucesso em ANOTAÇÕES/pix-qr-code-real.png');

  console.log("\n" + "=".repeat(60));
  console.log("⏳ AGUARDANDO PAGAMENTO REAL (R$ 1,00)...");
  console.log("=".repeat(60) + "\n");

  // 4. Espera a tela de sucesso
  const successMessage = page.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado|Acesso Liberado/i).first();
  await expect(successMessage).toBeVisible({ timeout: 480000 });
  
  console.log('\n[ROBO] ✅ PAGAMENTO DETECTADO! GERANDO COMPROVANTE...');
  
  await page.screenshot({ path: 'ANOTAÇÕES/sucesso-pagamento.png', fullPage: true });
  
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (order?.status === 'PAID') {
     console.log('✅ Validação Finalizada: Banco de Dados ATUALIZADO.');
  }
});

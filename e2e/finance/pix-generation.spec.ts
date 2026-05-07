import { test, expect, Page } from '@playwright/test';

/** Helper para limpar modais que interceptam o clique (Z-Index) */
async function clearPopups(page: Page) {
  try {
    const closeBtn = page.locator('button').filter({ hasText: /Entendi|Fechar|Ok|IGNORAR POR ENQUANTO/i }).first();
    if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    const overlay = page.locator('.backdrop-blur-2xl').first();
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  } catch (e) {}
}

test.describe('Financial Flow: PIX Generation (Campinas)', () => {
  const domain = 'campinas.com.br';
  const slug = 'flash-campinas-e2e'; // Slug fixo no seed para estabilidade E2E

  test('should generate a PIX code for the Campinas event', async ({ page }) => {
    test.setTimeout(120000);
    console.log(`[PIX-TEST] Iniciando fluxo para o evento: ${slug}`);

    // 1. LOGIN DO CLIENTE
    page.on('console', msg => console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`));
    await page.goto('http://localhost:3000/login');
    await page.locator('input[type="email"]').fill(`cliente@${domain}`);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();
    await expect(page).toHaveURL(/.*dashboard|.*gallery|.*minha-conta|.*e\//, { timeout: 20000 });
    await clearPopups(page);

    // 2. IR PARA A GALERIA
    await page.goto(`http://localhost:3000/e/${slug}`);
    await page.waitForLoadState('networkidle');
    console.log('[PIX-TEST] Galeria carregada. Selecionando mídias...');

    // 3. SELECIONAR FOTOS ATÉ O BOTÃO DE CHECKOUT APARECER
    console.log('[PIX-TEST] Tentando selecionar fotos...');
    const photos = page.locator('.aspect-\\[3\\/4\\].cursor-pointer');
    await expect(photos.first()).toBeVisible({ timeout: 15000 });
    const count = await photos.count();
    console.log(`[PIX-TEST] Total de fotos encontradas: ${count}`);
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      console.log(`[PIX-TEST] Clicando na foto ${i + 1}...`);
      await photos.nth(i).click({ force: true });
      await page.waitForTimeout(1500);
      
      // Verifica se o valor no sidebar subiu (Investimento > 0)
      const investment = await page.locator('h2', { hasText: /^[1-9]/ }).first().isVisible().catch(() => false);
      console.log(`[PIX-TEST] Investimento detectado: ${investment}`);
      
      const isVisible = await page.locator('button').filter({ hasText: /Finalizar Compra|Comprar|Desbloquear/i }).first().isVisible();
      if (isVisible) break;
    }

    // 4. ABRIR CARRINHO E CHECKOUT
    const checkoutBtn = page.locator('button').filter({ hasText: /Pagar|Finalizar|Checkout|Comprar|Desbloquear/i }).first();
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();
    console.log('[PIX-TEST] Indo para o Checkout...');

    // 5. TRATAR IDENTIFICAÇÃO / LOGIN NO CHECKOUT
    await expect(page.getByText(/Protocolo Midnight Seguro/i)).not.toBeVisible({ timeout: 20000 });
    console.log('[PIX-TEST] Verificando necessidade de identificação...');
    const passwordInput = page.locator('input[type="password"]');
    const isAuthRequired = await passwordInput.isVisible({ timeout: 5000 }).catch(() => false);
    
    if (isAuthRequired) {
      console.log('[PIX-TEST] Preenchendo senha de confirmação...');
      await passwordInput.fill('123456');
      const authBtn = page.locator('button').filter({ hasText: /Continuar|Entrar|Acessar/i }).first();
      await authBtn.click();
      console.log('[PIX-TEST] Identificação enviada.');
    }

    // 6. SELECIONAR PIX NO MERCADO PAGO BRICK
    console.log('[PIX-TEST] Aguardando renderização do Mercado Pago...');
    try {
      await expect(page.locator('#paymentBrick_container')).toBeVisible({ timeout: 30000 });
    } catch (e) {
      console.log('[PIX-TEST] FALHA: Container não apareceu. Conteúdo da página:');
      const content = await page.content();
      console.log(content.substring(0, 5000)); // Imprime os primeiros 5000 caracteres
      throw e;
    }

    const pixOption = page.getByText(/Pix/i).first();
    await expect(pixOption).toBeVisible({ timeout: 20000 });
    await pixOption.click();
    console.log('[PIX-TEST] Opção PIX selecionada.');

    // 7. FINALIZAR COMPRA NO BRICK (Tratando Iframe e Botão Teimoso)
    console.log('[PIX-TEST] Buscando botão Pagar no Iframe do Mercado Pago...');
    
    const clickPagar = async () => {
      const mpIframe = page.frameLocator('iframe[name^="mp-bricks-iframe-payment"]');
      const brickBtn = mpIframe.locator('button, .andes-button').filter({ hasText: /Pagar|Confirmar/i }).first();
      const topBtn = page.locator('button, .andes-button').filter({ hasText: /Pagar|Confirmar/i }).first();

      if (await brickBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('[PIX-TEST] Clicando via Iframe...');
        await brickBtn.click({ force: true });
        return true;
      }
      if (await topBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('[PIX-TEST] Clicando via Top Level...');
        await topBtn.click({ force: true });
        return true;
      }
      return false;
    };

    // Retry loop de 3 tentativas
    for (let i = 0; i < 3; i++) {
      if (await clickPagar()) {
        console.log('[PIX-TEST] Clique enviado.');
        break;
      }
      await page.waitForTimeout(2000);
    }

    console.log('[PIX-TEST] Aguardando geração da Chave PIX...');

    // 8. VERIFICAR SUCESSO (QR Code e Botão de Copiar)
    console.log('[PIX-TEST] Verificando tela de sucesso...');
    const copyBtn = page.getByRole('button', { name: /COPIAR CÓDIGO PIX/i });
    await expect(copyBtn).toBeVisible({ timeout: 60000 });
    
    console.log('\n=========================================');
    console.log('💎 PIX GERADO COM SUCESSO! 💎');
    console.log('Tela de QR Code confirmada.');
    console.log('=========================================\n');
  });
});

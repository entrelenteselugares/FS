import { test, expect } from '@playwright/test';

test.describe('Financial Flow: PIX Generation (Campinas)', () => {
  const domain = 'campinas.com.br';
  const slug = 'flash-campinas-1778169228845'; // Slug gerado no seed

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

    // 2. IR PARA A GALERIA
    await page.goto(`http://localhost:3000/e/${slug}`);
    await page.waitForLoadState('networkidle');
    console.log('[PIX-TEST] Galeria carregada. Selecionando mídias...');

    // 3. SELECIONAR FOTOS ATÉ O BOTÃO DE CHECKOUT APARECER
    console.log('[PIX-TEST] Tentando selecionar fotos...');
    const photos = page.locator('.group');
    await expect(photos.first()).toBeVisible({ timeout: 15000 });
    const count = await photos.count();
    
    for (let i = 0; i < Math.min(count, 3); i++) {
      console.log(`[PIX-TEST] Clicando na foto ${i + 1}...`);
      await photos.nth(i).click({ force: true });
      await page.waitForTimeout(1000);
      
      const isVisible = await page.locator('button').filter({ hasText: /Pagar|Finalizar|Checkout|Comprar|Desbloquear/i }).first().isVisible();
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

    // 7. FINALIZAR COMPRA
    const confirmBtn = page.locator('button').filter({ hasText: /Confirmar|Finalizar|Pagar/i }).first();
    await confirmBtn.click();
    console.log('[PIX-TEST] Aguardando geração da Chave PIX...');

    // 8. EXTRAIR CHAVE PIX
    const pixCodeElement = page.locator('input[readonly], .pix-code, text=/.*[a-zA-Z0-9]{20,}.*/').first(); 
    await expect(pixCodeElement).toBeVisible({ timeout: 40000 });
    const pixCode = await pixCodeElement.inputValue().catch(() => pixCodeElement.innerText());

    console.log('\n=========================================');
    console.log('💎 CHAVE PIX GERADA COM SUCESSO! 💎');
    console.log(pixCode);
    console.log('=========================================\n');
  });
});

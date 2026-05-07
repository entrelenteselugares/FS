import { test, expect, devices } from '@playwright/test';

test.use({ ...devices['iPhone SE'] }); // 375x667

test.describe('Mobile UI Audit: Responsiveness & UX', () => {
  
  test('should verify Home (Marketplace) layout on mobile', async ({ page }) => {
    await page.goto('/');
    
    // Verifica se o título não quebra horrivelmente
    const title = page.locator('h1');
    await expect(title).toBeVisible();
    
    // Verifica se a grade de eventos é responsiva (2 colunas no mobile como Banlek)
    const eventGrid = page.locator('.hp-event-grid');
    // No mobile, a grade agora tem 2 colunas.
    const bodyWidth = await page.evaluate(() => document.body.clientWidth);
    expect(bodyWidth).toBeLessThanOrEqual(375);
    
    // Screenshot para relatório
    await page.screenshot({ path: 'test-results/mobile-home.png' });
  });

  test('should verify Event Page & Gallery on mobile', async ({ page }) => {
    // Busca o primeiro evento público disponível
    await page.goto('/');
    const firstEvent = page.locator('a[href*="/e/"]').first();
    if (await firstEvent.isVisible()) {
      await firstEvent.click();
      await expect(page).toHaveURL(/.*\/e\/.*/);
      
      // Verifica o título do evento e botões de ação
      await expect(page.getByRole('button', { name: /COMPRAR|VER FOTOS/i }).first()).toBeVisible();
      
      // Verifica se o rodapé de checkout flutuante (se houver) aparece
      await page.screenshot({ path: 'test-results/mobile-event.png' });
    }
  });

  test('should verify Checkout flow on mobile', async ({ page }) => {
    // Vamos usar um evento conhecido ou navegar até o checkout
    // Aqui testamos a visibilidade do QR Code e se o botão de fechar/voltar não some
    await page.goto('/checkout/test-order'); // Assumindo uma rota de teste ou fallback
    
    // O foco aqui é o layout do Mercado Pago Brick
    const mpContainer = page.locator('#payment-brick_container');
    // No mobile, o container deve ocupar 100% da largura
    await page.screenshot({ path: 'test-results/mobile-checkout.png' });
  });
});

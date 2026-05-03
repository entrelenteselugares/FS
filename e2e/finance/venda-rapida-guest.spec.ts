import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';

test.describe('Venda Rápida - Guest Checkout (Atrito Zero)', () => {
  let orderData: { orderId: string, guestToken: string, email: string };

  test.beforeAll(async () => {
    console.log('[SETUP] Creating guest order...');
    const output = execSync('npx ts-node -P backend/tsconfig.json backend/src/scripts/setup-guest-order.ts').toString();
    orderData = JSON.parse(output);
    console.log(`[SETUP] Guest Order Created: ${orderData.orderId}`);
  });

  test('Deve realizar checkout de atrito zero via Magic Link', async ({ page }) => {
    // ═══════════════════════════════════════════════════════════════════
    // FASE 1: Acesso via Magic Link — Sem login necessário
    // ═══════════════════════════════════════════════════════════════════
    console.log('[TEST] Phase 1: Accessing Magic Link...');
    
    const checkoutUrl = `/checkout?orderId=${orderData.orderId}&token=${orderData.guestToken}`;
    console.log(`[TEST] Navigating to: ${checkoutUrl}`);
    await page.goto(checkoutUrl);

    // ── Bypass de autenticação validado ────────────────────────────────
    // Quando order.isGuestOrder=true, o authStep vai para 'authorized'.
    // A tela deve mostrar "Finalizar Pagamento" + o brick do MP.
    // NÃO deve exibir campo de senha.
    await expect(page.getByText(/FINALIZAR PAGAMENTO/i)).toBeVisible({ timeout: 20000 });
    console.log('[TEST] ✅ Tela de pagamento carregada (authStep=authorized).');

    // Verifica que o campo de senha NÃO está visível (bypass de auth confirmado)
    await expect(page.getByPlaceholder(/Senha/i)).not.toBeVisible();
    console.log('[TEST] ✅ Campo de senha ausente — autenticação bypassada com sucesso.');

    // ── Resumo do pedido validado ──────────────────────────────────────
    // R$ 1,00 é o valor de penny-testing. Aparece 2x (subtotal + total), usamos .first()
    await expect(page.getByText('R$ 1.00').first()).toBeVisible();
    console.log('[TEST] ✅ Valor R$ 1.00 visível no resumo do pedido.');

    // Verifica que o brick do MP (iframe) está renderizado — gateway ativo
    const mpBrickContainer = page.locator('#paymentBrick_container iframe').first();
    await expect(mpBrickContainer).toBeVisible({ timeout: 15000 });
    console.log('[TEST] ✅ Brick do Mercado Pago renderizado no estado authorized.');
    
    // ── Validação do Botão de Pagamento ──────────────────────────────
    // O texto "Pix Copia e Cola" só aparece após clicar em Pagar.
    // Para este teste de atrito zero, validamos que o botão de checkout está pronto.
    await expect(page.getByRole('button', { name: /Pagar/i })).toBeVisible({ timeout: 10000 });
    console.log('[TEST] ✅ Gateway pronto para receber pagamento do Guest.');

    console.log('[TEST] 🎉 Venda Rápida (Magic Link / Atrito Zero) — PASSOU!');
  });
});

import { test, expect, Page } from '@playwright/test';

const E2E_EVENT_SLUG = 'e2e-marketplace-test';

async function loginAsProfissional(page: Page) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill('e2e-profissional@fotosegundo.test');
  await page.locator('input[type="password"]').fill('123456');
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  await expect(page).toHaveURL(/.*(admin|profissional|minha-conta|unidade-fixa)/, { timeout: 20000 });
}

/**
 * Ponto Fixo (Cash) — Fluxo de Venda Balcão
 *
 * Estratégia correta:
 * 1. Admin já logado acessa o marketplace
 * 2. Admin seleciona foto → cria pedido (buyerEmail = admin email)
 * 3. Checkout reconhece admin logado → vai para authStep="authorized"
 * 4. Botão "Confirmar Recebimento em Dinheiro" fica visível
 * 5. Admin aceita o confirm() dialog → pagamento aprovado
 *
 * O botão cash exige: authUser.role === 'ADMIN' && authStep === 'authorized'
 * Isso só acontece quando o comprador logado É o admin.
 */
test.describe('Financial Flow: Ponto Fixo (Cash)', () => {

  test('admin selects photo and completes cash sale bypassing the gateway', async ({ page }) => {

    // ─── 1. Login como Profissional ─────────────────────────────────────
    await loginAsProfissional(page);

    // ─── 2. Acessa o marketplace de teste ───────────────────────────────
    await page.goto(`/e/${E2E_EVENT_SLUG}`);

    // Para o admin (isOwner=true), o event.type='PHOTO_MARKETPLACE' ainda
    // renderiza o grid de fotos normalmente
    await page.waitForSelector('.aspect-\\[3\\/4\\]', { timeout: 20000 });

    // ─── 3. Seleciona uma foto ainda disponível (não comprada) ──────────
    // Fotos compradas/desbloqueadas têm classe "border-brand-tactical cursor-default"
    // Fotos selecionáveis têm "cursor-pointer" e NÃO têm "border-brand-tactical"
    const selectablePhoto = page.locator('.aspect-\\[3\\/4\\].cursor-pointer').first();
    await expect(selectablePhoto).toBeVisible({ timeout: 10000 });
    await selectablePhoto.click();
    // Após o clique, a foto deve ter border-emerald-500 (selecionada)
    await expect(selectablePhoto).toHaveClass(/border-emerald-500/, { timeout: 5000 });
    console.log('[TEST] ✅ Photo selected by admin.');

    // ─── 4. Clica em "Finalizar Compra" ────────────────────────────────
    // O botão fica na sidebar do marketplace (corrigido nesta sessão)
    const finalizeBtn = page.getByRole('button', { name: /Finalizar Compra/i });
    await expect(finalizeBtn).toBeVisible({ timeout: 10000 });
    await finalizeBtn.click();

    // ─── 5. Vai para o Checkout (pedido criado com email do admin) ──────
    await expect(page).toHaveURL(/\/checkout\/[a-z0-9]+/, { timeout: 20000 });
    console.log(`[TEST] ✅ Checkout URL: ${page.url()}`);

    // ─── 6. Checkout reconhece admin → authStep="authorized" ────────────
    // buyerEmail = admin email → admin logado → autorizado automaticamente
    const cashBtn = page.getByRole('button', { name: /Confirmar Recebimento em Dinheiro/i });
    await expect(cashBtn).toBeVisible({ timeout: 25000 });
    console.log('[TEST] ✅ Cash button visible — authStep=authorized confirmed.');

    // ─── 7. Aceita o confirm() nativo do browser ──────────────────────
    // window.confirm() precisa ser aceito pelo Playwright antes de clicar
    page.once('dialog', async dialog => {
      console.log(`[TEST] 🔔 Dialog: "${dialog.message()}" → Accepting`);
      await dialog.accept();
    });

    // ─── 8. Confirma o pagamento ─────────────────────────────────────
    await cashBtn.click();

    // ─── 9. Tela de sucesso: "PAGAMENTO CONFIRMADO" ───────────────────
    await expect(
      page.getByText(/PAGAMENTO CONFIRMADO/i)
    ).toBeVisible({ timeout: 20000 });

    console.log('[TEST] ✅ Ponto Fixo Cash PASSED!');
  });
});

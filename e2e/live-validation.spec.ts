import { test, expect } from '@playwright/test';

/**
 * PROVA SOCIAL: Validação de Fluxo Financeiro
 * Utiliza cupom TEST100 (100% de desconto) para completar o checkout
 * automaticamente, sem depender de pagamento manual via PIX.
 */
test.describe('PROVA SOCIAL: Validação de Fluxo Financeiro (Cupom 100%)', () => {

  test('Deve aplicar cupom 100% e concluir checkout sem pagamento manual', async ({ page }) => {
    test.setTimeout(120000);

    const email = `valida-${Date.now()}@brasil.com.br`;
    console.log(`\n[ROBO] Iniciando validação automática para: ${email}`);

    // 1. Navegação para a home
    await page.goto('http://localhost:3001/');
    await page.waitForLoadState('networkidle');

    // 2. Fluxo de Agendamento
    await page.getByRole('button', { name: 'Agendar', exact: true }).click();
    await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();

    // Seleciona a primeira unidade disponível
    await page.getByRole('combobox').waitFor({ state: 'visible' });
    await page.getByRole('combobox').selectOption({ index: 1 });

    // Seleção de Data
    await page.getByText(/SELECIONE A DATA/i).first().click();
    await page.getByRole('button', { name: '28', exact: true }).first().click().catch(() => {
      return page.getByTitle('Próximo Mês').click().then(() =>
        page.getByRole('button', { name: '15', exact: true }).first().click()
      );
    });

    await page.getByRole('button', { name: /CONFIRMAR/i }).click();
    await page.getByRole('button', { name: /PRÓXIMO/i }).click();

    // Configuração
    await page.getByText(/Fotografia|Cobertura|Serviço/i).first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();

    // Identificação
    await page.getByPlaceholder(/NOME/i).fill('Validador Automático');
    await page.getByPlaceholder(/CONTATO@/i).fill(email);
    await page.getByPlaceholder(/119/i).fill('11988888888');
    await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click();

    // 3. Aguarda Checkout
    await page.waitForURL(/checkout/, { timeout: 45000 });
    console.log('[ROBO] Redirecionado para o Checkout.');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000); // Espera o Brick/UI carregar

    // 4. Aplica Cupom TEST100 (100% OFF)
    console.log('[ROBO] Aplicando cupom TEST100...');
    const couponInput = page.locator('input[placeholder="Código do Cupom"]');
    await expect(couponInput).toBeVisible({ timeout: 20000 });
    await couponInput.fill('TEST100');

    const applyBtn = page.getByRole('button', { name: /Aplicar/i });
    await expect(applyBtn).toBeVisible({ timeout: 5000 });
    await applyBtn.click();

    // Cupom aplicado — página mostra alerta e total vai a R$ 0,00
    // Aguarda diálogo de confirmação (alert nativo do browser) ou feedback visual
    page.on('dialog', dialog => dialog.accept());
    await page.waitForTimeout(2000);

    // 5. Clica em "Resgatar Gratuitamente" (aparece quando total = R$ 0)
    console.log('[ROBO] Clicando em Resgatar Gratuitamente...');
    const freeBtn = page.getByRole('button', { name: /Resgatar Gratuitamente/i });
    await expect(freeBtn).toBeVisible({ timeout: 15000 });
    await freeBtn.click();

    // 6. Valida tela de sucesso
    console.log('[ROBO] Aguardando tela de sucesso...');
    await expect(
      page.getByText(/Missão Cumprida|PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()
    ).toBeVisible({ timeout: 30000 });

    console.log('\n[ROBO] ✅ FLUXO COMPLETO VALIDADO — Cupom 100% OFF funcionando!');
  });

});

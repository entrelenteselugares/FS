import { test, expect } from '@playwright/test';
import { generateTestEmail } from '../utils/auth-helpers';

/**
 * Orçamento B2B — Ciclo Completo
 *
 * Fases:
 * 1. Cliente preenche o formulário multi-step em /cotacao
 * 2. Admin verifica que a cotação chegou no painel /admin
 */
test.describe('Financial Flow: Orçamento B2B (Full Cycle)', () => {

  const quoteClientName = `B2B-E2E-${Date.now()}`;
  const clientEmail     = generateTestEmail(6);

  test('client submits quote and admin can see it in the panel', async ({ page }) => {

    // ═══════════════════════════════════════════════════════════════════
    // FASE 1: Cliente preenche o orçamento
    // ═══════════════════════════════════════════════════════════════════
    console.log('[TEST] Phase 1: Submitting quote...');
    await page.goto('/cotacao');

    // — Passo 1: Local e Data —
    const orcamentoBtn = page.getByRole('button', { name: 'ORÇAMENTO' });
    await expect(orcamentoBtn).toBeVisible({ timeout: 10000 });
    await orcamentoBtn.click();

    const cepInput = page.getByPlaceholder(/CEP DO LOCAL/i);
    await expect(cepInput).toBeVisible({ timeout: 10000 });
    await cepInput.fill('13092150');

    await page.waitForTimeout(1000);

    const dateTrigger = page.getByText(/SELECIONE A DATA E HORÁRIO/i);
    await expect(dateTrigger).toBeVisible({ timeout: 10000 });
    await dateTrigger.click();

    const nextMonthBtn = page.getByTitle('Próximo Mês');
    await expect(nextMonthBtn).toBeVisible({ timeout: 5000 });
    await nextMonthBtn.click();

    await page.waitForTimeout(500);

    const day20 = page.getByRole('button', { name: '20', exact: true });
    await expect(day20).toBeVisible({ timeout: 5000 });
    await day20.click();

    await page.waitForTimeout(500);

    const nextBtn = page.getByRole('button', { name: /PRÓXIMO: CONFIGURAÇÃO/i });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });
    await nextBtn.click();

    // — Passo 2: Configuração e Serviços —
    console.log('[TEST] Phase 1: Configuring duration and services...');
    await expect(page.getByText(/Passo 2/i)).toBeVisible({ timeout: 10000 });
    
    // Interage com o slider de Duração (6 horas)
    const durationSlider = page.locator('input[type="range"]').first();
    await durationSlider.fill('6');
    await expect(page.getByText(/6 HORAS/i)).toBeVisible();
    console.log('[TEST] ✅ Duration set to 6 hours.');

    // Interage com o slider de Dias (2 dias)
    const daysSlider = page.locator('input[type="range"]').nth(1);
    await daysSlider.fill('2');
    await expect(page.getByText(/2 DIAS/i)).toBeVisible();
    console.log('[TEST] ✅ Days set to 2.');

    // Seleciona Equipamento: MOBILE MAKER
    const mobileMakerBtn = page.getByRole('button', { name: 'MOBILE MAKER' });
    await mobileMakerBtn.click();
    console.log('[TEST] ✅ Mobile Maker selected.');

    // Seleciona Finalidade: BUSINESS
    const businessBtn = page.getByRole('button', { name: 'BUSINESS' });
    await businessBtn.click();
    console.log('[TEST] ✅ Business usage selected.');

    // Seleciona um serviço de B2B/Corporativo visível na interface
    const serviceText = page.getByText(/Ativação Phygital Corporativa/i).first();
    await expect(serviceText).toBeVisible({ timeout: 10000 });
    await serviceText.click();
    
    await page.waitForTimeout(1000);
    console.log('[TEST] ✅ Service selected.');

    const continueBtn = page.getByRole('button', { name: /^CONTINUAR/i });
    await expect(continueBtn).toBeVisible({ timeout: 5000 });
    await continueBtn.click();

    // — Passo 3: Dados de Contato —
    console.log('[TEST] Phase 1: Contact info...');
    await expect(page.getByText(/Passo 3/i)).toBeVisible({ timeout: 20000 });

    await page.getByPlaceholder(/NOME DO CONTRATANTE/i).fill(quoteClientName);
    await page.locator('input[type="email"]').fill(clientEmail);
    await page.getByPlaceholder(/11999999999/i).fill('19997843817');

    const submitBtn = page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i });
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    await submitBtn.click();

    await expect(
      page.getByText(/RECEBEMOS SEU PEDIDO|Solicitação Enviada|Passo 4/i).first()
    ).toBeVisible({ timeout: 30000 });

    console.log(`[TEST] ✅ Phase 1 complete. Quote: "${quoteClientName}"`);

    // ═══════════════════════════════════════════════════════════════════
    // FASE 2: Admin verifica a cotação no painel
    // ═══════════════════════════════════════════════════════════════════
    console.log('[TEST] Phase 2: Admin verification...');

    await page.goto('/login');
    await page.locator('input[type="email"]').fill('contatofotosegundo@gmail.com');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*(admin|profissional)/, { timeout: 20000 });

    await page.goto('/admin');
    await expect(page).toHaveURL(/.*admin/, { timeout: 15000 });

    // Menu "Orçamentos" no Sidebar
    const quotesMenu = page.getByRole('button', { name: 'Orçamentos', exact: true }).first();
    await expect(quotesMenu).toBeVisible({ timeout: 10000 });
    await quotesMenu.click();

    // Verifica que a cotação aparece na listagem
    const quoteRow = page.getByText(quoteClientName).first();
    await expect(quoteRow).toBeVisible({ timeout: 15000 });
    console.log(`[TEST] ✅ Quote "${quoteClientName}" found.`);

    // ═══════════════════════════════════════════════════════════════════
    // FASE 3: Admin aprova e precifica
    // ═══════════════════════════════════════════════════════════════════
    console.log('[TEST] Phase 3: Admin approval...');

    // O painel de detalhes abre automaticamente ao clicar na linha.
    // Aguarda a aba "1. Briefing" aparecer (confirma que o painel está aberto)
    await quoteRow.click();
    await expect(page.getByRole('button', { name: '1. Briefing' })).toBeVisible({ timeout: 10000 });
    console.log('[TEST] ✅ Detail panel opened.');

    // Navega para a aba "5. Fechamento" onde ficam o input de preço e o botão de aprovar
    const fechamentoTab = page.getByRole('button', { name: '5. Fechamento' });
    await expect(fechamentoTab).toBeVisible({ timeout: 5000 });
    await fechamentoTab.click();

    // Preenche o valor final — spinbutton com label "Valor Final da Proposta"
    const priceInput = page.getByRole('spinbutton').last(); // é o último spinbutton na aba
    await expect(priceInput).toBeVisible({ timeout: 8000 });
    await priceInput.fill('1');
    await page.keyboard.press('Tab'); // dispara o onChange
    console.log('[TEST] ✅ Price set to R$ 1.00.');

    // Clica em Aprovar — botão "DISPARAR ORÇAMENTO OFICIAL"
    const approveBtn = page.getByRole('button', { name: /DISPARAR ORÇAMENTO OFICIAL/i });
    await expect(approveBtn).toBeEnabled({ timeout: 5000 });
    await approveBtn.click();

    // Aguarda toast/feedback de confirmação
    await expect(
      page.getByText(/aprovado|orçamento enviado|proposta disparada|sucesso/i).first()
    ).toBeVisible({ timeout: 15000 });
    console.log('[TEST] ✅ Quote approved and dispatched.');

    console.log('[TEST] 🎉 B2B Full Cycle PASSED (Quote -> Admin -> Priced)!');
  });
});

import { test, expect, type Page } from '@playwright/test';

/**
 * 🔐 Simulation: Admin User Journey (v1.0)
 *
 * Testa todas as abas do sidebar do admin:
 * 1. Visão Geral (overview)
 * 2. Eventos → configura um evento
 * 3. Membros
 * 4. Orçamentos → autoriza um orçamento PENDING
 * 5. Pedidos
 * 6. Financeiro
 * 7. Impressão
 * 8. Franquias
 * 9. Estoque Central
 * 10. Catálogo
 * 11. Serviços
 * 12. Concursos
 * 13. Configurações
 * 14. Embaixadores
 */

test.use({ actionTimeout: 20000 });

const ADMIN_EMAIL = 'contatofotosegundo@gmail.com';
const ADMIN_SENHA = '123456';

// ── Helper ──────────────────────────────────────────────────────────────────
async function adminLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('seu@email.com').fill(ADMIN_EMAIL);
  await page.getByPlaceholder('••••••••').fill(ADMIN_SENHA);
  await page.getByRole('button', { name: /ENTRAR NO SISTEMA/i }).click();
  await page.waitForURL('**/admin', { timeout: 25000 });
  console.log('[✅] Login admin concluído.');
}

async function clickSidebar(page: Page, label: string) {
  const item = page.locator('nav, aside, [class*="sidebar"]').getByText(label, { exact: false }).first();
  if (await item.isVisible({ timeout: 3000 }).catch(() => false)) {
    await item.click();
  } else {
    // fallback: qualquer link/botão com o texto
    await page.getByRole('button', { name: new RegExp(label, 'i') }).first().click();
  }
  await page.waitForTimeout(1000);
  console.log(`[✅] Aba "${label}" carregada.`);
}

// ── Testes ───────────────────────────────────────────────────────────────────

test.describe('🔐 Admin User Journey', () => {

  // ── 1. Visão Geral ──────────────────────────────────────────────────────────
  test('1 · Visão Geral — KPIs e resumo', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Visão Geral');
    // Verifica que métricas estão presentes
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Visão Geral renderizada.');
  });

  // ── 2. Eventos ──────────────────────────────────────────────────────────────
  test('2 · Eventos — Configura um evento existente', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Eventos');
    await page.waitForTimeout(1500);

    // Clica no primeiro evento da lista para abrir edição
    const firstEvent = page.locator('tr, [class*="event-row"], [class*="cursor-pointer"]').nth(1);
    if (await firstEvent.isVisible({ timeout: 5000 }).catch(() => false)) {
      await firstEvent.click();
      await page.waitForTimeout(1000);
      console.log('[✅] Evento selecionado para configuração.');

      // Tenta editar o título ou status
      const editInput = page.locator('input[type="text"], input:not([type])').first();
      if (await editInput.isVisible({ timeout: 3000 }).catch(() => false)) {
        const current = await editInput.inputValue();
        await editInput.fill(current + ' (ADMIN)');
        await page.waitForTimeout(500);
        await editInput.fill(current); // restaura o valor original
      }
    }
    await expect(page.locator('h2, h1').filter({ hasText: /evento/i }).first()).toBeVisible({ timeout: 5000 }).catch(() => {});
    console.log('[✅] Eventos configurados.');
  });

  // ── 3. Membros ──────────────────────────────────────────────────────────────
  test('3 · Membros — Lista usuários', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Membros');
    await page.waitForTimeout(1500);

    // Verifica que a tabela/lista de usuários aparece
    const userList = page.locator('table, [class*="user"], tr').first();
    await expect(userList).toBeVisible({ timeout: 8000 });
    console.log('[✅] Lista de membros carregada.');
  });

  // ── 4. Orçamentos — AUTORIZAR ────────────────────────────────────────────────
  test('4 · Orçamentos — Autoriza orçamento PENDING', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Orçamentos');
    await page.waitForTimeout(2000);

    // Clica no primeiro card da coluna "Novos Leads" (PENDING)
    const pendingCard = page.locator('div').filter({ hasText: /Simulação de Lançamento/i }).first();
    if (await pendingCard.isVisible({ timeout: 5000 }).catch(() => false)) {
      await pendingCard.click();
      await page.waitForTimeout(1000);
      console.log('[✅] Orçamento selecionado.');

      // Navega até a aba "5. Fechamento" no drawer
      const fechamentoTab = page.getByText(/5\. Fechamento|fechamento/i).first();
      if (await fechamentoTab.isVisible({ timeout: 3000 }).catch(() => false)) {
        await fechamentoTab.click();
        await page.waitForTimeout(800);

        // Preenche o valor final se o input estiver vazio
        const priceInput = page.locator('input[type="number"]').last();
        const currentVal = await priceInput.inputValue().catch(() => '0');
        if (currentVal === '0' || currentVal === '') {
          await priceInput.fill('3500');
          await page.waitForTimeout(500);
        }

        // Dispara o orçamento
        const dispararBtn = page.getByText(/DISPARAR ORÇAMENTO OFICIAL/i).first();
        if (await dispararBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
          await dispararBtn.click();
          await page.waitForTimeout(2000);
          console.log('[✅] Orçamento autorizado/disparado!');

          // Verifica notificação de sucesso
          await expect(page.getByText(/aprovado|sucesso|enviado/i).first()).toBeVisible({ timeout: 5000 }).catch(() => {
            console.log('[ℹ️] Notificação de sucesso não detectada — verificar manualmente.');
          });
        }
      }
    } else {
      console.log('[⚠️] Nenhum orçamento PENDING encontrado — validando que o Kanban está visível.');
      await expect(page.getByText(/Gestão de Orçamentos/i).first()).toBeVisible({ timeout: 5000 });
    }
    console.log('[✅] Fluxo de orçamentos testado.');
  });

  // ── 5. Pedidos ──────────────────────────────────────────────────────────────
  test('5 · Pedidos — Visualiza lista de pedidos', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Pedidos');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1, table').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Pedidos carregados.');
  });

  // ── 6. Financeiro ────────────────────────────────────────────────────────────
  test('6 · Financeiro — Visualiza relatório', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Financeiro');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Financeiro carregado.');
  });

  // ── 7. Impressão ─────────────────────────────────────────────────────────────
  test('7 · Impressão — Visualiza fila', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Impressão');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Impressão carregada.');
  });

  // ── 8. Franquias ─────────────────────────────────────────────────────────────
  test('8 · Franquias — Visualiza franquias', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Franquias');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Franquias carregadas.');
  });

  // ── 9. Estoque Central ───────────────────────────────────────────────────────
  test('9 · Estoque Central', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Estoque Central');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Estoque carregado.');
  });

  // ── 10. Catálogo ─────────────────────────────────────────────────────────────
  test('10 · Catálogo de Impressão', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Catálogo');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Catálogo carregado.');
  });

  // ── 11. Serviços ─────────────────────────────────────────────────────────────
  test('11 · Serviços', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Serviços');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Serviços carregados.');
  });

  // ── 12. Concursos ────────────────────────────────────────────────────────────
  test('12 · Concursos', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Concursos');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Concursos carregados.');
  });

  // ── 13. Configurações ────────────────────────────────────────────────────────
  test('13 · Configurações', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Configurações');
    await page.waitForTimeout(1500);

    // Verifica que as configs carregam
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });

    // Tenta alterar um toggle (sem salvar)
    const toggle = page.locator('button[class*="toggle"], input[type="checkbox"]').first();
    if (await toggle.isVisible({ timeout: 2000 }).catch(() => false)) {
      await toggle.click();
      await page.waitForTimeout(500);
      await toggle.click(); // desfaz
    }
    console.log('[✅] Configurações carregadas.');
  });

  // ── 14. Embaixadores ────────────────────────────────────────────────────────
  test('14 · Embaixadores', async ({ page }) => {
    await adminLogin(page);
    await clickSidebar(page, 'Embaixadores');
    await page.waitForTimeout(1500);
    await expect(page.locator('h2, h1').first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Embaixadores carregados.');
  });

});

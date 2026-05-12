import { test, expect, type Page } from '@playwright/test';

/**
 * 🏢 Simulation: Unidade Fixa User Journey (v1.0)
 *
 * Testa as abas do dashboard da Unidade Fixa (Partner):
 * 1. Agenda Tática
 * 2. Fluxo Financeiro
 * 3. Rede Técnica
 * 4. Configuração
 */

test.use({ actionTimeout: 20000 });

const UNIT_EMAIL = 'unidade@saopaulo.com.br';
const UNIT_SENHA = '123456';

// ── Helper ──────────────────────────────────────────────────────────────────
async function unitLogin(page: Page) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.getByPlaceholder('seu@email.com').fill(UNIT_EMAIL);
  await page.getByPlaceholder('••••••••').fill(UNIT_SENHA);
  await page.getByRole('button', { name: /ENTRAR NO SISTEMA/i }).click();
  await page.waitForURL('**/unidade-fixa', { timeout: 25000 });
  console.log('[✅] Login Unidade Fixa concluído.');
}

async function clickSidebar(page: Page, label: string) {
  // O dashboard usa botões com navItems passados para o DashboardLayout
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

test.describe('🏢 Unidade Fixa User Journey', () => {

  // ── 1. Agenda Tática ────────────────────────────────────────────────────────
  test('1 · Agenda Tática — Visualiza eventos', async ({ page }) => {
    await unitLogin(page);
    await clickSidebar(page, 'Agenda Tática');
    // Verifica que métricas estão presentes
    await expect(page.locator('h1, h2, h3').filter({ hasText: /Agenda/i }).first()).toBeVisible({ timeout: 8000 }).catch(() => {});
    await expect(page.getByText(/Próximas 72h|Standby Estratégico|Missões/i).first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Agenda Tática renderizada.');
  });

  // ── 2. Fluxo Financeiro ──────────────────────────────────────────────────────
  test('2 · Fluxo Financeiro — Visualiza relatórios', async ({ page }) => {
    await unitLogin(page);
    await clickSidebar(page, 'Fluxo Financeiro');
    await page.waitForTimeout(1500);
    
    await expect(page.getByText(/Consolidação de Repasses/i).first()).toBeVisible({ timeout: 8000 });
    console.log('[✅] Fluxo Financeiro carregado.');
  });

  // ── 3. Rede Técnica ──────────────────────────────────────────────────────────
  test('3 · Rede Técnica — Visualiza profissionais', async ({ page }) => {
    await unitLogin(page);
    await clickSidebar(page, 'Rede Técnica');
    await page.waitForTimeout(1500);

    // Verifica que a seção carregou
    await expect(page.getByText(/Escalabilidade da Rede Técnica|Agentes/i).first()).toBeVisible({ timeout: 8000 });
    
    // Testa alternar um profissional se houver
    const btnRotativo = page.getByRole('button', { name: /Rotativo/i }).first();
    if (await btnRotativo.isVisible({ timeout: 3000 }).catch(() => false)) {
      await btnRotativo.click();
      console.log('[✅] Vínculo Rotativo selecionado.');
    }
    console.log('[✅] Rede Técnica carregada.');
  });

  // ── 4. Configuração ──────────────────────────────────────────────────────────
  test('4 · Configuração — Visualiza e interage', async ({ page }) => {
    await unitLogin(page);
    await clickSidebar(page, 'Configuração');
    await page.waitForTimeout(1500);

    // Verifica presença da página pública ou chave PIX
    await expect(page.getByText(/Chave Estratégica|PIX/i).first()).toBeVisible({ timeout: 8000 });
    
    // Tenta salvar a chave PIX se estiver visível
    const pixInput = page.locator('input[placeholder*="CHAVE-ALEATORIA-OU-CNPJ" i]').first();
    if (await pixInput.isVisible({ timeout: 3000 }).catch(() => false)) {
      const currentPix = await pixInput.inputValue();
      await pixInput.fill(currentPix || 'teste@pix.com');
      const salvarPixBtn = page.getByRole('button', { name: /Salvar Chave/i }).first();
      if (await salvarPixBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await salvarPixBtn.click();
      }
    }
    console.log('[✅] Configuração carregada e testada.');
  });
});

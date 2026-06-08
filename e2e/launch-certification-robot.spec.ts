import { test, expect, Page } from '@playwright/test';

/**
 * 🚀 Launch Certification Robot (Golden Stable)
 *
 * Estratégia de navegação:
 * - Admin: URL deep-links (nav é agrupada em acordeões)
 * - Outros painéis: clicar nos itens de nav flat do DashboardLayout
 */

const ROLES = {
  ADMIN: 'contatofotosegundo@gmail.com',
  PROFESSIONAL: 'fotografo@brasil.com.br',
  UNIT: 'unidade-sp@brasil.com.br',
  CLIENT: 'cliente-vip@brasil.com.br',
};

const PASS = '123456';

async function login(page: Page, email: string) {
  await page.goto('/login');

  // Bypass onboarding tour overlays que podem bloquear interações
  // ATENÇÃO: a chave deve incluir a versão: fs_tour_v1_${role} (ver WelcomeTour.tsx TOUR_VERSION)
  await page.evaluate(() => {
    localStorage.setItem('fs_tour_v1_PROFISSIONAL', 'true');
    localStorage.setItem('fs_tour_v1_CARTORIO', 'true');
    // CLIENT não possui tour, mas mantemos por consistência
    localStorage.setItem('fs_tour_v1_CLIENT', 'true');
  });

  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole('button', { name: /ENTRAR|ENTRAR NO SISTEMA/i }).click();

  // Captura erros de UI para falhar rápido com mensagem útil
  const errorAlert = page.locator('.bg-red-500\\/10');

  try {
    await page.waitForURL(/\/(admin|profissional|unidade-fixa|franquia|minha-conta)/, { timeout: 15000 });
  } catch {
    if (await errorAlert.isVisible()) {
      const msg = await errorAlert.innerText();
      throw new Error(`Login falhou com erro de UI: ${msg}`);
    }
    throw new Error(`Timeout aguardando URL após login. URL atual: ${page.url()}`);
  }
}

test.describe('🏁 Launch Certification Suite v3.2', () => {

  test('Certification: ADMINISTRADOR (Master Control)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Admin...');
    await login(page, ROLES.ADMIN);

    // 1. Visão Geral — confirma que o dashboard carregou
    await expect(page.getByText(/Visão Geral/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Pedidos — sub-item de "Comercial" → navega via URL
    await page.goto('/admin/orders');
    await expect(page.getByText(/Pedidos|Gestão de Pedidos|Lista de Pedidos/i).first()).toBeVisible({ timeout: 10000 });

    // 3. Financeiro — sub-item de "Sistema" → navega via URL
    await page.goto('/admin/finance');
    await expect(page.getByText(/Controle de Repasses|Fluxo|Financeiro/i).first()).toBeVisible({ timeout: 10000 });

    // 4. Catálogo de Impressão → navega via URL
    await page.goto('/admin/print-catalog');
    await expect(page.getByText(/Catálogo de Impressão|Catálogo/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Certificação Admin Concluída.');
  });

  test('Certification: PROFISSIONAL (Lifecycle & Reference)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Profissional...');
    await login(page, ROLES.PROFESSIONAL);
    await page.goto('/profissional');

    // 1. Dashboard carregou — verifica KPI ou nav item de agenda
    await expect(page.getByText(/Agenda|Fluxo Financeiro|Foto Point/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Navega para Fluxo Financeiro via botão de nav
    await page.getByRole('button', { name: /Fluxo Financeiro|Financeiro/i }).first().click();
    await expect(page.getByText(/Saldo|Performance|Receber/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Certificação Profissional Concluída.');
  });

  test('Certification: UNIDADE FIXA (IoT & Queue)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Unidade Fixa...');
    await login(page, ROLES.UNIT);
    await page.goto('/unidade-fixa');

    // 1. Dashboard carregou — verifica elemento de KPI ou nav
    await expect(page.getByText(/Agenda Tática|Fluxo Financeiro|Rede Técnica/i).first()).toBeVisible({ timeout: 15000 });

    // 2. Navega para Agenda Tática (sempre disponível, independente de franchiseProfile)
    await page.getByRole('button', { name: /Agenda Tática/i }).first().click();
    await expect(page.getByText(/Evento|Sem eventos|próximo|Agenda/i).first()).toBeVisible({ timeout: 10000 });

    // 3. Navega para Fluxo Financeiro
    await page.getByRole('button', { name: /Fluxo Financeiro/i }).first().click();
    await expect(page.getByText(/Repasse|Saldo|Financeiro|R\$/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Certificação Unidade Fixa Concluída.');
  });

  test('Certification: CLIENTE (Vault & Thumbnails Fix)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Cliente...');
    await login(page, ROLES.CLIENT);
    await page.goto('/minha-conta');

    // 1. Área do cliente carregou — verifica via URL (evita pegar o span oculto do bottom-nav)
    await page.waitForURL(/\/minha-conta/, { timeout: 15000 });
    // Aguarda que pelo menos um elemento de conteúdo principal seja visível
    await expect(page.locator('main, [class*="DashboardLayout"], [data-testid="client-area"], h1, h2').first()).toBeVisible({ timeout: 15000 });

    // 2. Álbuns — navega via URL e verifica que a página renderizou
    await page.goto('/meus-albuns');

    // Aguarda o estado de carga inicial terminar (spinner some)
    await expect(page.locator('.animate-pulse').first()).not.toBeVisible({ timeout: 10000 }).catch(() => {});

    // Verifica estado vazio OU cards de álbum
    const emptyState = page.getByText(/NENHUM ÁLBUM AINDA/i).first();
    const albumCard  = page.locator('[class*="cursor-pointer"]').first();
    const btnNovo    = page.getByRole('button', { name: /NOVO ÁLBUM/i }).first();

    await expect(async () => {
      const hasEmpty = await emptyState.isVisible();
      const hasCard  = await albumCard.isVisible();
      const hasBtn   = await btnNovo.isVisible();
      expect(hasEmpty || hasCard || hasBtn).toBeTruthy();
    }).toPass({ timeout: 12000 });

    // Se há álbuns, abre o primeiro e verifica que carregou
    if (await albumCard.isVisible()) {
      await albumCard.click();
      await page.waitForLoadState('networkidle');
      // Verifica que algum conteúdo do álbum está visível
      await expect(page.getByText(/Foto|Sem fotos|foto/i).first()).toBeVisible({ timeout: 10000 });
    }

    console.log('[ROBOT] ✅ Certificação Cliente Concluída.');
  });

});

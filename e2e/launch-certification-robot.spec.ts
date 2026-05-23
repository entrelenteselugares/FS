import { test, expect, Page } from '@playwright/test';

/**
 * 🚀 Launch Certification Robot (Golden Stable)
 * 
 * Este robô foi atualizado para seguir rigorosamente as instruções de certificação 
 * contidas em: ANOTAÇÕES/TESTE DE LANÇAMENTO
 */

const ROLES = {
  ADMIN: 'contatofotosegundo@gmail.com', // Admin Master
  PROFESSIONAL: 'fotografo@brasil.com.br',
  UNIT: 'unidade-sp@brasil.com.br',
  FRANCHISE: 'franqueado-ouro@brasil.com.br',
  CLIENT: 'cliente-vip@brasil.com.br'
};

const PASS = '123456';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.evaluate(() => {
    localStorage.setItem('fs_tour_PROFISSIONAL', 'true');
    localStorage.setItem('fs_tour_CARTORIO', 'true');
  });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole('button', { name: /ENTRAR|ENTRAR NO SISTEMA/i }).click();
  // Aguarda o roteamento dinâmico do DashboardRedirect
  await page.waitForURL(/\/(admin|profissional|unidade-fixa|franquia|minha-conta)/, { timeout: 20000 });
}

test.describe('🏁 Launch Certification Suite v3.2', () => {

  test('Certification: ADMINISTRADOR (Master Control)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Admin...');
    await login(page, ROLES.ADMIN);
    
    // 1. Validação de KPIs Globais (Espera o dashboard carregar)
    await expect(page.getByText(/Visão Geral/i).first()).toBeVisible({ timeout: 15000 });
    
    // 2. Auditoria de Pedidos (API Admin Fix Check)
    await page.getByRole('button', { name: /PEDIDOS/i }).click();
    await expect(page.getByRole('heading', { name: /Gestão de Pedidos|Auditoria de Projetos|Lista de Pedidos/i })).toBeVisible();
    
    // 3. Auditoria Financeira
    await page.getByRole('button', { name: /FINANCEIRO/i }).click();
    await expect(page.getByText(/Controle de Repasses|Fluxo/i).first()).toBeVisible();
    
    // 4. Catálogo de Impressão
    await page.getByRole('button', { name: /^Catálogo$/i }).click();
    await expect(page.getByRole('heading', { name: /Catálogo de Impressão/i })).toBeVisible();
    
    console.log('[ROBOT] ✅ Certificação Admin Concluída.');
  });

  test('Certification: PROFISSIONAL (Lifecycle & Reference)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Profissional...');
    await login(page, ROLES.PROFESSIONAL);
    await page.goto('/profissional');

    // 1. Criação de Evento (Interface)
    await page.getByRole('button', { name: /Foto Point/i }).first().click();
    await expect(page.getByText(/Configurar Ponto de Venda/i).first()).toBeVisible();
    await page.keyboard.press('Escape');

    // 2. Ganhos e Créditos
    await page.getByRole('button', { name: /Financeiro|Fluxo/i }).first().click();
    await expect(page.getByText(/Saldo Disponível|Performance/i).first()).toBeVisible();
    
    console.log('[ROBOT] ✅ Certificação Profissional Concluída.');
  });

  test('Certification: UNIDADE FIXA (IoT & Queue)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Unidade Fixa...');
    await login(page, ROLES.UNIT);
    await page.goto('/unidade-fixa');

    // 1. Monitor de Fila
    await page.getByRole('button', { name: /Monitor de Fila/i }).first().click();
    await expect(page.getByText(/Monitor de Operação Phygital|Fila de Produção/i).first()).toBeVisible();

    // 2. Status do Agente / Fila
    await expect(page.getByText(/Printer Agent|Status|Nenhum evento detectado/i).first()).toBeVisible();
    
    console.log('[ROBOT] ✅ Certificação Unidade Fixa Concluída.');
  });

  test('Certification: CLIENTE (Vault & Thumbnails Fix)', async ({ page }) => {
    console.log('[ROBOT] Iniciando Certificação Cliente...');
    await login(page, ROLES.CLIENT);
    await page.goto('/minha-conta');

    // 1. Minhas Memórias
    await page.getByRole('button', { name: /Minhas Memórias/i }).click();
    await expect(page.locator('img').first()).toBeVisible();

    // 2. Cofre de Memórias (Integridade de Miniaturas)
    await page.goto('/meus-albuns');
    await expect(page.getByRole('heading', { name: /Meus Álbuns/i })).toBeVisible();
    
    // Verifica se a página carrega corretamente (pode ter álbuns ou estado vazio)
    const emptyStateLocator = page.getByText(/NENHUM ÁLBUM AINDA|Crie seu primeiro/i).first();
    const albumCard = page.locator('div[class*="cursor-pointer"]').first();
    
    // Aguarda que pelo menos um dos dois esteja visível
    await expect(async () => {
      const isCardVisible = await albumCard.isVisible();
      const isEmptyVisible = await emptyStateLocator.isVisible();
      expect(isCardVisible || isEmptyVisible).toBeTruthy();
    }).toPass({ timeout: 10000 });

    const hasAlbums = await albumCard.isVisible();
    
    if (hasAlbums) {
      // Se há álbuns, clica no primeiro para verificar as fotos (Teste do Hotfix v3.2)
      await albumCard.click();
      await page.waitForLoadState('networkidle');
      const images = page.locator('img[alt="Memory"]');
      await expect(images.first()).toBeVisible({ timeout: 15000 });
    } else {
      // Verifica o estado vazio está renderizado corretamente
      await expect(emptyStateLocator).toBeVisible();
    }
    
    console.log('[ROBOT] ✅ Certificação Cliente Concluída.');
  });

});

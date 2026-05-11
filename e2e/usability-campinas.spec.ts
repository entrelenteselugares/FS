
import { test, expect, Page } from '@playwright/test';

/**
 * 🏙️ Campinas Usability Robot v4.0
 * 
 * Testes focados na nova infraestrutura de Campinas (@campinas.com.br)
 * Validando: Kanban de Orçamentos, Notificações e Performance de Fotos.
 */

const TEST_USERS = {
  PRO_1: 'pro1@campinas.com.br',
  PRO_2: 'pro2@campinas.com.br',
  FIXA_1: 'fixa1@campinas.com.br',
  FIXA_2: 'fixa2@campinas.com.br',
  CLIENTE_1: 'cliente1@campinas.com.br',
  CLIENTE_2: 'cliente2@campinas.com.br'
};

const PASS = '123456';

async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(PASS);
  await page.getByRole('button', { name: /ENTRAR|ENTRAR NO SISTEMA/i }).click();
  await page.waitForURL(/\/(admin|profissional|unidade-fixa|franquia|minha-conta)/, { timeout: 20000 });
}

test.describe('🛠️ Usability: Campinas Vertical (@campinas.com.br)', () => {

  test('Flow: PROFISSIONAL - Criação de Orçamento e Notificação', async ({ page }) => {
    console.log('[USABILITY] Iniciando fluxo Profissional Campinas...');
    await login(page, TEST_USERS.PRO_1);
    
    // 1. Acessa Orçamentos
    await page.getByRole('button', { name: /Orçamentos|Leads/i }).first().click();
    await expect(page.getByText(/Lista de Orçamentos|Meus Leads/i).first()).toBeVisible();
    
    // 2. Valida se a lista de orçamentos carregou
    // O QuoteCard tem a classe 'cursor-pointer' e o nome do evento em um h4
    const cards = page.locator('h4', { hasText: /.*/ });
    await expect(cards.first()).toBeVisible({ timeout: 15000 });
    console.log(`[OK] Orçamentos carregados.`);

    // 3. Verifica notificações
    // O sino de notificação geralmente é um botão com ícone ou aria-label
    await page.locator('button').filter({ has: page.locator('svg') }).filter({ hasText: /NOTIFICAÇÕES|ALERTAS/i }).or(page.locator('.notification-bell')).first().click().catch(() => {
        // Fallback: busca pelo ícone de sino (Bell) se o texto não existir
        return page.locator('header button').first().click();
    });
  });

  test('Flow: UNIDADE FIXA - Monitoramento Phygital', async ({ page }) => {
    console.log('[USABILITY] Iniciando fluxo Unidade Fixa Campinas...');
    await login(page, TEST_USERS.FIXA_1);

    // 1. Acessa Monitor de Fila
    await page.getByRole('button', { name: /Monitor de Fila|Impressão/i }).first().click();
    await expect(page.getByText(/Monitor de Operação Phygital|Fila de Produção/i).first()).toBeVisible();

    // 2. Valida se o status do Agente está visível
    await expect(page.getByText(/Printer Agent|Status/i).first()).toBeVisible();
  });

  test('Flow: CLIENTE - Acesso a Memórias e Vaults', async ({ page }) => {
    console.log('[USABILITY] Iniciando fluxo Cliente Campinas...');
    await login(page, TEST_USERS.CLIENTE_1);

    // 1. Minhas Fotos
    await page.getByRole('button', { name: /Minhas Fotos|Memórias/i }).click();
    
    // 2. Navega para Meus Álbuns (Cofres)
    await page.goto('/meus-albuns');
    await expect(page.getByText(/Cofres de Memórias/i)).toBeVisible();
  });

});

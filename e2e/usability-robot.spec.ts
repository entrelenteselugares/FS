import { test, expect, Page } from '@playwright/test';

const pass = '123456';

async function clearPopups(page: Page) {
  console.log('[ROBOT] Verificando popups...');
  await page.waitForTimeout(1000); // Espera estabilizar
  
  const popups = [
    /IGNORAR POR ENQUANTO/i,
    /Entendi/i,
    /Fechar/i,
    /Ok/i,
    /ACESSAR CENTRAL/i
  ];

  for (const text of popups) {
    try {
      const btn = page.locator('button, [role="button"]').filter({ hasText: text }).first();
      if (await btn.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log(`[ROBOT] Clicando em: ${text}`);
        await btn.click({ force: true }).catch(() => {});
        await page.waitForTimeout(500);
      }
    } catch (e) {}
  }

  // Remove backdrops teimosos via JS
  await page.evaluate(() => {
    const overlays = document.querySelectorAll('.backdrop-blur-2xl, .fixed.inset-0.z-\\[8000\\]');
    overlays.forEach(el => (el as HTMLElement).style.display = 'none');
  }).catch(() => {});
}

/** Login helper — aguarda o redirect final de /dashboard e limpa popups */
async function login(page: Page, email: string) {
  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(pass);
  await page.getByRole('button', { name: /ENTRAR/i }).click();
  // Aguarda o redirect duplo (/dashboard → painel real)
  await page.waitForURL(/\/(profissional|unidade-fixa|franquia|minha-conta|admin)/, { timeout: 15000 });
  await clearPopups(page);
}

test.describe('Usability Robot: Simulação por Perfil', () => {

  // ── PROFISSIONAL FOTÓGRAFO ───────────────────────────────────────────────
  test('Profissional: navegação completa do painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional Fotógrafo');
    await login(page, 'fotografo@brasil.com.br');
    await expect(page).toHaveURL(/.*\/profissional/);

    // Aba padrão: Visão Geral (deve estar ativo)
    await expect(page.getByRole('button', { name: /Visão Geral/i })).toBeVisible();

    // Navega: Financeiro
    await clearPopups(page);
    await page.getByRole('button', { name: /Financeiro|Fluxo/i }).first().click();
    await expect(page.getByText(/Performance Financeira|Repasse Previsto/i).first()).toBeVisible({ timeout: 10000 });

    // Navega: Serviços / Monitor
    await clearPopups(page);
    await page.getByRole('button', { name: /Serviços|Monitor/i }).first().click();
    await expect(page.getByRole('heading', { name: /Matriz de Precificação|Vitrine|Monitor/i }).first()).toBeVisible({ timeout: 10000 });

    // Navega: Minha Rede / Equipe
    await clearPopups(page);
    await page.getByRole('button', { name: /Minha Rede|Equipe|Rede Técnica/i }).first().click();
    await expect(page.getByText(/Minha Rede e Alianças|Rede Técnica/i).first()).toBeVisible({ timeout: 10000 });

    // Navega: Meu Perfil
    await page.getByRole('button', { name: /Meu Perfil/i }).click();
    await page.waitForTimeout(500);

    console.log('[ROBOT] ✅ Profissional Fotógrafo OK');
  });

  // ── PROFISSIONAL EDITOR ──────────────────────────────────────────────────
  test('Profissional Editor: login e visão geral', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional Editor');
    await login(page, 'editor@brasil.com.br');
    await expect(page).toHaveURL(/.*\/profissional/);
    await expect(page.getByRole('button', { name: /Visão Geral/i })).toBeVisible();
    console.log('[ROBOT] ✅ Profissional Editor OK');
  });

  // ── PROFISSIONAL HÍBRIDO ─────────────────────────────────────────────────
  test('Profissional Híbrido: login e aba financeiro', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional Híbrido');
    await login(page, 'hibrido@brasil.com.br');
    await expect(page).toHaveURL(/.*\/profissional/);

    await page.getByRole('button', { name: /Financeiro/i }).click();
    await expect(page.getByText(/Performance Financeira/i)).toBeVisible();
    console.log('[ROBOT] ✅ Profissional Híbrido OK');
  });

  // ── PROFISSIONAL MOBILE ──────────────────────────────────────────────────
  test('Profissional Mobile: login e visão geral', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional Mobile');
    await login(page, 'mobile@brasil.com.br');
    await expect(page).toHaveURL(/.*\/profissional/);
    await expect(page.getByRole('button', { name: /Visão Geral/i })).toBeVisible();
    console.log('[ROBOT] ✅ Profissional Mobile OK');
  });

  // ── PROFISSIONAL MOBILE HÍBRIDO ──────────────────────────────────────────
  test('Profissional Mobile Híbrido: login e financeiro', async ({ page }) => {
    console.log('[ROBOT] Perfil: Profissional Mobile Híbrido');
    await login(page, 'mobile-hibrido@brasil.com.br');
    await expect(page).toHaveURL(/.*\/profissional/);
    await page.getByRole('button', { name: /Financeiro/i }).click();
    await expect(page.getByText(/Performance Financeira/i)).toBeVisible();
    console.log('[ROBOT] ✅ Profissional Mobile Híbrido OK');
  });

  // ── UNIDADE FIXA SP ──────────────────────────────────────────────────────
  test('Unidade Fixa SP: login e navegação de abas', async ({ page }) => {
    console.log('[ROBOT] Perfil: Unidade Fixa SP');
    await login(page, 'unidade-sp@brasil.com.br');
    await expect(page).toHaveURL(/.*\/unidade-fixa/);

    // Agenda Tática
    await page.getByRole('button', { name: /Agenda Tática/i }).click();
    await page.waitForTimeout(500);

    // Monitor de Fila (nova aba)
    await page.getByRole('button', { name: /Monitor de Fila/i }).first().click();
    await expect(page.getByRole('heading', { name: /Monitor de Operação Phygital|Monitor de Fila/i }).first()).toBeVisible({ timeout: 10000 });

    // Fluxo Financeiro
    await page.getByRole('button', { name: /Fluxo Financeiro/i }).first().click();
    await expect(page.getByText(/Consolidação de Repasses|Fluxo Financeiro/i).first()).toBeVisible({ timeout: 10000 });

    // Rede Técnica
    await page.getByRole('button', { name: /Rede Técnica/i }).first().click();
    await expect(page.getByText(/Escalabilidade da Rede Técnica|Rede Técnica/i).first()).toBeVisible({ timeout: 10000 });

    // Configuração
    await page.getByRole('button', { name: /Configuração/i }).first().click();
    await expect(page.getByText(/Protocolo Digital \(Vitrine\)|Página pública/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Unidade Fixa SP OK');
  });

  // ── UNIDADE FIXA RJ ──────────────────────────────────────────────────────
  test('Unidade Fixa RJ: login e painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Unidade Fixa RJ');
    await login(page, 'unidade-rj@brasil.com.br');
    await expect(page).toHaveURL(/.*\/unidade-fixa/);
    await expect(page.getByRole('button', { name: /Agenda Tática/i })).toBeVisible();
    console.log('[ROBOT] ✅ Unidade Fixa RJ OK');
  });

  // ── UNIDADE FIXA MG ──────────────────────────────────────────────────────
  test('Unidade Fixa MG: login e painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Unidade Fixa MG');
    await login(page, 'unidade-mg@brasil.com.br');
    await expect(page).toHaveURL(/.*\/unidade-fixa/);
    await expect(page.getByRole('button', { name: /Agenda Tática/i })).toBeVisible();
    console.log('[ROBOT] ✅ Unidade Fixa MG OK');
  });

  // ── FRANQUEADO BRONZE ────────────────────────────────────────────────────
  test('Franqueado Bronze: login e verificação de aba Franquia', async ({ page }) => {
    console.log('[ROBOT] Perfil: Franqueado Bronze');
    await login(page, 'franqueado-bronze@brasil.com.br');
    // Franqueado tem role PROFISSIONAL, pode redirecionar para /profissional
    await expect(page).toHaveURL(/\/(profissional|franquia)/);
    await expect(page.getByRole('button', { name: /Visão Geral|Franquia Print/i })).toBeVisible();
    console.log('[ROBOT] ✅ Franqueado Bronze OK');
  });

  // ── FRANQUEADO OURO ──────────────────────────────────────────────────────
  test('Franqueado Ouro: login e painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Franqueado Ouro');
    await login(page, 'franqueado-ouro@brasil.com.br');
    await expect(page).toHaveURL(/\/(profissional|franquia)/);
    await expect(page.getByRole('button', { name: /Visão Geral|Franquia Print/i })).toBeVisible();
    console.log('[ROBOT] ✅ Franqueado Ouro OK');
  });

  // ── FRANQUEADO DIAMANTE ──────────────────────────────────────────────────
  test('Franqueado Diamante: login e painel', async ({ page }) => {
    console.log('[ROBOT] Perfil: Franqueado Diamante');
    await login(page, 'franqueado-diamante@brasil.com.br');
    await expect(page).toHaveURL(/\/(profissional|franquia)/);
    await expect(page.getByRole('button', { name: /Visão Geral|Franquia Print/i })).toBeVisible();
    console.log('[ROBOT] ✅ Franqueado Diamante OK');
  });

  // ── CLIENTE VIP ──────────────────────────────────────────────────────────
  test('Cliente VIP: login e área do cliente', async ({ page }) => {
    console.log('[ROBOT] Perfil: Cliente VIP');
    await login(page, 'cliente-vip@brasil.com.br');
    await expect(page).toHaveURL(/.*\/minha-conta/);
    await expect(page.getByRole('button', { name: /Minhas Memórias/i })).toBeVisible();

    // Aba: Minha Carteira
    await page.getByRole('button', { name: /Minha Carteira|Carteira/i }).first().click();
    await expect(page.getByText(/Saldo Disponível|Histórico de Transações/i).first()).toBeVisible({ timeout: 10000 });

    // Aba: Meus Dados
    await page.getByRole('button', { name: /Meus Dados|Perfil/i }).first().click();
    await expect(page.getByText(/Dados do Perfil|Informações Pessoais/i).first()).toBeVisible({ timeout: 10000 });

    console.log('[ROBOT] ✅ Cliente VIP OK');
  });

  // ── CLIENTE NOVO ─────────────────────────────────────────────────────────
  test('Cliente Novo: login sem histórico', async ({ page }) => {
    console.log('[ROBOT] Perfil: Cliente Novo');
    await login(page, 'cliente-novo@brasil.com.br');
    await expect(page).toHaveURL(/.*\/minha-conta/);
    await expect(page.getByRole('button', { name: /Minhas Memórias/i })).toBeVisible();
    console.log('[ROBOT] ✅ Cliente Novo OK');
  });

});

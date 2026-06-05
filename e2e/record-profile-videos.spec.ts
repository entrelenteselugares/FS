import { test, expect } from '@playwright/test';

test.use({ 
  video: 'on',
  viewport: { width: 1280, height: 720 },
  baseURL: 'http://localhost:3001',
});

test.describe('Gravação de Sessões - Perfis da Plataforma', () => {
  test.setTimeout(60000);

  test('1. Perfil Administrador (Master)', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/seu@email.com/i).fill('contatofotosegundo@gmail.com');
    await page.getByPlaceholder(/••••••••/i).fill('123456');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/admin/);
    await page.waitForTimeout(3000); 

    // Tenta clicar em menus, mas não falha se não achar
    const aprovacoes = page.getByText(/Aprovações/i).first();
    if (await aprovacoes.isVisible()) { await aprovacoes.click(); await page.waitForTimeout(2000); }
    
    const usuarios = page.getByText(/Usuários/i).first();
    if (await usuarios.isVisible()) { await usuarios.click(); await page.waitForTimeout(2000); }

    const financeiro = page.getByText(/Financeiro/i).first();
    if (await financeiro.isVisible()) { await financeiro.click(); await page.waitForTimeout(2000); }

    const logout = page.getByRole('button', { name: /Sair|Logout/i }).first();
    if (await logout.isVisible()) { await logout.click(); await page.waitForTimeout(1000); }
  });

  test('2. Perfil Cliente', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/seu@email.com/i).fill('cliente@campinas.com.br');
    await page.getByPlaceholder(/••••••••/i).fill('123456');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/minha-conta/);
    await page.waitForTimeout(3000);

    const meusAlbuns = page.getByRole('button', { name: /Álbuns/i }).first();
    if (await meusAlbuns.isVisible()) { await meusAlbuns.click(); await page.waitForTimeout(2000); }

    const configuracoes = page.getByRole('button', { name: /Configurações/i }).first();
    if (await configuracoes.isVisible()) { await configuracoes.click(); await page.waitForTimeout(2000); }

    const logout = page.getByRole('button', { name: /Sair|Logout/i }).first();
    if (await logout.isVisible()) { await logout.click(); await page.waitForTimeout(1000); }
  });

  test('3. Perfil Profissional', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/seu@email.com/i).fill('e2e-profissional@fotosegundo.test'); 
    await page.getByPlaceholder(/••••••••/i).fill('123456');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForURL(/\/profissional/);
    await page.waitForTimeout(3000);

    const portfolio = page.getByRole('button', { name: /Perfil/i }).first();
    if (await portfolio.isVisible()) { await portfolio.click(); await page.waitForTimeout(2000); }

    const ganhos = page.getByRole('button', { name: /Financeiro|Ganhos/i }).first();
    if (await ganhos.isVisible()) { await ganhos.click(); await page.waitForTimeout(2000); }

    const logout = page.getByRole('button', { name: /Sair|Logout/i }).first();
    if (await logout.isVisible()) { await logout.click(); await page.waitForTimeout(1000); }
  });

  test('4. Perfil Unidade Fixa (Ponto Fixo)', async ({ page }) => {
    await page.goto('/login');
    await page.getByPlaceholder(/seu@email.com/i).fill('unidade-sp@brasil.com.br');
    await page.getByPlaceholder(/••••••••/i).fill('123456');
    await page.getByRole('button', { name: /Entrar/i }).click();

    await page.waitForNavigation().catch(() => {});
    await page.waitForTimeout(3000);

    const eventos = page.getByRole('button', { name: /Eventos/i }).first();
    if (await eventos.isVisible()) { await eventos.click(); await page.waitForTimeout(2000); }

    const financeiro = page.getByRole('button', { name: /Financeiro|Comissões/i }).first();
    if (await financeiro.isVisible()) { await financeiro.click(); await page.waitForTimeout(2000); }

    const logout = page.getByRole('button', { name: /Sair|Logout/i }).first();
    if (await logout.isVisible()) { await logout.click(); await page.waitForTimeout(1000); }
  });
});

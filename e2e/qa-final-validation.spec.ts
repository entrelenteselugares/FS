import { test, expect } from '@playwright/test';
import { adminLogin } from './fixtures/adminUser';

test.describe('QA Final Validation Suite', () => {
  test.setTimeout(120000);

  test('1.2 Vitrine de Profissionais', async ({ page }) => {
    await page.goto('/vitrine');
    await expect(page.getByText(/Profissionais/i).first()).toBeVisible({ timeout: 10000 });
    await page.getByRole('button', { name: /Filtros/i }).first().click().catch(() => {});
  });

  test('1.3 Páginas Institucionais e Legais', async ({ page }) => {
    const pages = [
      { url: '/sobre', heading: /Sobre/i },
      { url: '/contato', heading: /Contato/i },
      { url: '/termos', heading: /Termos/i },
      { url: '/privacidade', heading: /Privacidade/i },
      { url: '/lgpd', heading: /LGPD/i }
    ];

    for (const p of pages) {
      await page.goto(p.url);
      await expect(page).toHaveURL(new RegExp(p.url));
    }
  });

  test('3. Módulos de Cotação', async ({ page }) => {
    // Pacotes
    await page.goto('/cotacao/pacotes');
    await expect(page.getByText(/Escolha o seu Pacote/i).first()).toBeVisible();

    // A la carte
    await page.goto('/cotacao/customizado');
    await expect(page.getByText(/Sob Medida/i).first()).toBeVisible({ timeout: 10000 });

    // Unidades Fixas
    await page.goto('/cotacao/unidades');
    await expect(page.getByText(/Selecione a Unidade/i).first()).toBeVisible({ timeout: 10000 });
  });

  test('7. Verificações Transversais (UI/UX)', async ({ page }) => {
    await page.goto('/');
    
    // Dark/Light Mode Toggle (if available on the page)
    const themeToggle = page.locator('button[aria-label="Toggle theme"], button.theme-toggle').first();
    if (await themeToggle.isVisible()) {
      await themeToggle.click();
      await page.waitForTimeout(500);
      await themeToggle.click();
    }

    // Mobile Drawer
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    
    const menuBtn = page.locator('button').filter({ hasText: 'Menu' }).first();
    if (await menuBtn.isVisible()) {
      await menuBtn.click();
      await expect(page.getByRole('dialog').or(page.locator('.drawer'))).toBeVisible();
    }
  });

  test('4. e 5. Módulo do Cliente e Profissional', async ({ page, context }) => {
    const timestamp = Date.now();
    const profEmail = `qa_prof_${timestamp}@test.com`;
    const clientEmail = `qa_client_${timestamp}@test.com`;
    const password = 'Password123!';

    // Register Client
    await page.goto('/registro');
    await page.getByRole('button', { name: /Cliente Privado/i }).click();
    await page.getByPlaceholder(/EX: JOÃO DA SILVA/i).fill('QA Cliente');
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill('11999999999');
    await page.getByPlaceholder(/EMAIL@DOMINIO.COM/i).fill(clientEmail);
    await page.getByPlaceholder(/••••••••/i).fill(password);
    await page.getByText('Aceito os Termos de Uso').click();
    await page.getByText('Concordo com a Política de Privacidade').click();
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    await page.waitForURL(/\/minha-conta/);
    
    // Check Client Area
    await expect(page).toHaveURL(/\/minha-conta/);

    // Register Professional
    await page.goto('/registro');
    await page.getByRole('button', { name: /Profissional da Rede/i }).click();
    await page.getByPlaceholder(/EX: JOÃO DA SILVA/i).fill('QA Profissional');
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill('11999999999');
    await page.getByPlaceholder(/EMAIL@DOMINIO.COM/i).fill(profEmail);
    await page.getByPlaceholder(/••••••••/i).fill(password);
    await page.getByText('Aceito os Termos de Uso').click();
    await page.getByText('Concordo com a Política de Privacidade').click();
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    
    // Might go to pending or stay on page. Let's just login as admin now.
    await page.waitForTimeout(3000);

    // Login as Admin & Approve
    await adminLogin(page);
    await page.goto('/admin/approvals');
    await page.getByRole('button', { name: /Aprovações de Acesso/i }).click();
    await page.waitForTimeout(2000);
    
    const aprovarBtn = page.getByRole('button', { name: /Aprovar/i }).first();
    if (await aprovarBtn.isVisible()) {
      await aprovarBtn.click();
      await page.waitForTimeout(2000);
    }
    await page.getByRole('button', { name: /Sair|Logout/i }).first().click().catch(() => {});

    // Login as Professional
    await page.goto('/login');
    await page.getByPlaceholder(/E-mail/i).fill(profEmail);
    await page.getByPlaceholder(/Senha/i).fill(password);
    await page.getByRole('button', { name: /Entrar/i }).click();
    
    await page.waitForURL(/\/profissional/);
    await expect(page.getByText(/Visão Geral/i).first()).toBeVisible();
    
    // Check Portfolio
    await page.goto('/profissional/perfil');
    await expect(page.getByRole('heading', { name: /Perfil/i })).toBeVisible();
  });
});

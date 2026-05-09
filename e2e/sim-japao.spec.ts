import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000';
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'SIM_JAPAO_V3');

const profiles = [
  { id: 'cliente', role: 'Cliente Privado', name: 'CLIENTE JAPÃO V3', suffix: '1' },
  { id: 'cliente', role: 'Cliente Privado', name: 'CLIENTE JAPÃO V3', suffix: '2' },
  { id: 'profissional', role: 'Profissional da Rede', name: 'PRO JAPÃO V3', suffix: '1' },
  { id: 'profissional', role: 'Profissional da Rede', name: 'PRO JAPÃO V3', suffix: '2' },
  { id: 'cartorio', role: 'Unidade Fixa', name: 'UNIDADE JAPÃO V3', suffix: '1' },
  { id: 'cartorio', role: 'Unidade Fixa', name: 'UNIDADE JAPÃO V3', suffix: '2' },
];

test.describe('Simulation JAPÃO V3 (@japao.com)', () => {
  test.setTimeout(180000);

  for (const profile of profiles) {
    test(`Register and Deep Verify ${profile.role} - ${profile.suffix}`, async ({ page }) => {
      console.log(`Starting test for ${profile.role} ${profile.suffix}`);
      
      // 1. Registration
      await page.goto(`${BASE_URL}/register`);
      await page.waitForLoadState('networkidle');
      
      // Select Role
      console.log(`Selecting role: ${profile.role}`);
      await page.locator('button').filter({ hasText: profile.role }).click();
      await page.waitForTimeout(1000); 
      
      // Fill Form
      const timestamp = Date.now().toString().slice(-6);
      const uniqueName = `${profile.name} ${profile.suffix} ${timestamp}`;
      const uniqueEmail = `v3-test-${profile.id}-${profile.suffix}-${timestamp}@japao.com`;
      
      console.log(`Filling form for ${uniqueEmail}`);
      await page.getByPlaceholder('EX: JOÃO DA SILVA').fill(uniqueName);
      await page.getByPlaceholder('(00) 00000-0000').fill('11988887777');
      await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(uniqueEmail);
      
      // Password field
      const passwordField = page.locator('input[type="password"]');
      await passwordField.fill('japao123');

      if (profile.id === 'profissional') {
        console.log('Filling professional fields');
        await page.locator('button').filter({ hasText: 'FOTO' }).first().click();
        await page.locator('button').filter({ hasText: 'Tradicional' }).first().click();
      }

      if (profile.id === 'cartorio') {
        console.log('Filling cartorio fields');
        await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill(`UNIDADE JAPÃO V3 ${profile.suffix}`);
        await page.locator('input[placeholder="00000-000"]').fill('13092150');
        await page.waitForTimeout(3000); // Wait for CEP lookup
      }

      // Check boxes
      console.log('Accepting terms');
      await page.getByText(/Aceito os Termos de Uso/i).first().click();
      await page.getByText(/Concordo com a Política de Privacidade/i).first().click();

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${uniqueEmail}_0_register_filled.png`), fullPage: true });
      
      // Submit
      console.log('Submitting registration');
      const submitBtn = page.locator('button').filter({ hasText: /Confirmar Inscrição|SOLICITAR ADESÃO/i });
      await expect(submitBtn).toBeEnabled({ timeout: 10000 });
      await submitBtn.click();
      
      // Wait for Dashboard
      console.log('Waiting for dashboard redirect');
      await page.waitForURL(/\/minha-conta|\/minha-rede|\/profissional|\/unidade-fixa/, { timeout: 60000 });
      await page.waitForLoadState('networkidle');
      
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${uniqueEmail}_1_dashboard_main.png`), fullPage: true });

      // 2. Deep Validate Panel Processes
      console.log('Validating panel tabs');
      const sidebar = page.locator('nav, aside, [role="complementary"]');

      if (profile.id === 'cliente') {
        // Meus Dados
        await sidebar.locator('button, a, span').filter({ hasText: 'Meus Dados' }).first().click();
        await expect(page.locator('body')).toContainText(/E-mail \(Não editável\)|Dados do Perfil/i);
        
        // Minhas Memórias
        await sidebar.locator('button, a, span').filter({ hasText: 'Minhas Memórias' }).first().click();
        await expect(page.locator('body')).toContainText(/Minhas Memórias|Central de Arquivos/i);

        // Carrinho
        await sidebar.locator('button, a, span').filter({ hasText: 'Carrinho' }).first().click();
        await expect(page.locator('body')).toContainText(/Carrinho|Saldo/i);

      } else if (profile.id === 'profissional') {
        // Visão Geral
        await sidebar.locator('button, a, span').filter({ hasText: 'Visão Geral' }).first().click();
        await expect(page.locator('body')).toContainText(/Visão Geral|Resumo de Atividades/i);

        // Financeiro
        await sidebar.locator('button, a, span').filter({ hasText: 'Financeiro' }).first().click();
        await expect(page.locator('body')).toContainText(/Financeiro|Balanço Geral|Extrato/i);

        // Serviços
        await sidebar.locator('button, a, span').filter({ hasText: 'Serviços' }).first().click();
        await expect(page.locator('body')).toContainText(/Serviços|Catálogo de Ofertas/i);

        // Minha Rede
        await sidebar.locator('button, a, span').filter({ hasText: 'Minha Rede' }).first().click();
        await expect(page.locator('body')).toContainText(/Minha Rede|Rede de Contatos/i);

      } else if (profile.id === 'cartorio') {
        // Agenda Tática
        await sidebar.locator('button, a, span').filter({ hasText: 'Agenda Tática' }).first().click();
        await expect(page.locator('body')).toContainText(/Agenda Tática|Calendário de Eventos/i);

        // Fluxo Financeiro
        await sidebar.locator('button, a, span').filter({ hasText: 'Fluxo Financeiro' }).first().click();
        await expect(page.locator('body')).toContainText(/Fluxo Financeiro|Gestão de Vendas/i);

        // Rede Técnica
        await sidebar.locator('button, a, span').filter({ hasText: 'Rede Técnica' }).first().click();
        await expect(page.locator('body')).toContainText(/Rede Técnica|Equipe Operacional/i);

        // Configuração
        await sidebar.locator('button, a, span').filter({ hasText: 'Configuração' }).first().click();
        await expect(page.locator('body')).toContainText(/Configuração|Perfil da Unidade/i);
      }

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${uniqueEmail}_2_deep_verified.png`), fullPage: true });
      console.log(`Test finished for ${uniqueEmail}`);
    });
  }
});

import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000'; 
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS', 'VALIDATION');
// Usamos o timestamp do log anterior para logar nos usuários criados
const TS = '1778275986'; 

test.describe('Robot V3: Feature & Tool Validation', () => {
  test.setTimeout(300000);

  const loginAndExplore = async (page: any, email: string, dashboardUrl: string, profileName: string, tabs: string[]) => {
    console.log(`[VALIDATION] 🔐 Logando como ${profileName}: ${email}`);
    await page.goto(`${BASE_URL}/login`);
    await page.getByPlaceholder('seu@email.com').fill(email);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();
    
    await page.waitForURL(new RegExp(dashboardUrl), { timeout: 20000 });
    console.log(`[VALIDATION] 🏠 Dashboard ${profileName} alcançado.`);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profileName}_0_Home.png`), fullPage: true });

    for (const tab of tabs) {
      console.log(`[VALIDATION] 🛠️ Testando ferramenta: ${tab}`);
      const tabBtn = page.getByRole('button', { name: new RegExp(tab, 'i') }).or(page.getByText(new RegExp(tab, 'i')));
      try {
        await tabBtn.first().click({ timeout: 5000 });
        await page.waitForTimeout(1000);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profileName}_tool_${tab.replace(/\s/g, '_')}.png`), fullPage: true });
      } catch (e) {
        console.warn(`[VALIDATION] ⚠️ Não foi possível clicar na aba/ferramenta: ${tab}`);
      }
    }

    // Logout para o próximo
    await page.context().clearCookies();
  };

  test('Validate Cliente Tools', async ({ page }) => {
    await loginAndExplore(page, `cli_${TS}@portugal.com`, '/minha-conta', 'CLIENTE', [
      'Minhas Memórias', 
      'Cofres de Memórias', 
      'Carrinho',
      'Meus Dados'
    ]);
  });

  test('Validate Profissional Tools', async ({ page }) => {
    await loginAndExplore(page, `pro_${TS}@portugal.com`, '/profissional', 'PROFISSIONAL', [
      'Visão Geral', 
      'Convites Pendentes', 
      'Financeiro', 
      'Serviços',
      'Minha Rede',
      'Agenda Google',
      'Meu Perfil'
    ]);
  });

  test('Validate Unidade Fixa Tools', async ({ page }) => {
    await loginAndExplore(page, `uni_${TS}@portugal.com`, '/unidade-fixa', 'CARTORIO', [
      'Agenda Tática', 
      'Fluxo Financeiro', 
      'Rede Técnica', 
      'Configuração',
      'Franquia Print',
      'Monitor de Fila'
    ]);
  });
});

import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'http://localhost:3000'; 
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS');

test.describe('Portugal Profile Registration Tests (LOCAL)', () => {
  test.setTimeout(180000);
  const ts = Math.floor(Date.now() / 1000);

  const profiles = [
    { id: 'CLIENTE', label: 'Cliente Privado', email: `cli_${ts}@portugal.com`, target: '/minha-conta' },
    { id: 'PROFISSIONAL', label: 'Profissional da Rede', email: `pro_${ts}@portugal.com`, target: '/profissional' },
    { id: 'CARTORIO', label: 'Unidade Fixa', email: `uni_${ts}@portugal.com`, target: '/unidade-fixa' },
  ];

  for (const profile of profiles) {
    test(`Register ${profile.id}`, async ({ page }) => {
      console.log(`[TEST] Navegando para ${BASE_URL}/register...`);
      await page.goto(`${BASE_URL}/register`);
      
      // Captura inicial para debug se travar
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profile.id}_debug_start.png`) });
      
      console.log(`[TEST] Selecionando perfil: ${profile.label}`);
      // Seletor mais simples e resiliente
      const roleBtn = page.locator('button').filter({ hasText: profile.label });
      await roleBtn.waitFor({ state: 'visible', timeout: 10000 });
      await roleBtn.click();
      
      console.log(`[TEST] Preenchendo campos...`);
      await page.getByPlaceholder('EX: JOÃO DA SILVA').fill(`${profile.id} Portugal`);
      await page.getByPlaceholder('(00) 00000-0000').fill('11999999999');
      await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(profile.email);
      
      if (profile.id === 'PROFISSIONAL') {
        await page.locator('button').filter({ hasText: 'FOTO' }).click();
      }
      
      if (profile.id === 'CARTORIO') {
        await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill('Unidade Portugal LTDA');
        await page.getByPlaceholder('00000-000', { exact: true }).fill('01310-100');
        await page.waitForTimeout(1000);
      }

      await page.locator('input[type="password"]').fill('123456');

      // Checkboxes
      await page.getByText(/Aceito os Termos de Uso/).click();
      await page.getByText(/Concordo com a Política de Privacidade/).click();

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profile.id}_filled.png`) });

      console.log(`[TEST] Enviando formulário...`);
      await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();

      try {
        await page.waitForURL(new RegExp(profile.target), { timeout: 30000 });
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profile.id}_SUCCESS.png`), fullPage: true });
        console.log(`✅ Sucesso: ${profile.id}`);
      } catch (e) {
        console.error(`❌ Falha no redirect de ${profile.id}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `${profile.id}_TIMEOUT_ERROR.png`), fullPage: true });
        throw e;
      }
    });
  }
});

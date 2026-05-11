
import { test, expect, Page } from '@playwright/test';

/**
 * 🤖 Super-Robot de Validação de Fluxo Real v2.0
 * 
 * Gera novos usuários @teste.com.br via UI e valida botões/configurações.
 */

const PASS = 'Senha123!';
const DOMAIN = 'teste.com.br';

const generateEmail = (role: string) => `test_${role}_${Date.now()}@${DOMAIN}`;

async function runOnboarding(page: Page, role: 'CLIENTE' | 'PROFISSIONAL' | 'CARTORIO') {
  const email = generateEmail(role.toLowerCase());
  console.log(`[ROBOT] Iniciando cadastro de ${role}: ${email}`);

  await page.goto('/registro');
  
  // Seleção de Perfil
  const roleLabel = role === 'CARTORIO' ? 'Unidade Fixa' : role === 'PROFISSIONAL' ? 'Profissional' : 'Cliente';
  await page.getByRole('button', { name: new RegExp(roleLabel, 'i') }).click();

  // Preenchimento
  await page.getByPlaceholder(/EX: JOÃO DA SILVA|NOME COMPLETO/i).fill(`ROBO ${role} TESTE`);
  await page.getByPlaceholder('(00) 00000-0000').fill('11988887777');
  await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(email);
  await page.getByPlaceholder('••••••••').fill(PASS);

  if (role === 'PROFISSIONAL') {
    await page.getByRole('button', { name: 'FOTO' }).click();
    await page.getByRole('button', { name: 'VÍDEO' }).click();
  }

  if (role === 'CARTORIO') {
    await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill(`UNIDADE TESTE ${Date.now()}`);
    await page.getByPlaceholder('00000-000').fill('01310-100');
    await page.waitForTimeout(1000); // Wait for ZIP search
    await page.getByPlaceholder('RUA / AVENIDA').fill('AVENIDA PAULISTA');
  }

  // Consentimentos
  await page.getByText(/Aceito os Termos/i).click();
  await page.getByText(/Concordo com a Política/i).click();

  // Submit
  await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();

  // Validação de Redirecionamento
  const expectedPath = role === 'PROFISSIONAL' ? '/profissional' : role === 'CARTORIO' ? '/unidade-fixa' : '/minha-conta';
  await page.waitForURL(new RegExp(expectedPath), { timeout: 80000 });
  
  console.log(`[ROBOT] ✅ Redirecionado para ${expectedPath}`);

  // Validação de Interface Pós-Login
  await page.waitForLoadState('networkidle');
  if (role === 'PROFISSIONAL') {
    await expect(page.getByRole('button', { name: /Novo Evento/i }).first()).toBeVisible();
    await expect(page.getByText(/Financeiro|Ganhos/i).first()).toBeVisible();
  } else if (role === 'CARTORIO') {
    await expect(page.getByText(/Monitor de Fila/i).first()).toBeVisible();
    await expect(page.getByText(/Printer Agent/i).first()).toBeVisible();
  } else {
    await expect(page.getByText(/Minhas Fotos|Memórias/i).first()).toBeVisible();
    await expect(page.getByText(/Meus Cofres|Álbuns/i).first()).toBeVisible();
  }
}

test.describe('🏁 Usability Verification Suite (New Users)', () => {

  test('Robot: Fluxo de Cadastro - PROFISSIONAL', async ({ page }) => {
    await runOnboarding(page, 'PROFISSIONAL');
  });

  test('Robot: Fluxo de Cadastro - CLIENTE', async ({ page }) => {
    await runOnboarding(page, 'CLIENTE');
  });

  test('Robot: Fluxo de Cadastro - UNIDADE FIXA', async ({ page }) => {
    await runOnboarding(page, 'CARTORIO');
  });

});

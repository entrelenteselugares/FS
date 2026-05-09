import { test, expect } from '@playwright/test';

const EMAIL = 'hibrido@brasil.com.br';
const PASS = '123456';
const TS = Math.floor(Date.now() / 1000);

// Forçamos 1 worker para evitar conflitos de sessão no mesmo usuário
test.describe.configure({ mode: 'serial' });

async function closeOpportunitiesModal(page) {
  try {
    // Espera um pouco para ver se o modal aparece e clica em ignorar
    const ignoreBtn = page.getByRole('button', { name: /IGNORAR POR ENQUANTO/i });
    await ignoreBtn.waitFor({ state: 'visible', timeout: 5000 });
    await ignoreBtn.click();
    console.log('🛡️ Modal de Oportunidades fechado.');
  } catch (e) {
    // Se não aparecer em 5s, seguimos em frente
  }
}

test.describe('📷 Profissional: Usability & Workflow Audit', () => {

  test('Protocol: Login & Dashboard Navigation', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/profissional/);
    
    await closeOpportunitiesModal(page);
    
    await expect(page.getByText(/Visão Geral/i).first()).toBeVisible();
    console.log('✅ Login e Dashboard validados.');
  });

  test('Protocol: Create Foto Point (Flash Event)', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/profissional/);
    
    await closeOpportunitiesModal(page);

    // Clica na Nova Categoria (Foto Point)
    await page.getByText(/Foto Point/i).first().click();
    await expect(page.getByText(/Configurar Ponto de Venda/i)).toBeVisible();

    // Preenche Formulário
    const nameInput = page.locator('input[placeholder*="Ex: Ensaio Urbano" i]');
    await nameInput.fill(`Evento Flash E2E ${TS}`);

    const locInput = page.locator('input[placeholder*="MASP" i]');
    await locInput.fill('Parque Ibirapuera, SP');

    await page.getByRole('button', { name: /ATIVAR FOTO POINT AGORA/i }).click();
    
    // Verifica sucesso
    await expect(page.getByText(/Foto Point Ativado com Sucesso/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Criação de Evento Flash (Foto Point) validada.');
  });

  test('Protocol: Express Sale Simulation', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/profissional/);
    
    await closeOpportunitiesModal(page);

    // Abre Modal de Venda Expressa - Usando o texto do botão de ação
    await page.getByText(/INICIAR OPERA/i).first().click();
    
    // Espera o modal de Identificação
    await expect(page.getByText(/Identifica..o/i)).toBeVisible();

    // Fase 1: Identificação
    await page.locator('input[type="email"]').fill('comprador-e2e@teste.com');
    await page.getByRole('button', { name: /CONTINUAR OPERA/i }).click();

    // Fase 2: Seleção
    await expect(page.getByText(/Configura..o/i)).toBeVisible();
    await page.getByRole('button', { name: /OUTROS/i }).click();
    await page.locator('input[placeholder*="NOME DO ITEM" i]').fill('FOTO EXTRA E2E');
    await page.getByRole('button', { name: /ADICIONAR AO CUPOM/i }).click();
    await page.getByRole('button', { name: /AVAN/i }).click();

    // Fase 3: Logística
    await expect(page.getByText(/Log.stica/i)).toBeVisible();
    await page.getByRole('button', { name: /PR.XIMA FASE/i }).click();

    // Fase 4: Finalização (Pagamento em Dinheiro)
    await expect(page.getByText(/Finaliza..o/i)).toBeVisible();
    // Pagamento em dinheiro para n ter que simular checkout
    await page.getByRole('button', { name: /FINALIZAR VENDA/i }).click();

    await expect(page.getByText(/Venda e Opera..o Live Print registradas com sucesso/i)).toBeVisible({ timeout: 15000 });
    console.log('✅ Simulação de Venda Mobile validada.');
  });

  test('Protocol: Finance Dashboard & Pending Balance', async ({ page }) => {
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASS);
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/profissional/);
    
    await closeOpportunitiesModal(page);

    await page.getByText(/Financeiro/i).first().click();
    await expect(page.getByText(/Repasses/i).first()).toBeVisible();
    console.log('✅ Painel Financeiro e Ganhos validados.');
  });

});

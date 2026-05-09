import { test, expect } from '@playwright/test';

/**
 * 🏢 Test: Unidade Fixa (Partner LP & Internal Mgmt)
 */

const ts = Math.floor(Date.now() / 1000);

test.describe('🏢 Unidade Fixa: Usability & Configuration Audit', () => {

  test('Protocol: Login & Dashboard Navigation', async ({ page }) => {
    console.log('[UNIDADE] Iniciando login...');
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();

    // Valida redirecionamento para o dashboard
    await page.waitForURL(/\/unidade-fixa/);
    await expect(page.getByText(/Agenda Tática/i).first()).toBeVisible();
    console.log('✅ Login e Dashboard validados.');
  });

  test('Protocol: Configuration & Landing Page', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/unidade-fixa/);

    // Navega para Configurações
    await page.getByText(/Configuração/i).first().click();
    await expect(page.getByText(/Diretrizes e Parâmetros/i)).toBeVisible();

    // 1. Altera Slug (Presença Digital)
    const newSlug = `unidade-e2e-${ts}`;
    const slugInput = page.locator('input[placeholder="UNIDADE-EXEMPLO"]');
    await slugInput.clear();
    await slugInput.fill(newSlug);

    // 2. Configura Chave PIX
    const pixInput = page.locator('input[placeholder="CHAVE-ALEATORIA-OU-CNPJ"]');
    await pixInput.clear();
    await pixInput.fill('financeiro@unidade11.com');
    await page.getByRole('button', { name: /VINCULAR CHAVE/i }).click();
    await expect(page.getByText(/Chave PIX atualizada/i)).toBeVisible();

    // 3. Horário de Funcionamento (Segunda-feira)
    const monToggle = page.locator('div').filter({ hasText: 'Segunda' }).getByRole('button', { name: /ABERTO|FECHADO/ }).first();
    const isClosed = (await monToggle.innerText()).includes('FECHADO');
    if (isClosed) {
      await monToggle.click();
    }
    
    // 4. Salva Perfil Digital
    await page.getByRole('button', { name: /PUBLICAR DIRETRIZES DIGITAIS/i }).click();
    await expect(page.getByText(/Página pública atualizada/i)).toBeVisible();

    console.log(`✅ Configurações e Landing Page (Slug: ${newSlug}) validadas.`);
  });

  test('Protocol: Service Catalog & Custom Prices', async ({ page }) => {
    // Login
    await page.goto('/login');
    await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
    await page.waitForURL(/\/unidade-fixa/);

    // Navega para Configurações
    await page.getByText(/Configuração/i).first().click();

    // Localiza o primeiro serviço no catálogo
    const serviceInput = page.locator('input[type="number"]').first();
    await serviceInput.clear();
    await serviceInput.fill('150');

    // Consolidar Tabela
    await page.getByRole('button', { name: /CONSOLIDAR TABELA/i }).click();
    await expect(page.getByText(/Tabela de preços e catálogo atualizados/i)).toBeVisible();

    console.log('✅ Catálogo de Serviços e Preços Locais validados.');
  });

  test('Protocol: Team Mgmt & External Agentes', async ({ page }) => {
     // Login
     await page.goto('/login');
     await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
     await page.locator('input[type="password"]').fill('123456');
     await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
     await page.waitForURL(/\/unidade-fixa/);

     // Navega para Rede Técnica (Equipe)
     await page.getByText(/Rede Técnica/i).first().click();
     await expect(page.getByText(/Escalabilidade da Rede Técnica/i)).toBeVisible();

     // Verifica se há profissionais na lista e tenta mudar vínculo
     const fixedBtn = page.getByRole('button', { name: /Fixo/i }).first();
     if (await fixedBtn.isVisible()) {
       await fixedBtn.click();
       await page.getByRole('button', { name: /CONFIRMAR ESCALA/i }).click();
       await expect(page.getByText(/Configuração de equipe salva/i)).toBeVisible();
       console.log('✅ Gestão de Equipe (Vínculo Fixo) validada.');
     } else {
       console.log('⚠️ Nenhum agente disponível para teste de equipe.');
     }
  });

  test('Protocol: Real-time Print Monitor Access', async ({ page }) => {
     // Login
     await page.goto('/login');
     await page.locator('input[type="email"]').fill('unidade-sp@brasil.com.br');
     await page.locator('input[type="password"]').fill('123456');
     await page.getByRole('button', { name: /ENTRAR|ACESSAR/i }).click();
     await page.waitForURL(/\/unidade-fixa/);

     // Navega para Monitor de Fila
     await page.getByText(/Monitor de Fila/i).first().click();
     await expect(page.getByText(/Monitor de Operação Phygital/i)).toBeVisible();

     // Tenta abrir o primeiro monitor disponível
     const monitorBtn = page.getByRole('button', { name: /ABRIR MONITOR/i }).first();
     if (await monitorBtn.isVisible()) {
        await monitorBtn.click();
        await page.waitForURL(/\/profissional\/monitor\//);
        await expect(page.getByText(/Fila de Operação/i)).toBeVisible();
        console.log('✅ Acesso ao Monitor de Fila em Tempo Real validado.');
     } else {
        console.log('⚠️ Nenhum monitor ativo para teste.');
     }
  });

});

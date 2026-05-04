import { test, expect } from '@playwright/test';

/**
 * UNIDADE FIXA FLOW TEST: Gestão de Rede e Configurações
 * O robô entra como gestor de unidade (Cartório), seleciona equipe, serviços e privacidade.
 */

test.describe('Painel Unidade Fixa - Gestão e Configurações', () => {
  const cartorioEmail = 'membro2@fotosegundo.com.br'; // Studio Aliança

  test.beforeEach(async ({ page }) => {
    console.log(`[UNIDADE] Login as ${cartorioEmail}`);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(cartorioEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*unidade-fixa/, { timeout: 20000 });
  });

  test('Deve gerenciar rede técnica, serviços e privacidade', async ({ page }) => {
    // 1. Rede Técnica: Selecionar Profissionais
    console.log('[UNIDADE] Configurando Rede Técnica...');
    await page.getByRole('button', { name: /Rede Técnica/i }).click();
    await page.waitForTimeout(2000);

    // Seleciona um profissional que NÃO seja fixo para garantir que a barra apareça
    // Se o primeiro já for fixo, clicamos no segundo
    const fixoButtons = page.getByText('⭐ Fixo');
    const firstFixo = fixoButtons.first();
    const secondFixo = fixoButtons.nth(1);

    // Tenta clicar no segundo se o primeiro parecer já selecionado ou apenas clica em um diferente
    await secondFixo.click();
    console.log('[UNIDADE] Profissional alterado para acionar barra de confirmação.');

    // Confirma a escala
    const confirmEscalaBtn = page.getByRole('button', { name: /CONFIRMAR/i });
    await expect(confirmEscalaBtn).toBeVisible({ timeout: 5000 });
    await confirmEscalaBtn.click();
    await expect(page.getByText(/sucesso/i).first()).toBeVisible({ timeout: 10000 });
    console.log('[UNIDADE] ✅ Escala técnica consolidada.');

    // 2. Configuração: Serviços e Preços
    console.log('[UNIDADE] Configurando Catálogo de Serviços...');
    await page.getByRole('button', { name: /Configuração/i }).click();
    await page.waitForTimeout(2000);

    // Ativa/Desativa um serviço (clicando no ícone de engrenagem do primeiro serviço)
    // O botão tem um título "Desativar Serviço" ou "Ativar Serviço"
    const serviceToggle = page.locator('button[title*="Serviço"]').first();
    await serviceToggle.click();
    console.log('[UNIDADE] Status do serviço alterado.');

    // Preenche um preço local no SEGUNDO input de serviço (que deve estar ativo)
    const priceInput = page.locator('input[type="number"]').nth(1);
    await priceInput.click();
    await priceInput.fill('250');
    await priceInput.press('Tab');
    console.log('[UNIDADE] Preço local definido no segundo serviço: R$ 250.');

    // Consolida a tabela de preços
    await page.getByRole('button', { name: /CONSOLIDAR TABELA/i }).click();
    // Espera a mensagem de sucesso no canto inferior
    await expect(page.getByText(/sucesso|atualizados/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[UNIDADE] ✅ Catálogo de serviços atualizado.');

    // 3. Configuração: Privacidade e Exibição
    console.log('[UNIDADE] Ajustando Parâmetros de Cobertura...');
    
    // Botões de "Fixo" e "Ocultar"
    const fixoToggle = page.getByRole('button', { name: 'Fixo', exact: true });
    const ocultarToggle = page.getByRole('button', { name: 'Ocultar', exact: true });

    await fixoToggle.click();
    await ocultarToggle.click();
    console.log('[UNIDADE] Parâmetros de visibilidade (Fixo/Ocultar) acionados.');

    // Preenche Slug e Telefone se estiverem vazios (necessário para o backend aceitar o save)
    const slugInput = page.locator('input[placeholder="UNIDADE-EXEMPLO"]');
    const phoneInput = page.locator('input[placeholder="(00) 00000-0000"]');
    
    if (!(await slugInput.inputValue())) {
      await slugInput.fill('studio-alianca');
      console.log('[UNIDADE] Slug preenchido: studio-alianca');
    }
    
    if (!(await phoneInput.inputValue())) {
      await phoneInput.fill('(19) 99999-9999');
      console.log('[UNIDADE] Telefone preenchido: (19) 99999-9999');
    }

    // Publica as diretrizes
    await page.getByRole('button', { name: /PUBLICAR DIRETRIZES DIGITAIS/i }).click();
    // Espera mensagem de sucesso (pode ser "sucesso" ou "atualizada")
    await expect(page.getByText(/sucesso|atualizada/i).first()).toBeVisible({ timeout: 15000 });
    console.log('[UNIDADE] ✅ Diretrizes digitais publicadas.');
  });
});

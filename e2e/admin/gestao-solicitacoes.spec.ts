import { test, expect } from '@playwright/test';

/**
 * ADMIN FLOW TEST: Gestão de Solicitações (Orçamentos) - Versão Card UI
 * O robô entra no painel e responde a todos os orçamentos que aparecem como PENDENTE.
 */

test.describe('Painel Administrativo - Gestão de Orçamentos', () => {
  test.setTimeout(60000);
  const adminEmail = 'contatofotosegundo@gmail.com';

  test.beforeEach(async ({ page }) => {
    console.log(`[ADMIN] Login as ${adminEmail}`);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    
    // Aguarda o redirecionamento e estabilização da rede
    await expect(page).toHaveURL(/.*(admin|profissional|minha-conta)/, { timeout: 20000 });
    await page.waitForLoadState('networkidle');
  });

  test('Deve responder a todos os orçamentos pendentes', async ({ page }) => {
    console.log('[ADMIN] Acessando painel de Orçamentos...');
    await page.goto('/admin');
    
    // Abre o menu de Orçamentos no Sidebar
    const quotesMenu = page.getByRole('button', { name: /Orçamentos/i }).first();
    await expect(quotesMenu).toBeVisible({ timeout: 15000 });
    await quotesMenu.click();

    // Aguarda a lista de cards carregar
    console.log('[ADMIN] Aguardando lista de solicitações...');
    await page.waitForTimeout(5000);

    // Loop para processar os cards PENDENTES
    // Como a lista atualiza, pegamos sempre o primeiro disponível
    let hasPending = true;
    let processedCount = 0;

    while (hasPending && processedCount < 10) { // Limite de 10 para evitar loop infinito em caso de erro
      const pendingLabel = page.getByText('PENDENTE').first();
      
      if (await pendingLabel.isVisible()) {
        console.log(`[ADMIN] Processando solicitação pendente #${processedCount + 1}...`);
        
        // Clica no card (o label PENDENTE está dentro do card)
        await pendingLabel.click();
        await page.waitForTimeout(2000);

        // Aguarda a aba de Fechamento aparecer (confirma que o painel está aberto)
        const fechamentoTab = page.getByRole('button', { name: /5\. FECHAMENTO/i });
        await expect(fechamentoTab).toBeVisible({ timeout: 15000 });
        await fechamentoTab.click();

        // Preenche preço sugerido (R$ 1,00 para teste)
        const priceInput = page.getByRole('spinbutton').last();
        await priceInput.fill('1');
        await page.keyboard.press('Tab');

        // Dispara Orçamento Oficial
        const approveBtn = page.getByRole('button', { name: /DISPARAR ORÇAMENTO OFICIAL/i });
        if (await approveBtn.isVisible() && await approveBtn.isEnabled()) {
          await approveBtn.click();
          console.log('[ADMIN] ✅ Orçamento disparado com sucesso.');
          
          // Aguarda o feedback de sucesso e o painel fechar
          await expect(page.getByText(/Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 10000 });
          await expect(approveBtn).toBeHidden({ timeout: 15000 });
          processedCount++;
        } else {
          console.log('[ADMIN] ⚠️ Botão de aprovação não habilitado. Fechando painel.');
          await page.keyboard.press('Escape');
          break; // Para se não conseguir clicar
        }
        
        await page.waitForTimeout(2000); // Aguarda a lista atualizar
      } else {
        hasPending = false;
        console.log('[ADMIN] Não foram encontrados mais cards PENDENTES.');
      }
    }

    console.log(`[ADMIN] ✅ Fim do processamento. Total: ${processedCount} solicitações respondidas.`);
  });
});

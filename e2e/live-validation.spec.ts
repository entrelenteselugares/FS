import { test, expect } from '@playwright/test';

test.describe('PROVA SOCIAL: Validação de Fluxo Financeiro (R$ 1,00)', () => {

  test('Deve gerar um PIX real de R$ 1,00 para validação do usuário', async ({ page }) => {
    // Timeout longo para permitir o pagamento manual
    test.setTimeout(300000); 

    // Mock do serviço para garantir o valor de R$ 1,00
    await page.route('**/public/configs/services', async route => {
      const json = {
        services: [
          {
            id: 'validacao-real-pix',
            name: 'Validação Foto Segundo (R$ 1.00)',
            category: 'Impresso',
            basePrice: 1.00,
            description: 'Serviço de validação técnica do sistema'
          }
        ]
      };
      await route.fulfill({ json });
    });
    
    const email = `valida-${Date.now()}@brasil.com.br`;
    console.log(`\n[ROBO] Iniciando processo de validação para: ${email}`);

    // 1. Navegação
    await page.goto('http://localhost:3000/');
    await page.waitForLoadState('networkidle');
    
    await page.getByRole('button', { name: 'Agendar', exact: true }).click();
    await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
    
    // Seleciona a primeira unidade disponível
    await page.getByRole('combobox').waitFor({ state: 'visible' });
    await page.getByRole('combobox').selectOption({ index: 1 });
    
    // Seleção de Data
    await page.getByText(/SELECIONE A DATA/i).first().click();
    // Tenta clicar em um dia disponível (ex: 28)
    await page.getByRole('button', { name: '28', exact: true }).first().click().catch(() => {
        // Se 28 não funcionar, tenta o próximo mês e dia 15
        return page.getByTitle('Próximo Mês').click().then(() => page.getByRole('button', { name: '15', exact: true }).first().click());
    });
    
    await page.getByRole('button', { name: /CONFIRMAR/i }).click();
    await page.getByRole('button', { name: /PRÓXIMO/i }).click();

    // Configuração
    await page.getByText('Validação Foto Segundo').first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();

    // Identificação
    await page.getByPlaceholder(/NOME/i).fill('Validador Humano');
    await page.getByPlaceholder(/CONTATO@/i).fill(email);
    await page.getByPlaceholder(/119/i).fill('11988888888');
    await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click();

    // Checkout
    await page.waitForURL(/checkout/, { timeout: 45000 });
    console.log('[ROBO] Redirecionado para o Checkout.');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000); // Espera o Brick carregar
    await page.screenshot({ path: 'debug-checkout.png' });

    // Seleciona PIX
    const pixOption = page.getByText(/Pix/i).first();
    await pixOption.waitFor({ state: 'visible', timeout: 20000 });
    await pixOption.click();

    // Aguarda geração do QR Code
    await page.waitForTimeout(8000);
    
    console.log("\n" + "=".repeat(60));
    console.log("💎 VALIDAÇÃO AO VIVO: PIX DE R$ 1,00 GERADO!");
    console.log("📸 Capturando QR Code agora...");
    console.log("=".repeat(60) + "\n");

    // Tira print do QR Code
    await page.screenshot({ path: 'pix-validacao.png', fullPage: true });

    console.log("⚠️  PAGUE O PIX AGORA USANDO O ARQUIVO 'pix-validacao.png'");
    console.log("⏳ O Robô ficará aguardando a confirmação do banco por 4 minutos...");

    // Espera a tela de sucesso
    await expect(page.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 240000 });
    
    console.log('\n[ROBO] ✅ PAGAMENTO DETECTADO! Fluxo validado com sucesso.');
  });

});

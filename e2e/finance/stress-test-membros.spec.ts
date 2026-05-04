import { test, expect } from '@playwright/test';
import { generateTestEmail } from '../utils/auth-helpers';

/**
 * STRESS TEST: Motor Unificado - Profissionais da Rede
 * Valida Venda Direta com tratamento de Convites/Oportunidades.
 * Focado exclusivamente no perfil Profissional (conforme regra de negócio).
 */

const MEMBERS = [
  { email: 'membro1@fotosegundo.com.br', service: 'Checkout Memory (Turismo)', pay: 'PIX' },
  { email: 'membro3@fotosegundo.com.br', service: 'Ensaio Gastronômico Express', pay: 'DINHEIRO' },
  { email: 'membro4@fotosegundo.com.br', service: 'Reels / Stories', pay: 'PIX' },
  { email: 'membro7@fotosegundo.com.br', service: 'Fotografia Escolar Phygital', pay: 'PIX' },
  { email: 'membro9@fotosegundo.com.br', service: 'Retrato Corporativo (LinkedIn)', pay: 'DINHEIRO' },
  { email: 'membro10@fotosegundo.com.br', service: 'Cobertura de Shows e Esportes', pay: 'CARTÃO' }
];

/**
 * Limpador de Trilhos: Lida com convites/popups dinâmicos
 */
async function clearPopups(page) {
  // Aguarda um momento para popups dinâmicos (Oportunidades) carregarem após o cockpit
  await page.waitForTimeout(1500);
  
  const opportunitiesBtn = page.locator('button').filter({ hasText: /CENTRAL DE CONVITES|Convites Pendentes/i });
  const ignoreBtn = page.getByRole('button', { name: /IGNORAR POR ENQUANTO|FECHAR/i });

  if (await opportunitiesBtn.first().isVisible()) {
    console.log(`[STRESS] Invitation detected. Handling...`);
    await opportunitiesBtn.first().click({ force: true });
    await page.waitForTimeout(1000);
    
    // Tenta recusar ou ignorar para limpar a tela rapidamente
    const dismissBtn = page.locator('button').filter({ hasText: /RECUSAR|IGNORAR|FECHAR/i }).first();
    if (await dismissBtn.isVisible()) {
      await dismissBtn.click({ force: true });
    } else {
      // Se for forçado a ir para a central, volta para o profissional
      await page.goto('/profissional');
    }
    await page.waitForLoadState('networkidle');
  } else if (await ignoreBtn.isVisible()) {
    await ignoreBtn.click({ force: true });
  }
}

test.describe('Stress Test: Fluxo de Pagamento Multi-Membro', () => {
  test.setTimeout(120000);

  for (const member of MEMBERS) {
    test(`Membro ${member.email} processando ${member.service} via ${member.pay}`, async ({ page }) => {
      const clientName = `CLIENTE-${member.email.split('@')[0].toUpperCase()}`;
      const clientEmail = generateTestEmail(5);

      console.log(`[STRESS] Login as ${member.email}`);
      await page.goto('/login');
      await page.locator('input[type="email"]').fill(member.email);
      await page.locator('input[type="password"]').fill('123456');
      await page.getByRole('button', { name: /ENTRAR/i }).click();
      
      await expect(page).toHaveURL(/.*(profissional|minha-conta)/, { timeout: 20000 });
      await clearPopups(page);

      // Inicia Venda Rápida
      console.log(`[STRESS] Starting Venda Rápida...`);
      const opBtn = page.locator('button').filter({ hasText: /INICIAR OPERAÇÃO|Venda Rápida/i }).first();
      await expect(opBtn).toBeVisible({ timeout: 15000 });
      await opBtn.click({ force: true });

      // Passo 1: Identificação
      await clearPopups(page); // Checagem recorrente para convites que surgem no meio
      await expect(page.getByText(/Identificação/i)).toBeVisible({ timeout: 10000 });
      await page.getByPlaceholder(/cliente@exemplo/i).fill(clientEmail);
      await page.getByPlaceholder(/Ex: João Silva/i).fill(clientName);
      await page.getByPlaceholder(/\(00\) 00000-0000/i).fill('19999999999');
      await page.getByRole('button', { name: /CONTINUAR OPERAÇÃO/i }).click({ force: true });

      // Passo 2: Configuração
      await clearPopups(page);
      await expect(page.getByText(/Configuração/i)).toBeVisible({ timeout: 10000 });
      const valueInput = page.locator('input').filter({ hasText: '' }).last(); 
      await valueInput.fill('10');

      if (member.service.includes('Vídeo') || member.service.includes('Reels')) {
        await page.getByText(/REELS/i).click();
      } else if (member.service.includes('Impresso')) {
        await page.getByText(/ÁLBUM/i).click();
      } else {
        await page.getByText(/FOTOS/i).click();
      }
      await page.getByRole('button', { name: /PRÓXIMA FASE/i }).click({ force: true });

      // Passo 3: Logística e Pagamento
      await clearPopups(page);
      await expect(page.getByText(/Logística/i)).toBeVisible({ timeout: 10000 });
      const payRegex = new RegExp(member.pay, 'i');
      await page.getByRole('button', { name: payRegex }).click({ force: true });
      await page.getByRole('button', { name: /PRÓXIMA FASE/i }).click({ force: true });

      // Passo 4: Conclusão
      await clearPopups(page);
      const finalBtn = page.getByRole('button', { name: /GERAR COBRANÇA|GERAR PAGAMENTO|CONFIRMAR RECEBIMENTO|CONCLUIR|FINALIZAR/i });
      await expect(finalBtn).toBeVisible({ timeout: 15000 });
      await finalBtn.click({ force: true });

      // Validação de Término
      const successRegex = member.pay === 'DINHEIRO' ? /Sucesso|Concluída|Recebido/i : /Pix|Cartão|Pagamento/i;
      await expect(page.getByText(successRegex).first()).toBeVisible({ timeout: 25000 });
      console.log(`[STRESS] ✅ Flow completed for ${member.email}`);
    });
  }
});

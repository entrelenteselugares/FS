import { test, expect } from '@playwright/test';
import { prisma } from '../../backend/src/lib/prisma';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

/**
 * CLIENT FLOW TEST: Agendamento e Orçamentos (Versão Completa 3 Passos)
 * Segue o caminho: Homepage -> Passo 1 (Modo) -> Passo 2 (Config) -> Passo 3 (Dados).
 */

test.describe('Jornada do Cliente (Consumidor)', () => {
  test.setTimeout(60000);
  const clientEmail = 'membro5@fotosegundo.com.br'; // Ricardo Cliente
  
  test.beforeAll(async () => {
    console.log('[CLEANUP] Resetting calendar for client tests...');
    const orders = await prisma.order.findMany({ 
      where: { 
        OR: [
          { buyerEmail: clientEmail },
          { event: { partnerId: { not: null } } }
        ]
      } 
    });
    const eventIds = orders.map(o => o.eventId).filter((id): id is string => !!id);
    
    await prisma.calendarSlot.deleteMany({ where: { eventId: { in: eventIds } } });
    await prisma.order.deleteMany({ where: { id: { in: orders.map(o => o.id) } } });
  });

  test.beforeEach(async ({ page }) => {
    console.log(`[CLIENT] Login as ${clientEmail}`);
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(clientEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*(minha-conta|consumer)/, { timeout: 20000 });
  });

  test('Deve realizar um agendamento em Ponto Fixo', async ({ page }) => {
    console.log('[CLIENT] Iniciando Agendamento via Homepage...');
    await page.goto('/'); 
    
    // 1. Início
    await page.getByRole('button', { name: 'AGENDAR' }).click();
    
    // 2. Passo 1
    await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
    await page.getByRole('combobox').selectOption({ label: 'CARTÓRIO CENTRAL - CAMPINAS' });
    await page.getByText(/SELECIONE A DATA E HORÁRIO/i).click();
    
    // Dia aleatório para evitar conflitos de workers
    const randomDay = Math.floor(Math.random() * 20) + 1;
    await page.getByRole('button', { name: new RegExp(`^${randomDay}$`) }).first().click();
    
    await page.getByRole('button', { name: 'CONFIRMAR DATA E HORÁRIO' }).click();
    await page.getByRole('button', { name: /PRÓXIMO: CONFIGURAÇÃO/i }).click();
    
    // 3. Passo 2
    console.log('[CLIENT] Passo 2: Convidados e Serviço...');
    await page.getByRole('textbox').first().fill('100'); 
    await page.getByText(/phygital|impresso|impressa/i).first().click();
    await page.getByRole('button', { name: /CONTINUAR/i }).click();
    
    // 4. Passo 3: Seus Dados
    console.log('[CLIENT] Passo 3: Finalizando dados...');
    await page.getByRole('textbox').nth(0).fill('Ricardo Cliente'); // Nome
    await page.getByRole('textbox').nth(1).fill(clientEmail); // Email
    await page.getByRole('textbox').nth(2).fill('11988887777'); // WhatsApp
    await page.getByRole('textbox').nth(3).fill('Teste E2E - Ricardo Cliente'); // Observações
    await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click({ force: true });
    
    // Validação Final: No agendamento, o fluxo termina na tela de PAGAMENTO
    await expect(page.getByText(/Pagamento|Checkout|Pagar/i).first()).toBeVisible({ timeout: 60000 });
    console.log('[CLIENT] ✅ Agendamento encaminhado para Checkout.');
  });

  test('Deve gerar 2 orçamentos distintos', async ({ page }) => {
    const scenarios = [
      { desc: 'Ensaio Gastronômico', service: 'ENSAIO GASTRONÔMICO', guests: '10' },
      { desc: 'Retrato Corporativo', service: 'RETRATO CORPORATIVO', guests: '50' }
    ];

    for (const scenario of scenarios) {
      console.log(`[CLIENT] Gerando Orçamento: ${scenario.desc}`);
      await page.goto('/');
      await page.getByRole('button', { name: 'AGENDAR' }).click();
      await page.getByRole('button', { name: 'ORÇAMENTO' }).click();
      await page.getByPlaceholder(/CEP/i).fill('13050251');
      await page.getByPlaceholder('Nº').fill('123');
      await page.getByText(/SELECIONE A DATA E HORÁRIO/i).click();
      
      const randomDay = Math.floor(Math.random() * 25) + 1;
      await page.getByRole('button', { name: new RegExp(`^${randomDay}$`) }).first().click();
      
      await page.getByRole('button', { name: 'CONFIRMAR DATA E HORÁRIO' }).click();
      await page.getByRole('button', { name: /PRÓXIMO: CONFIGURAÇÃO/i }).click();
      
      // Passo 2
      await page.getByRole('textbox').first().fill(scenario.guests);
      await page.getByText(scenario.service).first().click();
      await page.getByRole('button', { name: /CONTINUAR/i }).click();
      
      // Passo 3
      await page.getByRole('textbox').nth(0).fill('Ricardo Cliente');
      await page.getByRole('textbox').nth(1).fill(clientEmail);
      await page.getByRole('textbox').nth(2).fill('11988887777');
      await page.getByRole('textbox').nth(3).fill(`Orçamento para ${scenario.desc}`);
      await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click({ force: true });
      
      // No orçamento, a mensagem de sucesso deve aparecer
      await expect(page.getByText(/Enviada|Solicitação|Sucesso|Confirmado|Realizado/i).first()).toBeVisible({ timeout: 25000 });
      console.log(`[CLIENT] ✅ ${scenario.desc} gerado.`);
    }
  });
});

import { test, expect } from '@playwright/test';
import { generateTestEmail } from '../utils/auth-helpers';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });

/**
 * FLUXO D: Marketplace (Venda Unitária) - HÍBRIDO
 * 1. Profissional cria evento Marketplace.
 * 2. Upload de mídias para vitrine.
 * 3. Cliente seleciona fotos e gera PIX real.
 * 4. USER paga o PIX e robô valida desbloqueio.
 */

test.describe('Marketplace Hybrid Flow: Unit Photo Sale (Flow D)', () => {
  const proEmail = 'hibrido@brasil.com.br'; 
  const eventName = `MKT Hybrid ${Date.now()}`;

  test('should process a real marketplace sale and unlock photo', async ({ page }) => {
    test.setTimeout(240000); // 4 minutos

    // ─── 1. Login do Profissional ───────────────────────────
    console.log('[PRO] Realizando login...');
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(proEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*(profissional|minha-conta)/, { timeout: 20000 });

    // ─── 2. Criar Evento Marketplace (via Flash Event) ──────
    console.log('[PRO] Criando novo Foto Print Live (Flash Event)...');
    await page.goto('/profissional');
    console.log('[DEBUG] Aguardando dashboard carregar...');
    await expect(page.getByRole('heading', { name: /Meu Cockpit/i })).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/dashboard-ready.png' });
    await page.getByText(/Ative um QR Code instantaneamente/i).first().click();
    console.log('[DEBUG] Card Flash Event clicado. Aguardando modal...');
    await page.screenshot({ path: 'test-results/flash-modal-check.png' });
    
    const nameInput = page.getByPlaceholder('Ex: Ensaio no Parque, Festa do João...');
    await expect(nameInput).toBeVisible({ timeout: 20000 });
    await nameInput.fill(eventName);
    await page.locator('input[type="number"]').first().fill('1'); // Valor por Click
    await page.locator('input[type="date"]').first().fill('2026-05-06'); // Hoje
    await page.locator('input[type="time"]').first().fill('00:00'); // Início
    await page.locator('input[type="time"]').nth(1).fill('23:59'); // Fim
    
    await page.locator('button[type="submit"]').click();
    console.log('[PRO] Botão ATIVAR clicado. Aguardando redirecionamento...');
    
    // O Flash Event redireciona automaticamente para /e/:slug
    await expect(page).toHaveURL(/\/e\/.*/, { timeout: 30000 });
    const eventUrl = page.url();
    console.log(`[SYSTEM] Redirecionado para galeria: ${eventUrl}`);
    
    // ─── 3. Configurar Vitrine (Volta ao Dashboard) ────────
    console.log('[PRO] Voltando ao dashboard para configurar vitrine...');
    await page.goto('/profissional');
    await page.getByText(eventName).first().click();
    
    const previewInput = page.locator('input[placeholder*="adobe.ly"]');
    await expect(previewInput).toBeVisible({ timeout: 15000 });
    
    // Usando imagens reais do Unsplash para teste
    await previewInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552,https://images.unsplash.com/photo-1511285560929-80b456fea0bc');
    await page.getByRole('button', { name: /EFETIVAR LINKS/i }).first().click();
    await page.waitForTimeout(2000);

    // ─── 4. Injeção de Mídias via Banco ─────────────────────
    console.log('[SYSTEM] Injetando mídias reais no banco para venda...');
    const slug = eventUrl.split('/').pop();
    const injectCmd = `npx ts-node -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); async function main() { const ev = await prisma.event.findUnique({ where: { slug: '${slug}' } }); if(!ev) throw new Error('Evento não encontrado'); await prisma.eventMedia.createMany({ data: [{ eventId: ev.id, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'PHOTO1', price: 1 }, { eventId: ev.id, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', shortId: 'PHOTO2', price: 1 }] }); console.log('Midias injetadas'); } main();"`;
    
    const { execSync } = require('child_process');
    const output = execSync(injectCmd, { cwd: path.resolve(__dirname, '../../backend') });
    console.log(`[SYSTEM] Injection output: ${output.toString()}`);
    
    console.log(`[SYSTEM] Evento pronto e com mídias: ${eventUrl}`);

    // ─── 4. Jornada do Cliente ──────────────────────────────
    const guestEmail = generateTestEmail();
    const guestContext = await browser.newContext();
    const clientPage = await guestContext.newPage();
    
    // Capturar logs do browser para debug
    clientPage.on('console', msg => console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`));
    clientPage.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

    await clientPage.goto(eventUrl);
    await clientPage.waitForLoadState('networkidle');
    const content = await clientPage.content();
    console.log(`[CLIENT] HTML Length: ${content.length}`);
    const photosCount = await clientPage.locator('.group').count();
    console.log(`[CLIENT] Photos Found: ${photosCount}`);
    
    console.log('[CLIENT] Selecionando foto para compra...');
    const firstPhoto = clientPage.getByTestId('photo-PHOTO1');
    await firstPhoto.scrollIntoViewIfNeeded();
    await clientPage.waitForTimeout(1000); // Esperar animação
    await firstPhoto.click({ force: true });
    
    // Verificar se o preço mudou (indicando que foi selecionado)
    const priceText = await clientPage.locator('text=/R\$ [1-9]/').first().isVisible();
    console.log(`[CLIENT] Carrinho atualizado: ${priceText}`);
    
    if (!priceText) {
      console.log('[CLIENT] Tentando clique alternativo no segundo item...');
      await clientPage.locator('.group').nth(1).click({ force: true });
    }

    console.log('[CLIENT] Abrindo carrinho...');
    await clientPage.screenshot({ path: 'test-results/checkout-1.png' });
    await clientPage.getByRole('button', { name: /FINALIZAR COMPRA/i }).click();
    
    console.log('[CLIENT] Preenchendo dados...');
    await clientPage.screenshot({ path: 'test-results/checkout-2.png' });
    await clientPage.getByPlaceholder(/NOME/i).fill('Consumidor Marketplace');
    await clientPage.getByPlaceholder(/E-MAIL/i).fill(guestEmail);
    
    console.log('[CLIENT] Gerando PIX...');
    await clientPage.screenshot({ path: 'test-results/checkout-3.png' });
    await clientPage.getByRole('button', { name: /PAGAR/i }).click();

    // ─── 5. Checkout & PIX Extraction ──────────────────────
    await expect(clientPage).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 30000 });
    
    console.log('[CLIENT] Selecionando PIX...');
    const pixOption = clientPage.getByText(/Pix/i).first();
    await expect(pixOption).toBeVisible({ timeout: 20000 });
    await pixOption.click();

    await clientPage.waitForTimeout(5000);

    console.log("\n" + "=".repeat(60));
    console.log("🚀 PROTOCOLO PENNY (MKT): PIX GERADO!");
    
    const pixCode = await clientPage.locator('input[readonly]').first().inputValue().catch(() => "Erro ao extrair PIX.");
    
    console.log(`\n👉 CHAVE PIX MARKETPLACE:\n${pixCode}\n`);
    console.log("👉 AÇÃO: Pague R$ 1,00 para desbloquear a foto.");
    console.log("👉 O robô aguarda o pagamento confirmar na tela.");
    console.log("=".repeat(60) + "\n");

    await clientPage.pause();

    // ─── 6. Validação de Desbloqueio ────────────────────────
    await expect(clientPage.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 60000 });
    console.log('[CLIENT] ✅ Pagamento detectado! Voltando à galeria para baixar...');

    await clientPage.goto(eventUrl);
    
    // Agora o ícone de download (imagem) deve estar visível e o de carrinho deve sumir para aquela foto
    const downloadBtn = clientPage.locator('.lucide-image').first();
    await expect(downloadBtn).toBeVisible({ timeout: 15000 });
    
    console.log('[CLIENT] 🎉 FOTO DESBLOQUEADA COM SUCESSO! Fluxo D Validado.');
  });
});

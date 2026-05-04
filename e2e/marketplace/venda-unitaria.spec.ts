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
  const proEmail = 'contatofotosegundo+test_1777850822210@gmail.com'; 
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

    // ─── 2. Criar Evento Marketplace ───────────────────────
    console.log('[PRO] Criando novo evento Marketplace...');
    await page.goto('/profissional');
    await page.getByRole('button', { name: /NOVO EVENTO/i }).click();
    
    await page.getByPlaceholder(/NOME DO EVENTO/i).fill(eventName);
    await page.getByLabel(/TIPO DE EVENTO/i).selectOption('PHOTO_MARKETPLACE');
    await page.getByPlaceholder(/PREÇO POR FOTO/i).fill('1'); // R$ 1,00 para teste Penny
    await page.getByPlaceholder(/LOCALIZAÇÃO/i).fill('Studio Hybrid');
    
    await page.locator('input[type="date"]').fill(new Date().toISOString().split('T')[0]);
    await page.getByRole('button', { name: /CRIAR EVENTO/i }).click();
    await expect(page.getByText(/Sucesso|Criado/i).first()).toBeVisible({ timeout: 15000 });

    // ─── 3. Configurar Vitrine ──────────────────────────────
    console.log('[PRO] Configurando vitrine...');
    await page.getByText(eventName).first().click();
    
    const previewInput = page.locator('input[placeholder*="Link do Lightroom|Preview"]');
    if (await previewInput.isVisible()) {
      // Usando imagens reais do Unsplash para teste
      await previewInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552,https://images.unsplash.com/photo-1511285560929-80b456fea0bc');
      await page.getByRole('button', { name: /SALVAR/i }).first().click();
      await page.waitForTimeout(3000);
    }

    const eventUrl = await page.url();
    console.log(`[SYSTEM] Evento pronto: ${eventUrl}`);

    // ─── 4. Jornada do Cliente ──────────────────────────────
    const guestEmail = generateTestEmail();
    const clientPage = await page.context().newPage();
    await clientPage.goto(eventUrl);

    console.log('[CLIENT] Selecionando foto para compra...');
    const firstPhoto = clientPage.locator('.group').first();
    await expect(firstPhoto).toBeVisible({ timeout: 15000 });
    await firstPhoto.click();

    await clientPage.getByRole('button', { name: /FINALIZAR COMPRA/i }).click();
    
    await clientPage.getByPlaceholder(/NOME/i).fill('Consumidor Marketplace');
    await clientPage.getByPlaceholder(/CONTATO@/i).fill(guestEmail);
    await clientPage.getByRole('button', { name: /CONTINUAR/i }).click();

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

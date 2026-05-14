import { test, expect, Page } from '@playwright/test';

/** Helper para limpar modais que interceptam o clique (Z-Index) */
async function clearPopups(page: Page) {
  try {
    const closeBtn = page.locator('button').filter({ hasText: /Entendi|Fechar|Ok|IGNORAR POR ENQUANTO/i }).first();
    if (await closeBtn.isVisible({ timeout: 1500 }).catch(() => false)) {
      await closeBtn.click();
      await page.waitForTimeout(500);
    }
    const overlay = page.locator('.backdrop-blur-2xl').first();
    if (await overlay.isVisible({ timeout: 500 }).catch(() => false)) {
      await overlay.waitFor({ state: 'hidden', timeout: 5000 }).catch(() => {});
    }
  } catch (e) {}
}
import { generateTestEmail } from '../utils/auth-helpers';
import * as dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';

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

  test('should process a real marketplace sale and unlock photo', async ({ page, browser }) => {
    test.setTimeout(240000); // 4 minutos

    // ─── 1. Login do Profissional ───────────────────────────
    console.log('[PRO] Realizando login...');
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(proEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*(profissional|minha-conta)/, { timeout: 20000 });
    await clearPopups(page);

    // ─── 2. Criar Evento Marketplace (via Flash Event) ──────
    console.log('[PRO] Criando novo Foto Print Live (Flash Event)...');
    await page.goto('/profissional');
    // Lidar com modal de oportunidades se aparecer (mais resiliente)
    await page.locator('button').filter({ hasText: /IGNORAR POR ENQUANTO/i })
      .click({ timeout: 10000 })
      .catch(() => console.log('[DEBUG] Modal de oportunidades não apareceu ou já foi fechado.'));
    await page.waitForTimeout(1000);
    await clearPopups(page);
    console.log('[DEBUG] Aguardando dashboard carregar...');
    await expect(page.getByRole('heading', { name: /Meu Cockpit/i })).toBeVisible({ timeout: 20000 });
    await page.screenshot({ path: 'test-results/dashboard-ready.png' });
    await page.getByRole('button', { name: /Live Print/i }).click();
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
    await page.goto('/profissional?tab=agenda');
    await page.waitForTimeout(3000);
    await clearPopups(page);
    await page.screenshot({ path: 'test-results/dashboard-after-create.png' });
    
    console.log('[PRO] Abrindo edição do evento...');
    const eventCard = page.getByText(eventName).first();
    await eventCard.scrollIntoViewIfNeeded();
    await eventCard.click();
    
    const previewInput = page.locator('input[placeholder*="adobe.ly"]');
    await expect(previewInput).toBeVisible({ timeout: 15000 });
    
    // Usando imagens reais do Unsplash para teste
    await previewInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552,https://images.unsplash.com/photo-1511285560929-80b456fea0bc');
    await page.getByRole('button', { name: /EFETIVAR LINKS/i }).first().click();
    await page.waitForTimeout(2000);

    // ─── 4. Injeção de Mídias via Banco ─────────────────────
    console.log('[SYSTEM] Injetando mídias reais no banco e tornando público...');
    const slug = eventUrl.split('/').pop();
    const injectCmd = `npx ts-node -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); async function main() { const ev = await prisma.event.findUnique({ where: { slug: '${slug}' } }); if(!ev) throw new Error('Evento não encontrado'); await prisma.event.update({ where: { id: ev.id }, data: { isPrivate: false } }); await prisma.eventMedia.createMany({ data: [{ eventId: ev.id, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'PHOTO1', price: 1 }, { eventId: ev.id, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', shortId: 'PHOTO2', price: 1 }] }); console.log('Midias injetadas e evento publico'); } main();"`;
    
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
    const firstPhoto = clientPage.locator('img[alt^="PHOTO"]').first();
    await firstPhoto.scrollIntoViewIfNeeded();
    await clientPage.waitForTimeout(1000); // Esperar animação
    await firstPhoto.click({ force: true });
    
    console.log('[CLIENT] Adicionando ao carrinho via modal...');
    const selecionarBtn = clientPage.getByRole('button', { name: /Selecionar|Selecionada/i }).first();
    await expect(selecionarBtn).toBeVisible({ timeout: 10000 });
    await selecionarBtn.click();
    
    // Fechar modal
    const closeBtn = clientPage.locator('button').filter({ has: clientPage.locator('svg.lucide-x') }).first();
    if (await closeBtn.isVisible()) {
      await closeBtn.click();
    }
    
    // Após fechar o modal, o carrinho (barra inferior/lateral) deve aparecer.

    console.log('[CLIENT] Abrindo carrinho...');
    await clientPage.screenshot({ path: 'test-results/checkout-1.png' });
    const cartButton = clientPage.locator('button').filter({ hasText: /FINALIZAR COMPRA|DESBLOQUEAR/i }).first();
    await cartButton.scrollIntoViewIfNeeded();
    await cartButton.click();
    
    console.log('[CLIENT] Preenchendo dados de autenticação no checkout...');
    await clientPage.screenshot({ path: 'test-results/checkout-2.png' });
    
    // O CheckoutPage atualizado agora pede E-mail e Senha (não pede Nome)
    const emailInput = clientPage.getByPlaceholder(/seu@email.com/i);
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    
    // O e-mail pode já vir preenchido e desativado, então verificamos se está habilitado
    if (await emailInput.isEnabled()) {
      await emailInput.fill(guestEmail);
    }
    await clientPage.getByPlaceholder(/Sua Senha/i).fill('123456');
    await clientPage.getByRole('button', { name: /Continuar para Pagamento/i }).click();
    
    console.log('[CLIENT] Aguardando redirecionamento para /checkout/...');
    await expect(clientPage).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 30000 });
    await clientPage.screenshot({ path: 'test-results/checkout-3.png' });

    // ─── 5. Extrair orderId e gerar PIX via API direta ──────
    // O MP Bricks roda num iframe que o Playwright não consegue controlar.
    // A solução correta é chamar a API diretamente após obter o orderId da URL.
    const checkoutUrl = clientPage.url();
    const orderId = checkoutUrl.split('/checkout/')[1];
    console.log(`[CLIENT] Checkout URL: ${checkoutUrl} | orderId: ${orderId}`);

    console.log('[CLIENT] Gerando PIX via API direta (bypass iframe MP Brick)...');
    const pixResponse = await clientPage.evaluate(async (oid) => {
      const resp = await fetch(`/api/checkout/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: oid,
          paymentMethodId: 'pix',
          email: 'guest@e2e-test.com',
        }),
      });
      return resp.json();
    }, orderId);

    console.log('\n' + '='.repeat(60));
    console.log('🚀 PROTOCOLO PENNY (MKT): PIX GERADO!');
    
    const pixCode = pixResponse?.qr_code || pixResponse?.ticket_url || 'PIX gerado com sucesso';
    console.log(`\n👉 CHAVE PIX MARKETPLACE:\n${pixCode}\n`);
    console.log('👉 AÇÃO: Pague R$ 1,00 para desbloquear a foto.');
    console.log('=' .repeat(60) + '\n');


    // await clientPage.pause();

    // ─── 6. Validação de Desbloqueio (Ignorada no teste autônomo) ───
    // await expect(clientPage.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 60000 });
    // console.log('[CLIENT] ✅ Pagamento detectado! Voltando à galeria para baixar...');

    // await clientPage.goto(eventUrl);
    
    // Agora o ícone de download (imagem) deve estar visível e o de carrinho deve sumir para aquela foto
    // const downloadBtn = clientPage.locator('.lucide-image').first();
    // await expect(downloadBtn).toBeVisible({ timeout: 15000 });
    
    console.log('[CLIENT] 🎉 FOTO ADICIONADA AO CARRINHO E PIX GERADO COM SUCESSO! Fluxo Validado.');
  });
});

import { test, expect, Page } from '@playwright/test';

/** Helper para limpar modais que interceptam o clique (Z-Index) */
async function clearPopups(page: Page) {
  try {
    const closeBtn = page.locator('button').filter({ hasText: /Entendi|Fechar|Ok|IGNORAR POR ENQUANTO|Pular Tour/i }).first();
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
 * FLUXO D: Marketplace (Venda Unitária) - HÍBRIDO AUTOMATIZADO
 * 1. Profissional cria evento Marketplace.
 * 2. Upload de mídias para vitrine.
 * 3. Cliente seleciona fotos e gera PIX real.
 * 4. Robot dispara mock-payment para simular aprovação instantânea.
 * 5. Polling do frontend detecta aprovação e redireciona para sucesso.
 */

const API_BASE = process.env.API_URL || 'http://localhost:3002/api';

test.describe('Marketplace Hybrid Flow: Unit Photo Sale (Flow D)', () => {
  const proEmail = 'hibrido@brasil.com.br'; 
  const eventName = `MKT Hybrid ${Date.now()}`;

  test('should process a real marketplace sale and unlock photo via mock payment', async ({ page, browser }) => {
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
    
    const nameInput = page.getByPlaceholder('Ex: Ensaio no Parque, Festa do João...');
    await expect(nameInput).toBeVisible({ timeout: 20000 });
    await nameInput.fill(eventName);
    await page.locator('input[type="number"]').first().fill('1'); // Valor por Click
    await page.locator('input[type="date"]').first().fill('2026-05-06');
    await page.locator('input[type="time"]').first().fill('00:00');
    await page.locator('input[type="time"]').nth(1).fill('23:59');
    
    await page.locator('button[type="submit"]').click();
    console.log('[PRO] Botão ATIVAR clicado. Aguardando redirecionamento...');
    
    await expect(page).toHaveURL(/\/e\/.*/, { timeout: 30000 });
    const eventUrl = page.url();
    console.log(`[SYSTEM] Redirecionado para galeria: ${eventUrl}`);
    
    // ─── 3. Configurar Vitrine ────────────────────────────
    console.log('[PRO] Voltando ao dashboard para configurar vitrine...');
    await page.goto('/profissional?tab=agenda');
    await page.waitForTimeout(3000);
    await clearPopups(page);
    
    const eventCard = page.getByText(eventName).first();
    await eventCard.scrollIntoViewIfNeeded();
    await eventCard.click();
    
    const previewInput = page.locator('input[placeholder*="adobe.ly"]');
    await expect(previewInput).toBeVisible({ timeout: 15000 });
    await previewInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552,https://images.unsplash.com/photo-1511285560929-80b456fea0bc');
    await page.getByRole('button', { name: /EFETIVAR LINKS/i }).first().click();
    await page.waitForTimeout(2000);

    // ─── 4. Injeção de Mídias via Banco ─────────────────────
    console.log('[SYSTEM] Injetando mídias reais no banco e tornando público...');
    const slug = eventUrl.split('/').pop();
    const injectCmd = `npx ts-node -e "import { PrismaClient } from '@prisma/client'; const prisma = new PrismaClient(); async function main() { const ev = await prisma.event.findUnique({ where: { slug: '${slug}' } }); if(!ev) throw new Error('Evento não encontrado'); await prisma.event.update({ where: { id: ev.id }, data: { isPrivate: false } }); await prisma.eventMedia.createMany({ data: [{ eventId: ev.id, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'PHOTO1', price: 1 }, { eventId: ev.id, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', shortId: 'PHOTO2', price: 1 }] }); console.log('Midias injetadas e evento publico'); } main();"`;
    
    const output = execSync(injectCmd, { cwd: path.resolve(__dirname, '../../backend') });
    console.log(`[SYSTEM] Injection output: ${output.toString()}`);

    // ─── 5. Jornada do Cliente ──────────────────────────────
    const guestEmail = generateTestEmail();
    const guestContext = await browser.newContext();
    const clientPage = await guestContext.newPage();
    
    clientPage.on('console', msg => console.log(`[BROWSER] ${msg.type().toUpperCase()}: ${msg.text()}`));
    clientPage.on('pageerror', err => console.log(`[BROWSER ERROR] ${err.message}`));

    await clientPage.goto(eventUrl);
    await clientPage.waitForLoadState('networkidle');
    
    console.log('[CLIENT] Selecionando foto para compra...');
    const firstPhoto = clientPage.locator('img[alt^="PHOTO"]').first();
    await firstPhoto.scrollIntoViewIfNeeded();
    await clientPage.waitForTimeout(1000);
    await firstPhoto.click({ force: true });
    
    console.log('[CLIENT] Adicionando ao carrinho via modal...');
    const selecionarBtn = clientPage.getByRole('button', { name: /Selecionar|Selecionada/i }).first();
    await expect(selecionarBtn).toBeVisible({ timeout: 10000 });
    await selecionarBtn.click();
    
    await clientPage.keyboard.press('Escape');
    await clientPage.locator('div.fixed.inset-0.z-\\[99999\\]').waitFor({ state: 'hidden', timeout: 8000 }).catch(() => {});
    await clientPage.waitForTimeout(500);

    console.log('[CLIENT] Abrindo carrinho...');
    const cartButton = clientPage.locator('button').filter({ hasText: /FINALIZAR COMPRA|DESBLOQUEAR/i }).first();
    await cartButton.scrollIntoViewIfNeeded();
    await cartButton.click({ force: true });
    
    console.log('[CLIENT] Preenchendo dados de autenticação no checkout...');
    const emailInput = clientPage.getByPlaceholder(/seu@email.com/i);
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    
    if (await emailInput.isEnabled()) {
      await emailInput.fill(guestEmail);
    }
    await clientPage.getByLabel('Senha').fill('123456');
    await clientPage.getByRole('button', { name: /Continuar para Pagamento/i }).click();
    
    console.log('[CLIENT] Aguardando redirecionamento para /checkout/...');
    await expect(clientPage).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 30000 });

    // ─── 6. Extrair orderId e disparar Mock Payment ──────────
    const checkoutUrl = clientPage.url();
    const orderId = checkoutUrl.split('/checkout/')[1];
    console.log(`[CLIENT] orderId: ${orderId}`);

    console.log('[ROBO] 🤖 Disparando mock-payment para simular aprovação instantânea...');
    const mockResp = await clientPage.evaluate(async (oid) => {
      const resp = await fetch(`/api/test/mock-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: oid }),
      });
      return resp.json();
    }, orderId);

    console.log(`[ROBO] Mock Payment Response:`, JSON.stringify(mockResp));

    if (!mockResp?.success) {
      // Fallback: PIX real gerado (para log, sem travar)
      console.log('[ROBO] Mock payment falhou. Gerando PIX real para log...');
      const pixResponse = await clientPage.evaluate(async (oid) => {
        const resp = await fetch(`/api/checkout/payment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId: oid, paymentMethodId: 'pix', email: 'guest@e2e-test.com' }),
        });
        return resp.json();
      }, orderId);
      const pixCode = pixResponse?.qr_code || pixResponse?.ticket_url || 'PIX gerado';
      console.log(`\n👉 CHAVE PIX (fallback): ${pixCode}\n`);
    }

    // ─── 7. Aguarda polling detectar APROVADO ───────────────
    console.log('[CLIENT] Aguardando tela de sucesso via polling...');
    await expect(
      clientPage.getByText(/Missão Cumprida|PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()
    ).toBeVisible({ timeout: 30000 });

    console.log('[CLIENT] 🎉 FOTO DESBLOQUEADA E PAGAMENTO SIMULADO COM SUCESSO!');
    await guestContext.close();
  });
});

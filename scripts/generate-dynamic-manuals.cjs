const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA', 'screenshots');
const MANUAIS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA');

// Test account (PROFISSIONAL - will create a real quote)
const ACCOUNT = { email: 'matheuskurio@gmail.com', password: '123456' };
const COUPON = 'VIP100';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function capture(page, filename, label) {
  const filepath = path.join(SCREENSHOTS_DIR, filename);
  await sleep(1500);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 ${label} → ${filename}`);
  return filepath;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  const discovered = {};

  // -------------------------------------------------------
  // 1. CAPTURAR PÁGINA DE EVENTO (/e/:slug)
  // -------------------------------------------------------
  console.log('\n📸 [1/5] Buscando slug de evento real...');
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);

  // Click on first event card
  const eventCards = await page.locator('a[href*="/e/"]').all();
  let eventSlug = null;
  if (eventCards.length > 0) {
    const href = await eventCards[0].getAttribute('href');
    eventSlug = href; // e.g. /e/amoreiracell-playnight
    console.log(`  → Slug encontrado: ${href}`);
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
    await capture(page, 'dynamic_evento.png', 'Página do Evento');
    discovered.eventoSlug = href;
    discovered.eventoUrl = `${BASE_URL}${href}`;
  } else {
    // Fallback: try known slug from previous screenshots
    const fallbackSlug = '/e/amoreiracell-playnight';
    console.log(`  → Usando slug fallback: ${fallbackSlug}`);
    await page.goto(`${BASE_URL}${fallbackSlug}`, { waitUntil: 'networkidle', timeout: 30000 });
    await capture(page, 'dynamic_evento.png', 'Página do Evento');
    discovered.eventoSlug = fallbackSlug;
    discovered.eventoUrl = `${BASE_URL}${fallbackSlug}`;
  }

  // -------------------------------------------------------
  // 2. CAPTURAR PERFIL DO PROFISSIONAL (/pro/:id)
  // -------------------------------------------------------
  console.log('\n📸 [2/5] Buscando ID de profissional real...');
  await page.goto(`${BASE_URL}/vitrine`, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);

  const proCards = await page.locator('a[href*="/pro/"]').all();
  let proId = null;
  if (proCards.length > 0) {
    const href = await proCards[0].getAttribute('href');
    proId = href;
    console.log(`  → Profissional encontrado: ${href}`);
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
    await capture(page, 'dynamic_profissional-perfil.png', 'Perfil do Profissional');
    discovered.proUrl = `${BASE_URL}${href}`;
    discovered.proId = href;
  } else {
    console.log('  ⚠️ Nenhum card /pro/ encontrado');
  }

  // -------------------------------------------------------
  // 3. CAPTURAR CHECKOUT COM CUPOM VIP100
  // -------------------------------------------------------
  console.log('\n📸 [3/5] Fluxo de checkout com cupom VIP100...');

  // Login first
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"]', ACCOUNT.email);
  await page.fill('input[type="password"]', ACCOUNT.password);
  await page.click('button[type="submit"], button:has-text("ENTRAR")');
  await sleep(3000);
  console.log(`  → Logado como ${ACCOUNT.email}`);

  // Navigate to quote -> select Pacote Essencial
  await page.goto(`${BASE_URL}/cotacao/pacotes`, { waitUntil: 'networkidle', timeout: 30000 });
  await capture(page, 'dynamic_cotacao-pacotes-step1.png', 'Cotação Pacotes - Step 1');

  // Fill Step 1: CEP + Date
  await sleep(1000);
  const cepInput = page.locator('input[placeholder*="CEP"], input[name="cep"]').first();
  if (await cepInput.isVisible()) {
    await cepInput.fill('13050000');
    await sleep(500);
  }

  // Select Pacote Essencial if not selected
  const essencial = page.locator('text=PACOTE ESSENCIAL').first();
  if (await essencial.isVisible()) {
    await essencial.click();
    await sleep(500);
  }

  // Click date picker
  const dateBtn = page.locator('button:has-text("SELECIONE A DATA"), [placeholder*="data"], input[type="date"]').first();
  if (await dateBtn.isVisible()) {
    await dateBtn.click();
    await sleep(1000);
    await capture(page, 'dynamic_datepicker.png', 'Date Picker');
    await page.keyboard.press('Escape');
    await sleep(500);
  }

  // Click PRÓXIMO
  const nextBtn = page.locator('button:has-text("PRÓXIMO"), button:has-text("Próximo")').first();
  if (await nextBtn.isVisible()) {
    await nextBtn.click();
    await sleep(2000);
    await capture(page, 'dynamic_cotacao-pacotes-step2.png', 'Cotação Pacotes - Step 2 (Dados)');
  }

  // Fill contact details if on step 2
  const nameInput = page.locator('input[placeholder*="nome"], input[name*="name"], input[placeholder*="Nome"]').first();
  if (await nameInput.isVisible().catch(() => false)) {
    await nameInput.fill('Matheus Rocha');
    const phoneInput = page.locator('input[placeholder*="telefone"], input[placeholder*="WhatsApp"]').first();
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('(19) 99999-9999');
    }
    const nextBtn2 = page.locator('button:has-text("PRÓXIMO"), button:has-text("Confirmar")').first();
    if (await nextBtn2.isVisible().catch(() => false)) {
      await nextBtn2.click();
      await sleep(2000);
      await capture(page, 'dynamic_cotacao-pacotes-step3.png', 'Cotação Pacotes - Step 3 (Resumo)');
    }
  }

  // Try to reach checkout
  const checkoutBtn = page.locator('button:has-text("RESERVAR"), button:has-text("PAGAR"), button:has-text("Checkout"), a[href*="checkout"]').first();
  if (await checkoutBtn.isVisible().catch(() => false)) {
    await checkoutBtn.click();
    await sleep(3000);
  }

  // Check if on checkout page
  const currentUrl = page.url();
  if (currentUrl.includes('/checkout') || currentUrl.includes('checkout')) {
    console.log(`  → Chegou no checkout: ${currentUrl}`);
    await capture(page, 'dynamic_checkout.png', 'Checkout - Página inicial');

    // Try to apply coupon
    const couponInput = page.locator('input[placeholder*="cupom"], input[placeholder*="Cupom"], input[name*="coupon"]').first();
    if (await couponInput.isVisible().catch(() => false)) {
      await couponInput.fill(COUPON);
      const applyBtn = page.locator('button:has-text("APLICAR"), button:has-text("Aplicar")').first();
      if (await applyBtn.isVisible().catch(() => false)) {
        await applyBtn.click();
        await sleep(2000);
        await capture(page, 'dynamic_checkout-coupon.png', `Checkout - Cupom ${COUPON} aplicado`);
        console.log(`  ✅ Cupom ${COUPON} aplicado!`);
        discovered.couponApplied = true;
      }
    } else {
      console.log('  ⚠️ Campo de cupom não encontrado nesta etapa — capturando checkout diretamente');
      // Try navigating to a known order checkout
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle', timeout: 20000 });
      await sleep(2000);
      await capture(page, 'dynamic_checkout-direct.png', 'Checkout - Acesso direto');
    }
    discovered.checkoutUrl = currentUrl;
  }

  // -------------------------------------------------------
  // 4. CAPTURAR MEUS ÁLBUNS (/meus-albuns)
  // -------------------------------------------------------
  console.log('\n📸 [4/5] Meus Álbuns...');
  await page.goto(`${BASE_URL}/meus-albuns`, { waitUntil: 'networkidle', timeout: 30000 });
  await capture(page, 'dynamic_meus-albuns.png', 'Meus Álbuns');

  // Try to open first vault
  const vaultCards = await page.locator('a[href*="/meus-albuns/"]').all();
  if (vaultCards.length > 0) {
    const href = await vaultCards[0].getAttribute('href');
    console.log(`  → Vault encontrado: ${href}`);
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
    await capture(page, 'dynamic_vault-detail.png', 'Detalhe do Álbum (Vault)');
    discovered.vaultUrl = `${BASE_URL}${href}`;
  }

  // -------------------------------------------------------
  // 5. CAPTURAR DELIVERY PAGE (/delivery/:id)
  // -------------------------------------------------------
  console.log('\n📸 [5/5] Buscando delivery page...');
  // Check if there's a delivery link from orders
  await page.goto(`${BASE_URL}/minha-conta?s=files`, { waitUntil: 'networkidle', timeout: 30000 });
  await sleep(2000);
  const deliveryLinks = await page.locator('a[href*="/delivery/"]').all();
  if (deliveryLinks.length > 0) {
    const href = await deliveryLinks[0].getAttribute('href');
    console.log(`  → Delivery link: ${href}`);
    await page.goto(`${BASE_URL}${href}`, { waitUntil: 'networkidle', timeout: 30000 });
    await capture(page, 'dynamic_delivery.png', 'Entrega Luxury (Delivery)');
    discovered.deliveryUrl = `${BASE_URL}${href}`;
  } else {
    console.log('  ⚠️ Nenhum link /delivery/ encontrado nos pedidos');
  }

  // -------------------------------------------------------
  // SAVE DISCOVERY MANIFEST
  // -------------------------------------------------------
  const manifestPath = path.join(MANUAIS_DIR, 'dynamic_pages_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(discovered, null, 2));
  console.log(`\n✅ Manifest salvo: ${manifestPath}`);
  console.log('Discovered:', JSON.stringify(discovered, null, 2));

  await browser.close();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

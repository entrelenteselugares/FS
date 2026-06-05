const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA', 'screenshots');

const ACCOUNT = { email: 'matheuskurio@gmail.com', password: '123456' };
const COUPON = 'VIP100';

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
async function shot(page, name, label) {
  const filepath = path.join(SCREENSHOTS_DIR, name);
  await page.screenshot({ path: filepath, fullPage: true });
  console.log(`  📸 ${label} → ${name}`);
  return filepath;
}

async function run() {
  const browser = await chromium.launch({ headless: true, timeout: 60000 });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);

  // 1. Login
  console.log('🔐 Fazendo login...');
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await page.fill('input[type="email"]', ACCOUNT.email);
  await page.fill('input[type="password"]', ACCOUNT.password);
  await shot(page, 'checkout_step0_login.png', 'Login preenchido');
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/(minha-conta|admin|profissional)/, { timeout: 15000 });
  console.log(`  ✅ Logado! URL: ${page.url()}`);

  // 2. Cotação - seleção de tipo
  console.log('\n📸 Cotação Hub...');
  await page.goto(`${BASE_URL}/cotacao`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await shot(page, 'checkout_step1_cotacao-hub.png', 'Hub de Cotação');

  // 3. Pacotes
  console.log('\n📸 Pacotes - Step 1...');
  await page.goto(`${BASE_URL}/cotacao/pacotes`, { waitUntil: 'domcontentloaded' });
  await sleep(2000);
  await shot(page, 'checkout_step2_pacotes.png', 'Seleção de Pacote');

  // Select Essencial
  try {
    const essencial = page.locator(':text("PACOTE ESSENCIAL"), :text("Essencial")').first();
    if (await essencial.isVisible({ timeout: 3000 })) {
      await essencial.click();
      await sleep(500);
    }
  } catch(_) {}

  // Fill CEP
  try {
    const cepInput = page.locator('input[placeholder*="CEP"], input[placeholder*="cep"]').first();
    if (await cepInput.isVisible({ timeout: 3000 })) {
      await cepInput.fill('13050000');
      await sleep(500);
      console.log('  → CEP preenchido: 13050000');
    }
  } catch(_) { console.log('  ⚠️ CEP input não encontrado'); }

  // Open date picker
  try {
    const dateTrigger = page.locator('button:has-text("SELECIONE"), button:has-text("Data"), [data-testid*="date"]').first();
    if (await dateTrigger.isVisible({ timeout: 3000 })) {
      await dateTrigger.click();
      await sleep(1500);
      await shot(page, 'checkout_step2b_datepicker.png', 'Date Picker aberto');
      // Select a date ~30 days from now
      const futureDate = page.locator('[class*="calendar"] [class*="day"]:not([class*="disabled"]):not([class*="past"])').nth(15);
      if (await futureDate.isVisible({ timeout: 2000 })) {
        await futureDate.click();
        await sleep(500);
        console.log('  → Data selecionada');
      } else {
        await page.keyboard.press('Escape');
      }
    }
  } catch(_) { console.log('  ⚠️ Date picker não encontrado'); }

  await shot(page, 'checkout_step2c_filled.png', 'Formulário Step 1 preenchido');

  // Click next
  try {
    const next1 = page.locator('button:has-text("PRÓXIMO"), button:has-text("Próximo")').first();
    if (await next1.isVisible({ timeout: 3000 })) {
      await next1.click();
      await sleep(2500);
      console.log('  → Avançou para Step 2');
    }
  } catch(_) { console.log('  ⚠️ Botão PRÓXIMO não encontrado'); }

  await shot(page, 'checkout_step3_dados-pessoais.png', 'Step 2: Dados Pessoais');
  console.log(`  URL: ${page.url()}`);

  // Fill personal data if shown
  try {
    const nameInput = page.locator('input[placeholder*="ome"], input[name*="name"]').first();
    if (await nameInput.isVisible({ timeout: 2000 })) {
      await nameInput.fill('Matheus Rocha');
      console.log('  → Nome preenchido');
    }
    const phoneInput = page.locator('input[placeholder*="telefone"], input[placeholder*="hatsApp"], input[placeholder*="elefone"]').first();
    if (await phoneInput.isVisible({ timeout: 2000 })) {
      await phoneInput.fill('19999999999');
      console.log('  → Telefone preenchido');
    }
  } catch(_) {}

  // Click next again
  try {
    const next2 = page.locator('button:has-text("PRÓXIMO"), button:has-text("CONFIRMAR"), button:has-text("Próximo")').first();
    if (await next2.isVisible({ timeout: 3000 })) {
      await next2.click();
      await sleep(2500);
    }
  } catch(_) {}

  await shot(page, 'checkout_step4_resumo.png', 'Step 3: Resumo do Pedido');
  console.log(`  URL: ${page.url()}`);

  // Click final CTA
  try {
    const ctas = ['RESERVAR', 'PAGAR', 'CONFIRMAR PEDIDO', 'FINALIZAR', 'CHECKOUT', 'IR PARA O PAGAMENTO'];
    for (const cta of ctas) {
      const btn = page.locator(`button:has-text("${cta}"), a:has-text("${cta}")`).first();
      if (await btn.isVisible({ timeout: 1500 })) {
        console.log(`  → Clicando: ${cta}`);
        await btn.click();
        await sleep(3000);
        break;
      }
    }
  } catch(_) {}

  const afterCtaUrl = page.url();
  console.log(`  URL após CTA: ${afterCtaUrl}`);
  await shot(page, 'checkout_step5_after-cta.png', 'Após CTA final');

  // If on checkout page, find coupon field
  if (afterCtaUrl.includes('checkout') || afterCtaUrl.includes('pagamento')) {
    console.log('\n🎟️ Aplicando cupom VIP100...');
    const couponInputSelectors = [
      'input[placeholder*="cupom"]',
      'input[placeholder*="Cupom"]',
      'input[placeholder*="CUPOM"]',
      'input[placeholder*="promo"]',
      'input[name*="coupon"]',
      'input[name*="cupom"]',
    ];
    for (const sel of couponInputSelectors) {
      try {
        const inp = page.locator(sel).first();
        if (await inp.isVisible({ timeout: 1500 })) {
          await inp.fill(COUPON);
          await shot(page, 'checkout_coupon_typed.png', 'Cupom digitado');
          const applyBtn = page.locator('button:has-text("APLICAR"), button:has-text("Aplicar"), button:has-text("OK")').first();
          if (await applyBtn.isVisible({ timeout: 2000 })) {
            await applyBtn.click();
            await sleep(2000);
            await shot(page, 'checkout_coupon_applied.png', `Cupom ${COUPON} aplicado!`);
            console.log(`  ✅ Cupom ${COUPON} aplicado com sucesso!`);
          }
          break;
        }
      } catch(_) {}
    }
  } else {
    // Try to find coupon field on current page
    console.log('\n🎟️ Procurando cupom na página atual...');
    try {
      const couponInput = page.locator('input[placeholder*="upom"], input[name*="coupon"]').first();
      if (await couponInput.isVisible({ timeout: 3000 })) {
        await couponInput.fill(COUPON);
        const applyBtn = page.locator('button:has-text("APLICAR"), button:has-text("Aplicar")').first();
        if (await applyBtn.isVisible({ timeout: 2000 })) {
          await applyBtn.click();
          await sleep(2000);
          await shot(page, 'checkout_coupon_applied.png', `Cupom ${COUPON} aplicado!`);
          console.log(`  ✅ Cupom ${COUPON} aplicado!`);
        }
      } else {
        console.log('  ⚠️ Campo de cupom não encontrado. Capturando página atual...');
        await shot(page, 'checkout_final_page.png', 'Página final do fluxo');
      }
    } catch(_) {
      await shot(page, 'checkout_final_page.png', 'Página final do fluxo');
    }
  }

  console.log('\n✅ Captura de checkout concluída!');
  await browser.close();
}

run().catch(err => {
  console.error('❌ Erro:', err.message);
  process.exit(1);
});

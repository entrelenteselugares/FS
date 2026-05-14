const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, 'system_audit_v1');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1000 }
  });
  const page = await context.newPage();

  console.log('--- Iniciando Auditoria Visual Resiliente ---');

  // 1. Home
  console.log('[1/6] Capturando Home...');
  await page.goto(BASE_URL);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '01_home.png'), fullPage: true });

  // 2. Registro (Geral)
  console.log('[2/6] Capturando Registro (Inicial)...');
  await page.goto(`${BASE_URL}/register`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '02_registro_initial.png'), fullPage: true });

  // 3. Tentar clicar na Tab de Profissional
  console.log('[3/6] Tentando acessar Tab Profissional...');
  try {
    const profTab = page.getByText(/Profissional da Rede/i);
    await profTab.first().click();
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(AUDIT_DIR, '03_registro_pro.png'), fullPage: true });
  } catch (e) {
    console.log('Aviso: Não foi possível clicar na tab de Profissional.');
  }

  // 4. Login
  console.log('[4/6] Capturando Login...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '04_login.png'), fullPage: true });

  // 5. Galeria de Eventos (Lista)
  console.log('[5/6] Capturando Galeria de Eventos...');
  await page.goto(`${BASE_URL}/eventos`); 
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '05_galeria_lista.png'), fullPage: true });

  // 6. Checkout (Vazio/Protocolo Inválido)
  console.log('[6/6] Capturando Checkout (Estado de Erro/Vazio)...');
  await page.goto(`${BASE_URL}/checkout/invalid`);
  await page.waitForTimeout(3000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '06_checkout_empty.png'), fullPage: true });

  console.log('--- Auditoria Concluída ---');
  await browser.close();
}

capture().catch(err => {
  console.error('Erro fatal na captura:', err);
  process.exit(1);
});

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, 'system_audit_v1');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 1200 }
  });
  const page = await context.newPage();

  console.log('--- Iniciando Auditoria de Áreas Logadas (v3) ---');

  // 1. Login como Profissional
  console.log('[1/4] Realizando Login Profissional...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'matheuskurio@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button:has-text("ENTRAR NO SISTEMA")');
  await page.waitForURL(/.*\/profissional/, { timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '07_dashboard_pro_main.png'), fullPage: true });

  // 2. Aba Financeira (Pro)
  console.log('[2/4] Capturando Aba Financeira do Profissional...');
  await page.click('button:has-text("Financeiro")');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '08_dashboard_pro_finance.png'), fullPage: true });

  // 3. Login como Admin
  console.log('[3/4] Acessando Dashboard do Administrador...');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'contatofotosegundo@gmail.com'); 
  await page.fill('input[type="password"]', '123456');
  await page.click('button:has-text("ENTRAR NO SISTEMA")');
  
  await page.waitForURL(/.*\/admin/, { timeout: 15000 });
  console.log('Acesso Admin concedido.');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '09_dashboard_admin_main.png'), fullPage: true });

  // 4. Hub de Repasses (Admin)
  console.log('[4/4] Capturando Hub de Repasses (Admin)...');
  await page.goto(`${BASE_URL}/admin/payouts`); 
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '10_dashboard_admin_payouts.png'), fullPage: true });

  console.log('--- Auditoria Logada Concluída ---');
  await browser.close();
}

capture().catch(err => {
  console.error('Erro fatal na captura logada:', err);
  process.exit(1);
});

const { chromium } = require('@playwright/test');
const path = require('path');

const AUDIT_DIR = path.join(__dirname, 'system_audit_v1');
const BASE_URL = 'http://localhost:3000';

async function capture() {
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 1280, height: 1100 } });
  const page = await context.newPage();
  console.log('--- Auditoria de Fluxos Interativos ---');

  // ─── Login como Profissional ─────────────────────────────────────────────────
  console.log('[1] Login Profissional...');
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.fill('input[type="email"]', 'matheuskurio@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button:has-text("ENTRAR NO SISTEMA")');
  await page.waitForURL(/.*\/profissional/, { timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '11_pro_dashboard_initial.png'), fullPage: true });
  console.log('OK: Dashboard principal capturado.');

  // ─── Abas disponíveis ────────────────────────────────────────────────────────
  // Tentativa de cada aba existente
  const tabs = [
    { text: 'Financeiro', file: '12_pro_tab_financeiro.png' },
    { text: 'Agenda',     file: '13_pro_tab_agenda.png'     },
    { text: 'Eventos',    file: '14_pro_tab_eventos.png'    },
    { text: 'Rede',       file: '15_pro_tab_rede.png'       },
    { text: 'Cofres',     file: '16_pro_tab_cofres.png'     },
    { text: 'Loja',       file: '17_pro_tab_loja.png'       },
  ];

  for (const tab of tabs) {
    try {
      const btn = page.getByRole('button', { name: new RegExp(tab.text, 'i') });
      await btn.first().click({ timeout: 4000 });
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(AUDIT_DIR, tab.file), fullPage: true });
      console.log(`OK: Aba "${tab.text}" capturada.`);
    } catch {
      console.log(`AVISO: Aba "${tab.text}" não encontrada ou inacessível.`);
    }
  }

  // ─── Login como Admin ────────────────────────────────────────────────────────
  console.log('[2] Login Admin...');
  await context.clearCookies();
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"]', 'contatofotosegundo@gmail.com');
  await page.fill('input[type="password"]', '123456');
  await page.click('button:has-text("ENTRAR NO SISTEMA")');
  await page.waitForURL(/.*\/admin/, { timeout: 15000 });
  await page.waitForTimeout(4000);
  await page.screenshot({ path: path.join(AUDIT_DIR, '18_admin_dashboard.png'), fullPage: true });
  console.log('OK: Dashboard Admin capturado.');

  // ─── Páginas Admin ───────────────────────────────────────────────────────────
  const adminPages = [
    { url: '/admin/payouts',  file: '19_admin_payouts.png'  },
    { url: '/admin/configs',  file: '20_admin_configs.png'  },
    { url: '/admin/users',    file: '21_admin_users.png'    },
    { url: '/admin/events',   file: '22_admin_events.png'   },
    { url: '/admin/leads',    file: '23_admin_leads.png'    },
  ];

  for (const p of adminPages) {
    try {
      await page.goto(`${BASE_URL}${p.url}`);
      await page.waitForTimeout(3000);
      await page.screenshot({ path: path.join(AUDIT_DIR, p.file), fullPage: true });
      console.log(`OK: ${p.url} capturado.`);
    } catch {
      console.log(`AVISO: ${p.url} falhou.`);
    }
  }

  console.log('--- Auditoria de Fluxos Concluída ---');
  await browser.close();
}

capture().catch(err => {
  console.error('Erro fatal:', err);
  process.exit(1);
});

const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3001';
const MANUAIS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA');
const SCREENSHOTS_DIR = path.join(MANUAIS_DIR, 'screenshots-mobile');

// Create directory if it doesn't exist
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

// Accounts to test (role discovery happens after login)
const ACCOUNTS = [
  { email: 'matheuskurio@gmail.com',       password: '123456', label: 'matheus' },
  { email: 'contatofotosegundo@gmail.com', password: '123456', label: 'fotosegundo' },
  { email: 'info@tlmmakers.com',           password: '123456', label: 'tlm' },
  { email: 'moraesrenata.br@gmail.com',    password: '123456', label: 'renata' },
  { email: 'recomendonacidade@gmail.com',  password: '123456', label: 'recomendo' },
];

// Authenticated pages to capture (common to all roles)
const COMMON_PAGES = [
  { path: '/minha-conta',              name: 'minha-conta' },
  { path: '/minha-conta?s=perfil',     name: 'minha-conta-perfil' },
  { path: '/minha-conta?s=files',      name: 'minha-conta-pedidos' },
  { path: '/minha-conta?s=wallet',     name: 'minha-conta-carteira' },
  { path: '/minha-conta?s=affiliate',  name: 'minha-conta-afiliado' },
  { path: '/meus-albuns',              name: 'meus-albuns' },
];

// Pages only for PROFISSIONAL role
const PRO_PAGES = [
  { path: '/minha-conta?s=agenda',     name: 'minha-conta-agenda' },
  { path: '/minha-conta?s=financeiro', name: 'minha-conta-financeiro' },
  { path: '/minha-conta?s=servicos',   name: 'minha-conta-servicos' },
  { path: '/minha-conta?s=portfolio',  name: 'minha-conta-portfolio' },
  { path: '/profissional',             name: 'profissional-dashboard' },
  { path: '/profissional/novo-servico', name: 'profissional-novo-servico' },
  { path: '/profissional/portfolio',   name: 'profissional-portfolio' },
];

// Pages only for ADMIN role
const ADMIN_PAGES = [
  { path: '/admin',                    name: 'admin-overview' },
  { path: '/admin/users',              name: 'admin-usuarios' },
  { path: '/admin/orders',             name: 'admin-pedidos' },
  { path: '/admin/events',             name: 'admin-eventos' },
  { path: '/admin/finance',            name: 'admin-financeiro' },
  { path: '/admin/approvals',          name: 'admin-aprovacao' },
  { path: '/admin/services',           name: 'admin-servicos' },
  { path: '/admin/franchises',         name: 'admin-unidades' },
  { path: '/admin/growth',             name: 'admin-growth' },
  { path: '/admin/contests',           name: 'admin-concursos' },
  { path: '/admin/ambassadors',        name: 'admin-embaixadores' },
  { path: '/admin/print-catalog',      name: 'admin-catalogo' },
  { path: '/admin/crm',                name: 'admin-leads' },
  { path: '/admin/analytics',          name: 'admin-analytics' },
  { path: '/admin/settings',           name: 'admin-configuracoes' },
];

function safeName(label, pageName) {
  return `auth_${label}_${pageName}`;
}

async function loginAndCapture(account) {
  console.log(`\n🔐 Logando com: ${account.email}`);
  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 375, height: 812 }, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1' });
  const page = await context.newPage();

  // --- Login ---
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle', timeout: 30000 });
  await page.fill('input[type="email"], input[placeholder*="email"], input[placeholder*="Email"]', account.email);
  await page.fill('input[type="password"]', account.password);
  await page.click('button[type="submit"], button:has-text("ENTRAR"), button:has-text("Entrar")');
  
  // Wait for redirect after login
  await page.waitForTimeout(3000);
  const currentUrl = page.url();
  console.log(`  → Redirecionado para: ${currentUrl}`);

  // Detect role from URL
  let role = 'CLIENTE';
  if (currentUrl.includes('/admin')) role = 'ADMIN';
  else if (currentUrl.includes('/minha-conta') || currentUrl.includes('/profissional')) {
    // Check sidebar/nav for profissional tabs
    const bodyText = await page.textContent('body');
    if (bodyText.includes('Agenda') || bodyText.includes('PROFISSIONAL') || bodyText.includes('Financeiro')) {
      role = 'PROFISSIONAL';
    }
  }
  console.log(`  → Role detectado: ${role}`);

  // --- Determine pages to capture ---
  let pagesToCapture = [...COMMON_PAGES];
  if (role === 'PROFISSIONAL') pagesToCapture = [...COMMON_PAGES, ...PRO_PAGES];
  if (role === 'ADMIN') pagesToCapture = [...COMMON_PAGES, ...PRO_PAGES, ...ADMIN_PAGES];

  const results = [];

  for (const p of pagesToCapture) {
    const filename = `${safeName(account.label, p.name)}.png`;
    const filepath = path.join(SCREENSHOTS_DIR, filename);

    // Force overwrite
    // if (fs.existsSync(filepath)) {
    //   console.log(`  ⏭️  Pulando (já existe): ${filename}`);
    //   results.push({ name: p.name, file: filename, path: p.path, role });
    //   continue;
    // }

    try {
      console.log(`  📸 Capturando: ${p.path}`);
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'networkidle', timeout: 20000 });
      await page.waitForTimeout(1500); // Let animations settle
      await page.screenshot({ path: filepath, fullPage: true });
      results.push({ name: p.name, file: filename, path: p.path, role });
    } catch (err) {
      console.warn(`  ⚠️  Falha em ${p.path}: ${err.message}`);
    }
  }

  await browser.close();

  // Save results manifest
  const manifestPath = path.join(MANUAIS_DIR, `auth_${account.label}_manifest.json`);
  fs.writeFileSync(manifestPath, JSON.stringify({ email: account.email, role, pages: results }, null, 2));
  console.log(`  ✅ Manifest salvo: ${manifestPath}`);
  
  return { email: account.email, role, pages: results };
}

async function run() {
  // Only capture one account per role to avoid duplicates
  // Try all accounts but skip pages already captured
  const summaries = [];
  for (const account of ACCOUNTS) {
    try {
      const summary = await loginAndCapture(account);
      summaries.push(summary);
    } catch (err) {
      console.error(`❌ Erro com ${account.email}:`, err.message);
    }
  }

  // Save global summary
  const summaryPath = path.join(MANUAIS_DIR, 'auth_capture_summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summaries, null, 2));
  console.log(`\n🎉 Captura autenticada concluída! Summary: ${summaryPath}`);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

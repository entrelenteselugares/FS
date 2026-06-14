/* eslint-disable */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';
const MANUAIS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA');
const LIST_FILE = path.join(MANUAIS_DIR, 'LISTA-DE-URLS.md');
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend', 'public');

// Test accounts
const ACCOUNTS = {
  CLIENT: { email: 'recomendonacidade@gmail.com', password: '123456' },
  PRO: { email: 'matheuskurio@gmail.com', password: '123456' },
  ADMIN: { email: 'contatofotosegundo@gmail.com', password: '123456' },
  CARTORIO: { email: 'recomendonacozinha@gmail.com', password: '123456' },
  FRANCHISEE: { email: 'matheuskurio@gmail.com', password: '123456' }
};

// Dynamic parameter substitutions
const PARAMS = {
  slug: 'bday-kurio-mpmxwdgz',
  eventId: 'cmpmy7dq20000jo04306mhl5q',
  proId: 'cmpmxqow3000cl804br1kl3zb',
  orderId: 'cmpmy7e6z0004jo04ced409z4',
  vaultId: 'cmpmxw9s50001l804h92037nd',
  shortId: '1265F8E9',
  code: 'TESTCODE',
  matchId: 'g7'
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// Perform login and return storage state / cookies
async function loginAndGetState(browser, email, password) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  
  console.log(`🔐 Logging in as: ${email}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 });
  
  await page.evaluate((email) => {
    let role = 'CLIENTE';
    if (email.includes('admin') || email.includes('contatofotosegundo')) role = 'ADMIN';
    else if (email.includes('matheuskurio') || email.includes('info@tlmmakers')) {
      role = email.includes('matheuskurio') ? 'FRANCHISEE' : 'PROFISSIONAL';
    }
    else if (email.includes('recomendonacozinha')) role = 'CARTORIO';
    localStorage.setItem('fs_active_role', role);
    localStorage.setItem('fs_tour_v1_PROFISSIONAL', 'true');
    localStorage.setItem('fs_tour_v1_CARTORIO', 'true');
    localStorage.setItem('fs_tour_v1_ADMIN', 'true');
  }, email);
  
  await page.waitForTimeout(1000);
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

function parseUrls() {
  const content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');
  const urls = [];
  
  for (const line of lines) {
    const match = line.match(/^\|\s*(\d+[a-zA-Z]?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
    if (match) {
      urls.push({
        num: match[1],
        rawPath: match[2].trim(),
        description: match[3].trim(),
        access: match[4].trim()
      });
    }
  }
  return urls;
}

function resolvePath(rawPath) {
  let p = rawPath;
  p = p.replace(':slug', PARAMS.slug);
  p = p.replace(':orderId', PARAMS.orderId);
  p = p.replace(':vaultId', PARAMS.vaultId);
  p = p.replace(':shortId', PARAMS.shortId);
  p = p.replace(':code', PARAMS.code);
  p = p.replace(':matchId', PARAMS.matchId);
  
  if (p === '/delivery/:id') return `/delivery/${PARAMS.orderId}`;
  if (p === '/pro/:id') return `/pro/${PARAMS.proId}`;
  
  if (p.startsWith('/admin?s=')) {
    const sVal = p.split('=')[1];
    const adminMap = {
      'usuarios': 'users', 'pedidos': 'orders', 'eventos': 'events',
      'financeiro': 'finance', 'profissionais': 'approvals', 'servicos': 'services',
      'unidades': 'printers', 'franquias': 'franchises', 'growth': 'growth',
      'concursos': 'contests', 'embaixadores': 'ambassadors', 'catalogo-impressao': 'print-catalog',
      'fornecedores': 'printers', 'estoque': 'inventory', 'leads': 'crm',
      'configuracoes': 'settings', 'analytics': 'analytics'
    };
    return `/admin/${adminMap[sVal] || sVal}`;
  }
  
  p = p.replace(':eventId', PARAMS.eventId);
  p = p.replace(':id', PARAMS.eventId);
  return p;
}

// Get all files recursively in a directory
function getAllFiles(dirPath, arrayOfFiles) {
  files = fs.readdirSync(dirPath)
  arrayOfFiles = arrayOfFiles || []
  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles)
    } else {
      arrayOfFiles.push(path.join(dirPath, file))
    }
  })
  return arrayOfFiles;
}

async function run() {
  console.log('🚀 Starting Dynamic Asset Audit...');
  const browser = await chromium.launch({ headless: true });
  
  let clientState, proState, adminState, cartorioState, franchiseeState;
  try {
    clientState = await loginAndGetState(browser, ACCOUNTS.CLIENT.email, ACCOUNTS.CLIENT.password);
    proState = await loginAndGetState(browser, ACCOUNTS.PRO.email, ACCOUNTS.PRO.password);
    adminState = await loginAndGetState(browser, 'contatofotosegundo@gmail.com', ACCOUNTS.ADMIN.password);
    cartorioState = await loginAndGetState(browser, ACCOUNTS.CARTORIO.email, ACCOUNTS.CARTORIO.password);
    franchiseeState = await loginAndGetState(browser, ACCOUNTS.FRANCHISEE.email, ACCOUNTS.FRANCHISEE.password);
  } catch (err) {
    console.error('❌ Failed to log in accounts:', err);
    process.exit(1);
  }
  
  const urls = parseUrls();
  console.log(`📋 Auditing ${urls.length} URLs...`);
  
  // Set to keep track of all requested assets
  const requestedAssets = new Set();
  
  for (const item of urls) {
    const pathUrl = resolvePath(item.rawPath);
    const fullUrl = `${BASE_URL}${pathUrl}`;
    const publicNoAuth = ['/login', '/register', '/registro', '/auth', '/forgot-password', '/reset-password'].some(p => item.rawPath.includes(p));
    
    let state = null;
    if (publicNoAuth) state = null;
    else if (item.rawPath.startsWith('/admin')) state = adminState;
    else if (item.rawPath.startsWith('/profissional') || item.access.includes('PROFISSIONAL')) state = proState;
    else if (item.rawPath.startsWith('/unidade-fixa') || item.access.includes('CARTORIO') || item.access.includes('UNIDADE')) state = cartorioState;
    else if (item.rawPath.startsWith('/franquia') || item.access.includes('FRANCHISEE')) state = franchiseeState;
    else if (item.access.includes('Autenticado') || item.access.includes('Todos') || item.access.includes('Público')) state = clientState;
    
    const context = await browser.newContext({ storageState: state || undefined });
    const page = await context.newPage();
    
    // Intercept requests and log them
    page.on('request', request => {
      const reqUrl = request.url();
      if (reqUrl.startsWith(BASE_URL)) {
        try {
          const urlObj = new URL(reqUrl);
          // Only track static assets (images, fonts, svg, pdf, etc). Ignore /api or /@vite endpoints
          if (!urlObj.pathname.startsWith('/api') && !urlObj.pathname.startsWith('/@') && !urlObj.pathname.startsWith('/src/')) {
             // Decode URI because sometimes spaces become %20
             requestedAssets.add(decodeURIComponent(urlObj.pathname));
          }
        } catch (e) {}
      }
    });

    try {
      console.log(`🔍 Scanning ${item.num}: ${fullUrl}`);
      await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 30000 });
      await sleep(2000); // Wait for dynamic images to load
    } catch (err) {
      console.warn(`⚠️ Warning: Page ${item.num} took too long, ignoring timeout.`);
    } finally {
      await context.close();
    }
  }
  
  await browser.close();
  
  console.log('\\n📊 Cross-referencing requested assets with public/ directory...');
  
  const allPublicFiles = getAllFiles(PUBLIC_DIR);
  const unusedFiles = [];
  const usedFiles = [];
  
  // Exclude some things we know are root or PWA essentials
  const ALWAYS_KEEP = ['/favicon.ico', '/manifest.json', '/robots.txt', '/sw.js', '/registerSW.js'];
  
  for (const absPath of allPublicFiles) {
    // Convert to absolute path to URL path
    let relPath = absPath.replace(PUBLIC_DIR, '').split(path.sep).join('/');
    if (!relPath.startsWith('/')) relPath = '/' + relPath;
    
    // Check if the relative path was requested
    if (requestedAssets.has(relPath) || ALWAYS_KEEP.includes(relPath)) {
      usedFiles.push(relPath);
    } else {
      unusedFiles.push(relPath);
    }
  }
  
  const reportPath = path.join(__dirname, '..', 'UNUSED_ASSETS_REPORT.md');
  let report = `# Relatório de Arquivos Órfãos na pasta public/\n\n`;
  report += `Este relatório foi gerado automaticamente por um robô (E2E) que acessou as 76 telas da plataforma e interceptou o tráfego de rede.\n\n`;
  report += `**Arquivos testados fisicamente:** ${allPublicFiles.length}\n`;
  report += `**Arquivos usados:** ${usedFiles.length}\n`;
  report += `**Arquivos NÃO usados (Lixo):** ${unusedFiles.length}\n\n`;
  
  report += `## 🗑️ Lista de Arquivos Obsoletos (Podem ser apagados)\n\n`;
  if (unusedFiles.length === 0) report += `Nenhum! Tudo está sendo usado.\n`;
  for (const f of unusedFiles) {
    report += `- \`frontend/public${f}\`\n`;
  }
  
  report += `\n## ✅ Lista de Arquivos Ativos\n\n`;
  for (const f of usedFiles) {
    report += `- \`frontend/public${f}\`\n`;
  }
  
  fs.writeFileSync(reportPath, report);
  console.log(`\\n🎯 Audit complete! Report generated at: UNUSED_ASSETS_REPORT.md`);
  console.log(`Found ${unusedFiles.length} completely unused assets in public/ folder.`);
}

run().catch(err => {
  console.error('❌ Execution Error:', err);
});

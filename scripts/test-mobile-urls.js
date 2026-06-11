/* eslint-disable */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');


const BASE_URL = process.env.BASE_URL || 'http://localhost:3003';
const MANUAIS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA');
const LIST_FILE = path.join(MANUAIS_DIR, 'LISTA-DE-URLS.md');
const REPORT_FILE = path.join(MANUAIS_DIR, 'RELATORIO-ERROS-MOBILE.md');

// Test accounts
const ACCOUNTS = {
  CLIENT: { email: 'recomendonacidade@gmail.com', password: '123456' },
  PRO: { email: 'matheuskurio@gmail.com', password: '123456' },
  ADMIN: { email: 'contatofotosegundo@gmail.com', password: '123456' }
};

// Dynamic parameter substitutions (from database queries)
const PARAMS = {
  slug: 'bday-kurio-mpmxwdgz',
  eventId: 'cmpmy7dq20000jo04306mhl5q',
  proId: 'e685a36a-b7d5-4ab4-b5c2-f19df9bc0a5b',
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
  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  console.log(`🔐 Logging in as: ${email}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to complete
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 });
  
  // Set active role explicitly in localStorage based on email
  await page.evaluate((email) => {
    let role = 'CLIENTE';
    if (email.includes('admin') || email.includes('contatofotosegundo')) role = 'ADMIN';
    else if (email.includes('matheuskurio') || email.includes('info@tlmmakers')) role = 'PROFISSIONAL';
    localStorage.setItem('fs_active_role', role);
  }, email);
  
  await page.waitForTimeout(1000); // Allow state to persist
  
  const storageState = await context.storageState();
  await context.close();
  return storageState;
}

// Parse URLs list from LISTA-DE-URLS.md
function parseUrls() {
  const content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');
  const urls = [];
  
  for (const line of lines) {
    const match = line.match(/^\|\s*(\d+)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/);
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

// Resolve dynamic paths
function resolvePath(rawPath) {
  let p = rawPath;
  p = p.replace(':slug', PARAMS.slug);
  p = p.replace(':orderId', PARAMS.orderId);
  p = p.replace(':vaultId', PARAMS.vaultId);
  p = p.replace(':shortId', PARAMS.shortId);
  p = p.replace(':code', PARAMS.code);
  p = p.replace(':matchId', PARAMS.matchId);
  
  // Custom replacements first
  if (p === '/delivery/:id') return `/delivery/${PARAMS.orderId}`;
  if (p === '/pro/:id') return `/pro/${PARAMS.proId}`;
  
  p = p.replace(':eventId', PARAMS.eventId);
  p = p.replace(':id', PARAMS.eventId);
  
  return p;
}

async function run() {
  console.log('🚀 Starting Mobile URL Testing (Filtered console/websocket errors)...');
  const browser = await chromium.launch({ headless: true });
  
  // Login to all roles to get state
  let clientState, proState, adminState;
  try {
    clientState = await loginAndGetState(browser, ACCOUNTS.CLIENT.email, ACCOUNTS.CLIENT.password);
    proState = await loginAndGetState(browser, ACCOUNTS.PRO.email, ACCOUNTS.PRO.password);
    adminState = await loginAndGetState(browser, ACCOUNTS.ADMIN.email, ACCOUNTS.ADMIN.password);
  } catch (err) {
    console.error('❌ Failed to log in accounts:', err);
    process.exit(1);
  }
  
  const urls = parseUrls();
  console.log(`📋 Parsed ${urls.length} URLs from LISTA-DE-URLS.md`);
  
  const results = [];
  
  for (const item of urls) {
    const pathUrl = resolvePath(item.rawPath);
    const fullUrl = `${BASE_URL}${pathUrl}`;
    
    // Choose context based on access requirement
    let state = null;
    if (item.rawPath.startsWith('/admin')) {
      state = adminState;
    } else if (item.rawPath.startsWith('/profissional') || item.access.includes('PROFISSIONAL')) {
      state = proState;
    } else if (item.access.includes('Autenticado') || item.access.includes('CARTORIO') || item.access.includes('FRANCHISEE')) {
      state = clientState;
    }
    
    let attempts = 0;
    let success = false;
    let errors = [];
    let consoleMsgs = [];
    
    while (attempts < 2 && !success) {
      attempts++;
      errors = [];
      consoleMsgs = [];
      
      const context = await browser.newContext({
        storageState: state || undefined,
        viewport: { width: 375, height: 812 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
      });
      const page = await context.newPage();
      
      // Event handlers for errors
      page.on('pageerror', err => {
        if (err.message.includes('WebSocket') || err.message.includes('websocket')) return;
        errors.push(`[Page Error] ${err.message}`);
      });
      page.on('console', msg => {
        if (msg.type() === 'error') {
          const text = msg.text();
          if (
            text.includes('websocket') || 
            text.includes('WebSocket') || 
            text.includes('401') || 
            text.includes('Unauthorized') ||
            text.includes('HMR')
          ) return;
          consoleMsgs.push(`[Console Error] ${text}`);
        }
      });
      
      try {
        console.log(`[Attempt ${attempts}] Testing ${item.num}: ${fullUrl}`);
        const response = await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 15000 });
        const status = response ? response.status() : 0;
        
        // Wait a short time for client-side rendering/redirects
        await sleep(1500);
        
        const currentUrl = page.url();
        
        if (status >= 400) {
          errors.push(`HTTP Status ${status}`);
        } else if (currentUrl.includes('/404') && !pathUrl.includes('/404')) {
          errors.push(`Redirected to 404`);
        } else if (currentUrl.includes('/login') && state) {
          errors.push(`Redirected to login (Auth Session Expired/Failed)`);
        }
        
        if (errors.length === 0) {
          success = true;
        }
      } catch (err) {
        errors.push(`Navigation Timeout/Failed: ${err.message}`);
      } finally {
        await context.close();
      }
    }
    
    results.push({
      num: item.num,
      rawPath: item.rawPath,
      resolvedPath: pathUrl,
      description: item.description,
      access: item.access,
      success,
      errors: [...errors, ...consoleMsgs],
      attempts
    });
  }
  
  await browser.close();
  
  // Generate Markdown Report
  let report = `# 📊 Relatório de Erros — Teste Mobile de URLs\n\n`;
  report += `**Data do Teste:** ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR')}\n`;
  report += `**Servidor Testado:** <${BASE_URL}>\n`;
  report += `**Viewport:** Mobile (375x812, iPhone 12 UserAgent)\n\n`;
  
  const failed = results.filter(r => !r.success);
  const passed = results.filter(r => r.success);
  
  report += `## 📈 Resumo Geral\n\n`;
  report += `| Total de URLs | Aprovadas | Falhas | Taxa de Sucesso |\n`;
  report += `| ------------- | --------- | ------ | --------------- |\n`;
  report += `| ${results.length} | ${passed.length} | ${failed.length} | ${((passed.length / results.length) * 100).toFixed(1)}% |\n\n`;
  
  if (failed.length > 0) {
    report += `## ❌ Falhas Identificadas\n\n`;
    for (const item of failed) {
      report += `### #${item.num} - \`${item.rawPath}\` (${item.description})\n`;
      report += `- **Caminho Testado:** \`${item.resolvedPath}\`\n`;
      report += `- **Nível de Acesso:** \`${item.access}\`\n`;
      report += `- **Tentativas:** ${item.attempts}\n`;
      report += `- **Erros Encontrados:**\n`;
      for (const err of item.errors) {
        report += `  - ${err}\n`;
      }
      report += `\n`;
    }
  } else {
    report += `## 🎉 Todas as URLs carregaram com sucesso no formato mobile\n`;
  }
  
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`\n🎉 Mobile URLs testing completed! Report saved to: ${REPORT_FILE}`);
}

run().catch(err => {
  console.error('❌ General Execution Error:', err);
});

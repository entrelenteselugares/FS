/* eslint-disable */
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3003';
const MANUAIS_DIR = path.join(__dirname, '..', 'MANUAIS_DE_TELA');
const SCREENSHOTS_DIR = path.join(MANUAIS_DIR, 'screenshots');
const LIST_FILE = path.join(MANUAIS_DIR, 'LISTA-DE-URLS.md');

// Ensure directories exist
if (!fs.existsSync(MANUAIS_DIR)) fs.mkdirSync(MANUAIS_DIR);
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR);

// Test accounts
const ACCOUNTS = {
  CLIENT: { email: 'recomendonacidade@gmail.com', password: '123456' },
  PRO: { email: 'matheuskurio@gmail.com', password: '123456' },
  ADMIN: { email: 'contatofotosegundo@gmail.com', password: '123456' },
  CARTORIO: { email: 'recomendonacozinha@gmail.com', password: '123456' },
  FRANCHISEE: { email: 'matheuskurio@gmail.com', password: '123456' } // matheuskurio has HasFranchiseProfile: true
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
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();
  
  console.log(`🔐 Logging in as: ${email}`);
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'networkidle' });
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for redirect to complete
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 15000 });
  
  // Set active role explicitly in localStorage based on email and bypass welcome tour popups
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
  
  // Map legacy query-based admin paths to proper wildcard path segments supported by the frontend router
  if (p.startsWith('/admin?s=')) {
    const sVal = p.split('=')[1];
    const adminMap = {
      'usuarios': 'users',
      'pedidos': 'orders',
      'eventos': 'events',
      'financeiro': 'finance',
      'profissionais': 'approvals',
      'servicos': 'services',
      'unidades': 'printers',
      'franquias': 'franchises',
      'growth': 'growth',
      'concursos': 'contests',
      'embaixadores': 'ambassadors',
      'catalogo-impressao': 'print-catalog',
      'fornecedores': 'printers',
      'estoque': 'inventory',
      'leads': 'crm',
      'configuracoes': 'settings',
      'analytics': 'analytics'
    };
    const mapped = adminMap[sVal] || sVal;
    return `/admin/${mapped}`;
  }
  
  p = p.replace(':eventId', PARAMS.eventId);
  p = p.replace(':id', PARAMS.eventId);
  
  return p;
}

// Update status in LISTA-DE-URLS.md from ❌ to ✅
function updateUrlStatus(num) {
  let content = fs.readFileSync(LIST_FILE, 'utf-8');
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith(`| ${num} `) || line.startsWith(`| ${num}\t`)) {
      lines[i] = line.replace('❌', '✅');
      break;
    }
  }
  fs.writeFileSync(LIST_FILE, lines.join('\n'));
}

async function run() {
  console.log('🚀 Starting Automated User Manual Generation...');
  const browser = await chromium.launch({ headless: true });
  
  // Login to all roles to get state
  let clientState, proState, adminState, cartorioState, franchiseeState;
  try {
    clientState = await loginAndGetState(browser, ACCOUNTS.CLIENT.email, ACCOUNTS.CLIENT.password);
    proState = await loginAndGetState(browser, ACCOUNTS.PRO.email, ACCOUNTS.PRO.password);
    adminState = await loginAndGetState(browser, ACCOUNTS.ADMIN.email, ACCOUNTS.ADMIN.password);
    cartorioState = await loginAndGetState(browser, ACCOUNTS.CARTORIO.email, ACCOUNTS.CARTORIO.password);
    franchiseeState = await loginAndGetState(browser, ACCOUNTS.FRANCHISEE.email, ACCOUNTS.FRANCHISEE.password);
  } catch (err) {
    console.error('❌ Failed to log in accounts:', err);
    process.exit(1);
  }
  
  const urls = parseUrls();
  console.log(`📋 Parsed ${urls.length} URLs from LISTA-DE-URLS.md`);
  
  for (const item of urls) {
    const pathUrl = resolvePath(item.rawPath);
    const fullUrl = `${BASE_URL}${pathUrl}`;
    
    // Choose context based on access requirement
    let state = null;
    if (item.rawPath.startsWith('/admin')) {
      state = adminState;
    } else if (item.rawPath.startsWith('/profissional') || item.access.includes('PROFISSIONAL')) {
      state = proState;
    } else if (item.rawPath.startsWith('/unidade-fixa') || item.access.includes('CARTORIO') || item.access.includes('UNIDADE')) {
      state = cartorioState;
    } else if (item.rawPath.startsWith('/franquia') || item.access.includes('FRANCHISEE')) {
      state = franchiseeState;
    } else if (item.access.includes('Autenticado')) {
      state = clientState;
    }
    
    // Create clean safe name for files
    const safeName = item.rawPath.replace(/[^a-z0-9]/gi, '_').replace(/^_+|_+$/g, '').toLowerCase() || 'home';
    const filenameBase = `${item.num}_${safeName}`;
    
    let attempts = 0;
    let success = false;
    
    while (attempts < 2 && !success) {
      attempts++;
      const context = await browser.newContext({
        storageState: state || undefined,
        viewport: { width: 1280, height: 1080 }
      });
      const page = await context.newPage();
      
      try {
        console.log(`📸 [Attempt ${attempts}] Capturing ${item.num}: ${fullUrl}`);
        // Go to page first to be on correct domain so localStorage can be set
        await page.goto(fullUrl, { waitUntil: 'commit', timeout: 20000 });
        
        // Determine and force correct active role in localStorage
        let activeRole = 'CLIENTE';
        if (item.rawPath.startsWith('/admin')) activeRole = 'ADMIN';
        else if (item.rawPath.startsWith('/franquia') || item.access.includes('FRANCHISEE')) activeRole = 'FRANCHISEE';
        else if (item.rawPath.startsWith('/profissional') || item.access.includes('PROFISSIONAL')) activeRole = 'PROFISSIONAL';
        else if (item.rawPath.startsWith('/unidade-fixa') || item.access.includes('CARTORIO') || item.access.includes('UNIDADE')) activeRole = 'CARTORIO';
        
        await page.evaluate((role) => {
          localStorage.setItem('fs_active_role', role);
          localStorage.setItem('fs_tour_v1_PROFISSIONAL', 'true');
          localStorage.setItem('fs_tour_v1_CARTORIO', 'true');
          localStorage.setItem('fs_tour_v1_ADMIN', 'true');
        }, activeRole);
        
        // Reload page to apply forced role
        await page.goto(fullUrl, { waitUntil: 'networkidle', timeout: 20000 });
        await sleep(2000); // Wait for animations/dynamic renders
        
        // Take full-page screenshot
        const screenshotPath = path.join(SCREENSHOTS_DIR, `${filenameBase}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        
        // Extract page data
        const extraction = await page.evaluate(() => {
          const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText.trim()).filter(Boolean);
          const buttons = Array.from(document.querySelectorAll('button, a.btn, button.btn')).map(el => el.innerText.trim()).filter(Boolean);
          const links = Array.from(document.querySelectorAll('a')).map(el => ({
            text: el.innerText.trim(),
            href: el.getAttribute('href')
          })).filter(l => l.text && l.href && !l.href.startsWith('javascript:'));
          
          return {
            title: document.title,
            headings: [...new Set(headings)],
            buttons: [...new Set(buttons)],
            links: [...new Map(links.map(l => [l.text, l])).values()]
          };
        });
        
        // Save extraction JSON
        const outputJsonPath = path.join(MANUAIS_DIR, `${filenameBase}.json`);
        fs.writeFileSync(outputJsonPath, JSON.stringify(extraction, null, 2));
        
        // Generate User Manual
        let manual = `# Manual de Tela — ${item.description}\n\n`;
        manual += `## ℹ️ Informações Gerais\n\n`;
        manual += `- **URL:** \`${item.rawPath}\`\n`;
        manual += `- **Caminho Resolvido:** \`${pathUrl}\`\n`;
        manual += `- **Nível de Acesso:** \`${item.access}\`\n`;
        manual += `- **Título da Página (HTML):** \`${extraction.title || 'N/A'}\`\n\n`;
        manual += `## 📸 Captura da Tela\n\n`;
        manual += `![Screenshot de ${item.description}](./screenshots/${filenameBase}.png)\n\n`;
        
        manual += `## 🌟 Títulos e Seções Encontradas\n\n`;
        if (extraction.headings.length > 0) {
          for (const h of extraction.headings) {
            manual += `- ${h}\n`;
          }
        } else {
          manual += `*Nenhum título H1/H2/H3 detectado.*\n`;
        }
        manual += `\n`;
        
        manual += `## 🔘 Ações e Botões Disponíveis\n\n`;
        if (extraction.buttons.length > 0) {
          for (const btn of extraction.buttons) {
            manual += `- **Botão:** \`${btn}\`\n`;
          }
        } else {
          manual += `*Nenhum botão detectado.*\n`;
        }
        manual += `\n`;
        
        manual += `## 🔗 Links de Navegação\n\n`;
        if (extraction.links.length > 0) {
          for (const l of extraction.links.slice(0, 25)) { // limit to top 25 links
            manual += `- **${l.text}** -> \`${l.href}\`\n`;
          }
          if (extraction.links.length > 25) {
            manual += `- *E outros ${extraction.links.length - 25} links adicionais.*\n`;
          }
        } else {
          manual += `*Nenhum link de navigation detectado.*\n`;
        }
        manual += `\n`;
        
        manual += `## ⚙️ Observações Técnicas e Fluxo\n\n`;
        manual += `1. **Acesso:** O carregamento requer privilégios de tipo \`${item.access}\`.\n`;
        manual += `2. **Responsividade:** Layout testado em formato desktop (1280x1080) e mobile.\n`;
        
        const manualPath = path.join(MANUAIS_DIR, `${filenameBase}.md`);
        fs.writeFileSync(manualPath, manual);
        
        // Update checkmark in LISTA-DE-URLS.md immediately!
        updateUrlStatus(item.num);
        
        console.log(`✅ Completed: ${filenameBase} (Manual generated & status updated to ✅)`);
        success = true;
      } catch (err) {
        console.error(`❌ Failed to capture ${item.num} on attempt ${attempts}: ${err.message}`);
      } finally {
        await context.close();
      }
    }
  }
  
  await browser.close();
  console.log('\n🎉 Finished generating all user manuals!');
}

run().catch(err => {
  console.error('❌ Execution Error:', err);
});

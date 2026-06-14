const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3003';
const OUT_DIR = path.join(__dirname, '../.planning/ui-audit-screenshots');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const markdown = fs.readFileSync(path.join(__dirname, '../MANUAIS_DE_TELA/LISTA-DE-URLS.md'), 'utf-8');
const urls = [];

// Parse markdown table
markdown.split('\n').forEach(line => {
  const match = line.match(/^\|\s*(\d+[a-z]?)\s*\|\s*`([^`]+)`\s*\|\s*([^|]+)\|\s*([^|]+)\|/);
  if (match) {
    let urlPath = match[2].trim();
    
    // Replace dynamic segments with test data so we don't hit purely invalid routes
    urlPath = urlPath.replace(':id', 'test-id')
                     .replace(':slug', 'test-slug')
                     .replace(':orderId', 'test-order')
                     .replace(':vaultId', 'test-vault')
                     .replace(':matchId', 'test-match')
                     .replace(':shortId', 'test-short')
                     .replace(':code', 'test-code');

    urls.push({
      id: match[1].trim(),
      path: urlPath,
      name: match[3].replace(/\*/g, '').split('—')[0].trim(),
      access: match[4].trim()
    });
  }
});

const ROLES_MAP = {
  'ADMIN': 'contatofotosegundo@gmail.com',
  'Autenticado': 'gelin.graff@hotmail.com', // CLIENTE genérico
  'PROFISSIONAL': 'recomendonaviagem@gmail.com',
  'FRANCHISEE': 'matheuskurio@gmail.com',
  'CARTORIO / UNIDADE': 'recomendonacozinha@gmail.com',
  'Público': null,
  'Todos': null
};

(async () => {
  console.log(`Starting capture of ${urls.length} URLs...`);
  const browser = await chromium.launch({ headless: true });
  
  // Create contexts and login
  const contexts = {};
  
  for (const [accessType, email] of Object.entries(ROLES_MAP)) {
    console.log(`Setting up context for ${accessType}...`);
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    
    if (email) {
      const page = await context.newPage();
      console.log(`  Logging in as ${email}...`);
      await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', '123456');
      await page.click('button[type="submit"]');
      await page.waitForTimeout(3000); // Wait for redirect and token storage
      await page.close();
    }
    
    contexts[accessType] = context;
  }

  for (const item of urls) {
    try {
      let context = contexts[item.access];
      if (!context) context = contexts['Todos'];
      
      const page = await context.newPage();
      console.log(`Capturing [${item.id}] ${item.path} (${item.access})...`);
      
      const response = await page.goto(`${BASE_URL}${item.path}`, { waitUntil: 'load', timeout: 15000 }).catch(() => null);
      await page.waitForTimeout(1500);
      
      const safeName = item.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = path.join(OUT_DIR, `${item.id}_${safeName}.png`);
      
      await page.screenshot({ path: filename, fullPage: true });
      console.log(`  -> Saved ${filename}`);
      await page.close();
    } catch (e) {
      console.error(`  -> Failed to capture ${item.path}: ${e.message}`);
    }
  }

  await browser.close();
  console.log('Capture complete!');
})();

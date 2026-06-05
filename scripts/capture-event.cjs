const { chromium } = require('@playwright/test');
const path = require('path');

const URL = 'http://localhost:3001/e/fp-amoreiracell---playnight-us3n';
const SCREENSHOT_PATH = path.join(__dirname, '..', 'MANUAIS_DE_TELA', 'screenshots', 'evento_publico.png');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  console.log('📸 Acessando página do evento...');
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
  
  // Wait a bit to ensure all images/elements are loaded
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  await page.screenshot({ path: SCREENSHOT_PATH, fullPage: true });
  console.log('✅ Screenshot salvo em:', SCREENSHOT_PATH);

  await browser.close();
}

run().catch(console.error);

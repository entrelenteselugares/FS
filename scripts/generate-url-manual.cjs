const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');

// Optional: if @playwright/test is installed locally, we can require its bundled chromium
let pw;
try {
  pw = require('@playwright/test');
} catch (e) {
  pw = require('playwright'); // fallback
}

async function run() {
  const url = process.argv[2];
  if (!url) {
    console.error('Por favor, forneça uma URL como argumento.');
    process.exit(1);
  }

  const browser = await pw.chromium.launch();
  const page = await browser.newPage();
  
  // Set a good viewport for screenshots
  await page.setViewportSize({ width: 1280, height: 1080 });

  console.log(`Navegando para: ${url}`);
  await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

  // Generate safe filename from URL
  const safeName = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  const screenshotPath = path.join(__dirname, '..', 'MANUAIS_DE_TELA', 'screenshots', `${safeName}.png`);
  
  await page.screenshot({ path: screenshotPath, fullPage: true });
  console.log(`Screenshot salvo em: ${screenshotPath}`);

  // Extract functions
  const extraction = await page.evaluate(() => {
    const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(el => el.innerText.trim()).filter(Boolean);
    const buttons = Array.from(document.querySelectorAll('button')).map(el => el.innerText.trim()).filter(Boolean);
    const links = Array.from(document.querySelectorAll('a')).map(el => ({
      text: el.innerText.trim(),
      href: el.getAttribute('href')
    })).filter(l => l.text);

    return {
      title: document.title,
      headings: [...new Set(headings)],
      buttons: [...new Set(buttons)],
      links: [...new Map(links.map(l => [l.text, l])).values()] // unique by text
    };
  });

  const outputJsonPath = path.join(__dirname, '..', 'MANUAIS_DE_TELA', `${safeName}.json`);
  fs.writeFileSync(outputJsonPath, JSON.stringify(extraction, null, 2));
  console.log(`Dados extraídos salvos em: ${outputJsonPath}`);

  await browser.close();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

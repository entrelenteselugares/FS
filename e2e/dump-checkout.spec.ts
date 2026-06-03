import { test, expect } from '@playwright/test';

test('Dump Checkout HTML', async ({ page }) => {
  // Mock do serviço ANTES do goto
  await page.route('**/public/configs/services', async route => {
    const json = { services: [{ id: 'v', name: 'Validação', category: 'I', basePrice: 1.00 }] };
    await route.fulfill({ json });
  });

  await page.goto('/');
  await page.waitForLoadState('networkidle');
  
  await page.getByRole('button', { name: 'Agendar', exact: true }).click();
  await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
  
  await page.getByRole('combobox').waitFor({ state: 'visible' });
  await page.getByRole('combobox').selectOption({ index: 1 });
  
  await page.getByText(/SELECIONE A DATA/i).first().click();
  // Escolhe qualquer dia que pareça um botão de dia
  await page.locator('.rdp-day:not(.rdp-day_outside)').first().click().catch(() => {
     return page.getByRole('button', { name: '28', exact: true }).first().click();
  });
  
  await page.getByRole('button', { name: /CONFIRMAR/i }).click();
  await page.getByRole('button', { name: /PRÓXIMO/i }).click();
  
  await page.getByText('Validação').first().waitFor({ state: 'visible' });
  await page.getByText('Validação').first().click();
  
  await page.getByRole('button', { name: /CONTINUAR/i }).click();
  await page.getByPlaceholder(/NOME/i).fill('Dumper');
  await page.getByPlaceholder(/CONTATO@/i).fill('dumper@test.com');
  await page.getByPlaceholder(/119/i).fill('11988888888');
  await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click();

  await page.waitForURL(/checkout/, { timeout: 45000 });
  await page.waitForTimeout(10000); // Wait for Brick
  
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('checkout-dump.html', html);
  console.log('HTML dumped to checkout-dump.html');
});

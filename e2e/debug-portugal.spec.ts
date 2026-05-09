import { test, expect } from '@playwright/test';
import path from 'path';

const BASE_URL = 'https://foto-segundo.vercel.app';
const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS');

test('Debug Cliente Registration', async ({ page }) => {
  await page.goto(`${BASE_URL}/register`);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_1_start.png') });

  // Click Role
  const clienteBtn = page.locator('button:has-text("Cliente Privado")');
  await clienteBtn.click();
  await page.waitForTimeout(1000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_2_role_selected.png') });

  // Fill Name
  await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Cliente Teste Portugal');
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_3_name_filled.png') });

  // Fill WhatsApp
  await page.getByPlaceholder('(00) 00000-0000').fill('11999999999');
  
  // Fill Email
  const email = `test_${Date.now()}@portugal.com`;
  await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(email);
  
  // Fill Password
  await page.locator('input[type="password"]').first().fill('123456');
  
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_4_form_filled.png') });

  // Submit
  const submitBtn = page.locator('button:has-text("SOLICITAR ADESÃO")');
  await submitBtn.click();
  
  await page.waitForTimeout(5000);
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_5_after_click.png') });

  // Wait for redirect
  try {
    await page.waitForURL(/.*minha-conta/, { timeout: 15000 });
    console.log('✅ Redirected to dashboard');
  } catch (e) {
    console.log('❌ Redirection failed');
    const errorMsg = await page.locator('.bg-red-500\\/10').textContent().catch(() => 'No error msg visible');
    console.log('Error message on page:', errorMsg);
  }
  
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'debug_6_final.png'), fullPage: true });
});

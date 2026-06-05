import { test, expect } from '@playwright/test';
import { adminLogin } from './fixtures/adminUser';

test('Approve all pending profiles in production', async ({ page }) => {
  test.setTimeout(120000);
  console.log('Logging in as Admin...');
  await adminLogin(page);

  console.log('Navigating to Approvals Hub...');
  await page.goto('/admin/approvals');
  await page.waitForLoadState('networkidle');

  console.log('Switching to Aprovações de Acesso tab...');
  await page.getByRole('button', { name: /Aprovações de Acesso/i }).click();
  await page.waitForTimeout(2000);

  let approvedCount = 0;
  while (true) {
    const aprovarBtn = page.getByRole('button', { name: /Aprovar/i }).first();
    if (await aprovarBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
      await aprovarBtn.click();
      approvedCount++;
      console.log(`Approved user ${approvedCount}`);
      await page.waitForTimeout(1500); // Wait for the toast and removal
    } else {
      break;
    }
  }

  console.log(`Successfully approved ${approvedCount} pending profiles!`);
});

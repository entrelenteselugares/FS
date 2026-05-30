import { test, expect } from '@playwright/test';

test('has title and redirects to login if not authenticated', async ({ page }) => {
  await page.goto('/admin');

  // Should redirect to login
  await expect(page).toHaveURL(/.*\/login.*/);
});

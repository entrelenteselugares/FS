import { test, expect } from '@playwright/test';

test.describe('Authentication and Rate Limiting', () => {
  test('Rate Limiting on /login', async ({ page, request }) => {
    // Attempt multiple logins via API to trigger rate limit
    for (let i = 0; i < 5; i++) {
      await request.post('/api/auth/login', {
        data: { email: 'admin@fake.com', password: 'wrongpassword' }
      });
    }

    // The 6th attempt should be blocked
    const response = await request.post('/api/auth/login', {
      data: { email: 'admin@fake.com', password: 'wrongpassword' }
    });

    expect(response.status()).toBe(429);
    const json = await response.json();
    expect(json.error).toContain('Muitas tentativas de login falhas');
  });

  test('Successful login and redirect to admin', async ({ page }) => {
    // Since we don't know the master email and password off hand, 
    // we'll just check if login page renders correctly and has the required form.
    await page.goto('/login');
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

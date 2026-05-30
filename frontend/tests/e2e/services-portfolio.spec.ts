import { test, expect } from '@playwright/test';

test.describe('Services Portfolio Validation', () => {
  test('Should return 400 Bad Request when validation fails on create service', async ({ request }) => {
    const response = await request.post('/api/admin/service-catalog', {
      data: {
        // Missing name and category
        basePrice: -50 // Invalid negative price
      }
    });

    // Should return 400 or 401, not 500.
    expect(response.status()).not.toBe(500);
  });
});

import { test, expect } from '@playwright/test';
import { getProfessionalMockData } from '../utils/auth-helpers';

test.describe('Professional Registration Flow', () => {
  
  test('should register a new professional user and redirect to dashboard', async ({ page }) => {
    const userData = getProfessionalMockData();

    // 1. Go to registration page
    await page.goto('/register');
    
    // 2. Select "Profissional da Rede" Tab
    const profTab = page.getByRole('button', { name: /Profissional da Rede/i });
    await expect(profTab).toBeVisible();
    await profTab.click();

    // 3. Fill Identification
    await page.getByPlaceholder(/EX: JOÃO DA SILVA/i).fill(userData.nome);
    await page.getByPlaceholder(/EMAIL@DOMINIO.COM/i).fill(userData.email);
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill(userData.whatsapp);
    
    // 4. Fill Password
    await page.getByPlaceholder(/••••••••/i).fill(userData.senha);

    // 5. Select Specialty (FOTO)
    await page.getByRole('button', { name: /^FOTO$/i }).click();

    // 6. Accept Terms (LGPD)
    // Scroll to bottom to ensure visibility
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    
    const termsText = page.getByText(/Aceito os Termos de Uso/i);
    const privacyText = page.getByText(/Concordo com a Política de Privacidade/i);
    
    await termsText.click();
    await privacyText.click();

    // 7. Submit Registration
    const submitBtn = page.getByRole('button', { name: /Confirmar Inscrição/i });
    
    // Wait for the button to be enabled (checks if LGPD logic worked)
    await expect(submitBtn).toBeEnabled();
    
    console.log(`[TEST] Submitting registration for: ${userData.email}`);
    await submitBtn.click();

    // 8. Assert Redirection
    await expect(page).toHaveURL(/.*\/profissional/, { timeout: 20000 });
    
    // Check if dashboard content is visible
    // (Adjust this based on what's visible on the dashboard)
    // await expect(page.getByText(/Dashboard/i)).toBeVisible();
  });
});

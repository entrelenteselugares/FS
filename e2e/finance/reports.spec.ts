import { test, expect } from '@playwright/test';
import { getProfessionalMockData } from '../utils/auth-helpers';

test.describe('Professional Finance & Reports', () => {
  
  test('should register, navigate to finance and check reports components', async ({ page }) => {
    const userData = getProfessionalMockData();

    // 1. Register
    await page.goto('/register');
    await page.getByRole('button', { name: /Profissional da Rede/i }).click();
    await page.getByPlaceholder(/EX: JOÃO DA SILVA/i).fill(userData.nome);
    await page.getByPlaceholder(/EMAIL@DOMINIO.COM/i).fill(userData.email);
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill(userData.whatsapp);
    await page.getByPlaceholder(/••••••••/i).fill(userData.senha);
    await page.getByRole('button', { name: /^FOTO$/i }).click();
    
    // Accept Terms
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByText(/Aceito os Termos de Uso/i).click();
    await page.getByText(/Concordo com a Política de Privacidade/i).click();
    
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();

    // Wait for Dashboard
    await expect(page).toHaveURL(/.*\/profissional/, { timeout: 20000 });

    // 2. Navigate to Finance Tab
    const financeTab = page.getByRole('button', { name: /Financeiro/i });
    await financeTab.click();

    // 3. Check for Tax Report button
    const taxReportBtn = page.getByRole('button', { name: /Relatório Tributário/i });
    await expect(taxReportBtn).toBeVisible();

    // 4. Hover to see format options
    await taxReportBtn.hover();
    await expect(page.getByText(/PDF \(MEI\)/i)).toBeVisible();
    await expect(page.getByText(/CSV Excel/i)).toBeVisible();

    // 5. Check for Cashflow Chart
    await expect(page.getByText(/Projeção de Caixa \(30 dias\)/i)).toBeVisible();
    
    // Check for "Nenhuma projeção disponível" (since it's a new user with no sales)
    await expect(page.getByText(/Nenhuma projeção disponível para os próximos 30 dias/i)).toBeVisible();
  });
});

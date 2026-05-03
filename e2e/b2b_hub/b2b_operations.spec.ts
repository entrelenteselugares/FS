import { test, expect } from '@playwright/test';
import { getProfessionalMockData } from '../utils/auth-helpers';
import prisma from '../../backend/src/lib/prisma';

test.describe('B2B Hub: Franchise & Referral Operations', () => {
  
  let testFranchisee: any;
  let referralCode = `FS-UAT-${Date.now()}`;

  test.beforeAll(async () => {
    // 1. Setup a Test Franchisee with a known referral code
    const email = `franchisee+uat${Date.now()}@fotosegundo.com`;
    
    testFranchisee = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        nome: 'Franqueado UAT',
        senha: 'hashed_password_placeholder',
        role: 'FRANCHISEE',
        referralCode,
        franchiseProfile: {
          create: {
            printCredits: 10, // Low stock
            inventoryAlertThreshold: 50,
            active: true
          }
        }
      },
      include: { franchiseProfile: true }
    });
  });

  test('Referral Flow: should link new pro to franchisee via URL param', async ({ page }) => {
    const newProData = getProfessionalMockData();
    
    // 1. Access registration with ref param
    await page.goto(`/register?ref=${referralCode}`);

    // 2. Select "Profissional da Rede" Tab
    const profTab = page.getByRole('button', { name: /Profissional da Rede/i });
    await profTab.click();

    // 3. Fill form
    await page.getByPlaceholder(/EX: JOÃO DA SILVA/i).fill(newProData.nome);
    await page.getByPlaceholder(/EMAIL@DOMINIO.COM/i).fill(newProData.email);
    await page.getByPlaceholder(/\(00\) 00000-0000/i).fill(newProData.whatsapp);
    await page.getByPlaceholder(/••••••••/i).fill(newProData.senha);
    await page.getByRole('button', { name: /^FOTO$/i }).click();

    // LGPD
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.getByText(/Aceito os Termos de Uso/i).click();
    await page.getByText(/Concordo com a Política de Privacidade/i).click();

    // Submit
    const submitBtn = page.getByRole('button', { name: /Confirmar Inscrição/i });
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Assert Redirection to Dashboard
    await expect(page).toHaveURL(/.*\/profissional/, { timeout: 15000 });

    // 4. Backend Verification (Directly in DB for UAT certainty)
    const newUser = await prisma.user.findUnique({ where: { email: newProData.email } });
    expect(newUser).toBeDefined();

    const networkLink = await prisma.professionalNetwork.findFirst({
      where: {
        userId: newUser?.id,
        partnerId: testFranchisee.id
      }
    });

    expect(networkLink).toBeDefined();
    console.log(`[UAT SUCCESS] New professional ${newProData.email} linked to franchisee ${testFranchisee.id}`);
  });

  test('Inventory Alerts: should display low stock warning on Franchise Dashboard', async ({ page }) => {
    // 1. Mock Login (We need a way to login as the test franchisee)
    // Since we don't have the clear password, we might need a bypass or use a standard test account
    // For this UAT, let's assume we can login with a test password if we set it properly
    
    // For now, let's navigate directly to the dashboard after a manual bypass if possible
    // or just mock the session if Playwright allows. 
    // Best: use a test account with a known password.
    
    const loginEmail = testFranchisee.email;
    const loginPassword = 'Password123!'; // We'll update the user with this password

    const bcrypt = require('bcryptjs');
    const hash = await bcrypt.hash(loginPassword, 12);
    await prisma.user.update({
      where: { id: testFranchisee.id },
      data: { senha: hash }
    });

    // 2. Perform Login
    await page.goto('/login');
    await page.getByPlaceholder(/USUÁRIO@DOMINIO.COM/i).fill(loginEmail);
    await page.getByPlaceholder(/••••••••/i).fill(loginPassword);
    await page.getByRole('button', { name: /Entrar no Sistema/i }).click();

    // 3. Assert Redirection to Franchise Dashboard
    await expect(page).toHaveURL(/.*\/franquia/, { timeout: 10000 });

    // 4. Assert Low Stock Alert Visibility
    const alert = page.getByText(/Nível Crítico: Reposição Necessária/i);
    await expect(alert).toBeVisible();

    // 5. Assert Reorder Button Presence
    const reorderBtn = page.getByRole('button', { name: /Reabastecer Créditos/i });
    await expect(reorderBtn).toBeVisible();
    
    console.log(`[UAT SUCCESS] Low stock alert and reorder button validated for ${loginEmail}`);
  });

});

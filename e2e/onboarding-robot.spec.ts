import { test, expect } from '@playwright/test';

test.describe('Onboarding Robot: System Population (@brasil.com.br)', () => {
  const adminEmail = 'contatofotosegundo@gmail.com';
  const pass = '123456'; 

  test('should create all user variations for system testing', async ({ page }) => {
    test.setTimeout(800000); // Increased timeout for more users

    // 1. LOGIN ADMIN
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(adminEmail);
    await page.locator('input[type="password"]').fill(pass);
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*admin/);

    const createUser = async (data: any) => {
      console.log(`[ROBOT] Criando ${data.role}: ${data.email}...`);
      await page.goto('/admin');
      await page.waitForLoadState('networkidle');
      
      // Clica na aba Membros
      await page.getByRole('button', { name: /Membros/i }).click();
      await page.waitForTimeout(1000); // Aguarda transição de aba
      
      const btn = page.getByRole('button', { name: /CONVOCAR MEMBRO/i });
      await expect(btn).toBeVisible();
      await btn.click();

      // Aguarda o modal abrir
      await expect(page.locator('h3:has-text("Novo Membro")')).toBeVisible();
      await page.locator('label:has-text("Nome de Guerra") + input').fill(data.name);
      await page.locator('label:has-text("E-mail de Acesso") + input').fill(data.email);
      await page.locator('label:has-text("Nova Senha") + input').fill('123456');
      await page.locator('select').selectOption(data.role);

      if (data.role === 'PROFISSIONAL') {
        if (data.captPct !== undefined) await page.locator('label:has-text("% Captação") + div input').fill(data.captPct.toString());
        if (data.editPct !== undefined) await page.locator('label:has-text("% Edição") + div input').fill(data.editPct.toString());
        if (data.equipment) await page.locator('label:has-text("Equipamento Operacional") + textarea').fill(data.equipment);
        
        if (data.workflowType === 'MOBILE') {
             await page.getByRole('button', { name: /Mobile Maker/i }).click();
             await page.getByRole('button', { name: /Câmera\/PC/i }).click(); // Desmarca tradicional
        }
        
        if (data.isFranchise) {
             const toggle = page.locator('button:has(div.bg-white)').nth(0);
             await toggle.click();
             await page.locator('label:has-text("Saldo de Créditos") + input').fill(data.printCredits.toString());
        }
      }

      await page.getByRole('button', { name: /CONFIRMAR CONVOCAÇÃO/i }).click();
      await page.waitForTimeout(3000); // Aguarda animação e processamento
      console.log(`[ROBOT] ✅ Criado: ${data.email}`);
    };

    // --- PROFISSIONAIS (30) ---
    for (let i = 1; i <= 30; i++) {
      await createUser({ 
        name: `IE PRO ${i}`, 
        email: `pro${i}@dublin.com`, 
        role: 'PROFISSIONAL', 
        captPct: 30, 
        editPct: 20, 
        equipment: 'Sony A7IV / Canon R6' 
      });
    }

    // --- PONTOS FIXOS (15) ---
    for (let i = 1; i <= 15; i++) {
      await createUser({ 
        name: `IE Unidade ${i}`, 
        email: `unidade${i}@dublin.com`, 
        role: 'CARTORIO' 
      });
    }

    // --- CLIENTES (10) ---
    for (let i = 1; i <= 10; i++) {
      await createUser({ 
        name: `IE Cliente ${i}`, 
        email: `cliente${i}@dublin.com`, 
        role: 'CLIENTE' 
      });
    }

    console.log('[ROBOT] ✅ População inicial concluída!');
  });
});

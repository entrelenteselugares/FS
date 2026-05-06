import { test, expect } from '@playwright/test';

test.describe('Onboarding Robot: System Population', () => {
  const adminEmail = 'contatofotosegundo@gmail.com';
  const pass = '123456'; 

  test('should create all user variations for system testing', async ({ page }) => {
    test.setTimeout(400000);

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

    // --- PROFISSIONAIS ---
    await createUser({ name: 'PRO Fotografo', email: 'pro-photo@test.com', role: 'PROFISSIONAL', captPct: 30, editPct: 0, equipment: 'Sony A7III, 24-70mm' });
    await createUser({ name: 'PRO Editor', email: 'pro-editor@test.com', role: 'PROFISSIONAL', captPct: 0, editPct: 40, equipment: 'MacBook Pro M3 Max' });
    await createUser({ name: 'PRO Hibrido', email: 'pro-hybrid@test.com', role: 'PROFISSIONAL', captPct: 30, editPct: 20, equipment: 'Nikon Z6 II' });
    await createUser({ name: 'PRO Mobile', email: 'pro-mobile@test.com', role: 'PROFISSIONAL', workflowType: 'MOBILE', equipment: 'iPhone 15 Pro Max' });

    // --- UNIDADES ---
    await createUser({ name: 'UNIDADE Padrao', email: 'unit-std@test.com', role: 'UNIDADE_FIXA' });
    await createUser({ name: 'UNIDADE Tempo Fixo', email: 'unit-fixed@test.com', role: 'UNIDADE_FIXA' });
    await createUser({ name: 'UNIDADE Oculta', email: 'unit-hidden@test.com', role: 'UNIDADE_FIXA' });

    // --- FRANQUEADO ---
    await createUser({ name: 'FRAN Master', email: 'fran-master@test.com', role: 'PROFISSIONAL', isFranchise: true, printCredits: 1000 });

    // --- CLIENTE ---
    await createUser({ name: 'CLIENTE VIP', email: 'cliente-vip@test.com', role: 'CLIENTE' });

    console.log('[ROBOT] ✅ População inicial concluída!');
  });
});

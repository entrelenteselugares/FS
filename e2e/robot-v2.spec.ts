import { test, expect } from '@playwright/test';
import path from 'path';

const SCREENSHOT_DIR = path.join(process.cwd(), 'ANOTAÇÕES', 'TEST_PRINTS');

test.describe('Robot V2: Portugal Profile Registration', () => {
  test.setTimeout(300000); // 5 minutes total
  const ts = Math.floor(Date.now() / 1000);

  const profiles = [
    { 
      id: 'CLIENTE', 
      label: 'Cliente Privado', 
      email: `cli_${ts}@portugal.com`, 
      target: '/minha-conta',
      fields: {
        nome: 'Cliente Portugal',
        whatsapp: '11999999999',
        senha: '123456'
      }
    },
    { 
      id: 'PROFISSIONAL', 
      label: 'Profissional da Rede', 
      email: `pro_${ts}@portugal.com`, 
      target: '/profissional',
      fields: {
        nome: 'Pro Portugal',
        whatsapp: '11888888888',
        senha: '123456',
        skill: 'FOTO'
      }
    },
    { 
      id: 'CARTORIO', 
      label: 'Unidade Fixa', 
      email: `uni_${ts}@portugal.com`, 
      target: '/unidade-fixa',
      fields: {
        nome: 'Unidade Portugal',
        whatsapp: '11777777777',
        senha: '123456',
        razao: 'Unidade Portugal LTDA',
        cep: '01310-100'
      }
    }
  ];

  for (const profile of profiles) {
    test(`Walkthrough: ${profile.id}`, async ({ page }) => {
      console.log(`[ROBOT] 🚀 Iniciando fluxo para ${profile.id}...`);
      
      await page.goto(`/register`);
      await page.waitForLoadState('networkidle');
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `v2_${profile.id}_0_start.png`) });

      // 1. Seleção de Perfil
      console.log(`[ROBOT] Clicando no perfil: ${profile.label}`);
      // Buscamos o texto exato dentro de um botão
      const roleBtn = page.locator('button').filter({ hasText: profile.label });
      await expect(roleBtn).toBeVisible({ timeout: 15000 });
      await roleBtn.click();
      await page.waitForTimeout(1000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `v2_${profile.id}_1_role_selected.png`) });

      // 2. Preenchimento de Dados
      console.log(`[ROBOT] Preenchendo formulário para ${profile.email}...`);
      
      await page.getByPlaceholder('EX: JOÃO DA SILVA').fill(profile.fields.nome);
      await page.getByPlaceholder('(00) 00000-0000').fill(profile.fields.whatsapp);
      await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill(profile.email);

      // Campos específicos
      if (profile.id === 'PROFISSIONAL') {
        console.log(`[ROBOT] Selecionando skill: ${profile.fields.skill}`);
        await page.locator('button').filter({ hasText: /^FOTO$/ }).click();
      }

      if (profile.id === 'CARTORIO') {
        console.log(`[ROBOT] Preenchendo dados da unidade...`);
        await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill(profile.fields.razao!);
        await page.getByPlaceholder('00000-000', { exact: true }).fill(profile.fields.cep!);
        await page.waitForTimeout(2000); // Aguarda CEP
      }

      // Senha
      await page.locator('input[type="password"]').fill(profile.fields.senha);

      // 3. Checkboxes (clicando nos containers flex para garantir o clique)
      console.log(`[ROBOT] Aceitando termos...`);
      await page.getByText('Aceito os Termos de Uso').click();
      await page.getByText('Concordo com a Política de Privacidade').click();

      await page.screenshot({ path: path.join(SCREENSHOT_DIR, `v2_${profile.id}_2_form_ready.png`) });

      // 4. Finalização
      console.log(`[ROBOT] Enviando registro...`);
      const submitBtn = page.getByRole('button', { name: /Confirmar Inscrição/i });
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      // 5. Validação de Redirecionamento
      console.log(`[ROBOT] Aguardando redirecionamento para ${profile.target}...`);
      try {
        await page.waitForURL(new RegExp(profile.target), { timeout: 30000 });
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `v2_${profile.id}_3_success.png`), fullPage: true });
        console.log(`[ROBOT] ✅ SUCESSO: ${profile.id} registrado e logado.`);
      } catch (e) {
        console.error(`[ROBOT] ❌ FALHA: Redirecionamento não ocorreu para ${profile.id}`);
        // Tenta capturar mensagem de erro do backend na tela
        const errorMsg = await page.locator('.bg-red-500\\/10').textContent().catch(() => 'Nenhum erro visível na UI');
        console.error(`[ROBOT] Erro na UI: ${errorMsg}`);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, `v2_${profile.id}_4_error.png`), fullPage: true });
        throw e;
      }
    });
  }
});

import { test, expect } from '@playwright/test';

test.describe('Teste de Usabilidade @escola.com.br', () => {

  test('Deve registrar Cliente, Profissional, Unidade Fixa e acessar Admin', async ({ page }) => {
    
    console.log('--- TESTANDO REGISTRO CLIENTE ---');
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    
    // Seleciona perfil Cliente (deve ser o padrão, mas clicamos para garantir)
    await page.getByText('Cliente Privado', { exact: true }).click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Cliente Escola');
    await page.getByPlaceholder('(00) 00000-0000').fill('11999999999');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill('cliente@escola.com.br');
    await page.locator('input[type="password"]').fill('123456');
    
    // Checkboxes de termos
    const checkboxes = page.locator('input[type="checkbox"]');
    await checkboxes.nth(0).evaluate((el: HTMLElement) => el.click());
    await checkboxes.nth(1).evaluate((el: HTMLElement) => el.click());
    
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    
    // Verifica se foi para o dashboard do cliente
    await expect(page).toHaveURL(/.*(minha-conta)/, { timeout: 15000 });
    console.log('✅ Cliente registrado com sucesso.');
    
    // Logout
    await page.goto('/login'); // O app redireciona ou precisamos deslogar. Vamos limpar o localStorage e recarregar.
    await page.evaluate(() => localStorage.clear());

    console.log('--- TESTANDO REGISTRO PROFISSIONAL ---');
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    
    // Seleciona perfil Profissional
    await page.getByText('Profissional da Rede', { exact: true }).click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Profissional Escola');
    await page.getByPlaceholder('(00) 00000-0000').fill('11999999998');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill('profissional@escola.com.br');
    
    // Seleciona Habilidade e Workflow para habilitar
    await page.getByText('FOTO', { exact: true }).click();
    await page.getByText('Mobile Maker', { exact: true }).click();
    
    await page.locator('input[type="password"]').fill('123456');
    
    // Checkboxes de termos
    const checkboxes2 = page.locator('input[type="checkbox"]');
    await checkboxes2.nth(0).evaluate((el: HTMLElement) => el.click());
    await checkboxes2.nth(1).evaluate((el: HTMLElement) => el.click());
    
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    
    // Verifica se foi para o dashboard
    await expect(page).toHaveURL(/.*(profissional)/, { timeout: 15000 });
    console.log('✅ Profissional registrado com sucesso.');
    
    // Logout
    await page.evaluate(() => localStorage.clear());

    console.log('--- TESTANDO REGISTRO UNIDADE FIXA ---');
    await page.goto('/registro');
    await page.waitForLoadState('networkidle');
    
    // Seleciona perfil Unidade
    await page.getByText('Unidade Fixa', { exact: true }).click();
    await page.getByPlaceholder('EX: JOÃO DA SILVA').fill('Unidade Responsável Escola');
    await page.getByPlaceholder('(00) 00000-0000').fill('11999999997');
    await page.getByPlaceholder('EMAIL@DOMINIO.COM').fill('unidade@escola.com.br');
    
    // Preenche dados da unidade
    await page.getByPlaceholder('NOME OFICIAL DA UNIDADE').fill('Cartório Escola');
    await page.getByPlaceholder('00000-000', { exact: true }).fill('01001-000'); // Sé, SP (ViaCEP vai carregar alguns campos)
    await page.waitForTimeout(1000); // aguarda viacep
    await page.getByPlaceholder('RUA / AVENIDA').fill('Praça da Sé');
    await page.getByPlaceholder('123').fill('1');
    await page.getByPlaceholder('PREENCHIDO VIA CEP').fill('Sé');
    await page.getByPlaceholder('PREENCHIDA VIA CEP').fill('São Paulo');
    await page.getByPlaceholder('SP').fill('SP');
    
    await page.locator('input[type="password"]').fill('123456');
    
    // Checkboxes de termos
    const checkboxes3 = page.locator('input[type="checkbox"]');
    await checkboxes3.nth(0).evaluate((el: HTMLElement) => el.click());
    await checkboxes3.nth(1).evaluate((el: HTMLElement) => el.click());
    
    await page.getByRole('button', { name: /Confirmar Inscrição/i }).click();
    
    // Verifica se foi para o dashboard
    await expect(page).toHaveURL(/.*(unidade-fixa)/, { timeout: 15000 });
    console.log('✅ Unidade Fixa registrada com sucesso.');
    
    // Logout
    await page.evaluate(() => localStorage.clear());

    console.log('--- TESTANDO LOGIN ADMIN ---');
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    
    await page.locator('input[type="email"]').fill('contatofotosegundo@gmail.com');
    await page.locator('input[type="password"]').fill('123456');
    
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    
    // Verifica se foi para o dashboard admin
    await expect(page).toHaveURL(/.*(admin)/, { timeout: 15000 });
    console.log('✅ Admin logado com sucesso.');
    
    // Final
    console.log('✨ Fluxo de usabilidade completado sem bloqueios!');
  });
});

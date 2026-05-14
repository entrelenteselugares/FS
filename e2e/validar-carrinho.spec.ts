import { test, expect } from '@playwright/test';

test.describe('Validação de Carrinho e Checkout', () => {
  const proEmail = 'hibrido@brasil.com.br';

  test('Deve logar, criar evento e validar fluxo de compra', async ({ page, browser }) => {
    test.setTimeout(120000);

    // 1. Login
    console.log('[STEP 1] Login');
    await page.goto('/login');
    await page.locator('input[type="email"]').fill(proEmail);
    await page.locator('input[type="password"]').fill('123456');
    await page.getByRole('button', { name: /ENTRAR/i }).click();
    await expect(page).toHaveURL(/.*(profissional|minha-conta)/, { timeout: 20000 });

    // 2. Criar Evento via UI (Foto Point)
    console.log('[STEP 2] Criando Evento');
    await page.goto('/profissional');
    // Esperar um dos botões de ação carregar
    const fotoPointBtn = page.getByRole('button', { name: /Foto Point/i });
    await expect(fotoPointBtn).toBeVisible({ timeout: 20000 });
    await fotoPointBtn.click();

    const nameInput = page.getByPlaceholder(/Ensaio no Parque/i);
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    const eventName = `Teste Carrinho UI ${Date.now()}`;
    await nameInput.fill(eventName);
    await page.locator('input[type="number"]').first().fill('1'); 
    await page.locator('input[type="date"]').first().fill('2026-05-13');
    await page.locator('input[type="time"]').first().fill('00:00');
    await page.locator('input[type="time"]').nth(1).fill('23:59');
    
    await page.locator('button[type="submit"]').click();
    console.log('[STEP 2] Aguardando redirecionamento para galeria');
    await expect(page).toHaveURL(/\/e\/.*/, { timeout: 30000 });
    const eventUrl = page.url();
    console.log(`✅ Galeria aberta: ${eventUrl}`);

    // 3. Simular Foto (Injetando mídias via UI é difícil, então usaremos o Preview)
    // No Foto Point, a galeria começa vazia. Precisamos de fotos.
    // Vamos voltar e adicionar preview links
    console.log('[STEP 3] Adicionando Previews');
    await page.goto('/profissional');
    await page.getByText(eventName).first().click();
    const previewInput = page.locator('input[placeholder*="adobe.ly"]');
    await expect(previewInput).toBeVisible({ timeout: 15000 });
    await previewInput.fill('https://images.unsplash.com/photo-1519741497674-611481863552,https://images.unsplash.com/photo-1511285560929-80b456fea0bc');
    await page.getByRole('button', { name: /EFETIVAR LINKS/i }).first().click();
    await page.waitForTimeout(2000);

    // 4. Fluxo de Compra como Cliente
    console.log('[STEP 4] Fluxo do Cliente');
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await clientPage.goto(eventUrl);
    await clientPage.waitForLoadState('networkidle');

    // Clicar na primeira foto (Preview)
    // Na sidebar ou no grid, se houver referências/previews
    // No EventPage, se não houver mídias REAIS, as previews aparecem em "Previews"
    const firstPreview = clientPage.locator('img').first();
    await expect(firstPreview).toBeVisible({ timeout: 15000 });
    
    // Como previews não são compráveis diretamente se não houver mediaIds, 
    // o teste ideal é com mídias injetadas.
    // Mas se o sistema tiver "pricePerPhoto" global, qualquer clique pode funcionar?
    // Não, o carrinho precisa de media IDs.
    
    // Injetar media IDs via Prisma (Agora com require e caminho absoluto)
    const slug = eventUrl.split('/').pop();
    const { execSync } = require('child_process');
    const path = require('path');
    const injectJs = `
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      async function main() {
        const ev = await prisma.event.findUnique({ where: { slug: '${slug}' } });
        await prisma.eventMedia.create({ data: { eventId: ev.id, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'TX', price: 1 } });
      }
      main().finally(() => prisma.$disconnect());
    `;
    require('fs').writeFileSync('temp_inject.js', injectJs);
    execSync('node temp_inject.js', { env: { ...process.env, DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/postgres' } }); // Fallback DB URL if env not loaded

    await clientPage.reload();
    await clientPage.waitForLoadState('networkidle');

    console.log('Selecionando foto...');
    const photo = clientPage.getByTestId('photo-TX');
    await expect(photo).toBeVisible({ timeout: 15000 });
    await photo.click({ force: true });

    const checkoutBtn = clientPage.getByRole('button', { name: /Finalizar Compra/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    await checkoutBtn.click();

    console.log('Validando Checkout...');
    await expect(clientPage).toHaveURL(/.*\/checkout\/.*/, { timeout: 15000 });
    await expect(clientPage.getByText(/Pix/i).first()).toBeVisible({ timeout: 10000 });
    
    console.log('✨ SUCESSO: Carrinho e Checkout funcionando!');
  });
});

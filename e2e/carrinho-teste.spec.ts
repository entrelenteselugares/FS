import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Teste Automatizado do Carrinho e Checkout', () => {

  test('Deve adicionar foto ao carrinho e iniciar checkout', async ({ browser }) => {
    test.setTimeout(60000); // Dar um pouco mais de tempo
    const eventName = `Carrinho ${Date.now()}`;
    const slug = `carrinho-${Date.now()}`;

    // 1. Injetar Evento e Mídias via Prisma para ter uma galeria 100% pronta
    const injectCmd = `npx ts-node -e "
      const dotenv = require('dotenv');
      const path = require('path');
      dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
      const { PrismaClient } = require('@prisma/client');
      const prisma = new PrismaClient();
      async function main() {
        const user = await prisma.user.findFirst({ where: { role: 'PROFESSIONAL' }});
        if (!user) throw new Error('No professional user found');
        const ev = await prisma.event.create({
          data: {
            name: '${eventName}',
            slug: '${slug}',
            type: 'FLASH_EVENT',
            eventDate: new Date(Date.now() - 1000 * 60 * 60 * 5),
            startTime: '00:00',
            endTime: '23:59',
            photoPrice: 1.0,
            status: 'ACTIVE',
            professionalId: user.id
          }
        });
        await prisma.eventMedia.createMany({
          data: [
            { eventId: ev.id, url: 'https://images.unsplash.com/photo-1519741497674-611481863552', shortId: 'T1', price: 1 },
            { eventId: ev.id, url: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', shortId: 'T2', price: 1 }
          ]
        });
      }
      main().catch(e => { console.error(e); process.exit(1); });
    "`;
    
    const { execSync } = require('child_process');
    execSync(injectCmd, { cwd: path.resolve(__dirname, '../backend') });
    console.log(`✅ Evento e mídias injetados: /e/${slug}`);

    // 2. Acessar a galeria como cliente
    const clientContext = await browser.newContext();
    const clientPage = await clientContext.newPage();
    await clientPage.goto(`/e/${slug}`);
    await clientPage.waitForLoadState('networkidle');

    // 3. Adicionar ao carrinho
    console.log('Tentando clicar em uma foto para adicionar ao carrinho...');
    const firstPhoto = clientPage.locator('img').nth(1); 
    await firstPhoto.waitFor({ state: 'visible', timeout: 15000 });
    await firstPhoto.click({ force: true });
    
    // Validar se o botão do carrinho apareceu
    const checkoutBtn = clientPage.getByRole('button', { name: /FINALIZAR COMPRA/i });
    await expect(checkoutBtn).toBeVisible({ timeout: 10000 });
    console.log('✅ Botão de Finalizar Compra apareceu (Foto no carrinho!)');

    // 4. Clicar no carrinho para ir pro checkout
    await checkoutBtn.click();
    
    // 5. Preencher o formulário inicial
    console.log('Preenchendo dados de contato...');
    await clientPage.getByPlaceholder(/NOME/i).fill('Cliente Teste');
    await clientPage.getByPlaceholder(/E-MAIL/i).fill('cliente@teste.com');
    await clientPage.getByRole('button', { name: /PAGAR/i }).click();

    // 6. Checar a página final de pagamento
    await expect(clientPage).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 15000 });
    console.log('✅ Redirecionado com sucesso para a página de Pagamento/Checkout Final!');
    
    // Verificar se as opções de pagamento carregaram (ex: Pix)
    await expect(clientPage.getByText(/Pix/i).first()).toBeVisible({ timeout: 15000 });
    console.log('✅ Opção de PIX visível na tela de Checkout.');
    
    console.log('✨ Fluxo do carrinho e inicialização da compra VALIDADOS com sucesso!');
  });
});

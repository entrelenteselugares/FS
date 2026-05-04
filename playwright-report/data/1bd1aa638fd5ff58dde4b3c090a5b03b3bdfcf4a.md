# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance\hybrid-penny-pix.spec.ts >> Hybrid Financial Protocol: Penny PIX (Flow A) >> should process a real PIX payment and validate delivery
- Location: e2e\finance\hybrid-penny-pix.spec.ts:18:7

# Error details

```
Test timeout of 180000ms exceeded.
```

```
Error: locator.click: Test timeout of 180000ms exceeded.
Call log:
  - waiting for getByText('Foto Print Live').first()

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - banner [ref=e6]:
    - img "Logo" [ref=e8]
    - generic [ref=e9]: Solicitação de Orçamento
    - heading "ETERNIZE SEU EVENTO" [level=1] [ref=e10]
  - generic [ref=e12]:
    - generic [ref=e13]: "Passo 2: Configuração e Serviços"
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]: Duração do Registro
        - generic [ref=e17]: 2 HORAS
      - slider [ref=e19] [cursor=pointer]: "2"
      - generic [ref=e20]:
        - generic [ref=e21]: 1H
        - generic [ref=e22]: 3H
        - generic [ref=e23]: 6H
        - generic [ref=e24]: 9H
        - generic [ref=e25]: 12H
    - generic [ref=e26]:
      - generic [ref=e27]:
        - generic [ref=e28]: Quantidade de Dias
        - generic [ref=e29]: 1 DIA
      - slider [disabled] [ref=e31]: "1"
      - generic [ref=e32]:
        - generic [ref=e33]: 1 DIA
        - generic [ref=e34]: 3 DIAS
        - generic [ref=e35]: 5 DIAS
        - generic [ref=e36]: 7 DIAS
    - generic [ref=e37]:
      - generic [ref=e38]:
        - generic [ref=e39]: Número de Convidados
        - generic [ref=e40]:
          - img
          - textbox [active] [ref=e41]: "10"
      - generic [ref=e42]:
        - generic [ref=e43]: Equipamento Preferencial
        - generic [ref=e44]:
          - button "MOBILE MAKER" [ref=e45] [cursor=pointer]
          - button "TRADICIONAL" [ref=e46] [cursor=pointer]
    - generic [ref=e47]:
      - generic [ref=e48]: Selecione os Serviços
      - generic [ref=e49]:
        - heading "BUSINESS" [level=4] [ref=e50]: BUSINESS
        - generic [ref=e52]:
          - generic [ref=e53] [cursor=pointer]:
            - generic [ref=e55]:
              - img [ref=e57]
              - generic [ref=e62]: Ativação Phygital Corporativa
            - paragraph [ref=e63]: Estação de impressão via QR Code para feiras e congressos com moldura personalizada.
            - generic [ref=e65]: R$ 1,00
          - generic [ref=e66] [cursor=pointer]:
            - generic [ref=e68]:
              - img [ref=e70]
              - generic [ref=e74]: Checkout Memory (Turismo)
            - paragraph [ref=e75]: Instalação de totem de impressão em hotéis e pontos turísticos.
            - generic [ref=e77]: R$ 1,00
          - generic [ref=e78] [cursor=pointer]:
            - generic [ref=e80]:
              - img [ref=e82]
              - generic [ref=e86]: Ensaio Gastronômico Express
            - paragraph [ref=e87]: Fotos profissionais de pratos para cardápios digitais e iFood.
            - generic [ref=e89]: R$ 1,00
          - generic [ref=e90] [cursor=pointer]:
            - generic [ref=e92]:
              - img [ref=e94]
              - generic [ref=e99]: Retrato Corporativo (LinkedIn)
            - paragraph [ref=e100]: Fotos profissionais de perfil para equipes e profissionais liberais.
            - generic [ref=e102]: R$ 1,00
      - generic [ref=e103]:
        - heading "FOTOGRAFIA" [level=4] [ref=e104]: FOTOGRAFIA
        - generic [ref=e106]:
          - generic [ref=e107] [cursor=pointer]:
            - generic [ref=e109]:
              - img [ref=e111]
              - generic [ref=e114]: Casamento Civil
            - paragraph [ref=e115]: Cobertura do cartório durante a cerimônia.
            - generic [ref=e117]: R$ 1,00
          - generic [ref=e118] [cursor=pointer]:
            - generic [ref=e120]:
              - img [ref=e122]
              - generic [ref=e126]: Ensaio Express (30 min)
            - paragraph [ref=e127]: Cobertura fotográfica rápida em locação.
            - generic [ref=e129]: R$ 1,00
          - generic [ref=e130] [cursor=pointer]:
            - generic [ref=e132]:
              - img [ref=e134]
              - generic [ref=e138]: Evento Social/Festa (4h)
            - paragraph [ref=e139]: Cobertura de festas, aniversários ou eventos corporativos.
            - generic [ref=e141]: R$ 1,00
      - generic [ref=e142]:
        - heading "PESSOAL" [level=4] [ref=e143]: PESSOAL
        - generic [ref=e145]:
          - generic [ref=e146] [cursor=pointer]:
            - generic [ref=e148]:
              - img [ref=e150]
              - generic [ref=e155]: Casamento Civil Phygital Premium
            - paragraph [ref=e156]: Cobertura do civil com entrega imediata de foto oficial impressa.
            - generic [ref=e158]: R$ 1,00
          - generic [ref=e159] [cursor=pointer]:
            - generic [ref=e161]:
              - img [ref=e163]
              - generic [ref=e167]: Cobertura de Shows e Esportes
            - paragraph [ref=e168]: Captura em movimento com busca por QR Code e impressão no local.
            - generic [ref=e170]: R$ 1,00
          - generic [ref=e171] [cursor=pointer]:
            - generic [ref=e173]:
              - img [ref=e175]
              - generic [ref=e180]: Fotografia Escolar Phygital
            - paragraph [ref=e181]: Cobertura de eventos escolares com venda e impressão sob demanda.
            - generic [ref=e183]: R$ 1,00
      - generic [ref=e184]:
        - heading "IMPRESSÃO" [level=4] [ref=e185]: IMPRESSÃO
        - generic [ref=e188] [cursor=pointer]:
          - generic [ref=e190]:
            - img [ref=e192]
            - generic [ref=e197]: Foto Impressa
          - paragraph [ref=e198]: Upgrade para incluir fotos impressas no dia.
          - generic [ref=e200]: R$ 1,00
      - generic [ref=e201]:
        - heading "VÍDEO" [level=4] [ref=e202]: VÍDEO
        - generic [ref=e204]:
          - generic [ref=e205] [cursor=pointer]:
            - generic [ref=e207]:
              - img [ref=e209]
              - generic [ref=e212]: Reels / Stories
            - paragraph [ref=e213]: Edição de vídeos curtos para redes sociais.
            - generic [ref=e215]: R$ 1,00
          - generic [ref=e216] [cursor=pointer]:
            - generic [ref=e218]:
              - img [ref=e220]
              - generic [ref=e224]: Vídeo Cinema
            - paragraph [ref=e225]: Adição de vídeo cinematográfico ao seu pacote.
            - generic [ref=e227]: R$ 1,00
    - generic [ref=e228]:
      - generic [ref=e229]:
        - generic [ref=e230]: Total Estimado
        - generic [ref=e231]: R$ 0,00
      - generic [ref=e232]:
        - button "VOLTAR" [ref=e233] [cursor=pointer]
        - button "CONTINUAR →" [ref=e234] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { generateTestEmail } from '../utils/auth-helpers';
  3  | import * as dotenv from 'dotenv';
  4  | import path from 'path';
  5  | 
  6  | dotenv.config({ path: path.resolve(__dirname, '../../backend/.env') });
  7  | 
  8  | /**
  9  |  * PROTOCOLO PENNY TESTING (HÍBRIDO): Fluxo A
  10 |  * 1. Cliente fecha serviço (Ponto Fixo).
  11 |  * 2. Checkout gera PIX Real (R$ 1,00).
  12 |  * 3. O robô para e extrai o código PIX para o USER pagar.
  13 |  * 4. Após pagamento, valida liberação de material.
  14 |  */
  15 | 
  16 | test.describe('Hybrid Financial Protocol: Penny PIX (Flow A)', () => {
  17 | 
  18 |   test('should process a real PIX payment and validate delivery', async ({ page }) => {
  19 |     test.setTimeout(180000); // 3 minutos para dar tempo de pagar
  20 |     const guestEmail = generateTestEmail();
  21 |     console.log(`\n[HYBRID] Iniciando Fluxo A para: ${guestEmail}`);
  22 | 
  23 |     // ─── 1. Navegação até o Checkout ────────────────────────
  24 |     await page.goto('/');
  25 |     await page.getByRole('button', { name: 'AGENDAR' }).click();
  26 |     await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
  27 |     await page.getByRole('combobox').selectOption({ index: 1 });
  28 |     
  29 |     // Abre Calendário
  30 |     await page.getByText(/2026/i).or(page.getByText(/SELECIONE A DATA/i)).first().click();
  31 |     await page.waitForTimeout(1000);
  32 |     
  33 |     // Seleciona o primeiro dia disponível (habilitado)
  34 |     const availableDay = page.locator('button:not([disabled])').filter({ hasText: /^[0-9]+$/ }).first();
  35 |     await availableDay.click();
  36 |     await page.getByRole('button', { name: /CONFIRMAR/i }).click();
  37 |     await page.getByRole('button', { name: /PRÓXIMO/i }).click();
  38 | 
  39 |     // Configuração (Phygital R$ 1,00)
  40 |     await page.getByRole('textbox').first().fill('10'); 
> 41 |     await page.getByText('Foto Print Live').first().click();
     |                                                     ^ Error: locator.click: Test timeout of 180000ms exceeded.
  42 |     await page.getByRole('button', { name: /CONTINUAR/i }).click();
  43 | 
  44 |     // Identificação
  45 |     await page.getByPlaceholder(/NOME/i).fill('Penny Tester');
  46 |     await page.getByPlaceholder(/CONTATO@/i).fill(guestEmail);
  47 |     await page.getByPlaceholder(/119/i).fill('11999999999');
  48 |     await page.getByRole('button', { name: /RESERVAR E FINALIZAR AGORA/i }).click({ force: true });
  49 | 
  50 |     // ─── 2. Checkout & PIX ──────────────────────────────────
  51 |     await expect(page).toHaveURL(/.*\/checkout\/[a-zA-Z0-9-]+/, { timeout: 30000 });
  52 |     
  53 |     // Login se necessário (Usuário novo via Guest)
  54 |     const passInput = page.locator('input[type="password"]');
  55 |     if (await passInput.isVisible({ timeout: 5000 })) {
  56 |       await passInput.fill('123456');
  57 |       await page.getByRole('button', { name: /CONTINUAR|ENTRAR/i }).click();
  58 |     }
  59 | 
  60 |     console.log('[HYBRID] Selecionando PIX...');
  61 |     const pixOption = page.getByText(/Pix/i).first();
  62 |     await expect(pixOption).toBeVisible({ timeout: 20000 });
  63 |     await pixOption.click();
  64 | 
  65 |     // Aguarda o Brick do Mercado Pago carregar o QR Code
  66 |     console.log('[HYBRID] Aguardando QR Code do Mercado Pago...');
  67 |     await page.waitForTimeout(5000);
  68 | 
  69 |     // ─── 3. INTERVENÇÃO MANUAL ──────────────────────────────
  70 |     console.log("\n" + "=".repeat(60));
  71 |     console.log("🚀 PROTOCOLO PENNY: PIX GERADO!");
  72 |     
  73 |     // Tenta extrair o código Copia e Cola se disponível no DOM
  74 |     const pixCode = await page.locator('input[readonly]').first().inputValue().catch(() => "Não foi possível extrair o código automaticamente.");
  75 |     
  76 |     console.log(`\n👉 CHAVE PIX (COPIA E COLA):\n${pixCode}\n`);
  77 |     console.log("👉 AÇÃO REQUERIDA: Faça o pagamento de R$ 1,00 agora.");
  78 |     console.log("👉 O robô ficará em PAUSE. Após pagar e ver 'Sucesso' na tela, clique em RESUME.");
  79 |     console.log("=".repeat(60) + "\n");
  80 | 
  81 |     await page.pause();
  82 | 
  83 |     // ─── 4. Validação Pós-Pagamento ────────────────────────
  84 |     await expect(page.getByText(/PAGAMENTO CONFIRMADO|Sucesso|Aprovado/i).first()).toBeVisible({ timeout: 60000 });
  85 |     console.log('[HYBRID] ✅ Pagamento detectado! Validando liberação...');
  86 | 
  87 |     // Verifica se o evento agora está ativo para o cliente
  88 |     await page.goto('/consumer');
  89 |     await expect(page.getByText(/Penny Tester/i).first()).toBeVisible({ timeout: 15000 });
  90 |     console.log('[HYBRID] 🎉 Fluxo A validado com sucesso do pagamento à entrega!');
  91 |   });
  92 | });
  93 | 
```
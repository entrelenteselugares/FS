# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: master-logic.spec.ts >> Master System Validation: Integrated Lifecycle >> should execute full lifecycle with integrated QR Code
- Location: e2e\master-logic.spec.ts:13:7

# Error details

```
Test timeout of 150000ms exceeded.
```

```
Error: locator.click: Test timeout of 150000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /NOVO FOTO POINT/i })

```

# Page snapshot

```yaml
- generic [ref=e4]:
  - complementary [ref=e5]:
    - generic [ref=e6]:
      - link "Foto Segundo" [ref=e8] [cursor=pointer]:
        - /url: /
        - img "Foto Segundo" [ref=e10]
      - navigation [ref=e11]:
        - button "Visão Geral" [ref=e12] [cursor=pointer]:
          - img [ref=e14]
          - generic [ref=e19]: Visão Geral
        - button "Convites Pendentes" [ref=e20] [cursor=pointer]:
          - img [ref=e22]
          - generic [ref=e24]: Convites Pendentes
        - button "Financeiro" [ref=e25] [cursor=pointer]:
          - img [ref=e27]
          - generic [ref=e29]: Financeiro
        - button "Serviços" [ref=e30] [cursor=pointer]:
          - img [ref=e32]
          - generic [ref=e35]: Serviços
        - button "Minha Rede" [ref=e36] [cursor=pointer]:
          - img [ref=e38]
          - generic [ref=e43]: Minha Rede
        - button "Agenda Google" [ref=e44] [cursor=pointer]:
          - img [ref=e46]
          - generic [ref=e48]: Agenda Google
        - button "Meu Perfil" [ref=e49] [cursor=pointer]:
          - img [ref=e51]
          - generic [ref=e54]: Meu Perfil
        - link "Visitar Site" [ref=e55] [cursor=pointer]:
          - /url: /
          - img [ref=e56]
          - generic [ref=e60]: Visitar Site
      - generic [ref=e61]:
        - generic [ref=e62]:
          - generic [ref=e63]: MEMBRO4
          - generic [ref=e64]: Profissional da Rede
        - button "Encerrar" [ref=e65] [cursor=pointer]:
          - img [ref=e66]
          - text: Encerrar
  - generic [ref=e69]:
    - navigation [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]: MEMBRO4
        - button "Alternar para modo claro" [ref=e73] [cursor=pointer]:
          - img
        - button "Sair" [ref=e74] [cursor=pointer]:
          - img [ref=e75]
          - text: Sair
    - main [ref=e78]:
      - generic [ref=e79]:
        - generic [ref=e80]:
          - heading "Meu Cockpit" [level=1] [ref=e82]
          - generic [ref=e85]:
            - button "Lista" [ref=e86] [cursor=pointer]:
              - img [ref=e87]
              - text: Lista
            - button "Calendário" [ref=e88] [cursor=pointer]:
              - img [ref=e89]
              - text: Calendário
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e93]:
              - button "Venda Rápida Foto Segundo Registre o recebimento e libere o acesso na hora INICIAR OPERAÇÃO" [ref=e96] [cursor=pointer]:
                - generic [ref=e97]:
                  - img [ref=e99]
                  - generic [ref=e101]:
                    - generic [ref=e102]: Venda Rápida Foto Segundo
                    - generic [ref=e103]: Registre o recebimento e libere o acesso na hora
                - generic [ref=e104]:
                  - text: INICIAR OPERAÇÃO
                  - img [ref=e105]
              - generic [ref=e107] [cursor=pointer]:
                - generic [ref=e109]:
                  - generic [ref=e110]:
                    - img [ref=e111]
                    - generic [ref=e114]: Nova Categoria
                  - heading "Foto Point" [level=3] [ref=e115]
                  - paragraph [ref=e116]: Crie um ponto de venda local
                - img [ref=e118]
            - generic [ref=e121]:
              - generic [ref=e122]:
                - text: Performance de Entrega
                - generic [ref=e123]: "0"
                - generic [ref=e124]: Eventos
              - generic [ref=e125]:
                - text: Acumulado Global
                - generic [ref=e126]: R$ 0
                - generic [ref=e127]: Provisionado p/ Repasse
              - generic [ref=e128]:
                - text: Resultado do Mês
                - generic [ref=e129]: R$ 0
                - generic [ref=e130]: Meta de Produção Ativa
              - generic [ref=e131]:
                - text: Pontos de Agilidade
                - generic [ref=e132]: "0"
                - generic [ref=e133]: SLA Gamification
            - generic [ref=e134]:
              - generic [ref=e135]:
                - heading "Suporte de Campo" [level=4] [ref=e136]
                - paragraph [ref=e137]: Linha direta com a matriz para dúvidas operacionais ou técnicas.
              - link "Falar com Matriz" [ref=e138] [cursor=pointer]:
                - /url: https://wa.me/5519984470420
                - img [ref=e139]
                - text: Falar com Matriz
          - generic [ref=e144]: Nenhum registro encontrado para esta visualização.
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | /**
  4   |  * MASTER SYSTEM VALIDATION
  5   |  * Valida a sequência lógica completa: Profissional -> Evento -> Cliente -> QR Code Integrado.
  6   |  */
  7   | 
  8   | test.describe('Master System Validation: Integrated Lifecycle', () => {
  9   |   const proEmail = 'membro4@fotosegundo.com.br';
  10  |   const eventName = `E2E Master ${Date.now()}`;
  11  |   const clientEmail = `tester-${Date.now()}@example.com`;
  12  | 
  13  |   test('should execute full lifecycle with integrated QR Code', async ({ page }) => {
  14  |     test.setTimeout(150000);
  15  | 
  16  |     // ─── 1. PROFISSIONAL: Criar Foto Point ─────────────────────
  17  |     console.log('[MASTER] Login Profissional...');
  18  |     await page.goto('/login');
  19  |     await page.locator('input[type="email"]').fill(proEmail);
  20  |     await page.locator('input[type="password"]').fill('123456');
  21  |     await page.getByRole('button', { name: /ENTRAR/i }).click();
  22  |     
  23  |     await expect(page).toHaveURL(/.*profissional/, { timeout: 20000 });
  24  |     
  25  |     console.log('[MASTER] Criando Novo Foto Point...');
  26  |     // Se o modal estiver aberto de um teste anterior, fecha ele
  27  |     const closeBtn = page.locator('button:has(svg.lucide-x)').first();
  28  |     if (await closeBtn.isVisible()) await closeBtn.click();
  29  | 
> 30  |     await page.getByRole('button', { name: /NOVO FOTO POINT/i }).click();
      |                                                                  ^ Error: locator.click: Test timeout of 150000ms exceeded.
  31  |     
  32  |     await page.getByPlaceholder(/Ensaio Urbano/i).fill(eventName);
  33  |     await page.getByRole('spinbutton').fill('25'); 
  34  |     await page.getByPlaceholder(/Em frente ao MASP/i).fill('Local de Teste Robô');
  35  |     await page.getByPlaceholder(/Descreva o roteiro/i).fill('Fotos de teste geradas pelo robô master.');
  36  |     
  37  |     await page.getByRole('button', { name: /ATIVAR FOTO POINT AGORA/i }).click();
  38  |     
  39  |     // Aguarda sucesso e volta para a lista
  40  |     await page.waitForTimeout(3000);
  41  |     await page.goto('/profissional');
  42  |     await expect(page.getByText(eventName)).toBeVisible({ timeout: 20000 });
  43  | 
  44  |     // Pega o ID/Slug do evento clicando nele
  45  |     await page.getByText(eventName).first().click();
  46  |     const eventUrl = page.url();
  47  |     const eventId = eventUrl.split('/').pop();
  48  |     console.log(`[MASTER] Evento Criado: ${eventName} (ID: ${eventId})`);
  49  | 
  50  |     // ─── 2. CLIENTE: Acessar Marketplace ───────────────────────
  51  |     console.log('[MASTER] Acessando como Cliente...');
  52  |     await page.goto(`/e/${eventId}`);
  53  |     
  54  |     await expect(page.getByText(/GALERIA DE VENDA AVULSA/i)).toBeVisible({ timeout: 20000 });
  55  |     
  56  |     // Seleciona fotos (se houver, senão o teste falha aqui, o que é correto para validar o sistema)
  57  |     // Nota: Para um teste 100% autônomo, o profissional deveria subir fotos antes.
  58  |     // Mas vamos assumir que o sistema de marketplace precisa de fotos para checkout.
  59  |     // Se não houver fotos, vamos testar o botão de checkout se estiver habilitado ou o paywall.
  60  |     
  61  |     const checkoutBtn = page.getByRole('button', { name: /FINALIZAR COMPRA/i });
  62  |     if (await checkoutBtn.isVisible()) {
  63  |       await checkoutBtn.click();
  64  |     } else {
  65  |       console.log('[MASTER] Nenhuma foto selecionável, tentando fluxo de orçamento/upgrade...');
  66  |       // Fallback para agendamento se for evento sem fotos
  67  |       await page.goto('/');
  68  |       await page.getByRole('button', { name: /AGENDAR/i }).click();
  69  |       await page.getByRole('button', { name: 'UNIDADE FIXA' }).click();
  70  |       await page.getByRole('combobox').selectOption({ index: 1 });
  71  |       await page.getByText(/SELECIONE A DATA/i).first().click();
  72  |       await page.locator('button:not([disabled])').filter({ hasText: /^[0-9]+$/ }).first().click();
  73  |       await page.getByRole('button', { name: /CONFIRMAR/i }).click();
  74  |       await page.getByRole('button', { name: /PRÓXIMO/i }).click();
  75  |       await page.getByRole('textbox').first().fill('10'); 
  76  |       await page.getByRole('button', { name: /CONTINUAR/i }).click();
  77  |     }
  78  | 
  79  |     // ─── 3. CHECKOUT: Validar QR Code Integrado ────────────────
  80  |     console.log('[MASTER] Validando Checkout...');
  81  |     await page.waitForURL(/.*checkout/, { timeout: 30000 });
  82  |     
  83  |     // Identificação
  84  |     const emailInput = page.locator('input[type="email"]');
  85  |     if (await emailInput.isVisible()) {
  86  |       await emailInput.fill(clientEmail);
  87  |       await page.locator('input[type="password"]').fill('tester123');
  88  |       await page.getByRole('button', { name: /CONTINUAR|CRIAR CONTA/i }).click();
  89  |     }
  90  | 
  91  |     // Seleciona PIX
  92  |     console.log('[MASTER] Selecionando PIX...');
  93  |     const pixOption = page.getByText(/Pix/i).first();
  94  |     await expect(pixOption).toBeVisible({ timeout: 20000 });
  95  |     await pixOption.click();
  96  | 
  97  |     // VALIDAÇÃO FINAL: QR Code Integrado
  98  |     console.log('[MASTER] Verificando se o QR Code apareceu INLINE...');
  99  |     await expect(page.locator('img[alt="Pix"]')).toBeVisible({ timeout: 40000 });
  100 |     await expect(page.getByText(/Expira em/i)).toBeVisible();
  101 |     
  102 |     // Garante que o layout original (lado esquerdo) PERMANECE
  103 |     await expect(page.getByText(/Investimento/i)).toBeVisible();
  104 |     
  105 |     console.log('[MASTER] ✅ Ciclo completo validado com QR Code Integrado!');
  106 |   });
  107 | });
  108 | 
```
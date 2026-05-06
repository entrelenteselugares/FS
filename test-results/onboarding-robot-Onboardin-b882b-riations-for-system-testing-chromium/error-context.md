# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: onboarding-robot.spec.ts >> Onboarding Robot: System Population >> should create all user variations for system testing
- Location: e2e\onboarding-robot.spec.ts:7:7

# Error details

```
Test timeout of 400000ms exceeded.
```

```
Error: locator.click: Test timeout of 400000ms exceeded.
Call log:
  - waiting for getByRole('button', { name: /CONVOCAR MEMBRO/i })

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
          - button "Eventos 3" [ref=e20] [cursor=pointer]:
            - img [ref=e22]
            - generic [ref=e25]: Eventos
            - generic [ref=e26]: "3"
          - button "Membros 3" [ref=e27] [cursor=pointer]:
            - img [ref=e29]
            - generic [ref=e34]: Membros
            - generic [ref=e35]: "3"
          - button "Orçamentos 1" [ref=e36] [cursor=pointer]:
            - img [ref=e38]
            - generic [ref=e41]: Orçamentos
            - generic [ref=e42]: "1"
          - button "Pedidos" [ref=e43] [cursor=pointer]:
            - img [ref=e45]
            - generic [ref=e48]: Pedidos
          - button "Financeiro" [ref=e49] [cursor=pointer]:
            - img [ref=e51]
            - generic [ref=e53]: Financeiro
          - button "Impressão" [ref=e54] [cursor=pointer]:
            - img [ref=e56]
            - generic [ref=e60]: Impressão
          - button "Franquias" [ref=e61] [cursor=pointer]:
            - img [ref=e63]
            - generic [ref=e66]: Franquias
          - button "Cat. Impressão" [ref=e67] [cursor=pointer]:
            - img [ref=e69]
            - generic [ref=e73]: Cat. Impressão
          - button "Serviços" [ref=e74] [cursor=pointer]:
            - img [ref=e76]
            - generic [ref=e78]: Serviços
          - button "Concursos" [ref=e79] [cursor=pointer]:
            - img [ref=e81]
            - generic [ref=e87]: Concursos
          - button "Configurações" [ref=e88] [cursor=pointer]:
            - img [ref=e90]
            - generic [ref=e93]: Configurações
          - link "Visitar Site" [ref=e94] [cursor=pointer]:
            - /url: /
            - img [ref=e95]
            - generic [ref=e99]: Visitar Site
        - generic [ref=e100]:
          - generic [ref=e101]:
            - generic [ref=e102]: Admin Foto Segundo
            - generic [ref=e103]: Administrador
          - button "Encerrar" [ref=e104] [cursor=pointer]:
            - img [ref=e105]
            - text: Encerrar
    - generic [ref=e108]:
      - navigation [ref=e109]:
        - generic [ref=e110]:
          - generic [ref=e111]: Admin Foto Segundo
          - button "Ativar Modo Diurno" [ref=e112] [cursor=pointer]:
            - img [ref=e114]
          - button "Sair" [ref=e121] [cursor=pointer]:
            - img [ref=e122]
            - text: Sair
      - main [ref=e125]:
        - generic [ref=e128]:
          - generic [ref=e129]:
            - heading "Visão Geral" [level=2] [ref=e130]
            - paragraph [ref=e131]: Consolidado da Operação Nacional
          - generic [ref=e132]:
            - generic [ref=e133]:
              - generic [ref=e135]: Receita Bruta
              - generic [ref=e137]: R$ 1,7
            - generic [ref=e138]:
              - generic [ref=e140]: Últimos 30 Dias
              - generic [ref=e141]:
                - generic [ref=e142]: R$ 1,7
                - generic [ref=e143]: ↑ 100%
            - generic [ref=e144]:
              - generic [ref=e146]: Pedidos Liquidados
              - generic [ref=e148]: "3"
            - generic [ref=e149]:
              - generic [ref=e151]: Eventos Ativos
              - generic [ref=e153]: "8"
            - generic [ref=e154]:
              - generic [ref=e156]: Convites Pendentes
              - generic [ref=e158]: "3"
            - generic [ref=e159]:
              - generic [ref=e161]: Vendas sem Entrega
              - generic [ref=e163]: "3"
            - generic [ref=e164]:
              - generic [ref=e166]: Novos Leads
              - generic [ref=e168]: "1"
          - generic [ref=e169]:
            - generic [ref=e170]:
              - heading "Timeline de Conversão" [level=3] [ref=e172]
              - application [ref=e176]:
                - generic [ref=e186]:
                  - generic [ref=e188]: 05/05
                  - generic [ref=e190]: 05/05
            - generic [ref=e191]:
              - heading "Pendências de Curadoria" [level=3] [ref=e192]
              - generic [ref=e193]:
                - generic [ref=e194]:
                  - generic [ref=e195]:
                    - generic [ref=e196]: Simulação Foto Segundo
                    - generic [ref=e197]:
                      - generic [ref=e198]: Sem Capa
                      - generic [ref=e199]: Sem Fotos
                  - button "Ajustar" [ref=e200] [cursor=pointer]
                - generic [ref=e201]:
                  - generic [ref=e202]:
                    - generic [ref=e203]: Centro da Cidade
                    - generic [ref=e205]: Sem Fotos
                  - button "Ajustar" [ref=e206] [cursor=pointer]
                - generic [ref=e207]:
                  - generic [ref=e208]:
                    - generic [ref=e209]: Lagoa Mingone
                    - generic [ref=e211]: Sem Fotos
                  - button "Ajustar" [ref=e212] [cursor=pointer]
                - generic [ref=e213]:
                  - generic [ref=e214]:
                    - generic [ref=e215]: Logo ali
                    - generic [ref=e217]: Sem Fotos
                  - button "Ajustar" [ref=e218] [cursor=pointer]
                - generic [ref=e219]:
                  - generic [ref=e220]:
                    - generic [ref=e221]: "Sistema: Clube de Memórias"
                    - generic [ref=e222]:
                      - generic [ref=e223]: Sem Capa
                      - generic [ref=e224]: Sem Fotos
                  - button "Ajustar" [ref=e225] [cursor=pointer]
  - generic [ref=e226]: 05/05
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Onboarding Robot: System Population', () => {
  4  |   const adminEmail = 'contatofotosegundo@gmail.com';
  5  |   const pass = '123456'; 
  6  | 
  7  |   test('should create all user variations for system testing', async ({ page }) => {
  8  |     test.setTimeout(400000);
  9  | 
  10 |     // 1. LOGIN ADMIN
  11 |     await page.goto('/login');
  12 |     await page.locator('input[type="email"]').fill(adminEmail);
  13 |     await page.locator('input[type="password"]').fill(pass);
  14 |     await page.getByRole('button', { name: /ENTRAR/i }).click();
  15 |     await expect(page).toHaveURL(/.*admin/);
  16 | 
  17 |     const createUser = async (data: any) => {
  18 |       console.log(`[ROBOT] Criando ${data.role}: ${data.email}...`);
  19 |       await page.goto('/admin/users');
> 20 |       await page.getByRole('button', { name: /CONVOCAR MEMBRO/i }).click();
     |                                                                    ^ Error: locator.click: Test timeout of 400000ms exceeded.
  21 | 
  22 |       await page.locator('input[required]').nth(0).fill(data.name); // Nome
  23 |       await page.locator('input[type="email"]').fill(data.email);
  24 |       await page.locator('input[type="password"]').fill('123456');
  25 |       await page.locator('select').selectOption(data.role);
  26 | 
  27 |       if (data.role === 'PROFISSIONAL') {
  28 |         if (data.captPct !== undefined) await page.locator('input[type="number"]').nth(0).fill(data.captPct.toString());
  29 |         if (data.editPct !== undefined) await page.locator('input[type="number"]').nth(1).fill(data.editPct.toString());
  30 |         if (data.equipment) await page.locator('textarea').fill(data.equipment);
  31 |         
  32 |         if (data.workflowType === 'MOBILE') {
  33 |              await page.getByRole('button', { name: /Mobile Maker/i }).click();
  34 |              await page.getByRole('button', { name: /Câmera\/PC/i }).click(); // Desmarca tradicional
  35 |         }
  36 |         
  37 |         if (data.isFranchise) {
  38 |              const toggle = page.locator('button:has(div.bg-white)').nth(0);
  39 |              await toggle.click();
  40 |              await page.locator('input[type="number"]').nth(2).fill(data.printCredits.toString());
  41 |         }
  42 |       }
  43 | 
  44 |       await page.getByRole('button', { name: /CONFIRMAR CONVOCAÇÃO/i }).click();
  45 |       await page.waitForTimeout(2000); // Aguarda animação e processamento
  46 |     };
  47 | 
  48 |     // --- PROFISSIONAIS ---
  49 |     await createUser({ name: 'PRO Fotografo', email: 'pro-photo@test.com', role: 'PROFISSIONAL', captPct: 30, editPct: 0, equipment: 'Sony A7III, 24-70mm' });
  50 |     await createUser({ name: 'PRO Editor', email: 'pro-editor@test.com', role: 'PROFISSIONAL', captPct: 0, editPct: 40, equipment: 'MacBook Pro M3 Max' });
  51 |     await createUser({ name: 'PRO Hibrido', email: 'pro-hybrid@test.com', role: 'PROFISSIONAL', captPct: 30, editPct: 20, equipment: 'Nikon Z6 II' });
  52 |     await createUser({ name: 'PRO Mobile', email: 'pro-mobile@test.com', role: 'PROFISSIONAL', workflowType: 'MOBILE', equipment: 'iPhone 15 Pro Max' });
  53 | 
  54 |     // --- UNIDADES ---
  55 |     await createUser({ name: 'UNIDADE Padrao', email: 'unit-std@test.com', role: 'UNIDADE_FIXA' });
  56 |     await createUser({ name: 'UNIDADE Tempo Fixo', email: 'unit-fixed@test.com', role: 'UNIDADE_FIXA' });
  57 |     await createUser({ name: 'UNIDADE Oculta', email: 'unit-hidden@test.com', role: 'UNIDADE_FIXA' });
  58 | 
  59 |     // --- FRANQUEADO ---
  60 |     await createUser({ name: 'FRAN Master', email: 'fran-master@test.com', role: 'PROFISSIONAL', isFranchise: true, printCredits: 1000 });
  61 | 
  62 |     // --- CLIENTE ---
  63 |     await createUser({ name: 'CLIENTE VIP', email: 'cliente-vip@test.com', role: 'CLIENTE' });
  64 | 
  65 |     console.log('[ROBOT] ✅ População inicial concluída!');
  66 |   });
  67 | });
  68 | 
```
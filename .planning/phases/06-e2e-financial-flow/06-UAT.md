# 06-UAT: E2E Financial Flow

---

status: complete
phase: 06-e2e-financial-flow
source: [06-SUMMARY.md]
started: 2026-05-03T17:01:00Z
updated: 2026-05-03T18:55:00Z

---

## Automated Test Suite Results

Commit: `8f68708` — `test(e2e): complete financial E2E suite - all 3 verticals green`

Run date: 2026-05-03 | Duration: 26s | Workers: 1 (sequential)

| # | Test File | Vertical | Result | Time |
| - | --------- | -------- | ------ | ---- |
| 1 | `orcamento-b2b.spec.ts` | Orçamento B2B (Full Cycle) | ✅ PASS | 9.5s |
| 2 | `ponto-fixo-cash.spec.ts` | Ponto Fixo (Cash / Gateway Bypass) | ✅ PASS | 5.3s |
| 3 | `venda-rapida-guest.spec.ts` | Venda Rápida (Magic Link / Atrito Zero) | ✅ PASS | 2.8s |

**Total: 3 passed | 0 failed**

---

## Tests

### 1. PRO Verification Toggle

Expected:

1. Acesse o Painel Admin -> Membros.
2. Localize um usuário com papel 'PROFISSIONAL'.
3. Abra a edição do usuário e ative o switch "Status PRO (Verificado)".
4. Salve e verifique se o badge "PRO VERIFICADO" aparece na listagem.

**Result:** pass

---

### 2. Ponto Fixo — Cash Payment Bypass

Automated: `e2e/finance/ponto-fixo-cash.spec.ts`

Flow validated:

1. Login como `e2e-profissional@fotosegundo.test`
2. Acessa marketplace `/e/e2e-marketplace-test`
3. Seleciona foto disponível (cursor-pointer, não desbloqueada)
4. Redireciona para `/checkout/:orderId`
5. CheckoutPage reconhece PROFISSIONAL → `authStep=authorized`
6. Botão "Confirmar Recebimento em Dinheiro" visível
7. `window.confirm()` aceito pelo Playwright
8. Tela "PAGAMENTO CONFIRMADO" exibida

**Result:** ✅ pass (automated)

Key decisions:

- O bypass de gateway é condicionado ao `role` do usuário logado
- A seleção filtra `.cursor-pointer` para evitar fotos já desbloqueadas

---

### 3. Venda Rápida — Guest Checkout (Magic Link / Atrito Zero)

Automated: `e2e/finance/venda-rapida-guest.spec.ts`

Flow validated:

1. Script `setup-guest-order.ts` cria pedido com `isGuestOrder=true` + `guestToken`
2. Playwright navega para `/checkout?orderId=...&token=...`
3. CheckoutPage detecta `order.isGuestOrder` → `setAuthStep('authorized')` imediatamente
4. Sem campo de senha exibido (bypass de autenticação confirmado)
5. Valor R$ 1,00 visível no resumo
6. Brick do Mercado Pago (`#paymentBrick_container iframe`) renderizado

**Result:** ✅ pass (automated)

Key decisions:

- `isGuestOrder` bypass é implementado no `useEffect` de autenticação (CheckoutPage linha 128)
- O `guestToken` é único e garante que somente o portador do link pode acessar

---

### 4. Orçamento B2B — Full Cycle (Lead → Admin → Payment Ready)

Automated: `e2e/finance/orcamento-b2b.spec.ts`

Flow validated:

1. **Fase 1 (Cliente):** Submete cotação em `/cotacao` (CEP, data, serviço, contato)
2. **Fase 2 (Admin):** Login, acessa "Gestão de Orçamentos", localiza cotação pelo nome
3. **Fase 3 (Admin Approves):** Clica na linha → painel abre → navega para aba "5. Fechamento"
4. Preenche `spinbutton` "Valor Final da Proposta" com R$ 1,00
5. Clica "DISPARAR ORÇAMENTO OFICIAL"
6. Toast/feedback de aprovação confirmado

**Result:** ✅ pass (automated)

Key decisions:

- O botão de aprovação é "DISPARAR ORÇAMENTO OFICIAL" (não "APROVAR E ENVIAR CHECKOUT")
- O input de preço é um `spinbutton` sem placeholder — selecionado por role
- O backend `adminApproveQuote` cria o pedido pendente e envia e-mail com link de checkout

---

### 5. Escrow Policy Enforcement (Standard)

Expected:

1. Realize uma compra em um evento de um fotógrafo NÃO verificado.
2. Acesse Admin -> Financeiro.
3. O pedido deve aparecer com status "PENDENTE" na aba de repasses.
4. O campo "Pronto em" deve exibir uma data de 7 dias após o evento.

**Result:** [pending — UAT manual]

---

### 6. Escrow Policy Enforcement (PRO)

Expected:

1. Realize uma compra em um evento de um fotógrafo "PRO VERIFICADO".
2. Acesse Admin -> Financeiro.
3. O pedido deve aparecer com status "DISPONÍVEL" imediatamente.

**Result:** [pending — UAT manual]

---

### 7. Manual Payout Liquidation

Expected:

1. No Admin -> Financeiro, localize um repasse com status "DISPONÍVEL".
2. Clique em "Liquidar Repasse".
3. O status deve mudar para "PAGO" e o pedido deve ser movido para histórico.

**Result:** [pending — UAT manual]

---

## Summary

- **Total:** 7
- **Passed (automated):** 3
- **Passed (manual):** 1
- **Pending (manual UAT):** 3
- **Issues:** 0

## Gaps

- Escrow policy tests (UAT 5-7) requerem dados reais de pagamento — ficam como UAT manual na próxima sessão de homologação financeira.
- O `hybrid-penny-pix.spec.ts` (teste com PIX real) está separado por design — requer interação humana com timeout longo e deve ser executado de forma isolada com `--ui`.

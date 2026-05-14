# REVIEW — Phase 30: Financial Intelligence & Fiscal Hardening

**Data:** 2026-05-14  
**Revisão:** Standard Depth (per-file analysis)  
**Arquivos Revisados:**
- `backend/src/services/report.service.ts`
- `backend/src/controllers/payout.controller.ts`
- `backend/src/tests/report.service.test.ts`
- `frontend/src/components/profissional/CashflowChart.tsx`
- `frontend/src/pages/CheckoutPage.tsx` (correção aplicada durante auditoria)

---

## Resumo de Findings

| Severidade | Quantidade |
|:-----------|:----------:|
| CRITICAL   | 1 |
| WARNING    | 4 |
| INFO       | 3 |
| OK         | 6 |

---

## CRITICAL

### C-01 · report.service.ts · Tipo `any` em parâmetros públicos
**Linhas:** 8, 110, 168  
**Problema:** Os métodos `generateTaxReportPDF`, `generatePayoutReceiptPDF` e `generateTaxReportCSV` aceitam `settlements: any[]` e `payoutItem: any`. Isso desabilita completamente a verificação de tipos do TypeScript para os dados financeiros mais críticos do sistema. Um campo `null` em `order.total` causaria cálculo fiscal silenciosamente errado.  
**Fix:** Criar interface `SettlementWithOrder` e substituir `any`.

---

## WARNING

### W-01 · payout.controller.ts · N+1 Query dentro de loop
**Linhas:** 122–141  
**Problema:** `prisma.user.findUnique()` é chamado dentro de loop `for...of`. Com 30 beneficiários = 30 queries ao banco.  
**Fix:** Coletar IDs, fazer `prisma.user.findMany({ where: { id: { in: ids } } })`, criar mapa.

### W-02 · report.service.ts · Offsets absolutos no PDF podem causar sobreposição
**Linhas:** 44–55  
**Problema:** `doc.y - 70`, `doc.y - 50`, `doc.y - 12` são frágeis se o conteúdo acima variar de tamanho (nome longo do profissional).  
**Fix:** Capturar `const summaryTop = doc.y` antes do `rect()` e usar offsets relativos.

### W-03 · CashflowChart.tsx · fillOpacity pode exceder 1.0
**Linha:** 113  
**Problema:** `fillOpacity={0.8 + (index * 0.05)}` excede 1.0 quando index >= 4.  
**Fix:** `fillOpacity={Math.min(1, 0.8 + index * 0.05)}`

### W-04 · payout.controller.ts · CSV do Admin sem UTF-8 BOM
**Linha:** 232  
**Problema:** `exportPayoutCSV` não inclui `\uFEFF` no início, causando problema de encoding no Excel brasileiro.  
**Fix:** `let csv = "\uFEFF" + "ID_Repasse,...\n";`

---

## INFO

### I-01 · Sem testes de array vazio no ReportService
Falta cobertura de `generateTaxReportCSV([])` e `generateTaxReportPDF(user, 2026, 5, [])`.

### I-02 · getMeuSaldoSummary não retorna projeção semanal
O PLAN.md especifica retorno `[{ week: 'Semana 1', amount }]`. A implementação retorna `{ available, pending, totalCount }`. Confirmar se `/profissional/finance/cashflow` existe separadamente.

### I-03 · CheckoutPage.tsx: erro de sintaxe corrigido durante auditoria
Linha 6 continha número de linha no código (`6: import WhatsApp...`). Corrigido durante a Auditoria Visual (Phase 31).

---

## OK (Sem Issues)

- Lógica de split CAPTACAO/EDICAO/CARTORIO: usa valores gravados no pedido (integridade histórica).
- CSV BOM UTF-8 no ReportService: implementado corretamente.
- Paginação do PDF: loop com `doc.addPage()` implementado.
- Estados de UI do CashflowChart: loading, error e empty state cobertos.
- Autenticação nos endpoints: `req.user?.userId` verificado em todos os handlers.
- Banco de dados em sync: `prisma migrate status` confirma 0 drift vs Supabase produção.

---

## Plano de Correção (Prioritizado)

| # | Finding | Esforço |
|:--|:--------|:--------|
| 1 | C-01 — Tipar `settlements: any[]` | 15 min |
| 2 | W-04 — BOM UTF-8 no CSV do Admin | 2 min |
| 3 | W-01 — Resolver N+1 query | 20 min |
| 4 | W-02 — Corrigir offsets do PDF | 10 min |
| 5 | W-03 — Limitar fillOpacity max 1.0 | 1 min |
| 6 | I-01 — Testes de array vazio | 10 min |
| 7 | I-02 — Confirmar /finance/cashflow | 5 min |

# PLAN: Phase 30 — Financial Intelligence & Fiscal Hardening

## 1. Objetivos da Phase

Implementar a infraestrutura de relatórios fiscais (MEI), automação de recibos de repasse e previsibilidade de caixa (Cashflow) para os profissionais.

## 2. Tarefas de Implementação

### T1. Infraestrutura de Documentos (Backend)

- [ ] **Instalação:** `npm install pdfkit` e `@types/pdfkit` no backend.
- [ ] **ReportService:** Criar `backend/src/services/report.service.ts` com métodos para:
  - `generateTaxReport(user, year, month)`: Gera Buffer PDF e string CSV.
  - `generatePayoutReceipt(payout)`: Gera Buffer PDF do comprovante de repasse.
- [ ] **Estilização:** Implementar o layout "Light/Minimalist" com o branding Foto Segundo.

### T2. Endpoints de Relatórios & Recibos (Backend)

- [ ] **Tax Report Endpoint:** Criar `GET /profissional/reports/tax` (com query params `month` e `year`).
- [ ] **Receipt Endpoint:** Criar `GET /profissional/reports/receipt/:id`.
- [ ] **Lógica de Dados:** Consultar `PayoutSettlement` para compor os valores brutos, líquidos e taxas.

### T3. Automação de E-mail (Backend)

- [ ] **Trigger de Liquidação:** Modificar `FinanceHubController.settleProfessional` para:
  - Chamar o `ReportService` para gerar o recibo do payout recém-criado.
  - Disparar e-mail via `EmailService` com o PDF em anexo.

### T4. Inteligência de Fluxo de Caixa (Backend)

- [ ] **Projection Logic:** Adicionar `getMeuSaldoSummary` (ou similar) no `payout.controller.ts` para retornar um array de projeção: `[{ week: 'Semana 1', amount: 1500 }, ...]`.
- [ ] **Cálculo:** Baseado em `order.createdAt + 7 dias` para todos os `PayoutSettlement` com status `PENDING` de pedidos `APROVADO`.

### T5. Dashboard Financeiro (Frontend)

- [ ] **Componente CashflowChart:** Criar `frontend/src/components/profissional/CashflowChart.tsx` usando `recharts` (BarChart).
- [ ] **Integração FinanceTab:**
  - Inserir o gráfico acima do histórico de repasses.
  - Conectar os botões de "Relatório Tributário" aos novos endpoints.
- [ ] **Feedback Visual:** Adicionar estados de loading e download para os relatórios.

## 3. Estratégia de Verificação (UAT)

1. **Teste Fiscal:** Gerar um relatório de um mês com 5 vendas e validar se a soma bate com o total bruto esperado.
2. **Teste de Automação:** Realizar uma liquidação via Admin e verificar se o e-mail chega com o anexo PDF correto.
3. **Teste de Projeção:** Aprovar uma venda nova e verificar se o gráfico de fluxo de caixa sobe o valor na semana correspondente (+7 dias).
4. **Teste de Impressão:** Baixar o PDF e validar se o layout Light é legível em preto e branco.

## 4. Definições Técnicas (Locked)

- **PDF Engine:** PDFKit (Em memória).
- **Chart:** Recharts BarChart (Weekly).
- **Email:** Nodemailer (HTML template).

# RESEARCH: Phase 30 — Financial Intelligence & Fiscal Hardening

## 1. Stack de Documentação (PDF/CSV)

### PDF Generation: `pdfkit`

- **Por que:** É uma biblioteca madura, leve (ideal para Vercel Serverless) e permite controle total sobre o layout (coordenadas absolutas), essencial para manter a estética _Midnight Luxury_.
- **Instalação:** `npm install pdfkit` e `@types/pdfkit`.
- **Consideração de Fonte:** Precisamos embutir uma fonte sans-serif moderna (ex: Inter ou Helvetica) para garantir o visual premium.

### CSV Generation: Manual

- **Por que:** Para os campos simples do MEI, uma implementação manual com `string` e `Blob` (no front) ou `Buffer` (no back) é mais eficiente do que adicionar uma dependência pesada.

## 2. Requisitos Fiscais (MEI)

### Relatório de Receitas Brutas

O MEI é obrigado a preencher mensalmente o "Relatório Mensal de Receitas Brutas". Para o Foto Segundo, o relatório deve extrair:

1. **Receita Bruta com Prestação de Serviços:** Soma do valor líquido + taxas (valor total pago pelo cliente).
2. **Discriminação por Categoria:** No Foto Segundo, 100% será "Prestação de Serviços".
3. **Dados do Cliente:** Embora não seja obrigatório para o relatório simplificado do MEI, incluir o `orderId` e `customerName` ajuda na rastreabilidade.

## 3. Visualização de Cashflow (Frontend)

### Componente: `recharts` (BarChart)

- **Status:** Já instalado no projeto (`v3.8.1`).
- **Implementação:**
  - **Data Processing:** No backend, agruparemos os `PayoutSettlement` (status PENDING) por semana com base na `dataDeLiberacao` (order.createdAt + 7 dias).
  - **Gráfico:** Eixo X (Semanas), Eixo Y (Valor em R$).
  - **Cores:** Barras com degradê `brand-tactical` (#85B9AC) para manter o visual luxo.

## 4. Fluxo de Automação de E-mail

### SMTP Trigger

- **Local:** `backend/src/controllers/finance_hub.controller.ts` -> Função `settleProfessional`.
- **Lógica:** Após criar o registro de `WeeklyPayout` e marcar os settlements como `PAID`, chamaremos o `EmailService` enviando o PDF recém-gerado em anexo.
- **Segurança:** O PDF deve ser gerado em memória (Buffer) e enviado diretamente, sem ser salvo no disco do servidor.

## 5. Próximos Passos (Plano)

1. Instalação de `pdfkit`.
2. Criação do `ReportService` no backend.
3. Implementação dos endpoints de download.
4. Criação do componente `CashflowChart` na `FinanceTab`.
5. Hook de e-mail no Hub de Finanças.

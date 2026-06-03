# CONTEXT: Phase 30 — Financial Intelligence & Fiscal Hardening

## 1. Domínio da Phase

Finalização do ciclo financeiro com foco em conformidade MEI, automação de recibos e previsibilidade de caixa para o profissional.

## 2. Decisões de Implementação (Locked)

### 🎨 UI/UX & Estética

- **PDF Styling:** Design **Light/Minimalista**. Fundo branco, tipografia preta/cinza escuro, com acentos na cor `brand-tactical` (#85B9AC). Prioridade para legibilidade e economia de tinta em impressão.
- **Visualização de Caixa:** **Gráfico de Barras Semanais**. Agrupamento por semana de liberação (7 dias pós-venda) para facilitar a leitura de volume de recebimentos.
- **E-mails de Recibo:** Templates **HTML premium**. Devem incluir logo da Foto Segundo, resumo da transação no corpo do e-mail e o PDF em anexo.

### ⚙️ Engenharia & Arquitetura

- **Geração de Documentos:** **On-the-fly**. Relatórios e recibos serão gerados no momento da requisição/trigger, sem necessidade de armazenamento persistente dos arquivos (single source of truth no DB).
- **Bibliotecas Sugeridas:**
  - Backend: `pdfkit` ou `pdf-lib` para geração dos documentos.
  - Frontend: `recharts` (se já disponível) para o gráfico de fluxo de caixa.
- **Filtros de Relatório:** Mês/Ano (Competência).

### 🛠️ Regras de Negócio

- **Base de Projeção:** Apenas pedidos com status `APROVADO` que ainda estão em período de escrow (pendentes de liberação).
- **Trigger de E-mail:** Vinculado à ação de `Settle` (Liquidação) do Admin Financeiro.

## 3. Refs Canônicas (Canonical Refs)

- `backend/src/controllers/finance_hub.controller.ts` (Base para lógica de liquidação)
- `frontend/src/components/profissional/FinanceTab.tsx` (Local de inserção do gráfico)
- `30-financial-intelligence-SPEC.md` (Requisitos travados)

## 4. Notas de Pesquisa (Downstream)

- Investigar a melhor biblioteca de PDF para ambiente Serverless (Vercel) — `pdfkit` costuma ser estável e leve.
- Validar as colunas necessárias para o CSV do MEI (Datas, IDs de Pedidos, Valores Brutos/Líquidos).

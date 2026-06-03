# SPEC: Phase 30 — Financial Intelligence & Fiscal Hardening

## 1. Visão Geral

Esta fase completa o ciclo financeiro da plataforma Foto Segundo, fornecendo aos profissionais as ferramentas necessárias para gestão fiscal (MEI) e previsibilidade de caixa, além de automatizar o envio de comprovantes de liquidação.

## 2. Requisitos de Negócio (Locked)

### R1. Relatório Tributário Mensal (Modelo MEI)

- **O que é:** Um extrato consolidado das receitas de prestação de serviços dentro do mês.
- **Estado Atual:** Apenas um botão estático no dashboard profissional.
- **Estado Alvo:** Endpoint funcional que gera o relatório em **PDF** (estilizado Midnight Luxury) e **CSV**.
- **Campos Obrigatórios:**
  - Identificação do Profissional (Nome, CPF/CNPJ).
  - Período de Competência (Mês/Ano).
  - Receita Bruta Total (Serviços).
  - Listagem de Pedidos Aprovados no período (Data, ID, Valor Líquido).
  - Discriminação de Taxas da Plataforma.
- **Critério de Aceite:** O profissional consegue baixar o PDF e o CSV referente a qualquer mês de atividade.

### R2. Recibos de Repasse Automáticos

- **O que é:** Envio de comprovante de pagamento consolidado via e-mail.
- **Estado Atual:** Admin liquida o pagamento no Hub, mas o profissional só vê a mudança de status no dashboard.
- **Estado Alvo:** No momento da liquidação (Settle), o sistema gera um PDF de recibo e o envia automaticamente para o e-mail do profissional via SMTP.
- **Critério de Aceite:** O recebimento de um e-mail com anexo PDF contendo o detalhamento dos pedidos liquidados naquela transação.

### R3. Projeção de Cashflow (30 Dias)

- **O que é:** Painel de previsibilidade de recebimentos futuros.
- **Estado Atual:** Profissional vê apenas o saldo disponível e o saldo em garantia total.
- **Estado Alvo:** Um card ou gráfico simples na `FinanceTab` mostrando o valor total a ser liberado nos próximos 30 dias, baseado na data de expiração do escrow (7 dias após a aprovação do pedido).
- **Dados:** Somente pedidos em estado `APROVADO`.
- **Critério de Aceite:** O valor mostrado na projeção deve bater exatamente com a soma dos splits dos pedidos em escrow.

## 3. Fronteiras (Scope)

### Em Escopo (In Scope)

- Geração de PDF no backend (usando bibliotecas como `pdfkit` ou `jspdf-autotable`).
- Geração de CSV para exportação.
- Integração com o serviço de e-mail existente (SMTP/Nodemailer).
- UI para visualização da projeção de caixa.

### Fora de Escopo (Out of Scope)

- Emissão oficial de Nota Fiscal de Serviço Eletrônica (NFS-e) via APIs governamentais.
- Integração com softwares de contabilidade externos.
- Gestão de despesas manuais para abatimento de impostos (foco apenas na receita bruta).

## 4. Critérios de Aceite Técnicos

- [ ] Endpoint `GET /api/me/reports/tax` validado com filtros de mês/ano.
- [ ] Gatilho de e-mail disparado imediatamente após `settleProfessional` no controller.
- [ ] Projeção de fluxo de caixa reflete mudanças em tempo real quando um novo pedido é aprovado.
- [ ] Arquivos PDF gerados seguem a identidade visual _Midnight Luxury_ (cores e tipografia).

## 5. Relatório de Ambiguidade

- **Ambiguity Score:** 0.07 (Alta Precisão)
- **Riscos:** Dependência da estabilidade do serviço de SMTP para entrega dos recibos.

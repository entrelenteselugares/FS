# Project Architecture: Foto Segundo

Este documento descreve a arquitetura técnica da plataforma **Foto Segundo**, focando nos fluxos de dados, infraestrutura de storage e o motor de automação phygital.

---

## 1. Visão Geral do Sistema

O Foto Segundo é uma aplicação monorepo baseada em **Node.js/React** com uma separação clara entre as responsabilidades de backend (API REST) e frontend (Dashboards).

### 🏗️ Camadas Principais
- **Core API (Backend):** Express + TypeScript, orquestrando autenticação, pagamentos (Mercado Pago) e integração com Google Drive.
- **Client App (Frontend):** React + Vite com tema *Midnight Luxury*. Gerencia 4 tipos de perfis (Master, Profissional, Cartório, Cliente).
- **IoT Agent (Printer):** Executável Node.js local que monitora a fila de impressão via Webhooks/Polling e controla hardware de impressão.

---

## 2. Estratégia de Storage (Hybrid Multi-Tier)

Para garantir escalabilidade e baixo custo, utilizamos uma estratégia de armazenamento em camadas:

1.  **Hot Data (Supabase):** Metadados de usuários, eventos, pedidos e transações financeiras.
2.  **Asset Metadata (Prisma):** IDs de arquivos, links de visualização e miniaturas (thumbnails).
3.  **Cold Storage (Google Drive):** Arquivos de alta resolução e ativos dos "Cofres de Memórias".
    *   **Auth Flow:** Utilizamos **OAuth2 Hybrid Flow** (Refresh Tokens) para garantir que o armazenamento utilize a cota do Google Workspace corporativo, evitando os limites de 0MB das Service Accounts em drives pessoais.

---

## 3. Fluxos de Eventos Críticos

### ⚡ Flash Event (Venda de Alto Volume)
1.  **Geração:** O fotógrafo gera cartões físicos com `ShortID` e `PIN` único.
2.  **Captura:** O fotógrafo sobe as fotos vinculando-as ao `ShortID`.
3.  **Acesso:** O cliente acessa `/flash/:shortId`, digita o PIN e visualiza a foto em sessão anônima.
4.  **Conversão:** Ao clicar em resgatar, o cliente é levado ao registro e a foto é vinculada ao seu `userId` permanentemente.

### 🖨️ Web-to-Print IoT Engine
1.  **Webhook:** O backend recebe confirmação de pagamento do Mercado Pago.
2.  **Queue:** O pedido entra na fila de impressão do evento.
3.  **Heartbeat:** O agente de impressão local envia telemetria constante para o backend.
4.  **Pull/Print:** O agente detecta o pedido, baixa o ativo do Google Drive e envia para o spooler da impressora local.

---

## 4. Segurança e Integridade

- **Auth:** JWT para sessões curtas e Refresh Tokens para persistência.
- **Audit:** Todas as operações críticas (Logins, Pagamentos, Uploads) são registradas no `GamificationLedger` ou logs de auditoria.
- **Validation:** Regras de negócio como a "Meta da Folha A4" (múltiplos de 4) são validadas no backend para evitar desperdício de insumos físicos.

---

## 5. Deployment

- **Hosting:** Vercel (Frontend e Serverless API).
- **Database:** Supabase (PostgreSQL).
- **ORM:** Prisma Client (conectado via Direct URL para migrações e Connection Pooling para runtime).

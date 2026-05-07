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

1. **Hot Data (Supabase):** Metadados de usuários, eventos, pedidos e transações financeiras.
2. **Asset Metadata (Prisma):** IDs de arquivos, links de visualização e miniaturas (thumbnails).
3. **Cold Storage (Google Drive):** Arquivos de alta resolução e ativos dos "Cofres de Memórias".
   - **Auth Flow:** Utilizamos **OAuth2 Hybrid Flow** (Refresh Tokens) para garantir que o armazenamento utilize a cota do Google Workspace corporativo, evitando os limites de 0MB das Service Accounts em drives pessoais.

---

## 3. Fluxos de Eventos Críticos

### ⚡ Flash Event (Venda de Alto Volume)

1. **Geração:** O fotógrafo gera cartões físicos com `ShortID` e `PIN` único.
2. **Captura:** O fotógrafo sobe as fotos vinculando-as ao `ShortID`.
3. **Acesso:** O cliente acessa `/flash/:shortId`, digita o PIN e visualiza a foto em sessão anônima.
4. **Conversão:** Ao clicar em resgatar, o cliente é levado ao registro e a foto é vinculada ao seu `userId` permanentemente.

### 🖨️ Web-to-Print IoT Engine

1. **Webhook:** O backend recebe confirmação de pagamento do Mercado Pago.
2. **Queue:** O pedido entra na fila de impressão do evento.
3. **Heartbeat:** O agente de impressão local envia telemetria constante para o backend.
4. **Pull/Print:** O agente detecta o pedido, baixa o ativo do Google Drive e envia para o spooler da impressora local.

---

## 4. Segurança e Integridade

- **Auth:** JWT para sessões curtas e Refresh Tokens para persistência.
- **Audit:** Todas as operações críticas (Logins, Pagamentos, Uploads) são registradas no `GamificationLedger` ou logs de auditoria.
- **Validation:** Regras de negócio como a "Meta da Folha A4" (múltiplos de 4) são validadas no backend para evitar desperdício de insumos físicos.

---

## 3. Component Diagram

```mermaid
graph TD
    subgraph "Cloud Infrastructure (Vercel/Supabase)"
        A[Frontend App - React/Vite]
        B[Backend API - Node/Express]
        C[(PostgreSQL - Supabase)]
        D[Google Drive - Cold Storage]
        E[Mercado Pago - Payments]
    end

    subgraph "Edge/Local Environment"
        F[IoT Printer Agent]
        G[Local Printer Hardware]
    end

    A -- REST API --> B
    B -- Prisma ORM --> C
    B -- OAuth2 --> D
    B -- Webhooks --> E
    F -- Polling/Heartbeat --> B
    F -- Download Assets --> D
    F -- Spooler --> G
```

---

## 4. Key Abstractions

- **Vault Engine (`backend/src/services/vault.service.ts`):** Manages the lifecycle of "Cofres de Memórias", including subscription states and media organization in Google Drive.
- **Order Motor (`backend/src/controllers/payment.controller.ts`):** Orchestrates transaction processing, financial splits, and fulfillment status.
- **IoT Telemetry (`backend/src/services/iot.service.ts`):** Handles printer agent heartbeat monitoring and device health tracking.
- **Access Controller (`backend/src/controllers/access.controller.ts`):** Manages photo visibility, like system, and QR/PIN-based anonymous access.

---

## 5. Directory Structure Rationale

| Directory | Purpose |
|-----------|---------|
| `/backend` | Core business logic, database models (Prisma), and external integrations. |
| `/frontend` | Multi-profile dashboard UI and Midnight Luxury theme implementation. |
| `/api` | Vercel-specific deployment entry points. |
| `/printer-agent` | Local IoT agent source code for physical fulfillment. |
| `/docs` | Technical documentation and architectural guides. |
| `/.planning` | GSD framework artifacts (PROJECT, ROADMAP, STATE). |

---

## 6. Deployment

- **Hosting:** Vercel (Frontend e Serverless API).
- **Database:** Supabase (PostgreSQL).
- **ORM:** Prisma Client (conectado via Direct URL para migrações e Connection Pooling para runtime).

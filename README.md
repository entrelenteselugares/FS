# 📸 Foto Segundo | Midnight Luxury Experience

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Foto Segundo** é uma plataforma phygital de elite que redefine a entrega de fotografia profissional. Unindo a estética *Midnight Luxury* com automação industrial de impressão, transformamos pixels em memórias físicas tangíveis em segundos.

---

## 💎 Diferenciais Estratégicos

### ⚡ Flash Event (Fricção Zero)

Entrega de fotos anônima via QR Code e PIN de 6 dígitos. O cliente visualiza sua foto instantaneamente e a resgata criando uma conta — eliminando a barreira de entrada e aumentando a conversão em eventos de alto volume.

### 🏛️ Memory Vaults

Infraestrutura de armazenamento em nuvem (Google Drive Cold Storage) integrada para preservação de ativos digitais de longo prazo, permitindo que clientes mantenham suas memórias seguras e acessíveis para sempre.

### 📝 Briefing & Observações (Gestão Operacional)

Sistema de captura de observações customizadas durante o orçamento, totalmente integrado ao Dashboard Admin. Permite visibilidade operacional total sobre as solicitações específicas do cliente desde o primeiro contato até a execução.

### 🖨️ IoT Print Engine

Agente de impressão local em tempo real que monitora a fila de pedidos e realiza o fulfillment físico automático, garantindo que o "unboxing" da memória aconteça ainda durante o evento.

---

## 🛠️ Stack Tecnológica

* **Frontend:** React, Vite, TailwindCSS (Midnight Luxury Theme), Framer Motion.
* **Backend:** Node.js, Express, TypeScript.
* **Banco de Dados:** PostgreSQL (Supabase) via Prisma ORM.
* **Storage:** Google Drive API (OAuth2 Hybrid Flow).
* **Infra:** Vercel (Serverless Functions).

---

## 🚀 Início Rápido

### Pré-requisitos

* Node.js 20.x
* Instância PostgreSQL (Supabase recomendado)
* Credenciais Google Cloud (Drive API)

### Instalação

```bash
# Instalar dependências (Raiz)
npm install

# Instalar dependências (Módulos)
npm install --prefix backend
npm install --prefix frontend

# Configurar variáveis de ambiente
cp .env.example .env
```

### Desenvolvimento

```bash
# Rodar Backend + Frontend simultaneamente
npm run dev
```

---

## 📂 Estrutura do Projeto

* **/backend**: API REST, Serviços Google Drive, Integração Mercado Pago.
* **/frontend**: Interface do usuário, Dashboards (Master, Partner, Cliente).
* **/api**: Entrypoint para deploy na Vercel.
* **/docs**: Documentação técnica detalhada.
* **/.planning**: Roadmaps, especificações GSD e histórico de decisões.

---

## 📖 Exemplos de Uso

### 1. Criar um Flash Event (Dashboard Profissional)

Profissionais podem criar eventos de alta conversão onde fotos são resgatadas via PIN:

```bash
POST /api/profissional/flash-event
Authorization: Bearer <seu_token>
Content-Type: application/json

{
  "nome": "Casamento Silva & Santos",
  "data": "2026-06-15",
  "local": "Villa Borghese"
}
```

### 2. Upload de Foto via Phygital Flow

Para fluxos de impressão instantânea (QR Code no evento):

```bash
POST /api/public/phygital/upload
Content-Type: multipart/form-data

file: <buffer_da_imagem>
eventId: <id_do_evento>
shortId: "FS-123"
```

### 3. Telemetria do Printer Agent

O agente de impressão local deve enviar heartbeats para manter a conexão ativa:

```bash
POST /api/iot/heartbeat
Content-Type: application/json

{
  "deviceId": "PRINTER-01",
  "status": "online",
  "queueCount": 5
}
```

---

## 🤝 Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de desenvolvimento. Este projeto segue o framework GSD para planejamento e execução.

---

## 📜 Licença

© 2026 Foto Segundo. Todos os direitos reservados.
Projetado para a excelência na fotografia phygital.

## System Certification (v3.2 - Golden Stable)

The Foto Segundo platform is certified for Production Readiness as of May 9, 2026.
- **E2E Integrity:** 100% pass rate in Playwright Master Suite.
- **Financial Security:** Transactional split and PIX generation validated.
- **Architecture:** Formalized 7-module Enterprise structure.
- **Resilience:** Cross-cutting Retry Layer implemented for serverless database connection stability.

## ✅ Certificação de Qualidade (E2E Stability)

A plataforma Foto Segundo atingiu o estado **Golden Stable**, com 100% de integridade operacional validada:

* **Fluxo Financeiro:** Geração de PIX e conciliação bancária validada.
* **Navegação Multi-Perfil:** 13 perfis de usuário verificados de ponta a ponta sem falhas em Cold Start.
* **Integração IoT:** Telemetria de impressão 100% operacional.
* **Admin Hub:** Listagem de pedidos, financeiro e logística restaurada e auditada.

[Acessar Produção Enterprise](https://foto-segundo.vercel.app)

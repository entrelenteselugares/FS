<!-- GSD:README -->
# 📸 Foto Segundo | Midnight Luxury Experience

[![Vercel Deployment](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?style=for-the-badge&logo=prisma)](https://prisma.io)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)

**Foto Segundo** é uma plataforma phygital de elite que redefine a entrega de fotografia profissional. Unindo a estética *Midnight Luxury* com automação industrial de impressão e um motor completo de Growth & Retention, transformamos pixels em memórias físicas tangíveis — e conversões em receita recorrente.

---

## 💎 Diferenciais Estratégicos

### ⚡ Flash Event (Fricção Zero)

Entrega de fotos anônima via QR Code e PIN de 6 dígitos. O cliente visualiza sua foto instantaneamente e a resgata criando uma conta — eliminando a barreira de entrada e aumentando a conversão em eventos de alto volume.

### 🏛️ Memory Vaults

Infraestrutura de armazenamento em nuvem (Google Drive Cold Storage) integrada para preservação de ativos digitais de longo prazo, permitindo que clientes mantenham suas memórias seguras e acessíveis para sempre.

### 🔄 Multi-Vertical Drive Sync

Sincronização inteligente com Google Drive que extrai metadados (Student ID/Bib Number) automaticamente dos nomes dos arquivos através de um motor Regex de alta precisão, eliminando o trabalho manual de indexação em eventos escolares e esportivos.

### 🎓 Multi-Vertical Business Logic

Suporte nativo para três verticais de fotografia profissional:
- **Fashion/Eventos** — Galeria padrão com marketplace de alta conversão.
- **Escolar** — Autenticação por turma/aluno, galeria filtrada por estudante.
- **Esportes** — Busca por número de dorsal (Bib Number) com motor de galeria dedicado.

### 🖨️ IoT Print Engine

Agente de impressão local em tempo real que monitora a fila de pedidos e realiza o fulfillment físico automático, garantindo que o "unboxing" da memória aconteça ainda durante o evento.

### 📈 Growth & Retention Engine

Motor completo de crescimento e retenção de clientes:
- **Cupons Dinâmicos** — Descontos percentuais e absolutos com limite de usos e validade.
- **Programa de Embaixadores** — Rastreamento de afiliados via cookie `fs_referral` de 30 dias, com painel de comissões.
- **Recuperação de Carrinho** — Job automatizado de e-mail e WhatsApp para carrinhos abandonados após 24h.
- **WhatsApp API** — Motor de notificações automáticas para "Foto Pronta" e eventos de conversão.

---

## 🛠️ Stack Tecnológica

* **Frontend:** React, Vite, TailwindCSS (Midnight Luxury Theme), Framer Motion.
* **Backend:** Node.js, Express, TypeScript.
* **Banco de Dados:** PostgreSQL (Supabase) via Prisma ORM.
* **Storage:** Google Drive API (OAuth2 Hybrid Flow).
* **Payments:** Mercado Pago (Checkout Pro + PIX).
* **Infra:** Vercel (Serverless Functions), Supabase Cron Jobs.
* **Notifications:** WhatsApp (Baileys/Evolution API).

---

## 🚀 Início Rápido

### Pré-requisitos

* Node.js 20.x
* Instância PostgreSQL (Supabase recomendado)
* Credenciais Google Cloud (Drive API)
* Conta Mercado Pago (MP_ACCESS_TOKEN)

### Instalação

```bash
# Instalar dependências (Raiz)
npm install

# Instalar dependências (Módulos)
npm install --prefix backend
npm install --prefix frontend

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais (veja docs/CONFIGURATION.md)

# Sincronizar o banco de dados
cd backend && npx prisma migrate deploy
```

### Desenvolvimento

```bash
# Rodar Backend + Frontend simultaneamente
npm run dev
```

---

## 📂 Estrutura do Projeto

* **/backend**: API REST, Serviços Google Drive, Integração Mercado Pago, Growth Engine.
* **/frontend**: Interface do usuário, Dashboards (Master, Partner, Cliente, Admin Growth).
* **/api**: Entrypoint para deploy na Vercel.
* **/printer-agent**: Agente IoT local para fulfillment de impressões.
* **/e2e**: Suite de testes Playwright E2E.
* **/docs**: Documentação técnica detalhada.
* **/.planning**: Roadmaps, especificações GSD e histórico de decisões.

---

## 📖 Exemplos de Uso

### 1. Criar um Flash Event (Dashboard Profissional)

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

### 2. Aplicar Cupom de Desconto no Checkout

```bash
GET /api/marketplace/coupons/PROMO20/validate?eventId=<eventId>
```

Resposta com `discountPct` ou `discountAbs`. O frontend aplica o desconto em tempo real e reconstrói o Brick do Mercado Pago.

### 3. Sincronizar Galeria Escolar (Google Drive)

Sincroniza fotos de uma pasta do Drive e extrai StudentID automaticamente dos nomes:

```bash
POST /api/marketplace/events/:eventId/sync-drive
Authorization: Bearer <token>
```

### 4. Telemetria do Printer Agent

```bash
POST /api/iot/heartbeat
Content-Type: application/json

{
  "deviceId": "PRINTER-01",
  "status": "online",
  "queueCount": 5
}
```

### 5. Trigger de Recuperação de Carrinho (Cron)

```bash
POST /api/cron/abandoned-carts
Authorization: Bearer <CRON_SECRET>
```

---

## 🤝 Contribuição

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para diretrizes de desenvolvimento. Este projeto segue o framework GSD para planejamento e execução.

---

## 📜 Licença

© 2026 Foto Segundo. Todos os direitos reservados.
Projetado para a excelência na fotografia phygital.

## System Certification (v7.0 - Expansão Total e Go-Live)

The Foto Segundo platform is certified for Production Readiness as of May 14, 2026.
- **Multi-Vertical:** School, Sports, and Fashion/Event photography fully supported.
- **Growth Engine:** Coupons, Affiliate tracking, Abandoned Cart automation active.
- **PWA:** Service Worker, Web Manifest, and Push Notifications configured.
- **E2E Integrity:** 100% pass rate in Playwright Master Suite.
- **Financial Security:** Transactional split, PIX, and FREE-coupon bypass validated.
- **Architecture:** 9-module Enterprise structure (Growth Engine added).

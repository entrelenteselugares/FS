# 01 — Arquitetura e Modelo de Negócio

## 🎯 Visão do Projeto: Foto Segundo

O **Foto Segundo** é uma plataforma **Phygital** (Physical + Digital) de alta performance, desenhada para fotógrafos profissionais e micro-franqueados. O sistema permite a venda e entrega instantânea de memórias digitais e físicas.

## 💼 Modelo de Negócio: B2B2C e Micro-Franquias

- **B2B**: Fotógrafos (Profissionais) utilizam a plataforma para gerir eventos, vitrines e agendamentos.
- **Micro-Franquias**: Unidades fixas ou móveis que operam totens de impressão. Elas recebem créditos de impressão e lucram na ponta da venda física.
- **B2C**: O cliente final (convidado do evento) acessa uma galeria premium, compra fotos digitais individualmente ou álbuns completos, e pode solicitar a impressão instantânea no local (Phygital).

## 🛠️ Stack Tecnológica

- **Frontend**: React, Design System **"Midnight Luxury" v3.1** (Foco em alta densidade de dados, modo escuro nativo e tipografia editorial).
- **Backend**: Node.js, Express, Prisma ORM (Unified Order Engine para transações agnósticas).
- **Infraestrutura**: Vercel (Edge Functions), Supabase (PostgreSQL + Auth + Storage).
- **IoT / Phygital**:
  - **Print Agent**: Agente autônomo local para automação Web-to-Print.
  - **Sharp Engine**: Processamento dinâmico de mídias Phygital com carimbos de referência.
- **Integrações**: Google OAuth2 (Calendar), CallMeBot (WhatsApp), MercadoPago (Checkout Transparente).

## 📊 Motor de Créditos e Impressão

O sistema gerencia um saldo de créditos para franqueados. Cada impressão bem-sucedida debita um crédito, garantindo o controle de suprimentos e royalties da rede.

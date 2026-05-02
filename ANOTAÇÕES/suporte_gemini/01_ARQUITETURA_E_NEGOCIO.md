# 01 — Arquitetura e Modelo de Negócio

## 🎯 Visão do Projeto: Foto Segundo

O **Foto Segundo** é uma plataforma **Phygital** (Physical + Digital) de alta performance, desenhada para fotógrafos profissionais e micro-franqueados. O sistema permite a venda e entrega instantânea de memórias digitais e físicas.

## 💼 Modelo de Negócio: B2B2C e Micro-Franquias

- **B2B**: Fotógrafos (Profissionais) utilizam a plataforma para gerir eventos, vitrines e agendamentos.
- **Micro-Franquias**: Unidades fixas ou móveis que operam totens de impressão. Elas recebem créditos de impressão e lucram na ponta da venda física.
- **B2C**: O cliente final (convidado do evento) acessa uma galeria premium, compra fotos digitais individualmente ou álbuns completos, e pode solicitar a impressão instantânea no local (Phygital).

## 🛠️ Stack Tecnológica

- **Frontend**: Next.js 14+ (App/Pages Router), React, Lucide Icons, Design System "Midnight Luxury" (Vanila CSS + Design Tokens).
- **Backend**: Node.js com Express, Prisma ORM (PostgreSQL via Supabase).
- **Infraestrutura**: Vercel (Hosting), Supabase Storage (S3 API) para mídias, Cloudinary (opcional).
- **IoT / Phygital**:
  - **Print Agent**: Node.js executado localmente (Windows/Linux) que consome a fila `/queue` do backend.
  - **Sharp**: Processamento de imagem no backend para overlays, marcas d'água e carimbos SVG de referência.
- **Integrações**: Google OAuth2 (Calendar), CallMeBot (WhatsApp API), Iugu/MercadoPago (Pagamentos).

## 📊 Motor de Créditos e Impressão

O sistema gerencia um saldo de créditos para franqueados. Cada impressão bem-sucedida debita um crédito, garantindo o controle de suprimentos e royalties da rede.

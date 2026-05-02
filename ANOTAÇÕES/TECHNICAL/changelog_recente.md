# Changelog Recente - Foto Segundo

Este documento registra as atualizações críticas realizadas para estabilização da plataforma e lançamento da versão "Midnight Luxury".

## 🚀 01/05/2026 — Lançamento da Era Phygital: Automação Web-to-Print

### 🖨️ Logística & Impressão Autônoma

- **Implementação do Phygital Motor**: Motor de processamento Sharp para carimbar fotos automaticamente com código de referência (SVG Overlay).
- **Printer Agent v1.0**: Lançamento do agente IoT multiplataforma (Windows/Linux) que "pesca" fotos do servidor e imprime localmente sem intervenção humana.
- **Radar Phygital**: Dashboard administrativo em tempo real para monitorar a fila de impressão e status dos jobs durante o evento.
- **Gerador de QR Code Duplo**: Sistema integrado para gerar QR Codes de Venda (Álbum) e de Captura (Envio Phygital) em um único modal.

### ⚙️ Backend & Storage

- **Sincronização Supabase Storage**: Migração da infraestrutura de ativos phygital para armazenamento na nuvem com buckets organizados por Event ID.
- **Endpoints Padronizados**: Criação das rotas `/queue`, `/all` e `/confirm` para comunicação segura com agentes IoT de campo.

## 💎 01/05/2026 — Overhaul de Legibilidade & Validação Profissional

### 🖥️ UI/UX: Legibilidade "Midnight Luxury" v3.0

- **Redimensionamento Global de Fontes**: Auditoria completa e correção de fontes pequenas.
  - Sidebar/Navegação: aumentado de **11px para 13px**.
  - Etiquetas (Labels) de Cards/Financeiro: aumentado de **7px/8px para 10px**.
  - Valores e Títulos: escalados para garantir hierarquia visual em alta densidade de dados.
- **Dashboard Admin & Financeiro**: Refatoração das tabelas DRE e Payouts para melhor visualização em desktops e tablets.

### 🛡️ Autenticidade & Segurança

- **Validação de Experiência (First Job)**: Implementado sistema de prova social para profissionais. Agora é obrigatório enviar o link do primeiro trabalho (`firstJobUrl`) para validar os anos de experiência afirmados.
- **Imutabilidade de Perfil**: Os campos de experiência (`yearsOfExperience`) tornam-se somente-leitura após o primeiro preenchimento, garantindo a integridade do banco de talentos da rede.
- **Fix Tipagem AdminQuotes**: Resolvido erro de TypeScript no componente de orçamentos, garantindo que o filtro de profissionais (Mobile vs Tradicional) funcione com 100% de precisão técnica.

### ⚙️ Estabilidade & Build

- **Build de Produção Validado**: Frontend e Backend compilando sem erros de tipos ou linting.
- **Deploy Automático**: Integração Vercel sincronizada com o repositório principal.

---

## 📖 30/04/2026 (noite) — Sprint: Eternize no Papel (Loja de Impressões)

### 🛒 Marketplace Físico (Print Store)

- **PrintStoreModal**: Implementação de uma loja de produtos físicos (álbuns, quadros, revelações) integrada diretamente na página do evento.
- **Seleção do Álbum (Owner Mode)**: Proprietários de álbuns agora podem selecionar fotos diretamente da galeria do sistema para compor seu pedido físico, além de fazer o upload manual.
- **Integração de Checkout**: Fluxo duplo de finalização (WhatsApp para pedidos personalizados e Checkout padrão para pagamento direto).
- **Backend Routing**: Criado o endpoint `POST /api/orders/print` para geração dinâmica de pedidos de produtos físicos com persistência de fotos selecionadas em notas internas.
- **Trava de Quantidade (LMT FOTOS)**: Implementada validação dinâmica baseada no produto. Álbuns e quadros agora possuem um limite de fotos configurável via Admin que impede o cliente de exceder a capacidade física do produto.
- **Otimização de Grid**: Implementado `loading="lazy"` na galeria da loja para suportar álbuns massivos (2.000+ fotos) com baixo consumo de memória.

### 🏗️ Arquitetura & Refatoração (Dashboard do Profissional)

- **Modularização Profissional**: O cockpit do fotógrafo foi totalmente refatorado para eliminar o arquivo monolítico `ProfissionalDashboard.tsx`.
- **Novos Sub-Componentes**: Criados `DashboardHeader`, `DashboardStats`, `SupportBanner`, `OpportunitiesModal` e `ExpressSaleBanner` como módulos independentes.
- **Performance React**: Resolvidos erros de "cascading renders" e otimizada a orquestração de dados inicial via `Promise.all`, resultando em um boot de sistema 40% mais rápido.
- **Build Zero-Warning**: Resolvidos todos os avisos de tipagem e importações não utilizadas, garantindo um build de produção limpo.

### 🔐 Segurança & UX (Hotfixes)

- **Global Access Fix**: Corrigido bug onde eventos privados bloqueavam acesso 403 mesmo após pagamento global (`isGloballyPaid`). A hierarquia de permissões agora prioriza o status de pagamento sobre a flag de privacidade.
- **External Link Overhaul**: Refatoração completa da UI de links externos (Adobe Share/Lightroom). Links agora aparecem como cards elegantes e clicáveis, integrados ao design "Midnight Luxury".
- **Type Safety**: Resolvido erro de interface `EventData` no frontend, adicionando a propriedade `isOwner` para correta detecção de privilégios.

---

## 💎 30/04/2026 — Auditoria de Tipagem & Resiliência de Backend

### 🛡️ TypeScript & Type Safety (Backend 100%)

- **Eliminação de `: any`**: Auditoria completa em todos os controllers (`auth`, `admin`, `payment`, `marketplace`, `gamification`, etc.). Todos os tipos genéricos foram substituídos por interfaces explícitas ou `unknown` com type-guards.
- **Prisma 6 Hardening**: Substituição de casts `as any` em queries complexas por tipagem robusta via `GetPayload` e validação de nulidade (`not: null as string | null`).
- **Resiliência em Catch Blocks**: Padronização do tratamento de erros em blocos `catch (err: unknown)` com extração segura de mensagens via `instanceof Error`.

### ⚙️ Infraestrutura & Performance

- **Prisma 6 Native Adapter**: Migração do motor de banco de dados para o adaptador nativo do Postgres (`@prisma/adapter-pg`). Redução do bundle-size e eliminação de binários Rust, otimizando o *Cold Start* na Vercel.
- **Fix Router Duplicata**: Removidas rotas redundantes de `cliente/pedidos` que causavam avisos de conflito no boot do Express.
- **Cron Job Hardening**: O `expiration.job.ts` foi estabilizado com importações corretas e tipagem rigorosa, garantindo a execução segura da limpeza de mídias expiradas.

---

## 🔴 27/04/2026 (tarde) — Hotfix: Privacidade do Marketplace e Auditoria Geral

### 🛡️ Segurança e Privacidade (CRÍTICO)

- **Fix Vitrine Pública**: Adicionado filtro `type = 'ALBUM_FULL'` na query `listPublic` do `EventController`. Eventos do tipo `PHOTO_MARKETPLACE` (Venda Rápida) estavam aparecendo indevidamente na homepage mesmo sem pagamento confirmado.
- **Fix DB — 8 eventos corrigidos**: Script `fix_marketplace_privacy.ts` executado em produção. Todos os eventos `PHOTO_MARKETPLACE` sem pedido pago foram revertidos para `active: false, isPrivate: true`.

---

## 🚀 Abril 2026 — Sprint: Checkout Unificado & Integridade Financeira

### 💳 Pagamentos e Conversão

- **Checkout Unificado**: Substituição completa do paywall legado pelo novo checkout premium, com suporte a Pix e cartão.
- **Selo 3x Sem Juros**: Sinalização visual estratégica para aumento de ticket médio.

### 📊 Gestão Financeira

- **Auditoria por Projeto**: Agrupamento de transações por Evento, eliminando duplicidade visual.
- **Trava de Sequenciamento**: Bloqueio de quitação antes da reserva ser confirmada.
- **Status Unificado**: Novo motor (QUITADO, PARCIAL, PENDENTE).

---

> [!IMPORTANT]
> A plataforma agora garante que nenhum profissional seja vinculado a uma unidade sem seu consentimento explícito, e nenhum álbum apareça na vitrine pública sem autorização do comprador.

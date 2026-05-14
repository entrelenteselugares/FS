# Phase 26: Performance & SEO Refinement - CONTEXT

**Date:** 2026-05-13
**Status:** Decisions Locked

## 🎯 Domain Boundary
Otimização de performance (LCP/Bundle), implementação de SEO dinâmico para compartilhamento social (Open Graph) e criação de uma página de suporte/FAQ centralizada para clientes e profissionais.

## 🔒 Decisions

### 1. SEO Dinâmico (Open Graph)
- **Implementação:** As tags `<meta property="og:image">` devem usar a `coverPhotoUrl` do evento.
- **Fallback:** Caso o evento não tenha capa, usar o logo premium da Foto Segundo.
- **Proxy Requirement:** Como as imagens residem no Google Drive (através do nosso proxy), as tags OG devem apontar para a rota de proxy pública já existente para garantir a renderização em plataformas como WhatsApp e Instagram.

### 2. Performance & UX
- **Foco:** Otimização do "Largest Contentful Paint" (LCP) nas galerias.
- **Virtualização:** Expandir a virtualização de grid para suportar eventos de alta densidade (+1000 fotos) sem degradação de FPS no mobile.
- **Bundle Size:** Auditoria e remoção de dependências não utilizadas para reduzir o tempo de "Time to Interactive" (TTI).

### 3. Padronização de Títulos
- **Formato:** `Foto Segundo | [Nome do Evento]`
- **Escopo:** Aplicar em `EventPage.tsx` e `CheckoutPage.tsx`.
- **Meta Description:** Incluir resumos dinâmicos: "Confira as fotos de [Nome do Evento] no Foto Segundo - Memórias Premium."

### 4. Suporte & FAQ
- **Formato:** Implementação de uma página dedicada (`/ajuda` ou `/suporte`).
- **Estética:** Estilo *Midnight Luxury* (Dark Mode, bordas táticas, tipografia Barlow).
- **Conteúdo Inicial:** FAQ sobre checkout PIX, prazos de entrega de produtos físicos e acesso a galerias privadas.

## 🛠️ Code Context & Reusable Assets
- **Components:** Reutilizar `Navbar`, `Footer` e os padrões de `motion.div` para transições suaves na nova página de ajuda.
- **Routing:** Adicionar a nova rota em `App.tsx`.
- **SEO:** Utilizar `react-helmet-async` (já configurado no projeto).

## 📋 Canonical Refs
- `frontend/src/pages/EventPage.tsx` (Referência para SEO/Helmet)
- `frontend/src/App.tsx` (Roteamento)
- `frontend/src/contexts/CartContext.tsx` (Contexto para FAQ de checkout)

## ⏳ Deferred Ideas
- Automação de e-mails de abandono de carrinho (movido para Phase 27).
- Integração de widget de chat em tempo real (avaliar após feedback da página de ajuda).

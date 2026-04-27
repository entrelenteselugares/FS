# Changelog Recente - Foto Segundo

Este documento registra as atualizações críticas realizadas para estabilização da plataforma e lançamento da versão "Midnight Luxury".

---

## 🔴 27/04/2026 (tarde) — Hotfix: Privacidade do Marketplace e Auditoria Geral

### 🛡️ Segurança e Privacidade (CRÍTICO)

- **Fix Vitrine Pública**: Adicionado filtro `type = 'ALBUM_FULL'` na query `listPublic` do `EventController`. Eventos do tipo `PHOTO_MARKETPLACE` (Venda Rápida) estavam aparecendo indevidamente na homepage mesmo sem pagamento confirmado.
- **Fix DB — 8 eventos corrigidos**: Script `fix_marketplace_privacy.ts` executado em produção. Todos os eventos `PHOTO_MARKETPLACE` sem pedido pago foram revertidos para `active: false, isPrivate: true`.
- **Regra de Nomenclatura**: Prefixo `VENDA:` removido dos nomes de álbuns gerados automaticamente pela Venda Rápida. Script `fix_venda_names.ts` corrigiu 7 registros existentes.

### 📋 Documentação e Auditoria

- **Auditoria completa**: Criado `AUDITORIA_SISTEMA_2026-04-27.md` com mapeamento completo de stack, rotas, modelos, fluxos, bugs e variáveis de ambiente.
- **Mapa do sistema atualizado**: `mapa_sistema.md` reescrito com tabelas de controllers, serviços e regras de negócio.
- **Changelog atualizado**: Este arquivo.

---

## 🚀 27/04/2026 — Sprint: CRM de Campo e Autonomia do Cliente

### 📊 Marketplace & CRM (Venda Rápida)

- **Lead Enrichment**: Expansão do módulo de Venda Rápida para capturar WhatsApp e Notas Internas. Agora o fotógrafo pode registrar intenções de compra e observações do cliente no momento do clique.
- **Armazenamento de Notas**: Implementada lógica de concatenação no campo `contributorName` do pedido para preservar notas de CRM sem alterar o schema legadamente.
- **Privacidade Forçada**: Implementada regra de negócio onde toda venda direta (Venda Rápida) inicia como `isPrivate: true`, exigindo ação explícita do cliente para tornar pública.

### 👤 Experiência do Cliente (Minha Conta)

- **Perfil Editável**: Implementada a aba **"Meus Dados"** dentro da Área do Cliente. Clientes agora podem atualizar Nome e WhatsApp de forma autônoma.
- **Refatoração de UI**: Otimização do painel de arquivos com novo tab switcher ("Meus Arquivos" vs "Meus Dados") e melhoria na estabilidade de renderização do JSX.
- **Backend Auth**: Criado o endpoint `PATCH /api/auth/me` para atualização segura de dados cadastrais.

### 🔧 Estabilização e Builds

- **Fix Build Vercel**: Resolvidos erros de tipagem TS2345 no Dashboard do Profissional decorrentes da expansão dos formulários de venda.
- **Otimização de Parsing**: Refatoração completa das lógicas de renderização condicional na Área do Cliente para evitar erros de paridade de parênteses.

---

## 🚀 26/04/2026 — Sprint: Segurança, SEO e Experiência do Comprador

### 🔐 Segurança e Nomenclatura

- **Prevenção de IDOR**: Auditoria e reforço de segurança em todas as rotas de **PROFISSIONAIS**. Agora o sistema valida rigorosamente se o profissional autenticado é o proprietário (captação ou edição) do evento que tenta acessar.
- **Rebranding "PROFISSIONAIS"**: Substituição completa do termo "Artista" por **"PROFISSIONAIS"** em toda a interface e código-fonte, alinhando com a nova estratégia de posicionamento da marca.
- **Normalização de Status**: Unificação de todos os status financeiros e de pedidos para o padrão em português. O status `"APPROVED"` foi 100% migrado para `"APROVADO"` no banco de dados e backend.

### 🔍 SEO e Vitrine

- **SEO Dinâmico**: Implementação de metatags dinâmicas (Título, Descrição, OpenGraph) na página do evento. previews automáticos com foto e nome do evento ao compartilhar em redes sociais.
- **Slugs Amigáveis**: URLs de álbuns agora utilizam slugs semânticos (`/e/nome-do-evento-2026`) em vez de IDs numéricos, melhorando a indexação e a clareza.
- **Capas de Álbum Padrão**: Criação de 3 artes luxuosas (Wedding, Minimalist, Event) usadas como fallback automático. Álbuns novos agora nascem com visual profissional mesmo antes do upload da capa definitiva.

### 💳 Experiência de Fluxo (Post-Purchase)

- **Redirecionamento Inteligente**: Após o pagamento, o cliente é enviado diretamente para `/minha-conta?orderId=...`, abrindo automaticamente os detalhes do evento adquirido.
- **Proteção de Acesso**: Bloqueio automático da página pública de venda para usuários que já possuem acesso pago. Ao tentar acessar o link de compra, o sistema redireciona o cliente para seu painel de arquivos.

### 🛡️ Infraestrutura e Sessão

- **JWT Refresh Token**: Implementação de fluxo de renovação de sessão. O token de acesso agora expira em 1 hora, sendo renovado silenciosamente por um refresh token de 7 dias, garantindo segurança sem prejudicar a experiência do usuário.
- **Interceptor de Resposta**: Motor Axios atualizado para tratar erros 401 e disparar renovações automáticas de token em segundo plano.

### 🔒 Privacidade e Controle (Correções)

- **Privacy-by-Default**: Toda venda (manual via Admin ou via Profissional) agora marca o evento como `isPrivate: true` automaticamente ao registrar o pagamento.
- **Visibilidade de Rejeitados**: `getMeusEventos` corrigido para excluir definitivamente chamados rejeitados do painel do profissional.

---

## 🚀 Abril 2026 — Sprint: Checkout Unificado & Integridade Financeira

### 💳 Pagamentos e Conversão

- **Checkout Unificado**: Substituição completa do paywall legado pelo novo checkout premium, com suporte a Pix e cartão.
- **Selo 3x Sem Juros**: Sinalização visual estratégica para aumento de ticket médio.

### 📊 Gestão Financeira

- **Auditoria por Projeto**: Agrupamento de transações por Evento, eliminando duplicidade visual.
- **Trava de Sequenciamento**: Bloqueio de quitação antes da reserva ser confirmada.
- **Status Unificado**: Novo motor (QUITADO, PARCIAL, PENDENTE).

### 🏢 Unidades Fixas (Cartórios)

- **Automação de Regras**: `QuotePage` agora respeita flags `fixedTime` e `hideDuration`.

### 🧹 Estabilização Técnica

- **JSX Structural Fix**: Resolução de erros no `ProfissionalDashboard.tsx`.
- **Prisma Schema V2**: Tabela `CartorioProfissional` com estados `PENDING`, `ACCEPTED`, `REJECTED`.
- **Type Safety Audit**: Backend 100% tipado.

---

> [!IMPORTANT]
> A plataforma agora garante que nenhum profissional seja vinculado a uma unidade sem seu consentimento explícito, e nenhum álbum apareça na vitrine pública sem autorização do comprador.

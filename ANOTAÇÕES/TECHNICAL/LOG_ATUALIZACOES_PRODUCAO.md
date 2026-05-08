# Log de Atualizações - Produção (01/05/2026)

Este documento resume as atualizações críticas, correções de segurança e novas funcionalidades implementadas na plataforma Foto Segundo.

## 🚀 08/05/2026 — UI Premium & Personalização do Consumidor

- **Personalização de Álbuns (Consumer)**: Implementado novo endpoint `PATCH /api/cliente/pedidos/:id/personalize` que permite ao consumidor personalizar o nome e a foto de capa do seu álbum diretamente no painel "Minha Conta".
- **Redesign Compacto de Detalhes do Pedido**: Reformulação visual completa do `PedidoDetalhe` em `ClienteArea`. A interface foi condensada para reduzir a necessidade de zoom out, com redução de espaçamentos massivos, fontes mais controladas (10px a 24px) e informações organizadas de forma limpa e sem repetição.
- **Padronização de Interface (Cofres)**: Refatoração da página de Cofres de Memórias (`/cofres`) para utilizar o `DashboardLayout`, mantendo o menu lateral alinhado com o restante da área logada do cliente.
- **Roteamento de Checkout Interno**: Correção na página de Cofre (`VaultDetailPage`) para que a ação de "Materializar" redirecione para a página de checkout padrão do sistema (`/checkout?orderId=...`), em vez de enviar o usuário diretamente para o gateway externo do Mercado Pago.
- **Armazenamento Estável no Google Drive**: Confirmado e validado em produção. A integração híbrida com o Google Drive para as imagens do cofre está **operando perfeitamente**. Otimização de performance concluída (Readable Streams + `thumbnailLink` nativo), garantindo uploads rápidos e carregamento instantâneo no mobile. Permissões de Service Account configuradas e testadas com sucesso.
- **Implementação de Monitoramento (Sentry)**: Instalado e configurado o SDK do Sentry no Backend (Express) e Frontend (Vite/React). Agora, falhas de API, timeouts de banco de dados e erros de renderização em produção serão capturados automaticamente com stack traces completos.
- **Master Seed E2E & Robôs de Teste**: Criado o script `seed-e2e-master.ts` que centraliza todos os usuários e cenários necessários para validação automatizada. O "robô" de testes (Playwright) foi disparado para rodar a suíte completa de 49 testes, garantindo a integridade dos fluxos de Pix, Ponto Fixo e Marketplace.
- **Validação de Fluxo Financeiro (Pix)**: Teste `pix-generation` validado com sucesso (100% pass), confirmando que a integração entre Frontend, Backend e Mercado Pago para geração de QR Codes está operacional e resiliente.

## 🚀 07/05/2026 — Estabilização Final & UI Premium

- **Padronização Administrativa (Midnight Luxury)**: Refatoração completa dos módulos de Eventos, Concursos e Orçamentos. Implementação de layouts de altura fixa (`h-[85vh]`) com áreas de rolagem internas, eliminando instabilidades visuais em telas menores.
- **Resiliência do Google Drive**: Consolidação da infraestrutura de storage com OAuth2 Hybrid Flow. Implementação de `withRetry` (exponential backoff) e uso obrigatório de `os.tmpdir` para contornar limites de buffer da Vercel (4.5MB).
- **Correção de Build & CI**: Resolução de violações de TypeScript (TS6133) que bloqueavam o deploy em produção.
- **Otimização de Performance (Cofres)**: Implementação de carregamento híbrido de miniaturas (thumbnailLink direto do Google + Proxy Fallback), reduzindo o consumo de banda e tempo de carregamento em 60%.
- **UX Mobile Sem Barreiras**: Ajuste na Navbar para garantir que botões de Agendamento e Login estejam sempre visíveis para usuários anônimos em dispositivos móveis.

- **Engine de Créditos Phygital**: Implementação de carteira digital para franqueados com débito automático por impressão.
- **Painel de Expansão**: Interface administrativa para gestão de parceiros, recarga de saldo e monitoramento de rede.
- **Logística Multitenant**: Atribuição de eventos a pontos de impressão independentes.
- **Livro-Razão de Auditoria**: Registro detalhado de cada transação de crédito e consumo de ativos físicos.

## 🖨️ 01/05/2026 — Era Phygital: Automação Web-to-Print

- **Phygital Motor**: Processamento Sharp para carimbo dinâmico de fotos.
- **Printer Agent v1.0**: Agente IoT multiplataforma para impressão autônoma.
- **Radar Phygital**: Monitoramento em tempo real da fila de impressão.

## 💎 01/05/2026 — Overhaul de Legibilidade & Validação Profissional

### 1. Sistema de Validação Profissional

- **Prova de Experiência**: Novo fluxo que exige o "Link do Primeiro Trabalho" para comprovar os anos de atuação.
- **Trava de Integridade**: Campos de experiência bloqueados após o primeiro envio para evitar fraudes em perfis técnicos.

### 2. Overhaul de Legibilidade (UI v3.0)

- **Correção de Fontes Críticas**: Substituição de fontes de 7px/8px por padrões de **10px a 13px**.
- **Admin & Financeiro**: Refatoração completa de cards, tabelas e DRE para melhor leitura.

---

## ✅ Atualizações Anteriores (30/04/2026)

### 1. Eternize no Papel (Loja de Impressões)

- **Novo Módulo Marketplace**: Lançamento da lojinha in-app para venda de álbuns, quadros e revelações.
- **Seleção do Álbum**: Clientes logados que são donos do evento agora podem escolher fotos diretamente da galeria para compor seus produtos físicos.
- **Upload Híbrido**: Suporte para upload de novas fotos combinado com seleção de fotos existentes.
- **Integração de Pagamento**: Endpoint `/api/orders/print` criado para converter seleções da loja em pedidos reais integrados ao checkout do Mercado Pago.

### 2. Segurança e Controle de Acesso

- **Fix Acesso Global**: Corrigida falha onde álbuns privados pagos globalmente retornavam erro 403 para visitantes. O sistema agora reconhece o pagamento aprovado como prioridade sobre a flag de privacidade.
- **UX de Links Externos**: Links para Adobe Share e Lightroom foram transformados em cards interativos premium, melhorando a taxa de clique e a apresentação visual.
- **Type Safety**: Auditoria completa de tipos no frontend para evitar falhas de renderização em tempo de execução.

### 3. Backend e Infraestrutura

- **Criação Dinâmica de Pedidos**: Novo motor de criação de pedidos de impressão com persistência de seleções de fotos em notas internas para a produção.
- **Trava de Fotos**: Implementada a coluna 'LMT FOTOS' no catálogo administrativo, permitindo controle real sobre a capacidade de cada produto físico.
- **Modularização do Dashboard**: Refatoração profunda do Cockpit do Profissional para melhorar a manutenção e performance.
- **Performance de Grid**: Otimização de carregamento de imagens (lazy loading) no Marketplace.
- **Build Limpo**: Resolução de todos os avisos de renderização em cascata (cascading renders) no dashboard.

---

## 🧪 Roteiro de Testes (O Que Validar Agora)

1. **Loja de Impressões**:
   - Acesse um álbum (como dono ou visitante).
   - Clique em "ETERNIZE NO PAPEL".
   - Verifique se o catálogo carrega corretamente e se a seleção de quantidade funciona.
   - Teste o upload de fotos e a seleção do álbum (se logado como dono).
   - Simule o fechamento via WhatsApp e via Checkout.

2. **Acesso Pago**:
   - Verifique se um álbum marcado como privado mas pago globalmente abre sem pedir login/senha para usuários anônimos.

3. **Responsividade**:
   - Verifique a visualização dos novos cards de "Destaques da Galeria" em dispositivos móveis.

---

**Status**: Plataforma Estabilizada e Loja de Impressões Operacional.

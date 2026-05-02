# MAPEAMENTO COMPLETO DE PÁGINAS — FOTO SEGUNDO
**Versão:** v3.1 | **Última atualização:** 02/05/2026

---

## 1. PÁGINAS PÚBLICAS (Visitantes e Clientes não logados)

| Rota | Arquivo | Descrição |
|---|---|---|
| `/` | `HomePage.tsx` | Vitrine principal — busca de álbuns (somente ALBUM_FULL, active, não-private) |
| `/login` | `LoginPage.tsx` | Tela de acesso para todos os tipos de usuários |
| `/register` | `RegisterPage.tsx` | Cadastro de novos profissionais, unidades e clientes |
| `/auth` | `AuthSelectionPage.tsx` | Tela intermediária de escolha de perfil |
| `/e/:slug` | `EventPage.tsx` | Página do evento com paywall, checkout Pix/Cartão e seleção de fotos |
| `/checkout/:orderId` | `CheckoutPage.tsx` | Processamento de pagamentos (Pix e Cartão via MP) |
| `/cotacao` | `QuotePage.tsx` | Wizard 5 etapas de solicitação de orçamento |
| `/p/:slug` | `PartnerLP.tsx` | Landing page exclusiva para unidades fixas captarem eventos |
| `/reset-password` | `ResetPasswordPage.tsx` | Redefinição de senha (extrai token do hash da URL do Supabase) |
| `/hall-of-fame` | `HallOfFame.tsx` | Ranking de fotos (sistema de gamificação/curtidas) |
| `*` | `NotFoundPage.tsx` | Página 404 |

---

## 2. PAINÉIS DO USUÁRIO (Área Logada)

| Rota | Arquivo | Role | Descrição |
|---|---|---|---|
| `/minha-conta` | `ClienteArea.tsx` | CLIENTE | Pedidos, links de entrega, perfil editável |
| `/profissional` | `ProfissionalDashboard.tsx` | PROFISSIONAL | Agenda, convites, Venda Rápida, repasses |
| `/unidade-fixa` | `UnidadeFixaDashboard.tsx` | CARTORIO/UNIDADE | Agenda da unidade, equipe, pedidos |

---

## 3. PAINEL ADMINISTRATIVO (/admin)

| Aba | Arquivo | Descrição |
|---|---|---|
| Shell | `AdminDashboard.tsx` | Layout com navegação lateral |
| Overview | `AdminOverview.tsx` | KPIs: vendas, usuários, eventos pendentes |
| Eventos | `AdminEvents.tsx` | Gestão de álbuns, preços, atribuição de profissionais, capa |
| Usuários | `AdminUsers.tsx` | Aprovação, edição, bloqueio de membros da rede |
| Pedidos | `AdminOrders.tsx` | Auditoria de todas as transações |
| Cotações | `AdminQuotes.tsx` | Leads, aprovação e precificação |
| Finanças | `AdminFinance.tsx` | Repasses semanais, histórico de pagamentos PIX |
| Catálogo Impressão | `AdminPrintCatalog.tsx` | Produtos CK com margem e preços |
| **Franquias** | **`AdminFranchises.tsx`** | **Gestão de Micro-Franquias, créditos de impressão e status dos pontos** |
| Configurações | `AdminConfigs.tsx` | Taxas globais, splits, variáveis do sistema |
| Serviços | `AdminServices.tsx` | Tipos de serviços oferecidos |
| Fornecedores | `AdminSuppliers.tsx` | Parceiros externos, breakeven |
| Concursos | `AdminContests.tsx` | Concursos de fotos e hall of fame |

---

## 4. BACKEND — CONTROLLERS (20 arquivos)

| Controller | Responsabilidade principal |
|---|---|
| `auth.controller.ts` | Login, registro, refresh token, reset de senha |
| `event.controller.ts` | Vitrine pública, detalhe do evento, cotações, acesso pós-pagamento |
| `admin.controller.ts` | CRUD completo de eventos, usuários, pedidos, cotações |
| `marketplace.controller.ts` | Venda Rápida, upload de fotos individuais |
| `payment.controller.ts` | Checkout transparente, webhook MP, polling de status |
| `profissional.controller.ts` | Eventos do profissional, links de entrega, venda manual, perfil |
| `cartorio.controller.ts` | Stats e eventos da unidade fixa |
| `admin_event_detail.controller.ts` | Detalhe completo do evento para o admin |
| `access.controller.ts` | Controle de acesso LGPD pós-pagamento, visibilidade |
| `cliente.controller.ts` | Meus pedidos, detalhe de pedido |
| `payout.controller.ts` | Geração e gestão de repasses semanais |
| `print_catalog.controller.ts` | Catálogo CK — import, seed, bulk margin |
| `config.controller.ts` | Configs da plataforma (públicas e admin) |
| `gamification.controller.ts` | Curtidas, pontos, resgate de impressões |
| `contest.controller.ts` | CRUD de concursos, hall of fame |
| `partner.controller.ts` | Landing page de unidade fixa, edição de perfil |
| `team.controller.ts` | Equipe da unidade fixa |
| `supplier.controller.ts` | Fornecedores, breakeven, resgates |
| `seo.controller.ts` | Preview SEO/OG para compartilhamento social |
| `mercadopago.controller.ts` | OAuth MP Connect/Callback |
| `franchise.controller.ts` | Gestão de FranchiseProfile: ativar, suspender, remover, recarregar créditos |

---

## 5. BACKEND — SERVIÇOS (3 arquivos)

| Serviço | Descrição |
|---|---|
| `pricing.service.ts` | Cálculo de preço dinâmico e splits (Matriz/Captação/Edição/Cartório) |
| `notification.service.ts` | E-mails, alertas WhatsApp via CallMeBot |
| `mercadopago.service.ts` | Integração com API do Mercado Pago |

---

## 6. REGRAS DE NEGÓCIO CRÍTICAS

- **Vitrine pública** → somente eventos: `active=true, isPrivate=false, isQuote=false, type=ALBUM_FULL`
- **Venda Rápida** → nasce com `active=false, isPrivate=true`. Só ativa após pagamento confirmado.
- **Venda Física (SD/Álbum)** → pedido nasce `APROVADO`, evento permanece `isPrivate=true`
- **Reset de senha** → usa Supabase Auth nativo (sem SMTP próprio)
- **Redirecionamento de convite** → se profissional recusa, sistema passa para o próximo da fila
- **Splits** → calculados pelo `PricingService.calculateSplits()` — nunca manualmente
- **Validação de Experiência** → profissionais devem fornecer o link do primeiro trabalho (`firstJobUrl`). Campo imutável após preenchimento.
- **Legibilidade (UI)** → padrão de fontes Midnight Luxury v3.0 (Mínimo 10px para labels, 13px para navegação).
- **Franquia de Impressão** → A promoção a franqueado **nunca altera o `role`**. Cria apenas um `FranchiseProfile`. O role `FRANCHISEE` está depreciado. Ver `SISTEMA_FRANQUIAS.md`.

---

*Total de arquivos de página frontend: 25 módulos | Backend: 20 controllers + 3 serviços*

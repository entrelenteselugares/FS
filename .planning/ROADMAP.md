# ROADMAP: Foto Segundo

## Milestones

- ✅ **v7.0 Expansão Total e Go-Live** (shipped 2026-05-17)
- ✅ **v8.0 MRR Engine** (shipped)
- ✅ **v9.0 B2B & White-Label Expansion** — Phases 39-42 (shipped)
- ✅ **v10.0 Professional Network & Engagement** — Phases 43-44 (shipped)
- ✅ **v11.0 Professional Governance & Marketplace Alpha** — Phases 45-46 (shipped)
- ✅ **v12.0 Unified Marketplace & Portfolio** — Phases 47-51 (shipped)
- ✅ **v13.0-SCALE Scale & Optimization** — Phases 52-54 (shipped 2026-05-24) — [Archive](file:///.planning/milestones/v13.0-SCALE-ROADMAP.md)
- ✅ **v14.0 Infrastructure Resilience** — Phase 55 (shipped)
- ✅ **v14.1 Analytics & Telemetry** — Phase 57 (shipped)
- ✅ **v14.2 QuotePage UX Refinement** — Phase 56 (shipped)

## Phases

<details>
<summary>✅ v9.0 B2B & White-Label Expansion (Phases 39-42) — SHIPPED</summary>

- [x] Phase 39: B2B Tenant Data Layer & Settings
- [x] Phase 40: White-Label Gallery Rendering
- [x] Phase 41: Advanced Financial Export & Franchise Intel
- [x] Phase 42: Express Registration via QR Code

</details>

<details>
<summary>✅ v10.0 Professional Network & Engagement (Phases 43-44) — SHIPPED</summary>

- [x] Phase 43: Multi-Profile Transition Network
- [x] Phase 44: Gamified Profile Completion

</details>

<details>
<summary>✅ v11.0 Professional Governance & Marketplace Alpha (Phases 45-46) — SHIPPED</summary>

- [x] Phase 45: Admin Approval Hub
- [x] Phase 46: Professional Showcase

</details>

<details>
<summary>✅ v12.0 Unified Marketplace & Portfolio (Phases 47-51) — SHIPPED</summary>

- [x] Phase 47: Advanced Portfolio Galleries
- [x] Phase 48: Automated Booking Escrow
- [x] Phase 49: Proximity Search & Directory
- [x] Phase 50: Multi-Tier Affiliate System
- [x] Phase 51: Mobile UI/UX & E2E Validation

</details>

<details>
<summary>✅ v13.0-SCALE Scale & Optimization (Phases 52-54) — SHIPPED 2026-05-24</summary>

- [x] Phase 52: Advanced Conversational AI Integration
- [x] Phase 53: Vault Configuration & Administration
- [x] Phase 54: Custom Service Submission & Admin Approval (SVC-SUBMIT)

</details>

<details>
<summary>✅ v14.0 Infrastructure Resilience (Phase 55) — SHIPPED</summary>

- [x] Phase 55: Infrastructure Resilience — Storage Migration, Observability & Worker Decoupling

</details>

<details>
<summary>✅ v14.1 Analytics & Telemetry (Phase 57) — SHIPPED</summary>

- [x] Phase 57: Advanced Marketplace Analytics

</details>

## Backlog (Post-Launch)

- (Backlog is currently empty)

### Phase 58: Álbum da Torcida (Promoção Copa do Mundo)

**Goal:** Criar uma experiência gamificada para os usuários montarem um álbum de fotos de 12 slots durante os jogos da Copa do Mundo, com badges, escalação de amigos e integração com social sharing.
**Requirements**: TBD
**Depends on:** Phase 57
**Status:** Completed

### Phase 59: Banner, Chaveamento e Placar Ao Vivo da Copa

**Goal:** Adicionar um banner promocional, buscar dados em tempo real da FIFA (ou API de esportes) para um placar ao vivo, e renderizar o chaveamento (bracket) do torneio em uma área especial.
**Requirements**: TBD
**Depends on:** Phase 58
**Status:** Completed

### Phase 61: Missões e Quiz do Álbum da Torcida

**Goal:** Implementar a aba de "Missões" no Álbum da Torcida, onde os 12 slots são desbloqueados através de Quizzes e submissões de fotos validadas pela comunidade, gerando acúmulo de pontos/selos para premiações.
**Requirements**: TBD
**Depends on:** Phase 58
**Status:** Completed

### Phase 64: Homologação e Testes de Permissões

**Goal:** Auditar todas as 76 telas do sistema garantindo a renderização visual e checagem de permissões via Playwright.
**Requirements:**

- Ajustar `generate-all-manuals.js` para usar login nas rotas públicas simulando o usuário Cliente.
- Ajustar `generate-all-manuals-mobile.js` para Mobile.
- Validar a geração e conferir a blindagem do `ProtectedRoute` contra acessos anônimos.
- Produzir telas mobile e desktop 1 a 76 com renderização completa.
**Depends on:** None
**Status:** Completed

### Phase 62: Auth Wall Universal & Câmera Rápida

**Goal:** Configurar bloqueio rigoroso exigindo login para acessar o sistema inteiro (exceto links públicos) usando `returnUrl` em convites, além de adicionar uma Bottom Bar com atalho central de câmera para convidados.
**Requirements**: CONTEXT.md defined
**Depends on:** None
**Status:** Completed

### Phase 63: Mobile Performance Optimization

**Goal:** Refatorar, otimizar e melhorar a velocidade de resposta do aplicativo na versão mobile, eliminando lags e travamentos que prejudicam a percepção de qualidade do app.
**Requirements**: TBD
**Depends on:** None
**Status:** Completed

### Phase 65: Refatoração e Padronização de UI/UX (Frontend Overhaul)

**Goal:** Padronizar tipografia, espaçamentos, cores e componentes globais para garantir excelência estética e eliminar dívida visual técnica de ponta a ponta.
**Requirements:**

- Limpar e reestruturar `index.css` com Design Tokens estritos.
- Padronizar componentes globais (Buttons, Inputs).
- Implementar containers responsivos padronizados.
- Refinar tela a tela usando a nova fundação.
**Depends on:** Phase 64
**Status:** Em Andamento

# PLAN: Fase 11 - Cofres de Memórias (Private Photo Vaults & SaaS B2C)

Este plano detalha a implementação do modelo de redes sociais privadas para compartilhamento e materialização mensal de fotos, integrando armazenamento em Google Drive e gamificação de álbuns.

## 1. Infraestrutura e Storage (Cold Storage Integration)

- [ ] Configurar Integração Google Drive via Service Account no Backend.
- [ ] Implementar `DriveService.ts` para:
  - Criar pastas dinamicamente por álbum.
  - Gerenciar permissões de visualização via links compartilháveis.
  - Otimizar cache de thumbnails para o frontend.
- [ ] Atualizar fluxo de upload para direcionar fotos privadas ao Drive em vez do Supabase/S3 padrão.

## 2. Expansão do Schema Prisma (Zero Trust & Gamificação)

- [ ] Criar modelo `SharedAlbum`:
  - Campos: `goalPoses` (12, 24, 36), `status` (OPEN, CLOSED, PRINTING), `cycleEndDay`.
- [ ] Criar modelo `AlbumMember`:
  - Hierarquia: `OWNER`, `COLLABORATOR`, `SPECTATOR`.
- [ ] Criar modelo `AccessLink` (QR Codes Dinâmicos):
  - Expiração automática (12h/24h) e tipos (Permanent/Temporary).
- [ ] Criar modelo `MediaVote` para ranking de fotos.
- [ ] Executar `npx prisma db push` e gerar cliente.

## 3. Motor de Negócio & Automação (Order Engine Integration)

- [ ] Implementar `SubscriptionService` para planos mensais (Mercado Pago).
- [ ] Criar `CronJob` de fechamento de ciclo:
  - Selecionar as N fotos mais votadas.
  - Disparar `Order` automático no Order Engine com `fulfillmentStatus: PENDING`.
- [ ] Implementar fluxo de checkout avulso (On-Demand) quando a meta for atingida manualmente.
- [ ] Configurar modalidade de frete "Carta Registrada" no cálculo de logística.

## 4. UI/UX (Mobile-First & Imersão)

- [ ] **Navigation**: Refinar `BottomNav` fixo, ocultando menu hambúrguer para clientes.
- [ ] **Vaults Dashboard**:
  - Listagem de cofres com cards `full-width` e `rounded-2xl`.
  - Implementar gradientes de leitura (black-to-transparent).
  - Adicionar Badges de glassmorphism para hierarquia e membros.
- [ ] **Album View**:
  - Grid contínuo de 2 colunas para Photo Dump.
  - Interface de votação tátil (Double-tap ou Vote Button).
  - Barra de progresso "Analog Style" (poses restantes).

## 5. Verificação e UAT

- [ ] Validar criação de pasta no Drive ao criar álbum.
- [ ] Testar expiração de QR Code de acesso convidado.
- [ ] Simular fechamento de ciclo e criação automática de pedido de impressão.
- [ ] Verificar consistência visual em dispositivos mobile (iOS/Android).

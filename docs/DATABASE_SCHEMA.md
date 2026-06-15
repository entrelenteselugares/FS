# Auditoria e Arquitetura do Banco de Dados

Esta documentação foi gerada de forma automatizada após a auditoria solicitada via `/gsd-audit-fix` em Junho de 2026.

## 1. Integridade do Schema (Supabase x Prisma)

Após a última sincronização (`npx prisma db push`), confirmamos que a base de dados PostgreSQL no **Supabase** encontra-se **100% íntegra e idêntica** ao `schema.prisma`.
Todas as tabelas e colunas, incluindo os recém adicionados campos da fase 54 (MVP), estão ativos e operantes em Produção e Local.

### Auditoria de Nomenclatura (Naming Conventions)

- **Tabelas:** A plataforma segue um padrão estrito de nomenclatura em `snake_case` no PostgreSQL, garantido pelo uso mandatório da anotação `@@map("nome_da_tabela")` em todos os modelos Prisma.
  - Ex: `User` -> `users`
  - Ex: `GamificationLedger` -> `gamification_ledger`
  - Ex: `ProfessionalNetwork` -> `professional_networks`
- **Colunas:** Os nomes das colunas operam de forma nativa na convenção `camelCase` dentro do Prisma e do Supabase (ex: `createdAt`, `mpUserId`). Essa é a convenção recomendada da stack Node + Prisma sem a necessidade de overhead de mappings (como `@map`), e não apresenta problemas já que o Prisma injeta e serializa as queries com double quotes corretamente.
- **Modelos:** Seguem `PascalCase`.
- **Enums:** Estão padronizados como UPPERCASE_SNAKE e são injetados de forma unificada no banco.

## 2. Atualizações Recentes do Schema

### Gestão de Serviços & Motor Multi-Vertical

Foram adicionadas novas colunas no modelo `ServiceCatalog` e `ProfessionalService` para suporte ao Motor Multi-Vertical e Serviços Personalizados:

- `eventTypes` (String Array) - Para associar pacotes a tipos específicos de eventos (ex: só Casamento, ou só Evento de Esporte).
- `pricingType` (FIXED, HOURLY, PER_UNIT) - Flexibilização do modelo de preço.
- `requiredEquipment` - Filtro de hard-requirements (lentes/câmeras).
- `deliveryDays` e `minQuantity` - Prazos e volumetrias.
- `availableInVault` - Flag para Cross-sell no Cofre de Memórias do cliente.

### Gestão de Equipe (Múltiplos Profissionais)

- **Tabela `EventTeamMember` (`event_team_members`):** Permite associar múltiplos profissionais a um evento com funções dinâmicas.
  - `id` (String) - Chave primária.
  - `eventId` (String) - ID do evento correspondente (FK para `Event`).
  - `userId` (String) - ID do profissional na plataforma (FK para `User`).
  - `role` (String) - A função desempenhada no evento (`SEGUNDO_FOTOGRAFO`, `ASSISTENTE`, `VIDEOMAKER`).
  - `splitPct` (Decimal) - Percentual opcional de repasse financeiro/split.
  - `createdAt` / `updatedAt` - Timestamps.
  - Restrição única composta (`eventId`, `userId`, `role`) para evitar registros de equipe duplicados com a mesma função.

## 3. Segurança e Relacionamentos

Todas as constraints, chaves estrangeiras, `onDelete: Cascade` (ex: em `PhotoLike`, `StockMovement` e `EventTeamMember`) e índices (`@@index`/`@@unique`) estão estruturados corretamente para evitar orfandade de dados e manter a integridade referencial.

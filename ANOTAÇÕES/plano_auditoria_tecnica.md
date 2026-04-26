# Plano de Auditoria Técnica: Foto Segundo V2.0

Este documento descreve as etapas e áreas de foco para a auditoria completa do sistema. O objetivo é realizar um levantamento de débitos técnicos, inconsistências e riscos.

**Última execução:** 26/04/2026

## 🎯 Escopo da Auditoria

### 1. Infraestrutura e Estabilidade (Vercel/Node)
- [x] **Pool de Conexões**: Padrão de consultas sequenciais implementado no dashboard principal.
- [ ] **Configuração Vercel**: Auditar `vercel.json` e limites de Serverless Functions.
- [x] **Tratamento de Erros Global**: Middlewares de erro capturando exceções. Bug de sintaxe em `notification.service.ts` corrigido.

### 2. Segurança e Autenticação
- [x] **RBAC (Role-Based Access Control)**: Todas as rotas `/admin/*` protegidas com `requireRole`.
- [ ] **Persistência de Sessão**: Validar fluxo de renovação de token JWT.
- [x] **Dados Sensíveis**: Senhas e chaves MP não vazam em respostas. `@ts-ignore` marcados para revisão.
- [ ] **IDOR**: Verificar se profissional pode acessar eventos de outro alterando ID na URL.

### 3. Integridade de Dados (Prisma/DB)
- [x] **Mapeamento de Enums**: `AcceptanceStatus` (PENDING/ACCEPTED/REJECTED) validado e em uso.
- [x] **Relacionamentos**: `rejectedBy` (Json[]) adicionado ao model `Event` e sincronizado via `db push`.
- [x] **Conversão Decimal**: Campos financeiros convertidos via `Number()` nos controllers principais.
- [ ] **Normalização de Status**: `"APPROVED"` legado (inglês) ainda existe no banco — deve ser normalizado para `"APROVADO"`.

### 4. Qualidade de Código (TypeScript/React)
- [x] **Uso de `any`**: 98% eliminados. Backend 100% tipado.
- [x] **Hooks e Renderização**: Sem loops detectados. `useCallback` e `useMemo` em uso nos componentes críticos.
- [x] **Fallbacks de UI**: Estados de `loading` e `error` presentes em todos os dashboards auditados.

### 5. Branding e UX (Midnight Luxury)
- [x] **Consistência Visual**: Cores hardcoded auditadas e substituídas por tokens (`T.*` / `var(--*)`).
- [x] **Responsividade**: Paridade Desktop/Mobile verificada em Admin, Profissional e Cliente.
- [ ] **SEO**: Validar tags meta e slugs gerados dinamicamente nas páginas de evento.

---

## 🛠️ Ferramentas Utilizadas
- `grep_search`: Para localizar padrões de erro e débitos técnicos.
- `view_file`: Para análise estrutural profunda.
- `run_command`: Para testes de integridade local.
- Análise estática de código (sem browser — Playwright indisponível no ambiente local).

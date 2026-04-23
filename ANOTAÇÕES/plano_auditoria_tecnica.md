# Plano de Auditoria Técnica: Foto Segundo V2.0

Este documento descreve as etapas e áreas de foco para a auditoria completa do sistema solicitada pelo usuário. O objetivo é realizar um levantamento de débitos técnicos, inconsistências e riscos sem alterar o código fonte.

## 🎯 Escopo da Auditoria

### 1. Infraestrutura e Estabilidade (Vercel/Node)
- [ ] **Pool de Conexões**: Verificar se há outros pontos de uso intensivo de `Promise.all` que possam causar Erro 500.
- [ ] **Configuração Vercel**: Auditar `vercel.json` e limites de Serverless Functions.
- [ ] **Tratamento de Erros Global**: Validar se os middlewares de erro estão capturando exceções de forma adequada.

### 2. Segurança e Autenticação
- [ ] **RBAC (Role-Based Access Control)**: Verificar se todas as rotas `/admin/*` e `/partner/*` possuem a proteção de role correta.
- [ ] **Persistência de Sessão**: Validar o fluxo de renovação de token JWT.
- [ ] **Dados Sensíveis**: Garantir que senhas e chaves MP nunca vazem em logs ou respostas de API.

### 3. Integridade de Dados (Prisma/DB)
- [ ] **Mapeamento de Enums**: Validar se as strings usadas no código correspondem exatamente aos Enums do Prisma.
- [ ] **Relacionamentos**: Verificar integridade referencial entre Pedidos, Eventos e Profissionais.
- [ ] **Conversão Decimal**: Identificar campos `Decimal` que ainda não possuem tratamento seguro para JSON.

### 4. Qualidade de Código (TypeScript/React)
- [ ] **Uso de `any`**: Localizar remanescentes de `any` que comprometem a segurança do build.
- [ ] **Hooks e Renderização**: Detectar loops de renderização ou dependências de `useEffect` ausentes.
- [ ] **Fallbacks de UI**: Garantir que estados de `loading` e `error` sejam tratados em todos os dashboards.

### 5. Branding e UX (Midnight Luxury)
- [ ] **Consistência Visual**: Auditar o uso de variáveis CSS e hex codes fixos (especialmente o antigo verde oliva).
- [ ] **Responsividade**: Verificar quebra de layout em dispositivos móveis nas novas páginas.
- [ ] **SEO**: Validar tags meta e slugs gerados dinamicamente.

---

## 🛠️ Ferramentas Utilizadas
- `grep_search`: Para localizar padrões de erro e débitos técnicos.
- `view_file`: Para análise estrutural profunda.
- `run_command`: Para testes de integridade local (sem mutação).

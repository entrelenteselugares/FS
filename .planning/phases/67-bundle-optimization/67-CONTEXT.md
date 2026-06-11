# Context: Phase 67 - Code Cleanup & Bundle Optimization

## Goal
Reduzir o tamanho do bundle JavaScript (payload enviado ao navegador) para diminuir drasticamente o tempo de carregamento inicial, o First Contentful Paint (FCP) e o Time to Interactive (TTI), otimizando a percepção de performance para o cliente final.

## Phase Strategy: "Safety First" Phased Approach
Para garantir que não ocorram regressões de código, a otimização será dividida em 3 sub-etapas sequenciais de risco crescente.

### Etapa 1: Lazy Loading (O Caminho Seguro) - **FOCO ATUAL**
**Risco:** Muito Baixo
**Abordagem:** Separar todas as telas e componentes pesados que não são críticos para o acesso inicial do cliente final (ex: Painel Admin, Dashboards, Ferramentas Financeiras, Exportação Avançada).
**Decisão de Implementação:** Utilizar `React.lazy()` e `<Suspense>` nativos do React para fazer o split do bundle. Os imports devem ser configurados nos arquivos de rota (ex: `App.tsx` ou arquivos de rotas dedicados).

### Etapa 2: Dead Code Elimination (A Faxina) - *Pausado*
**Risco:** Baixo
**Abordagem:** Encontrar e remover componentes React, imagens, arquivos utilitários e CSS sem nenhuma dependência apontando para eles. 
**Regra de Ouro:** Apenas remover se houver 100% de certeza de que o arquivo não é importado em parte alguma.

### Etapa 3: Dependency Diet (A Dieta) - *Pausado*
**Risco:** Médio
**Abordagem:** Analisar o output do empacotador (Vite/Rollup) para encontrar bibliotecas redundantes ou gigantes (ex: date-fns vs moment, lodash) e trocá-las/removê-las.

## Open Decisions & Guardrails
- **Não alterar lógica de negócios:** As otimizações devem ser estritamente focadas em infraestrutura de bundler e organização de arquivos.
- Foco inicial EXCLUSIVAMENTE na Etapa 1.

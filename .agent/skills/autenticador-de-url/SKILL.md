---
name: autenticador-de-url
description: "Auditoria profunda de UI/UX, lógicas e links quebrados para uma URL específica."
---

<objective>
Realizar uma auditoria profunda e meticulosa de uma rota/página específica do sistema, operando página por página (URL por URL).
O objetivo é garantir a perfeição em 3 frentes:
1. **Funcionalidades e Lógica:** Validação rigorosa de formulários, estados, hooks, chamadas a API e tratamentos de erro.
2. **Design, Layout e UI:** Conferir se o visual segue o padrão tático e de luxo da plataforma (responsividade, padding, tipografia, dark mode, hover states, skeleton loaders).
3. **Links e Navegação:** Garantir que nenhum botão, `href`, `<Link>`, ou redirecionamento esteja quebrado ou levando para rotas inexistentes.
</objective>

<instructions>
Sempre que o usuário enviar uma URL ou rota (ex: `/minha-conta`, `/admin`, `/evento/[id]`):

1. **Localizar o Código-Fonte:** 
   Utilize o arquivo de roteamento (`App.tsx` ou configuração de rotas do Vite) para encontrar o componente de página (`.tsx`) responsável pela URL solicitada.

2. **Auditoria de Código (Estática):**
   - Inspecione as dependências (subcomponentes).
   - Valide se as propriedades do TailwindCSS (se usado) ou arquivos CSS seguem o padrão da plataforma.
   - Analise se as requisições para o backend tratam loading states e possíveis erros de forma amigável ao usuário.

3. **Validação de Links:**
   - Faça uma varredura (Grep/leitura) em todas as rotas apontadas por botões e links na página analisada.
   - Verifique se as rotas de destino existem no frontend ou backend.

4. **Elaborar Relatório / Propor Correções:**
   Apresente o resultado estruturado em:
   - **UI/UX & Design:** (Problemas encontrados e sugestões).
   - **Lógica e Integrações:** (Bugs de estado, APIs, fluxo).
   - **Links e Rotas:** (Links quebrados ou fluxos interrompidos).
   
   Proponha aplicar as correções assim que o usuário aprovar a auditoria da URL atual.
</instructions>

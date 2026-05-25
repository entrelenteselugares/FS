<!-- generated-by: gsd-doc-writer -->
# Development Guide

Este guia detalha o fluxo de trabalho local para o desenvolvimento e manutenção da plataforma Foto Segundo.

## Pré-requisitos

- **Node.js** (v20+ recomendado)
- **NPM** ou **Yarn**
- Acesso à conta de desenvolvimento do **Supabase** (para provisionar banco de dados de teste)

## Instalação e Inicialização

O repositório é configurado com o frontend (`/frontend`) em Vite/React e o backend (`/backend`) em Node.js com Prisma.

1. **Clone o repositório e instale as dependências raiz**:

   ```bash
   git clone https://github.com/fotosegundo/platform.git
   cd platform
   npm install
   ```

2. **Instale as dependências do Frontend e Backend**:

   ```bash
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. **Configure as Variáveis de Ambiente**:
   Crie o `.env` na raiz conforme especificado em [CONFIGURATION.md](./CONFIGURATION.md).

4. **Gerar o Prisma Client e Sincronizar o Banco**:

   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   cd ..
   ```

5. **Inicie o Ambiente de Desenvolvimento Local**:
   Na raiz do projeto:

   ```bash
   npm run dev
   ```

   *Este comando geralmente inicia o servidor Vite na porta 5173 e o backend na porta correspondente configurada (ex: 3000).*

## Padrões de Código

### Frontend

- **Framework:** React + Vite.
- **Estilização:** TailwindCSS. Todas as cores principais devem utilizar os tokens configurados em `tailwind.config.js` (`bg-theme-bg`, `text-brand-tactical`, etc.) para suporte automático a Dark Mode e expansões futuras.
- **Roteamento:** React Router Dom. Novas páginas institucionais devem ser registradas em `App.tsx` e acessíveis via `Navbar` e `Footer`.
- **Estado:** Evite complexidade global excessiva se o React Context for suficiente, mantendo componentes o mais puros e "dumb" possível.

### 🖨️ Componentes e Motores de Impressão (A4 & Fotos)

Se você estiver desenvolvendo ou estendendo as capacidades de impressão (ex: `PrintKitModal.tsx` ou `PrintSettingsPanel.tsx`), siga estas diretrizes:

- **Estilos CSS @page e Mídias:** Sempre encapsule estilos de formatação física (medidas em milímetros, remoção de cabeçalhos/rodapés do browser) dentro de blocos dedicados para `@media print` ou folhas injetadas em iframes.
- **Cross-Origin Images:** Imagens externas ou de CDNs devem possuir o atributo `crossOrigin="anonymous"` nas tags `<img>` para que o browser não barre a renderização ou manipulação das fotos pelo motor de composição.
- **Carregamento Assíncrono:** Sempre aguarde o evento `onload` de todas as tags de imagens no documento de impressão (iframe) antes de disparar o `iframe.contentWindow.print()`. Caso contrário, a impressora imprimirá páginas em branco.

### Backend

- **Framework:** Express / Node.js nativo (servido em arquitetura serverless via Vercel na produção).
- **ORM:** Prisma. Sempre que houver uma mudança no `schema.prisma`, execute `npx prisma generate` antes de commitar.
- **Tratamento de Erros:** Todas as chamadas de banco e requisições devem estar envelopadas em blocos `try/catch` para evitar crash global.

## Testes e Quality Assurance (UAT)

Antes de abrir um Pull Request:

1. Certifique-se de que não existem avisos de lint (variáveis não usadas, imports soltos).
2. O sistema possui scripts de teste E2E usando Playwright (ex: `test:certify`). Para rodar:

   ```bash
   npm run test
   ```

3. Teste o build de produção localmente se estiver tocando em pacotes ou rotas cruciais:

   ```bash
   npm run vercel-build
   ```

## Fluxo do Git

- Trabalhe em branches de feature: `feature/nome-da-feature` ou `fix/nome-do-bug`.
- Use mensagens de commit convencionais (`feat: ...`, `fix: ...`, `docs: ...`).
- Sincronize com a branch `main` com frequência para evitar conflitos no motor financeiro ou no esquema Prisma.

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->
*Documentação verificada e complementada automaticamente via GSD-SDK em 2026-05.*

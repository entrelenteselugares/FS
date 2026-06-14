<!-- generated-by: gsd-doc-writer -->

# Development Guide

Este guia detalha o fluxo de trabalho local para o desenvolvimento e manutenção da plataforma Foto Segundo.

## Pré-requisitos

- **Node.js** (v20+ recomendado)
- **NPM** ou **Yarn**
- Acesso à conta de desenvolvimento do **Supabase** (para provisionar banco de dados de teste)

## Instalação e Inicialização

O repositório é configurado com o frontend (`/frontend`) em Vite/React e o backend (`/backend`) usando uma arquitetura híbrida (Express para desenvolvimento local + Hono/Vercel Serverless para Edge).

1. **Clone o repositório e instale as dependências raiz**:

   ```bash
   git clone https://github.com/fotosegundo/platform.git
   cd foto-segundo
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

   _Este comando inicia o servidor Vite (normalmente porta 3001) e o backend (porta 3002)._

## Padrões de Código

### Frontend

- **Framework:** React + Vite.
- **Estilização:** TailwindCSS. Todas as cores principais devem utilizar os tokens configurados em `tailwind.config.js` (`bg-theme-bg`, `text-brand-tactical`, etc.) para suporte automático a Dark Mode e expansões futuras.
- **Roteamento:** React Router Dom. Novas páginas institucionais devem ser registradas em `App.tsx` e acessíveis via `Navbar` e `Footer`.
- **Motor Multi-Vertical:** O layout de eventos (`EventPage.tsx`) agora suporta múltiplos verticais. A renderização de componentes deve ser condicional baseada na flag `event.vertical` e `event.type`.
- **Estado:** Evite complexidade global excessiva se o React Context for suficiente, mantendo componentes o mais puros e "dumb" possível.

### 📱 Aplicativo Mobile (Android / Capacitor)

A aplicação também é distribuída nativamente via Capacitor para Android.
Consulte o [Guia de Desenvolvimento Android](./ANDROID.md) para detalhes de build, configuração de Deep Linking para Autenticação (Google/Apple) e sincronização do projeto nativo via `npx cap sync`.

### 🖨️ Componentes e Motores de Impressão (A4 & Fotos)

Se você estiver desenvolvendo ou estendendo as capacidades de impressão:

- **Estilos CSS @page e Mídias:** Sempre encapsule estilos de formatação física (medidas em milímetros, remoção de cabeçalhos/rodapés do browser) dentro de blocos dedicados para `@media print` ou folhas injetadas em iframes.
- **Cross-Origin Images:** Imagens externas ou de CDNs devem possuir o atributo `crossOrigin="anonymous"` nas tags `<img>`.
- **Carregamento Assíncrono:** Sempre aguarde o evento `onload` de todas as tags de imagens no documento de impressão antes de disparar `window.print()`.

### Backend (Hybrid Hono + Supabase Edge)

- **Framework:** Hono (Vercel Edge/Serverless) substituindo o Express em rotas pesadas.
- **ORM:** Prisma. Sempre que houver uma mudança no `schema.prisma`, execute `npx prisma generate`.
- **Tratamento de Erros:** Todas as requisições devem envelopar `try/catch`.
- **Fragmentation Strategy:** Rotas que importam bibliotecas pesadas de manipulação de PDF ou imagem devem residir no backend Vercel/Node em vez do Supabase Edge Functions para evitar estouro do bundle limit (20MB) e de memória (256MB).

## Testes e Quality Assurance (UAT)

Antes de abrir um Pull Request:

1. Certifique-se de que não existem avisos de lint ou TypeScript errors. O nosso pipeline bloqueia deployments com tipagens quebradas.
2. O sistema possui scripts de teste E2E usando Playwright (ex: `test:certify`). Para rodar:

   ```bash
   npm run test
   ```

3. Teste o build de produção localmente se estiver tocando em pacotes cruciais:

   ```bash
   npm run build --prefix frontend
   npm run build --prefix backend
   ```

## Fluxo do Git

- Trabalhe em branches de feature: `feature/nome-da-feature` ou `fix/nome-do-bug`.
- Use mensagens de commit convencionais (`feat: ...`, `fix: ...`, `docs: ...`).
- Atualizações de documentação automáticas podem ser solicitadas via fluxo GSD.

<!-- GSD-DOCS-UPDATE: SUPPLEMENTED -->

_Documentação verificada e atualizada automaticamente via GSD-SDK em 2026-06-14._

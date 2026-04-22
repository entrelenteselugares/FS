# Mind Map: Estrutura do Sistema Foto Segundo (V2.0)

Este mapa descreve a organização física e lógica do projeto, servindo como uma "bússola" para navegar entre o frontend React e o backend Express.

## 🧠 Mapa Mental Visual

```mermaid
mindmap
  root((Foto Segundo))
    Configurações [Root Config]
      package.json
      vercel.json [Vercel Bridge]
      tsconfig.json
    Infraestrutura [infrastructure/]
      DB_Scripts [SQL / Backups]
      Logs [Build / Errors]
      Tests [Temporary Scripts]
      Legacy [Old Assets]
    Infras_Servidor [app.ts / api/]
      Rate_Limiting
      Trust_Proxy [Vercel Header Fix]
      CORS_Policy
      Vercel_Functions [api/ index.js]
    Backend_Express [backend/]
      Prisma_DB [prisma/]
        schema.prisma
      Src_Logic [src/]
        Controllers [Auth, Admin, Partner, Payment]
          - Auto_Allocation [Lógica de Profissional FIXO]
        Routes [Core Index Routing]
        Lib [audit.ts, prisma.ts, auth.ts, pricing.ts]
        Services [MercadoPago, Notifications]
    Frontend_React [frontend/]
      Public_Assets [logo-fs.png / Icons]
      Design_System [lib/theme.ts / index.css]
        - Theme_Engine [Split Context para HMR/Fast Refresh]
      Administrative [Dashboard Tower]
        Events_Management
        Lead_Machine [Quotes]
        Financial_Uber_Style [Payouts]
      Partner_Dashboards
        Artista_da_Rede [Profissional]
        Unidade_Fixa [Cartório]
      Public_Pages [Storefront]
        Landing_Pages [SEO / Unidades]
        - Checkout_Flow [Mercado Pago V2 / Zero-Any TS Compliance]
        - ClienteArea [Self-Service Privacy & Event Status]
```

---

## 📂 Descrição Detalhada de Pastas e Arquivos

### 1. Motor de Execução (backend/)

Onde reside toda a inteligência e segurança.

- **`src/app.ts`**: Coração do servidor. Configura segurança crítica (`trust proxy`), limites de requisição e orquestração de rotas.
- **`src/lib/audit.ts`**: Motor de rastreabilidade. Registra toda ação relevante no banco de dados.
- **`src/lib/auth.ts`**: Gestão de tokens JWT e RBAC (Role-Based Access Control).

### 2. Interface do Usuário (frontend/)

A "Pele" do sistema em Midnight Luxury.

- **`src/pages/admin/`**: O centro de controle administrativo ("Operações Centrais"). Inclui gestão de Eventos, Orçamentos (Leads) e Repasses Financeiros.
- **`src/pages/public/`**: Páginas de vitrine e landing pages customizadas para as **Unidades Fixas**.
- **`src/components/DashboardLayout`**: Estrutura visual adaptativa usada em todos os painéis internos.

### 3. Operações e Deploy

- **`vercel.json`**: Ponte de comunicação entre o domínio e o código, garantindo que `/api/*` chegue ao backend corretamente.
- **`package.json`**: Orquestra os builds de produção e dependências compartilhadas.

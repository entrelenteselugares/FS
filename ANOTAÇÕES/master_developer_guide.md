# Master Developer Guide: Foto Segundo (V2.0)

## 1. Visão Geral e Arquitetura

O Foto Segundo é uma plataforma de fornecimento de ativos visuais de luxo, operando sob uma arquitetura de microsserviços simulada (Back-end Express + Front-end React na Vercel).

- **Backend**: Node.js/Express, Prisma ORM, PostgreSQL (Supabase).
- **Identidade**: "Midnight Luxury" (Dark Mode severo, Teal accents, Zero Border Radius).
- **Tipografia**: Barlow Condensed (Display) + Inter (UI/Body).
- **Assets**: Logotipo oficial `/logo-fs.png` (Minimalista).

---

## 2. Padrões de Nomenclatura e Branding (CRÍTICO)

A plataforma passou por um rebranding total.

- **Unidade Fixa**: Substitui "Cartório" em todos os contextos de interface com o usuário.
- **Artista da Rede**: Substitui "Fotógrafo" e "Editor" para unificar os parceiros de produção.
- **Backend**: Por razões de integridade de banco de dados, o `role` permanece `CARTORIO` e `PROFISSIONAL`, mas as rotas de API e mensagens de erro devem usar `unidade-fixa` e `artista-da-rede`.
- **Exceção**: O campo `cartorio` no modelo `Event` é mantido para compatibilidade com dados legados, mas novos registros devem priorizar `cartorioUserId`.

---

## 3. Protocolo de Auditoria e Logs

Nenhuma ação administrativa ou de autenticação deve ocorrer sem rastro.

> [!IMPORTANT]
> **Helper `audit()`**: Localizado em `backend/src/lib/audit.ts`.
> Uso obrigatório em:
>
> - Login / Registro
> - Criação/Edição/Deleção de Eventos
> - Aprovação de Orçamentos
> - Alterações de Perfil

**Formato de Dados**: Devido ao schema compacto, todos os metadados (entidade, valores antigos/novos, IP) devem ser serializados no campo `details` via helper `audit()`.

---

## 4. Segurança e Hardening

### Trust Proxy (Vercel)

A aplicação DEVE ter `app.set("trust proxy", 1)` no `app.ts`. Sem isso, o `express-rate-limit` bloqueará o servidor inteiro (detectando o IP do proxy da Vercel) em vez de bloquear o atacante individual.

### Rate Limiting

- **Global**: 60 req/min/IP.
- **Auth/Checkout**: 10-15 req/15min/IP (mais restrito).

---

## 6. Diretrizes de Performance e Deploy (Vercel)

### Sequential Query Pattern (Dashboard)

Para evitar o erro 500 causado por concorrência de recursos ou estouro da pool de conexões (PGBouncer) no ambiente serverless, operações de dashboard (múltiplas contagens e agregações) DEVEM ser executadas de forma **sequencial** (`await` individual) em vez de paralelas (`Promise.all`).

### Wizard Flow (QuotePage) Pattern

Para formulários complexos (como o calculador de orçamentos), utilizamos o padrão de **Wizard Multi-etapas**.

- **Estado**: Controlado via `step` local.
- **Validação**: Cada etapa deve validar seus campos obrigatórios antes de permitir o avanço via `setStep`.
- **UX**: Sempre utilizar `window.scrollTo(0,0)` ao trocar de etapa para garantir que o usuário veja o topo da nova seção.
- **Pricing**: O motor de precificação (`totalPrice`) deve ser reativo, recalculando valores instantaneamente a cada mudança de estado.

### Favicon & Branding Persistence

O favicon oficial está localizado em `frontend/public/favicon.png`. Em caso de atualização da identidade visual, este arquivo deve ser substituído mantendo o nome exato para garantir que as referências no `index.html` e nos componentes de cabeçalho permaneçam válidas sem necessidade de refatoração de código.

---

## 7. Regras Inegociáveis

> [!IMPORTANT]
> **Identidade Visual**: A estética **Midnight Luxury** é o pilar da Foto Segundo. Background `#0a0a0a`, tipografia **Barlow Condensed** (Títulos) e **Inter** (UI), e a cor de marca `#85B9AC`. Bordas sempre quadradas (`borderRadius: 0`).
>
> [!NOTE]
> **Unidade Fixa**: O mapeamento `CARTORIO` -> `Unidade Fixa` na visualização é mandatório.
>
> [!CAUTION]
> **Automação ViaCEP**: O cadastro de Unidades Fixas depende do preenchimento automático via CEP para garantir a integridade dos endereços na vitrine pública.

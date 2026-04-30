# Master Developer Guide: Foto Segundo (V2.0)

## 1. VisÃ£o Geral e Arquitetura

O Foto Segundo Ã© uma plataforma de fornecimento de ativos visuais de luxo, operando sob uma arquitetura de microsserviÃ§os simulada (Back-end Express + Front-end React na Vercel).

- **Backend**: Node.js/Express, Prisma ORM (Adapter Nativo `@prisma/adapter-pg`), PostgreSQL.
- **Strictness**: ProibiÃ§Ã£o absoluta de `: any`. Todo erro deve ser tratado como `unknown` e tipado via `instanceof Error`.
- **Identidade**: "Midnight Luxury" (Dark Mode severo, Teal accents, Zero Border Radius).
- **Tipografia**: Barlow Condensed (Display) + Inter (UI/Body).
- **Assets**: Logotipo oficial `/logo-fs.png` (Minimalista).

---

## 2. PadrÃµes de Nomenclatura e Branding (CRÃ�TICO)

A plataforma passou por um rebranding total.

- **Unidade Fixa**: Substitui "CartÃ³rio" em todos os contextos de interface com o usuÃ¡rio.
- **Artista da Rede**: Substitui "FotÃ³grafo" e "Editor" para unificar os parceiros de produÃ§Ã£o.
- **Backend**: Por razÃµes de integridade de banco de dados, o `role` permanece `CARTORIO` e `PROFISSIONAL`, mas as rotas de API e mensagens de erro devem usar `unidade-fixa` e `artista-da-rede`.
- **ExceÃ§Ã£o**: O campo `cartorio` no modelo `Event` Ã© mantido para compatibilidade com dados legados, mas novos registros devem priorizar `cartorioUserId`.

---

## 3. Protocolo de Auditoria e Logs

Nenhuma aÃ§Ã£o administrativa ou de autenticaÃ§Ã£o deve ocorrer sem rastro.

> [!IMPORTANT]
> **Helper `audit()`**: Localizado em `backend/src/lib/audit.ts`.
> Uso obrigatÃ³rio em:
>
> - Login / Registro
> - CriaÃ§Ã£o/EdiÃ§Ã£o/DeleÃ§Ã£o de Eventos
> - AprovaÃ§Ã£o de OrÃ§amentos
> - AlteraÃ§Ãµes de Perfil

**Formato de Dados**: Devido ao schema compacto, todos os metadados (entidade, valores antigos/novos, IP) devem ser serializados no campo `details` via helper `audit()`.

---

## 4. SeguranÃ§a e Hardening

### Trust Proxy (Vercel)

A aplicaÃ§Ã£o DEVE ter `app.set("trust proxy", 1)` no `app.ts`. Sem isso, o `express-rate-limit` bloquearÃ¡ o servidor inteiro (detectando o IP do proxy da Vercel) em vez de bloquear o atacante individual.

### Rate Limiting

- **Global**: 60 req/min/IP.
- **Auth/Checkout**: 10-15 req/15min/IP (mais restrito).

---

## 6. Diretrizes de Performance e Deploy (Vercel)

### Sequential Query Pattern (Serverless Stability)

Para evitar o erro 500 causado por concorrÃªncia de recursos ou estouro da pool de conexÃµes (PGBouncer) no ambiente serverless da Vercel, operaÃ§Ãµes de dashboard (mÃºltiplas contagens e agregaÃ§Ãµes) DEVEM ser executadas de forma **sequencial** (`await` individual) em vez de paralelas (`Promise.all`).

### Background Jobs (Cron)

Jobs de manutenÃ§Ã£o (como `expiration.job.ts`) devem:
- Utilizar `AuthRequest` para auditoria quando disparados via rota `/cron`.
- Validar segredos de ambiente (`CRON_SECRET`) para evitar disparos externos.
- Nunca lanÃ§ar erros que interrompam o loop principal de processamento de mÃºltiplos registros.

### Wizard Flow (QuotePage) Pattern

Para formulÃ¡rios complexos (como o calculador de orÃ§amentos), utilizamos o padrÃ£o de **Wizard Multi-etapas**.

- **Estado**: Controlado via `step` local.
- **ValidaÃ§Ã£o**: Cada etapa deve validar seus campos obrigatÃ³rios antes de permitir o avanÃ§o via `setStep`.
- **UX**: Sempre utilizar `window.scrollTo(0,0)` ao trocar de etapa para garantir que o usuÃ¡rio veja o topo da nova seÃ§Ã£o.
- **Pricing**: O motor de precificaÃ§Ã£o (`totalPrice`) deve ser reativo, recalculando valores instantaneamente a cada mudanÃ§a de estado.

### Favicon & Branding Persistence

O favicon oficial estÃ¡ localizado em `frontend/public/favicon.png`. Em caso de atualizaÃ§Ã£o da identidade visual, este arquivo deve ser substituÃ­do mantendo o nome exato para garantir que as referÃªncias no `index.html` e nos componentes de cabeÃ§alho permaneÃ§am vÃ¡lidas sem necessidade de refatoraÃ§Ã£o de cÃ³digo.

---

## 8. GestÃ£o de Pedidos e Fluxo Financeiro

### Agrupamento por Evento (Audit Pattern)

Para manter a clareza financeira, os pedidos individuais (`Order`) sÃ£o visualizados de forma agrupada por `Event` na Auditoria Administrativa. 

- **LÃ³gica**: Agrupar por `eventId`, somar `amount` e consolidar o `status` (QUITADO, PARCIAL, PENDENTE).
- **UI**: Utilizar o padrÃ£o de "Master-Detail" com expansÃ£o de linha para revelar as parcelas individuais.

### DependÃªncia Sequencial de Pagamentos

Para orÃ§amentos aprovados que geram parcelas (ex: Reserva + QuitaÃ§Ã£o), o sistema impÃµe uma trava de seguranÃ§a.

- **Regra**: O botÃ£o de pagamento da parcela final ("QuitaÃ§Ã£o") deve permanecer bloqueado atÃ© que a parcela inicial ("Reserva") do mesmo `eventId` esteja com status `APROVADO`.
- **Objetivo**: Garantir a liquidez e o compromisso do cliente antes da mobilizaÃ§Ã£o da equipe para a entrega final.

### AutomaÃ§Ã£o de Interface para Unidades Fixas

O comportamento do `QuotePage` Ã© dinÃ¢mico e controlado pelo banco de dados:

- `hideDuration`: Se `true`, os seletores de horas e dias sÃ£o removidos da UI.
- `fixedTime`: Se `true`, o seletor de horas Ã© exibido mas fica em estado `readonly/disabled`, utilizando o valor de `fixedDuration`.

---

## 9. Marketplace e Privacidade (HARDENING)

Para proteger a privacidade dos clientes e a integridade do conteÃºdo pago:

- **isPrivate @default(true)**: Todo evento/Ã¡lbum nasce privado por padrÃ£o. A ativaÃ§Ã£o pÃºblica deve ser uma aÃ§Ã£o consciente.
- **Filtro de Vitrine**: A rota pÃºblica (`listPublic`) deve SEMPRE filtrar por `type: 'ALBUM_FULL'`. Ã�lbuns de Marketplace (`PHOTO_MARKETPLACE`) nunca devem aparecer na vitrine pÃºblica sem login/vÃ­nculo.
- **Guard de Acesso**: O acesso a mÃ­dias de Marketplace exige validaÃ§Ã£o de pagamento aprovado ou propriedade do evento (ADMIN/Artista). Retornar `404 Not Found` em vez de `403 Forbidden` para preservar a opacidade LGPD.

---

## 10. Webhooks e FinanÃ§as

- **ValidaÃ§Ã£o HMAC**: Webhooks do Mercado Pago DEVEM ser validados via middleware `requireMercadoPagoSignature`.
- **Timing Safe**: ComparaÃ§Ãµes de assinatura devem usar `crypto.timingSafeEqual` para evitar ataques de tempo.
- **Replay Protection**: Validar o timestamp da assinatura (mÃ¡ximo 5 minutos de atraso).

---

## 11. CRM e Integridade de Dados

- **Campos SemÃ¢nticos**: NUNCA concatenar notas internas ou contatos no campo `contributorName`.
- **Uso ObrigatÃ³rio**: Utilizar `internalNotes` para observaÃ§Ãµes e `buyerWhatsapp` para contatos de venda expressa/manual no modelo `Order`.

---

## 12. Regras InegociÃ¡veis

> [!IMPORTANT]
> **Identidade Visual**: A estÃ©tica **Midnight Luxury** Ã© o pilar da Foto Segundo. Background `#0a0a0a`, tipografia **Barlow Condensed** (TÃ­tulos) and **Inter** (UI), e a cor de marca `#85B9AC`. Bordas sempre quadradas (`borderRadius: 0`).
>
> [!IMPORTANT]
> **Privacidade por PadrÃ£o**: Marketplace Ã© privado por design. Qualquer exposiÃ§Ã£o pÃºblica nÃ£o intencional Ã© considerada um bug crÃ­tico de seguranÃ§a.
>
> [!NOTE]
> **Unidade Fixa**: O mapeamento `CARTORIO` -> `Unidade Fixa` na visualizaÃ§Ã£o Ã© mandatÃ³rio.

---

## 13. Print Store e Fulfillment Físico

A funcionalidade 'Eternize no Papel' opera como um marketplace de produtos físicos integrado às páginas de evento.

### Fluxo de Pedido de Impressão
- **Ponto de Entrada**: PrintStoreModal.tsx
- **Catálogo Dinâmico**: Gerenciado via `PrintProduct` no Prisma.
- **Trava de Capacidade**: Campo `maxPhotos` define o limite de seleção do cliente por item.
- **Fluxo de Produção**: As fotos selecionadas são salvas no campo `notes` do pedido para consulta imediata pelo laboratório.
- **Arquitetura Dashboard**: Baseada em sub-componentes especializados (`DashboardStats`, `SupportBanner`, etc.) para manter o cockpit leve e escalável.

### Lógica de Precificação
- Preço = Preço de Venda OU (Custo + Margem).

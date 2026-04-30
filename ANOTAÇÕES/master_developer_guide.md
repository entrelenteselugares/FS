# Master Developer Guide: Foto Segundo (V2.0)

## 1. Visão Geral e Arquitetura

O Foto Segundo é uma plataforma de fornecimento de ativos visuais de luxo, operando sob uma arquitetura de microsserviços simulada (Back-end Express + Front-end React na Vercel).

- **Backend**: Node.js/Express, Prisma ORM (Adapter Nativo `@prisma/adapter-pg`), PostgreSQL.
- **Strictness**: Proibição absoluta de `: any`. Todo erro deve ser tratado como `unknown` e tipado via `instanceof Error`.
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

### Sequential Query Pattern (Serverless Stability)

Para evitar o erro 500 causado por concorrência de recursos ou estouro da pool de conexões (PGBouncer) no ambiente serverless da Vercel, operações de dashboard (múltiplas contagens e agregações) DEVEM ser executadas de forma **sequencial** (`await` individual) em vez de paralelas (`Promise.all`).

### Background Jobs (Cron)

Jobs de manutenção (como `expiration.job.ts`) devem:
- Utilizar `AuthRequest` para auditoria quando disparados via rota `/cron`.
- Validar segredos de ambiente (`CRON_SECRET`) para evitar disparos externos.
- Nunca lançar erros que interrompam o loop principal de processamento de múltiplos registros.

### Wizard Flow (QuotePage) Pattern

Para formulários complexos (como o calculador de orçamentos), utilizamos o padrão de **Wizard Multi-etapas**.

- **Estado**: Controlado via `step` local.
- **Validação**: Cada etapa deve validar seus campos obrigatórios antes de permitir o avanço via `setStep`.
- **UX**: Sempre utilizar `window.scrollTo(0,0)` ao trocar de etapa para garantir que o usuário veja o topo da nova seção.
- **Pricing**: O motor de precificação (`totalPrice`) deve ser reativo, recalculando valores instantaneamente a cada mudança de estado.

### Favicon & Branding Persistence

O favicon oficial está localizado em `frontend/public/favicon.png`. Em caso de atualização da identidade visual, este arquivo deve ser substituído mantendo o nome exato para garantir que as referências no `index.html` e nos componentes de cabeçalho permaneçam válidas sem necessidade de refatoração de código.

---

## 8. Gestão de Pedidos e Fluxo Financeiro

### Agrupamento por Evento (Audit Pattern)

Para manter a clareza financeira, os pedidos individuais (`Order`) são visualizados de forma agrupada por `Event` na Auditoria Administrativa. 

- **Lógica**: Agrupar por `eventId`, somar `amount` e consolidar o `status` (QUITADO, PARCIAL, PENDENTE).
- **UI**: Utilizar o padrão de "Master-Detail" com expansão de linha para revelar as parcelas individuais.

### Dependência Sequencial de Pagamentos

Para orçamentos aprovados que geram parcelas (ex: Reserva + Quitação), o sistema impõe uma trava de segurança.

- **Regra**: O botão de pagamento da parcela final ("Quitação") deve permanecer bloqueado até que a parcela inicial ("Reserva") do mesmo `eventId` esteja com status `APROVADO`.
- **Objetivo**: Garantir a liquidez e o compromisso do cliente antes da mobilização da equipe para a entrega final.

### Automação de Interface para Unidades Fixas

O comportamento do `QuotePage` é dinâmico e controlado pelo banco de dados:

- `hideDuration`: Se `true`, os seletores de horas e dias são removidos da UI.
- `fixedTime`: Se `true`, o seletor de horas é exibido mas fica em estado `readonly/disabled`, utilizando o valor de `fixedDuration`.

---

## 9. Marketplace e Privacidade (HARDENING)

Para proteger a privacidade dos clientes e a integridade do conteúdo pago:

- **isPrivate @default(true)**: Todo evento/álbum nasce privado por padrão. A ativação pública deve ser uma ação consciente.
- **Filtro de Vitrine**: A rota pública (`listPublic`) deve SEMPRE filtrar por `type: 'ALBUM_FULL'`. Álbuns de Marketplace (`PHOTO_MARKETPLACE`) nunca devem aparecer na vitrine pública sem login/vínculo.
- **Guard de Acesso**: O acesso a mídias de Marketplace exige validação de pagamento aprovado ou propriedade do evento (ADMIN/Artista). Retornar `404 Not Found` em vez de `403 Forbidden` para preservar a opacidade LGPD.

---

## 10. Webhooks e Finanças

- **Validação HMAC**: Webhooks do Mercado Pago DEVEM ser validados via middleware `requireMercadoPagoSignature`.
- **Timing Safe**: Comparações de assinatura devem usar `crypto.timingSafeEqual` para evitar ataques de tempo.
- **Replay Protection**: Validar o timestamp da assinatura (máximo 5 minutos de atraso).

---

## 11. CRM e Integridade de Dados

- **Campos Semânticos**: NUNCA concatenar notas internas ou contatos no campo `contributorName`.
- **Uso Obrigatório**: Utilizar `internalNotes` para observações e `buyerWhatsapp` para contatos de venda expressa/manual no modelo `Order`.

---

## 12. Regras Inegociáveis

> [!IMPORTANT]
> **Identidade Visual**: A estética **Midnight Luxury** é o pilar da Foto Segundo. Background `#0a0a0a`, tipografia **Barlow Condensed** (Títulos) and **Inter** (UI), e a cor de marca `#85B9AC`. Bordas sempre quadradas (`borderRadius: 0`).
>
> [!IMPORTANT]
> **Privacidade por Padrão**: Marketplace é privado por design. Qualquer exposição pública não intencional é considerada um bug crítico de segurança.
>
> [!NOTE]
> **Unidade Fixa**: O mapeamento `CARTORIO` -> `Unidade Fixa` na visualização é mandatório.

---

## 13. Print Store e Fulfillment F�sico

A funcionalidade 'Eternize no Papel' opera como um marketplace de produtos f�sicos integrado �s p�ginas de evento.

### Fluxo de Pedido de Impress�o
- **Ponto de Entrada**: PrintStoreModal.tsx acionado pelo bot�o na sidebar.
- **Sele��o H�brida**: Upload manual + sele��o da galeria (para donos).
- **Persist�ncia**: URLs das fotos salvas em internalNotes.

### L�gica de Precifica��o
- Pre�o = Pre�o de Venda OU (Custo + Margem).

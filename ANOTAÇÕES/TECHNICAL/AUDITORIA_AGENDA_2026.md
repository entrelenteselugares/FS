# Auditoria de Sistema - Foto Segundo (Maio 2026)

## 1. Módulo: Agenda Descentralizada (Google Sync)

### 🛡️ Segurança e Criptografia

- **At Rest:** Tokens OAuth2 (`accessToken`, `refreshToken`) são criptografados no PostgreSQL usando **AES-256-GCM**.
- **In Transit:** Uso obrigatório de parâmetro `state` (32-byte hex) para prevenção de ataques CSRF durante o handshake OAuth2.
- **Middleware:** Rotas protegidas pelo `requireAuth` padrão do projeto.

### 🗄️ Arquitetura de Dados (PostgreSQL)

- **Fonte da Verdade:** O PostgreSQL agora é o único ponto de consulta para disponibilidade em tempo real.
- **Tabela `UserCalendarCredential`:** Armazena e-mail da agenda, ID do calendário e tokens criptografados.
- **Tabela `CalendarSlot`:** Espelhamento de compromissos.
  - `GOOGLE_SYNC`: Eventos importados da agenda pessoal.
  - `BOOKING`: Bloqueios automáticos gerados por novas vendas no site.
  - `MANUAL`: Bloqueios feitos manualmente pelo fotógrafo.

### 🔄 Sincronização e Concorrência

- **Cron Job:** Configurado para rodar a cada 15 minutos via Vercel Cron (`/api/cron/calendar-sync`).
- **Lógica Push/Pull:**
  - O sistema puxa eventos do Google (30 dias à frente).
  - O sistema limpa slots antigos automaticamente para manter o banco performático.
- **Check de Disponibilidade:** Integrado no `EventController.createQuote`. O sistema agora itera sobre fotógrafos disponíveis antes de confirmar uma reserva.

## 2. Documentação de Fluxos

### Fluxo de Conexão (Fotógrafo)

1. Dashboard → Aba Agenda Google → Botão Conectar.
2. Backend gera URL de autorização com `state`.
3. Usuário autoriza no Google.
4. Callback recebe `code`, valida `state`, troca por tokens, criptografa e salva.
5. Sincronização inicial disparada em background.

### Fluxo de Reserva (Cliente)

1. Cliente seleciona data e serviço.
2. `createQuote` calcula `endAt` (data + horas).
3. Sistema consulta `CalendarSlot` no Postgres para o profissional selecionado.
4. Se houver conflito, retorna `422 Unprocessable Entity`.
5. Se disponível, cria o `Event` e o `CalendarSlot` tipo `BOOKING`.

## 3. Limpeza e Organização

### 📂 Arquivamento de Arquivos Obsoletos

- **`backend/prisma/migrations/manual_calendar_migration.sql`**: Mantido como referência técnica.
- **`scratch/simulate_print.js`**: Identificado como ferramenta de desenvolvimento.

### 📝 Variáveis de Ambiente Necessárias (.env)

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`
- `CALENDAR_ENCRYPTION_KEY`
- `CRON_SECRET`

---

**Status Final da Auditoria:** ✅ APROVADO

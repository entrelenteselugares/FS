import { google } from 'googleapis';
import { prisma } from './prisma';
import { encryptToken, decryptToken } from './crypto';

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET!;
const REDIRECT_URI = process.env.GOOGLE_CALENDAR_REDIRECT_URI!;

// Escopos mínimos necessários: leitura de eventos + escrita
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly',
];

/**
 * Cria um cliente OAuth2 sem credenciais (para gerar a URL de autorização).
 */
export function createOAuthClient() {
  return new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
}

/**
 * Gera a URL de autorização do Google com o parâmetro `state` anti-CSRF.
 * O `state` deve ser gerado e validado pelo controller.
 */
export function generateAuthUrl(state: string): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: 'offline',   // Obtém refresh_token
    prompt: 'consent',        // Força re-consentimento para garantir refresh_token
    scope: SCOPES,
    state,                    // Parâmetro anti-CSRF (validado no callback)
    include_granted_scopes: true,
  });
}

/**
 * Troca o `code` do callback por access_token + refresh_token.
 * Salva as credenciais criptografadas no banco.
 */
export async function exchangeCodeAndSave(userId: string, code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);

  if (!tokens.access_token || !tokens.refresh_token) {
    throw new Error('Google não retornou access_token ou refresh_token. O usuário pode já ter concedido acesso anteriormente sem "prompt: consent".');
  }

  const expiresAt = tokens.expiry_date
    ? new Date(tokens.expiry_date)
    : new Date(Date.now() + 3600 * 1000); // fallback: 1h

  await prisma.userCalendarCredential.upsert({
    where: { userId },
    update: {
      accessToken:  encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      expiresAt,
      scope: tokens.scope || SCOPES.join(' '),
    },
    create: {
      userId,
      provider:     'google',
      accessToken:  encryptToken(tokens.access_token),
      refreshToken: encryptToken(tokens.refresh_token),
      expiresAt,
      calendarId:   'primary',
      scope:        tokens.scope || SCOPES.join(' '),
    },
  });
}

/**
 * Retorna um cliente OAuth2 autenticado para um usuário específico.
 * Renova o access_token automaticamente se expirado (via refresh_token).
 */
export async function getAuthenticatedClient(userId: string) {
  const cred = await prisma.userCalendarCredential.findUnique({ where: { userId } });
  if (!cred) throw new Error(`Usuário ${userId} não conectou o Google Calendar.`);

  const client = createOAuthClient();
  client.setCredentials({
    access_token:  decryptToken(cred.accessToken),
    refresh_token: decryptToken(cred.refreshToken),
    expiry_date:   cred.expiresAt.getTime(),
  });

  // Renova e persiste automaticamente se o token estiver prestes a expirar
  client.on('tokens', async (tokens) => {
    const update: { accessToken?: string; refreshToken?: string; expiresAt?: Date } = {};
    if (tokens.access_token) update.accessToken = encryptToken(tokens.access_token);
    if (tokens.refresh_token) update.refreshToken = encryptToken(tokens.refresh_token);
    if (tokens.expiry_date) update.expiresAt = new Date(tokens.expiry_date);
    if (Object.keys(update).length > 0) {
      await prisma.userCalendarCredential.update({ where: { userId }, data: update });
    }
  });

  return client;
}

/**
 * Busca períodos ocupados da agenda do usuário no Google Calendar.
 * Retorna um array de { start, end } em UTC.
 */
export async function fetchBusySlots(
  userId: string,
  timeMin: Date,
  timeMax: Date,
): Promise<Array<{ start: Date; end: Date }>> {
  const auth = await getAuthenticatedClient(userId);
  const calendar = google.calendar({ version: 'v3', auth });

  const cred = await prisma.userCalendarCredential.findUnique({ where: { userId } });
  const calendarId = cred?.calendarId || 'primary';

  const res = await calendar.freebusy.query({
    requestBody: {
      timeMin: timeMin.toISOString(),
      timeMax: timeMax.toISOString(),
      items: [{ id: calendarId }],
    },
  });

  const busy = res.data.calendars?.[calendarId]?.busy ?? [];
  return busy
    .filter(b => b.start && b.end)
    .map(b => ({ start: new Date(b.start!), end: new Date(b.end!) }));
}

/**
 * Cria um evento espelho na agenda pessoal do profissional.
 * Retorna o ID do evento criado no Google Calendar.
 */
export async function pushEventToCalendar(
  userId: string,
  title: string,
  startAt: Date,
  endAt: Date,
  notes?: string,
): Promise<string | null> {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const cred = await prisma.userCalendarCredential.findUnique({ where: { userId } });
    const calendarId = cred?.calendarId || 'primary';

    const res = await calendar.events.insert({
      calendarId,
      requestBody: {
        summary: `[Foto Segundo] ${title}`,
        description: notes ?? 'Evento agendado via Foto Segundo.',
        start: { dateTime: startAt.toISOString(), timeZone: 'America/Sao_Paulo' },
        end:   { dateTime: endAt.toISOString(),   timeZone: 'America/Sao_Paulo' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'email', minutes: 1440 }, // 24h antes
          ],
        },
      },
    });

    return res.data.id ?? null;
  } catch (err) {
    console.error(`[CalendarService] Falha ao criar evento no Google para userId=${userId}:`, err);
    return null; // Não bloqueia o fluxo principal se o push falhar
  }
}

/**
 * Remove um evento espelho da agenda do profissional (ex: cancelamento).
 */
export async function deleteEventFromCalendar(userId: string, googleEventId: string): Promise<void> {
  try {
    const auth = await getAuthenticatedClient(userId);
    const calendar = google.calendar({ version: 'v3', auth });
    const cred = await prisma.userCalendarCredential.findUnique({ where: { userId } });
    await calendar.events.delete({
      calendarId: cred?.calendarId || 'primary',
      eventId: googleEventId,
    });
  } catch (err) {
    console.error(`[CalendarService] Falha ao remover evento ${googleEventId}:`, err);
  }
}

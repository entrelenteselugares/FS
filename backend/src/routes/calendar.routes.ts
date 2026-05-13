import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { generateAuthUrl, exchangeCodeAndSave } from '../lib/calendar.service';
import { syncUserCalendar } from '../services/calendar-sync.service';
import { prisma } from '../lib/prisma';
import { requireAuth } from '../lib/auth';
import { FRONTEND_URL } from '../lib/config';

const router = Router();

// Store em memória para os state tokens (válidos por 10 min).
// Em produção com múltiplas instâncias, usar Redis.
const pendingStates = new Map<string, { userId: string; expiresAt: number }>();

/**
 * GET /api/calendar/connect
 * Inicia o fluxo OAuth2. Gera URL e redireciona para o Google.
 * Requer autenticação JWT.
 */
router.get('/connect', requireAuth, (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  if (!userId) return res.status(401).json({ error: 'Não autorizado.' });

  // Gera state anti-CSRF único
  const state = randomBytes(32).toString('hex');
  pendingStates.set(state, {
    userId,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutos
  });

  const url = generateAuthUrl(state);
  res.redirect(url);
});

/**
 * GET /api/calendar/callback
 * Recebe o código do Google, valida o state, troca por tokens e salva.
 */
router.get('/callback', async (req: Request, res: Response) => {
  const { code, state, error } = req.query;

  // Usuário negou o acesso
  if (error) {
    console.warn('[Calendar OAuth] Usuário negou acesso:', error);
    return res.redirect(`${FRONTEND_URL}/minha-conta?calendar=denied`);
  }

  if (!code || !state || typeof state !== 'string') {
    return res.status(400).json({ error: 'Parâmetros inválidos.' });
  }

  // Valida o state anti-CSRF
  const pending = pendingStates.get(state);
  if (!pending) {
    return res.status(400).json({ error: 'State inválido ou expirado. Tente novamente.' });
  }
  if (pending.expiresAt < Date.now()) {
    pendingStates.delete(state);
    return res.status(400).json({ error: 'Sessão expirada. Inicie o processo novamente.' });
  }

  const { userId } = pending;
  pendingStates.delete(state); // Invalida o state após uso (one-time use)

  try {
    await exchangeCodeAndSave(userId, code as string);

    // Dispara sync imediato em background (não bloqueia resposta)
    syncUserCalendar(userId).catch(err =>
      console.error('[Calendar] Erro no sync inicial:', err)
    );

    res.redirect(`${FRONTEND_URL}/minha-conta?calendar=connected`);
  } catch (err) {
    console.error('[Calendar OAuth] Erro ao salvar tokens:', err);
    res.redirect(`${FRONTEND_URL}/minha-conta?calendar=error`);
  }
});

/**
 * DELETE /api/calendar/disconnect
 * Remove as credenciais do Google Calendar do usuário.
 */
router.delete('/disconnect', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  try {
    await prisma.userCalendarCredential.delete({ where: { userId } });
    // Remove também os slots importados do Google (mantém MANUAL e BOOKING)
    await prisma.calendarSlot.deleteMany({
      where: { userId, source: 'GOOGLE_SYNC' },
    });
    res.json({ success: true, message: 'Google Calendar desconectado.' });
  } catch {
    res.status(404).json({ error: 'Credenciais não encontradas.' });
  }
});

/**
 * GET /api/calendar/status
 * Retorna se o usuário tem o Google Calendar conectado.
 */
router.get('/status', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  const cred = await prisma.userCalendarCredential.findUnique({
    where: { userId },
    select: { id: true, calendarId: true, expiresAt: true, createdAt: true },
  });
  res.json({ connected: !!cred, credential: cred ?? null });
});

/**
 * POST /api/calendar/sync
 * Dispara sincronização manual para o usuário autenticado.
 */
router.post('/sync', requireAuth, async (req: Request, res: Response) => {
  const userId = (req as any).user?.userId;
  try {
    const result = await syncUserCalendar(userId);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ error: 'Falha na sincronização.' });
  }
});

/**
 * GET /api/calendar/availability
 * Verifica disponibilidade de um profissional em um intervalo.
 * Consulta APENAS o PostgreSQL — zero chamadas ao Google em tempo real.
 *
 * Query params: userId, startAt (ISO), endAt (ISO)
 */
router.get('/availability', async (req: Request, res: Response) => {
  const { userId, startAt, endAt } = req.query;

  if (!userId || !startAt || !endAt) {
    return res.status(400).json({ error: 'Parâmetros obrigatórios: userId, startAt, endAt.' });
  }

  const start = new Date(startAt as string);
  const end   = new Date(endAt as string);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return res.status(400).json({ error: 'Datas inválidas.' });
  }

  // Busca qualquer slot ativo que sobreponha o intervalo solicitado
  const conflict = await prisma.calendarSlot.findFirst({
    where: {
      userId: userId as string,
      status: { not: 'CANCELLED' },
      startAt: { lt: end },   // Slot começa antes do fim do intervalo
      endAt:   { gt: start }, // Slot termina depois do início do intervalo
    },
    select: { id: true, startAt: true, endAt: true, source: true },
  });

  res.json({
    available: !conflict,
    conflict: conflict ?? null,
  });
});

export default router;

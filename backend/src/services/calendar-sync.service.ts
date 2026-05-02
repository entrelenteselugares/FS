import { prisma } from '../lib/prisma';
import { fetchBusySlots } from '../lib/calendar.service';

const SYNC_WINDOW_DAYS = 60; // Sincroniza 60 dias à frente

/**
 * Sincroniza a agenda do Google de um único usuário com nossa tabela calendar_slots.
 * Deve ser chamado periodicamente (a cada 15 min via cron) ou sob demanda.
 */
export async function syncUserCalendar(userId: string): Promise<{ synced: number; errors: number }> {
  let synced = 0;
  let errors = 0;

  try {
    const timeMin = new Date();
    const timeMax = new Date(Date.now() + SYNC_WINDOW_DAYS * 24 * 60 * 60 * 1000);

    // 1. Busca períodos ocupados no Google Calendar
    const busySlots = await fetchBusySlots(userId, timeMin, timeMax);

    // 2. Remove slots antigos importados do Google para este usuário (re-sync limpo)
    await prisma.calendarSlot.deleteMany({
      where: {
        userId,
        source: 'GOOGLE_SYNC',
        startAt: { gte: timeMin }, // Não apaga histórico passado
      },
    });

    // 3. Re-insere os períodos ocupados atuais
    if (busySlots.length > 0) {
      await prisma.calendarSlot.createMany({
        data: busySlots.map(slot => ({
          userId,
          startAt: slot.start,
          endAt:   slot.end,
          status:  'BLOCKED' as const,
          source:  'GOOGLE_SYNC' as const,
          title:   'Ocupado (Google Calendar)',
          updatedAt: new Date(),
        })),
        skipDuplicates: true,
      });
      synced = busySlots.length;
    }

    console.log(`[CalendarSync] userId=${userId}: ${synced} slots sincronizados.`);
  } catch (err) {
    errors++;
    console.error(`[CalendarSync] Erro ao sincronizar userId=${userId}:`, err);
  }

  return { synced, errors };
}

/**
 * Sincroniza todos os usuários que possuem credenciais do Google Calendar ativas.
 * Ideal para rodar como cron job a cada 15 minutos.
 */
export async function syncAllCalendars(): Promise<void> {
  const credentials = await prisma.userCalendarCredential.findMany({
    select: { userId: true },
  });

  console.log(`[CalendarSync] Iniciando sync para ${credentials.length} usuários...`);

  const results = await Promise.allSettled(
    credentials.map(c => syncUserCalendar(c.userId))
  );

  const totalSynced = results.reduce((acc, r) => {
    return acc + (r.status === 'fulfilled' ? r.value.synced : 0);
  }, 0);

  console.log(`[CalendarSync] Concluído. Total de slots sincronizados: ${totalSynced}`);
}

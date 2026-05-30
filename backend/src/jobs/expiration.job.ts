import { prisma } from "../lib/prisma";
import { audit } from "../lib/audit";
import { NotificationService } from "../services/notification.service";
import { FRONTEND_URL } from "../lib/config";
import { AuthRequest } from "../lib/auth";
import { VaultCycleService } from "../services/vaultCycle.service";
import { IoTService } from "../services/iot.service";
import { withRetry } from "../lib/retry";
import { Deadline } from "../lib/deadline";

const CHUNK_SIZE = 50; // Máximo de registros por lote, por fase

export async function runExpirationJob(req?: AuthRequest): Promise<{
  phases: Record<string, string>;
  skipped: string[];
  elapsed: string;
}> {
  const deadline = new Deadline(50); // 50s — 10s de margem para o limite de 60s da Vercel
  const now = new Date();
  const report: Record<string, string> = {};
  const skipped: string[] = [];

  console.log(`[EXPIRATION JOB] Rodando em ${now.toISOString()} — janela: 50s`);

  if (req) {
    await audit(req, "CRON_JOB_STARTED", "System", "CRON_EXPIRATION", null, { startTime: now });
  }

  // ── FASE 1: Avisos de expiração (3 dias antes) ──────────────────────────────
  if (!deadline.ok()) { skipped.push("phase_1_warnings"); }
  else {
    const tresDiasParaFrente = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    const proximosDeExpirar = await withRetry(() => prisma.order.findMany({
      where: {
        accessType: { not: null as string | null },
        accessExpiresAt: { gte: now, lte: tresDiasParaFrente },
        warningsSent: { lt: 1 },
        deletedAt: null,
      },
      include: { event: { select: { title: true } } },
      take: CHUNK_SIZE, // Nunca processa mais de 50 por vez
    }));

    let warnCount = 0;
    for (const order of proximosDeExpirar) {
      if (!deadline.ok()) { skipped.push("phase_1_warnings_partial"); break; }

      const dias = Math.ceil(
        ((new Date(order.accessExpiresAt!).getTime() ?? 0) - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      const recipientEmail = order.buyerEmail;
      if (recipientEmail) {
        NotificationService.sendAccessEmail({
          to: recipientEmail,
          buyerName: "Cliente",
          eventTitle: order.event?.title || "Seu álbum",
          orderId: order.id,
          accessLink: `${FRONTEND_URL}/minha-conta`,
        }).catch((e: unknown) =>
          console.error(`[EXPIRATION JOB] Erro ao enviar aviso para ${recipientEmail}:`, e)
        );
      }
      await prisma.order.update({ where: { id: order.id }, data: { warningsSent: { increment: 1 } } });
      warnCount++;
    }
    report["phase_1_warnings"] = `${warnCount}/${proximosDeExpirar.length} avisos enviados`;
    console.log(`[EXPIRATION JOB] Fase 1: ${report["phase_1_warnings"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 2: Marcação de pedidos expirados ────────────────────────────────────
  if (!deadline.ok()) { skipped.push("phase_2_expiry"); }
  else {
    const expirados = await withRetry(() => prisma.order.findMany({
      where: {
        accessType: { not: null as string | null },
        accessExpiresAt: { lt: now },
        deletedAt: null,
      },
      include: { event: { select: { title: true, id: true } } },
      take: CHUNK_SIZE,
    }));

    let expiredCount = 0;
    for (const order of expirados) {
      if (!deadline.ok()) { skipped.push("phase_2_expiry_partial"); break; }

      await prisma.order.update({ where: { id: order.id }, data: { deletedAt: now } });

      if (order.accessType === "PUBLIC") {
        const outrosAtivos = await prisma.order.count({
          where: { eventId: order.eventId, accessType: "PUBLIC", deletedAt: null, accessExpiresAt: { gte: now } },
        });
        if (outrosAtivos === 0) {
          await prisma.event.update({ where: { id: order.eventId }, data: { active: false } });
        }
      }
      expiredCount++;
    }
    report["phase_2_expiry"] = `${expiredCount} pedidos expirados`;
    console.log(`[EXPIRATION JOB] Fase 2: ${report["phase_2_expiry"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 3: Limpeza de curtidas expiradas ─────────────────────────────────
  if (!deadline.ok()) { skipped.push("phase_3_likes"); }
  else {
    const curtidasExpiradas = await prisma.photoLike.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    report["phase_3_likes"] = `${curtidasExpiradas.count} curtidas limpas`;
    console.log(`[EXPIRATION JOB] Fase 3: ${report["phase_3_likes"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 4: Liberação de repasses ─────────────────────────────────────────
  if (!deadline.ok()) { skipped.push("phase_4_payouts"); }
  else {
    const liberaveis = await prisma.order.updateMany({
      where: { payoutStatus: "PENDING", payoutReadyAt: { lt: now }, status: "APROVADO" },
      data: { payoutStatus: "AVAILABLE" },
    });
    report["phase_4_payouts"] = `${liberaveis.count} repasses liberados`;
    console.log(`[EXPIRATION JOB] Fase 4: ${report["phase_4_payouts"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 5: Encerramento automático por retenção ──────────────────────────
  if (!deadline.ok()) { skipped.push("phase_5_retention"); }
  else {
    const eventosAtivos = await withRetry(() => prisma.event.findMany({
      where: {
        active: true,
        isQuote: false,
        type: { in: ["FOTO_POINT", "PHOTO_MARKETPLACE", "FLASH_EVENT"] },
      },
      include: {
        captacao: { select: { email: true, nome: true } },
        cartorioUser: { select: { email: true, nome: true } },
      },
      take: CHUNK_SIZE,
    }));

    let closedCount = 0;
    for (const event of eventosAtivos) {
      if (!deadline.ok()) { skipped.push("phase_5_retention_partial"); break; }

      const diffDays = Math.floor((now.getTime() - new Date(event.dataEvento).getTime()) / (1000 * 60 * 60 * 24));
      // @ts-ignore
      const retentionLimit = event.retentionDays || (event.isPrivate ? 7 : 15);

      if (diffDays >= retentionLimit) {
        await prisma.event.update({ where: { id: event.id }, data: { active: false } });
        const ownerEmail = event.captacao?.email || event.cartorioUser?.email;
        const ownerName = event.captacao?.nome || event.cartorioUser?.nome || "Parceiro";
        if (ownerEmail) {
          NotificationService.notifyEventAutoClosed({ to: ownerEmail, ownerName, eventTitle: event.title })
            .catch(e => console.error(`[EXPIRATION JOB] Erro ao notificar dono de ${event.id}:`, e));
        }
        closedCount++;
      }
    }
    report["phase_5_retention"] = `${closedCount} eventos encerrados por retenção`;
    console.log(`[EXPIRATION JOB] Fase 5: ${report["phase_5_retention"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 6: Auditoria de privacidade de marketplace ──────────────────────
  if (!deadline.ok()) { skipped.push("phase_6_privacy_audit"); }
  else {
    const vendidosExpostos = await prisma.event.findMany({
      where: { type: "PHOTO_MARKETPLACE", active: false },
      include: { pedidos: { where: { status: "APROVADO" }, take: 1 } },
      take: CHUNK_SIZE,
    });

    let correctedCount = 0;
    for (const event of vendidosExpostos) {
      if (!deadline.ok()) { skipped.push("phase_6_privacy_audit_partial"); break; }
      if (event.pedidos.length > 0) {
        await prisma.event.update({ where: { id: event.id }, data: { active: true } });
        correctedCount++;
      }
    }
    report["phase_6_privacy_audit"] = `${correctedCount} marketplaces reativados`;
    console.log(`[EXPIRATION JOB] Fase 6: ${report["phase_6_privacy_audit"]} (${deadline.elapsedStr()})`);
  }

  // ── FASE 7: VaultCycleService (assinaturas de Cofres) ────────────────────
  if (!deadline.ok()) { skipped.push("phase_7_vault_cycle"); }
  else {
    try {
      await VaultCycleService.processAllDueSubscriptions();
      report["phase_7_vault_cycle"] = "ok";
      console.log(`[EXPIRATION JOB] Fase 7: VaultCycle ok (${deadline.elapsedStr()})`);
    } catch (err) {
      report["phase_7_vault_cycle"] = `erro: ${(err as Error).message}`;
    }
  }

  // ── FASE 8: IoT Heartbeat check ──────────────────────────────────────────
  if (!deadline.ok()) { skipped.push("phase_8_iot"); }
  else {
    try {
      await IoTService.checkOfflineDevices();
      report["phase_8_iot"] = "ok";
      console.log(`[EXPIRATION JOB] Fase 8: IoT ok (${deadline.elapsedStr()})`);
    } catch (err) {
      report["phase_8_iot"] = `erro: ${(err as Error).message}`;
    }
  }

  const elapsed = deadline.elapsedStr();

  if (skipped.length > 0) {
    console.warn(`[EXPIRATION JOB] ⚠️  ${skipped.length} fases puladas por deadline (${elapsed}):`, skipped);
  } else {
    console.log(`[EXPIRATION JOB] ✅ Todas as fases concluídas em ${elapsed}`);
  }

  if (req) {
    await audit(req, "CRON_JOB_FINISHED", "System", "CRON_EXPIRATION", null, {
      endTime: new Date(),
      report,
      skipped,
      elapsed,
    });
  }

  return { phases: report, skipped, elapsed };
}

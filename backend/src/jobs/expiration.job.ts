import { prisma } from "../lib/prisma";
import { audit } from "../lib/audit";
import { NotificationService } from "../services/notification.service";
import { FRONTEND_URL } from "../lib/config";
import { AuthRequest } from "../lib/auth";
import { VaultCycleService } from "../services/vaultCycle.service";

export async function runExpirationJob(req?: AuthRequest): Promise<void> {
  const now = new Date();
  console.log(`[EXPIRATION JOB] Rodando em ${now.toISOString()}`);
  
  if (req) {
    await audit(req, "CRON_JOB_STARTED", "System", "CRON_EXPIRATION", null, { startTime: now });
  }

  // ── 1. Envia aviso 3 dias antes da expiração ──────
  const tresDiasParaFrente = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

  const proximosDeExpirar = await prisma.order.findMany({
    where: {
      accessType: { not: null as string | null },
      accessExpiresAt: {
        gte: now,
        lte: tresDiasParaFrente,
      },
      warningsSent: { lt: 1 },
      deletedAt: null,
    },
    include: {
      event: { select: { nomeNoivos: true } },
    },
  });

  for (const order of proximosDeExpirar) {
    const dias = Math.ceil(
      ((new Date(order.accessExpiresAt!).getTime() ?? 0) - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    console.log(`[EXPIRATION JOB] Aviso: pedido ${order.id} expira em ${dias} dias`);

    // Envia aviso ao comprador por e-mail
    const recipientEmail = order.buyerEmail;
    if (recipientEmail) {
      NotificationService.sendAccessEmail({
        to: recipientEmail,
        buyerName: "Cliente",
        eventTitle: order.event?.nomeNoivos || "Seu álbum",
        orderId: order.id,
        accessLink: `${FRONTEND_URL}/minha-conta`,
      }).catch((e: unknown) =>
        console.error(`[EXPIRATION JOB] Erro ao enviar aviso para ${recipientEmail}:`, e)
      );
    }

    await prisma.order.update({
      where: { id: order.id },
      data: { warningsSent: { increment: 1 } },
    });
  }

  // ── 2. Marca como excluído os pedidos expirados ───
  const expirados = await prisma.order.findMany({
    where: {
      accessType: { not: null as string | null },
      accessExpiresAt: { lt: now },
      deletedAt: null,
    },
    include: {
      event: { select: { nomeNoivos: true, id: true } },
    },
  });

  for (const order of expirados) {
    console.log(`[EXPIRATION JOB] Excluindo mídia do pedido ${order.id}`);

    await prisma.order.update({
      where: { id: order.id },
      data: { deletedAt: now },
    });

    // Se era PUBLIC, verifica se ainda há outros pedidos ativos no evento
    if (order.accessType === "PUBLIC") {
      const outrosAtivos = await prisma.order.count({
        where: {
          eventId: order.eventId,
          accessType: "PUBLIC",
          deletedAt: null,
          accessExpiresAt: { gte: now },
        },
      });

      // Se não há mais pedidos públicos ativos, desativa o evento do portfolio
      if (outrosAtivos === 0) {
        await prisma.event.update({
          where: { id: order.eventId },
          data: { active: false },
        });
      }
    }
  }

  // ── 3. Limpeza de Curtidas Expiradas (Gamificação) ──
  const curtidasExpiradas = await prisma.photoLike.deleteMany({
    where: { expiresAt: { lt: now } },
  });

  if (curtidasExpiradas.count > 0) {
    console.log(`[EXPIRATION JOB] Limpeza: ${curtidasExpiradas.count} curtidas expiradas removidas.`);
  }

  console.log(`[EXPIRATION JOB] Concluído. ${proximosDeExpirar.length} avisos, ${expirados.length} exclusões, ${curtidasExpiradas.count} curtidas limpas.`);

  // ── 4. Auditoria de Privacidade de Marketplace (rede de segurança) ──
  // Verifica apenas eventos marketplace que foram INCORRETAMENTE marcados
  // como públicos APÓS uma venda (isPrivate deveria ser false por padrão em marketplace).
  // Não interfere em eventos públicos sem venda — esses são legítimos (à venda).
  const vendidosExpostos = await prisma.event.findMany({
    where: {
      type: "PHOTO_MARKETPLACE",
      active: false, // Desativados incorretamente
    },
    include: {
      pedidos: { where: { status: "APROVADO" }, take: 1 },
    },
  });

  let correctedCount = 0;
  for (const event of vendidosExpostos) {
    const temPedidoPago = event.pedidos.length > 0;
    if (temPedidoPago) {
      // Reativa marketplace com vendas que foram desativados incorretamente
      await prisma.event.update({
        where: { id: event.id },
        data: { active: true },
      });
      correctedCount++;
      console.log(`[PRIVACY AUDIT] Marketplace ${event.id} reativado (tem pedido pago).`);
    }
  }

  if (correctedCount > 0) {
    console.warn(`[PRIVACY AUDIT] ⚠️  ${correctedCount} eventos marketplace reativados.`);
  } else {
    console.log(`[PRIVACY AUDIT] ✅ Nenhuma inconsistência de visibilidade encontrada.`);
  }

  // ── 5. Liberação Automática de Repasses (Phase 06) ──
  const liberaveis = await prisma.order.updateMany({
    where: {
      payoutStatus: "PENDING",
      payoutReadyAt: { lt: now },
      status: "APROVADO"
    },
    data: {
      payoutStatus: "AVAILABLE"
    }
  });

  if (liberaveis.count > 0) {
    console.log(`[EXPIRATION JOB] Financeiro: ${liberaveis.count} repasses liberados para repasse.`);
  }

  if (req) {
    await audit(req, "CRON_JOB_FINISHED", "System", "CRON_EXPIRATION", null, { 
      endTime: new Date(), 
      correctedCount,
      payoutsReleased: liberaveis.count
    });
  }

  // ── 6. Encerramento Automático de Eventos baseada em Política de Retenção ──
  // Buscamos todos os eventos ativos para verificar o tempo de retenção
  const eventosAtivos = await prisma.event.findMany({
    where: {
      active: true,
      isQuote: false,
      type: { in: ['FOTO_POINT', 'PHOTO_MARKETPLACE', 'FLASH_EVENT'] }
    },
    include: {
      captacao: { select: { email: true, nome: true } },
      cartorioUser: { select: { email: true, nome: true } }
    }
  });

  for (const event of eventosAtivos) {
    const dataEvento = new Date(event.dataEvento);
    const diffTime = now.getTime() - dataEvento.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // @ts-ignore - retentionDays existe no DB
    const retentionLimit = event.retentionDays || (event.isPrivate ? 7 : 15);

    if (diffDays >= retentionLimit) {
      console.log(`[EXPIRATION JOB] Encerrando evento ${event.id} (${event.nomeNoivos}) por expiração de retenção (${diffDays}/${retentionLimit} dias)`);
      
      await prisma.event.update({
        where: { id: event.id },
        data: { active: false }
      });

      // Notifica o dono (Captação ou Unidade Fixa)
      const ownerEmail = event.captacao?.email || event.cartorioUser?.email;
      const ownerName = event.captacao?.nome || event.cartorioUser?.nome || "Parceiro";

      if (ownerEmail) {
        NotificationService.notifyEventAutoClosed({
          to: ownerEmail,
          ownerName,
          eventTitle: event.nomeNoivos
        }).catch(e => console.error(`[EXPIRATION JOB] Erro ao notificar dono de ${event.id}:`, e));
      }
    }
  }

  // ── 7. Processamento de Assinaturas de Cofres (Fase 13) ──
  await VaultCycleService.processAllDueSubscriptions();
}

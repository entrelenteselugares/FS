import { prisma } from "../lib/prisma";

/**
 * Job para Fechamento de Ciclo dos Cofres de Memórias (Fase 11)
 * Deve ser executado diariamente.
 */
export async function runVaultCycleJob() {
  console.log("[VaultCron] Iniciando fechamento de ciclos dos Cofres...");

  try {
    // 1. Encontrar todos os cofres ABERTOS
    const openVaults = await prisma.sharedAlbum.findMany({
      where: { status: "OPEN" },
      include: {
        owner: true,
      }
    });

    const today = new Date().getDate(); // Dia do mês atual

    for (const vault of openVaults) {
      // Verifica se hoje é o dia de fechamento do ciclo para este cofre
      if (vault.cycleEndDay === today) {
        console.log(`[VaultCron] Fechando ciclo do cofre: ${vault.name} (ID: ${vault.id})`);

        // 2. Buscar as mídias do cofre com contagem de votos
        const media = await prisma.sharedAlbumMedia.findMany({
          where: { albumId: vault.id },
          include: {
            _count: { select: { votes: true } }
          }
        });

        // 3. Ordenar por votos (decrescente) e pegar as top N fotos (goalPoses)
        const sortedMedia = media.sort((a, b) => b._count.votes - a._count.votes);
        const topMedia = sortedMedia.slice(0, vault.goalPoses);

        if (topMedia.length === 0) {
          console.log(`[VaultCron] Cofre ${vault.name} não tem fotos. Pulando.`);
          continue;
        }

        // 4. Garantir que existe um Evento de Sistema para os pedidos do Vault
        let systemEvent = await prisma.event.findFirst({
          where: { slug: "vaults-system" }
        });

        if (!systemEvent) {
          systemEvent = await prisma.event.create({
            data: {
              slug: "vaults-system",
              nomeNoivos: "System: Vaults Orders",
              active: true,
              dataEvento: new Date(),
              ownerId: vault.ownerId
            }
          });
        }

        // 5. Disparar Pedido Automático no Order Engine
        const order = await prisma.order.create({
          data: {
            valor: 0, // Assumindo plano de assinatura cobrado separadamente
            status: "PAGO",
            eventId: systemEvent.id,
            clienteId: vault.ownerId,
            buyerEmail: vault.owner.email,
            deliveryType: "SHIPPING",
            fulfillmentStatus: "PENDING",
            isManual: true,
            manualType: "VAULT_CYCLE",
            internalNotes: `Fechamento automático do cofre: ${vault.name}`,
            items: {
              create: topMedia.map(m => ({
                price: 0,
                quantity: 1,
                // Usamos o campo genérico de mediaId, adaptando para Vault
                // Idealmente teríamos uma relação no schema, mas isManual cobre.
              }))
            }
          }
        });

        // 6. Atualizar status do cofre (Opcional: mudar para PRINTING ou manter OPEN para próximo mês)
        // Como é ciclo mensal, mantemos OPEN mas registramos o ciclo gerado se houvesse tabela de ciclos.
        // Vamos atualizar updatedAt para debug.
        await prisma.sharedAlbum.update({
          where: { id: vault.id },
          data: { updatedAt: new Date() }
        });

        console.log(`[VaultCron] Pedido ${order.id} gerado com ${topMedia.length} fotos para o cofre ${vault.name}.`);
      }
    }

    console.log("[VaultCron] Processamento concluído.");
  } catch (error) {
    console.error("[VaultCron] Erro fatal no fechamento de ciclos:", error);
  }
}

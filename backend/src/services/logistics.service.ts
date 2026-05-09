import prisma from "../lib/prisma";

export class LogisticsService {
  /**
   * Encontra a unidade franqueada mais próxima e capaz de produzir o item.
   * Baseado em prefixo de CEP (5 dígitos) e flags de capacidade.
   */
  static async findNearestCapableUnit(cep: string, requiredCapacity?: string) {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length < 5) {
      console.warn(`[Logistics] CEP inválido para roteamento: ${cep}`);
      return null;
    }

    const prefix = cleanCep.substring(0, 5);

    // 1. Buscar franqueados ativos
    const franchisees = await prisma.franchiseProfile.findMany({
      where: { active: true },
      include: {
        _count: {
          select: { prints: { where: { status: "PENDING_PRINT" } } }
        }
      }
    });

    // 2. Filtrar por CEP e Capacidade
    let candidates = franchisees.filter(f => {
      // Verificar se o prefixo está na lista de atendidos
      const servesZip = f.servedZipPrefixes.includes(prefix);
      if (!servesZip) return false;

      // Verificar capacidade técnica (se solicitado)
      if (requiredCapacity) {
        const flags = f.capacityFlags as Record<string, boolean> || {};
        if (!flags[requiredCapacity]) return false;
      }

      return true;
    });

    if (candidates.length === 0) {
      console.log(`[Logistics] Nenhuma unidade regional encontrada para CEP ${prefix}.`);
      return null;
    }

    // 3. Balanceamento de Carga: Selecionar unidade com menor fila
    candidates.sort((a, b) => a._count.prints - b._count.prints);

    const selected = candidates[0];
    console.log(`[Logistics] Unidade selecionada: ${selected.companyName} (Fila: ${selected._count.prints})`);
    
    return selected;
  }

  /**
   * Vincula um pedido a uma unidade franqueada no momento da criação/aprovação.
   */
  static async routeOrderLogistics(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        cliente: true,
        items: { include: { printProduct: true } }
      }
    });

    if (!order) return;

    const address = order.shippingAddress as any;
    const cep = address?.cep || order.cliente?.whatsapp || ""; // Fallback tático

    if (!cep) return;

    // Determinar capacidade necessária (ex: se algum item for ÁLBUM)
    let requiredCapacity = undefined;
    const hasAlbum = order.items.some(i => i.printProduct?.name.toLowerCase().includes("album"));
    if (hasAlbum) requiredCapacity = "canPrintAlbum";

    const unit = await this.findNearestCapableUnit(cep, requiredCapacity);

    if (unit) {
      // Atualizar o pedido com o franqueado responsável pelo fulfillment
      await prisma.order.update({
        where: { id: orderId },
        data: { passiveFranchiseeId: unit.userId } // O passiveFranchiseeId aqui representa o fulfillment unit
      });

      return unit;
    }

    return null;
  }
}

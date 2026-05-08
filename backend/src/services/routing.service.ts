import { prisma } from "../lib/prisma";
import { NotificationService } from "./notification.service";

export class RoutingService {
  /**
   * Roteia um pedido de materialização para o franqueado mais próximo ou matriz.
   */
  static async routeVaultOrder(orderId: string) {
    console.log(`[Routing] Iniciando roteamento para o pedido: ${orderId}`);

    // 1. Busca detalhes do pedido, cliente e cofre
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        cliente: true,
        event: true,
        items: {
          include: {
            printProduct: true
          }
        }
      }
    });

    if (!order) {
      console.error("[Routing] Pedido não encontrado.");
      return;
    }

    // Extrair CEP do shippingAddress (JSON)
    const address = order.shippingAddress as any;
    const customerCep = address?.cep || order.cliente?.whatsapp || ""; // Fallback para busca básica

    if (!customerCep) {
      console.warn("[Routing] CEP do cliente não encontrado. Usando roteamento para Matriz.");
    }

    // 2. Buscar todos os franqueados ativos
    const franchisees = await prisma.user.findMany({
      where: {
        franchiseProfile: {
          active: true
        }
      },
      include: {
        franchiseProfile: true
      }
    });

    // 3. Lógica de Proximidade (CEP Prefix Matching)
    let selectedFranchisee = null;
    if (customerCep && franchisees.length > 0) {
      selectedFranchisee = this.findNearestFranchisee(customerCep, franchisees);
    }

    // 4. Se encontrou um franqueado, notifica ele. Caso contrário, notifica a Matriz.
    if (selectedFranchisee) {
      console.log(`[Routing] Pedido roteado para Franqueado: ${selectedFranchisee.nome}`);
      await NotificationService.sendVaultOrderToFranchisee({
        franchiseeEmail: selectedFranchisee.email,
        franchiseePhone: selectedFranchisee.whatsapp || "",
        franchiseeName: selectedFranchisee.nome,
        orderId: order.id,
        customerName: order.cliente?.nome || "Cliente",
        driveLink: order.event.driveUrl || ""
      });
      
      // Vincula o pedido ao franqueado para comissões passivas se necessário
      await prisma.order.update({
        where: { id: order.id },
        data: { passiveFranchiseeId: selectedFranchisee.id }
      });

    } else {
      console.log("[Routing] Nenhum franqueado próximo encontrado. Roteando para MATRIZ.");
      await NotificationService.sendVaultOrderToMatrix({
        orderId: order.id,
        customerName: order.cliente?.nome || "Cliente",
        driveLink: order.event.driveUrl || ""
      });
    }
  }

  private static findNearestFranchisee(customerCep: string, franchisees: any[]) {
    const cleanCustomer = customerCep.replace(/\D/g, '');
    let bestFranchisee = null;
    let bestScore = -1;

    for (const f of franchisees) {
      if (!f.franchiseProfile?.baseCep) continue;
      const cleanBase = f.franchiseProfile.baseCep.replace(/\D/g, '');
      
      let score = 0;
      for (let i = 0; i < Math.min(cleanCustomer.length, cleanBase.length); i++) {
        if (cleanCustomer[i] === cleanBase[i]) score++;
        else break;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestFranchisee = f;
      }
    }
    return bestFranchisee;
  }
}

import { prisma } from "../lib/prisma";

/**
 * IntegrationService - Handles external API communication with Lab Partners (e.g. CK).
 */
export class IntegrationService {
  /**
   * Dispatches a premium product order to a laboratory partner.
   * Generates the CK-Order JSON and logs the transaction.
   */
  static async dispatchToLabPartner(orderId: string, items: any[], photos: string[]) {
    console.log(`[Integration] Preparing dispatch for Order: ${orderId}`);

    try {
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { event: true, cliente: true }
      });

      if (!order) throw new Error(`Order ${orderId} not found.`);

      // 1. Build the CK-Order JSON structure
      const ckPayload = {
        partnerId: "FOTO_SEGUNDO_HUB",
        externalId: order.id,
        customer: {
          name: order.cliente?.nome || order.contributorName || "Cliente",
          email: order.buyerEmail || order.cliente?.email,
          whatsapp: order.buyerWhatsapp || order.cliente?.whatsapp,
          address: order.shippingAddress
        },
        items: items.map(item => ({
          sku: item.printProduct?.sku,
          name: item.printProduct?.name,
          quantity: item.quantity,
          photos: photos // Currently same photos for all items in order
        })),
        metadata: {
          eventSlug: order.event.slug,
          dispatchTime: new Date().toISOString()
        }
      };

      console.log(`[Integration] CK-Payload generated for Order ${orderId}:`, JSON.stringify(ckPayload, null, 2));

      // 2. Simulate External API Call (Fulfillment Partner)
      // In a real scenario, we would use fetch/axios here:
      // const response = await fetch('https://api.ck-lab.com/v1/orders', { ... });
      
      const simulatedApiResponse = {
        success: true,
        partnerOrderId: `CK-${Math.floor(Math.random() * 1000000)}`,
        status: "RECEIVED"
      };

      if (simulatedApiResponse.success) {
        // 3. Update internal order tracking
        await prisma.order.update({
          where: { id: orderId },
          data: {
            fulfillmentStatus: "LAB_PROCESSING",
            internalNotes: order.internalNotes 
              ? `${order.internalNotes}\n\n[LOGÍSTICA] Despachado para Lab Parceiro: ${simulatedApiResponse.partnerOrderId}`
              : `[LOGÍSTICA] Despachado para Lab Parceiro: ${simulatedApiResponse.partnerOrderId}`
          }
        });

        console.log(`[Integration] Order ${orderId} successfully dispatched to Partner.`);
        return { success: true, partnerId: simulatedApiResponse.partnerOrderId };
      } else {
        throw new Error("Partner API returned failure.");
      }

    } catch (error: any) {
      console.error(`[Integration] Error dispatching Order ${orderId}:`, error.message);
      
      // Notify admin or log for manual retry
      await prisma.order.update({
        where: { id: orderId },
        data: {
          internalNotes: `[LOGÍSTICA ERROR] Falha no despacho automático: ${error.message}`
        }
      });

      throw error;
    }
  }
}

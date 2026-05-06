import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ShippingItem {
  id: string; // PrintProduct ID
  quantity: number;
}

export interface ShippingOption {
  id: string; // PAC, SEDEX, etc.
  name: string;
  price: number;
  currency: string;
  deliveryTimeDays: number;
}

export class ShippingService {
  /**
   * Calcula o frete baseado nos produtos físicos do carrinho.
   * Utiliza uma lógica simulada (ex: Melhor Envio ou Correios).
   */
  static async calculateFreight(
    originCep: string,
    destinationCep: string,
    items: ShippingItem[]
  ): Promise<ShippingOption[]> {
    if (!items || items.length === 0) {
      return [
        { id: 'free', name: 'Frete Grátis (Digital)', price: 0, currency: 'BRL', deliveryTimeDays: 0 }
      ];
    }

    let totalWeight = 0;
    let totalVolume = 0;

    for (const item of items) {
      const product = await prisma.printProduct.findUnique({
        where: { id: item.id }
      });

      if (product) {
        // Se for laboratório, soma as dimensões (senão, impressão instantânea no local não tem frete?)
        // Mas a cotação geralmente é para o Lab ou Ponto Fixo.
        const weight = Number(product.weightKg || 0.5); // Default 500g se nulo
        const w = Number(product.widthCm || 20);
        const h = Number(product.heightCm || 2);
        const l = Number(product.lengthCm || 30);

        totalWeight += weight * item.quantity;
        totalVolume += (w * h * l) * item.quantity;
      }
    }

    // Se todos os produtos não têm dimensões ou são digitais/instantâneos
    if (totalWeight === 0 && totalVolume === 0) {
      return [
        { id: 'free', name: 'Frete Grátis (Digital)', price: 0, currency: 'BRL', deliveryTimeDays: 0 }
      ];
    }

    // Lógica Simulada de Frete Logístico (Substituir pela API do Melhor Envio)
    // O custo base é R$ 15,00 + R$ 2,50 por kg + R$ 0,001 por cm3 de volume (cubagem)
    const baseCost = 15.0;
    const weightCost = totalWeight * 2.5;
    const volumeCost = totalVolume * 0.001;

    const pacPrice = Math.round((baseCost + weightCost + volumeCost) * 100) / 100;
    const sedexPrice = Math.round((pacPrice * 1.6) * 100) / 100;

    return [
      {
        id: 'pac',
        name: 'Correios PAC',
        price: pacPrice,
        currency: 'BRL',
        deliveryTimeDays: 7
      },
      {
        id: 'sedex',
        name: 'Correios SEDEX',
        price: sedexPrice,
        currency: 'BRL',
        deliveryTimeDays: 3
      }
    ];
  }
}

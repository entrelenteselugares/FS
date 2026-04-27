import prisma from "../lib/prisma";
import { Event } from "@prisma/client";

export interface SplitResult {
  matriz: number;
  captacao: number;
  edicao: number;
  cartorio: number;
}

/**
 * PricingService
 * Centraliza a inteligência financeira da plataforma Foto Segundo.
 */
export class PricingService {
  /**
   * Calcula o preço de um evento baseado na data atual e status de Crowdfund.
   * Lógica: Antecipado se hoje < data do evento, caso contrário preço base.
   */
  static calculateEventPrice(event: Event, contributionAmount?: number, cartCount?: number): number {
    const now = new Date();
    const eventDate = new Date(event.dataEvento);
    eventDate.setHours(0, 0, 0, 0);

    // 1. Se for Venda por Unidade (Clique Único / Venda Rápida Fixa)
    if ((event as any).isUnitSale) {
      return Number((event as any).priceUnit || (event as any).priceBase || 10);
    }

    // 2. Se for Marketplace (Venda por Foto Individual no Carrinho)
    if ((event as any).type === "PHOTO_MARKETPLACE") {
      return (cartCount ?? 0) * Number((event as any).pricePerPhoto ?? 15);
    }

    // Se for Compra Coletiva (Crowdfund), o valor é o enviado pelo usuário (cota)
    if (event.isCrowdfund && contributionAmount) {
      return Number(contributionAmount);
    }

    // Se a data atual for anterior à data do evento, usa preço antecipado
    if (now.getTime() < eventDate.getTime()) {
      return Number(event.priceEarly ?? 190);
    }

    return Number(event.priceBase ?? 200);
  }

  /**
   * Calcula a divisão de valores (Splits) com base nas configurações da plataforma.
   * Retorna os valores arredondados para 2 casas decimais.
   */
  static async calculateSplits(amount: number): Promise<SplitResult> {
    const keys = ["split_matriz", "split_captacao", "split_edicao", "split_cartorio"];
    const configs = await prisma.platformConfig.findMany({
      where: { key: { in: keys } },
    });

    const getPct = (key: string) => Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

    return {
      matriz:   +(amount * getPct("split_matriz")).toFixed(2),
      captacao: +(amount * getPct("split_captacao")).toFixed(2),
      edicao:   +(amount * getPct("split_edicao")).toFixed(2),
      cartorio: +(amount * getPct("split_cartorio")).toFixed(2),
    };
  }
}

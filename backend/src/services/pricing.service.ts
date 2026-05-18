import prisma from "../lib/prisma";
import { Event } from "@prisma/client";
import { AffiliateService } from "./affiliate.service";

export interface SplitResult {
  matriz: number;
  captacao: number;
  edicao: number;
  cartorio: number;
  franchisee: number;
  lab?: number;
  passiveFranchiseeId?: string;
  ambassador?: number;
  ambassadorId?: string;
  // Affiliate Network
  affiliateL1Id?: string;
  affiliateL2Id?: string;
  affiliateL1Amount?: number;
  affiliateL2Amount?: number;
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
    if (event.isUnitSale) {
      return (cartCount ?? 0) * Number(event.priceUnit || event.priceBase || 10);
    }

    // 2. Se for Marketplace (Venda por Foto Individual no Carrinho)
    if (event.type === "PHOTO_MARKETPLACE") {
      return (cartCount ?? 0) * Number(event.pricePerPhoto ?? 15);
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
   * Calcula o total de um carrinho híbrido (Digital + Físico)
   */
  static async calculateHybridTotal(eventId: string, cart: string[], printProductId?: string): Promise<number> {
    const event = await prisma.event.findUnique({ where: { id: eventId } });
    if (!event) return 0;

    const basePrice = this.calculateEventPrice(event, 0, cart.length);
    
    let printPrice = 0;
    if (printProductId) {
      const product = await prisma.printProduct.findUnique({ where: { id: printProductId } });
      if (product && product.active) {
        printPrice = product.sellingPrice ? Number(product.sellingPrice) : Number(product.supplierCost) * (1 + product.marginPct / 100);
      }
    }

    return basePrice + printPrice;
  }

  /**
   * Calcula a divisão de valores (Splits) com base nas configurações da plataforma.
   * Suporta o novo modelo de "Venda Direta" com 10% de comissão e "Comissão Passiva B2B".
   */
  static async calculateSplits(amount: number, options?: { 
    isExpressSale?: boolean, 
    paymentMethod?: string, 
    hasEditor?: boolean, 
    productType?: string,
    shippingMethod?: string,
    shippingFee?: number,
    supplierCost?: number,
    professionalId?: string,
    ambassadorId?: string,
    buyerUserId?: string // Afiliado: resolve cadeia a partir do comprador
  }): Promise<SplitResult> {
    if (isNaN(amount) || amount === null) {
      console.warn("[PricingService] amount is NaN or null, returning default zero splits");
      return { matriz: 0, captacao: 0, edicao: 0, cartorio: 0, franchisee: 0, ambassador: 0 };
    }
    const keys = ["split_matriz", "split_captacao", "split_edicao", "split_cartorio", "split_franchisee"];
    const configs = await prisma.platformConfig.findMany({
      where: { key: { in: keys } },
    });

    const getPct = (key: string) => Number(configs.find((c) => c.key === key)?.value ?? 0) / 100;

    // ── LÓGICA DE VENDA DIRETA (10% MATRIZ) ──
    if (options?.isExpressSale) {
      // Taxa de Transação (Estimada em 5% para Pix/Card, 0% para Money)
      const isDigital = options.paymentMethod === "PIX" || options.paymentMethod === "CARD";
      const gatewayFee = isDigital ? amount * 0.0499 : 0; 
      
      const netAmount = amount - gatewayFee;
      const matriz = +(amount * 0.10).toFixed(2); // 10% fixo do Bruto para a Plataforma
      const remainder = +(netAmount - matriz).toFixed(2);

      // Produtos Físicos (SD CARD / ÁLBUM) não têm fase de edição delegada
      const isPhysical = options.productType === "SD_CARD" || options.productType === "ALBUM_IMPRESSO";

      if (options?.hasEditor && !isPhysical) {
        // Divide o restante entre Captação (Vendedor) e Edição (Editor)
        const captacao = +(remainder * 0.60).toFixed(2);
        const edicao = +(remainder - captacao).toFixed(2);
        return { matriz, captacao, edicao, cartorio: 0, franchisee: 0 };
      } else {
        // Sem editor ou produto físico: Fotógrafo recebe 100% do líquido
        return { matriz, captacao: remainder, edicao: 0, cartorio: 0, franchisee: 0 };
      }
    }

    // ── BUSCA COMISSÃO PASSIVA (FRANQUIA) ──
    let franchisee = 0;
    let franchiseePct = 0;
    let passiveFranchiseeId: string | undefined = undefined;

    if (options?.professionalId) {
      const network = await prisma.professionalNetwork.findFirst({
        where: { userId: options.professionalId }
      });

      if (network) {
        franchiseePct = getPct("split_franchisee");
        passiveFranchiseeId = network.partnerId;
      }
    }

    // ── BUSCA COMISSÃO EMBAIXADOR ──
    let ambassador = 0;
    let ambassadorId = options?.ambassadorId;

    if (ambassadorId) {
      const campaign = await prisma.referralCampaign.findFirst({
        where: { ownerId: ambassadorId, active: true }
      });

      if (campaign) {
        // Por padrão, recompensas de venda são 5% ou valor fixo da campanha
        // Aqui usaremos o valor fixo definido na campanha como "valor por venda"
        ambassador = Number(campaign.rewardValue);
        console.log(`[Pricing] Comissão Embaixador detectada: ${ambassador} para ${ambassadorId}`);
      }
    }

    // ── LÓGICA PADRÃO (MARKETPLACE) ──
    const shippingFee = options?.shippingFee || 0;
    const supplierCost = options?.supplierCost || 0;
    const netAmount = amount - shippingFee - supplierCost;

    // Se o valor líquido for zero ou negativo (ex: venda promocional), parceiros não recebem split
    if (netAmount <= 0) {
      return { matriz: amount, captacao: 0, edicao: 0, cartorio: 0, franchisee: 0 };
    }

    const captacao = +(netAmount * getPct("split_captacao")).toFixed(2);
    const edicao   = +(netAmount * getPct("split_edicao")).toFixed(2);
    const cartorio = +(netAmount * getPct("split_cartorio")).toFixed(2);
    
    if (passiveFranchiseeId) {
      franchisee = +(netAmount * franchiseePct).toFixed(2);
      console.log(`[Pricing] Comissão Passiva detectada (${(franchiseePct * 100).toFixed(1)}% do Líquido): ${franchisee} para ${passiveFranchiseeId}`);
    }

    // ── BUSCA COMISSÃO AFILIADO (REDE DE INDICAÇÃO) ──
    let affiliateL1Id: string | undefined;
    let affiliateL2Id: string | undefined;
    let affiliateL1Amount = 0;
    let affiliateL2Amount = 0;

    if (options?.buyerUserId) {
      const { l1Id, l2Id } = await AffiliateService.resolveChain(options.buyerUserId);
      if (l1Id) {
        affiliateL1Id = l1Id;
        affiliateL2Id = l2Id || undefined;
        const commissions = await AffiliateService.calculateCommissions(netAmount, l1Id, l2Id);
        affiliateL1Amount = commissions.l1Amount;
        affiliateL2Amount = commissions.l2Amount;
        console.log(`[Pricing] Comissão Afiliado L1: R$ ${affiliateL1Amount} → ${affiliateL1Id}`);
        if (affiliateL2Id) console.log(`[Pricing] Comissão Afiliado L2: R$ ${affiliateL2Amount} → ${affiliateL2Id}`);
      }
    }

    // Matriz fica com o resto — afiliado é deduzido da margem da Matriz
    const matriz = +(amount - (captacao + edicao + cartorio + franchisee + ambassador + affiliateL1Amount + affiliateL2Amount)).toFixed(2);

    return { 
      matriz, captacao, edicao, cartorio, franchisee, passiveFranchiseeId, 
      ambassador, ambassadorId,
      affiliateL1Id, affiliateL2Id, affiliateL1Amount, affiliateL2Amount,
    };
  }
}

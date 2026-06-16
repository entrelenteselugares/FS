import prisma from "../lib/prisma";
import { Event } from "@prisma/client";
import { AffiliateService } from "./affiliate.service";

export interface SplitResult {
  matriz: number;
  captacao: number;
  edicao: number;
  cartorio: number;
  franchisee: number;
  owner?: number;
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

    // 2. Se for Marketplace ou se foram selecionadas fotos avulsas no carrinho
    if (event.type === "PHOTO_MARKETPLACE" || (cartCount !== undefined && cartCount > 0)) {
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
    buyerUserId?: string, // Afiliado: resolve cadeia a partir do comprador
    eventId?: string // Evento para checar split customizado
  }): Promise<SplitResult> {
    if (isNaN(amount) || amount === null) {
      console.warn("[PricingService] amount is NaN or null, returning default zero splits");
      return { matriz: 0, captacao: 0, edicao: 0, cartorio: 0, franchisee: 0, ambassador: 0, owner: 0 };
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

    let captacao = +(netAmount * getPct("split_captacao")).toFixed(2);
    let edicao   = +(netAmount * getPct("split_edicao")).toFixed(2);
    let cartorio = +(netAmount * getPct("split_cartorio")).toFixed(2);
    
    if (passiveFranchiseeId) {
      franchisee = +(netAmount * franchiseePct).toFixed(2);
      console.log(`[Pricing] Comissão Passiva detectada (${(franchiseePct * 100).toFixed(1)}% do Líquido): ${franchisee} para ${passiveFranchiseeId}`);
    }

    // ── BUSCA COMISSÃO CUSTOMIZADA DE EVENTO (DONO VS PROFISSIONAIS PROGRESSIVO) ──
    let customOwnerSplitPct = 0;
    let customProSplitPct = 0;
    let hasCustomSplit = false;

    if (options?.eventId) {
      const event = await prisma.event.findUnique({ where: { id: options.eventId } });
      if (event?.sellPhotos) {
        const C = Number(event.priceBase) || 1000;
        
        // Consultar total acumulado de vendas aprovadas
        const paidOrders = await prisma.order.findMany({
          where: {
            eventId: event.id,
            status: "APROVADO",
          },
          select: {
            valor: true,
          }
        });
        const prevSales = paidOrders.reduce((sum, o) => sum + Number(o.valor), 0);
        
        // Vendas totais considerando a transação atual
        const S = prevSales + amount;
        const x = S / C;

        let teamPct = 0;
        if (x <= 0.5) {
          teamPct = 0;
        } else if (x >= 5.0) {
          teamPct = 0.50;
        } else {
          teamPct = ((x - 0.5) / 4.5) * 0.50;
        }

        customOwnerSplitPct = 1 - teamPct;
        customProSplitPct = teamPct;
        hasCustomSplit = true;
      }
    }

    let owner = 0;

    if (hasCustomSplit) {
      owner = +(netAmount * customOwnerSplitPct).toFixed(2);
      const proTotal = +(netAmount * customProSplitPct).toFixed(2);
      
      // Divide proTotal entre captador e editor (ex: 60% e 40%), ou 100% para captador
      if (options?.hasEditor) {
        captacao = +(proTotal * 0.60).toFixed(2);
        edicao = +(proTotal - captacao).toFixed(2);
      } else {
        captacao = proTotal;
        edicao = 0;
      }
      cartorio = 0; // Neste caso, quem ganha é o dono (owner), então o cartório não entra no split custom
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
    const MATRIZ_FLOOR_PCT = 0.05; // 5% mínimo para cobrir gateway
    const matrizRaw = +(amount - (captacao + edicao + cartorio + franchisee + ambassador + owner + affiliateL1Amount + affiliateL2Amount)).toFixed(2);
    const matrizFloor = +(amount * MATRIZ_FLOOR_PCT).toFixed(2);

    if (matrizRaw < matrizFloor) {
      console.error(`[Pricing] AVISO: Split inválido! Matriz (${matrizRaw}) abaixo do piso (${matrizFloor}). Ajustando split da Captação para compensar.`);
      const deficit = matrizFloor - matrizRaw;
      if (captacao >= deficit) {
        captacao = +(captacao - deficit).toFixed(2);
      } else if (edicao >= deficit) {
        edicao = +(edicao - deficit).toFixed(2);
      } else if (owner >= deficit) {
        owner = +(owner - deficit).toFixed(2);
      }
      // Se não houver saldo suficiente em nenhum parceiro, a Matriz absorve o prejuízo
    }

    const matriz = +(amount - (captacao + edicao + cartorio + franchisee + ambassador + owner + affiliateL1Amount + affiliateL2Amount)).toFixed(2);

    return { 
      matriz, captacao, edicao, cartorio, franchisee, passiveFranchiseeId, 
      owner,
      ambassador, ambassadorId,
      affiliateL1Id, affiliateL2Id, affiliateL1Amount, affiliateL2Amount,
    };
  }
}

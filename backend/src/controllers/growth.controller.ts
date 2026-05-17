import { Request, Response } from "express";
import { GrowthService } from "../services/growth.service";
import { WhatsAppService } from "../services/whatsapp.service";
import prisma from "../lib/prisma";

export class GrowthController {
  static async validateCoupon(req: Request, res: Response) {
    try {
      const { code } = req.params;
      const result = await GrowthService.validateCoupon(code);
      return res.json({ success: true, discount: result });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao validar cupom" });
    }
  }

  static async validateAffiliate(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const result = await GrowthService.validateAffiliate(id);
      return res.json({ success: true, affiliate: result });
    } catch (error: any) {
      return res.status(400).json({ error: error.message || "Erro ao validar afiliado" });
    }
  }

  static getWhatsappStatus(req: Request, res: Response) {
    try {
      const status = WhatsAppService.getStatus();
      return res.json(status);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao obter status do WhatsApp" });
    }
  }

  static getWhatsappQr(req: Request, res: Response) {
    try {
      const qrData = WhatsAppService.getQrCode();
      return res.json(qrData);
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao obter QR code do WhatsApp" });
    }
  }

  static async listCoupons(req: Request, res: Response) {
    try {
      const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: 'desc' } });
      return res.json({ coupons });
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao buscar cupons" });
    }
  }

  static async createCoupon(req: Request, res: Response) {
    try {
      const { code, discountPct, discountAbs, isFreeShipping, maxUses, expiresAt } = req.body;
      if (!code) return res.status(400).json({ error: "Código do cupom é obrigatório" });
      if (!discountPct && !discountAbs && !isFreeShipping) {
        return res.status(400).json({ error: "Informe desconto em %, R$ ou selecione Frete Grátis" });
      }

      const coupon = await prisma.coupon.create({
        data: {
          code: code.toUpperCase().trim(),
          discountPct: discountPct ? Number(discountPct) : null,
          discountAbs: discountAbs ? Number(discountAbs) : null,
          isFreeShipping: !!isFreeShipping,
          maxUses: maxUses ? Number(maxUses) : null,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          active: true,
        }
      });
      return res.status(201).json(coupon);
    } catch (error: any) {
      if (error?.code === 'P2002') return res.status(409).json({ error: "Já existe um cupom com esse código." });
      return res.status(500).json({ error: "Erro ao criar cupom" });
    }
  }

  static async listAmbassadors(req: Request, res: Response) {
    try {
      // isAffiliate não existe, vamos buscar usuários com campanhas de indicação
      const ambassadors = await prisma.user.findMany({
        where: {
          referralCampaigns: {
            some: {}
          }
        },
        select: {
          id: true,
          nome: true,
          email: true,
        }
      });
      
      const mapped = ambassadors.map(a => ({ ...a, affiliatePayoutType: 'STANDARD' }));
      return res.json({ ambassadors: mapped });
    } catch (error: any) {
      return res.status(500).json({ error: "Erro ao buscar embaixadores" });
    }
  }
}

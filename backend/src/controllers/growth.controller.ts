import { Request, Response } from "express";
import { GrowthService } from "../services/growth.service";
import { WhatsAppService } from "../services/whatsapp.service";

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
}

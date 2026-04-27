import { Request, Response, NextFunction } from "express";
import { validateMercadoPagoSignature } from "../lib/mercadopago-signature";

/**
 * Middleware de autenticação para webhooks do Mercado Pago.
 * Valida a assinatura HMAC-SHA256 antes de permitir o processamento.
 *
 * IMPORTANTE: Em caso de assinatura inválida, retorna 200 (não 4xx).
 * O MP reintenta em 4xx/5xx, causando flood de requests fraudulentos.
 * O 200 silencia a retentativa sem processar o evento.
 */
export const requireMercadoPagoSignature = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const secret = process.env.MP_WEBHOOK_SECRET;

  // Sem secret: bloqueia em produção, avisa em dev
  if (!secret) {
    if (process.env.NODE_ENV === "production") {
      console.error("[WEBHOOK] MP_WEBHOOK_SECRET não configurado — bloqueando em produção.");
      res.status(500).json({ error: "Webhook não configurado." });
      return;
    }
    console.warn("[WEBHOOK] MP_WEBHOOK_SECRET ausente — modo dev, pulando validação HMAC.");
    next();
    return;
  }

  // Extrai o paymentId do body (MP envia: { data: { id: "123" } })
  const paymentId = req.body?.data?.id?.toString();

  const result = validateMercadoPagoSignature(
    req.headers["x-signature"] as string | undefined,
    req.headers["x-request-id"] as string | undefined,
    paymentId,
    secret
  );

  if (!result.valid) {
    console.warn(
      `[WEBHOOK] Assinatura inválida: ${result.reason} | IP: ${req.ip} | paymentId: ${paymentId ?? "unknown"}`
    );

    // 200 silencioso — não processa, não causa retry flood no MP
    res.status(200).json({ received: true });
    return;
  }

  next();
};

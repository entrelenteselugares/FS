import crypto from "crypto";

interface SignatureValidationResult {
  valid: boolean;
  reason?: string;
}

/**
 * Valida a assinatura HMAC-SHA256 de um webhook do Mercado Pago.
 * Docs: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */
export function validateMercadoPagoSignature(
  xSignatureHeader: string | undefined,
  xRequestId: string | undefined,
  paymentId: string | undefined,
  secret: string
): SignatureValidationResult {

  // 1. Presença dos headers obrigatórios
  if (!xSignatureHeader) return { valid: false, reason: "missing_x_signature_header" };
  if (!xRequestId)       return { valid: false, reason: "missing_x_request_id_header" };
  if (!paymentId)        return { valid: false, reason: "missing_payment_id_in_body" };

  // 2. Extrair ts e v1 do header "ts=...,v1=..."
  const parts  = xSignatureHeader.split(",");
  const tsPart = parts.find((p) => p.startsWith("ts="));
  const v1Part = parts.find((p) => p.startsWith("v1="));

  if (!tsPart || !v1Part)  return { valid: false, reason: "malformed_x_signature_header" };

  const ts = tsPart.split("=")[1];
  const v1 = v1Part.split("=")[1];

  if (!ts || !v1) return { valid: false, reason: "empty_ts_or_v1" };

  // 3. Tolerância de 5 minutos — proteção contra replay attacks
  const webhookTimestamp = parseInt(ts, 10);
  const now = Math.floor(Date.now() / 1000);
  const TOLERANCE_SECONDS = 300;

  if (Math.abs(now - webhookTimestamp) > TOLERANCE_SECONDS) {
    return { valid: false, reason: "timestamp_too_old" };
  }

  // 4. Montar a string exatamente como o MP faz
  const signatureTemplate = `id:${paymentId};request-id:${xRequestId};ts:${ts};`;

  // 5. Recalcular HMAC-SHA256
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signatureTemplate)
    .digest("hex");

  // 6. Comparação em tempo constante — previne timing attacks
  try {
    const expectedBuffer = Buffer.from(expectedSignature, "hex");
    const receivedBuffer  = Buffer.from(v1, "hex");

    if (expectedBuffer.length !== receivedBuffer.length) {
      return { valid: false, reason: "signature_length_mismatch" };
    }

    const isValid = crypto.timingSafeEqual(expectedBuffer, receivedBuffer);
    return isValid ? { valid: true } : { valid: false, reason: "signature_mismatch" };
  } catch {
    return { valid: false, reason: "signature_parse_error" };
  }
}

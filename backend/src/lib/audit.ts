import { Request } from "express";
import prisma from "./prisma";

/**
 * Registra uma ação na trilha de auditoria (audit_logs).
 * Serializa todos os metadados extras no campo `details` (JSON string)
 * para compatibilidade com o schema atual do AuditLog.
 *
 * Esta função NUNCA lança erros para não interromper o fluxo principal.
 */
export async function audit(
  req: Request,
  action: string,
  entityType: string,
  entityId?: string | string[],
  oldValue?: any,
  newValue?: any
) {
  try {
    const authReq = req as any; // Cast para acessar .user injetado pelo auth middleware
    const userId = authReq.user?.userId || null;
    const userEmail = authReq.user?.email || null;
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0].trim() || req.ip || null;
    const safeEntityId = entityId ? String(entityId) : null;

    // Serializa todos os campos extras em `details` (schema atual tem só esse campo)
    const details = JSON.stringify({
      entityType,
      entityId: safeEntityId,
      userEmail,
      ip,
      ...(oldValue !== null && oldValue !== undefined ? { oldValue } : {}),
      ...(newValue !== null && newValue !== undefined ? { newValue } : {}),
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action,
        details,
      },
    });

    if (process.env.NODE_ENV !== "production") {
      console.log(
        `[AUDIT] ${action} on ${entityType} (${safeEntityId || "N/A"}) by ${userEmail || "anonymous"} [${ip}]`
      );
    }
  } catch (err) {
    // Silencia o erro de auditoria — nunca deve quebrar o fluxo principal
    console.error("[AUDIT ERROR] Falha ao registrar log de auditoria:", err);
  }
}

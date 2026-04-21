import prisma from "./prisma";

/**
 * Utilitário de log de auditoria para o sistema Foto Segundo
 */
export const logger = {
  /**
   * Registra uma ação importante no sistema
   */
  async info(userId: string | null | undefined, action: string, details?: any) {
    try {
      const detailsStr = typeof details === "object" ? JSON.stringify(details) : String(details || "");
      
      await prisma.auditLog.create({
        data: {
          userId: userId || null,
          action,
          details: detailsStr,
        },
      });
      
      console.log(`[Audit] ${action}${userId ? ` (User: ${userId})` : ""}: ${detailsStr}`);
    } catch (err) {
      console.error("[Audit Error] Falha ao registrar log:", err);
    }
  },

  /**
   * Abreviação para ações de segurança (Logins, Erros de Auth)
   */
  async security(action: string, details?: any) {
    return this.info(null, `SECURITY_${action}`, details);
  }
};

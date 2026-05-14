import { prisma } from "../lib/prisma";
import { EmailService } from "./email.service";

export class VaultBlockingService {
  /**
   * Processa todos os cofres que estão em TRIAL.
   * Bloqueia os vencidos e notifica os que estão próximos do vencimento.
   */
  static async processExpiringVaults() {
    console.log(`[VaultBlockingService] Iniciando processamento de cofres expirando...`);

    const now = new Date();
    
    // Buscar todos os vaults em TRIAL que possuem trialEndsAt
    const vaults = await prisma.sharedAlbum.findMany({
      where: {
        subscriptionStatus: "TRIAL",
        trialEndsAt: { not: null },
      },
      include: {
        owner: {
          select: { email: true }
        }
      }
    });

    console.log(`[VaultBlockingService] Encontrados ${vaults.length} cofres em período de TRIAL.`);

    let blockedCount = 0;
    let warnedCount = 0;

    for (const vault of vaults) {
      if (!vault.trialEndsAt) continue;

      const timeDiff = vault.trialEndsAt.getTime() - now.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      // 1. Bloquear se já expirou (daysLeft <= 0)
      if (daysLeft <= 0) {
        await prisma.sharedAlbum.update({
          where: { id: vault.id },
          data: { subscriptionStatus: "BLOCKED" }
        });
        
        await EmailService.sendVaultBlocked(vault.owner.email, vault.nome, vault.id);
        console.log(`[VaultBlockingService] Cofre ${vault.id} bloqueado. Email enviado para ${vault.owner.email}.`);
        blockedCount++;
      }
      
      // 2. Avisar D-5
      else if (daysLeft === 5) {
        await EmailService.sendVaultExpiryWarning(vault.owner.email, vault.nome, 5, vault.id);
        console.log(`[VaultBlockingService] Aviso D-5 enviado para cofre ${vault.id}.`);
        warnedCount++;
      }
      
      // 3. Avisar D-1
      else if (daysLeft === 1) {
        await EmailService.sendVaultExpiryWarning(vault.owner.email, vault.nome, 1, vault.id);
        console.log(`[VaultBlockingService] Aviso D-1 enviado para cofre ${vault.id}.`);
        warnedCount++;
      }
    }

    console.log(`[VaultBlockingService] Finalizado. Bloqueados: ${blockedCount} | Avisos: ${warnedCount}`);
  }
}

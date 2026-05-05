import { VaultCycleService } from "../services/vaultCycle.service";

/**
 * JOB: vault-cycle
 * Frequência sugerida: Diário (0 0 * * *)
 * Objetivo: Identificar assinaturas que completaram o ciclo de 30 dias e disparar a materialização.
 */
export async function runVaultCycleJob() {
  const now = new Date();
  console.log(`[JOB: vault-cycle] Iniciando execução em ${now.toISOString()}`);
  
  try {
    await VaultCycleService.processAllDueSubscriptions();
    console.log(`[JOB: vault-cycle] Execução concluída com sucesso.`);
  } catch (err) {
    console.error(`[JOB: vault-cycle] Falha crítica na execução do job:`, err);
  }
}

// Se rodado diretamente via script
if (require.main === module) {
  runVaultCycleJob();
}

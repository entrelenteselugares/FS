/**
 * Utilitário para retentativas de operações assíncronas (ex: queries ao banco).
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delay: number = 1000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    
    const isConnectionError = 
      error instanceof Error && 
      (error.message.includes('timeout') || 
       error.message.includes('connection') || 
       error.message.includes('EAUTHTIMEOUT') ||
       error.message.includes('08006'));

    if (isConnectionError) {
      console.warn(`[RETRY] Falha de conexão detectada. Tentando novamente em ${delay}ms... (${retries} restantes)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    
    throw error;
  }
}

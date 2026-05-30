/**
 * Deadline Guardian — previne estouro de timeout em ambientes serverless.
 * 
 * Vercel Pro: limite de 60s por função HTTP.
 * Nós guardamos 10s de margem para flush de logs e resposta HTTP.
 * Tudo que exceder esse tempo é ignorado e deixado para a próxima execução.
 */
export class Deadline {
  private readonly startedAt: number;
  private readonly limitMs: number;

  /**
   * @param maxSeconds tempo máximo de execução em segundos (default: 50 — 10s de margem sobre o limite de 60s da Vercel Pro)
   */
  constructor(maxSeconds = 50) {
    this.startedAt = Date.now();
    this.limitMs = maxSeconds * 1000;
  }

  /** Retorna true se ainda estamos dentro do janela segura de execução */
  ok(): boolean {
    return Date.now() - this.startedAt < this.limitMs;
  }

  /** Milissegundos decorridos desde o início */
  elapsed(): number {
    return Date.now() - this.startedAt;
  }

  /** Tempo restante em milissegundos */
  remaining(): number {
    return Math.max(0, this.limitMs - this.elapsed());
  }

  /** Formata o tempo decorrido para logging */
  elapsedStr(): string {
    return `${(this.elapsed() / 1000).toFixed(1)}s`;
  }
}

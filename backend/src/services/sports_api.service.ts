/**
 * Serviço responsável por integrar com APIs especializadas de Esportes 
 * (ex: API-Football, Sportmonks).
 * 
 * Atualmente em MOCK MODE para facilitar os testes da UI.
 */
export class SportsApiService {
  // Simula um delay de rede
  private async delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Retorna os jogos acontecendo "Agora" ou no Dia atual.
   * Modifica os minutos passados aleatoriamente para simular andamento.
   */
  async getLiveMatches() {
    await this.delay(300);
    
    // Simulando que o primeiro jogo está rolando (minutos passando)
    const minutes = new Date().getMinutes() + 15; // De 15 a 74 mins simulado
    const status = minutes > 90 ? "FINISHED" : "LIVE";

    return [
      {
        id: "live-1",
        homeTeam: { name: "Brasil", flagUrl: "https://flagcdn.com/w40/br.png", score: 2 },
        awayTeam: { name: "Sérvia", flagUrl: "https://flagcdn.com/w40/rs.png", score: 0 },
        minute: status === "LIVE" ? `${minutes}'` : "Fim",
        status: status,
      },
      {
        id: "live-2",
        homeTeam: { name: "França", flagUrl: "https://flagcdn.com/w40/fr.png", score: 1 },
        awayTeam: { name: "Dinamarca", flagUrl: "https://flagcdn.com/w40/dk.png", score: 1 },
        minute: "Intervalo",
        status: "HALF_TIME",
      },
      {
        id: "live-3",
        homeTeam: { name: "Argentina", flagUrl: "https://flagcdn.com/w40/ar.png", score: 0 },
        awayTeam: { name: "México", flagUrl: "https://flagcdn.com/w40/mx.png", score: 0 },
        minute: "16:00",
        status: "SCHEDULED",
      }
    ];
  }

  /**
   * Retorna o chaveamento (Bracket) a partir das Oitavas de final.
   */
  async getTournamentBracket() {
    await this.delay(500);

    return {
      roundOf16: [
        { id: "r16-1", home: "Holanda", away: "EUA", score: "3-1", status: "FINISHED" },
        { id: "r16-2", home: "Argentina", away: "Austrália", score: "2-1", status: "FINISHED" },
        { id: "r16-3", home: "Japão", away: "Croácia", score: "1(1)-(3)1", status: "FINISHED" },
        { id: "r16-4", home: "Brasil", away: "Coreia do Sul", score: "4-1", status: "FINISHED" },
        { id: "r16-5", home: "Inglaterra", away: "Senegal", score: "3-0", status: "FINISHED" },
        { id: "r16-6", home: "França", away: "Polônia", score: "3-1", status: "FINISHED" },
        { id: "r16-7", home: "Marrocos", away: "Espanha", score: "0(3)-(0)0", status: "FINISHED" },
        { id: "r16-8", home: "Portugal", away: "Suíça", score: "6-1", status: "FINISHED" },
      ],
      quarterFinals: [
        { id: "qf-1", home: "Holanda", away: "Argentina", score: "2(3)-(4)2", status: "FINISHED" },
        { id: "qf-2", home: "Croácia", away: "Brasil", score: "1(4)-(2)1", status: "FINISHED" },
        { id: "qf-3", home: "Inglaterra", away: "França", score: "1-2", status: "FINISHED" },
        { id: "qf-4", home: "Marrocos", away: "Portugal", score: "1-0", status: "FINISHED" },
      ],
      semiFinals: [
        { id: "sf-1", home: "Argentina", away: "Croácia", score: "3-0", status: "FINISHED" },
        { id: "sf-2", home: "França", away: "Marrocos", score: "2-0", status: "FINISHED" },
      ],
      final: [
        { id: "f-1", home: "Argentina", away: "França", score: "3(4)-(2)3", status: "FINISHED" }
      ]
    };
  }
}

export const sportsApiService = new SportsApiService();

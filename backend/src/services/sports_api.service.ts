import axios from "axios";

const API_KEY = process.env.SPORTS_API_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

// Copa do Mundo 2026 — League ID na API-Football
// ID 1 = FIFA World Cup
const WORLD_CUP_LEAGUE_ID = 1;
const WORLD_CUP_SEASON = 2026;

// ─── Types ────────────────────────────────────────────────────────────────────

interface LiveMatch {
  id: string;
  homeTeam: { name: string; flagUrl: string; score: number };
  awayTeam: { name: string; flagUrl: string; score: number };
  minute: string;
  status: "LIVE" | "HALF_TIME" | "FINISHED" | "SCHEDULED";
}

interface BracketMatch {
  id: string;
  home: string;
  away: string;
  score: string;
  status: "FINISHED" | "LIVE" | "SCHEDULED";
}

interface BracketData {
  roundOf16: BracketMatch[];
  quarterFinals: BracketMatch[];
  semiFinals: BracketMatch[];
  final: BracketMatch[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const isMockMode = () => !API_KEY;

const apiHeaders = () => ({
  "x-apisports-key": API_KEY!,
  "Content-Type": "application/json",
});

function mapStatus(
  shortStatus: string
): "LIVE" | "HALF_TIME" | "FINISHED" | "SCHEDULED" {
  if (["1H", "2H", "ET", "P"].includes(shortStatus)) return "LIVE";
  if (shortStatus === "HT") return "HALF_TIME";
  if (["FT", "AET", "PEN"].includes(shortStatus)) return "FINISHED";
  return "SCHEDULED";
}

function formatScore(
  home: number | null,
  away: number | null,
  penHome?: number | null,
  penAway?: number | null
): string {
  if (home === null || away === null) return "-";
  if (penHome != null && penAway != null) {
    return `${home}(${penHome})-(${penAway})${away}`;
  }
  return `${home}-${away}`;
}

// Round name mapping from API-Football to our bracket keys
const ROUND_MAP: Record<string, keyof BracketData> = {
  "Round of 16": "roundOf16",
  "Quarter-finals": "quarterFinals",
  "Semi-finals": "semiFinals",
  "Final": "final",
};

// ─── Mock Data (used when API key is not configured) ─────────────────────────

function getMockLiveMatches(): LiveMatch[] {
  const minutes = (new Date().getMinutes() + 15) % 90;
  return [
    {
      id: "mock-live-1",
      homeTeam: { name: "Brasil", flagUrl: "https://flagcdn.com/w40/br.png", score: 2 },
      awayTeam: { name: "Sérvia", flagUrl: "https://flagcdn.com/w40/rs.png", score: 0 },
      minute: `${minutes}'`,
      status: "LIVE",
    },
    {
      id: "mock-live-2",
      homeTeam: { name: "França", flagUrl: "https://flagcdn.com/w40/fr.png", score: 1 },
      awayTeam: { name: "Dinamarca", flagUrl: "https://flagcdn.com/w40/dk.png", score: 1 },
      minute: "Intervalo",
      status: "HALF_TIME",
    },
    {
      id: "mock-live-3",
      homeTeam: { name: "Argentina", flagUrl: "https://flagcdn.com/w40/ar.png", score: 0 },
      awayTeam: { name: "México", flagUrl: "https://flagcdn.com/w40/mx.png", score: 0 },
      minute: "16:00",
      status: "SCHEDULED",
    },
  ];
}

function getMockBracket(): BracketData {
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
      { id: "f-1", home: "Argentina", away: "França", score: "3(4)-(2)3", status: "FINISHED" },
    ],
  };
}

// ─── Live cache (60s TTL to respect API rate limits) ─────────────────────────

let liveCache: { data: LiveMatch[]; ts: number } | null = null;
let bracketCache: { data: BracketData; ts: number } | null = null;
const CACHE_TTL_MS = 60_000;

// ─── Service ─────────────────────────────────────────────────────────────────

export class SportsApiService {
  /**
   * Retorna os placares ao vivo.
   * Se SPORTS_API_KEY não estiver configurada, usa mock.
   */
  async getLiveMatches(): Promise<LiveMatch[]> {
    if (isMockMode()) return getMockLiveMatches();

    // Cache hit
    if (liveCache && Date.now() - liveCache.ts < CACHE_TTL_MS) {
      return liveCache.data;
    }

    try {
      const { data } = await axios.get(`${BASE_URL}/fixtures`, {
        headers: apiHeaders(),
        params: {
          live: "all",
          league: WORLD_CUP_LEAGUE_ID,
          season: WORLD_CUP_SEASON,
        },
        timeout: 8000,
      });

      const matches: LiveMatch[] = (data.response ?? []).map((f: any) => {
        const status = mapStatus(f.fixture.status.short);
        const minute =
          status === "LIVE"
            ? `${f.fixture.status.elapsed}'`
            : status === "HALF_TIME"
            ? "Intervalo"
            : new Date(f.fixture.date).toLocaleTimeString("pt-BR", {
                hour: "2-digit",
                minute: "2-digit",
              });

        return {
          id: String(f.fixture.id),
          homeTeam: {
            name: f.teams.home.name,
            flagUrl: f.teams.home.logo,
            score: f.goals.home ?? 0,
          },
          awayTeam: {
            name: f.teams.away.name,
            flagUrl: f.teams.away.logo,
            score: f.goals.away ?? 0,
          },
          minute,
          status,
        };
      });

      // If no live matches, show today's scheduled
      if (matches.length === 0) {
        return this.getTodayMatches();
      }

      liveCache = { data: matches, ts: Date.now() };
      return matches;
    } catch (err) {
      console.error("[SportsApiService] getLiveMatches error:", err);
      // Fallback to mock on API error
      return getMockLiveMatches();
    }
  }

  /**
   * Busca jogos do dia atual (para mostrar quando não há partidas ao vivo)
   */
  private async getTodayMatches(): Promise<LiveMatch[]> {
    const today = new Date().toISOString().split("T")[0];
    try {
      const { data } = await axios.get(`${BASE_URL}/fixtures`, {
        headers: apiHeaders(),
        params: {
          league: WORLD_CUP_LEAGUE_ID,
          season: WORLD_CUP_SEASON,
          date: today,
        },
        timeout: 8000,
      });

      return (data.response ?? []).map((f: any) => ({
        id: String(f.fixture.id),
        homeTeam: {
          name: f.teams.home.name,
          flagUrl: f.teams.home.logo,
          score: f.goals.home ?? 0,
        },
        awayTeam: {
          name: f.teams.away.name,
          flagUrl: f.teams.away.logo,
          score: f.goals.away ?? 0,
        },
        minute: new Date(f.fixture.date).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        status: mapStatus(f.fixture.status.short),
      }));
    } catch {
      return [];
    }
  }

  /**
   * Retorna o chaveamento da Copa (Oitavas → Final).
   * Se SPORTS_API_KEY não estiver configurada, usa mock.
   */
  async getTournamentBracket(): Promise<BracketData> {
    if (isMockMode()) return getMockBracket();

    // Cache hit
    if (bracketCache && Date.now() - bracketCache.ts < CACHE_TTL_MS) {
      return bracketCache.data;
    }

    try {
      const { data } = await axios.get(`${BASE_URL}/fixtures`, {
        headers: apiHeaders(),
        params: {
          league: WORLD_CUP_LEAGUE_ID,
          season: WORLD_CUP_SEASON,
          from: `${WORLD_CUP_SEASON}-06-01`,
          to: `${WORLD_CUP_SEASON}-07-31`,
        },
        timeout: 10000,
      });

      const bracket: BracketData = {
        roundOf16: [],
        quarterFinals: [],
        semiFinals: [],
        final: [],
      };

      for (const f of data.response ?? []) {
        const round: string = f.league.round ?? "";
        const key = ROUND_MAP[round];
        if (!key) continue;

        const status = mapStatus(f.fixture.status.short);
        const score = formatScore(
          f.goals.home,
          f.goals.away,
          f.score.penalty?.home,
          f.score.penalty?.away
        );

        bracket[key].push({
          id: String(f.fixture.id),
          home: f.teams.home.name,
          away: f.teams.away.name,
          score,
          status,
        });
      }

      // Fallback to mock if API returned empty bracket
      const total = Object.values(bracket).reduce((s, a) => s + a.length, 0);
      if (total === 0) {
        console.warn("[SportsApiService] Bracket empty — using mock data");
        return getMockBracket();
      }

      bracketCache = { data: bracket, ts: Date.now() };
      return bracket;
    } catch (err) {
      console.error("[SportsApiService] getTournamentBracket error:", err);
      return getMockBracket();
    }
  }
}

export const sportsApiService = new SportsApiService();

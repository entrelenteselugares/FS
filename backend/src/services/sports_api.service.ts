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
  status: "FINISHED" | "LIVE" | "HALF_TIME" | "SCHEDULED";
  homeFlag?: string;
  awayFlag?: string;
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

// ─── Real 2026 World Cup Schedule (1st Round) ────────────────────────────────
// All dates/times in UTC. Brasília = UTC-3.
const COPA_2026_FIXTURES: Array<{
  id: string; group: string; home: string; homeFlag: string;
  away: string; awayFlag: string; utcDate: string; venue: string;
}> = [
  // 11 Jun
  { id: "c26-1",  group:"A", home:"México",       homeFlag:"mx", away:"África do Sul", awayFlag:"za", utcDate:"2026-06-11T19:00:00Z", venue:"Azteca, México" },
  { id: "c26-2",  group:"A", home:"Coreia do Sul", homeFlag:"kr", away:"Tchéquia",     awayFlag:"cz", utcDate:"2026-06-12T02:00:00Z", venue:"SoFi Stadium" },
  // 12 Jun
  { id: "c26-3",  group:"B", home:"Canadá",        homeFlag:"ca", away:"Bósnia-Herz.", awayFlag:"ba", utcDate:"2026-06-12T19:00:00Z", venue:"BMO Field, Toronto" },
  { id: "c26-4",  group:"D", home:"EUA",            homeFlag:"us", away:"Paraguai",    awayFlag:"py", utcDate:"2026-06-13T01:00:00Z", venue:"MetLife Stadium" },
  // 13 Jun
  { id: "c26-5",  group:"D", home:"Austrália",      homeFlag:"au", away:"Turquia",     awayFlag:"tr", utcDate:"2026-06-13T04:00:00Z", venue:"AT&T Stadium" },
  { id: "c26-6",  group:"B", home:"Catar",          homeFlag:"qa", away:"Suíça",       awayFlag:"ch", utcDate:"2026-06-13T19:00:00Z", venue:"Arrowhead Stadium" },
  { id: "c26-7",  group:"C", home:"Brasil",         homeFlag:"br", away:"Marrocos",    awayFlag:"ma", utcDate:"2026-06-13T22:00:00Z", venue:"MetLife Stadium" },
  { id: "c26-8",  group:"C", home:"Haiti",          homeFlag:"ht", away:"Escócia",     awayFlag:"gb-sct", utcDate:"2026-06-14T01:00:00Z", venue:"Gillette Stadium" },
  // 14 Jun
  { id: "c26-9",  group:"E", home:"Alemanha",       homeFlag:"de", away:"Curaçao",     awayFlag:"cw", utcDate:"2026-06-14T17:00:00Z", venue:"Cowboys Stadium" },
  { id: "c26-10", group:"E", home:"Costa do Marfim",homeFlag:"ci", away:"Equador",     awayFlag:"ec", utcDate:"2026-06-14T23:00:00Z", venue:"Rose Bowl" },
  { id: "c26-11", group:"F", home:"Holanda",        homeFlag:"nl", away:"Japão",       awayFlag:"jp", utcDate:"2026-06-14T20:00:00Z", venue:"Lincoln Fin. Field" },
  { id: "c26-12", group:"F", home:"Suécia",         homeFlag:"se", away:"Tunísia",     awayFlag:"tn", utcDate:"2026-06-15T02:00:00Z", venue:"Levi's Stadium" },
  // 15 Jun
  { id: "c26-13", group:"H", home:"Espanha",        homeFlag:"es", away:"Cabo Verde",  awayFlag:"cv", utcDate:"2026-06-15T16:00:00Z", venue:"Hard Rock Stadium" },
  { id: "c26-14", group:"G", home:"Bélgica",        homeFlag:"be", away:"Egito",       awayFlag:"eg", utcDate:"2026-06-15T19:00:00Z", venue:"Arrowhead Stadium" },
  { id: "c26-15", group:"H", home:"Arábia Saudita", homeFlag:"sa", away:"Uruguai",     awayFlag:"uy", utcDate:"2026-06-15T22:00:00Z", venue:"MetLife Stadium" },
  { id: "c26-16", group:"G", home:"Irã",            homeFlag:"ir", away:"Nova Zelândia",awayFlag:"nz", utcDate:"2026-06-16T01:00:00Z", venue:"SoFi Stadium" },
  // 16 Jun
  { id: "c26-17", group:"I", home:"França",         homeFlag:"fr", away:"Senegal",     awayFlag:"sn", utcDate:"2026-06-16T19:00:00Z", venue:"MetLife Stadium" },
  { id: "c26-18", group:"I", home:"Iraque",         homeFlag:"iq", away:"Noruega",     awayFlag:"no", utcDate:"2026-06-16T22:00:00Z", venue:"SoFi Stadium" },
  { id: "c26-19", group:"J", home:"Argentina",      homeFlag:"ar", away:"Argélia",     awayFlag:"dz", utcDate:"2026-06-17T01:00:00Z", venue:"AT&T Stadium" },
];

function flagUrl(code: string): string {
  return `https://flagcdn.com/w40/${code}.png`;
}

/**
 * Picks the best matches to show on the banner:
 * - If any match is happening right now (within ±10 min window of utcDate): show as LIVE (mock)
 * - Otherwise: show the next 3 upcoming matches
 */
function getMockLiveMatches(): LiveMatch[] {
  const now = Date.now();
  const WINDOW_MS = 120 * 60 * 1000; // 2h window = simulates match duration

  // Find matches happening "now"
  const live = COPA_2026_FIXTURES.filter((f) => {
    const start = new Date(f.utcDate).getTime();
    return now >= start && now <= start + WINDOW_MS;
  });

  if (live.length > 0) {
    return live.map((f) => {
      const elapsed = Math.floor((now - new Date(f.utcDate).getTime()) / 60000);
      const isHalf = elapsed >= 45 && elapsed < 50;
      return {
        id: f.id,
        homeTeam: { name: f.home, flagUrl: flagUrl(f.homeFlag), score: 0 },
        awayTeam: { name: f.away, flagUrl: flagUrl(f.awayFlag), score: 0 },
        minute: isHalf ? "Intervalo" : `${Math.min(elapsed, 90)}'`,
        status: isHalf ? "HALF_TIME" : "LIVE",
      };
    });
  }

  // No live match — show next 3 upcoming fixtures
  const upcoming = COPA_2026_FIXTURES
    .filter((f) => new Date(f.utcDate).getTime() > now)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
    .slice(0, 3);

  // If Copa hasn't started at all, show first 3 fixtures
  const toShow = upcoming.length > 0 ? upcoming : COPA_2026_FIXTURES.slice(0, 3);

  return toShow.map((f) => ({
    id: f.id,
    homeTeam: { name: f.home, flagUrl: flagUrl(f.homeFlag), score: 0 },
    awayTeam: { name: f.away, flagUrl: flagUrl(f.awayFlag), score: 0 },
    minute: new Date(f.utcDate).toLocaleDateString("pt-BR", {
      day: "2-digit", month: "2-digit", timeZone: "America/Sao_Paulo",
    }) + " " + new Date(f.utcDate).toLocaleTimeString("pt-BR", {
      hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo",
    }),
    status: "SCHEDULED" as const,
  }));
}


function getMockBracket(): BracketData {
  // Mock bracket for demonstration purposes
  const tbd = (id: string, home: string, away: string, homeFlag: string, awayFlag: string) => ({
    id, home, away, score: "-", status: "SCHEDULED" as const,
    homeFlag: flagUrl(homeFlag), awayFlag: flagUrl(awayFlag)
  });
  return {
    roundOf16: [
      tbd("r32-1",  "Brasil", "Uruguai", "br", "uy"),
      tbd("r32-2",  "Espanha", "Alemanha", "es", "de"),
      tbd("r32-3",  "França", "Inglaterra", "fr", "gb-eng"),
      tbd("r32-4",  "Holanda", "Bélgica", "nl", "be"),
      tbd("r32-5",  "Argentina", "Chile", "ar", "cl"),
      tbd("r32-6",  "Itália", "Portugal", "it", "pt"),
      tbd("r32-7",  "EUA", "México", "us", "mx"),
      tbd("r32-8",  "Japão", "Croácia", "jp", "hr"),
    ],
    quarterFinals: [
      tbd("qf-1", "Brasil", "Espanha", "br", "es"),
      tbd("qf-2", "França", "Holanda", "fr", "nl"),
      tbd("qf-3", "Argentina", "Itália", "ar", "it"),
      tbd("qf-4", "EUA", "Japão", "us", "jp"),
    ],
    semiFinals: [
      tbd("sf-1", "Brasil", "França", "br", "fr"),
      tbd("sf-2", "Argentina", "Japão", "ar", "jp"),
    ],
    final: [
      tbd("final", "Brasil", "Argentina", "br", "ar"),
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
          homeFlag: f.teams.home.logo,
          away: f.teams.away.name,
          awayFlag: f.teams.away.logo,
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

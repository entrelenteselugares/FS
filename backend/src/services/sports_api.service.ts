import axios from "axios";
import { getCache, setCache } from "../lib/redis";

const MANUAL_SCORE_KEY_PREFIX = "wc2026:score:";
const API_KEY = process.env.ZAFRONIX_API_KEY || "zwc_free_754f260bc1577e92516c7764";

const BASE_URL = "https://api.zafronix.com/fifa/worldcup/v1";
const YEAR = 2026; // Usando os dados corretos de 2026 da Zafronix

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

const apiHeaders = () => ({
  "X-API-Key": API_KEY,
  "Content-Type": "application/json",
});

function getFlagUrl(isoOrName: string, refOrPlaceholder: string): string {
  if (isoOrName && isoOrName.length === 2) {
    return `https://flagcdn.com/w40/${isoOrName.toLowerCase()}.png`;
  }
  // Fallback para nomes de países
  const map: Record<string, string> = {
    "Mexico": "mx", "South Africa": "za", "Korea Republic": "kr", "Czechia": "cz",
    "Canada": "ca", "Bosnia and Herzegovina": "ba", "USA": "us", "Paraguay": "py",
    "Australia": "au", "Türkiye": "tr", "Brazil": "br", "Morocco": "ma",
    "Haiti": "ht", "Scotland": "gb-sct", "Germany": "de", "Curaçao": "cw",
    "Netherlands": "nl", "Japan": "jp", "Sweden": "se", "Tunisia": "tn",
    "Spain": "es", "Cabo Verde": "cv", "Saudi Arabia": "sa", "Uruguay": "uy",
    "Belgium": "be", "Egypt": "eg", "IR Iran": "ir", "New Zealand": "nz",
    "France": "fr", "Senegal": "sn", "Iraq": "iq", "Norway": "no",
    "Argentina": "ar", "Algeria": "dz", "Austria": "at", "Jordan": "jo",
    "Ghana": "gh", "Panama": "pa", "England": "gb-eng", "Croatia": "hr",
    "Portugal": "pt", "Congo DR": "cd", "Uzbekistan": "uz", "Colombia": "co"
  };
  const iso = map[isoOrName] || map[refOrPlaceholder];
  if (iso) return `https://flagcdn.com/w40/${iso}.png`;
  
  // Se não tem time definido (ex: "W73"), retorna uma interrogação ou flag transparente
  return "https://upload.wikimedia.org/wikipedia/commons/5/5a/Transparent_flag.png";
}

// ─── Fetching Data ────────────────────────────────────────────────────────────────

async function fetchZafronixMatches() {
  const cacheKey = `zafronix:matches:${YEAR}`;
  const cached = await getCache(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  try {
    const { data } = await axios.get(`${BASE_URL}/matches`, {
      headers: apiHeaders(),
      params: { year: YEAR },
      timeout: 10000,
    });
    
    await setCache(cacheKey, JSON.stringify(data.data || []), 3600); // 1h cache
    return data.data || [];
  } catch (err) {
    console.error("[SportsApiService] Error fetching Zafronix:", err);
    return [];
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class SportsApiService {
  
  async getLiveMatches(): Promise<LiveMatch[]> {
    const matches = await fetchZafronixMatches();
    const now = Date.now();
    const WINDOW_MS = 120 * 60 * 1000; // 2h de jogo

    const liveMatches: LiveMatch[] = [];
    const upcomingMatches: any[] = [];
    
    for (const m of matches) {
      const matchTime = new Date(m.kickoffUtc || `${m.date}T${m.kickoff || "12:00"}:00Z`).getTime();
      const isPast = now > matchTime + WINDOW_MS;
      const isLive = now >= matchTime && now <= matchTime + WINDOW_MS;
      
      const homeName = m.homeTeam || m.homeRef || "A definir";
      const awayName = m.awayTeam || m.awayRef || "A definir";
      const homeScore = m.homeScore ?? 0;
      const awayScore = m.awayScore ?? 0;

      if (isLive) {
        const elapsed = Math.floor((now - matchTime) / 60000);
        const isHalf = elapsed >= 45 && elapsed < 50;
        liveMatches.push({
          id: m.id,
          homeTeam: { name: homeName, flagUrl: getFlagUrl(m.homeTeam, m.homeRef), score: homeScore },
          awayTeam: { name: awayName, flagUrl: getFlagUrl(m.awayTeam, m.awayRef), score: awayScore },
          minute: m.liveMinute ? `${m.liveMinute}'` : (isHalf ? "Intervalo" : `${Math.min(elapsed, 90)}'`),
          status: m.status === "finished" ? "FINISHED" : (isHalf ? "HALF_TIME" : "LIVE"),
        });
      } else if (!isPast) {
        upcomingMatches.push(m);
      }
    }

    if (liveMatches.length > 0) return liveMatches;

    // Show upcoming
    upcomingMatches.sort((a, b) => {
      const ta = new Date(a.kickoffUtc || `${a.date}T${a.kickoff || "12:00"}:00Z`).getTime();
      const tb = new Date(b.kickoffUtc || `${b.date}T${b.kickoff || "12:00"}:00Z`).getTime();
      return ta - tb;
    });
    
    const toShow = upcomingMatches.slice(0, 3);
    
    if (toShow.length === 0) {
      // Show latest finished matches Se o torneio acabou
      const pastMatches = matches.filter((m: any) => {
        const t = new Date(m.kickoffUtc || `${m.date}T${m.kickoff || "12:00"}:00Z`).getTime();
        return t + WINDOW_MS < now;
      });
      pastMatches.sort((a: any, b: any) => {
        const ta = new Date(a.kickoffUtc || `${a.date}T${a.kickoff || "12:00"}:00Z`).getTime();
        const tb = new Date(b.kickoffUtc || `${b.date}T${b.kickoff || "12:00"}:00Z`).getTime();
        return tb - ta;
      });
      
      return pastMatches.slice(0, 3).map((m: any) => ({
        id: m.id,
        homeTeam: { name: m.homeTeam || m.homeRef, flagUrl: getFlagUrl(m.homeTeam, m.homeRef), score: m.homeScore ?? 0 },
        awayTeam: { name: m.awayTeam || m.awayRef, flagUrl: getFlagUrl(m.awayTeam, m.awayRef), score: m.awayScore ?? 0 },
        minute: "Encerrado",
        status: "FINISHED",
      }));
    }

    return toShow.map((m: any) => {
      const dt = new Date(m.kickoffUtc || `${m.date}T${m.kickoff || "12:00"}:00Z`);
      return {
        id: m.id,
        homeTeam: { name: m.homeTeam || m.homeRef, flagUrl: getFlagUrl(m.homeTeam, m.homeRef), score: m.homeScore ?? 0 },
        awayTeam: { name: m.awayTeam || m.awayRef, flagUrl: getFlagUrl(m.awayTeam, m.awayRef), score: m.awayScore ?? 0 },
        minute: dt.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }) + " " + dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
        status: "SCHEDULED",
      };
    });
  }

  async getTournamentBracket(): Promise<BracketData> {
    const matches = await fetchZafronixMatches();
    const bracket: BracketData = {
      roundOf16: [],
      quarterFinals: [],
      semiFinals: [],
      final: [],
    };

    const ROUND_MAP: Record<string, keyof BracketData> = {
      "round_of_16": "roundOf16", "r16": "roundOf16",
      "quarter_final": "quarterFinals", "qf": "quarterFinals",
      "semi_final": "semiFinals", "sf": "semiFinals",
      "final": "final",
    };

    const now = Date.now();
    const WINDOW_MS = 120 * 60 * 1000;

    for (const m of matches) {
      const stage = m.stageNormalized || m.stage;
      const key = ROUND_MAP[stage];
      if (!key) continue;

      const matchTime = new Date(m.kickoffUtc || `${m.date}T${m.kickoff || "12:00"}:00Z`).getTime();
      let status: BracketMatch["status"] = "SCHEDULED";
      if (now > matchTime + WINDOW_MS) status = "FINISHED";
      else if (now >= matchTime) status = "LIVE";

      let scoreStr = "-";
      if (m.homeScore !== null && m.awayScore !== null) {
        scoreStr = `${m.homeScore}-${m.awayScore}`;
      }

      bracket[key].push({
        id: m.id,
        home: m.homeTeam || m.homeRef,
        away: m.awayTeam || m.awayRef,
        score: scoreStr,
        status,
        homeFlag: getFlagUrl(m.homeTeam, m.homeRef),
        awayFlag: getFlagUrl(m.awayTeam, m.awayRef),
      });
    }

    return bracket;
  }

  async getAllManualScores(): Promise<Record<string, { homeScore: number; awayScore: number }>> {
    const scores: Record<string, { homeScore: number; awayScore: number }> = {};
    const matches = await fetchZafronixMatches();
    const now = Date.now();
    const WINDOW_MS = 120 * 60 * 1000;

    for (const m of matches) {
      const matchTime = new Date(m.kickoffUtc || `${m.date}T${m.kickoff || "12:00"}:00Z`).getTime();
      // Somente manda placar se já passou do inicio
      if (now >= matchTime) {
        if (m.homeScore !== null && m.awayScore !== null) {
          scores[m.id] = { homeScore: m.homeScore, awayScore: m.awayScore };
        }
      }
    }
    
    return scores;
  }
}

export const sportsApiService = new SportsApiService();
export async function setManualScore(fixtureId: string, home: number, away: number): Promise<void> {
  await setCache(`${MANUAL_SCORE_KEY_PREFIX}${fixtureId}`, JSON.stringify({ home, away }), 48 * 3600);
}

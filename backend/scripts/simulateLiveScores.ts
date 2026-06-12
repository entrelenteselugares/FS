import { setManualScore } from "../src/services/sports_api.service";
import redisClient from "../src/lib/redis";

// Mock fixtures
const FIXTURES = [
  { id: "c26-1", utcDate: "2026-06-11T19:00:00Z" },
  { id: "c26-2", utcDate: "2026-06-12T02:00:00Z" },
  { id: "c26-3", utcDate: "2026-06-12T19:00:00Z" },
  { id: "c26-4", utcDate: "2026-06-13T01:00:00Z" },
  { id: "g1", utcDate: "2026-06-11T19:00:00Z" },
  { id: "g2", utcDate: "2026-06-12T02:00:00Z" },
  { id: "g3", utcDate: "2026-06-12T19:00:00Z" }
];

async function run() {
  const now = Date.now();
  for (const f of FIXTURES) {
    if (new Date(f.utcDate).getTime() < now) {
      const home = Math.floor(Math.random() * 4);
      const away = Math.floor(Math.random() * 4);
      console.log(`Simulating score for ${f.id}: ${home} - ${away}`);
      await setManualScore(f.id, home, away);
    }
  }
  console.log("Done.");
  process.exit(0);
}
run();

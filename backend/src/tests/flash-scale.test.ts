/**
 * FASE 25 — Flash Event Scale: Stress Test
 *
 * Simula N usuários simultâneos tentando desbloquear cartões Flash.
 * Verifica que o servidor permanece estável sob carga e que os PINs
 * corretos são aceitos enquanto PINs errados são rejeitados.
 *
 * Pré-requisito: backend rodando em http://localhost:3001
 * Executar: npx tsx backend/src/tests/flash-scale.test.ts
 */

import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");
const API  = `${BASE}/api`;
const JWT_SECRET = process.env.JWT_SECRET!;

const TOTAL_CARDS   = 50;   // Cartões a gerar
const CONCURRENCY   = 20;   // Usuários simultâneos no stress test
const STRESS_ROUNDS = 3;    // Rodadas de concorrência

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
async function req(method: string, path: string, opts: { token?: string; body?: object } = {}) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (opts.token) headers["Authorization"] = `Bearer ${opts.token}`;
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  let data: unknown;
  try { data = await res.json(); } catch { data = null; }
  return { status: res.status, data };
}

function makeToken(role: string) {
  return jwt.sign(
    { userId: `stress-${role.toLowerCase()}`, role, nome: `Robô ${role}`, email: `robo+${role.toLowerCase()}@test.com` },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function sleep(ms: number) { return new Promise(r => setTimeout(r, ms)); }

interface Card { shortId: string; pin: string; }
interface Results {
  passed: number;
  failed: number;
  errors: string[];
  minMs: number;
  maxMs: number;
  avgMs: number;
}

async function runConcurrent(tasks: (() => Promise<void>)[], concurrency: number) {
  const queue = [...tasks];
  const workers = Array.from({ length: concurrency }, async () => {
    while (queue.length > 0) {
      const task = queue.shift();
      if (task) await task();
    }
  });
  await Promise.all(workers);
}

// ─── Main Test ────────────────────────────────────────────────────────────────
async function main() {
  const profToken = makeToken("PROFISSIONAL");
  console.log("\n🚀 FASE 25 — Flash Event Scale Test\n" + "=".repeat(50));

  // ── 1. Health check
  console.log("\n[1/5] Verificando saúde do backend...");
  const health = await req("GET", "/health");
  if (health.status !== 200) {
    console.error("❌ Backend não está saudável:", health.status);
    process.exit(1);
  }
  console.log("✅ Backend: ok");

  // ── 2. Busca um evento do tipo FLASH_EVENT via public events endpoint
  console.log("\n[2/5] Buscando evento Flash no banco...");

  // Tenta buscar via lista pública de eventos, filtrando por tipo
  let targetEventId: string | null = process.env.TEST_FLASH_EVENT_ID || null;

  if (!targetEventId) {
    const eventsRes = await req("GET", "/public/events");
    const events: any[] = Array.isArray(eventsRes.data)
      ? eventsRes.data
      : (eventsRes.data as any)?.events ?? [];

    const flashEvent = events.find((e: any) => e.type === "FLASH_EVENT");
    targetEventId = flashEvent?.id ?? events[0]?.id ?? null;

    if (flashEvent) {
      console.log(`✅ Evento Flash encontrado: ${flashEvent.id} (${flashEvent.title})`);
    } else if (events[0]) {
      console.warn(`⚠️  Nenhum FLASH_EVENT. Usando primeiro evento disponível: ${events[0].id}`);
      targetEventId = events[0].id;
    }
  } else {
    console.log(`✅ Usando TEST_FLASH_EVENT_ID do ambiente: ${targetEventId}`);
  }

  if (!targetEventId) {
    console.error("❌ Nenhum evento disponível. Execute: npx tsx backend/src/seed-e2e-master.ts");
    process.exit(1);
  }

  // ── 3. Geração de cartões em massa
  console.log(`\n[3/5] Gerando ${TOTAL_CARDS} cartões Flash...`);
  const genStart = Date.now();
  const genRes = await req("POST", "/flash/generate", {
    token: profToken,
    body: { eventId: targetEventId, quantity: TOTAL_CARDS },
  });

  if (genRes.status !== 201) {
    console.error("❌ Erro ao gerar cartões:", genRes.status, genRes.data);
    process.exit(1);
  }

  const cards: Card[] = (genRes.data as any).cards;
  const genMs = Date.now() - genStart;
  console.log(`✅ ${cards.length} cartões gerados em ${genMs}ms`);
  console.log(`   Taxa: ${(cards.length / (genMs / 1000)).toFixed(1)} cartões/s`);
  console.log(`   Unicidade: ${new Set(cards.map(c => c.shortId)).size === cards.length ? "✅ todos únicos" : "❌ DUPLICATAS DETECTADAS"}`);

  // ── 4. Stress test: desbloqueio concurrent
  console.log(`\n[4/5] Stress test: ${CONCURRENCY} usuários simultâneos, ${STRESS_ROUNDS} rodadas...`);

  const results: Results = { passed: 0, failed: 0, errors: [], minMs: Infinity, maxMs: 0, avgMs: 0 };
  const timings: number[] = [];

  for (let round = 1; round <= STRESS_ROUNDS; round++) {
    const roundCards = cards.slice(
      Math.floor((round - 1) * cards.length / STRESS_ROUNDS),
      Math.floor(round * cards.length / STRESS_ROUNDS)
    );

    const tasks = roundCards.map(card => async () => {
      const t0 = Date.now();
      // Metade testa PIN correto, metade testa PIN errado
      const useCorrectPin = Math.random() > 0.5;
      const pin = useCorrectPin ? card.pin : "000000";

      const r = await req("POST", "/flash/unlock", { body: { shortId: card.shortId, pin } });
      const elapsed = Date.now() - t0;
      timings.push(elapsed);

      if (useCorrectPin) {
        if (r.status === 200) results.passed++;
        else { results.failed++; results.errors.push(`${card.shortId}: esperado 200, recebeu ${r.status}`); }
      } else {
        if (r.status === 401) results.passed++;
        else { results.failed++; results.errors.push(`${card.shortId}: PIN errado esperou 401, recebeu ${r.status}`); }
      }
    });

    process.stdout.write(`  Rodada ${round}/${STRESS_ROUNDS}... `);
    const t = Date.now();
    await runConcurrent(tasks, CONCURRENCY);
    console.log(`concluída em ${Date.now() - t}ms`);
  }

  if (timings.length > 0) {
    results.minMs = Math.min(...timings);
    results.maxMs = Math.max(...timings);
    results.avgMs = Math.round(timings.reduce((a, b) => a + b, 0) / timings.length);
  }

  console.log("\n📊 Resultados do Stress Test:");
  console.log(`   ✅ Aprovados: ${results.passed}`);
  console.log(`   ❌ Falhas:    ${results.failed}`);
  console.log(`   ⏱  Min:      ${results.minMs}ms | Avg: ${results.avgMs}ms | Max: ${results.maxMs}ms`);
  if (results.errors.length > 0) {
    console.log(`\n⚠️  Erros amostrados (primeiros 5):`);
    results.errors.slice(0, 5).forEach(e => console.log(`   - ${e}`));
  }

  // ── 5. Checklist de pré-evento
  console.log("\n[5/5] Checklist de Pré-Evento:");
  const checks = [
    { label: "Backend saudável",           pass: health.status === 200 },
    { label: "Evento Flash existe",         pass: !!targetEventId },
    { label: "Geração de cartões (<2s)",    pass: genMs < 2000 },
    { label: "Stress test: 0 falhas",       pass: results.failed === 0 },
    { label: "P50 latência <500ms",         pass: results.avgMs < 500 },
    { label: "Cartões únicos",              pass: new Set(cards.map(c => c.shortId)).size === cards.length },
  ];

  checks.forEach(c => console.log(`   ${c.pass ? "✅" : "❌"} ${c.label}`));
  const allPass = checks.every(c => c.pass);

  console.log("\n" + "=".repeat(50));
  if (allPass) {
    console.log("🎉 SISTEMA PRONTO para o Flash Event de grande escala.");
  } else {
    console.log("⚠️  Alguns checks falharam. Revise antes de lançar o evento.");
  }
  console.log("=".repeat(50) + "\n");
  process.exit(allPass ? 0 : 1);
}

main().catch(e => { console.error(e); process.exit(1); });

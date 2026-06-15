/**
 * UAT Script — Fase 74: Segurança e Proteção Financeira
 *
 * Testes cobertos:
 *   Teste 3: Matriz Split Floor (5%)    — lógica pura, sem banco
 *   Teste 4: Escrow Dispute Filter       — via Prisma direto no banco
 *
 * Uso: npx tsx src/scripts/uat-fase74.ts
 */

import { PrismaClient } from "@prisma/client";
import app from "../app";
import { Server } from "http";

const db = new PrismaClient({
  log: ["error"],
});

const PASS = "[PASS]";
const FAIL = "[FAIL]";

// ─────────────────────────────────────────────────────────────────────────────
// TESTE 2: Stress Test Key Security
// Testa o bypass de autenticação na rota de simulação
// ─────────────────────────────────────────────────────────────────────────────
async function runTest2(): Promise<boolean> {
  console.log("\n=== TESTE 2: Stress Test Key Security ===");
  
  const event = await db.event.findFirst({ select: { id: true } });
  if (!event) {
    console.log(`  ${FAIL} Nenhum evento encontrado no banco — seed necessário`);
    return false;
  }

  // Inicia o app temporariamente em uma porta aleatória
  let server: Server;
  const port = await new Promise<number>((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      resolve(typeof addr === "string" ? 0 : addr?.port || 0);
    });
  });

  const baseUrl = `http://localhost:${port}`;
  const payload = {
    eventId: event.id,
    referenceCode: "REF-UAT-003",
    customerName: "UAT Robot"
  };

  try {
    const response = await fetch(`${baseUrl}/api/admin/phygital/simulate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-master-key": process.env.STRESS_TEST_KEY || "DEVELOPMENT_FALLBACK_STRESS_KEY"
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    const ok = status === 201;
    console.log(`  ${ok ? PASS : FAIL} Chave correta → HTTP ${status}`);
    
    if (ok) {
      // Cleanup the generated print so it doesn't pollute the DB
      const result = await response.json();
      if (result.print?.id) {
        await db.phygitalPrint.delete({ where: { id: result.print.id } }).catch(() => {});
      }
    } else {
      const text = await response.text();
      console.log(`    Body: ${text}`);
    }
    
    return ok;
  } catch (err: any) {
    console.log(`  ${FAIL} Erro de rede: ${err.message}`);
    return false;
  } finally {
    if (server) {
      server.close();
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTE 3: Matriz Split Floor — replica lógica do PricingService
// ─────────────────────────────────────────────────────────────────────────────
function calcSplit(
  amount: number,
  captacao: number,
  edicao: number,
  cartorio: number,
  franchisee: number,
  ambassador: number,
  owner: number,
  affiliateL1: number,
  affiliateL2: number
): { matrizRaw: number; matrizFloor: number; ok: boolean; err?: string } {
  const MATRIZ_FLOOR_PCT = 0.05;
  const matrizRaw = +(
    amount - (captacao + edicao + cartorio + franchisee + ambassador + owner + affiliateL1 + affiliateL2)
  ).toFixed(2);
  const matrizFloor = +(amount * MATRIZ_FLOOR_PCT).toFixed(2);

  if (matrizRaw < matrizFloor) {
    return {
      matrizRaw, matrizFloor, ok: false,
      err: `Fatia Matriz (${matrizRaw}) < piso mínimo (${matrizFloor})`,
    };
  }
  return { matrizRaw, matrizFloor, ok: true };
}

async function runTest3(): Promise<boolean> {
  console.log("\n=== TESTE 3: Matriz Split Floor (5%) ===");
  const cases: Array<{ label: string; args: Parameters<typeof calcSplit>; expectOk: boolean }> = [
    {
      label: "Splits = 100% (Matriz = 0%)",
      args: [100, 30, 30, 20, 10, 0, 0, 5, 5],
      expectOk: false, // deve rejeitar
    },
    {
      label: "Splits = 96% (Matriz = 4%)",
      args: [100, 30, 20, 20, 10, 0, 0, 4, 12],
      expectOk: false, // deve rejeitar
    },
    {
      label: "Splits = 90% (Matriz = 10%)",
      args: [100, 30, 20, 20, 10, 0, 0, 5, 5],
      expectOk: true,  // deve aceitar
    },
    {
      label: "Splits = 95% (Matriz = 5%, exatamente no piso)",
      args: [100, 30, 20, 20, 10, 0, 5, 5, 5],
      expectOk: true,  // deve aceitar (piso inclusivo)
    },
  ];

  let allPass = true;
  for (const c of cases) {
    const r = calcSplit(...c.args);
    const pass = r.ok === c.expectOk;
    if (!pass) allPass = false;
    console.log(
      `  ${pass ? PASS : FAIL} ${c.label}` +
      ` | matrizRaw=${r.matrizRaw} piso=${r.matrizFloor}` +
      (r.err ? ` | motivo: ${r.err}` : "")
    );
  }
  return allPass;
}

// ─────────────────────────────────────────────────────────────────────────────
// TESTE 4: Escrow Dispute Filter
// ─────────────────────────────────────────────────────────────────────────────
async function runTest4(): Promise<boolean> {
  console.log("\n=== TESTE 4: Escrow Dispute Filter ===");

  // Pré-requisito: precisa de um Profissional existente no banco
  const profissional = await db.profissional.findFirst({ select: { id: true } });
  if (!profissional) {
    console.log(`  ${FAIL} Nenhum Profissional encontrado no banco — seed necessário`);
    return false;
  }

  let testBookingId: string | null = null;
  let allPass = true;

  try {
    // Cria booking de teste: PAID, hasActiveDispute=true
    const booking = await db.serviceBooking.create({
      data: {
        clienteName:   "UAT Robot",
        clienteEmail:  "uat@foto-segundo.test",
        clientePhone:  "00000000000",
        profissionalId: profissional.id,
        status:        "PAID",
        bookingFee:    200,
        packageDesc:   "UAT Fase 74 — Disputa Ativa",
        hasActiveDispute: true,
      },
    });
    testBookingId = booking.id;
    console.log(`  [setup] Booking criado: ${booking.id}`);

    // Força createdAt para 10 dias atrás via SQL raw
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);
    await db.$executeRaw`UPDATE service_bookings SET "createdAt" = ${tenDaysAgo} WHERE id = ${booking.id}`;
    console.log(`  [setup] createdAt retroagido para ${tenDaysAgo.toISOString().split("T")[0]}`);

    // Simula o filtro do EscrowReleaseJob (exatamente como está no job)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const selected = await db.serviceBooking.findMany({
      where: {
        status: "PAID",
        hasActiveDispute: false,     // <— filtro da Fase 74
        createdAt: { lte: sevenDaysAgo },
      },
      select: { id: true },
    });

    const wasSelected = selected.some((b) => b.id === testBookingId);

    const pass4a = !wasSelected;
    if (!pass4a) allPass = false;
    console.log(
      `  ${pass4a ? PASS : FAIL} Booking com disputa ${pass4a ? "NÃO foi" : "FOI (erro!)"} ` +
      `incluído na fila de release (${selected.length} booking(s) na fila)`
    );

    // Confirma que o status ainda é PAID (o job não foi executado de verdade)
    const current = await db.serviceBooking.findUnique({
      where: { id: testBookingId },
      select: { status: true, hasActiveDispute: true },
    });
    const pass4b = current?.status === "PAID" && current?.hasActiveDispute === true;
    if (!pass4b) allPass = false;
    console.log(
      `  ${pass4b ? PASS : FAIL} Status final: ${current?.status} | hasActiveDispute: ${current?.hasActiveDispute}`
    );

  } finally {
    if (testBookingId) {
      await db.serviceBooking.delete({ where: { id: testBookingId } }).catch(() => {});
      console.log(`  [cleanup] Booking de teste removido`);
    }
  }

  return allPass;
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔═══════════════════════════════════════════════════╗");
  console.log("║  UAT Fase 74 — Segurança e Proteção Financeira   ║");
  console.log("╚═══════════════════════════════════════════════════╝");

  let t2 = false;
  let t3 = false;
  let t4 = false;

  try {
    t2 = await runTest2();
  } catch (e: any) {
    console.error(`  ERRO no Teste 2: ${e.message}`);
  }

  try {
    t3 = await runTest3();
  } catch (e: any) {
    console.error(`  ERRO no Teste 3: ${e.message}`);
  }

  try {
    t4 = await runTest4();
  } catch (e: any) {
    console.error(`  ERRO no Teste 4: ${e.message}`);
  }

  console.log("\n══════════════════════════════════════════════════");
  console.log(`  Teste 2 (Stress Key):      ${t2 ? PASS : FAIL}`);
  console.log(`  Teste 3 (Split Floor):     ${t3 ? PASS : FAIL}`);
  console.log(`  Teste 4 (Escrow Dispute):  ${t4 ? PASS : FAIL}`);
  console.log("══════════════════════════════════════════════════");

  await db.$disconnect();
  process.exit(t2 && t3 && t4 ? 0 : 1);
}

main();

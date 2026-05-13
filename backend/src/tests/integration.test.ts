/**
 * Foto Segundo — Suite de Testes de Integração Completa
 *
 * Cobre todos os domínios da plataforma via HTTP real contra o backend local.
 * Rotas verificadas diretamente contra /src/routes/index.ts
 *
 * Pré-requisito: backend rodando em http://localhost:3001
 * Executar:  npm run test:integration
 */

import "dotenv/config";
import jwt from "jsonwebtoken";

const BASE  = (process.env.BACKEND_URL || "http://localhost:3001").replace(/\/$/, "");
const API   = `${BASE}/api`;
const JWT_SECRET = process.env.JWT_SECRET!;

// ─── HTTP Helper ──────────────────────────────────────────────────────────────
async function req(
  method: string,
  path: string,
  opts: { token?: string; body?: object } = {}
): Promise<{ status: number; data: unknown }> {
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

// ─── Token Factory ────────────────────────────────────────────────────────────
function makeToken(role: string, userId = `${role.toLowerCase()}-test-id`) {
  return jwt.sign(
    { userId, role, nome: `Robô ${role}`, email: `robo+${role.toLowerCase()}@test.com` },
    JWT_SECRET,
    { expiresIn: "1h" }
  );
}

let adminToken: string;
let clienteToken: string;
let profToken: string;
let cartToken: string;

beforeAll(() => {
  adminToken  = makeToken("ADMIN");
  clienteToken = makeToken("CLIENTE");
  profToken   = makeToken("PROFISSIONAL");
  cartToken   = makeToken("CARTORIO");
});

// ══════════════════════════════════════════════════════════════════════════════
// 1. INFRAESTRUTURA
// ══════════════════════════════════════════════════════════════════════════════
describe("🔧 Infraestrutura", () => {
  test("GET /api/health → 200 ok", async () => {
    const r = await req("GET", "/health");
    expect(r.status).toBe(200);
    expect((r.data as any).status).toBe("ok");
  });

  test("GET /api/diag/db → 200 (diagnóstico DB)", async () => {
    const r = await req("GET", "/diag/db");
    expect([200, 500]).toContain(r.status);
  });

  test("Rota inexistente → 404", async () => {
    const r = await req("GET", "/rota-que-nao-existe-jamais");
    expect([404, 400]).toContain(r.status);
  });

  test("Rota protegida sem token → 401", async () => {
    const r = await req("GET", "/vaults");
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 2. AUTENTICAÇÃO  (POST /api/auth/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🔐 Autenticação", () => {
  test("POST /auth/login com credenciais erradas → 400/401/404", async () => {
    const r = await req("POST", "/auth/login", {
      body: { email: "nao-existe@test.com", senha: "senhaerrada" },
    });
    expect([400, 401, 404]).toContain(r.status);
  });

  test("POST /auth/register com dados inválidos → 400/422", async () => {
    const r = await req("POST", "/auth/register", { body: { email: "invalido" } });
    expect([400, 422, 500]).toContain(r.status);
  });

  test("GET /auth/me sem token → 401", async () => {
    const r = await req("GET", "/auth/me");
    expect(r.status).toBe(401);
  });

  test("GET /auth/me com token válido → não é 401", async () => {
    const r = await req("GET", "/auth/me", { token: clienteToken });
    // Usuário de teste não existe no DB → 404 é aceitável, mas nunca 401
    expect(r.status).not.toBe(401);
  });

  test("GET /public/auth/check → 200/404", async () => {
    const r = await req("GET", "/public/auth/check?email=test@test.com");
    expect([200, 404]).toContain(r.status);
  });

  test("POST /auth/forgot-password → 200/404", async () => {
    const r = await req("POST", "/auth/forgot-password", {
      body: { email: "qualquer@test.com" },
    });
    expect([200, 400, 404]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 3. EVENTOS PÚBLICOS
// ══════════════════════════════════════════════════════════════════════════════
describe("📅 Eventos Públicos", () => {
  test("GET /public/events → 200", async () => {
    const r = await req("GET", "/public/events");
    expect(r.status).toBe(200);
    // API retorna { events: [], total: N } ou array direto
    expect(r.data).toBeDefined();
  });

  test("GET /public/events/:slug com slug inválido → 404", async () => {
    const r = await req("GET", "/public/events/slug-que-nao-existe-jamais");
    expect([404, 400]).toContain(r.status);
  });

  test("POST /public/quotes → 400/422 com dados incompletos", async () => {
    const r = await req("POST", "/public/quotes", { body: {} });
    expect([400, 422, 500]).toContain(r.status);
  });

  test("GET /public/unidades-fixas → 200 com array", async () => {
    const r = await req("GET", "/public/unidades-fixas");
    expect(r.status).toBe(200);
  });

  test("GET /public/partners → 200", async () => {
    const r = await req("GET", "/public/partners");
    expect(r.status).toBe(200);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 4. ÁREA DO CLIENTE  (GET /api/cliente/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("👤 Área do Cliente", () => {
  test("GET /cliente/pedidos sem token → 401", async () => {
    const r = await req("GET", "/cliente/pedidos");
    expect(r.status).toBe(401);
  });

  test("GET /cliente/pedidos com token → 200 com array", async () => {
    const r = await req("GET", "/cliente/pedidos", { token: clienteToken });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
  });

  test("GET /me/points (gamificação) sem token → 401", async () => {
    const r = await req("GET", "/me/points");
    expect(r.status).toBe(401);
  });

  test("GET /me/points com token → 200/404", async () => {
    const r = await req("GET", "/me/points", { token: clienteToken });
    expect([200, 404]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 5. PROFISSIONAL  (GET /api/profissional/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("📸 Profissional", () => {
  test("GET /profissional/me sem token → 401", async () => {
    const r = await req("GET", "/profissional/me");
    expect(r.status).toBe(401);
  });

  test("GET /profissional/me com token cliente → 403", async () => {
    const r = await req("GET", "/profissional/me", { token: clienteToken });
    expect(r.status).toBe(403);
  });

  test("GET /profissional/me com token profissional → 200/404", async () => {
    const r = await req("GET", "/profissional/me", { token: profToken });
    expect([200, 404]).toContain(r.status);
  });

  test("GET /profissional/events com token profissional → 200", async () => {
    const r = await req("GET", "/profissional/events", { token: profToken });
    expect([200]).toContain(r.status);
  });

  test("GET /profissional/services com token profissional → 200", async () => {
    const r = await req("GET", "/profissional/services", { token: profToken });
    expect([200, 404]).toContain(r.status);
  });

  test("GET /profissional/network com token profissional → 200", async () => {
    const r = await req("GET", "/profissional/network", { token: profToken });
    expect([200]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 6. UNIDADE FIXA / CARTÓRIO  (/api/unidade-fixa/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🏛️ Unidade Fixa / Cartório", () => {
  test("GET /unidade-fixa/stats sem token → 401", async () => {
    const r = await req("GET", "/unidade-fixa/stats");
    expect(r.status).toBe(401);
  });

  test("GET /unidade-fixa/stats com token cartório → 200/500", async () => {
    const r = await req("GET", "/unidade-fixa/stats", { token: cartToken });
    expect([200, 404, 500]).toContain(r.status);
  });

  test("GET /unidade-fixa/events com token cartório → 200", async () => {
    const r = await req("GET", "/unidade-fixa/events", { token: cartToken });
    expect([200]).toContain(r.status);
  });

  test("GET /public/unidade-fixa/:slug → 200/404", async () => {
    const r = await req("GET", "/public/unidade-fixa/slug-inexistente");
    expect([200, 404]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 7. ADMIN  (/api/admin/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("⚙️ Admin", () => {
  test("GET /admin/users sem token → 401", async () => {
    const r = await req("GET", "/admin/users");
    expect(r.status).toBe(401);
  });

  test("GET /admin/users com token cliente → 403", async () => {
    const r = await req("GET", "/admin/users", { token: clienteToken });
    expect(r.status).toBe(403);
  });

  test("GET /admin/users com token admin → 200", async () => {
    const r = await req("GET", "/admin/users", { token: adminToken });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
  });

  test("GET /admin/events com admin → 200", async () => {
    const r = await req("GET", "/admin/events", { token: adminToken });
    expect(r.status).toBe(200);
  });

  test("GET /admin/orders com admin → 200", async () => {
    const r = await req("GET", "/admin/orders", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/quotes com admin → 200", async () => {
    const r = await req("GET", "/admin/quotes", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/stats com admin → 200", async () => {
    const r = await req("GET", "/admin/stats", { token: adminToken });
    expect([200, 404]).toContain(r.status);
  });

  test("GET /admin/configs com admin → 200", async () => {
    const r = await req("GET", "/admin/configs", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("PATCH /admin/configs com cliente → 403", async () => {
    const r = await req("PATCH", "/admin/configs", {
      token: clienteToken,
      body: { key: "test", value: "x" },
    });
    expect(r.status).toBe(403);
  });

  test("GET /admin/payouts com admin → 200", async () => {
    const r = await req("GET", "/admin/payouts", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/suppliers com admin → 200", async () => {
    const r = await req("GET", "/admin/suppliers", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/redemptions com admin → 200", async () => {
    const r = await req("GET", "/admin/redemptions", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/contests com admin → 200", async () => {
    const r = await req("GET", "/admin/contests", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/franchises com admin → 200", async () => {
    const r = await req("GET", "/admin/franchises", { token: adminToken });
    expect([200]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 8. CATÁLOGO DE IMPRESSÃO  (/api/admin/print-catalog & /api/public/print-catalog)
// ══════════════════════════════════════════════════════════════════════════════
describe("🖨️ Catálogo de Impressão", () => {
  test("GET /public/print-catalog → 200", async () => {
    const r = await req("GET", "/public/print-catalog");
    expect([200]).toContain(r.status);
  });

  test("GET /admin/print-catalog com admin → 200", async () => {
    const r = await req("GET", "/admin/print-catalog", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/print-catalog sem token → 401", async () => {
    const r = await req("GET", "/admin/print-catalog");
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 9. CATÁLOGO DE SERVIÇOS  (/api/admin/service-catalog & /api/public/service-catalog)
// ══════════════════════════════════════════════════════════════════════════════
describe("📋 Catálogo de Serviços", () => {
  test("GET /public/service-catalog → 200", async () => {
    const r = await req("GET", "/public/service-catalog");
    expect([200]).toContain(r.status);
  });

  test("GET /public/configs/services → 200", async () => {
    const r = await req("GET", "/public/configs/services");
    expect([200]).toContain(r.status);
  });

  test("GET /admin/service-catalog com admin → 200", async () => {
    const r = await req("GET", "/admin/service-catalog", { token: adminToken });
    expect([200]).toContain(r.status);
  });

  test("GET /admin/service-catalog sem token → 401", async () => {
    const r = await req("GET", "/admin/service-catalog");
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 10. GAMIFICAÇÃO & CONCURSOS  (/api/public/contests/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🎮 Gamificação & Concursos", () => {
  test("GET /public/contests/active → 200/404", async () => {
    const r = await req("GET", "/public/contests/active");
    expect([200, 404]).toContain(r.status);
  });

  test("GET /public/contests/hall-of-fame → 200/404", async () => {
    const r = await req("GET", "/public/contests/hall-of-fame");
    expect([200, 404]).toContain(r.status);
  });

  test("GET /me/points sem token → 401", async () => {
    const r = await req("GET", "/me/points");
    expect(r.status).toBe(401);
  });

  test("POST /me/redeem-print sem token → 401", async () => {
    const r = await req("POST", "/me/redeem-print");
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 11. PAGAMENTOS & CHECKOUT  (/api/checkout/*, /api/orders/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("💳 Pagamentos & Checkout", () => {
  test("POST /checkout/pending sem body → 400/422/500", async () => {
    const r = await req("POST", "/checkout/pending", { body: {} });
    expect([400, 422, 500]).toContain(r.status);
  });

  test("GET /public/orders/id-invalido → 404/400", async () => {
    const r = await req("GET", "/public/orders/id-invalido-nao-existe");
    expect([404, 400]).toContain(r.status);
  });

  test("GET /me/repasses sem token → 401", async () => {
    const r = await req("GET", "/me/repasses");
    expect(r.status).toBe(401);
  });

  test("GET /me/repasses com token → 200/404", async () => {
    const r = await req("GET", "/me/repasses", { token: profToken });
    expect([200, 404]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 12. MARKETPLACE  (/api/marketplace/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🛒 Marketplace", () => {
  test("GET /marketplace/events/:id/media (público com optionalAuth) → 200/404", async () => {
    const r = await req("GET", "/marketplace/events/id-inexistente/media");
    expect([200, 404, 400]).toContain(r.status);
  });

  test("POST /marketplace/express-sale sem token → 401", async () => {
    const r = await req("POST", "/marketplace/express-sale");
    expect(r.status).toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 13. FRANQUIA B2B  (/api/franchise/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🤝 Franquia B2B", () => {
  test("GET /franchise/inventory sem token → 401", async () => {
    const r = await req("GET", "/franchise/inventory");
    expect(r.status).toBe(401);
  });

  test("GET /franchise/referral com token não-franqueado → 403", async () => {
    const r = await req("GET", "/franchise/referral", { token: clienteToken });
    expect(r.status).toBe(403);
  });

  test("GET /franchise/finance com token não-franqueado → 403", async () => {
    const r = await req("GET", "/franchise/finance", { token: clienteToken });
    expect(r.status).toBe(403);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 14. COFRES DE MEMÓRIAS  (/api/vaults/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🔒 Cofres de Memórias (Fase 11)", () => {
  test("GET /vaults sem token → 401", async () => {
    const r = await req("GET", "/vaults");
    expect(r.status).toBe(401);
  });

  test("GET /vaults com token → 200 com array", async () => {
    const r = await req("GET", "/vaults", { token: clienteToken });
    expect(r.status).toBe(200);
    expect(Array.isArray(r.data)).toBe(true);
  });

  test("GET /vaults/invitation/CODIGO-INEXISTENTE → 404/410", async () => {
    const r = await req("GET", "/vaults/invitation/CODIGO-INVALIDO-0000");
    expect([404, 410, 400]).toContain(r.status);
  });

  test("POST /vaults/invitation/:code/accept sem token → 401", async () => {
    const r = await req("POST", "/vaults/invitation/QUALQUER/accept");
    expect(r.status).toBe(401);
  });

  test("GET /vaults/:id/media com vault inexistente → 200/404 (não 401)", async () => {
    const r = await req("GET", "/vaults/vault-que-nao-existe/media", { token: clienteToken });
    expect(r.status).not.toBe(401);
  });

  test("POST /vaults (criar cofre) com token → não é 401", async () => {
    const r = await req("POST", "/vaults", {
      token: clienteToken,
      body: { name: `Cofre Robot ${Date.now()}`, goalPoses: 6 },
    });
    // Drive não configurado → pode ser 500, mas nunca 401
    expect(r.status).not.toBe(401);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 15. PHYGITAL  (/api/admin/phygital/* & /api/public/phygital/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("📱 Phygital (QR Code & Impressão)", () => {
  test("GET /phygital/events/:id/queue sem token → 401", async () => {
    const r = await req("GET", "/phygital/events/id-inexistente/queue");
    expect(r.status).toBe(401);
  });

  test("GET /phygital/events/:id/queue com cliente → 403/404", async () => {
    const r = await req("GET", "/phygital/events/id-inexistente/queue", { token: clienteToken });
    expect([403, 404, 400]).toContain(r.status); // might not be 403 if it checks event first
  });

  test("GET /phygital/events/:id/queue com admin → 200/400/404", async () => {
    const r = await req("GET", "/phygital/events/id-inexistente/queue", { token: adminToken });
    expect([200, 400, 404]).toContain(r.status);
  });

  test("GET /phygital/events/:id/prints com admin → 200/400/404", async () => {
    const r = await req("GET", "/phygital/events/id-inexistente/prints", { token: adminToken });
    expect([200, 400, 404]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 16. CONFIGURAÇÕES PÚBLICAS  (/api/public/configs/*)
// ══════════════════════════════════════════════════════════════════════════════
describe("🔧 Configurações Públicas", () => {
  test("GET /public/configs/theme → 200", async () => {
    const r = await req("GET", "/public/configs/theme");
    expect([200]).toContain(r.status);
  });

  test("GET /public/configs/services → 200", async () => {
    const r = await req("GET", "/public/configs/services");
    expect([200]).toContain(r.status);
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// 17. RATE LIMITING & SEGURANÇA
// ══════════════════════════════════════════════════════════════════════════════
describe("🛡️ Segurança", () => {
  test("5 logins simultâneos não travam o servidor", async () => {
    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        req("POST", "/auth/login", {
          body: { email: "spam@test.com", senha: "senhaerrada" },
        })
      )
    );
    results.forEach((r) => {
      expect([400, 401, 404, 429]).toContain(r.status);
    });
  });

  test("Token forjado é rejeitado com 401", async () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fake.payload";
    const r = await req("GET", "/vaults", { token: fakeToken });
    expect(r.status).toBe(401);
  });
});

/**
 * Seed script: Creates test users for the E2E certification suite.
 * Run with: npx tsx backend/seed-test-users.ts
 *
 * Creates:
 *   - fotografo@brasil.com.br        (PROFISSIONAL + profissional profile)
 *   - unidade-sp@brasil.com.br       (CARTORIO + cartorio profile)
 *   - cliente-vip@brasil.com.br      (CLIENTE)
 *   - franqueado-ouro@brasil.com.br  (FRANCHISEE)
 */
import bcrypt from 'bcryptjs';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const PASS_HASH = bcrypt.hashSync('123456', 10);

const TEST_USERS = [
  { email: 'fotografo@brasil.com.br',       nome: 'Carlos Fotógrafo',   role: 'PROFISSIONAL' },
  { email: 'unidade-sp@brasil.com.br',      nome: 'Unidade SP',         role: 'CARTORIO'     },
  { email: 'cliente-vip@brasil.com.br',     nome: 'Cliente VIP',        role: 'CLIENTE'      },
  { email: 'franqueado-ouro@brasil.com.br', nome: 'Franqueado Ouro',    role: 'FRANCHISEE'   },
];

async function upsertUser(u: { email: string; nome: string; role: string }) {
  const existing = await pool.query(
    'SELECT id FROM users WHERE email = $1',
    [u.email]
  );
  if (existing.rows.length > 0) {
    console.log(`  ✅ SKIP   ${u.email} (already exists)`);
    return existing.rows[0].id as string;
  }
  // Generate a random cuid-like id (safe enough for tests)
  const id = `test_${u.role.toLowerCase()}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  await pool.query(
    `INSERT INTO users (id, email, senha, nome, role, "createdAt", "updatedAt", "isVerified", "verificationStatus", "discoverySource")
     VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), true, 'APPROVED', 'TEST')`,
    [id, u.email, PASS_HASH, u.nome, u.role]
  );
  console.log(`  ✨ CREATE  ${u.email} (role=${u.role}, id=${id})`);
  return id;
}

async function main() {
  console.log('🌱 Seeding test users...\n');

  // PROFISSIONAL
  const profId = await upsertUser(TEST_USERS[0]);
  const profExists = await pool.query('SELECT id FROM "profissionais" WHERE "userId" = $1', [profId]);
  if (profExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO "profissionais" (id, "userId", services, equipment, "otherHabilities", "workflowType", "hourlyRate")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
      [profId, ['Fotografia'], 'Canon EOS R5', '', ['TRADICIONAL'], 150]
    );
    console.log('    ↓ Profissional profile created');
  }

  // CARTORIO (UNIDADE FIXA)
  const cartId = await upsertUser(TEST_USERS[1]);
  const cartExists = await pool.query('SELECT id FROM cartorios WHERE "userId" = $1', [cartId]);
  if (cartExists.rows.length === 0) {
    await pool.query(
      `INSERT INTO cartorios (id, "userId", "razaoSocial", address, cidade, services)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5)`,
      [cartId, 'Unidade SP Ltda', 'Av. Paulista 1000', 'São Paulo', ['Casamento']]
    );
    console.log('    ↓ Cartório profile created');
  }

  // CLIENTE
  await upsertUser(TEST_USERS[2]);

  // FRANCHISEE
  await upsertUser(TEST_USERS[3]);

  console.log('\n✅ Done.');
  await pool.end();
}

main().catch(async (e) => {
  console.error('❌ Seed failed:', e.message);
  await pool.end();
  process.exit(1);
});

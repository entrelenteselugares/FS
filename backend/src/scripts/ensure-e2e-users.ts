/**
 * Garante a existência de um usuário CLIENTE dedicado para testes E2E.
 * Idempotente — roda quantas vezes quiser.
 * Run: npx tsx backend/src/scripts/ensure-e2e-users.ts
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const E2E_USERS = [
  {
    email:    'e2e-cliente@fotosegundo.test',
    nome:     'E2E Cliente Teste',
    role:     'CLIENTE' as const,
    senha:    '123456',
  },
  {
    email:    'e2e-profissional@fotosegundo.test',
    nome:     'E2E Profissional Teste',
    role:     'PROFISSIONAL' as const,
    senha:    '123456',
  },
];

async function main() {
  const hash = await bcrypt.hash('123456', 10);

  for (const u of E2E_USERS) {
    const existing = await prisma.user.findUnique({ where: { email: u.email } });
    if (existing) {
      // Garante senha atualizada
      await prisma.user.update({
        where: { email: u.email },
        data:  { senha: hash }
      });
      console.log(`✅ Usuário atualizado: ${u.email}`);
    } else {
      await prisma.user.create({
        data: { ...u, senha: hash }
      });
      console.log(`✅ Usuário criado: ${u.email}`);
    }
  }

  // Garante também que o admin tem senha 123456
  const adminHash = await bcrypt.hash('123456', 10);
  await prisma.user.updateMany({
    where: { role: 'ADMIN' },
    data:  { senha: adminHash }
  });
  console.log('✅ Admin(s) com senha 123456 garantida.');
}

main()
  .catch(e => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

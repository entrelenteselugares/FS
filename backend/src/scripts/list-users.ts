import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
p.user.findMany({ select: { email: true, role: true, nome: true }, take: 15 })
  .then(us => us.forEach(u => console.log(`[${u.role}] ${u.email} — ${u.nome}`)))
  .finally(() => p.$disconnect());

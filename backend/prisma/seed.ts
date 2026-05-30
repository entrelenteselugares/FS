import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Iniciando seed do banco de dados...");

  // Criar Administrador Master
  const adminEmail = process.env.ADMIN_EMAIL || "admin@fotosegundo.com";
  const adminPassword = await bcrypt.hash("admin123", 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      email: adminEmail,
      name: "Administrador Master",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  console.log("✅ Admin criado:", admin.email);

  // Exemplo de configuração padrão do sistema
  const configs = [
    { key: "markup_cliente", value: "20" },
    { key: "take_rate_profissional", value: "7" },
  ];

  for (const conf of configs) {
    await prisma.sysConfig.upsert({
      where: { key: conf.key },
      update: {},
      create: { key: conf.key, value: conf.value },
    });
  }

  console.log("✅ Configurações iniciais aplicadas.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

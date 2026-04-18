import dotenv from "dotenv";
dotenv.config();

import prisma from "./lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Iniciando Seed do Foto Segundo...");

  const hash = await bcrypt.hash("foto2025", 12);

  const admin = await prisma.user.upsert({
    where: { email: "entrelenteselugares@gmail.com" },
    update: {},
    create: {
      email: "entrelenteselugares@gmail.com",
      senha: hash,
      nome: "Admin Foto Segundo",
      role: "ADMIN",
      whatsapp: "11999999999",
    },
  });

  console.log("✅ Usuário Admin criado:", admin.email);

  // Criar um evento de exemplo para o painel não vir vazio
  const sampleEvent = await prisma.event.create({
    data: {
      nomeNoivos: "Exemplo: Julia & Ricardo",
      dataEvento: new Date("2026-12-31"),
      cartorio: "1º Cartório de Registro Civil",
      lightroomUrl: "https://lightroom.adobe.com/sample",
      driveUrl: "https://drive.google.com/sample",
      coverPhotoUrl: "https://images.unsplash.com/photo-1519741497674-611481863552",
    }
  });

  console.log("✅ Evento de Exemplo criado:", sampleEvent.nomeNoivos);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

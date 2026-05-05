import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando Povoamento de Usuários de Teste...");

  const senhaPadrao = await bcrypt.hash("123456", 12);
  const whatsappPadrao = "19984470420";

  const users = [
    // PONTOS FIXOS (CARTORIO)
    {
      email: "infoconteudoseo@gmail.com",
      nome: "Cartório Foto & Vídeo (Ponto Fixo)",
      role: "CARTORIO",
      bio: "Serviço de fotografia, vídeo completo da cerimônia e reels de 1min."
    },
    {
      email: "info.ramoreiras@gmail.com",
      nome: "Loja RA Moreiras (Ponto Fixo - Epson)",
      role: "CARTORIO",
      bio: "Loja de celular e manutenções que imprime fotos em impressora Epson."
    },
    {
      email: "info@tlmmakers.com",
      nome: "TLM Makers Studio (Ponto Fixo)",
      role: "CARTORIO",
      bio: "Estúdio de fotografia (Não imprime foto)."
    },
    // PROFISSIONAIS
    {
      email: "matheuskurio@gmail.com",
      nome: "Matheus Kurio (Profissional)",
      role: "PROFISSIONAL",
      bio: "Fotógrafo e Vídeo."
    },
    {
      email: "tlmagenciadigital@gmail.com",
      nome: "TLM Agência Digital (Profissional)",
      role: "PROFISSIONAL",
      bio: "Foto, Vídeo e Editor."
    },
    {
      email: "moraesrenata.br@gmail.com",
      nome: "Renata Moraes (Profissional)",
      role: "PROFISSIONAL",
      bio: "Fotógrafa."
    }
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role as any,
        nome: u.nome,
        whatsapp: whatsappPadrao
      },
      create: {
        email: u.email,
        senha: senhaPadrao,
        nome: u.nome,
        role: u.role as any,
        whatsapp: whatsappPadrao
      }
    });

    // Se for Cartório, garantir que tenha um perfil de Cartório e Franquia
    if (u.role === "CARTORIO") {
      await prisma.cartorio.upsert({
        where: { userId: user.id },
        update: { razaoSocial: u.nome, description: u.bio, cidade: "Cidade de Teste" },
        create: {
          userId: user.id,
          razaoSocial: u.nome,
          description: u.bio,
          cidade: "Cidade de Teste",
          splitPct: 10,
          services: ["FOTOGRAFIA", "VIDEO", "REELS"]
        }
      });

      await prisma.franchiseProfile.upsert({
        where: { userId: user.id },
        update: { active: true },
        create: {
          userId: user.id,
          active: true
        }
      });
    }

    console.log(`✅ Usuário ${u.role} criado/atualizado: ${u.email}`);
  }

  console.log("\n✨ Povoamento concluído com sucesso!");
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

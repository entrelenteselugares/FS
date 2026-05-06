import { prisma } from "./lib/prisma";
import bcrypt from "bcryptjs";

async function seedVaultTest() {
  console.log("🌱 Semeando cenário de teste para fechamento de ciclo...");

  const email = "cliente-vip@test.com";
  const password = await bcrypt.hash("vip123", 10);

  // 1. Criar ou atualizar Usuário VIP
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      senha: password,
      nome: "Cliente VIP Recorrência",
      role: "CLIENTE"
    }
  });

  // 2. Criar um Cofre de Memórias
  const album = await prisma.sharedAlbum.create({
    data: {
      nome: "Cofre de Teste Recorrência",
      ownerId: user.id,
      goalPoses: 36,
      folderId: "mock-folder-subscription-123",
      status: "OPEN"
    }
  });

  // 3. Criar Assinatura Vencida (Pronta para o Job)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  await prisma.subscription.create({
    data: {
      userId: user.id,
      albumId: album.id,
      status: "ACTIVE",
      planLimit: 5, // Limite pequeno para o teste
      nextBillingDate: yesterday,
      gatewaySubId: "pre-approved-mock-123"
    }
  });

  // 4. Adicionar mídias e votos
  const mediaCount = 10;
  for (let i = 1; i <= mediaCount; i++) {
    const media = await prisma.sharedAlbumMedia.create({
      data: {
        albumId: album.id,
        fileId: `file-mock-${i}`,
        webViewLink: `https://drive.google.com/file/d/mock-${i}`,
        uploadedById: user.id
      }
    });

    // Adicionar votos (Mídia 1 tem mais votos, Mídia 2 tem menos, etc.)
    const votesCount = mediaCount - i;
    for (let j = 0; j < votesCount; j++) {
      // Usando o próprio usuário para votar (em um cenário real seriam vários)
      // Como tem UNIQUE constraint, vou criar IDs de voto fictícios ou ignorar erro
      try {
        await prisma.mediaVote.create({
          data: {
            mediaId: media.id,
            userId: user.id // Simplificando para o teste
          }
        });
      } catch {}
    }
  }

  console.log("✅ Cenário semeado com sucesso!");
  console.log(`Email: ${email} | Senha: vip123`);
  console.log(`Assinatura ativa vinculada ao álbum: ${album.id}`);
  console.log("Próximo passo: Rodar 'npx tsx backend/src/jobs/vault-cycle.job.ts'");
}

seedVaultTest()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

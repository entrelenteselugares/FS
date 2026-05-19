import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando Master Seed para E2E...");

  const hash = await bcrypt.hash("123456", 12);
  const adminHash = await bcrypt.hash("foto2025", 12);

  // 1. USUÁRIOS
  const users = [
    { email: "contatofotosegundo@gmail.com", nome: "Admin Master", role: "ADMIN", senha: adminHash },
    { email: "cliente@campinas.com.br", nome: "Cliente Campinas", role: "CLIENTE", senha: hash },
    { email: "unidade-sp@brasil.com.br", nome: "Unidade SP", role: "CARTORIO", senha: hash },
    { email: "cliente-vip@brasil.com.br", nome: "Cliente VIP", role: "CLIENTE", senha: hash },
    { email: "membro1@fotosegundo.com.br", nome: "Membro 1", role: "PROFISSIONAL", senha: hash },
    { email: "hibrido@brasil.com.br", nome: "Pro Hibrido", role: "PROFISSIONAL", senha: hash },
    { email: "e2e-profissional@fotosegundo.test", nome: "E2E Pro", role: "PROFISSIONAL", senha: hash },
    { email: "membro4@fotosegundo.com.br", nome: "Membro 4", role: "PROFISSIONAL", senha: hash },
  ];

  for (const u of users) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { role: u.role as any, senha: u.senha, discoverySource: "referral" },
      create: {
        email: u.email,
        nome: u.nome,
        role: u.role as any,
        senha: u.senha,
        whatsapp: "11999999999",
        discoverySource: "referral"
      }
    });
    
    if (u.role === "CARTORIO") {
      await prisma.cartorio.upsert({
        where: { userId: user.id },
        update: {},
        create: { userId: user.id, razaoSocial: u.nome }
      });
      await prisma.franchiseProfile.upsert({
        where: { userId: user.id },
        update: { printCredits: 1000 },
        create: { userId: user.id, printCredits: 1000, tier: "GOLD" }
      });
    }
    
    console.log(`✅ Usuário: ${u.email}`);
  }

  const proHibrido = await prisma.user.findUnique({ where: { email: "hibrido@brasil.com.br" } });

  // 2. EVENTO FLASH CAMPINAS
  const flashEventData = {
    nomeNoivos: "Flash Campinas E2E",
    slug: "flash-campinas-e2e",
    dataEvento: new Date("2024-12-31"), // Passado para aparecer na galeria logo
    location: "Campinas - E2E Center",
    city: "Campinas",
    cartorio: "1º Cartório E2E",
    active: true,
    priceBase: 1.00,
    priceEarly: 1.00,
    temFoto: true,
    priceFoto: 1.00,
    type: "FLASH_EVENT" as any,
    isUnitSale: true,
    coverPhotoUrl: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
    captacaoId: proHibrido?.id
  };

  const flashEvent = await prisma.event.upsert({
    where: { slug: flashEventData.slug },
    update: flashEventData,
    create: flashEventData
  });
  console.log(`✅ Evento Flash: ${flashEvent.slug}`);

  // 3. MÍDIAS DO EVENTO FLASH
  await prisma.eventMedia.deleteMany({ where: { eventId: flashEvent.id } });
  await prisma.eventMedia.createMany({
    data: [
      { eventId: flashEvent.id, url: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc", shortId: "PH1", price: 1.00 },
      { eventId: flashEvent.id, url: "https://images.unsplash.com/photo-1519741497674-611481863552", shortId: "PH2", price: 1.00 },
      { eventId: flashEvent.id, url: "https://images.unsplash.com/photo-1583939003579-730e3918a45a", shortId: "PH3", price: 1.00 },
      { eventId: flashEvent.id, url: "https://images.unsplash.com/photo-1606800052052-a08af7148866", shortId: "PH4", price: 1.00 },
      { eventId: flashEvent.id, url: "https://images.unsplash.com/photo-1520854221256-17451cc331bf", shortId: "PH5", price: 1.00 },
    ]
  });
  console.log("✅ Mídias injetadas no evento Flash.");

  // 4. COFRE DE MEMÓRIAS (VAULT)
  const clientVip = await prisma.user.findUnique({ where: { email: "cliente-vip@brasil.com.br" } });
  if (clientVip) {
    const album = await prisma.sharedAlbum.upsert({
      where: { slug: "vault-e2e-test" },
      update: { status: "OPEN" },
      create: {
        nome: "Cofre E2E Test",
        slug: "vault-e2e-test",
        ownerId: clientVip.id,
        goalPoses: 36,
        folderId: "mock-folder-e2e",
        status: "OPEN"
      }
    });
    console.log(`✅ Cofre: vault-e2e-test`);

    await prisma.albumMember.upsert({
      where: { albumId_userId: { albumId: album.id, userId: clientVip.id } },
      update: { role: "OWNER" },
      create: {
        albumId: album.id,
        userId: clientVip.id,
        role: "OWNER"
      }
    });
    console.log(`✅ Membro do Cofre: ${clientVip.email}`);

    await prisma.sharedAlbumMedia.upsert({
      where: { fileId: "mock-file-e2e-1" },
      update: {},
      create: {
        albumId: album.id,
        fileId: "mock-file-e2e-1",
        webViewLink: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
        thumbnailLink: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc",
        uploadedById: clientVip.id
      }
    });
    console.log(`✅ Mídia do Cofre injetada.`);
  }

  console.log("\n🚀 Master Seed concluído! Os robôs estão prontos.");
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());

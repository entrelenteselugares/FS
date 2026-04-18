import "dotenv/config";
import prisma from "./lib/prisma";
import { slugify } from "./lib/utils";

// Tabela de preços padrão da plataforma Foto Segundo
const PRECOS = {
  foto:          190, 
  fotoEditada:   250, 
  video:         190, 
  videoEditado:  650, 
  reels:         120, 
  album:         420, 
};

// Imagens premium do Unsplash (estilo casamento editorial)
const COVERS = [
  "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541250848049-b4f71413cc30?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c0?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1513271921710-213751ed42a7?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=800&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1522673607200-164883eecd4c?q=80&w=800&auto=format&fit=crop",
];

function calcTotal(services: {
  foto?: boolean; fotoEditada?: boolean;
  video?: boolean; videoEditado?: boolean;
  reels?: boolean; album?: boolean;
}) {
  let total = 0;
  if (services.foto)         total += PRECOS.foto;
  if (services.fotoEditada)  total += PRECOS.fotoEditada;
  if (services.video)        total += PRECOS.video;
  if (services.videoEditado) total += PRECOS.videoEditado;
  if (services.reels)        total += PRECOS.reels;
  if (services.album)        total += PRECOS.album;
  return total;
}

const EVENTOS = [
  {
    originalNamePattern: "Julia & Ricardo",
    nomeNoivos: "Julia & Ricardo",
    dataEvento: new Date("2026-12-30"),
    location: "Espaço Monumental",
    city: "São Paulo",
    cartorio: "1º Cartório de Registro Civil",
    description: "Casamento clássico com recepção luxuosa. Fotos e vídeos editados com finalização artística.",
    services: { fotoEditada: true, videoEditado: true, reels: true },
    coverPhotoUrl: COVERS[9],
  },
  {
    nomeNoivos: "Beatriz & Marcos",
    dataEvento: new Date("2026-03-15"),
    location: "Vila Madalena, São Paulo",
    city: "São Paulo",
    cartorio: "1º Cartório de Registro Civil",
    description: "Cerimônia íntima ao pôr do sol. Entrega das fotos brutas no cartão no mesmo dia.",
    services: { foto: true },
    coverPhotoUrl: COVERS[0],
  },
  {
    nomeNoivos: "Camila & André",
    dataEvento: new Date("2026-02-28"),
    location: "Espaço Jardim das Flores",
    city: "Campinas",
    cartorio: "2º Cartório de Registro Civil",
    description: "Cobertura completa do dia com fotos e vídeo integral entregues no cartão.",
    services: { foto: true, video: true },
    coverPhotoUrl: COVERS[1],
  },
  {
    nomeNoivos: "Fernanda & Lucas",
    dataEvento: new Date("2026-04-05"),
    location: "Hotel Grand Hyatt",
    city: "São Paulo",
    cartorio: "3º Cartório do Registro Civil",
    description: "Produção premium. Fotos editadas, vídeo cinematográfico ~10min com capa personalizada e reels para redes sociais.",
    services: { fotoEditada: true, videoEditado: true, reels: true },
    coverPhotoUrl: COVERS[2],
  },
  {
    nomeNoivos: "Isabela & Rafael",
    dataEvento: new Date("2026-01-20"),
    location: "Fazenda Santa Alice",
    city: "Bragança Paulista",
    cartorio: "Cartório de Reg. Civil de Bragança",
    description: "Fotos com edição completa antecipada. Inclui uma foto impressa premium no pacote.",
    services: { fotoEditada: true },
    coverPhotoUrl: COVERS[3],
  },
  {
    nomeNoivos: "Juliana & Pedro",
    dataEvento: new Date("2026-03-30"),
    location: "Centro Cultural São Paulo",
    city: "São Paulo",
    cartorio: "5º Cartório de Registro Civil",
    description: "Fotos no cartão no mesmo dia + Reels editado para compartilhar nas redes sociais.",
    services: { foto: true, reels: true },
    coverPhotoUrl: COVERS[4],
  },
  {
    nomeNoivos: "Mariana & Felipe",
    dataEvento: new Date("2025-12-14"),
    location: "Palazzo Tangará",
    city: "São Paulo",
    cartorio: "4º Cartório de Registro Civil",
    description: "Pacote full day: fotos editadas, vídeo cinematográfico ~10min, reels e álbum impresso premium. O melhor da plataforma.",
    services: { fotoEditada: true, videoEditado: true, reels: true, album: true },
    coverPhotoUrl: COVERS[5],
  },
  {
    nomeNoivos: "Natália & Thiago",
    dataEvento: new Date("2026-04-12"),
    location: "Recanto das Orquídeas",
    city: "Atibaia",
    cartorio: "Cartório Único de Atibaia",
    description: "Elopement íntimo na Serra. Entrega das fotos no cartão ao final da sessão.",
    services: { foto: true },
    coverPhotoUrl: COVERS[6],
  },
  {
    nomeNoivos: "Renata & Guilherme",
    dataEvento: new Date("2026-05-03"),
    location: "Espaço Contemporâneo",
    city: "Santo André",
    cartorio: "1º Cartório Santo André",
    description: "Cobertura com câmera e vídeo. Material bruto entregue na hora — sem espera.",
    services: { foto: true, video: true },
    coverPhotoUrl: COVERS[7],
  },
  {
    nomeNoivos: "Carolina & Bruno",
    dataEvento: new Date("2026-06-14"),
    location: "Quinta da Boa Vista",
    city: "Rio de Janeiro",
    cartorio: "3º Cartório RJ",
    description: "Fotos com edição profissional e álbum impresso capa dura com 30 páginas.",
    services: { fotoEditada: true, album: true },
    coverPhotoUrl: COVERS[8],
  },
];

async function main() {
  console.log("🌱 Saneando banco de dados e atualizando fotos premium...\n");

  for (const ev of EVENTOS) {
    const slug = slugify(ev.nomeNoivos);
    const total = calcTotal(ev.services);

    // Tentar encontrar por slug limpo ou pelo padrão "Exemplo: Julia & Ricardo"
    const existing = await prisma.event.findFirst({
      where: {
        OR: [
          { slug },
          { nomeNoivos: `Exemplo: ${ev.nomeNoivos}` },
          { slug: `exemplo-${slug}` }
        ]
      }
    });

    const data = {
      nomeNoivos:       ev.nomeNoivos,
      slug,
      dataEvento:       ev.dataEvento,
      location:         ev.location,
      city:             ev.city,
      cartorio:         ev.cartorio,
      description:      ev.description,
      coverPhotoUrl:    ev.coverPhotoUrl,
      active:           true,
      priceBase:        total,
      priceEarly:       total,
      temFoto:          !!(ev.services.foto || ev.services.fotoEditada),
      temFotoEditada:   !!ev.services.fotoEditada,
      temVideo:         !!ev.services.video,
      temVideoEditado:  !!ev.services.videoEditado,
      temReels:         !!ev.services.reels,
      temFotoImpressa:  !!ev.services.fotoEditada,
      temAlbumImpresso: !!ev.services.album,
      priceFoto:        ev.services.foto ? PRECOS.foto : null,
      priceFotoEditada: ev.services.fotoEditada ? PRECOS.fotoEditada : null,
      priceVideo:       ev.services.video ? PRECOS.video : null,
      priceVideoEditado: ev.services.videoEditado ? PRECOS.videoEditado : null,
      priceReels:       ev.services.reels ? PRECOS.reels : null,
      priceAlbum:       ev.services.album ? PRECOS.album : null,
    };

    if (existing) {
      await prisma.event.update({
        where: { id: existing.id },
        data,
      });
      console.log(`🔄 Atualizado: ${ev.nomeNoivos} (ID: ${existing.id})`);
    } else {
      await prisma.event.create({ data });
      console.log(`✅ Criado: ${ev.nomeNoivos}`);
    }
  }

  // Desativa qualquer outro evento que ainda tenha "Exemplo:" e que não foi mapeado
  const desativados = await prisma.event.updateMany({
    where: {
      OR: [
        { nomeNoivos: { startsWith: "Exemplo:" } },
        { slug: { startsWith: "exemplo-" } }
      ],
      active: true
    },
    data: { active: false }
  });

  console.log(`\n🧹 Eventos legados com "Exemplo:" desativados: ${desativados.count}`);
}

main()
  .catch((e) => {
    console.error("❌ Erro no seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

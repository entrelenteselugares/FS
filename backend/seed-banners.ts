import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SLIDES = [
  {
    title: "MOMENTOS",
    subtitle: "Inesquecíveis",
    description: "A melhor experiência fotográfica para o seu evento. Qualidade impecável e entrega ultrarrápida.",
    primaryBtn: "EXPLORAR VITRINE",
    primaryAction: "/vitrine",
    icon: "camera",
    bgImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
    order: 0
  },
  {
    title: "COBERTURAS",
    subtitle: "Profissionais",
    description: "Casamentos, corporativos, aniversários e ensaios. Contrate os melhores fotógrafos da região sob medida.",
    primaryBtn: "SOLICITAR ORÇAMENTO",
    primaryAction: "/cotacao",
    icon: "camera",
    bgImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
    order: 1
  },
  {
    title: "RECONHECIMENTO",
    subtitle: "Instantâneo",
    description: "Suas fotos entregues no seu celular durante o evento através de Inteligência Artificial e QR Code Inteligente.",
    primaryBtn: "COMO FUNCIONA",
    primaryAction: "/sobre",
    icon: "qrcode",
    bgImage: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1600",
    order: 2
  },
  {
    title: "INGRESSOS &",
    subtitle: "Comissões",
    description: "Organize seu evento, adicione seu link de ingressos e cupom promocional. Ganhe comissões exclusivas sobre a venda de fotos!",
    primaryBtn: "SEJA UM PARCEIRO",
    primaryAction: "/cotacao",
    icon: "ticket",
    bgImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1600",
    order: 3
  },
  {
    title: "COMUNIDADE",
    subtitle: "Foto Segundo",
    description: "\"A experiência mais incrível que já tive! Fotos com altíssima qualidade entregues na hora. Simplesmente mágico!\" - Marina S.",
    primaryBtn: "VER AVALIAÇÕES",
    primaryAction: "/sobre",
    icon: "star",
    bgImage: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=1600",
    order: 4
  }
];

async function main() {
  const existing = await prisma.heroSlide.count();
  if (existing === 0) {
    for (const slide of SLIDES) {
      await prisma.heroSlide.create({ data: slide });
    }
    console.log("5 banners inseridos com sucesso.");
  } else {
    console.log("Banners já existem no banco. Não foram inseridos duplicados.");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

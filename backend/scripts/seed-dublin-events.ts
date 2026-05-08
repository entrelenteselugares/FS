import { PrismaClient, EventType, PaymentModel, DeliveryType, AcceptanceStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Buscando profissionais @dublin.com...');
  const pros = await prisma.user.findMany({
    where: { 
      email: { endsWith: '@dublin.com' },
      role: 'PROFISSIONAL'
    },
    take: 10
  });

  if (pros.length === 0) {
    console.log('Nenhum profissional @dublin.com encontrado. Execute o onboarding primeiro.');
    return;
  }

  console.log(`Encontrados ${pros.length} profissionais. Criando serviços...`);

  const eventTypes: { type: EventType; name: string; priceBase: number; isUnitSale: boolean }[] = [
    { type: 'ALBUM_FULL', name: 'Casamento Premium', priceBase: 3500, isUnitSale: false },
    { type: 'PHOTO_MARKETPLACE', name: 'Live Print Corporativo', priceBase: 0, isUnitSale: true },
    { type: 'FOTO_POINT', name: 'Ensaio Express (Ponto Turístico)', priceBase: 150, isUnitSale: false },
    { type: 'FLASH_EVENT', name: 'Cobertura de Show (Flash)', priceBase: 0, isUnitSale: true }
  ];

  const cities = ['São Paulo', 'Campinas', 'Valinhos', 'Dublin'];

  for (const pro of pros) {
    for (let i = 0; i < eventTypes.length; i++) {
      const typeConfig = eventTypes[i];
      const city = cities[i % cities.length];
      const slug = `dublin-${pro.id.slice(-4)}-${typeConfig.type.toLowerCase()}-${Date.now()}`;
      
      const event = await prisma.event.create({
        data: {
          nomeNoivos: `${typeConfig.name} - ${pro.nome}`,
          dataEvento: new Date(Date.now() + Math.random() * 864000000), // Random future date
          type: typeConfig.type,
          captacaoId: pro.id,
          captacaoStatus: AcceptanceStatus.ACCEPTED,
          active: true,
          city: city,
          location: 'Centro de Convenções',
          slug: slug,
          priceBase: typeConfig.priceBase,
          isUnitSale: typeConfig.isUnitSale,
          priceUnit: typeConfig.isUnitSale ? 15.00 : 0,
          paymentModel: PaymentModel.PRE_PAID,
          deliveryType: DeliveryType.DIGITAL_ONLY,
          coverPhotoUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800',
        }
      });
      console.log(`Criado [${typeConfig.type}]: ${event.nomeNoivos}`);
    }
  }

  console.log('Semeadura de serviços para Dublin concluída com sucesso!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

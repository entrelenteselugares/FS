import { Hono } from 'hono';
import { handle } from 'hono/vercel';
import { cors } from 'hono/cors';
import prisma from '../lib/prisma';

const app = new Hono().basePath('/api/public');

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// GET /api/public/events/cities
// Lista as cidades disponíveis com base nos eventos ativos na vitrine.
app.get('/events/cities', async (c) => {
  try {
    const where: any = {
      active: true,
      isPrivate: false,
      isQuote: false,
      NOT: {
        type: 'ALBUM_FULL',
        pedidos: {
          some: {
            status: 'PENDENTE'
          }
        }
      },
      AND: [
        { NOT: { slug: { startsWith: 'vault-' } } }
      ]
    };

    const events = await prisma.event.findMany({
      where,
      select: {
        city: true,
        cartorioUser: {
          select: {
            cartorio: {
              select: {
                cidade: true
              }
            }
          }
        }
      }
    });

    const citiesSet = new Set<string>();
    
    events.forEach((e: any) => {
      const city = e.city || e.cartorioUser?.cartorio?.cidade;
      if (city) {
        citiesSet.add(city.trim());
      }
    });

    if (citiesSet.size === 0) {
      citiesSet.add("Campinas");
    }

    return c.json({ cities: Array.from(citiesSet).sort() });
  } catch (error) {
    console.error("[getPublicCities] Erro ao listar cidades:", error);
    return c.json({ error: "Erro ao listar cidades" }, 500);
  }
});

// GET /api/public/events
// Lista eventos para a vitrine pública com suporte a busca robusta e paginação real.
app.get('/events', async (c) => {
  try {
    const query = c.req.query("q") as string;
    const page = c.req.query("page") || "1";
    const type = c.req.query("type");
    const city = c.req.query("city");
    const sortBy = c.req.query("sortBy");

    const take = 20;
    const skip = (Number(page) - 1) * take;

    const where: any = {
      active: true,
      isPrivate: false,
      isQuote: false,
      type: type ? String(type) : {
        in: ['ALBUM_FULL', 'PHOTO_MARKETPLACE', 'FOTO_POINT', 'FLASH_EVENT']
      },
      NOT: {
        type: 'ALBUM_FULL',
        pedidos: {
          some: {
            status: 'PENDENTE'
          }
        }
      }
    };

    const andConditions: any[] = [
      { NOT: { slug: { startsWith: 'vault-' } } }
    ];

    if (city) {
      andConditions.push({
        OR: [
          { city: { equals: String(city), mode: 'insensitive' } },
          {
            cartorioUser: {
              cartorio: {
                cidade: { equals: String(city), mode: 'insensitive' }
              }
            }
          }
        ]
      });
    }

    if (query) {
      andConditions.push({
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { location: { contains: query, mode: 'insensitive' } },
          { clientName: { contains: query, mode: 'insensitive' } }
        ]
      });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    let orderBy: any = { dataEvento: 'desc' };
    if (sortBy === 'AZ') orderBy = { title: 'asc' };
    if (sortBy === 'ZA') orderBy = { title: 'desc' };
    if (sortBy === 'PRICE_ASC') orderBy = { priceBase: 'asc' };
    if (sortBy === 'PRICE_DESC') orderBy = { priceBase: 'desc' };
    if (sortBy === 'OLD') orderBy = { dataEvento: 'asc' };

    const total = await prisma.event.count({ where });`n    const events = await
      prisma.event.findMany({
        where,
        take,
        skip,
        orderBy,
        select: {
          id: true,
          slug: true,
          title: true,
          dataEvento: true,
          location: true,
          coverPhotoUrl: true,
          priceBase: true,
          priceEarly: true,
          type: true,
          category: true,
          temFoto: true,
          temVideo: true,
          temReels: true,
          city: true,
          captacao: {
            select: {
              nome: true
            }
          },
          cartorioUser: {
            select: {
              nome: true,
              cartorio: {
                select: {
                  cidade: true
                }
              }
            }
          }
        }
      }),
      prisma.event.count({ where })
    ]);

    const pages = Math.ceil(total / take);

    const mapped = events.map((e: any) => ({
      ...e,
      ownerName: e.cartorioUser?.nome || e.captacao?.nome || "Foto Segundo",
      city: e.city || (e as any).cartorioUser?.cartorio?.cidade || null
    }));

    return c.json({
      events: mapped,
      total,
      page: Number(page),
      pages
    });
  } catch (error) {
    console.error("[listPublic] Erro ao listar eventos públicos:", error);
    return c.json({ error: "Erro ao carregar vitrine" }, 500);
  }
});

export default handle(app);

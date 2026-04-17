// Foto Segundo — Prisma 7 Config (JavaScript Version)
// Usamos JS puro para evitar erros de compilação (Exit Code 2) na Vercel.
require('dotenv').config();

module.exports = {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL || "postgresql://unused:unused@localhost:5432/unused",
  },
};

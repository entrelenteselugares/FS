import "dotenv/config";
import { Pool } from "pg";

// Pool expandido de 30 imagens únicas de alta qualidade (weddings & events)
const UNIQUE_COVERS = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200", // casal dança
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200", // véu ao ar
  "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?auto=format&fit=crop&q=80&w=1200", // buquê
  "https://images.unsplash.com/photo-1522673607200-164883eecd0c?auto=format&fit=crop&q=80&w=1200", // cerimônia altar
  "https://images.unsplash.com/photo-1511285560929-847e0effe174?auto=format&fit=crop&q=80&w=1200", // confete
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200", // noivos elegantes
  "https://images.unsplash.com/photo-1516997121675-4c2d04fe0799?auto=format&fit=crop&q=80&w=1200", // mãos unidas
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200", // recepção noite
  "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=1200", // casal rindo
  "https://images.unsplash.com/photo-1504933350103-e840eda978d4?auto=format&fit=crop&q=80&w=1200", // cerimônia jardim
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200", // balões
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200", // bouquet close-up
  "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&q=80&w=1200", // noivos caminhando
  "https://images.unsplash.com/photo-1583939003579-730e3918a45a?auto=format&fit=crop&q=80&w=1200", // beijo no altar
  "https://images.unsplash.com/photo-1606800052052-a08af7148866?auto=format&fit=crop&q=80&w=1200", // festa champagne
  "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&q=80&w=1200", // vestido noiva
  "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&q=80&w=1200", // mesa posta
  "https://images.unsplash.com/photo-1523438885200-e635ba2c371e?auto=format&fit=crop&q=80&w=1200", // flores decoração
  "https://images.unsplash.com/photo-1470116945706-e6bf5d5a53ca?auto=format&fit=crop&q=80&w=1200", // luz dourada
  "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&q=80&w=1200", // aliança mãos
  "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?auto=format&fit=crop&q=80&w=1200", // noivos preto e branco
  "https://images.unsplash.com/photo-1444930694458-01babf71870c?auto=format&fit=crop&q=80&w=1200", // buquê rosas
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&q=80&w=1200", // confete colorido
  "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=1200", // evento elegante
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=1200", // cerimônia ao ar livre
  "https://images.unsplash.com/photo-1549417229-aa67d3263c09?auto=format&fit=crop&q=80&w=1200", // casal pôr do sol
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&q=80&w=1200", // primeiro beijo
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200", // retrato elegante
  "https://images.unsplash.com/photo-1478416272538-5f7e51dc5400?auto=format&fit=crop&q=80&w=1200", // luzes cintilantes
  "https://images.unsplash.com/photo-1502635385003-ee1e6a1a742d?auto=format&fit=crop&q=80&w=1200", // vestido flutuando
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    // Buscar TODOS os eventos, ordenados por data de criação
    const { rows: events } = await pool.query(
      `SELECT id, "title", "coverPhotoUrl" FROM events ORDER BY "createdAt" ASC`
    );

    console.log(`📸 Total de ${events.length} eventos encontrados.`);

    // Shuffle do pool de imagens para randomizar a ordem
    const shuffled = [...UNIQUE_COVERS].sort(() => Math.random() - 0.5);

    let updated = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      // Usar índice cíclico para garantir que se houver mais eventos que imagens, reutilizar
      // mas com deslocamento para minimizar repetições visíveis na mesma página
      const coverUrl = shuffled[i % shuffled.length];

      await pool.query(
        `UPDATE events SET "coverPhotoUrl" = $1 WHERE id = $2`,
        [coverUrl, event.id]
      );
      updated++;
      console.log(`✅ [${i + 1}/${events.length}] ${event.title}`);
    }

    console.log(`\n🎉 ${updated} eventos atualizados com imagens únicas!`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Erro:", e);
  process.exit(1);
});

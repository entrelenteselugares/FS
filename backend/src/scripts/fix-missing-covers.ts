import "dotenv/config";
import { Pool } from "pg";

const COVER_IMAGES = [
  "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1541344999736-83eca272f6fc?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1522673607200-164883eecd0c?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1511285560929-847e0effe174?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1516997121675-4c2d04fe0799?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1517263904808-5dc91e3e7044?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1504933350103-e840eda978d4?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&q=80&w=1200",
  "https://images.unsplash.com/photo-1520854221256-17451cc331bf?auto=format&fit=crop&q=80&w=1200"
];

// URLs válidas (que sabemos que funcionam) - não mexer nessas
const KNOWN_GOOD_PATTERNS = ["unsplash.com", "supabase.co/storage/v1/object/public"];

async function isUrlBroken(url: string): Promise<boolean> {
  // Se é do Unsplash, assumir que está OK
  if (url.includes("unsplash.com")) return false;
  
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    return res.status >= 400;
  } catch {
    return true; // timeout or network error = broken
  }
}

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log("🔍 Buscando todos os eventos com coverPhotoUrl...");

    const { rows: events } = await pool.query(
      `SELECT id, "nomeNoivos", "coverPhotoUrl" FROM events WHERE "coverPhotoUrl" IS NOT NULL AND "coverPhotoUrl" != ''`
    );

    console.log(`📸 Verificando ${events.length} eventos com URL cadastrada...`);

    let fixed = 0;
    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      const broken = await isUrlBroken(event.coverPhotoUrl);

      if (broken) {
        const randomCover = COVER_IMAGES[fixed % COVER_IMAGES.length];
        await pool.query(
          `UPDATE events SET "coverPhotoUrl" = $1 WHERE id = $2`,
          [randomCover, event.id]
        );
        console.log(`✅ [FIXED] ${event.nomeNoivos}: ${event.coverPhotoUrl.substring(0, 60)}... → Unsplash`);
        fixed++;
      } else {
        console.log(`✓ [OK] ${event.nomeNoivos}`);
      }
    }

    console.log(`\n🎉 Concluído! ${fixed} URL(s) substituída(s) com sucesso.`);
  } finally {
    await pool.end();
  }
}

main().catch((e) => {
  console.error("❌ Erro:", e);
  process.exit(1);
});

import "dotenv/config";
import { Pool } from "pg";

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  try {
    const { rows } = await pool.query(
      `SELECT "nomeNoivos", "coverPhotoUrl" FROM events WHERE "coverPhotoUrl" IS NOT NULL ORDER BY "createdAt" DESC LIMIT 20`
    );
    rows.forEach(row => console.log(`${row.nomeNoivos} | ${(row.coverPhotoUrl || '').substring(0, 100)}`));
  } finally {
    await pool.end();
  }
}
main().catch(console.error);

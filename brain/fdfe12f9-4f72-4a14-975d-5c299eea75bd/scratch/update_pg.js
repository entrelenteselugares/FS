const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: "postgresql://postgres.rsufjhfdddzjjjxmllnm:M0raesr0cha9148@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
  });
  
  try {
    await client.connect();
    const res = await client.query("UPDATE cartorios SET cidade = 'Campinas', \"fixedDuration\" = 2 WHERE \"razaoSocial\" LIKE '%Castelon%';");
    console.log('Update result:', res.rowCount, 'rows updated.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await client.end();
  }
}

main();

const { Client } = require('pg');
const client = new Client({
  connectionString: "postgresql://postgres.rsufjhfdddzjjjxmllnm:%24%2F%23%2CwkaAn2t-sBL@aws-1-sa-east-1.pooler.supabase.com:5432/postgres"
});
client.connect()
  .then(() => client.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'events'"))
  .then(res => {
    console.log("Colunas na tabela 'events':");
    res.rows.forEach(row => console.log("- " + row.column_name));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });

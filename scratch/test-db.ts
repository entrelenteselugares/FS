import { Client } from 'pg';
import 'dotenv/config';

async function testConnection() {
  const connectionString = "postgresql://postgres.rsufjhfdddzjjjxmllnm:%24%2F%23%2CwkaAn2t-sBL@aws-1-sa-east-1.pooler.supabase.com:6543/postgres";
  console.log('--- DB Diagnostic ---');
  console.log('Testing connection to:', connectionString?.split('@')[1]);

  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('✅ Success! Connection established.');
    const res = await client.query('SELECT current_user, current_database()');
    console.log('Details:', res.rows[0]);
    await client.end();
  } catch (err: any) {
    console.error('❌ Connection Failed!');
    console.error('Error Code:', err.code);
    console.error('Message:', err.message);
    console.error('Detail:', err.detail);
  }
}

testConnection();

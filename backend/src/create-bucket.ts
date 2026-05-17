import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();
  if (listError) {
    console.error("Error listing buckets:", listError);
    return;
  }
  
  const exists = buckets?.find(b => b.name === 'portfolio');
  if (!exists) {
    console.log("Bucket 'portfolio' does not exist. Creating...");
    const { data, error } = await supabase.storage.createBucket('portfolio', {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    if (error) {
      console.error("Error creating bucket:", error);
    } else {
      console.log("Bucket created successfully:", data);
    }
  } else {
    console.log("Bucket 'portfolio' already exists.");
  }
}

main();

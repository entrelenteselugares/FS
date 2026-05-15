import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.createBucket('profiles', {
    public: true,
    fileSizeLimit: 5242880, // 5MB
    allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg']
  });

  if (error) {
    if (error.message.includes('already exists')) {
      console.log("Bucket 'profiles' already exists.");
    } else {
      console.error("Error creating bucket:", error);
    }
  } else {
    console.log("Bucket 'profiles' created successfully.");
  }
}

main();

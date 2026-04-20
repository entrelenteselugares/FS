
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  const { data, error } = await supabase.storage.listBuckets();
  if (error) {
    console.error('Error listing buckets:', error.message);
    return;
  }
  console.log('Buckets:', data.map(b => b.name));
  
  // Try to create 'eventos' if it doesn't exist
  if (!data.find(b => b.name === 'eventos')) {
    console.log('Creating "eventos" bucket...');
    const { error: createError } = await supabase.storage.createBucket('eventos', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      fileSizeLimit: 5242880 // 5MB
    });
    if (createError) console.error('Error creating bucket:', createError.message);
    else console.log('Bucket "eventos" created successfully.');
  }
}

main();

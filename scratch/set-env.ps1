$dbUrl = "postgresql://postgres.rsufjhfdddzjjjxmllnm:91485496Cel@aws-1-sa-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
$directUrl = "postgresql://postgres:91485496Cel@db.rsufjhfdddzjjjxmllnm.supabase.co:5432/postgres"

# Remove e recria DATABASE_URL sem newlines
$dbUrl | npx vercel env add DATABASE_URL production --force 2>&1
Write-Host "DATABASE_URL adicionado"

# Remove e recria DIRECT_URL sem newlines  
$directUrl | npx vercel env add DIRECT_URL production --force 2>&1
Write-Host "DIRECT_URL adicionado"

import { PrismaClient } from '@prisma/client';
import { supabaseAdmin } from '../src/lib/supabase';
import { r2Service } from '../src/services/r2Storage.service';

const prisma = new PrismaClient();

async function main() {
  console.log("=== CHECKING DATABASE ===");
  const users = await prisma.user.findMany({ select: { email: true } });
  console.log("Users in DB (Prisma public.users):", users.length);
  console.log("Emails:", users.map(u => u.email).join(', '));

  const events = await prisma.event.count();
  const media = await prisma.eventMedia.count();
  console.log("Events:", events, "Media:", media);

  console.log("\n=== CHECKING SUPABASE AUTH ===");
  try {
    const authUsers = await supabaseAdmin.auth.admin.listUsers();
    console.log("Auth Users:", authUsers.data.users.length);
    console.log("Auth Emails:", authUsers.data.users.map(u => u.email).join(', '));
  } catch (err: any) {
    console.log("Error checking Supabase auth:", err?.message);
  }

  console.log("\n=== CHECKING STORAGE (VAULTS) ===");
  try {
    const { data: files, error } = await supabaseAdmin.storage.from('vaults').list();
    if (error) throw error;
    console.log(`Supabase Vaults bucket has ${files.length} items/folders.`);
    if (files.length > 0) {
      console.log(files.map(f => f.name).slice(0, 10)); // just sample
    }
  } catch (err: any) {
    console.log("Error checking storage:", err?.message);
  }

  process.exit(0);
}

main();

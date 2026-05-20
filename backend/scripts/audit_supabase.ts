import { prisma } from "../src/lib/prisma";

async function main() {
  console.log("=== INICIANDO AUDITORIA DO SUPABASE (PRISMA) ===");
  const tablesToAudit = [
    { name: "User (users)", query: () => prisma.user.findFirst({ select: { id: true, email: true, tenantLogoUrl: true, tenantBrandColor: true } }) },
    { name: "Event (events)", query: () => prisma.event.findFirst({ select: { id: true, nomeNoivos: true, customLogoUrl: true, customBrandColor: true } }) },
    { name: "PhygitalPrint (phygital_prints)", query: () => prisma.phygitalPrint.findFirst() },
    { name: "AffiliateCommission (affiliate_commissions)", query: () => prisma.affiliateCommission.findFirst() },
    { name: "PortfolioAlbum (portfolio_albums)", query: () => prisma.portfolioAlbum.findFirst() },
    { name: "Contest (contests)", query: () => prisma.contest.findFirst() },
    { name: "IoTDevice (iot_devices)", query: () => prisma.ioTDevice.findFirst() },
    { name: "FlashCard (flash_cards)", query: () => prisma.flashCard.findFirst() },
    { name: "Lead (leads)", query: () => prisma.lead.findFirst() },
    { name: "ServiceBooking (service_bookings)", query: () => prisma.serviceBooking.findFirst() },
    { name: "FranchiseProfile (franchise_profiles)", query: () => prisma.franchiseProfile.findFirst() },
  ];

  let successCount = 0;
  let failCount = 0;

  for (const table of tablesToAudit) {
    try {
      console.log(`[AUDIT] Verificando tabela ${table.name}...`);
      await table.query();
      console.log(`  🟢 Tabela ${table.name} respondendo corretamente (Colunas validadas).`);
      successCount++;
    } catch (err: any) {
      console.error(`  ❌ ERRO na tabela ${table.name}:`, err.message);
      failCount++;
    }
  }

  console.log("\n=== RESULTADO DA AUDITORIA ===");
  console.log(`Tabelas verificadas com sucesso: ${successCount}/${tablesToAudit.length}`);
  if (failCount > 0) {
    console.log(`Tabelas com falha: ${failCount}`);
  } else {
    console.log("🎉 Todas as tabelas e colunas críticas estão criadas corretamente no Supabase!");
  }

  await prisma.$disconnect();
}

main();

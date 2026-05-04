import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function auditDatabase() {
  console.log("🔍 Iniciando Auditoria de Banco de Dados...");
  
  try {
    // 1. Teste de Conexão Simples
    await prisma.$connect();
    console.log("✅ Conexão com o Banco de Dados: ESTABELECIDA");

    // 2. Listar Tabelas Reais via SQL Nativo
    const tables: any[] = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `;
    
    console.log("\n--- TABELAS ENCONTRADAS ---");
    tables.forEach(t => console.log(`- ${t.table_name}`));

    // 3. Verificar se as tabelas críticas do Módulo de Configuração (que dá 500) existem
    const criticalTables = ['platform_configs', 'users', 'events', 'orders'];
    for (const table of criticalTables) {
      const exists = tables.some(t => t.table_name === table);
      if (!exists) {
        console.error(`❌ TABELA CRÍTICA FALTANTE: ${table}`);
      } else {
        // Listar colunas da tabela
        const columns: any[] = await prisma.$queryRawUnsafe(`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = '${table}'
        `);
        console.log(`\nColunas em [${table}]:`);
        columns.forEach(c => console.log(`  └─ ${c.column_name} (${c.data_type})`));
      }
    }

  } catch (err) {
    console.error("❌ ERRO FATAL NA AUDITORIA:", err);
  } finally {
    await prisma.$disconnect();
  }
}

auditDatabase();

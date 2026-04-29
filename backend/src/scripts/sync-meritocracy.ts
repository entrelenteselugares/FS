import { PrismaClient } from "@prisma/client";
import axios from "axios";

const prisma = new PrismaClient();

async function syncMeritocracy() {
  console.log("🚀 Iniciando Sincronização de Meritocracia...");
  
  try {
    // 1. Busca cotação do Euro
    const { data: coinData } = await axios.get("https://economia.awesomeapi.com.br/json/last/EUR-BRL");
    const eurRate = Number(coinData.EURBRL.bid);
    const floorRate = eurRate * 10;
    const ceilingRate = 200;

    console.log(`💶 Cotação Euro: R$ ${eurRate.toFixed(2)} | Piso: R$ ${floorRate.toFixed(2)}`);

    // 2. Busca todos os profissionais
    const profissionais = await prisma.profissional.findMany();
    
    console.log(`📸 Processando ${profissionais.length} profissionais...`);

    for (const pro of profissionais) {
      // Recalcula o multiplicador
      let calculatedMultiplier = 1.0;
      
      const equipmentList = pro.equipmentList as any[];
      if (Array.isArray(equipmentList)) {
        const totalValue = equipmentList.reduce((acc: number, curr: any) => acc + (Number(curr.value) || 0), 0);
        calculatedMultiplier += (totalValue / 5000) * 0.2;
      }

      if (pro.experienceYears) {
        calculatedMultiplier += (Number(pro.experienceYears) * 0.1);
      }

      const finalMultiplier = Number(Math.min(Math.max(calculatedMultiplier, 1.0), 5.0).toFixed(2));
      
      // Calcula o novo Valor Hora Automático
      const autoHourlyRate = floorRate + (ceilingRate - floorRate) * (finalMultiplier - 1) / (5 - 1);

      await prisma.profissional.update({
        where: { id: pro.id },
        data: {
          equipmentMultiplier: finalMultiplier,
          hourlyRate: autoHourlyRate
        }
      });
      
      console.log(`✅ [${pro.id}] Multiplicador: ${finalMultiplier} | Novo Valor Hora: R$ ${autoHourlyRate.toFixed(2)}`);
    }

    console.log("✨ Sincronização concluída com sucesso!");
  } catch (err) {
    console.error("❌ Erro na sincronização:", err);
  } finally {
    await prisma.$disconnect();
  }
}

syncMeritocracy();

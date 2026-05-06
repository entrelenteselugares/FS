import { prisma } from "../lib/prisma";

export class IoTService {
  /**
   * Registra ou atualiza o status de um dispositivo IoT
   */
  static async updateHeartbeat(agentId: string, name: string = "Printer Agent") {
    return await prisma.ioTDevice.upsert({
      where: { agentId },
      update: { 
        lastSeen: new Date(),
        status: "ONLINE" 
      },
      create: {
        agentId,
        name,
        status: "ONLINE"
      }
    });
  }

  /**
   * Monitora dispositivos offline
   */
  static async checkOfflineDevices() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    
    // Atualiza para OFFLINE quem não é visto há mais de 2 minutos
    const result = await prisma.ioTDevice.updateMany({
      where: {
        lastSeen: { lt: twoMinutesAgo },
        status: "ONLINE"
      },
      data: {
        status: "OFFLINE"
      }
    });

    if (result.count > 0) {
      console.warn(`[IoT MONITOR] ⚠️  ${result.count} dispositivos entraram em estado OFFLINE.`);
      // Aqui poderíamos disparar um webhook para um sistema de alerta (Slack/Discord/Pushover)
    }
  }
}

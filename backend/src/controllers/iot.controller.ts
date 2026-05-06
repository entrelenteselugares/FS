import { Request, Response } from "express";
import { IoTService } from "../services/iot.service";
import { prisma } from "../lib/prisma";

export class IoTController {
  static async heartbeat(req: Request, res: Response) {
    const { agentId, name } = req.body;

    if (!agentId) {
      return res.status(400).json({ error: "agentId is required" });
    }

    try {
      const device = await IoTService.updateHeartbeat(agentId, name);
      return res.json({ 
        ok: true, 
        status: device.status,
        lastSeen: device.lastSeen 
      });
    } catch (err: any) {
      console.error("[IoT HEARTBEAT] Error:", err);
      return res.status(500).json({ error: "Internal server error" });
    }
  }

  static async listDevices(_req: Request, res: Response) {
    try {
      const devices = await prisma.ioTDevice.findMany({
        orderBy: { lastSeen: "desc" }
      });
      return res.json(devices);
    } catch (err: any) {
      return res.status(500).json({ error: "Internal server error" });
    }
  }
}

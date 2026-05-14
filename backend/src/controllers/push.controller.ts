import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { webpush } from "../lib/push";

export const subscribe = async (req: Request, res: Response) => {
  try {
    const { subscription, userId } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({ error: "Assinatura inválida" });
    }

    // Upsert subscription
    await prisma.pushSubscription.upsert({
      where: { endpoint: subscription.endpoint },
      update: {
        userId,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
      create: {
        userId,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    });

    res.status(201).json({ success: true });
  } catch (err) {
    console.error("[PUSH SUBSCRIBE ERROR]", err);
    res.status(500).json({ error: "Erro ao salvar assinatura" });
  }
};

export const sendTestPush = async (req: Request, res: Response) => {
  try {
    const { userId, title, body } = req.body;
    
    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId }
    });

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: "Nenhuma assinatura encontrada para este usuário" });
    }

    const notifications = subscriptions.map(sub => {
      const pushConfig = {
        endpoint: sub.endpoint,
        keys: {
          auth: sub.auth,
          p256dh: sub.p256dh
        }
      };

      return webpush.sendNotification(
        pushConfig,
        JSON.stringify({ title, body })
      );
    });

    await Promise.all(notifications);
    res.json({ success: true, sentTo: subscriptions.length });
  } catch (err) {
    console.error("[PUSH TEST ERROR]", err);
    res.status(500).json({ error: "Erro ao enviar notificação" });
  }
};

export const unsubscribe = async (req: Request, res: Response) => {
  try {
    const { endpoint } = req.body;
    await prisma.pushSubscription.deleteMany({
      where: { endpoint },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erro ao remover assinatura" });
  }
};

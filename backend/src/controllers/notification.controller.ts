import { Response } from "express";
import { AuthRequest } from "../lib/auth";
import { prisma } from "../lib/prisma";

// GET /api/notifications/unread-count — badge count (lightweight polling)
export async function getUnreadCount(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado." }); return; }

  try {
    const count = await prisma.notification.count({ where: { userId, read: false } });
    res.json({ count });
  } catch (err) {
    console.error("getUnreadCount:", err);
    res.status(500).json({ error: "Erro ao buscar contagem." });
  }
}

// GET /api/notifications — unread + last 20 read, ordered by createdAt desc
export async function listNotifications(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado." }); return; }

  try {
    const unread = await prisma.notification.findMany({
      where: { userId, read: false },
      orderBy: { createdAt: "desc" }
    });
    const read = await prisma.notification.findMany({
      where: { userId, read: true },
      orderBy: { createdAt: "desc" },
      take: 20
    });
    res.json({ notifications: [...unread, ...read] });
  } catch (err) {
    console.error("listNotifications:", err);
    res.status(500).json({ error: "Erro ao listar notificações." });
  }
}

// PATCH /api/notifications/:id/read — mark one as read
export async function markAsRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  const { id } = req.params;
  if (!userId) { res.status(401).json({ error: "Não autorizado." }); return; }

  try {
    const notifId = String(id);
    const notif = await prisma.notification.findUnique({ where: { id: notifId } });
    if (!notif || notif.userId !== userId) {
      res.status(404).json({ error: "Notificação não encontrada." });
      return;
    }
    await prisma.notification.update({ where: { id: notifId }, data: { read: true } });
    res.json({ success: true });
  } catch (err) {
    console.error("markAsRead:", err);
    res.status(500).json({ error: "Erro ao marcar como lida." });
  }
}

// PATCH /api/notifications/read-all — mark all as read for current user
export async function markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
  const userId = req.user?.userId;
  if (!userId) { res.status(401).json({ error: "Não autorizado." }); return; }

  try {
    const result = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true }
    });
    res.json({ success: true, updated: result.count });
  } catch (err) {
    console.error("markAllAsRead:", err);
    res.status(500).json({ error: "Erro ao marcar todas como lidas." });
  }
}

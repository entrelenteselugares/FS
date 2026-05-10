import { useState, useEffect, useCallback } from "react";
import { API as api } from "../lib/api";
import { useAuth } from "./useAuth";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  refId: string | null;
  refType: string | null;
  read: boolean;
  createdAt: string;
}

export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err) {
      console.error("Failed to fetch unread count:", err);
    }
  }, [user]);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.notifications.filter((n: AppNotification) => !n.read).length);
    } catch (err) {
      console.error("Failed to fetch notifications feed:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Polling a cada 30 segundos para contagem
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const toggleFeed = () => {
    if (!isOpen) fetchFeed(); // Carrega feed completo ao abrir
    setIsOpen(!isOpen);
  };

  const markAsRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  };

  return {
    notifications,
    unreadCount,
    isOpen,
    loading,
    setIsOpen,
    toggleFeed,
    markAsRead,
    markAllAsRead,
    fetchFeed
  };
}

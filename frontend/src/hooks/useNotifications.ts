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
    const token = localStorage.getItem("fs_token");
    if (!token) return; // no auth token, skip request
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        // Token likely expired or invalid – clear and redirect to login
        localStorage.removeItem("fs_token");
        localStorage.removeItem("fs_refresh_token");
        window.location.href = "/login?session=expired";
        return;
      }
      console.error("Failed to fetch unread count:", err);
    }
  }, [user]);

  const fetchFeed = useCallback(async () => {
    if (!user) return;
    const token = localStorage.getItem("fs_token");
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications);
      setUnreadCount(res.data.notifications.filter((n: AppNotification) => !n.read).length);
    } catch (err: any) {
      if (err?.response?.status === 401) {
        localStorage.removeItem("fs_token");
        localStorage.removeItem("fs_refresh_token");
        window.location.href = "/login?session=expired";
        return;
      }
      console.error("Failed to fetch notifications feed:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Polling a cada 30 segundos + Refresh ao focar na aba
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadCount();
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
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
    fetchFeed,
    user
  };
}

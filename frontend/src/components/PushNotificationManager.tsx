import React, { useEffect, useState, useCallback } from "react";
import { Bell, X } from "lucide-react";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

export const PushNotificationManager: React.FC = () => {
  const { user } = useAuth();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>(() => 
    (typeof window !== 'undefined' && "Notification" in window) ? Notification.permission : "default"
  );
  const [showPrompt, setShowPrompt] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!("serviceWorker" in navigator)) {
      console.warn("[PUSH] Service Worker not supported");
      return;
    }
    
    const dismissed = localStorage.getItem("fs_push_prompt_dismissed");
    if (dismissed === "true") return;

    console.log("[PUSH] Checking subscription...");
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    setIsSubscribed(!!subscription);
    
    if (!subscription && user && Notification.permission === "default") {
      console.log("[PUSH] Showing prompt in 5s...");
      if (!VAPID_PUBLIC_KEY) {
        console.warn("[PUSH] VITE_VAPID_PUBLIC_KEY not set — prompt suppressed");
        return;
      }
      const timer = setTimeout(() => setShowPrompt(true), 5000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  useEffect(() => {
    const cleanup = checkSubscription();
    return () => {
      if (typeof cleanup === 'function') cleanup();
    };
  }, [checkSubscription]);

  const subscribe = async () => {
    localStorage.setItem("fs_push_prompt_dismissed", "true");
    setShowPrompt(false);
    if (!VAPID_PUBLIC_KEY) {
      console.error("[PUSH] VITE_VAPID_PUBLIC_KEY is not configured.");
      return;
    }
    try {
      const registration = await navigator.serviceWorker.ready;
      const convertedVapidKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      await api.post("/push/subscribe", {
        subscription,
        userId: user?.id,
      });

      setIsSubscribed(true);
      setPermission("granted");
      console.log("[PUSH] Subscribed successfully");
    } catch (err) {
      console.error("[PUSH] Subscription failed", err);
    }
  };

  const handleClose = () => {
    localStorage.setItem("fs_push_prompt_dismissed", "true");
    setShowPrompt(false);
  };

  if (!user || permission === "denied" || (isSubscribed && !showPrompt)) return null;

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-80 bg-zinc-900 border border-brand-tactical/30 p-6 rounded-2xl shadow-2xl z-[100] animate-in fade-in slide-in-from-bottom-4 duration-500">
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-brand-tactical/10 rounded-full flex items-center justify-center text-brand-tactical">
              <Bell size={24} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-tighter italic">Notificações</h4>
              <p className="text-[10px] text-zinc-400 uppercase tracking-widest">Ative alertas de entrega e vendas</p>
            </div>
          </div>

          <button
            onClick={subscribe}
            className="w-full bg-brand-tactical text-black font-black uppercase tracking-[0.2em] text-[10px] py-3 rounded-xl hover:bg-white transition-all italic"
          >
            Ativar Agora
          </button>
        </div>
      )}
    </>
  );
};

function urlBase64ToUint8Array(base64String: string) {
  if (!base64String) return new Uint8Array(0);
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

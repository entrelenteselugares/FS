import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { getEvent, createCheckout } from "../api";
import type { EventData } from "../api";
import { PaywallView } from "../components/PaywallView";
import { DeliveryView } from "../components/DeliveryView";
import { useAuth } from "../contexts/AuthContext";

const Spinner = () => (
  <svg className="animate-spin h-10 w-10 text-brand-indigo" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const getSafeUUID = () => {
    try {
        return crypto.randomUUID();
    } catch {
        return Math.random().toString(36).substring(2) + Date.now().toString(36);
    }
};

export const EventPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId] = useState(() => localStorage.getItem("tempUserId") || getSafeUUID());

  // Salvar ID temporário para persistência do polling no checkout
  useEffect(() => {
    localStorage.setItem("tempUserId", userId);
  }, [userId]);

  const fetchData = useCallback(async () => {
    if (!id) return;
    try {
      const data = await getEvent(id, userId);
      setEvent(data);
    } catch (error) {
      console.error("Erro ao carregar evento:", error);
    } finally {
      setLoading(false);
    }
  }, [id, userId]);

  // Initial Fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SHORT POLLING: Se o checkout estiver ativo e o paywall existir, checa a cada 3s
  useEffect(() => {
    let interval: number | undefined;
    
    if (event?.paywall?.active) {
      interval = window.setInterval(async () => {
        try {
          const data = await getEvent(id!, userId);
          if (!data?.paywall?.active) {
            setEvent(data);
            window.clearInterval(interval);
          }
        } catch (e) {
          console.error("Erro no polling de pagamento.");
        }
      }, 3000);
    }

    return () => window.clearInterval(interval);
  }, [event?.paywall?.active, id, userId]);

  const { user } = useAuth();

  const handleCheckout = async () => {
    if (!id) return;
    setIsProcessing(true);
    
    // Prioriza o email do usuário logado, senão usa um placeholder/prompt para sandbox
    const checkoutEmail = user?.email || "cliente-sandbox@teste.com";

    try {
      const response = await createCheckout({
        eventId: id,
        userId,
        email: checkoutEmail,
        method: "pix",
      });
      
      console.log("Checkout gerado para:", checkoutEmail, response);
      alert(`Checkout Gerado para ${checkoutEmail}. O sistema agora está monitorando o pagamento em tempo real...`);

    } catch (error) {
       alert("Erro ao processar pagamento.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#050505]">
        <Spinner />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-700 animate-pulse mt-6">Sincronizando Memórias...</p>
      </div>
    );
  }

  if (!event) return <div className="p-20 text-center text-zinc-500">Evento não encontrado.</div>;

  return (
    <>
      {event?.paywall?.active ? (
        <PaywallView event={event} onCheckout={handleCheckout} isProcessing={isProcessing} />
      ) : (
        <DeliveryView event={event} />
      )}
    </>
  );
};

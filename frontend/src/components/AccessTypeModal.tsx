import { useState } from "react";
import { API as api } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";
import { AxiosError } from "axios";

import { Shield, Lock, Globe, AlertTriangle, CheckCircle2, X } from "lucide-react";

interface AccessTypeModalProps {
  orderId: string;
  eventTitle: string;
  isPrimaryClient?: boolean;
  isMarketplace?: boolean;
  onConfirmed: (accessType: string, expiresAt: string) => void;
  onClose?: () => void;
}

export default function AccessTypeModal({ orderId, eventTitle, isPrimaryClient, isMarketplace, onConfirmed, onClose }: AccessTypeModalProps) {
  useTheme();
  const [selected, setSelected] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // SEGURANÇA: Se não for o cliente primário, não renderiza nada.
  if (isPrimaryClient === false) return null;

  const handleConfirm = async () => {
    if (!selected) return;
    
    // Se for pré-pagamento, apenas notifica o pai sem chamar API
    if (orderId === "PRE-PAYMENT") {
      onConfirmed(selected, new Date().toISOString());
      return;
    }

    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/orders/${orderId}/access-type`, {
        accessType: selected,
      });
      onConfirmed(data.accessType, data.accessExpiresAt);
    } catch (err) {
      const axiosError = err as AxiosError<{ error: string }>;
      setError(axiosError.response?.data?.error ?? "Erro ao salvar escolha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <div 
        className="bg-theme-bg border border-theme-border max-w-md w-full overflow-y-auto max-h-[95vh] shadow-2xl custom-scrollbar"
      >
        {/* Header */}
        <div className="p-6 pb-0 relative">
          {onClose && (
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 text-theme-muted hover:text-theme-text transition-colors"
            >
              <X size={20} />
            </button>
          )}
          <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-[0.4em] text-brand-tactical mb-3">
             <Shield size={12} strokeWidth={2} />
             <span>Configurações de Privacidade</span>
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tighter text-theme-text mb-3" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {eventTitle}
          </h2>
          <p className="text-[11px] text-theme-muted font-bold uppercase tracking-wider leading-relaxed border-b border-theme-border pb-5">
            Escolha como seus arquivos serão armazenados. <span className="text-theme-text font-black underline">Esta escolha é definitiva.</span>
          </p>
        </div>

        {/* Options */}
        <div className="p-6 space-y-3">
          {/* PUBLIC */}
          <button
            onClick={() => setSelected("PUBLIC")}
            className={`w-full text-left p-4 border transition-all duration-300 relative group
              ${selected === "PUBLIC" 
                ? "bg-brand-tactical/10 border-brand-tactical shadow-[0_0_20px_-10px_rgba(133,185,172,0.3)]" 
                : "bg-theme-bg-muted border-theme-border hover:border-theme-text/30"}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selected === "PUBLIC" ? "border-brand-tactical" : "border-theme-border"}`}>
                  {selected === "PUBLIC" && <div className="w-2 h-2 rounded-full bg-brand-tactical" />}
                </div>
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-theme-text">
                    <Globe size={12} className={selected === "PUBLIC" ? "text-brand-tactical" : "text-theme-muted"} />
                    Público
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border transition-colors
                ${selected === "PUBLIC" ? "bg-brand-tactical/10 border-brand-tactical text-brand-tactical" : "bg-theme-bg border-theme-border text-theme-muted"}`}>
                90 DIAS
              </span>
            </div>
            <p className="text-[11px] text-theme-muted font-bold uppercase tracking-tight ml-7 leading-relaxed">
              {isMarketplace 
                ? "Galeria aberta na vitrine para que visitantes possam adquirir fotos."
                : "Álbum listado na vitrine. Download ilimitado por 3 meses."}
            </p>
            {selected === "PUBLIC" && (
                <div 
                    className="ml-7 mt-3 p-2 bg-brand-tactical/10 border-l-2 border-brand-tactical text-[10px] text-brand-tactical uppercase font-bold tracking-widest leading-relaxed"
                >
                    Ideal para compartilhar com familiares e convidados.
                </div>
            )}
          </button>

          {/* PRIVATE */}
          <button
            onClick={() => setSelected("PRIVATE")}
            className={`w-full text-left p-4 border transition-all duration-300 relative group
              ${selected === "PRIVATE" 
                ? "bg-red-500/5 border-red-500/50 shadow-[0_0_20px_-10px_rgba(239,68,68,0.2)]" 
                : "bg-theme-bg-muted border-theme-border hover:border-theme-text/30"}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selected === "PRIVATE" ? "border-red-500" : "border-theme-border"}`}>
                  {selected === "PRIVATE" && <div className="w-2 h-2 rounded-full bg-red-500" />}
                </div>
                <span className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-[0.2em] text-theme-text">
                    <Lock size={12} className={selected === "PRIVATE" ? "text-red-500" : "text-theme-muted"} />
                    Privado
                </span>
              </div>
              <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-2 py-0.5 border transition-colors
                ${selected === "PRIVATE" ? "bg-red-500/10 border-red-500 text-red-500" : "bg-theme-bg border-theme-border text-theme-muted"}`}>
                15 DIAS
              </span>
            </div>
            <p className="text-[11px] text-theme-muted font-bold uppercase tracking-tight ml-7 leading-relaxed">
               {isMarketplace
                 ? "Galeria oculta da vitrine. Apenas você (com login) pode acessar e comprar."
                 : "Restrito ao seu login. Arquivos excluídos após 15 dias."}
            </p>
            {selected === "PRIVATE" && (
                <div 
                    className="ml-7 mt-3 p-2 bg-red-500/10 border-l-2 border-red-500 text-[10px] text-red-500 uppercase font-bold tracking-widest leading-relaxed"
                >
                    <AlertTriangle size={12} className="inline mr-2" />
                    Após o prazo, os registros serão deletados.
                </div>
            )}
          </button>
        </div>

        {/* Footer Legal & Actions */}
        <div className="p-6 pt-0 space-y-5">
          <div className="p-3 bg-theme-bg-muted border border-theme-border flex gap-3">
             <AlertTriangle size={20} className="text-theme-muted shrink-0" strokeWidth={1} />
             <p className="text-[9px] text-theme-muted font-medium uppercase tracking-wider leading-relaxed">
               <span className="text-theme-text font-bold">LGPD:</span> A exclusão definitiva faz parte da nossa política de minimização de risco e segurança.
             </p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-[10px] font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleConfirm}
              disabled={!selected || saving}
              className={`w-full py-5 font-black uppercase tracking-[0.4em] text-[11px] transition-all duration-500 flex items-center justify-center gap-3
                ${selected 
                  ? "bg-theme-text text-theme-bg hover:opacity-90 shadow-xl" 
                  : "bg-theme-border text-theme-muted cursor-not-allowed"}`}
            >
              {saving ? (
                <div className="w-4 h-4 border-2 border-theme-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={14} />
                  <span>Confirmar Escolha Editorial</span>
                </>
              )}
            </button>
            <p className="text-center text-[8px] font-black uppercase tracking-[0.2em] text-theme-muted mt-3">
              * Escolha definitiva e irreversível.
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}


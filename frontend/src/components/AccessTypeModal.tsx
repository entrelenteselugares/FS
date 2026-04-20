import { useState } from "react";
import { API as api } from "../lib/api";
import { useTheme } from "../contexts/ThemeContext";
import { motion } from "framer-motion";
import { Shield, Lock, Globe, AlertTriangle, CheckCircle2 } from "lucide-react";

interface AccessTypeModalProps {
  orderId: string;
  eventTitle: string;
  onConfirmed: (accessType: string, expiresAt: string) => void;
}

export default function AccessTypeModal({ orderId, eventTitle, onConfirmed }: AccessTypeModalProps) {
  useTheme();
  const [selected, setSelected] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    if (!selected) return;
    setSaving(true);
    setError("");
    try {
      const { data } = await api.post(`/orders/${orderId}/access-type`, {
        accessType: selected,
      });
      onConfirmed(data.accessType, data.accessExpiresAt);
    } catch (err: any) {
      setError(err.response?.data?.error ?? "Erro ao salvar escolha.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-theme-bg border border-theme-border max-w-lg w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="p-8 pb-0">
          <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-tactical mb-4">
             <Shield size={14} strokeWidth={2} />
             <span>Configurações de Privacidade</span>
          </div>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-theme-text mb-4" style={{ fontFamily: "'Outfit', sans-serif" }}>
            {eventTitle}
          </h2>
          <p className="text-[12px] text-theme-muted font-bold uppercase tracking-wider leading-relaxed border-b border-theme-border pb-6">
            Escolha como seus arquivos serão armazenados. <span className="text-theme-text font-black underline">Esta escolha é definitiva e irreversível.</span>
          </p>
        </div>

        {/* Options */}
        <div className="p-8 space-y-4">
          {/* PUBLIC */}
          <button
            onClick={() => setSelected("PUBLIC")}
            className={`w-full text-left p-6 border transition-all duration-300 relative group
              ${selected === "PUBLIC" 
                ? "bg-brand-tactical/5 border-brand-tactical shadow-[0_0_30px_-10px_rgba(133,185,172,0.3)]" 
                : "bg-theme-bg-muted border-theme-border hover:border-theme-text/30"}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selected === "PUBLIC" ? "border-brand-tactical" : "border-theme-border"}`}>
                  {selected === "PUBLIC" && <div className="w-2.5 h-2.5 rounded-full bg-brand-tactical" />}
                </div>
                <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.2em] text-theme-text">
                        <Globe size={14} className={selected === "PUBLIC" ? "text-brand-tactical" : "text-theme-muted"} />
                        Público
                    </span>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border transition-colors
                ${selected === "PUBLIC" ? "bg-brand-tactical/10 border-brand-tactical text-brand-tactical" : "bg-theme-bg border-theme-border text-theme-muted"}`}>
                90 DIAS
              </span>
            </div>
            <p className="text-[12px] text-theme-muted line-clamp-2 font-bold uppercase tracking-tight ml-9">
              Álbum listado na vitrine e compartilhável via link. Download ilimitado por 3 meses.
            </p>
            {selected === "PUBLIC" && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-9 mt-4 p-3 bg-brand-tactical/10 border-l-2 border-brand-tactical text-[11px] text-brand-tactical uppercase font-bold tracking-widest leading-relaxed"
                >
                    Indicado para quem deseja compartilhar as memórias com familiares e convidados.
                </motion.div>
            )}
          </button>

          {/* PRIVATE */}
          <button
            onClick={() => setSelected("PRIVATE")}
            className={`w-full text-left p-6 border transition-all duration-300 relative group
              ${selected === "PRIVATE" 
                ? "bg-red-500/5 border-red-500/50 shadow-[0_0_30px_-10px_rgba(239,68,68,0.2)]" 
                : "bg-theme-bg-muted border-theme-border hover:border-theme-text/30"}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${selected === "PRIVATE" ? "border-red-500" : "border-theme-border"}`}>
                  {selected === "PRIVATE" && <div className="w-2.5 h-2.5 rounded-full bg-red-500" />}
                </div>
                <div className="flex flex-col">
                    <span className="flex items-center gap-2 text-[14px] font-bold uppercase tracking-[0.2em] text-theme-text">
                        <Lock size={14} className={selected === "PRIVATE" ? "text-red-500" : "text-theme-muted"} />
                        Privado
                    </span>
                </div>
              </div>
              <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-3 py-1 border transition-colors
                ${selected === "PRIVATE" ? "bg-red-500/10 border-red-500 text-red-500" : "bg-theme-bg border-theme-border text-theme-muted"}`}>
                15 DIAS
              </span>
            </div>
            <p className="text-[12px] text-theme-muted line-clamp-2 font-bold uppercase tracking-tight ml-9">
               Acesso restrito apenas ao seu login. Arquivos excluídos permanentemente após 15 dias.
            </p>
            {selected === "PRIVATE" && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="ml-9 mt-4 p-3 bg-red-500/10 border-l-2 border-red-500 text-[11px] text-red-500 uppercase font-bold tracking-widest leading-relaxed"
                >
                    <AlertTriangle size={14} className="inline mr-2" />
                    Após o prazo, os registros não poderão ser recuperados sob nenhuma hipótese.
                </motion.div>
            )}
          </button>
        </div>

        {/* Footer Legal & Actions */}
        <div className="p-8 pt-0 space-y-6">
          <div className="p-4 bg-theme-bg-muted border border-theme-border flex gap-4">
             <AlertTriangle size={24} className="text-theme-muted shrink-0" strokeWidth={1} />
             <p className="text-[10px] text-theme-muted font-medium uppercase tracking-wider leading-relaxed">
               <span className="text-theme-text font-bold">LGPD (Lei 13.709):</span> Seus dados estão sendo processados em conformidade com a legislação brasileira. A exclusão definitiva faz parte da nossa política de minimização de risco e segurança.
             </p>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-500 text-[11px] font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}

          <div>
            <button
              onClick={handleConfirm}
              disabled={!selected || saving}
              className={`w-full py-6 font-black uppercase tracking-[0.4em] text-[12px] transition-all duration-500 flex items-center justify-center gap-3
                ${selected 
                  ? "bg-theme-text text-theme-bg hover:opacity-90 shadow-xl" 
                  : "bg-theme-border text-theme-muted cursor-not-allowed"}`}
            >
              {saving ? (
                <div className="w-5 h-5 border-2 border-theme-bg border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Confirmar Escolha Editorial</span>
                </>
              )}
            </button>
            <p className="text-center text-[9px] font-black uppercase tracking-[0.2em] text-theme-muted mt-4">
              * Ao clicar em confirmar, você aceita os termos de armazenamento escolhidos.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}


import { useState } from "react";
import { createPortal } from "react-dom";
import { X, Zap, Sparkles, Calendar, Clock } from "lucide-react";
import { API } from "../../lib/api";
import { TeamSelector } from "./TeamSelector";
import type { Partner } from "./types";

interface FlashEventModalProps {
  onClose: () => void;
  onSuccess: (slug: string) => void;
  onError: (msg: string) => void;
  network: Partner[];
}

export function FlashEventModal({ onClose, onSuccess, onError, network }: FlashEventModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("1");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("19:00");
  const [endTime, setEndTime] = useState("23:00");
  const [delegatedUserId, setDelegatedUserId] = useState<string | null>(null);
  const [isPublicCall, setIsPublicCall] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/profissional/flash-event", {
        name,
        pricePerPhoto: Number(price),
        city,
        dataEvento: date,
        startTime,
        endTime,
        captacaoId: delegatedUserId,
        isPublicCall,
        isPrivate
      });
      onSuccess(data.slug);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar Foto Print Live.";
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300 dark:bg-black/95" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-full sm:h-[80vh] max-w-xl flex flex-col border-none sm:border border-theme-border/60 rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl z-[10000] bg-theme-card">
        
        {/* Header */}
        <div className="p-8 md:p-10 border-b flex items-center justify-between shrink-0" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-yellow-400/10 rounded-2xl flex items-center justify-center border border-yellow-400/20">
              < Zap className="text-yellow-400" size={24} />
            </div>
            <div>
              <div className="text-[9px] font-black text-yellow-400 uppercase tracking-[0.4em] italic opacity-60">Acesso Instantâneo</div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text leading-none">Foto Print Live</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-full transition-all active:scale-90 text-theme-text/40">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Nome da Ocasião / Evento</label>
              <input
                required
                autoFocus
                placeholder="Ex: Ensaio no Parque, Festa do João..."
                value={name}
                onChange={e => setName(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-medium"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Preço de Venda (Por Foto R$)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-400 font-black text-sm">R$</span>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  className="w-full bg-theme-bg-muted border border-theme-border p-4 pl-12 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-black text-xl italic"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Cidade</label>
              <input
                required
                placeholder="Ex: Campinas"
                value={city}
                onChange={e => setCity(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-medium"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
                  <Calendar size={12} /> Data
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-black text-xs italic"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
                  <Clock size={12} /> Início — Término
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-black text-xs italic"
                  />
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-yellow-400/50 transition-all font-black text-xs italic"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-theme-border/30">
              <TeamSelector 
                label="Quem irá capturar?"
                network={network}
                onSelect={(uid, pub) => {
                  setDelegatedUserId(uid);
                  setIsPublicCall(pub);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-theme-bg-muted border border-theme-border">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Visibilidade</p>
                <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest">
                  {isPrivate ? 'Privado (Link Direto)' : 'Público (Aparece no Site)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-zinc-700' : 'bg-brand-tactical'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-1' : 'left-7'}`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full py-5 bg-yellow-400 text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.01] active:scale-[0.98] transition-all italic flex items-center justify-center gap-4 shadow-2xl shadow-yellow-400/20 disabled:opacity-40"
            >
              {loading ? (
                "GERANDO SISTEMA..."
              ) : (
                <>
                  ATIVAR QR CODE AGORA <Sparkles size={16} />
                </>
              )}
            </button>
          </form>
          
          <p className="text-[9px] text-center text-theme-muted uppercase tracking-[0.2em] leading-relaxed opacity-40 font-black italic">
            O evento será ativado instantaneamente. <br />
            Você poderá capturar fotos e o cliente pagará para baixar/imprimir.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}

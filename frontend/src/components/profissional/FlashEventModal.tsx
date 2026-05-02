import { useState } from "react";
import { X, Zap, Sparkles } from "lucide-react";
import { API } from "../../lib/api";

interface FlashEventModalProps {
  onClose: () => void;
  onSuccess: (slug: string) => void;
  onError: (msg: string) => void;
}

export function FlashEventModal({ onClose, onSuccess, onError }: FlashEventModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("30");
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/profissional/flash-event", {
        name,
        pricePerPhoto: Number(price),
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

  return (
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-theme-bg border border-theme-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-tactical via-yellow-400 to-brand-tactical animate-pulse" />
        
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-yellow-400">
                <Zap size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Acesso Instantâneo</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-theme-text uppercase italic leading-none">Foto Print Live</h2>
            </div>
            <button onClick={onClose} className="text-theme-muted hover:text-brand-tactical transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
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
              className="w-full py-5 bg-yellow-400 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-3 italic"
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
          
          <p className="text-[9px] text-center text-theme-muted uppercase tracking-widest leading-relaxed opacity-60">
            O evento será ativado instantaneamente. <br />
            Você poderá capturar fotos e o cliente pagará para baixar/imprimir.
          </p>
        </div>
      </div>
    </div>
  );
}

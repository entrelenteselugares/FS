import { useState } from "react";
import { X, Camera, Sparkles, MapPin, ListChecks, Link as LinkIcon } from "lucide-react";
import { API } from "../../lib/api";
import { CoverPhotoInput } from "./CoverPhotoInput";

interface FotoPointModalProps {
  onClose: () => void;
  onSuccess: (slug: string) => void;
  onError: (msg: string) => void;
}

export function FotoPointModal({ onClose, onSuccess, onError }: FotoPointModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("10");
  const [location, setLocation] = useState("");
  const [itinerary, setItinerary] = useState("");
  const [references, setReferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/profissional/foto-point", {
        name,
        priceUnit: Number(price),
        location,
        itinerary,
        references: references.split("\n").filter(r => r.trim() !== ""),
        isPrivate,
        coverPhotoUrl,
      });

      // Se a capa é base64 (upload sem eventId), sobe agora que temos o eventId
      if (coverPhotoUrl && coverPhotoUrl.startsWith("data:") && data.eventId) {
        try {
          await API.patch(`/profissional/events/${data.eventId}/cover`, {
            imageBase64: coverPhotoUrl,
            mimeType: coverPhotoUrl.split(";")[0].split(":")[1],
          });
        } catch (uploadErr) {
          console.warn("Upload de capa falhou após criação:", uploadErr);
        }
      }

      onSuccess(data.slug);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Erro ao criar Foto Point.";
      onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/60 animate-in fade-in duration-300"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl bg-theme-bg border border-theme-border shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-400 animate-pulse" />
        
        <div className="p-8 space-y-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <Camera size={14} fill="currentColor" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Nova Categoria: Foto Point</span>
              </div>
              <h2 className="text-2xl font-heading font-black text-theme-text uppercase italic leading-none">Configurar Ponto de Venda</h2>
            </div>
            <button onClick={onClose} className="text-theme-muted hover:text-cyan-400 transition-colors">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Título do Ponto</label>
                    <input
                        required
                        autoFocus
                        placeholder="Ex: Ensaio Urbano - Av. Paulista"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic">Valor por Click (R$)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-black text-sm">R$</span>
                        <input
                            type="number"
                            required
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="w-full bg-theme-bg-muted border border-theme-border p-4 pl-12 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-black text-xl italic"
                        />
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
                    <MapPin size={12} /> Localização Exata
                </label>
                <input
                    placeholder="Ex: Em frente ao MASP, entre os pilares..."
                    value={location}
                    onChange={e => setLocation(e.target.value)}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
                    <ListChecks size={12} /> Roteiro / O que será entregue
                </label>
                <textarea
                    placeholder="Descreva o roteiro de fotos ou o que está incluso no click..."
                    value={itinerary}
                    onChange={e => setItinerary(e.target.value)}
                    rows={3}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium resize-none"
                />
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
                    <LinkIcon size={12} /> Referências (Links ou Descrição)
                </label>
                <textarea
                    placeholder="Cole links de referências ou descreva o estilo (um por linha)..."
                    value={references}
                    onChange={e => setReferences(e.target.value)}
                    rows={3}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium resize-none"
                />
            </div>

            <CoverPhotoInput onChange={setCoverPhotoUrl} />

            <div className="flex items-center justify-between p-4 bg-theme-bg-muted border border-theme-border">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Visibilidade no Marketplace</p>
                <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest">
                  {isPrivate ? 'Privado (Apenas via QR Code/Link)' : 'Público (Aparece na Homepage do Foto Point)'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-zinc-700' : 'bg-cyan-400'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isPrivate ? 'left-1' : 'left-7'}`} />
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !name}
              className="w-full py-5 bg-cyan-400 text-black text-[12px] font-black uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 transition-all flex items-center justify-center gap-3 italic"
            >
              {loading ? (
                "PUBLICANDO PONTO..."
              ) : (
                <>
                  ATIVAR FOTO POINT AGORA <Sparkles size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

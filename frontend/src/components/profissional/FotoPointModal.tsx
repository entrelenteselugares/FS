import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { X, Camera, Sparkles, MapPin, ListChecks, Link as LinkIcon, Calendar } from "lucide-react";
import { API } from "../../lib/api";
import { CoverPhotoInput } from "./CoverPhotoInput";

import { TeamSelector } from "./TeamSelector";
import type { Partner } from "./types";

interface FotoPointModalProps {
  onClose: () => void;
  onSuccess: (slug: string) => void;
  onError: (msg: string) => void;
  network: Partner[];
}

export function FotoPointModal({ onClose, onSuccess, onError, network }: FotoPointModalProps) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("10");
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [uf, setUf] = useState("");
  const [statesList, setStatesList] = useState<{sigla: string; nome: string}[]>([]);
  const [citiesList, setCitiesList] = useState<{nome: string}[]>([]);
  const [itinerary, setItinerary] = useState("");
  const [references, setReferences] = useState("");
  const [loading, setLoading] = useState(false);
  const [isPrivate, setIsPrivate] = useState(true);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("18:00");
  const [coverPhotoUrl, setCoverPhotoUrl] = useState<string | null>(null);
  const [coverPosition, setCoverPosition] = useState<string>("center");
  const [delegatedUserId, setDelegatedUserId] = useState<string | null>(null);
  const [isPublicCall, setIsPublicCall] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then(res => res.json())
      .then(data => setStatesList(data))
      .catch(err => console.error("Erro ao carregar estados:", err));
  }, []);

  useEffect(() => {
    if (!uf) {
      setCitiesList([]);
      return;
    }
    fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`)
      .then(res => res.json())
      .then(data => setCitiesList(data))
      .catch(err => console.error("Erro ao carregar cidades:", err));
  }, [uf]);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.post("/profissional/foto-point", {
        name,
        priceUnit: Number(price),
        city: city ? `${city} - ${uf}` : "",
        location,
        itinerary,
        dataEvento: date,
        startTime,
        endTime,
        captacaoId: delegatedUserId,
        isPublicCall,
        references: references.split("\n").filter(r => r.trim() !== ""),
        isPrivate,
        // coverPhotoUrl is intentionally excluded from POST to avoid 413.
        // It is always sent in a separate PATCH below.
        coverPosition,
      });

      // Após criar o evento, enviar a capa em PATCH separado para evitar 413 Payload Too Large.
      if (coverPhotoUrl && data.eventId) {
        try {
          if (coverPhotoUrl.startsWith("data:")) {
            // Arquivo local comprimido — enviar como base64
            await API.patch(`/profissional/events/${data.eventId}/cover`, {
              imageBase64: coverPhotoUrl,
              mimeType: "image/jpeg",
              coverPosition,
            });
          } else {
            // URL externa (Google Drive, etc.) — enviar diretamente
            await API.patch(`/profissional/events/${data.eventId}/cover`, {
              coverPhotoUrl,
              coverPosition,
            });
          }
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


  return createPortal(
    <div className="fixed inset-0 z-[8000] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300 dark:bg-black/95" 
        onClick={onClose} 
      />

      {/* Modal Container */}
      <div className="relative w-full h-full sm:h-[85vh] max-w-2xl flex flex-col border-none sm:border border-theme-border rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl z-[10000] bg-theme-card">
        
        {/* Header */}
        <div className="p-8 md:p-10 border-b flex items-center justify-between shrink-0" style={{ borderColor: "var(--theme-border)" }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-cyan-400/10 rounded-2xl flex items-center justify-center border border-cyan-400/20">
              <Camera className="text-cyan-400" size={24} />
            </div>
            <div>
              <div className="text-[9px] font-bold text-cyan-400 uppercase tracking-[0.4em] opacity-60">Nova Categoria: Foto Point</div>
              <h2 className="text-2xl font-bold uppercase text-theme-text leading-none">Configurar Ponto de Venda</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all active:scale-90 text-theme-text/40">
            <X size={24} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest ">Título do Ponto</label>
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
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest ">Valor por Click (R$)</label>
                    <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-400 font-bold text-sm">R$</span>
                        <input
                            type="number"
                            required
                            value={price}
                            onChange={e => setPrice(e.target.value)}
                            className="w-full bg-theme-bg-muted border border-theme-border p-4 pl-12 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-bold text-xl "
                        />
                    </div>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                        <Calendar size={12} /> Data da Operação
                    </label>
                    <input
                        type="date"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium"
                    />
                </div>
                
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                        Início
                    </label>
                    <input
                        type="time"
                        required
                        value={startTime}
                        onChange={e => setStartTime(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                        Fim
                    </label>
                    <input
                        type="time"
                        required
                        value={endTime}
                        onChange={e => setEndTime(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4">
                    <div className="space-y-2 w-[100px]">
                        <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                            <MapPin size={12} /> Estado
                        </label>
                        <select
                            required
                            value={uf}
                            onChange={e => {
                                setUf(e.target.value);
                                setCity("");
                            }}
                            className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium appearance-none"
                        >
                            <option value="">UF</option>
                            {statesList.map(state => (
                                <option key={state.sigla} value={state.sigla}>{state.sigla}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2 flex-1">
                        <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                            Cidade
                        </label>
                        <select
                            required
                            disabled={!uf || citiesList.length === 0}
                            value={city}
                            onChange={e => setCity(e.target.value)}
                            className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-cyan-400/50 transition-all font-medium appearance-none disabled:opacity-50"
                        >
                            <option value="">Selecione...</option>
                            {citiesList.map(c => (
                                <option key={c.nome} value={c.nome}>{c.nome}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
                        <MapPin size={12} /> Localização (Google Maps ou Ponto Ref.)
                    </label>
                    <input
                        placeholder="Ex: https://maps.app.goo.gl/... ou MASP"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        className={`w-full bg-theme-bg-muted border p-4 text-theme-text outline-none transition-all font-medium ${location.includes('maps.') || location.includes('http') ? 'border-green-400/50 text-green-400 focus:border-green-400' : 'border-theme-border focus:border-cyan-400/50'}`}
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
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
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
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

            <CoverPhotoInput 
              currentPosition={coverPosition}
              onPositionChange={setCoverPosition}
              onChange={setCoverPhotoUrl} 
            />

            <div className="pt-4 border-t border-theme-border">
              <TeamSelector 
                label="Responsável pela Captação"
                network={network}
                onSelect={(uid, pub) => {
                  setDelegatedUserId(uid);
                  setIsPublicCall(pub);
                }}
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-theme-bg-muted border border-theme-border">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-theme-text uppercase tracking-widest ">Visibilidade no Marketplace</p>
                <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">
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
              className="w-full py-5 bg-cyan-400 text-black text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-cyan-400/20 disabled:opacity-40"
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
    </div>,
    document.body
  );
}

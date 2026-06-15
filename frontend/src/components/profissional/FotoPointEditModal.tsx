import { useState } from "react";
import { X, Camera, DollarSign, MapPin, ListChecks, Check, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { API } from "../../lib/api";
import type { EventItem, Partner } from "./types";
import { CoverPhotoInput } from "./CoverPhotoInput";
import { TeamSelector } from "./TeamSelector";

interface FotoPointEditModalProps {
  event: EventItem;
  onClose: () => void;
  onSuccess: (updated: EventItem) => void;
  onError: (msg: string) => void;
  network: Partner[];
}

export function FotoPointEditModal({ event, onClose, onSuccess, onError, network }: FotoPointEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: event.title,
    priceUnit: event.priceUnit || 20,
    location: event.location || "",
    city: event.cartorio || "", 
    itinerary: event.itinerary || "",
    references: Array.isArray(event.references) ? event.references : [],
    isPrivate: event.isPrivate,
    active: event.active,
    dataEvento: event.dataEvento ? new Date(event.dataEvento).toISOString().split('T')[0] : "",
    captacaoId: event.captacaoId,
    isPublicCall: event.isPublicCall
  });
  const [coverUrl, setCoverUrl] = useState<string | null>(event.coverPhotoUrl ?? null);
  const [coverPosition, setCoverPosition] = useState<string>(event.coverPosition ?? "center");

  const [newRef, setNewRef] = useState("");

  const addRef = () => {
    if (newRef.trim()) {
      setFormData(prev => ({ ...prev, references: [...prev.references, newRef.trim()] }));
      setNewRef("");
    }
  };

  const removeRef = (index: number) => {
    setFormData(prev => ({
      ...prev,
      references: prev.references.filter((_: string, i: number) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/foto-point`, {
        ...formData,
        coverPhotoUrl: coverUrl,
        coverPosition: coverPosition,
      });
      onSuccess(data);
      onClose();
    } catch (err: unknown) {
      const errMsg = (err && typeof err === "object" && "response" in err) ? (err as { response?: { data?: { error?: string } } }).response?.data?.error : undefined;
      onError(errMsg || "Erro ao atualizar Foto Point.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/60 animate-in fade-in duration-500"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-2xl bg-theme-bg border border-white/10 shadow-[0_0_100px_rgba(34,211,238,0.15)] relative overflow-hidden max-h-[95vh] flex flex-col">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-10" />
        
        <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-10 overflow-y-auto custom-scrollbar">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-brand-info uppercase tracking-[0.4em] mb-2">
                Painel de Gestão • Foto Point
              </div>
              <h3 className="text-3xl font-heading font-bold text-theme-text uppercase leading-none">
                Editar {event.title}
              </h3>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-theme-bg-muted text-theme-muted hover:text-brand-info transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Nome do Ponto / Evento</label>
              <div className="relative group">
                <Camera size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-info/50 group-focus-within:text-brand-info transition-colors" />
                <input
                  required
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-theme-bg-muted border border-white/10 p-5 pl-14 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs font-bold"
                  placeholder="Ex: Foto Point Morumbi"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Valor por Click (Digital)</label>
              <div className="relative group">
                <DollarSign size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-info/50 group-focus-within:text-brand-info transition-colors" />
                <input
                  type="number"
                  required
                  value={formData.priceUnit}
                  onChange={e => setFormData({ ...formData, priceUnit: Number(e.target.value) })}
                  className="w-full bg-theme-bg-muted border border-white/10 p-5 pl-14 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs font-bold"
                  placeholder="R$ 20,00"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Ponto de Encontro / Local</label>
              <div className="relative group">
                <MapPin size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-info/50 group-focus-within:text-brand-info transition-colors" />
                <input
                  required
                  value={formData.location}
                  onChange={e => setFormData({ ...formData, location: e.target.value })}
                  className="w-full bg-theme-bg-muted border border-white/10 p-5 pl-14 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs font-bold"
                  placeholder="Ex: Em frente ao Portal Principal"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60 flex items-center gap-2">
                <Calendar size={12} /> Data da Operação
              </label>
              <input
                type="date"
                required
                value={formData.dataEvento}
                onChange={e => setFormData({ ...formData, dataEvento: e.target.value })}
                className="w-full bg-theme-bg-muted border border-white/10 p-5 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs font-bold"
              />
            </div>

             <div className="space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Visibilidade na Home</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isPrivate: !formData.isPrivate })}
                  className={`flex-1 p-5 border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${!formData.isPrivate ? "bg-brand-info text-theme-text border-brand-info" : "bg-theme-bg-muted border-white/10 text-theme-muted hover:text-theme-text"}`}
                >
                  {formData.isPrivate ? <EyeOff size={16} /> : <Eye size={16} />}
                  {formData.isPrivate ? "Privado" : "Público"}
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, active: !formData.active })}
                  className={`flex-1 p-5 border text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${formData.active ? "bg-brand-tactical text-brand-text border-brand-tactical" : "bg-brand-danger/20 border-brand-danger/30 text-brand-danger"}`}
                >
                  <Check size={16} />
                  {formData.active ? "Ativo" : "Inativo"}
                </button>
              </div>
            </div>

            <div className="md:col-span-2 space-y-3">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Roteiro da Sessão (O que será entregue?)</label>
              <div className="relative group">
                <ListChecks size={16} className="absolute left-5 top-6 text-brand-info/50 group-focus-within:text-brand-info transition-colors" />
                <textarea
                  required
                  value={formData.itinerary}
                  onChange={e => setFormData({ ...formData, itinerary: e.target.value })}
                  className="w-full bg-theme-bg-muted border border-white/10 p-5 pl-14 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs font-bold min-h-[100px]"
                  placeholder="Ex: 5 fotos posadas, entrega digital em 24h..."
                />
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              <label className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Referências de Estilo / Pose</label>
              <div className="flex gap-2">
                <input
                  value={newRef}
                  onChange={e => setNewRef(e.target.value)}
                  className="flex-1 bg-theme-bg-muted border border-white/10 p-4 text-theme-text outline-none focus:border-brand-info/50 transition-all text-xs"
                  placeholder="Ex: Estilo P&B, Pose Dramática..."
                />
                <button
                  type="button"
                  onClick={addRef}
                  className="px-6 bg-white/10 text-gray-800 text-[10px] font-bold uppercase tracking-widest hover:bg-brand-info hover:text-gray-800 transition-all"
                >
                  Adicionar
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.references.map((ref: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-brand-info/10 border border-brand-info/20 px-3 py-2 text-[10px] font-bold text-brand-info uppercase">
                    {ref}
                    <button type="button" onClick={() => removeRef(i)} className="hover:text-brand-danger transition-colors"><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <CoverPhotoInput
                currentUrl={coverUrl}
                currentPosition={coverPosition}
                eventId={event.id}
                onPositionChange={setCoverPosition}
                onChange={setCoverUrl}
              />
            </div>

            <div className="md:col-span-2 pt-4 border-t border-white/5">
               <TeamSelector 
                 label="Equipe / Responsável"
                 network={network}
                 onSelect={(uid, pub) => {
                   setFormData(prev => ({ ...prev, captacaoId: uid, isPublicCall: pub }));
                 }}
               />
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-5 bg-theme-bg-muted border border-white/10 text-theme-muted text-[11px] font-bold uppercase tracking-widest hover:text-theme-text transition-all"
            >
              Descartar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-5 bg-brand-info text-white text-[11px] font-bold uppercase tracking-[0.3em] hover:brightness-110 disabled:opacity-40 transition-all shadow-xl shadow-cyan-400/20"
            >
              {loading ? "SALVANDO..." : "SALVAR ALTERAÇÕES"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

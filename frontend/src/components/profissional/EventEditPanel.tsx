import { useState } from "react";
import { Check, X, Award, Share2 } from "lucide-react";
import { API } from "../../lib/api";
import type { EventItem } from "./types";
import { CoverPhotoInput } from "./CoverPhotoInput";

interface EventEditPanelProps {
  event: EventItem;
  onUpdated: (u: Partial<EventItem>) => void;
  onClose: () => void;
  onNotify?: (msg: string, type: "success" | "error") => void;
}

export function EventEditPanel({ event, onUpdated, onClose, onNotify }: EventEditPanelProps) {
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [date, setDate] = useState(event.dataEvento ? new Date(event.dataEvento).toISOString().split('T')[0] : "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const luxuryUrl = `${window.location.origin}/delivery/${event.id}`;

  const copyLuxuryLink = () => {
    navigator.clipboard.writeText(luxuryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, {
        lightroomUrl: lrUrl || null,
        driveUrl: drUrl || null,
        dataEvento: date,
      });
      onUpdated(data);
      onNotify?.("Evento atualizado com sucesso!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      onNotify?.("Erro ao salvar alterações.", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-theme-bg border border-theme-border shadow-[0_0_100px_rgba(0,0,0,0.1)] relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical/50 to-transparent" />

        <div className="p-8 md:p-12 space-y-10 relative z-10">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic mb-2">
                Painel de Entrega Técnica
              </div>
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic leading-none">
                {event.nomeNoivos}
              </h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-theme-bg-muted text-theme-muted hover:text-brand-tactical transition-all">
              <X size={24} />
            </button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">
                  Matriz Lightroom (Adobe)
                </label>
                <div className="text-[8px] font-bold text-brand-tactical uppercase tracking-tighter">
                  Sincronização Ativa
                </div>
              </div>
              <input
                placeholder="https://adobe.ly/..."
                value={lrUrl}
                onChange={(e) => setLrUrl(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-medium"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">
                Data do Evento
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-medium"
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">
                Repositório Final (Drive/Dropbox)
              </label>
              <input
                placeholder="https://drive.google.com/..."
                value={drUrl}
                onChange={(e) => setDrUrl(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-medium"
              />
            </div>

            <CoverPhotoInput
              currentUrl={event.coverPhotoUrl}
              eventId={event.id}
              onChange={() => {/* saved directly via /cover endpoint */}}
            />

            <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Award size={16} className="text-brand-tactical" />
                  <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">
                    Luxury Experience Link
                  </span>
                </div>
                {copied && (
                  <span className="text-[9px] font-black text-brand-tactical uppercase italic animate-pulse">
                    Copiado!
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={luxuryUrl}
                  className="flex-grow bg-theme-bg/50 border border-brand-tactical/30 p-4 text-[9px] font-medium text-theme-muted outline-none"
                />
                <button
                  onClick={copyLuxuryLink}
                  className="px-6 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />} COPIAR
                </button>
              </div>
              <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest leading-relaxed italic">
                Este é o link que o seu cliente deve receber para acessar a galeria de luxo.
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-5 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest hover:text-theme-text transition-all italic"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-[2] py-5 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 disabled:opacity-40 transition-all shadow-xl shadow-brand-tactical/20 italic"
            >
              {saving ? "PROCESSANDO..." : "EFETIVAR LINKS"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}


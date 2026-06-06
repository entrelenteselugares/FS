import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, X, Award, Share2, Settings, ArrowRight, Users, Link2, Search, UserMinus } from "lucide-react";
import { T } from "../../lib/theme";
import { API } from "../../lib/api";
import type { EventItem, Partner } from "./types";
import { CoverPhotoInput } from "./CoverPhotoInput";

interface EventEditPanelProps {
  event: EventItem;
  onUpdated: (u: Partial<EventItem>) => void;
  onClose: () => void;
  onNotify?: (msg: string, type: "success" | "error") => void;
}

export function EventEditPanel({ event, onUpdated, onClose, onNotify }: EventEditPanelProps) {
  const [activeTab, setActiveTab] = useState<"LINKS" | "TEAM">("LINKS");

  // Links & Setup State
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [date, setDate] = useState(event.dataEvento ? new Date(event.dataEvento).toISOString().split('T')[0] : "");
  const [coverPos, setCoverPos] = useState(event.coverPosition ?? "center");
  
  // Team State
  const [edicaoId, setEdicaoId] = useState<string | null>(event.edicaoId ?? null);
  const [editorName, setEditorName] = useState<string>("Carregando...");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const luxuryUrl = `${window.location.origin}/delivery/${event.id}`;

  const copyLuxuryLink = () => {
    navigator.clipboard.writeText(luxuryUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    // Fetch editor details if assigned
    if (edicaoId) {
      API.get(`/profissional/network/search?query=`)
        .then(({ data }) => {
          const editor = data.find((p: Partner) => p.id === edicaoId);
          if (editor) setEditorName(editor.nome);
          else setEditorName("Editor Atribuído");
        })
        .catch(() => setEditorName("Editor Atribuído"));
    }
  }, [edicaoId]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setSearchResults([]);
      return;
    }
    const delayDebounceFn = setTimeout(() => {
      setIsSearching(true);
      API.get(`/profissional/network/search?query=${searchQuery}`)
        .then(({ data }) => setSearchResults(data))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, {
        lightroomUrl: lrUrl || null,
        driveUrl: drUrl || null,
        dataEvento: date,
        coverPosition: coverPos,
        edicaoId: edicaoId || null,
      });
      onUpdated(data);
      onNotify?.("Painel atualizado com sucesso!", "success");
      onClose();
    } catch (err) {
      console.error(err);
      onNotify?.("Erro ao salvar alterações.", "error");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'auto'; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      <div 
        className="fixed inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300 dark:bg-black/95" 
        onClick={onClose} 
      />
      
      <div className="relative w-full h-full sm:h-[90vh] max-w-2xl flex flex-col border-none sm:border border-theme-border rounded-none sm:rounded-[40px] overflow-hidden shadow-2xl z-[10000] bg-theme-card">
        
        {/* Header */}
        <div className="p-8 md:p-10 border-b flex items-center justify-between shrink-0" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
              <Settings className="text-brand-tactical" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Painel de Entrega Técnica</p>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter" style={{ color: T.text }}>{event.title}</h2>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all active:scale-90" style={{ color: T.text2 }}>
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-theme-border px-8 md:px-10 shrink-0">
          <button
            onClick={() => setActiveTab("LINKS")}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "LINKS" ? "border-brand-tactical text-brand-tactical" : "border-transparent text-theme-muted hover:text-theme-text"
            }`}
          >
            <Link2 size={16} /> SETUP & LINKS
          </button>
          <button
            onClick={() => setActiveTab("TEAM")}
            className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border-b-2 transition-all ${
              activeTab === "TEAM" ? "border-brand-tactical text-brand-tactical" : "border-transparent text-theme-muted hover:text-theme-text"
            }`}
          >
            <Users size={16} /> EQUIPE DO EVENTO
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          
          {activeTab === "LINKS" && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
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
                    className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-black uppercase rounded-2xl"
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
                    className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-black uppercase rounded-2xl"
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
                    className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-black uppercase rounded-2xl"
                  />
                </div>

                <CoverPhotoInput
                  currentUrl={event.coverPhotoUrl}
                  currentPosition={coverPos}
                  eventId={event.id}
                  onPositionChange={(pos) => setCoverPos(pos)}
                  onChange={() => {/* saved directly via /cover endpoint */}}
                />

                <div className="p-8 bg-brand-tactical/10 border border-brand-tactical/20 rounded-[30px] space-y-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-brand-tactical/20 flex items-center justify-center text-brand-tactical">
                        <Award size={16} />
                      </div>
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
                      className="flex-grow bg-black/20 border border-brand-tactical/30 p-4 text-[9px] font-black text-theme-muted outline-none rounded-xl"
                    />
                    <button
                      onClick={copyLuxuryLink}
                      className="px-6 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 rounded-xl"
                    >
                      {copied ? <Check size={14} /> : <Share2 size={14} />} COPIAR
                    </button>
                  </div>
                  <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest leading-relaxed italic opacity-60">
                    Este é o link que o seu cliente deve receber para acessar a galeria de luxo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "TEAM" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              
              <div className="p-6 bg-theme-bg-muted border border-theme-border rounded-2xl space-y-2">
                <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic">Criador / Captador</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-tactical/20 flex items-center justify-center">
                    <Users size={16} className="text-brand-tactical" />
                  </div>
                  <div>
                    <p className="text-xs font-black uppercase text-theme-text">Você (Dono do Evento)</p>
                    <p className="text-[10px] font-medium text-theme-muted">{event.captacaoStatus === "ACCEPTED" ? "Aceito" : "Pendente"}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-widest text-theme-text border-b border-theme-border pb-4">
                  Editor do Evento
                </h3>
                
                {edicaoId ? (
                  <div className="p-6 border border-brand-tactical/30 bg-brand-tactical/5 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-brand-tactical flex items-center justify-center text-black">
                        <Check size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase text-theme-text">{editorName}</p>
                        <p className="text-[10px] font-medium text-theme-muted">Editor Atribuído</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => setEdicaoId(null)}
                      className="p-2 text-theme-muted hover:text-red-500 transition-colors bg-theme-bg-muted rounded-full"
                    >
                      <UserMinus size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-[10px] text-theme-muted uppercase tracking-widest leading-relaxed">
                      Atribua um editor para este evento pesquisando pelo nome ou e-mail na rede de profissionais.
                    </p>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-theme-muted">
                        <Search size={16} />
                      </div>
                      <input
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border py-4 pl-12 pr-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-black rounded-2xl"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>
                    
                    {searchResults.length > 0 && (
                      <div className="bg-theme-bg-muted border border-theme-border rounded-xl overflow-hidden divide-y divide-theme-border/50 max-h-60 overflow-y-auto">
                        {searchResults.map((pro) => (
                          <div key={pro.id} className="flex items-center justify-between p-4 hover:bg-black/20 transition-colors">
                            <div>
                              <p className="text-xs font-black uppercase text-theme-text">{pro.nome}</p>
                              <p className="text-[10px] text-theme-muted">{pro.email}</p>
                            </div>
                            <button
                              onClick={() => {
                                setEdicaoId(pro.id);
                                setEditorName(pro.nome);
                                setSearchQuery("");
                                setSearchResults([]);
                              }}
                              className="px-4 py-2 bg-brand-tactical/20 text-brand-tactical rounded-lg text-[9px] font-black uppercase hover:bg-brand-tactical hover:text-black transition-colors"
                            >
                              Atribuir
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-8 md:p-10 bg-theme-bg-muted border-t flex items-center justify-between gap-6 shrink-0" style={{ borderColor: T.border }}>
          <button
            onClick={onClose}
            className="px-8 py-5 text-theme-muted text-[11px] font-black uppercase tracking-widest hover:text-theme-text transition-all italic"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 max-w-xs py-5 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all italic flex items-center justify-center gap-4 shadow-2xl shadow-brand-tactical/20 rounded-xl"
          >
            {saving ? "PROCESSANDO..." : "SALVAR PAINEL"}
            {!saving && <ArrowRight size={18} />}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

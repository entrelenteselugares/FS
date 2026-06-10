import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  Check, X, Share2, Settings, ArrowRight,
  Users, Search, UserMinus, CalendarDays,
  FolderOpen, Layers, Link, Copy
} from "lucide-react";
import { T } from "../../lib/theme";
import { API } from "../../lib/api";
import type { EventItem, Partner } from "./types";
import { CoverPhotoInput } from "./CoverPhotoInput";
import { useAuth } from "../../hooks/useAuth";

interface EventEditPanelProps {
  event: EventItem;
  onUpdated: (u: Partial<EventItem>) => void;
  onClose: () => void;
  onNotify?: (msg: string, type: "success" | "error") => void;
}

// Helper: extracts a short, readable domain label from a URL
function urlLabel(url: string) {
  try {
    const h = new URL(url).hostname.replace("www.", "");
    if (h.includes("adobe")) return "Adobe Lightroom";
    if (h.includes("drive.google")) return "Google Drive";
    if (h.includes("dropbox")) return "Dropbox";
    if (h.includes("wetransfer")) return "WeTransfer";
    return h;
  } catch { return url; }
}

interface ServiceOption {
  id: string;
  name: string;
  price: number | string;
}

interface VotingSuggestion {
  owner?: number;
  pro?: number;
  system?: number;
}

interface VotingProjection {
  pct: number;
  buyers: number;
  revenueOwner: number;
  revenuePro: number;
  revenueSystem: number;
}

interface VotingStatus {
  winner?: string;
  pricePerPhoto?: number;
  guests?: number;
  suggestions?: VotingSuggestion;
  votes: Record<string, string>;
  projections?: VotingProjection[];
  eventStatus?: {
    clientEmail?: string | null;
    captacao?: { id: string; nome: string } | null;
    edicao?: { id: string; nome: string } | null;
  };
}

export function EventEditPanel({ event, onUpdated, onClose, onNotify }: EventEditPanelProps) {
  const { user } = useAuth();
  const isClient = user?.role === "CLIENTE";
  const [activeTab, setActiveTab] = useState<"SETUP" | "DESIGNER" | "TEAM">("SETUP");

  // Setup state
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [date, setDate] = useState(event.dataEvento ? new Date(event.dataEvento).toISOString().split("T")[0] : "");
  const [coverPos, setCoverPos] = useState(event.coverPosition ?? "center");

  // Inline editing toggles
  const [editingLr, setEditingLr] = useState(!event.lightroomUrl);
  const [editingDr, setEditingDr] = useState(!event.driveUrl);

  const [sellPhotos, setSellPhotos] = useState(!event.allowFreeDownload);
  const pricePerPhoto = event.pricePerPhoto ?? 15;

  // Voting states
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [mySuggestion, setMySuggestion] = useState<number | "">("");


  // Designer state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const designerConfig = (event as any).verticalConfigs?.printDesigner || {};
  const [showLogo, setShowLogo] = useState<boolean>(designerConfig.showLogo ?? true);
  const [showTimestamp, setShowTimestamp] = useState<boolean>(designerConfig.showTimestamp ?? true);
  const [clientLogoUrl, setClientLogoUrl] = useState<string>(designerConfig.clientLogoUrl ?? "");

  // Team state
  const [edicaoId, setEdicaoId] = useState<string | null>(event.edicaoId ?? null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editorName, setEditorName] = useState<string>((event as any).edicao?.nome || "Editor");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Hiring State
  const [editorServices, setEditorServices] = useState<ServiceOption[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [paymentModalService, setPaymentModalService] = useState<ServiceOption | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"CREDITS" | "MP">("CREDITS");
  const [hiring, setHiring] = useState(false);

  const [saving, setSaving] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Event team members state
  const [teamMembers, setTeamMembers] = useState<any[]>(event.teamMembers || []);
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<Partner[]>([]);
  const [isSearchingMember, setIsSearchingMember] = useState(false);
  const [selectedRole, setSelectedRole] = useState("FOTOGRAFO_AUXILIAR");
  const [addingMember, setAddingMember] = useState(false);

  // Live search for event team members
  useEffect(() => {
    if (memberSearchQuery.length < 3) { setMemberSearchResults([]); return; }
    const t = setTimeout(() => {
      setIsSearchingMember(true);
      API.get(`/profissional/network/search?query=${memberSearchQuery}`)
        .then(({ data }) => setMemberSearchResults(data))
        .catch(console.error)
        .finally(() => setIsSearchingMember(false));
    }, 400);
    return () => clearTimeout(t);
  }, [memberSearchQuery]);

  const handleAddTeamMember = async (userId: string) => {
    setAddingMember(true);
    try {
      const { data } = await API.post(`/profissional/events/${event.id}/team`, {
        userId,
        role: selectedRole
      });
      const newMembers = [...teamMembers, data];
      setTeamMembers(newMembers);
      onUpdated({ teamMembers: newMembers });
      onNotify?.("Membro adicionado com sucesso!", "success");
      setMemberSearchQuery("");
      setMemberSearchResults([]);
    } catch {
      onNotify?.("Erro ao adicionar membro à equipe.", "error");
    } finally {
      setAddingMember(false);
    }
  };

  const handleRemoveTeamMember = async (memberId: string) => {
    try {
      await API.delete(`/profissional/events/${event.id}/team/${memberId}`);
      const newMembers = teamMembers.filter(m => m.id !== memberId);
      setTeamMembers(newMembers);
      onUpdated({ teamMembers: newMembers });
      onNotify?.("Membro removido da equipe.", "success");
    } catch {
      onNotify?.("Erro ao remover membro da equipe.", "error");
    }
  };

  const luxuryUrl = `${window.location.origin}/delivery/${event.id}`;

  const copyText = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Load services when edicaoId changes
  useEffect(() => {
    if (!edicaoId) {
      setEditorServices([]);
      return;
    }
      
    // Load services
    setLoadingServices(true);
    API.get(`/profissional/network/${edicaoId}/services`)
      .then(({ data }) => setEditorServices(data))
      .catch(console.error)
      .finally(() => setLoadingServices(false));
  }, [edicaoId]);

  // Live search for professionals
  useEffect(() => {
    if (searchQuery.length < 3) { setSearchResults([]); return; }
    const t = setTimeout(() => {
      setIsSearching(true);
      API.get(`/profissional/network/search?query=${searchQuery}`)
        .then(({ data }) => setSearchResults(data))
        .catch(console.error)
        .finally(() => setIsSearching(false));
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Load voting status on mount
  useEffect(() => {
    if (event.id) {
      API.get(`/events/${event.id}/voting-status`)
        .then(({ data }) => {
          setVotingStatus(data);
          if (isClient && data.suggestions?.owner) {
            setMySuggestion(data.suggestions.owner);
          } else if (!isClient && data.suggestions?.pro) {
            setMySuggestion(data.suggestions.pro);
          }
        })
        .catch(console.error);
    }
  }, [event.id, isClient]);

  const handleSuggest = async () => {
    if (!mySuggestion || isNaN(Number(mySuggestion))) return;
    try {
      await API.post(`/events/${event.id}/suggest-price`, { price: Number(mySuggestion) });
      onNotify?.("Sugestão enviada com sucesso!", "success");
      const { data } = await API.get(`/events/${event.id}/voting-status`);
      setVotingStatus(data);
    } catch {
      onNotify?.("Erro ao enviar sugestão.", "error");
    }
  };

  const handleVote = async (option: "OWNER" | "PRO" | "SYSTEM") => {
    try {
      await API.post(`/events/${event.id}/vote-price`, { vote: option });
      onNotify?.("Voto computado com sucesso!", "success");
      const { data } = await API.get(`/events/${event.id}/voting-status`);
      setVotingStatus(data);
      if (data.pricePerPhoto) {
        onUpdated({ pricePerPhoto: data.pricePerPhoto });
      }
    } catch {
      onNotify?.("Erro ao votar.", "error");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, {
        lightroomUrl: lrUrl || null,
        driveUrl: drUrl || null,
        dataEvento: date,
        coverPosition: coverPos,
        edicaoId: edicaoId || null,
        allowFreeDownload: !sellPhotos,
        pricePerPhoto,
        printDesigner: {
          showLogo,
          showTimestamp,
          clientLogoUrl
        }
      });
      onUpdated(data);
      onNotify?.("Painel atualizado!", "success");
      onClose();
    } catch {
      onNotify?.("Erro ao salvar.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleHireService = async () => {
    if (!paymentModalService || !edicaoId) return;
    setHiring(true);
    try {
      const { data } = await API.post("/editor-contracts", {
        eventId: event.id,
        editorId: edicaoId,
        serviceId: paymentModalService.id,
        paymentMethod
      });
      if (data.preferenceUrl) {
        window.location.href = data.preferenceUrl;
      } else {
        onNotify?.("Serviço contratado com sucesso usando créditos!", "success");
        setPaymentModalService(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      onNotify?.(error.response?.data?.error || "Erro ao contratar serviço.", "error");
    } finally {
      setHiring(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "auto"; };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xl" onClick={onClose} />

      <div className="relative w-full h-full sm:h-[90vh] max-w-xl flex flex-col border-none sm:border border-theme-border sm:rounded-[32px] overflow-hidden shadow-2xl z-[10000] bg-theme-card">

        {/* ─── Header ─── */}
        <div className="px-7 pt-7 pb-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-tactical/10 rounded-xl flex items-center justify-center">
              <Settings className="text-brand-tactical" size={18} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.25em] opacity-35">Painel de Entrega</p>
              <h2 className="text-lg font-black uppercase italic tracking-tight leading-none mt-0.5" style={{ color: T.text }}>
                {event.title.length > 28 ? event.title.slice(0, 28) + "…" : event.title}
              </h2>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-theme-bg-muted rounded-full transition-all" style={{ color: T.text2 }}>
            <X size={20} />
          </button>
        </div>

        {/* ─── Tabs ─── */}
        <div className="flex gap-1 px-7 shrink-0">
          {(["SETUP", "DESIGNER", "TEAM"] as const)
            .filter(tab => !isClient || tab !== "TEAM")
            .map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                  activeTab === tab
                    ? "bg-brand-tactical text-black"
                    : "text-theme-muted hover:text-theme-text bg-theme-bg-muted"
                }`}
              >
                {tab === "SETUP" ? "📋 Setup" : tab === "DESIGNER" ? "🎨 Designer" : "👥 Equipe"}
              </button>
            ))}
        </div>

        {/* ─── Content ─── */}
        <div className="flex-1 overflow-y-auto px-7 py-6 space-y-4 custom-scrollbar">

          {/* ══════════ SETUP TAB ══════════ */}
          {activeTab === "SETUP" && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">

              {!isClient && (
                <>
                  {/* ── Data do Evento ── */}
                  <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-brand-tactical/10 flex items-center justify-center shrink-0">
                      <CalendarDays size={18} className="text-brand-tactical" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1">Data do Evento</p>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-sm font-black text-theme-text"
                      />
                    </div>
                    {date && <span className="text-[9px] font-black text-brand-tactical uppercase">✓</span>}
                  </div>

                  {/* ── Lightroom / Portfolio ── */}
                  <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Layers size={18} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Lightroom / Portfolio</p>
                          {lrUrl && !editingLr ? (
                            <p className="text-xs font-bold text-theme-text truncate max-w-[180px]">{urlLabel(lrUrl)}</p>
                          ) : (
                            <p className="text-[10px] text-theme-muted italic">Compartilhe o link de sincronização</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {lrUrl && !editingLr && (
                          <button onClick={() => copyText(lrUrl, "lr")} className="p-2 rounded-lg hover:bg-black/20 transition-colors text-theme-muted">
                            {copiedField === "lr" ? <Check size={14} className="text-brand-tactical" /> : <Copy size={14} />}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingLr(!editingLr)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${editingLr ? "bg-brand-tactical text-black" : "bg-theme-bg text-theme-muted hover:text-theme-text border border-theme-border"}`}
                        >
                          {editingLr ? "OK" : "Editar"}
                        </button>
                      </div>
                    </div>
                    {editingLr && (
                      <input
                        placeholder="https://adobe.ly/... ou qualquer link de portfolio"
                        value={lrUrl}
                        onChange={(e) => setLrUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingLr(false); }}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs font-mono text-theme-text outline-none focus:border-brand-tactical/60 transition-all"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* ── Repositório Final ── */}
                  <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                          <FolderOpen size={18} className="text-green-400" />
                        </div>
                        <div>
                          <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Repositório Final</p>
                          {drUrl && !editingDr ? (
                            <p className="text-xs font-bold text-theme-text truncate max-w-[180px]">{urlLabel(drUrl)}</p>
                          ) : (
                            <p className="text-[10px] text-theme-muted italic">Drive, Dropbox, WeTransfer...</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1.5">
                        {drUrl && !editingDr && (
                          <button onClick={() => copyText(drUrl, "dr")} className="p-2 rounded-lg hover:bg-black/20 transition-colors text-theme-muted">
                            {copiedField === "dr" ? <Check size={14} className="text-brand-tactical" /> : <Copy size={14} />}
                          </button>
                        )}
                        <button
                          onClick={() => setEditingDr(!editingDr)}
                          className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${editingDr ? "bg-brand-tactical text-black" : "bg-theme-bg text-theme-muted hover:text-theme-text border border-theme-border"}`}
                        >
                          {editingDr ? "OK" : "Editar"}
                        </button>
                      </div>
                    </div>
                    {editingDr && (
                      <input
                        placeholder="https://drive.google.com/... ou outro serviço"
                        value={drUrl}
                        onChange={(e) => setDrUrl(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") setEditingDr(false); }}
                        className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs font-mono text-theme-text outline-none focus:border-brand-tactical/60 transition-all"
                        autoFocus
                      />
                    )}
                  </div>

                  {/* ── Foto de Capa ── */}
                  <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border space-y-3">
                    <div className="flex items-center gap-3 mb-1">
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                        <Layers size={18} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Foto de Capa</p>
                        <p className="text-[10px] text-theme-muted italic">Imagem exibida no topo da galeria</p>
                      </div>
                    </div>
                    <CoverPhotoInput
                      currentUrl={event.coverPhotoUrl}
                      currentPosition={coverPos}
                      eventId={event.id}
                      onPositionChange={(pos) => setCoverPos(pos)}
                      onChange={() => {}}
                    />
                  </div>
                </>
              )}

              {/* ── Venda de Fotos ── */}
              <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${sellPhotos ? "bg-green-500/10" : "bg-red-500/10"}`}>
                    <Check size={18} className={sellPhotos ? "text-green-400" : "text-red-400 opacity-50"} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Venda de Fotos</p>
                    <p className="text-[10px] text-theme-muted italic">
                      {sellPhotos ? "Fotos terão marca d'água e preço." : "Fotos gratuitas sem marca d'água."}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSellPhotos(!sellPhotos)}
                  className={`w-12 h-6 rounded-full relative transition-colors ${sellPhotos ? "bg-green-500/50" : "bg-theme-border"}`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${sellPhotos ? "left-7" : "left-1"}`} />
                </button>
              </div>

              {sellPhotos && (
                <div className="p-4 bg-theme-bg-muted/50 rounded-2xl border border-theme-border/50 space-y-4 animate-in fade-in slide-in-from-top-2">
                  
                  {/* Central de Votação do Preço */}
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-brand-tactical mb-2">💰 Votação do Preço da Foto</h4>
                      <p className="text-[10px] text-theme-muted leading-relaxed">
                        Definam juntos o preço ideal por foto. Em caso de empate, o valor adotado será a média recomendada.
                      </p>
                    </div>

                    {/* Sugestão de Preço do Usuário */}
                    <div className="flex gap-2">
                      <div className="flex-1 flex flex-col gap-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest opacity-50 font-bold">Sua Sugestão de Preço (R$)</label>
                        <input
                          type="number"
                          value={mySuggestion}
                          onChange={(e) => setMySuggestion(e.target.value === "" ? "" : Number(e.target.value))}
                          placeholder="Ex: 15"
                          className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-sm font-bold text-theme-text outline-none focus:border-brand-tactical/60 transition-all"
                          min={1}
                        />
                      </div>
                      <button
                        onClick={handleSuggest}
                        className="px-5 self-end py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 active:scale-[0.98] transition-all h-[44px]"
                      >
                        Sugerir
                      </button>
                    </div>

                    {/* Comparação de Sugestões */}
                    {votingStatus && (
                      <div className="p-4 bg-theme-bg rounded-xl border border-theme-border space-y-2">
                        <p className="text-[9px] font-black uppercase tracking-wider text-theme-muted">Sugestões Atuais</p>
                        <div className="grid grid-cols-3 gap-2 text-[10px] text-center">
                          <div className="bg-theme-bg-muted p-2 rounded-lg">
                            <span className="block text-[8px] uppercase tracking-wider text-theme-muted">Contratante</span>
                            <span className="font-bold text-theme-text">
                              {votingStatus.suggestions?.owner ? `R$ ${votingStatus.suggestions.owner}` : "Pendente"}
                            </span>
                          </div>
                          <div className="bg-theme-bg-muted p-2 rounded-lg">
                            <span className="block text-[8px] uppercase tracking-wider text-theme-muted">Equipe</span>
                            <span className="font-bold text-theme-text">
                              {votingStatus.suggestions?.pro ? `R$ ${votingStatus.suggestions.pro}` : "Pendente"}
                            </span>
                          </div>
                          <div className="bg-theme-bg-muted p-2 rounded-lg border border-brand-tactical/30">
                            <span className="block text-[8px] uppercase tracking-wider text-brand-tactical">Recomendado</span>
                            <span className="font-bold text-brand-tactical">
                              {votingStatus.suggestions?.system ? `R$ ${votingStatus.suggestions.system}` : "Pendente"}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Projeção de Faturamento */}
                    {votingStatus && votingStatus.projections && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest opacity-50 block font-bold">📈 Projeção de Faturamento ({votingStatus.guests} Convidados)</label>
                        <div className="overflow-hidden border border-theme-border rounded-xl">
                          <table className="w-full text-left border-collapse text-[9px]">
                            <thead>
                              <tr className="bg-theme-bg-muted border-b border-theme-border text-theme-muted uppercase tracking-wider">
                                <th className="p-2.5 font-black">Conversão</th>
                                <th className="p-2.5 font-black">Compradores</th>
                                <th className="p-2.5 font-black">Contratante</th>
                                <th className="p-2.5 font-black">Equipe</th>
                                <th className="p-2.5 font-black">Recomendado</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-theme-border/50 font-bold">
                              {votingStatus.projections.map((row) => (
                                <tr key={row.pct} className="hover:bg-white/[0.01]">
                                  <td className="p-2.5">{row.pct}%</td>
                                  <td className="p-2.5">{row.buyers} pessoas</td>
                                  <td className="p-2.5 text-theme-text-muted">R$ {row.revenueOwner}</td>
                                  <td className="p-2.5 text-theme-text-muted">R$ {row.revenuePro}</td>
                                  <td className="p-2.5 text-brand-tactical">R$ {row.revenueSystem}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Área de Voto */}
                    {votingStatus && (
                      <div className="space-y-2">
                        <label className="text-[9px] font-black uppercase tracking-widest opacity-50 block font-bold">🗳 Escolha a melhor opção</label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => handleVote("OWNER")}
                            disabled={!votingStatus.suggestions?.owner}
                            className={`py-2 px-3 text-[9px] font-black uppercase rounded-lg border transition-all ${
                              votingStatus.votes[user?.id || ""] === "OWNER"
                                ? "bg-brand-tactical border-brand-tactical text-black animate-pulse"
                                : "bg-theme-bg border-theme-border text-theme-text hover:border-theme-muted disabled:opacity-30"
                            }`}
                          >
                            Contratante
                          </button>
                          <button
                            onClick={() => handleVote("PRO")}
                            disabled={!votingStatus.suggestions?.pro}
                            className={`py-2 px-3 text-[9px] font-black uppercase rounded-lg border transition-all ${
                              votingStatus.votes[user?.id || ""] === "PRO"
                                ? "bg-brand-tactical border-brand-tactical text-black animate-pulse"
                                : "bg-theme-bg border-theme-border text-theme-text hover:border-theme-muted disabled:opacity-30"
                            }`}
                          >
                            Equipe
                          </button>
                          <button
                            onClick={() => handleVote("SYSTEM")}
                            disabled={!votingStatus.suggestions?.system}
                            className={`py-2 px-3 text-[9px] font-black uppercase rounded-lg border transition-all ${
                              votingStatus.votes[user?.id || ""] === "SYSTEM"
                                ? "bg-brand-tactical border-brand-tactical text-black animate-pulse"
                                : "bg-theme-bg border-theme-border text-theme-text hover:border-theme-muted disabled:opacity-30"
                            }`}
                          >
                            Recomendado
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Votos Computados e Vencedor */}
                    {votingStatus && Object.keys(votingStatus.votes).length > 0 && (
                      <div className="p-3 bg-theme-bg-muted rounded-xl text-[9px] space-y-1">
                        <div className="font-bold text-theme-muted">Votos confirmados:</div>
                        {Object.entries(votingStatus.votes).map(([voterId, chosenOption]) => {
                          let label = "Membro da equipe";
                          if (voterId === event.ownerId || votingStatus.eventStatus?.clientEmail === user?.email) {
                            label = "Contratante";
                          } else if (voterId === votingStatus.eventStatus?.captacao?.id) {
                            label = `Fotógrafo (${votingStatus.eventStatus.captacao.nome})`;
                          } else if (voterId === votingStatus.eventStatus?.edicao?.id) {
                            label = `Editor (${votingStatus.eventStatus.edicao.nome})`;
                          }
                          const optionLabel = chosenOption === "OWNER" ? "Preço do Contratante" : chosenOption === "PRO" ? "Preço da Equipe" : "Média Recomendada";
                          return (
                            <div key={voterId} className="flex justify-between">
                              <span className="text-theme-text-muted">{label}</span>
                              <span className="font-bold text-brand-tactical">{optionLabel}</span>
                            </div>
                          );
                        })}
                        {votingStatus.winner && (
                          <div className="pt-2 border-t border-theme-border/30 mt-2 font-black text-brand-tactical flex justify-between uppercase tracking-wider text-[10px]">
                            <span>Preço Definido:</span>
                            <span>R$ {event.pricePerPhoto} ({votingStatus.winner})</span>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                  
                </div>
              )}

              {/* ── Luxury Link ── */}
              <div className="p-4 bg-brand-tactical/8 rounded-2xl border border-brand-tactical/20 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-tactical/15 flex items-center justify-center shrink-0">
                    <Link size={18} className="text-brand-tactical" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black uppercase tracking-widest text-brand-tactical mb-0.5">Link do Cliente</p>
                    <p className="text-[10px] font-mono text-theme-muted truncate">{luxuryUrl}</p>
                  </div>
                  <button
                    onClick={() => copyText(luxuryUrl, "luxury")}
                    className="flex items-center gap-1.5 px-3 py-2 bg-brand-tactical text-black text-[9px] font-black uppercase rounded-xl hover:brightness-110 transition-all shrink-0"
                  >
                    {copiedField === "luxury" ? <Check size={13} /> : <Share2 size={13} />}
                    {copiedField === "luxury" ? "Copiado!" : "Copiar"}
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* ══════════ DESIGNER TAB ══════════ */}
          {activeTab === "DESIGNER" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              
              {/* Info */}
              <div className="p-4 bg-brand-tactical/10 border border-brand-tactical/20 rounded-2xl">
                <p className="text-[10px] text-theme-text font-bold leading-relaxed">
                  Defina o layout e os elementos visuais que serão impressos nas fotos deste evento.
                  Estas configurações <span className="text-brand-tactical">substituem o controle do operador</span> na central de impressão.
                </p>
              </div>

              {/* Toggles */}
              <div className="space-y-3">
                <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${showLogo ? "bg-brand-tactical/10" : "bg-theme-border/50"}`}>
                      <Check size={18} className={showLogo ? "text-brand-tactical" : "text-theme-muted"} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Logo Padrão</p>
                      <p className="text-[10px] text-theme-muted italic">Exibir logo da Foto Segundo na base.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowLogo(!showLogo)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${showLogo ? "bg-brand-tactical" : "bg-theme-border"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showLogo ? "left-7" : "left-1"}`} />
                  </button>
                </div>

                <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${showTimestamp ? "bg-brand-tactical/10" : "bg-theme-border/50"}`}>
                      <CalendarDays size={18} className={showTimestamp ? "text-brand-tactical" : "text-theme-muted"} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Data e Hora</p>
                      <p className="text-[10px] text-theme-muted italic">Imprimir a hora da captura.</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowTimestamp(!showTimestamp)}
                    className={`w-12 h-6 rounded-full relative transition-colors ${showTimestamp ? "bg-brand-tactical" : "bg-theme-border"}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${showTimestamp ? "left-7" : "left-1"}`} />
                  </button>
                </div>
              </div>

              {/* Logo do Cliente */}
              <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border space-y-3">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <Layers size={18} className="text-blue-400" />
                  </div>
                  <div>
                    <p className="text-[9px] font-black uppercase tracking-widest opacity-50">Logo do Cliente / Patrocinador</p>
                    <p className="text-[10px] text-theme-muted italic">Exibida no canto da impressão</p>
                  </div>
                </div>
                <CoverPhotoInput
                  currentUrl={clientLogoUrl}
                  currentPosition="center"
                  onPositionChange={() => {}}
                  onChange={(url) => setClientLogoUrl(url || "")}
                />
              </div>

            </div>
          )}

          {/* ══════════ TEAM TAB ══════════ */}
          {activeTab === "TEAM" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">

              {/* Criador */}
              <div className="p-4 bg-theme-bg-muted rounded-2xl border border-theme-border flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-brand-tactical/15 flex items-center justify-center shrink-0">
                  <Users size={18} className="text-brand-tactical" />
                </div>
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">
                    {event.ownerId && event.captacaoId === event.ownerId ? "Fotógrafo Principal" : "Criador do Evento"}
                  </p>
                  <p className="text-sm font-black text-theme-text">Você</p>
                </div>
                <span className="ml-auto text-[9px] font-black px-2 py-1 rounded-full bg-brand-tactical/15 text-brand-tactical uppercase">
                  {event.ownerId && event.captacaoId === event.ownerId ? "Principal" : "Dono"}
                </span>
              </div>

              {/* Editor */}
              <div className="space-y-3">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 pl-1">Editor de Vídeo / Pós-Produção</p>

                {edicaoId ? (
                  <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                    <div className="p-4 bg-brand-tactical/8 border border-brand-tactical/25 rounded-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-brand-tactical flex items-center justify-center shrink-0">
                        <Check size={16} className="text-black" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-theme-text uppercase">{editorName || "Editor"}</p>
                        <p className="text-[10px] text-theme-muted">Editor atribuído · acesso ao material</p>
                      </div>
                      <button
                        onClick={() => { setEdicaoId(null); setEditorName(""); }}
                        className="p-2 text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl"
                        title="Remover editor"
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>

                    {/* Editor Services */}
                    <div className="pt-2">
                      <p className="text-[9px] font-black uppercase tracking-widest opacity-40 pl-1 mb-2">Serviços Oferecidos</p>
                      {loadingServices ? (
                        <p className="text-[10px] text-theme-muted italic pl-1">Carregando serviços...</p>
                      ) : editorServices.length === 0 ? (
                        <p className="text-[10px] text-theme-muted italic pl-1">Este editor não cadastrou serviços com preço fixo.</p>
                      ) : (
                        <div className="space-y-2">
                          {editorServices.map((svc) => (
                            <div key={svc.id} className="p-3 bg-theme-bg-muted border border-theme-border rounded-xl flex items-center justify-between">
                              <div>
                                <p className="text-[11px] font-black text-theme-text uppercase">{svc.name}</p>
                                <p className="text-[10px] font-bold text-brand-tactical mt-0.5">
                                  R$ {Number(svc.price).toFixed(2)}
                                </p>
                              </div>
                              <button
                                onClick={() => setPaymentModalService(svc)}
                                className="px-3 py-1.5 bg-brand-tactical text-black text-[9px] font-black uppercase tracking-wider rounded-lg hover:brightness-110 transition-all"
                              >
                                Contratar
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                      <input
                        placeholder="Buscar por nome ou e-mail..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-theme-bg-muted border border-theme-border rounded-2xl py-3.5 pl-11 pr-4 text-sm text-theme-text outline-none focus:border-brand-tactical/50 transition-all"
                      />
                      {isSearching && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                      )}
                    </div>

                    {searchQuery.length > 0 && searchQuery.length < 3 && (
                      <p className="text-[10px] text-theme-muted pl-2">Digite ao menos 3 caracteres...</p>
                    )}

                    {searchResults.length > 0 && (
                      <div className="bg-theme-bg-muted border border-theme-border rounded-2xl overflow-hidden divide-y divide-theme-border/40">
                        {searchResults.map((pro) => (
                          <button
                            key={pro.id}
                            onClick={() => {
                              setEdicaoId(pro.id);
                              setEditorName(pro.nome);
                              setSearchQuery("");
                              setSearchResults([]);
                            }}
                            className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-black/20 transition-colors text-left"
                          >
                            <div className="w-8 h-8 rounded-full bg-theme-bg border border-theme-border flex items-center justify-center text-[11px] font-black text-theme-muted shrink-0">
                              {(pro.nome || "?")[0].toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-black text-theme-text truncate">{pro.nome}</p>
                              <p className="text-[10px] text-theme-muted truncate">{pro.email}</p>
                            </div>
                            <span className="text-[9px] font-black text-brand-tactical uppercase shrink-0">Atribuir →</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.length === 0 && searchQuery.length >= 3 && !isSearching && (
                      <p className="text-[10px] text-theme-muted pl-2 italic">Nenhum profissional encontrado.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Outros Membros da Equipe */}
              <div className="space-y-4 pt-4 border-t border-theme-border/40">
                <p className="text-[9px] font-black uppercase tracking-widest opacity-40 pl-1">Outros Membros da Equipe</p>

                {/* Listagem de Membros */}
                {teamMembers.length > 0 && (
                  <div className="space-y-2">
                    {teamMembers.map((member) => (
                      <div key={member.id} className="p-4 bg-theme-bg-muted border border-theme-border rounded-2xl flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-tactical/10 flex items-center justify-center shrink-0">
                          {member.user?.profileImageUrl ? (
                            <img src={member.user.profileImageUrl} alt={member.user.nome} className="w-full h-full object-cover rounded-xl" />
                          ) : (
                            <Users size={18} className="text-brand-tactical" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-black text-theme-text uppercase">{member.user?.nome}</p>
                          <p className="text-[10px] text-theme-muted uppercase tracking-wider font-bold">
                            {member.role === "FOTOGRAFO_AUXILIAR" ? "Segundo Fotógrafo" :
                             member.role === "ASSISTENTE" ? "Assistente" :
                             member.role === "VIDEOMAKER" ? "Videomaker" : member.role}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemoveTeamMember(member.id)}
                          className="p-2 text-theme-muted hover:text-red-400 hover:bg-red-500/10 transition-all rounded-xl"
                          title="Remover membro"
                        >
                          <UserMinus size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Formulário para Adicionar Membro */}
                <div className="space-y-3 bg-theme-bg-muted/30 p-4 border border-theme-border/50 rounded-2xl">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Adicionar Membro à Equipe</p>
                  
                  {/* Select Role */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[8px] font-black uppercase tracking-widest opacity-50 font-bold">Função / Papel</label>
                    <select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl px-4 py-3 text-xs font-bold text-theme-text outline-none focus:border-brand-tactical/60 transition-all"
                    >
                      <option value="FOTOGRAFO_AUXILIAR">Segundo Fotógrafo</option>
                      <option value="ASSISTENTE">Assistente</option>
                      <option value="VIDEOMAKER">Videomaker</option>
                    </select>
                  </div>

                  {/* Search input */}
                  <div className="relative">
                    <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted pointer-events-none" />
                    <input
                      placeholder="Buscar profissional por nome..."
                      value={memberSearchQuery}
                      onChange={(e) => setMemberSearchQuery(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border rounded-xl py-3.5 pl-11 pr-4 text-xs text-theme-text outline-none focus:border-brand-tactical/50 transition-all"
                    />
                    {isSearchingMember && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>

                  {memberSearchQuery.length > 0 && memberSearchQuery.length < 3 && (
                    <p className="text-[10px] text-theme-muted pl-2">Digite ao menos 3 caracteres...</p>
                  )}

                  {memberSearchResults.length > 0 && (
                    <div className="bg-theme-bg border border-theme-border rounded-xl overflow-hidden divide-y divide-theme-border/40">
                      {memberSearchResults.map((pro) => (
                        <button
                          key={pro.id}
                          onClick={() => handleAddTeamMember(pro.id)}
                          disabled={addingMember}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors text-left"
                        >
                          <div className="w-7 h-7 rounded-full bg-theme-bg-muted border border-theme-border flex items-center justify-center text-[10px] font-black text-theme-muted shrink-0">
                            {(pro.nome || "?")[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-black text-theme-text truncate">{pro.nome}</p>
                            <p className="text-[10px] text-theme-muted truncate">{pro.email}</p>
                          </div>
                          <span className="text-[9px] font-black text-brand-tactical uppercase shrink-0">Adicionar +</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {memberSearchResults.length === 0 && memberSearchQuery.length >= 3 && !isSearchingMember && (
                    <p className="text-[10px] text-theme-muted pl-2 italic">Nenhum profissional encontrado.</p>
                  )}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* ─── Footer ─── */}
        <div className="px-7 py-5 border-t border-theme-border flex items-center gap-3 shrink-0 bg-theme-bg-muted/50">
          <button onClick={onClose} className="px-6 py-3.5 text-theme-muted text-[10px] font-black uppercase tracking-widest hover:text-theme-text transition-all rounded-xl">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 py-3.5 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-lg shadow-brand-tactical/20 rounded-xl disabled:opacity-60"
          >
            {saving ? "Salvando…" : "Salvar Painel"}
            {!saving && <ArrowRight size={16} />}
          </button>
        </div>
      </div>

      {/* ─── Payment Modal ─── */}
      {paymentModalService && (
        <div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setPaymentModalService(null)} />
          <div className="relative w-full max-w-sm bg-theme-card border border-theme-border rounded-[24px] p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-sm font-black uppercase italic tracking-tight text-theme-text mb-1">
              Contratar Serviço
            </h3>
            <p className="text-[11px] text-theme-muted mb-4 line-clamp-2">
              {paymentModalService.name} — R$ {Number(paymentModalService.price).toFixed(2)}
            </p>

            <div className="space-y-3 mb-6">
              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "CREDITS" ? "border-brand-tactical bg-brand-tactical/5" : "border-theme-border hover:border-theme-muted"}`}>
                <input type="radio" name="payment" value="CREDITS" checked={paymentMethod === "CREDITS"} onChange={() => setPaymentMethod("CREDITS")} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "CREDITS" ? "border-brand-tactical" : "border-theme-muted"}`}>
                  {paymentMethod === "CREDITS" && <div className="w-2 h-2 rounded-full bg-brand-tactical" />}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-theme-text">Usar Créditos</p>
                  <p className="text-[9px] text-theme-muted">Pague com saldo da carteira</p>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all ${paymentMethod === "MP" ? "border-brand-tactical bg-brand-tactical/5" : "border-theme-border hover:border-theme-muted"}`}>
                <input type="radio" name="payment" value="MP" checked={paymentMethod === "MP"} onChange={() => setPaymentMethod("MP")} className="hidden" />
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${paymentMethod === "MP" ? "border-brand-tactical" : "border-theme-muted"}`}>
                  {paymentMethod === "MP" && <div className="w-2 h-2 rounded-full bg-brand-tactical" />}
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase text-theme-text">Mercado Pago</p>
                  <p className="text-[9px] text-theme-muted">Pix ou Cartão de Crédito</p>
                </div>
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPaymentModalService(null)}
                className="flex-1 py-3 text-[10px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-text bg-theme-bg-muted hover:bg-black/20 rounded-xl transition-all"
                disabled={hiring}
              >
                Cancelar
              </button>
              <button
                onClick={handleHireService}
                disabled={hiring}
                className="flex-1 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:brightness-110 transition-all disabled:opacity-50"
              >
                {hiring ? "Processando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}

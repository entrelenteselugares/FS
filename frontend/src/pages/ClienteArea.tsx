import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { T, Card } from "../lib/theme";
import AccessTypeModal from "../components/AccessTypeModal";
import { SideDrawer } from "../components/SideDrawer";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { Image, Clock, ShieldCheck, ArrowRight, AlertTriangle, User, CheckCircle2, X, ShoppingBag, Printer, Zap, Play } from "lucide-react";
import { ExpressSaleModal, FlashEventModal, ExpressSaleBanner, type EventItem, type Partner } from "../components/profissional";

type ActiveTab = "files" | "profile" | "wallet" | "franquia";

interface Pedido {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  hasPaid: boolean;
  accessType?: string | null;
  accessExpiresAt?: string | null;
  event: {
    id: string;
    nomeNoivos: string;
    dataEvento: string;
    location: string;
    city: string | null;
    coverPhotoUrl: string | null;
    lightroomUrl?: string | null;
    driveUrl?: string | null;
    temFoto: boolean;
    temVideo: boolean;
    temReels: boolean;
    temFotoImpressa: boolean;
  };
  showAlbum: boolean;
  showVideo: boolean;
  manualType?: string | null;
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(dt);
}

const S = {
  page: { 
    fontFamily: T.fontB, 
    background: T.bg, 
    color: T.text, 
    minHeight: "100vh" 
  } as React.CSSProperties,
  card: { 
    ...Card, 
    background: T.bgCard, 
    border: `1px solid ${T.border}`, 
    borderRadius: 0 
  } as React.CSSProperties,
};

export default function ClienteArea() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("files");
  
  // Franchise States
  const [events, setEvents] = useState<EventItem[]>([]);
  const [network, setNetwork] = useState<Partner[]>([]);
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);
  
  const NAV_ITEMS: NavItem[] = [
    { label: "Minhas Memórias", onClick: () => setActiveTab("files"), isActive: activeTab === "files", icon: <Image size={18} /> },
    { label: "Minha Carteira", onClick: () => setActiveTab("wallet"), isActive: activeTab === "wallet", icon: <ShoppingBag size={18} /> },
    ...(user?.franchiseProfile ? [
      { label: "Franquia Print", onClick: () => setActiveTab("franquia"), isActive: activeTab === "franquia", icon: <Printer size={18} /> }
    ] : []),
    { label: "Meus Dados", onClick: () => setActiveTab("profile"), isActive: activeTab === "profile", icon: <User size={18} /> },
  ];
  
  // Profile States
  const [profileData, setProfileData] = useState({ nome: "", whatsapp: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await API.get("/cliente/pedidos");
      setPedidos(data);
      return data;
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(async (pedido: Pedido) => {
    setSelected(pedido);
    if (pedido.hasPaid && !pedido.event.lightroomUrl) {
      setLoadingDetalhe(true);
      try {
        const { data } = await API.get(`/cliente/pedidos/${pedido.id}`);
        setSelected(data);
      } catch {
        // mantém o que tem
      } finally {
        setLoadingDetalhe(false);
      }
    }
  }, []);

  const handleToggleVisibility = async (orderId: string, showAlbum?: boolean, showVideo?: boolean) => {
    try {
      await API.post(`/orders/${orderId}/visibility`, { showAlbum, showVideo });
      const { data } = await API.get("/cliente/pedidos"); // Atualiza a lista completa
      setPedidos(data);
      const updated = data.find((p: Pedido) => p.id === orderId);
      if (updated) setSelected(updated);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || "Erro ao atualizar visibilidade.");
    }
  };

  useEffect(() => {
    fetchPedidos().then(data => {
      const urlOrderId = searchParams.get("orderId");
      if (urlOrderId) {
        const found = data.find((p: Pedido) => p.id === urlOrderId);
        if (found) handleSelect(found);
      }
    });

    if (user) {
      setProfileData({
        nome: user.nome || "",
        whatsapp: user.whatsapp || ""
      });

      if (user.franchiseProfile) {
        API.get("profissional/events").then(r => setEvents(r.data)).catch(() => {});
        API.get("profissional/network").then(r => setNetwork(r.data)).catch(() => {});
      }
    }
  }, [searchParams, handleSelect, fetchPedidos, user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await API.patch("/auth/me", profileData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      alert("Erro ao salvar perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  const now = useMemo(() => Date.now(), []);

  const groupedEvents = useMemo(() => {
    const groups: Record<string, { 
      event: Pedido["event"], 
      pedidos: Pedido[],
      hasAprovado: boolean,
      hasPendente: boolean,
      totalAprovado: number,
      totalPendente: number,
      latestAprovado?: Pedido,
      firstPendente?: Pedido
    }> = {};

    pedidos.forEach(p => {
      if (!groups[p.event.id]) {
        groups[p.event.id] = { 
          event: p.event, 
          pedidos: [], 
          hasAprovado: false, 
          hasPendente: false,
          totalAprovado: 0,
          totalPendente: 0
        };
      }
      groups[p.event.id].pedidos.push(p);
      if (p.hasPaid) {
        groups[p.event.id].hasAprovado = true;
        groups[p.event.id].totalAprovado += Number(p.amount);
        if (!groups[p.event.id].latestAprovado || new Date(p.createdAt) > new Date(groups[p.event.id].latestAprovado!.createdAt)) {
          groups[p.event.id].latestAprovado = p;
        }
      } else {
        groups[p.event.id].hasPendente = true;
        groups[p.event.id].totalPendente += Number(p.amount);
        if (!groups[p.event.id].firstPendente || new Date(p.createdAt) < new Date(groups[p.event.id].firstPendente!.createdAt)) {
          groups[p.event.id].firstPendente = p;
        }
      }
    });

    return Object.values(groups).sort((a, b) => {
      // Prioriza eventos com pendências, depois os mais recentes
      if (a.hasPendente && !b.hasPendente) return -1;
      if (!a.hasPendente && b.hasPendente) return 1;
      const dateA = new Date(a.pedidos[0].createdAt).getTime();
      const dateB = new Date(b.pedidos[0].createdAt).getTime();
      return dateB - dateA;
    });
  }, [pedidos]);

  const aprovados = groupedEvents.filter(g => g.hasAprovado);
  const pendentes = groupedEvents.filter(g => g.hasPendente && !g.hasAprovado);

  return (
    <DashboardLayout title="Minha Conta" navItems={NAV_ITEMS}>
      <style>{`
        @keyframes radarPulse { 0%,100% { transform:scale(1); opacity:.6; } 50% { transform:scale(1.4); opacity:0; } }
        @media (max-width: 768px) { .mobile-stack { flex-direction:column !important; align-items:flex-start !important; } }
      `}</style>

      <div className="max-w-[1400px] mx-auto px-2 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Expiring Alert Banner */}
        {(() => {
          const exp = aprovados.filter(g => { 
            const expiry = g.latestAprovado?.accessExpiresAt;
            if (!expiry) return false; 
            const d = Math.ceil((new Date(expiry).getTime() - Date.now()) / (864e5)); 
            return d > 0 && d <= 7; 
          });
          if (!exp.length) return null;
          return (
            <div className="flex items-center gap-4 px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <AlertTriangle size={16} />
              <p className="text-[10px] font-black uppercase tracking-widest">Atenção: {exp.length} álbum(ns) expiram em menos de 7 dias. Faça o download agora.</p>
            </div>
          );
        })()}

        {/* Header Section */}
        <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
          
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-12 bg-brand-tactical" />
              <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Central de Arquivos</p>
            </div>
            <h1 className="text-4xl md:text-7xl font-heading font-black text-white uppercase tracking-tighter italic leading-[0.9]">
              Minhas Memórias
            </h1>
          </div>
          
          <div className="flex items-center gap-4 relative z-10">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-tactical/10 border border-brand-tactical/30">
              <ShieldCheck size={12} className="text-brand-tactical" />
              <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">{user?.nome || "Área Exclusiva"}</p>
            </div>
            <div className="h-px flex-1 bg-gradient-to-r from-theme-border/60 to-transparent" />
          </div>
        </div>

        {/* KPI Bar */}
        {!loading && pedidos.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
            {[
              { label: "Total Adquiridos", value: pedidos.length, icon: <Image size={16} /> },
              { label: "Acesso Ativo", value: aprovados.length, icon: <CheckCircle2 size={16} />, highlight: true },
              { label: "Aguardando", value: pendentes.length, icon: <Clock size={16} /> },
              { label: "Créditos Reward", value: formatCurrency(user?.rewardCredits || 0), icon: <ShoppingBag size={16} />, isCash: true },
            ].map((m, idx) => (
              <div 
                key={m.label} 
                className={`relative overflow-hidden p-6 md:p-8 border transition-all duration-500 group ${
                  m.highlight ? 'bg-brand-tactical/5 border-brand-tactical/30' : 'bg-theme-bg-muted/10 border-theme-border/40 hover:border-theme-border/80'
                }`}
                style={{ animationDelay: `${idx * 150}ms` }}
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-12 -translate-y-12" />
                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 ${m.highlight ? 'bg-brand-tactical text-black' : 'bg-zinc-800 text-zinc-400'}`}>
                      {m.icon}
                    </div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{m.label}</p>
                  </div>
                  <p className={`text-3xl md:text-4xl font-heading font-black italic tracking-tighter leading-none ${
                    m.highlight || m.isCash ? 'text-brand-tactical' : 'text-white'
                  }`}>
                    {m.value}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

          {activeTab === "files" ? (
            <>
              <p style={{ fontSize: 14, color: "var(--theme-text-muted)", marginBottom: 32 }}>
                Acesso vitalício às memórias que você adquiriu.
              </p>

              {loading ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[...Array(3)].map((_, i) => (
                    <div key={i} style={{ ...S.card, padding: "1.5rem", display: "flex", gap: "1.5rem", animation: "pulse 2s infinite" }}>
                        <div style={{ width: 100, height: 100, background: "#111", borderRadius: 8, flexShrink: 0 }} />
                        <div style={{ flex: 1, paddingTop: 4 }}>
                            <div style={{ height: 18, background: "#111", borderRadius: 4, width: "70%", marginBottom: 12 }} />
                            <div style={{ height: 14, background: "#111", borderRadius: 4, width: "40%" }} />
                        </div>
                    </div>
                  ))}
                </div>
              ) : pedidos.length === 0 ? (
                <div className="relative overflow-hidden border border-dashed border-theme-border/40 p-24 text-center space-y-8">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/5 to-transparent opacity-50" />
                  <div className="relative inline-block">
                    <Image size={48} className="mx-auto text-theme-border/30" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full" style={{ animation: "radarPulse 2s ease-out infinite" }} />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full" />
                  </div>
                  <div className="relative space-y-3">
                    <p className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tighter">Arquivo em Standby</p>
                    <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">Nenhuma memória adquirida ainda. Explore a vitrine ou solicite uma cobertura exclusiva.</p>
                  </div>
                  <div className="relative flex items-center justify-center gap-4 flex-wrap">
                    <button onClick={() => navigate("/")} className="fs-btn bg-brand-tactical text-brand-text flex items-center gap-3">
                      Explorar Vitrine <ArrowRight size={14} />
                    </button>
                    <button onClick={() => navigate("/cotacao")} className="fs-btn border border-theme-border text-theme-text hover:border-brand-tactical flex items-center gap-3">
                      Solicitar Cobertura <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-10">
                  {groupedEvents.length > 0 && (
                    <div className="space-y-6">
                      {groupedEvents.map((group) => (
                        <EventGroupRow 
                          key={group.event.id} 
                          group={group} 
                          now={now} 
                          onSelectPedido={(p) => handleSelect(p)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : activeTab === "profile" ? (
            <div className="lux-card p-10 max-w-xl space-y-8 border-l-4 border-l-brand-tactical bg-theme-bg-muted/10">
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tight">Dados do Perfil</h2>
                <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Informações vinculadas à sua conta</p>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">E-mail (Não editável)</label>
                  <input type="text" disabled value={user?.email || ""} className="fs-input opacity-60" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Nome Completo</label>
                  <input type="text" value={profileData.nome} onChange={e => setProfileData(p => ({ ...p, nome: e.target.value }))} className="fs-input" placeholder="Como quer ser chamado" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">WhatsApp</label>
                  <input type="text" value={profileData.whatsapp} onChange={e => setProfileData(p => ({ ...p, whatsapp: e.target.value }))} className="fs-input" placeholder="(00) 00000-0000" />
                </div>
                <div className="flex items-center gap-6">
                  <button type="submit" disabled={isSaving} className="fs-btn bg-brand-tactical text-brand-text disabled:opacity-50">
                    {isSaving ? "Salvando..." : "Salvar Alterações"}
                  </button>
                  {saveSuccess && <span className="text-brand-tactical text-[10px] font-black uppercase tracking-widest">✓ Atualizado</span>}
                </div>
              </form>
              <div className="pt-6 border-t border-theme-border/40 space-y-4">
                <h3 className="text-[9px] font-black text-red-400 uppercase tracking-[0.3em]">Zona de Suporte</h3>
                <p className="text-[11px] text-theme-muted">Para redefinir sua senha ou solicitar exclusão de dados, entre em contato com nosso suporte.</p>
                <a href="https://wa.me/5519997843817" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-black text-theme-text uppercase tracking-widest hover:text-brand-tactical transition-colors">
                  Falar com Suporte <ArrowRight size={12} />
                </a>
              </div>
            </div>
          ) : activeTab === "wallet" ? (
            <div className="space-y-10 animate-in fade-in duration-500">
              <div className="border-b border-theme-border/60 pb-6">
                <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter italic">Minha Carteira</h2>
                <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Créditos de Recompensa e Cashback</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-theme-border/20 border border-theme-border/20">
                <div className="bg-theme-bg-muted/30 p-10 space-y-4">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Saldo Disponível</label>
                  <div className="text-6xl font-black italic tracking-tighter text-brand-tactical">
                    {formatCurrency(user?.rewardCredits || 0)}
                  </div>
                  <p className="text-[10px] text-theme-muted font-bold leading-relaxed uppercase tracking-widest max-w-xs">
                    Use seu saldo para abater em novos pedidos, impressões ou upgrades Phygital.
                  </p>
                </div>
                <div className="bg-theme-bg-muted/30 p-10 space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Como ganhar mais?</p>
                    <p className="text-[11px] text-theme-muted">Toda compra no marketplace gera 5% de cashback imediato para você.</p>
                  </div>
                  <button onClick={() => navigate("/")} className="fs-btn bg-brand-tactical text-brand-text w-full flex items-center justify-center gap-3">
                    Explorar Marketplace <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* ── HISTÓRICO DO LEDGER ── */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="h-0.5 w-6 bg-brand-tactical" />
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Extrato de Recompensas</p>
                 </div>

                 <div className="bg-theme-bg/20 border border-theme-border/30 overflow-hidden">
                    {user?.gamificationLedger && user.gamificationLedger.length > 0 ? (
                      <div className="divide-y divide-theme-border/10">
                        {user.gamificationLedger.map(item => (
                          <div key={item.id} className="p-5 flex items-center justify-between hover:bg-theme-bg-muted/10 transition-all">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
                                  <p className="text-[11px] font-black text-theme-text uppercase tracking-tight italic">
                                    {item.description}
                                  </p>
                                </div>
                                <p className="text-[8px] text-theme-muted font-bold uppercase tracking-widest ml-3">
                                  {new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.type}
                                </p>
                             </div>
                             <div className="text-right">
                               <p className="text-[14px] font-black italic tracking-tighter text-brand-tactical">
                                  +{formatCurrency(item.amount || 0)}
                               </p>
                               {item.points && (
                                 <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">
                                   +{item.points} pts
                                 </p>
                               )}
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-16 text-center space-y-4">
                        <ShoppingBag size={32} className="mx-auto text-theme-border/20" />
                        <p className="text-[10px] text-theme-muted uppercase font-black italic tracking-widest opacity-40">
                          Sua carteira está aguardando as primeiras recompensas.
                        </p>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : activeTab === "franquia" && user?.franchiseProfile ? (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="border-b border-theme-border/60 pb-6">
                <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter italic">Franquia de Impressão</h2>
                <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-black italic">Seu Ponto de Impressão Phygital</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-theme-border/20 border border-theme-border/20">
                <div className="bg-theme-bg-muted/30 p-8 space-y-3">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Créditos Disponíveis</label>
                  <div className={`text-5xl font-black italic tracking-tighter ${user.franchiseProfile.printCredits < 50 ? 'text-amber-500' : 'text-brand-tactical'}`}>
                    {user.franchiseProfile.printCredits}
                  </div>
                  <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">fotos restantes</p>
                </div>
                <div className="bg-theme-bg-muted/30 p-8 space-y-3">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Status do Ponto</label>
                  <div className={`text-sm font-black uppercase tracking-widest ${user.franchiseProfile.active ? 'text-emerald-500' : 'text-red-500'}`}>
                    {user.franchiseProfile.active ? '● Operacional' : '● Inativo'}
                  </div>
                  <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest">modo de rede</p>
                </div>
                <div className="bg-theme-bg-muted/30 p-8 space-y-3">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest block">Suporte à Franquia</label>
                  <p className="text-[10px] text-theme-muted font-bold leading-relaxed uppercase tracking-widest">
                    Entre em contato para recarregar créditos ou suporte técnico.
                  </p>
                  <a href="https://wa.me/5519997843817" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[9px] font-black text-brand-tactical uppercase tracking-widest hover:underline mt-2">
                    RECARREGAR CRÉDITOS →
                  </a>
                </div>
              </div>
              {user.franchiseProfile.printCredits < 50 && (
                <div className="border border-amber-500/30 bg-amber-500/5 p-6 flex items-start gap-4">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <div>
                    <p className="text-xs font-black text-amber-500 uppercase tracking-widest">Alerta de Saldo</p>
                    <p className="text-[10px] text-theme-muted font-bold mt-1 uppercase tracking-widest">Seu saldo está baixo. Solicite recarga para evitar interrupções.</p>
                  </div>
                </div>
              )}

              {/* ── OPERAÇÕES EXPRESSAS (VENDA RÁPIDA) ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ExpressSaleBanner onOpen={() => setIsExpressModalOpen(true)} />
                <div 
                  onClick={() => setIsFlashModalOpen(true)}
                  className="bg-theme-bg-muted border border-yellow-400/30 p-6 h-full flex items-center justify-between cursor-pointer hover:border-yellow-400/60 transition-all group overflow-hidden relative"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-yellow-400" />
                  <div className="space-y-1 relative z-10">
                    <div className="flex items-center gap-2 text-yellow-400">
                      <Zap size={14} fill="currentColor" />
                      <span className="text-[10px] font-black uppercase tracking-[0.3em] italic">Oportunidade Agora</span>
                    </div>
                    <h3 className="text-xl font-heading font-black text-theme-text uppercase italic">Foto Print Live</h3>
                    <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">Ative um QR Code instantaneamente</p>
                  </div>
                  <div className="text-yellow-400/10 group-hover:text-yellow-400/30 transition-colors">
                    <Zap size={40} strokeWidth={3} />
                  </div>
                </div>
              </div>

              {/* ── OPERAÇÕES EM CAMPO ── */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-0.5 w-6 bg-brand-tactical" />
                  <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Operações em Campo</p>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {events.filter(ev => ev.captacaoId === user.id).length > 0 ? (
                    events.filter(ev => ev.captacaoId === user.id).map(ev => (
                      <div key={ev.id} className="bg-theme-bg border border-theme-border p-6 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-brand-tactical/30 transition-all group">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-theme-card border border-theme-border flex items-center justify-center text-brand-tactical group-hover:scale-110 transition-transform">
                                <Printer size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-black text-theme-text uppercase italic tracking-tight">{ev.nomeNoivos}</p>
                                <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">{new Date(ev.dataEvento).toLocaleDateString('pt-BR')} · {ev.location}</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => navigate(`/profissional/monitor/${ev.id}`)}
                            className="px-8 py-3 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-3 shadow-lg shadow-brand-tactical/10"
                          >
                            <Play size={12} /> ABRIR MONITOR
                          </button>
                      </div>
                    ))
                  ) : (
                    <div className="p-10 border border-dashed border-theme-border/40 text-center space-y-4">
                        <p className="text-[10px] text-theme-muted uppercase font-black italic tracking-widest">Nenhum evento designado para você neste momento.</p>
                        <p className="text-[8px] text-theme-muted/60 uppercase font-bold max-w-xs mx-auto leading-relaxed">Fique atento à sua agenda. Quando um admin vincular sua franquia a um evento, ele aparecerá aqui para impressão.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* ── ATIVIDADE RECENTE ── */}
              <div className="space-y-6">
                 <div className="flex items-center gap-3">
                    <div className="h-0.5 w-6 bg-brand-tactical" />
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Histórico de Operações</p>
                 </div>

                 <div className="bg-theme-bg/20 border border-theme-border/30 overflow-hidden">
                    {user.franchiseProfile.transactions && user.franchiseProfile.transactions.length > 0 ? (
                      <div className="divide-y divide-theme-border/10">
                        {user.franchiseProfile.transactions.map(tx => (
                          <div key={tx.id} className="p-4 flex items-center justify-between hover:bg-theme-bg-muted/10 transition-all">
                             <div className="space-y-1">
                                <p className="text-[10px] font-black text-theme-text uppercase tracking-tight italic">
                                  {tx.description || (tx.type === 'PRINT_CONSUMPTION' ? 'Impressão Phygital' : 'Recarga')}
                                </p>
                                <p className="text-[8px] text-theme-muted font-bold uppercase tracking-widest">
                                  {new Date(tx.createdAt).toLocaleDateString('pt-BR')} {new Date(tx.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                             </div>
                             <div className={`text-[12px] font-black italic tracking-tighter ${tx.amount > 0 ? 'text-brand-tactical' : 'text-red-400'}`}>
                                {tx.amount > 0 ? '+' : ''}{tx.amount}
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-10 text-center text-[10px] text-theme-muted uppercase font-black italic tracking-widest opacity-30">
                        Nenhuma atividade registrada.
                      </div>
                    )}
                 </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* DETALHES DO PEDIDO (DRAWER) */}
        {selected && (
          <SideDrawer
            isOpen={!!selected}
            onClose={() => setSelected(null)}
            width="max-w-2xl"
            title={selected?.event?.nomeNoivos || "Detalhes do Álbum"}
          >
            <PedidoDetalhe
              pedido={selected}
              loading={loadingDetalhe}
              onGoToEvent={() => navigate(`/e/${selected.event?.id || selected.id}`)}
              onChangePrivacy={() => setIsPrivacyModalOpen(true)}
              onToggleVisibility={handleToggleVisibility}
            />
          </SideDrawer>
        )}

      {isPrivacyModalOpen && selected && (
        <AccessTypeModal
          orderId={selected.id}
          eventTitle={selected.event.nomeNoivos}
          onConfirmed={async () => {
            setIsPrivacyModalOpen(false);
            const data = await fetchPedidos();
            const updated = data.find((p: Pedido) => p.id === selected.id);
            if (updated) setSelected(updated);
            else setSelected(null);
          }}
          onClose={() => setIsPrivacyModalOpen(false)}
        />
      )}

      {/* Franchise Modals */}
      {isExpressModalOpen && (
        <ExpressSaleModal 
          network={network}
          onClose={() => setIsExpressModalOpen(false)}
          onSuccess={(msg) => {
            API.get("profissional/events").then(r => setEvents(r.data)).catch(() => {});
            showNotification(msg);
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {isFlashModalOpen && (
        <FlashEventModal 
          network={network}
          onClose={() => setIsFlashModalOpen(false)}
          onSuccess={(slug) => {
            showNotification("Foto Print Live Ativado!", "success");
            setIsFlashModalOpen(false);
            navigate(`/e/${slug}`);
          }}
          onError={(msg) => showNotification(msg, "error")}
        />
      )}

      {/* Global Notifications */}
      {notification && (
        <div 
          className="fixed bottom-10 right-10 z-[2000] px-8 py-4 shadow-2xl animate-in slide-in-from-right duration-500"
          style={{ 
            background: notification.type === "success" ? T.brand : "#f87171",
            color: notification.type === "success" ? "#000" : "#fff",
            fontWeight: 900,
            fontSize: 10,
            textTransform: "uppercase",
            letterSpacing: 2
          }}
        >
          {notification.message}
        </div>
      )}
    </DashboardLayout>
  );
}

interface EventGroup {
  event: Pedido["event"];
  pedidos: Pedido[];
  hasAprovado: boolean;
  hasPendente: boolean;
  totalAprovado: number;
  totalPendente: number;
  latestAprovado?: Pedido;
  firstPendente?: Pedido;
}

function EventGroupRow({ group, now, onSelectPedido }: {
  group: EventGroup;
  now: number;
  onSelectPedido: (p: Pedido) => void;
}) {
  const navigate = useNavigate();
  const { event, pedidos, hasAprovado, hasPendente, latestAprovado, firstPendente } = group;

  const getStatusMessage = (eventDate: string) => {
    const dt = new Date(eventDate);
    const diffDays = Math.ceil((dt.getTime() - now) / (1000 * 60 * 60 * 24));

    if (diffDays > 30) return "Preparativos em andamento. O grande dia está sendo planejado!";
    if (diffDays > 7) return "A contagem regressiva começou! Falta pouco para o seu evento.";
    if (diffDays > 0) return "Chegou a hora! Estamos prontos para eternizar cada momento.";
    if (diffDays > -30) return "Evento realizado! Seus arquivos estão em fase de curadoria técnica.";
    return "Memórias eternizadas. Aproveite cada detalhe do seu álbum.";
  };

  const handleAddServices = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const dt = new Date(event.dataEvento);
    const diffDays = Math.ceil((dt.getTime() - now) / (864e5));

    if (diffDays > 10) {
      navigate(`/e/${event.id}?intent=upgrade`);
    } else {
      const msg = `Olá! Gostaria de adicionar mais serviços ao meu evento "${event.nomeNoivos}". Vi que para pedidos com menos de 7 dias úteis da data, a inclusão está sujeita à disponibilidade da agenda dos profissionais.`;
      window.open(`https://wa.me/5519997843817?text=${encodeURIComponent(msg)}`, "_blank");
    }
  };

  const accessExpiresAt = latestAprovado?.accessExpiresAt;
  const diff = accessExpiresAt ? new Date(accessExpiresAt).getTime() - now : null;
  const daysLeft = diff ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div
      className={`relative group border transition-all duration-500 overflow-hidden ${
        hasPendente ? 'border-amber-500/40 bg-amber-500/[0.02]' : 'border-theme-border/40 bg-theme-bg-muted/10'
       } ${isExpiringSoon ? 'border-amber-500/40' : ''}`}
      style={{
        boxShadow: isExpiringSoon ? "0 0 20px rgba(245, 158, 11, 0.05)" : "none"
      }}
    >
      <div className="flex flex-col lg:flex-row items-stretch gap-4 md:gap-8 p-4 md:p-6 lg:p-8">
        {/* Thumbnail Section */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full lg:w-56 aspect-[3/4] bg-zinc-950 overflow-hidden border border-theme-border/40 group-hover:border-brand-tactical/40 transition-colors shadow-2xl">
            {event.coverPhotoUrl ? (
              <img 
                src={event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
                alt="" 
                className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${hasAprovado ? 'grayscale-0 brightness-110' : 'grayscale brightness-40 blur-[2px]'}`} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                <Image size={32} className="text-zinc-800" />
              </div>
            )}
            
            {/* Tactical Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            
            {!hasAprovado && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40 backdrop-blur-[1px]">
                 <div className="p-3 bg-black/80 border border-white/10 rounded-full">
                   <Clock size={20} className="text-amber-500 animate-pulse" />
                 </div>
                 <p className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Acesso Bloqueado</p>
              </div>
            )}

            {isExpiringSoon && (
              <div className="absolute top-4 right-4 px-2 py-1 bg-amber-500 text-black text-[8px] font-black uppercase tracking-widest">
                Expira em {daysLeft}d
              </div>
            )}
            
            <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center z-10">
               <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">{event.city || "Digital"}</p>
               <div className="flex gap-1">
                 {event.temFoto && <div className="w-1 h-1 rounded-full bg-brand-tactical" />}
                 {event.temVideo && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
               </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between min-w-0 py-2">
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                   <div className="h-0.5 w-6 bg-brand-tactical" />
                   <p className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em]">Álbum do Evento</p>
                </div>
                <h4 className="text-2xl md:text-3xl lg:text-4xl font-heading font-black italic tracking-tighter uppercase leading-none text-theme-text">
                  {event.nomeNoivos}
                </h4>
                <div className="flex items-center gap-3 text-[9px] md:text-[10px] font-bold text-theme-muted uppercase tracking-widest">
                  <div className="flex items-center gap-1.5"><Clock size={11} /> {formatDate(event.dataEvento)}</div>
                  <span className="w-1 h-1 rounded-full bg-theme-border" />
                  <span>{event.city || event.location}</span>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-1.5 pt-2">
                {event.temFoto && <Tag label="Foto" />}
                {event.temVideo && <Tag label="Vídeo" />}
                {event.temReels && <Tag label="Reels" color="var(--brand-tactical)" />}
              </div>
            </div>

            {/* Tactical Status Card */}
            <div className="relative p-6 bg-zinc-900/40 border border-theme-border/30 overflow-hidden group/jornada">
               <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical opacity-50 group-hover/jornada:opacity-100 transition-opacity" />
               <div className="relative z-10 space-y-2">
                 <div className="flex items-center gap-3">
                    <Zap size={12} className="text-brand-tactical" />
                    <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Status da Operação</p>
                 </div>
                 <p className="text-sm md:text-base text-zinc-300 font-medium leading-relaxed italic">
                    "{getStatusMessage(event.dataEvento)}"
                 </p>
               </div>
               <div className="absolute top-0 right-0 p-4 opacity-5">
                  <Clock size={60} />
               </div>
            </div>

            {/* Order History Grid */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                 <div className="h-px w-6 bg-zinc-800" />
                 <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em]">Histórico de Aquisições</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedidos.map((p: Pedido) => (
                  <button 
                    key={p.id} 
                    onClick={() => onSelectPedido(p)}
                    className={`flex items-center justify-between p-4 border transition-all duration-300 text-left group/order ${
                      p.hasPaid 
                        ? 'border-emerald-500/10 bg-emerald-500/5 hover:border-emerald-500/30' 
                        : 'border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40'
                    }`}
                  >
                    <div className="min-w-0 flex items-center gap-3">
                      <div className={`p-2 ${p.hasPaid ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        {p.hasPaid ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-white uppercase tracking-widest truncate group-hover/order:text-brand-tactical transition-colors">{p.manualType || "Investimento"}</p>
                        <p className={`text-[8px] font-black uppercase tracking-widest opacity-60`}>
                          {p.hasPaid ? "Confirmado" : "Pendente"}
                        </p>
                      </div>
                    </div>
                    <p className={`text-sm font-black italic ml-4 ${p.hasPaid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {formatCurrency(p.amount)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row md:items-center justify-between gap-6 border-t border-theme-border/20 pt-6">
            <div className="flex items-center gap-4">
              {hasAprovado && (
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${isExpiringSoon ? 'bg-amber-500 animate-pulse' : 'bg-brand-tactical'}`} />
                  <p className={`text-[10px] font-black uppercase tracking-widest ${isExpiringSoon ? 'text-amber-500' : 'text-brand-tactical'}`}>
                    {daysLeft && daysLeft <= 0 ? "Expirado" : `${daysLeft}d restantes — ${latestAprovado?.accessType === "PUBLIC" ? "Público" : "Privado"}`}
                  </p>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4">
               <button 
                  onClick={() => {
                    if (new Date(event.dataEvento).getTime() > now) {
                      handleAddServices();
                    } else {
                      navigate(`/e/${event.id}`);
                    }
                  }}
                  className="fs-btn border border-theme-border text-theme-text hover:border-brand-tactical hover:text-brand-tactical flex items-center gap-2"
                >
                  {new Date(event.dataEvento).getTime() > now ? (
                    <>
                      {Math.ceil((new Date(event.dataEvento).getTime() - now) / 864e5) > 10 ? "Fazer Upgrade" : "Solicitar Inclusão"}
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={12} className="text-brand-tactical" /> REVELAR MEMÓRIAS
                    </>
                  )}
                </button>

              {hasAprovado ? (
                <button
                  onClick={() => navigate(`/e/${event.id}`)}
                  className="fs-btn bg-brand-tactical text-brand-text shadow-lg shadow-brand-tactical/20 flex items-center gap-2"
                >
                  Acessar Álbum <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={() => firstPendente && navigate(`/checkout?orderId=${firstPendente.id}`)}
                  className="fs-btn bg-amber-500 text-theme-text shadow-lg shadow-amber-500/20"
                >
                  Desbloquear Agora
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Tag({ label, color = "#444" }: { label: string; color?: string }) {
  return (
    <span style={{ 
      fontSize: 9, 
      padding: "3px 10px", 
      borderRadius: 4, 
      border: `1px solid ${color}`, 
      background: `${color}15`,
      color: color, 
      letterSpacing: 0.5, 
      textTransform: "uppercase",
      fontWeight: 800
    }}>
      {label}
    </span>
  );
}

function PedidoDetalhe({ pedido, loading, onGoToEvent, onChangePrivacy, onToggleVisibility }: {
  pedido: Pedido;
  loading: boolean;
  onGoToEvent: () => void;
  onChangePrivacy: () => void;
  onToggleVisibility: (id: string, showAlbum?: boolean, showVideo?: boolean) => void;
}) {
  const navigate = useNavigate();
  
  return (
    <div className="flex flex-col bg-theme-bg min-h-full overflow-x-hidden">
      {/* Header Visual */}
      <div className="relative h-48 md:h-64 bg-zinc-900 overflow-hidden">
        {pedido.event.coverPhotoUrl ? (
          <>
            <img 
              src={pedido.event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
              alt="" 
              className="w-full h-full object-cover opacity-40 blur-sm scale-110"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/60 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/20 to-transparent" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-8 space-y-2">
          <div className="flex items-center gap-2">
             <div className="h-0.5 w-8 bg-brand-tactical" />
             <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Detalhes da Coleção</p>
          </div>
          <h3 className="text-3xl md:text-4xl font-heading font-black italic tracking-tighter uppercase text-white leading-tight">
            {pedido.event.nomeNoivos}
          </h3>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            {formatDate(pedido.event.dataEvento)} • {pedido.event.city || pedido.event.location}
          </p>
        </div>
      </div>

      <div className="p-8 space-y-12 pb-32">
        {/* Access Status Card */}
        <div className="relative group overflow-hidden border border-theme-border/60 bg-theme-bg-muted/5 p-6">
          <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical" />
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-brand-tactical" />
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Protocolo de Acesso</p>
              </div>
              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border ${pedido.hasPaid ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/50 text-amber-400 bg-amber-500/5'}`}>
                {pedido.hasPaid ? "Acesso Liberado" : "Aguardando Pagamento"}
              </span>
            </div>
            
            {pedido.hasPaid ? (
              <div className="space-y-3">
                <div className="flex items-baseline gap-2">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Válido até:</p>
                  <p className="text-sm font-black text-white italic">{formatDate(pedido.accessExpiresAt)}</p>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  Suas memórias estão protegidas e disponíveis para download. O álbum está configurado como <span className="text-white font-bold">{pedido.accessType === 'PRIVATE' ? 'PRIVADO' : 'PÚBLICO'}</span>.
                </p>
              </div>
            ) : (
              <p className="text-[11px] text-amber-400/80 italic font-medium">
                Conclua o pagamento para desbloquear os arquivos originais e remover marcas d'água.
              </p>
            )}
          </div>
        </div>

        {/* Visibility Controls */}
        {pedido.hasPaid && (
          <div className="space-y-6">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
               <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.3em]">Gestão de Visibilidade</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <VisibilityToggle 
                label="Álbum Digital" 
                active={!!pedido.showAlbum} 
                onClick={() => onToggleVisibility(pedido.id, !pedido.showAlbum)} 
              />
              <VisibilityToggle 
                label="Vídeo & Reels" 
                active={!!pedido.showVideo} 
                onClick={() => onToggleVisibility(pedido.id, undefined, !pedido.showVideo)} 
              />
            </div>
          </div>
        )}

        {/* Media Links */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
             <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.3em]">Arquivos Disponíveis</p>
          </div>
          
          {loading ? (
            <div className="py-20 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest animate-pulse">Sincronizando Arquivos...</p>
            </div>
          ) : pedido.hasPaid ? (
            <div className="grid grid-cols-1 gap-4">
              <MediaActionCard 
                icon={<Image size={20} />}
                title="Galeria Editorial"
                subtitle="Visualização & Download HD"
                url={pedido.event.lightroomUrl}
                disabled={!pedido.event.lightroomUrl}
                emptyText="Fotos em fase de curadoria técnica."
              />
              <MediaActionCard 
                icon={<Play size={20} />}
                title="Vídeo & Reels"
                subtitle="Download via Cloud Drive"
                url={pedido.event.driveUrl}
                disabled={!pedido.event.driveUrl}
                emptyText={(pedido.event.temVideo || pedido.event.temReels) ? "Vídeos em fase de finalização." : "Este pacote não inclui vídeo."}
              />
            </div>
          ) : (
            <div className="p-12 text-center border border-dashed border-theme-border/40 space-y-8 bg-brand-tactical/5">
              <ShoppingBag size={40} className="mx-auto text-brand-tactical opacity-30" />
              <div className="space-y-3">
                <p className="text-xs font-black text-white uppercase tracking-widest italic">Acesso Restrito</p>
                <p className="text-[11px] text-zinc-500 uppercase font-bold tracking-widest leading-relaxed">
                  Liberação imediata após a confirmação do pagamento.
                </p>
              </div>
              <button 
                onClick={() => navigate(`/checkout?orderId=${pedido.id}`)}
                className="w-full py-5 bg-brand-tactical text-black text-xs font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20 italic"
              >
                EFETUAR PAGAMENTO
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="pt-8 border-t border-theme-border/40 grid grid-cols-2 gap-4">
          <button 
            onClick={onGoToEvent} 
            className="group px-6 py-5 border border-theme-border text-[9px] font-black uppercase tracking-[0.3em] text-white hover:border-brand-tactical hover:text-brand-tactical transition-all flex items-center justify-center gap-3 italic"
          >
            VOLTAR AO ÁLBUM <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
          </button>
          <button 
            onClick={onChangePrivacy} 
            disabled={!pedido.hasPaid} 
            className="px-6 py-5 border border-theme-border text-[9px] font-black uppercase tracking-[0.3em] text-white hover:border-red-500 hover:text-red-500 transition-all disabled:opacity-20 disabled:cursor-not-allowed italic"
          >
            PRIVACIDADE
          </button>
        </div>
      </div>
    </div>
  );
}

function VisibilityToggle({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`group relative p-5 border transition-all flex items-center justify-between overflow-hidden ${
        active 
          ? 'border-brand-tactical/40 bg-brand-tactical/5 text-brand-tactical shadow-lg shadow-brand-tactical/5' 
          : 'border-theme-border/40 bg-zinc-900/50 text-zinc-500 grayscale'
      }`}
    >
      {active && <div className="absolute top-0 right-0 w-8 h-8 bg-brand-tactical/10 rotate-45 translate-x-4 -translate-y-4" />}
      <span className="text-[10px] font-black uppercase tracking-widest italic">{label}</span>
      {active ? <CheckCircle2 size={16} strokeWidth={3} /> : <X size={16} strokeWidth={3} className="opacity-40" />}
    </button>
  );
}

function MediaActionCard({ icon, title, subtitle, url, disabled, emptyText }: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  url?: string | null; 
  disabled?: boolean;
  emptyText: string;
}) {
  if (disabled) {
    return (
      <div className="p-6 bg-zinc-900/40 border border-theme-border/30 text-zinc-600 flex items-center gap-5">
        <div className="p-3 bg-zinc-900 border border-theme-border/20 opacity-40">{icon}</div>
        <div>
          <p className="text-[11px] font-black uppercase tracking-widest mb-1 italic">{title}</p>
          <p className="text-[10px] font-bold italic opacity-60">{emptyText}</p>
        </div>
      </div>
    );
  }

  return (
    <a 
      href={url || '#'} 
      target="_blank" 
      rel="noreferrer" 
      className="group relative flex items-center justify-between p-6 bg-theme-bg-muted/10 border border-theme-border/60 hover:border-brand-tactical hover:bg-brand-tactical/5 transition-all duration-500 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-brand-tactical/0 to-brand-tactical/5 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700" />
      <div className="relative z-10 flex items-center gap-5">
        <div className="p-3 bg-brand-tactical/10 text-brand-tactical group-hover:bg-brand-tactical group-hover:text-black transition-all duration-500">
          {icon}
        </div>
        <div>
          <p className="text-[12px] font-black text-white uppercase tracking-widest italic group-hover:text-brand-tactical transition-colors">{title}</p>
          <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-[0.2em]">{subtitle}</p>
        </div>
      </div>
      <ArrowRight size={18} className="relative z-10 text-zinc-700 group-hover:text-brand-tactical group-hover:translate-x-2 transition-all duration-500" />
    </a>
  );
}

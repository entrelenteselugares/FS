import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { T, Card } from "../lib/theme";
import AccessTypeModal from "../components/AccessTypeModal";
import { SideDrawer } from "../components/SideDrawer";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { Image, Clock, ShieldCheck, ArrowRight, AlertTriangle, User, CheckCircle2, X, ShoppingBag, Printer } from "lucide-react";

type ActiveTab = "files" | "profile" | "franquia";

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
  
  const NAV_ITEMS: NavItem[] = [
    { label: "Minhas Memórias", onClick: () => setActiveTab("files"), isActive: activeTab === "files", icon: <Image size={18} /> },
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

        {/* Header */}
        <div className="border-b border-theme-border/60 pb-6 md:pb-10 space-y-2 md:space-y-3">
          <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
            Minhas Memórias
          </h1>
          <div className="flex items-center gap-3">
            <div className="h-1 w-8 md:w-10 bg-brand-tactical" />
            <ShieldCheck size={12} className="text-brand-tactical" />
            <p className="text-[9px] md:text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">{user?.nome || "Área Exclusiva"}</p>
          </div>
        </div>

        {/* KPI Bar */}
        {!loading && pedidos.length > 0 && (
          <div className="grid grid-cols-3 gap-px bg-theme-border/20 border border-theme-border/20">
            {[
              { label: "Total Adquiridos", value: pedidos.length, icon: <Image size={12} /> },
              { label: "Acesso Ativo", value: aprovados.length, icon: <CheckCircle2 size={12} />, highlight: true },
              { label: "Aguardando", value: pendentes.length, icon: <Clock size={12} /> },
            ].map(m => (
              <div key={m.label} className="bg-theme-bg-muted/40 p-4 md:p-6 space-y-2 md:space-y-3 group hover:bg-theme-bg-muted/60 transition-all">
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 ${m.highlight ? 'bg-brand-tactical text-brand-text' : 'bg-theme-border/40 text-theme-muted'}`}>{m.icon}</div>
                  <p className="text-[8px] md:text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">{m.label}</p>
                </div>
                <p className={`text-2xl md:text-3xl font-heading font-black italic tracking-tighter ${m.highlight ? 'text-brand-tactical' : 'text-theme-text'}`}>{m.value}</p>
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
        {/* Thumbnail */}
        <div className="flex flex-col gap-3">
          <div className="relative w-full lg:w-48 aspect-square lg:aspect-[4/5] bg-theme-bg overflow-hidden border border-theme-border/20 shadow-inner">
            {event.coverPhotoUrl ? (
              <img 
                src={event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
                alt="" 
                className={`w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 ${hasAprovado ? 'grayscale-0' : 'grayscale brightness-50'}`} 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-theme-bg-muted/40">
                <Image size={24} className="text-theme-muted/20" />
              </div>
            )}
            
            {isExpiringSoon && (
              <div className="absolute inset-x-0 bottom-0 bg-amber-500 text-theme-text text-[8px] font-black uppercase tracking-widest py-2 text-center">
                {daysLeft} dias restantes
              </div>
            )}

            {!hasAprovado && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                <div className="px-3 py-1 bg-black/60 border border-theme-border text-[8px] font-black text-theme-text uppercase tracking-widest">
                  Acesso Bloqueado
                </div>
              </div>
            )}
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

            {/* Jornada */}
            <div className="p-5 bg-theme-bg/40 border-l-2 border-brand-tactical shadow-lg shadow-black/10 relative overflow-hidden">
               <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest mb-1">Status da Jornada</p>
               <p className="text-[12px] text-theme-text font-medium leading-relaxed">
                  {getStatusMessage(event.dataEvento)}
               </p>
            </div>

            {/* List of Payments/Orders */}
            <div className="space-y-3">
              <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Histórico de Aquisições</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {pedidos.map((p: Pedido) => (
                  <div 
                    key={p.id} 
                    onClick={() => onSelectPedido(p)}
                    className={`flex items-center justify-between p-4 border transition-all cursor-pointer ${
                      p.hasPaid ? 'border-theme-border/40 bg-theme-bg/20' : 'border-amber-500/30 bg-amber-500/5 hover:border-amber-500'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-theme-text uppercase tracking-widest truncate">{p.manualType || "Investimento"}</p>
                      <p className={`text-[8px] font-bold uppercase tracking-widest ${p.hasPaid ? 'text-brand-tactical' : 'text-amber-500'}`}>
                        {p.hasPaid ? "✓ Pago" : "● Pendente"}
                      </p>
                    </div>
                    <p className="text-sm font-black text-theme-text italic ml-4">
                      {formatCurrency(p.amount)}
                    </p>
                  </div>
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
    <div className="flex flex-col bg-theme-bg overflow-hidden">

      <div className="p-8 space-y-10">
        {/* Status Card */}
        {pedido.accessExpiresAt && pedido.hasPaid && (
          <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock size={16} className="text-brand-tactical" />
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Validade do Acesso</p>
              </div>
              <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">
                {pedido.accessType === "PRIVATE" ? "Acesso Privado" : "Álbum Público"}
              </p>
            </div>
            <p className="text-[11px] text-theme-muted leading-relaxed">
              Este álbum expira em {new Date(pedido.accessExpiresAt).toLocaleDateString("pt-BR")}. 
              Certifique-se de realizar o download de todos os arquivos antes desta data.
            </p>
          </div>
        )}

        {/* Visibility Toggles */}
        {pedido.hasPaid && (
          <div className="space-y-4">
            <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Gestão de Visibilidade</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={() => onToggleVisibility(pedido.id, !pedido.showAlbum)}
                className={`p-4 border text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${
                  pedido.showAlbum ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border/40 text-theme-muted grayscale'
                }`}
              >
                <span>Álbum Digital</span>
                {pedido.showAlbum ? <CheckCircle2 size={14} /> : <X size={14} />}
              </button>
              <button 
                onClick={() => onToggleVisibility(pedido.id, undefined, !pedido.showVideo)}
                className={`p-4 border text-[10px] font-black uppercase tracking-widest flex items-center justify-between transition-all ${
                  pedido.showVideo ? 'border-brand-tactical text-brand-tactical bg-brand-tactical/5' : 'border-theme-border/40 text-theme-muted grayscale'
                }`}
              >
                <span>Vídeo & Reels</span>
                {pedido.showVideo ? <CheckCircle2 size={14} /> : <X size={14} />}
              </button>
            </div>
          </div>
        )}

        {/* Content Links */}
        <div className="space-y-6">
          <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Arquivos Disponíveis</p>
          
          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-8 h-8 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
            </div>
          ) : pedido.hasPaid ? (
            <div className="space-y-3">
              {pedido.event.lightroomUrl ? (
                <a href={pedido.event.lightroomUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-theme-bg-muted/20 border border-theme-border hover:border-brand-tactical transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-tactical/10 text-brand-tactical"><Image size={18} /></div>
                    <div>
                      <p className="text-[12px] font-bold text-theme-text uppercase tracking-widest">Galeria Editorial</p>
                      <p className="text-[9px] text-theme-muted uppercase tracking-widest">Visualização em Alta Definição</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-theme-muted group-hover:text-brand-tactical transition-colors" />
                </a>
              ) : (
                <div className="p-6 bg-theme-bg-muted/10 border border-theme-border/20 text-theme-muted italic text-[11px]">
                  Fotos em fase de curadoria e edição final.
                </div>
              )}

              {pedido.event.driveUrl ? (
                <a href={pedido.event.driveUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between p-6 bg-theme-bg-muted/20 border border-theme-border hover:border-brand-tactical transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-brand-tactical/10 text-brand-tactical text-theme-text">🎬</div>
                    <div>
                      <p className="text-[12px] font-bold text-theme-text uppercase tracking-widest">Vídeo & Reels</p>
                      <p className="text-[9px] text-theme-muted uppercase tracking-widest">Download via Google Drive</p>
                    </div>
                  </div>
                  <ArrowRight size={16} className="text-theme-muted group-hover:text-brand-tactical transition-colors" />
                </a>
              ) : (pedido.event.temVideo || pedido.event.temReels) && (
                <div className="p-6 bg-theme-bg-muted/10 border border-theme-border/20 text-theme-muted italic text-[11px]">
                  Vídeos em fase de finalização técnica.
                </div>
              )}
            </div>
          ) : (
            <div className="p-10 text-center border border-dashed border-theme-border/40 space-y-6">
              <p className="text-[11px] text-theme-muted uppercase tracking-[0.2em] leading-relaxed">
                O acesso aos arquivos é liberado imediatamente após a confirmação do pagamento.
              </p>
              <button onClick={() => navigate(`/checkout?orderId=${pedido.id}`)} className="px-10 py-4 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 shadow-lg shadow-brand-tactical/20 transition-all">
                Pagar Agora
              </button>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-10 border-t border-theme-border/40 grid grid-cols-2 gap-4">
          <button onClick={onGoToEvent} className="px-6 py-4 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-text hover:border-brand-tactical transition-all">
            Ir para Álbum
          </button>
          <button 
            onClick={onChangePrivacy} 
            disabled={!pedido.hasPaid} 
            className="px-6 py-4 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-text hover:border-red-400 hover:text-red-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Privacidade
          </button>
        </div>
      </div>
    </div>
  );
}

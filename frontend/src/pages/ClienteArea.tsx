import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { T, Card } from "../lib/theme";
import AccessTypeModal from "../components/AccessTypeModal";
import { SideDrawer } from "../components/SideDrawer";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { ExpressSaleModal, FlashEventModal, type Partner } from "../components/profissional";
import { AmbassadorDashboard } from "../components/AmbassadorDashboard";
import { 
  Users, Play, CheckCircle2, X, ArrowRight, 
  ShoppingBag, ShieldCheck, Clock, Image as ImageIcon,
  Zap, Lock, User, AlertTriangle
} from "lucide-react";

type ActiveTab = "files" | "profile" | "wallet" | "embaixador";

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
  items?: Array<{
    id: string;
    mediaId: string;
    media?: {
      id: string;
      url: string;
      shortId: string;
    };
  }>;
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
  const [network, setNetwork] = useState<Partner[]>([]);
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  }, []);
  
  const NAV_ITEMS: NavItem[] = [
    { label: "Minhas Memórias", onClick: () => setActiveTab("files"), isActive: activeTab === "files", icon: <ImageIcon size={18} /> },
    { label: "Meus Álbuns", onClick: () => navigate("/meus-albuns"), isActive: false, icon: <Lock size={18} /> },
    { label: "Carrinho", onClick: () => setActiveTab("wallet"), isActive: activeTab === "wallet", icon: <ShoppingBag size={18} /> },
    { label: "Programa Embaixador", onClick: () => setActiveTab("embaixador"), isActive: activeTab === "embaixador", icon: <Users size={18} /> },
    { label: "Meus Dados", onClick: () => setActiveTab("profile"), isActive: activeTab === "profile", icon: <User size={18} /> },
  ];

  const PAGE_TITLES: Record<ActiveTab, { title: string; subtitle: string; prefix: string }> = {
    files: { title: "Minhas Memórias", subtitle: "Acesso vitalício às memórias que você adquiriu.", prefix: "Central de Arquivos" },
    wallet: { title: "Carrinho", subtitle: "Créditos de Recompensa e Cashback acumulados.", prefix: "Minha Carteira" },
    embaixador: { title: "Embaixador", subtitle: "Compartilhe e ganhe recompensas exclusivas.", prefix: "Programa de Afiliados" },
    profile: { title: "Meus Dados", subtitle: "Gerencie suas informações e endereços.", prefix: "Configurações" }
  };
  
  // Profile States
  const [profileData, setProfileData] = useState({ 
    nome: "", 
    whatsapp: "",
    cep: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: ""
  });
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

      // Handle section param from BottomNav
      const section = searchParams.get("s");
      if (section === "pedidos" || section === "wallet") {
        setActiveTab("wallet");
      } else if (section === "fotos" || section === "files") {
        setActiveTab("files");
      } else if (section === "menu") {
        setActiveTab("profile");
      }
    });

    if (user) {
      setProfileData({
        nome: user.nome || "",
        whatsapp: user.whatsapp || "",
        cep: user.cep || "",
        endereco: user.endereco || "",
        numero: user.numero || "",
        complemento: user.complemento || "",
        bairro: user.bairro || "",
        cidade: user.cidade || "",
        estado: user.estado || ""
      });

      if (user.franchiseProfile) {
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
          
          <div className="space-y-4 relative z-10">
            <h1 className="text-4xl md:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
              {PAGE_TITLES[activeTab].title}
            </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
                {PAGE_TITLES[activeTab].prefix} • {PAGE_TITLES[activeTab].subtitle}
              </p>
            </div>
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
              { label: "Total Adquiridos", value: pedidos.filter(p => p.hasPaid).length, icon: <ImageIcon size={16} /> },
              { label: "Acesso Ativo", value: aprovados.length, icon: <CheckCircle2 size={16} />, highlight: true },
              { label: "Aguardando", value: pedidos.filter(p => !p.hasPaid).length, icon: <Clock size={16} /> },
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
                    <div className={`p-2 ${m.highlight ? 'bg-brand-tactical text-black' : 'bg-theme-bg-muted text-theme-text-muted'}`}>
                      {m.icon}
                    </div>
                    <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest">{m.label}</p>
                  </div>
                  <p className={`text-3xl md:text-4xl font-heading font-black italic tracking-tighter leading-none ${
                    m.highlight || m.isCash ? 'text-brand-tactical' : 'text-theme-text'
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
              <p className="text-[12px] text-theme-text-muted mb-8 italic font-bold uppercase tracking-widest">
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
                    <ImageIcon size={48} className="mx-auto text-theme-border/30" />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full" style={{ animation: "radarPulse 2s ease-out infinite" }} />
                    <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full" />
                  </div>
                  <div className="relative space-y-3">
                    <p className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tighter">Arquivo em Standby</p>
                    <p className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] max-w-xs mx-auto leading-relaxed italic">Nenhuma memória adquirida ainda. Explore a vitrine ou solicite uma cobertura exclusiva.</p>
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
            <div className="lux-card p-10 max-w-2xl space-y-8 border-l-4 border-l-brand-tactical bg-theme-bg-muted/10">
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tight">Meus Dados</h2>
                <p className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] italic">Gerencie suas informações de contato e entrega</p>
              </div>
              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-theme-muted block italic">E-mail (Não editável)</label>
                  <input type="text" disabled value={user?.email || ""} className="fs-input opacity-60" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-theme-muted block italic">Nome Completo</label>
                    <input type="text" value={profileData.nome} onChange={e => setProfileData(p => ({ ...p, nome: e.target.value }))} className="fs-input" placeholder="Como quer ser chamado" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-theme-muted block italic">WhatsApp</label>
                    <input type="text" value={profileData.whatsapp} onChange={e => setProfileData(p => ({ ...p, whatsapp: e.target.value }))} className="fs-input" placeholder="(00) 00000-0000" />
                  </div>
                </div>

                <div className="pt-4 space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px w-6 bg-brand-tactical" />
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Endereço de Entrega</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">CEP</label>
                      <input type="text" value={profileData.cep} onChange={e => setProfileData(p => ({ ...p, cep: e.target.value }))} className="fs-input" placeholder="00000-000" />
                    </div>
                    <div className="md:col-span-2 space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Endereço (Rua/Av)</label>
                      <input type="text" value={profileData.endereco} onChange={e => setProfileData(p => ({ ...p, endereco: e.target.value }))} className="fs-input" placeholder="Nome da rua" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Número</label>
                      <input type="text" value={profileData.numero} onChange={e => setProfileData(p => ({ ...p, numero: e.target.value }))} className="fs-input" placeholder="123" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Complemento</label>
                      <input type="text" value={profileData.complemento} onChange={e => setProfileData(p => ({ ...p, complemento: e.target.value }))} className="fs-input" placeholder="Apto, Bloco, etc" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Bairro</label>
                      <input type="text" value={profileData.bairro} onChange={e => setProfileData(p => ({ ...p, bairro: e.target.value }))} className="fs-input" placeholder="Nome do bairro" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Cidade</label>
                      <input type="text" value={profileData.cidade} onChange={e => setProfileData(p => ({ ...p, cidade: e.target.value }))} className="fs-input" placeholder="Sua cidade" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted block">Estado (UF)</label>
                      <input type="text" value={profileData.estado} onChange={e => setProfileData(p => ({ ...p, estado: e.target.value }))} className="fs-input" placeholder="SP" maxLength={2} />
                    </div>
                  </div>
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
                    <p className="text-[11px] text-theme-muted">Toda compra no Live Print gera 5% de cashback imediato para você.</p>
                  </div>
                  <button onClick={() => navigate("/")} className="fs-btn bg-brand-tactical text-brand-text w-full flex items-center justify-center gap-3">
                    Explorar Live Print <ArrowRight size={14} />
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
          ) : activeTab === "embaixador" ? (
            <AmbassadorDashboard />
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
                <ImageIcon size={32} className="text-zinc-800" />
              </div>
            )}
            
            {/* Tactical Overlays */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            
            {!hasAprovado && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-theme-bg-muted/80 backdrop-blur-[1px]">
                 <div className="p-3 bg-theme-bg border border-theme-border/20 rounded-full">
                   <Clock size={20} className="text-amber-500 animate-pulse" />
                 </div>
                 <p className="text-[9px] font-black text-theme-text uppercase tracking-[0.3em]">Acesso Bloqueado</p>
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
                 <p className="text-sm md:text-base text-theme-text-muted font-medium leading-relaxed italic">
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
                 <div className="h-px w-6 bg-theme-border/40" />
                 <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-[0.3em]">Histórico de Aquisições</p>
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
                        <p className="text-[10px] font-black text-theme-text uppercase tracking-widest truncate group-hover/order:text-brand-tactical transition-colors">{p.manualType || "Investimento"}</p>
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
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState(pedido.event.nomeNoivos || "");
  const [coverUrl, setCoverUrl] = useState(pedido.event.coverPhotoUrl || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await API.patch(`/cliente/pedidos/${pedido.id}/personalize`, {
        nomeNoivos: nome,
        coverPhotoUrl: coverUrl
      });
      // Update local state by forcing a reload or just mutating local prop
      pedido.event.nomeNoivos = nome;
      pedido.event.coverPhotoUrl = coverUrl;
      setIsEditing(false);
    } catch {
      alert("Erro ao salvar personalização.");
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div className="flex flex-col bg-theme-bg min-h-full">
      {/* Header Visual Compacto */}
      <div className="relative h-32 md:h-40 bg-zinc-900 overflow-hidden group">
        {pedido.event.coverPhotoUrl ? (
          <>
            <img 
              src={pedido.event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
              alt="" 
              className="w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/80 to-transparent" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/20 to-transparent" />
        )}
        
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-1">
          <div className="flex items-center gap-2 mb-1">
             <div className="h-0.5 w-6 bg-brand-tactical" />
             <p className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em]">Meu Álbum</p>
          </div>
          
          {isEditing ? (
            <div className="flex flex-col gap-2 bg-theme-bg/80 backdrop-blur p-4 border border-theme-border rounded-lg">
              <input 
                value={nome} 
                onChange={(e) => setNome(e.target.value)}
                className="bg-transparent text-xl font-heading font-black italic uppercase text-white outline-none border-b border-theme-border/50 focus:border-brand-tactical pb-1"
                placeholder="Nome do Álbum"
              />
              <input 
                value={coverUrl} 
                onChange={(e) => setCoverUrl(e.target.value)}
                className="bg-transparent text-xs text-zinc-400 outline-none border-b border-theme-border/50 focus:border-brand-tactical pb-1"
                placeholder="URL da Capa (Opcional)"
              />
              <div className="flex gap-2 mt-2">
                <button onClick={handleSave} disabled={isSaving} className="px-4 py-1.5 bg-brand-tactical text-black text-[10px] font-black uppercase rounded hover:brightness-110">
                  {isSaving ? "Salvando..." : "Salvar"}
                </button>
                <button onClick={() => setIsEditing(false)} className="px-4 py-1.5 border border-theme-border text-zinc-400 text-[10px] font-black uppercase rounded hover:bg-zinc-800">
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-2xl md:text-3xl font-heading font-black italic tracking-tighter uppercase text-theme-text leading-tight">
                  {pedido.event.nomeNoivos}
                </h3>
                <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mt-1">
                  {formatDate(pedido.event.dataEvento)} • {pedido.event.city || pedido.event.location}
                </p>
              </div>
              <button onClick={() => setIsEditing(true)} className="text-[9px] font-black uppercase tracking-widest border border-theme-border/50 text-zinc-400 px-3 py-1.5 hover:text-brand-tactical hover:border-brand-tactical transition-colors rounded">
                Personalizar
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Status Compacto */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex items-center justify-between p-4 border border-theme-border/60 bg-theme-bg-muted/5">
            <div className="flex items-center gap-3">
              <ShieldCheck size={16} className="text-brand-tactical" />
              <div>
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Acesso</p>
                <p className="text-[11px] text-theme-muted font-bold">
                  {pedido.hasPaid ? (pedido.accessType === 'PRIVATE' ? 'PRIVADO' : 'PÚBLICO') : 'Pendente'}
                </p>
              </div>
            </div>
            <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border ${pedido.hasPaid ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/50 text-amber-400 bg-amber-500/5'}`}>
              {pedido.hasPaid ? "Liberado" : "Pagar Agora"}
            </span>
          </div>

          {pedido.hasPaid && pedido.accessExpiresAt && (
            <div className="flex items-center justify-between p-4 border border-theme-border/60 bg-theme-bg-muted/5 md:w-64">
              <div>
                <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest">Válido Até</p>
                <p className="text-sm font-black text-theme-text italic">{formatDate(pedido.accessExpiresAt)}</p>
              </div>
              <Clock size={16} className="text-theme-muted opacity-50" />
            </div>
          )}
        </div>

        {/* Visibility Controls (Se Pago) */}
        {pedido.hasPaid && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
               <p className="text-[9px] font-black text-theme-text uppercase tracking-[0.3em]">Visibilidade</p>
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <VisibilityToggle 
                  label="Galeria Fotos" 
                  active={!!pedido.showAlbum} 
                  onClick={() => onToggleVisibility(pedido.id, !pedido.showAlbum)} 
                />
              </div>
              <div className="flex-1">
                <VisibilityToggle 
                  label="Vídeos" 
                  active={!!pedido.showVideo} 
                  onClick={() => onToggleVisibility(pedido.id, undefined, !pedido.showVideo)} 
                />
              </div>
            </div>
          </div>
        )}

        {/* Media Links Compactos */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
             <p className="text-[9px] font-black text-theme-text uppercase tracking-[0.3em]">Arquivos</p>
          </div>
          
          {loading ? (
            <div className="py-10 flex flex-col items-center gap-3">
              <div className="w-6 h-6 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
              <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest animate-pulse">Sincronizando...</p>
            </div>
          ) : pedido.hasPaid ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <MediaActionCard 
                icon={<ImageIcon size={16} />}
                title="Galeria Editorial"
                subtitle="Ver & Baixar"
                url={pedido.event.lightroomUrl}
                disabled={!pedido.event.lightroomUrl}
                emptyText="Curadoria em andamento."
              />
              <MediaActionCard 
                icon={<Play size={16} />}
                title="Filmes & Reels"
                subtitle="Download"
                url={pedido.event.driveUrl}
                disabled={!pedido.event.driveUrl}
                emptyText={(pedido.event.temVideo || pedido.event.temReels) ? "Vídeos em finalização." : "Não inclui vídeo."}
              />
            </div>
          ) : (
            <div className="p-6 text-center border border-dashed border-theme-border/40 bg-brand-tactical/5 flex items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <p className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Acesso Restrito</p>
                <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest">Aguardando pagamento</p>
              </div>
              <button 
                onClick={() => navigate(`/checkout?orderId=${pedido.id}`)}
                className="px-6 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all"
              >
                Pagar
              </button>
            </div>
          )}
        </div>

        {/* Bottom Actions Compactos */}
        <div className="pt-6 border-t border-theme-border/20 flex gap-3">
          <button 
            onClick={onGoToEvent} 
            className="flex-1 py-3 border border-theme-border text-[9px] font-black uppercase tracking-[0.2em] text-theme-text hover:border-brand-tactical hover:text-brand-tactical transition-colors"
          >
            Acessar Mural
          </button>
          <button 
            onClick={onChangePrivacy} 
            disabled={!pedido.hasPaid} 
            className="flex-1 py-3 border border-theme-border text-[9px] font-black uppercase tracking-[0.2em] text-theme-text hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Privacidade
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
          : 'border-theme-border/40 bg-theme-bg-muted/30 text-theme-muted grayscale'
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
      <div className="p-6 bg-theme-bg-muted/30 border border-theme-border/30 text-theme-muted flex items-center gap-5">
        <div className="p-3 bg-theme-bg-muted border border-theme-border/20 opacity-40">{icon}</div>
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
          <p className="text-[12px] font-black text-theme-text uppercase tracking-widest italic group-hover:text-brand-tactical transition-colors">{title}</p>
          <p className="text-[9px] text-theme-muted uppercase font-bold tracking-[0.2em]">{subtitle}</p>
        </div>
      </div>
      <ArrowRight size={18} className="relative z-10 text-theme-muted group-hover:text-brand-tactical group-hover:translate-x-2 transition-all duration-500" />
    </a>
  );
}

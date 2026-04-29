import React, { useState, useEffect, useCallback } from "react";

import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { List, Calendar as CalendarIcon, TrendingUp, DollarSign, Award, ChevronLeft, ChevronRight, Settings, MessageCircle, Check, X, ShieldCheck, LayoutDashboard, Briefcase, ArrowRight, MapPin, Clock, Zap, Users, Search } from "lucide-react";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { T } from "../lib/theme";

interface EventItem {
  id: string;
  slug: string;
  nomeNoivos: string;
  dataEvento: string;
  createdAt: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  eventHours: number | null;
  captacaoId: string | null;
  captacaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  edicaoId: string | null;
  edicaoStatus: "PENDING" | "ACCEPTED" | "REJECTED";
  location: string | null;
  _count: { pedidos: number };
}

interface UnitInvite {
  id: string;
  cartorioId: string;
  tipo: string;
  status: string;
  cartorio: {
    razaoSocial: string;
    cidade: string;
  }
}


interface ServiceCatalog {
  id: string;
  name: string;
  description: string | null;
  category: string;
  basePrice: number;
  estimatedMinutes: number;
}

interface ProfessionalService {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price: number;
  catalogId: string | null;
  active: boolean;
  catalog?: ServiceCatalog;
}

interface EquipmentItem {
  name: string;
  value: number;
}

interface ProfileData {
  user: {
    nome: string | null;
    email: string | null;
    whatsapp: string | null;
  };
  pixKey: string | null;
  pixType: string | null;
  services: string[];
  equipment: string | null;
  equipmentList?: EquipmentItem[];
  experienceYears?: number;
  hourlyRate?: number;
  equipmentMultiplier?: number;
  proServices?: ProfessionalService[];
  otherHabilities: string | null;
  stats?: {
    totalEarnings: number;
    monthEarnings: number;
    completedEvents: number;
  };
  payoutHistory?: Array<{
    id: string;
    amount: number;
    status: string;
    orderCount: number;
    payout?: {
      weekStart: string;
    }
  }>;
  cartorioProfissional?: Array<{
    tipo: string;
    cartorio: { razaoSocial: string };
  }>;
}


function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(d));
  } catch {
    return "Data inválida";
  }
}

// Componente de Cronômetro de Entrega
function DeadlineTimer({ event, type }: { event: EventItem; type: "FOTO" | "VIDEO" }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isDelivered = type === "FOTO" ? !!event.lightroomUrl : !!event.driveUrl;
  const targetMinutes = type === "FOTO" ? 30 : 48 * 60; // 30min ou 48h
  
  useEffect(() => {
    if (isDelivered) return;

    const timer = setInterval(() => {
      const start = new Date(event.dataEvento).getTime();
      const target = start + (targetMinutes * 60 * 1000);
      const now = new Date().getTime();
      setTimeLeft(target - now);
    }, 1000);

    return () => clearInterval(timer);
  }, [event.dataEvento, targetMinutes, isDelivered]);

  if (isDelivered) {
    return (
      <div className="flex items-center gap-2 text-brand-tactical text-[10px] font-black uppercase tracking-widest italic">
        <Check size={12} /> {type === "FOTO" ? "FOTOS OK" : "VÍDEO OK"}
      </div>
    );
  }

  const isOverdue = timeLeft < 0;
  const absTime = Math.abs(timeLeft);
  const h = Math.floor(absTime / (1000 * 60 * 60));
  const m = Math.floor((absTime % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((absTime % (1000 * 60)) / 1000);

  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return (
    <div className={`text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${isOverdue ? 'text-red-500' : 'text-amber-500'}`}>
       <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? 'bg-red-500 animate-pulse' : 'bg-amber-500'}`} />
       {type === "FOTO" ? "📸 Foto: " : "🎬 Vídeo: "}
       {isOverdue ? `Atrasado ${timeStr}` : `SLA ${timeStr}`}
    </div>
  );
}

interface Partner {
  id: string;
  nome: string;
  email: string;
  whatsapp: string | null;
}

export default function ProfissionalDashboard() {
  const { user } = useAuth();

  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventItem | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [viewTab, setViewTab] = useState<"lista" | "calendario">("lista");
  const [activeTab, setActiveTab] = useState<"agenda" | "convites" | "financeiro" | "servicos" | "network">("agenda");
  const [catalogServices, setCatalogServices] = useState<ServiceCatalog[]>([]);
  const [savingPrices, setSavingPrices] = useState(false);
  const [unitInvites, setUnitInvites] = useState<UnitInvite[]>([]);
  const [showNewServicesModal, setShowNewServicesModal] = useState(false);
  const [hasCheckedInvites, setHasCheckedInvites] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Venda Expressa State
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [expressStep, setExpressStep] = useState<1 | 2 | 3 | 4>(1);
  const [expressFormData, setExpressFormData] = useState({
    customerName: "",
    customerEmail: "",
    whatsapp: "",
    amount: 30,
    location: "",
    productType: "FOTOS" as "FOTOS" | "REELS" | "SD_CARD" | "ALBUM_IMPRESSO",
    paymentMethod: "MONEY" as "PIX" | "CARD" | "MONEY",
    internalNotes: "",
    editorId: ""
  });
  const [network, setNetwork] = useState<Partner[]>([]);
  const [networkSearch, setNetworkSearch] = useState("");
  const [searchResults, setSearchResults] = useState<Partner[]>([]);

  const handleSearchNetwork = async (q: string) => {
    setNetworkSearch(q);
    if (!q || q.length < 2) { setSearchResults([]); return; }
    try {
      const { data } = await API.get(`profissional/network/search?query=${q}`);
      setSearchResults(data);
    } catch (err) {
      console.error("Erro na busca:", err);
    }
  };

  const toggleFavorite = async (partnerId: string) => {
    try {
      await API.post("profissional/network/toggle", { partnerId });
      fetchNetwork();
      showNotification("Rede de empatia atualizada!", "success");
    } catch {
      showNotification("Erro ao atualizar rede", "error");
    }
  };

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchEvents = useCallback(() => {
    setLoading(true);
    API.get("profissional/events")
      .then((r) => setEvents(r.data))
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  const fetchProfile = useCallback(() => {
    API.get("profissional/me")
      .then((r) => setProfile(r.data))
      .catch((err) => console.error("Erro ao buscar perfil:", err));
  }, []);

  const fetchUnitInvites = useCallback(() => {
    API.get("profissional/unidades/convites")
      .then((r) => setUnitInvites(r.data))
      .catch((err) => console.error("Erro ao buscar convites de unidades:", err));
  }, []);

  const fetchServiceCatalog = useCallback(async () => {
    try {
      const { data } = await API.get("public/configs/services");
      setCatalogServices(data.services || []);
    } catch (err) {
      console.error("Erro ao buscar catálogo global:", err);
    }
  }, []);

  const fetchNetwork = useCallback(() => {
    API.get("profissional/network")
      .then((r) => setNetwork(r.data))
      .catch((err) => console.error("Erro ao buscar rede:", err));
  }, []);

  useEffect(() => {
    fetchEvents();
    fetchProfile();
    fetchUnitInvites();
    fetchServiceCatalog();
    fetchNetwork();
  }, [fetchEvents, fetchProfile, fetchUnitInvites, fetchServiceCatalog, fetchNetwork]);

  const handleRespond = async (eventId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/events/${eventId}/respond`, { status });
      fetchEvents();
    } catch (err) {
      console.error("Erro ao responder convite:", err);
      alert("Erro ao processar resposta.");
    }
  };

  const handleRespondUnit = async (inviteId: string, status: "ACCEPTED" | "REJECTED") => {
    try {
      await API.patch(`profissional/unidades/convites/${inviteId}/respond`, { status });
      fetchUnitInvites();
      fetchProfile();
    } catch (err) {
      console.error("Erro ao responder convite de unidade:", err);
      alert("Erro ao processar resposta da unidade.");
    }
  };

  const handleExpressSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        ...expressFormData,
        method: (expressFormData.productType === 'SD_CARD' || expressFormData.productType === 'ALBUM_IMPRESSO')
          ? 'MONEY'
          : expressFormData.paymentMethod,
        internalNotes: `[${expressFormData.productType}] ${expressFormData.internalNotes}`.trim()
      };
      const { data } = await API.post("marketplace/express-sale", payload);
      
      if (data.isDigital && data.orderId) {
        showNotification("Venda registrada! Abrindo portal de pagamento...");
        setTimeout(() => { 
          window.location.href = `/checkout/${data.orderId}`; 
          setIsExpressModalOpen(false); 
        }, 1500);
        return;
      }
      showNotification("Venda e Operação registradas com sucesso!");
      setIsExpressModalOpen(false);
      fetchEvents();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Erro na venda expressa.";
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSavePricing = async () => {
    if (!profile) return;
    setSavingPrices(true);
    try {
      const { data } = await API.patch("profissional/me", {
        hourlyRate: profile.hourlyRate
      });
      setProfile(data);
      showNotification("Configurações de precificação atualizadas!", "success");
    } catch {
      showNotification("Erro ao atualizar precificação", "error");
    } finally {
      setSavingPrices(false);
    }
  };

  const handleAddService = async (catalogService: ServiceCatalog) => {
    const basePrice = Number(catalogService.basePrice) || 0;
    const hourlyRate = Number(profile?.hourlyRate) || 150;
    const multiplier = Number(profile?.equipmentMultiplier) || 1.0;
    const suggestedPrice = Math.max(basePrice, (hourlyRate * (catalogService.estimatedMinutes / 60)) * multiplier);
    try {
      await API.post("profissional/services", {
        catalogId: catalogService.id,
        name: catalogService.name,
        description: catalogService.description,
        price: suggestedPrice
      });
      fetchProfile();
      showNotification("Serviço adicionado à sua vitrine!", "success");
    } catch {
      showNotification("Erro ao adicionar serviço", "error");
    }
  };

  const handleRemoveService = async (serviceId: string) => {
    if (!confirm("Remover este serviço da sua vitrine?")) return;
    try {
      await API.delete(`/profissional/services/${serviceId}`);
      fetchProfile();
      showNotification("Serviço removido.", "success");
    } catch {
      showNotification("Erro ao remover serviço", "error");
    }
  };

  const handleUpdated = (updated: Partial<EventItem>) => {
    setSelected((prev) => prev ? { ...prev, ...updated } : prev);
    setEvents((prev) => prev.map((e) => (selected && e.id === selected.id ? { ...e, ...updated } : e)));
  };

  const pendingEvents = events.filter(ev => (ev.captacaoId === user?.id && ev.captacaoStatus === "PENDING") || (ev.edicaoId === user?.id && ev.edicaoStatus === "PENDING"));
  const acceptedEvents = events.filter(ev => (ev.captacaoId === user?.id && ev.captacaoStatus === "ACCEPTED") || (ev.edicaoId === user?.id && ev.edicaoStatus === "ACCEPTED"));
  const displayEvents = activeTab === "agenda" ? acceptedEvents : pendingEvents;

  useEffect(() => {
    if (!loading && !hasCheckedInvites) {
      if (pendingEvents.length > 0 || unitInvites.length > 0) {
        setShowNewServicesModal(true);
      }
      setHasCheckedInvites(true);
    }
  }, [loading, pendingEvents.length, unitInvites.length, hasCheckedInvites]);

  const NAV_ITEMS = (active: typeof activeTab, setter: typeof setActiveTab, pendingCount: number): NavItem[] => [
    { label: "Visão Geral", onClick: () => setter("agenda"), isActive: active === "agenda", icon: <LayoutDashboard size={16} /> },
    { label: "Convites Pendentes", onClick: () => setter("convites"), isActive: active === "convites", icon: <MessageCircle size={16} />, badge: pendingCount },
    { label: "Financeiro", onClick: () => setter("financeiro"), isActive: active === "financeiro", icon: <DollarSign size={16} /> },
    { label: "Serviços", onClick: () => setter("servicos"), isActive: active === "servicos", icon: <Briefcase size={16} /> },
    { label: "Minha Rede", onClick: () => setter("network"), isActive: active === "network", icon: <Users size={16} /> },
    { label: "Meu Perfil", onClick: () => setIsProfileOpen(true), isActive: false, icon: <Settings size={16} /> },
  ];

  return (
    <DashboardLayout 
      title="Painel do Profissional" 
      navItems={NAV_ITEMS(activeTab, setActiveTab, pendingEvents.length + unitInvites.length)}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .lux-card { transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); }
        .lux-card:hover { border-color: ${T.brand} !important; transform: translateY(-2px); }
      `}</style>

      {showNewServicesModal && (
        <div className="fixed inset-0 z-[8000] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/90 animate-in fade-in duration-500">
          <div className="w-full max-w-lg bg-[#0c0c0c] border border-white/10 p-10 md:p-16 shadow-[0_0_150px_rgba(133,185,172,0.15)] relative overflow-hidden text-center space-y-10">
            <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
            <div className="flex justify-center">
               <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/30 rounded-full text-brand-tactical animate-bounce">
                 <ShieldCheck size={48} />
               </div>
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-tight">Oportunidades Disponíveis</h2>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">A matriz detectou novos chamados compatíveis com seu perfil</p>
            </div>
            <div className="grid grid-cols-1 gap-4">
              {unitInvites.length > 0 && (
                <div className="bg-brand-tactical/5 p-6 border border-brand-tactical/20 group hover:border-brand-tactical transition-all">
                  <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.2em] mb-2 italic">Expansão de Rede</div>
                  <div className="text-xl font-heading font-black text-theme-text italic leading-none">{unitInvites.length} {unitInvites.length === 1 ? "CONVITE DE UNIDADE" : "CONVITES DE UNIDADE"}</div>
                </div>
              )}
              {pendingEvents.length > 0 && (
                <div className="bg-white/2 p-6 border border-white/5 group hover:border-brand-tactical/40 transition-all">
                  <div className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] mb-2 italic">Chamados de Campo</div>
                  <div className="text-xl font-heading font-black text-theme-text italic leading-none">{pendingEvents.length} {pendingEvents.length === 1 ? "TRABALHO DISPONÍVEL" : "TRABALHOS DISPONÍVEIS"}</div>
                </div>
              )}
            </div>
            <div className="space-y-6 pt-4">
              <button 
                onClick={() => { setShowNewServicesModal(false); setActiveTab(unitInvites.length > 0 ? "convites" : "agenda"); }} 
                className="w-full py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-2xl shadow-brand-tactical/20 transition-all italic flex items-center justify-center gap-3"
              >
                ACESSAR CENTRAL DE CONVITES <ArrowRight size={16} />
              </button>
              <button 
                onClick={() => setShowNewServicesModal(false)} 
                className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] hover:text-brand-tactical transition-colors italic"
              >
                IGNORAR POR ENQUANTO
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 lg:px-12 py-10 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 border-b border-theme-border/60 pb-10">
          <div className="space-y-4">
            <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">
              {activeTab === "agenda" ? "Meu Cockpit" : activeTab === "convites" ? "Central de Convites" : activeTab === "financeiro" ? "Fluxo de Caixa" : activeTab === "network" ? "Rede de Empatia" : "Gestão de Ativos"}
            </h1>
            <div className="flex items-center gap-4">
               <div className="h-1 w-12 bg-brand-tactical" />
               {profile?.cartorioProfissional?.length ? (
                 <div className="flex items-center gap-2">
                   <ShieldCheck size={14} className="text-brand-tactical" />
                   <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Residente: {profile.cartorioProfissional.map(cp => cp.cartorio.razaoSocial).join(", ")}</p>
                 </div>
               ) : null}
            </div>
          </div>
          
          <div className="flex gap-4">
             <button onClick={() => setViewTab("lista")} className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${viewTab === "lista" ? 'bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20' : 'text-theme-muted border-theme-border/60 hover:text-theme-text'}`}><List size={14} /> Lista</button>
             <button onClick={() => setViewTab("calendario")} className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border ${viewTab === "calendario" ? 'bg-brand-tactical text-brand-text border-brand-tactical shadow-lg shadow-brand-tactical/20' : 'text-theme-muted border-theme-border/60 hover:text-theme-text'}`}><CalendarIcon size={14} /> Calendário</button>
          </div>
        </div>

        <div className="relative group">
          <div className="absolute inset-0 bg-brand-tactical/20 blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700" />
          <button onClick={() => { setExpressFormData({ customerName: "", customerEmail: "", whatsapp: "", amount: 30, location: "", productType: "FOTOS", paymentMethod: "MONEY" as const, internalNotes: "", editorId: "" }); setExpressStep(1); setIsExpressModalOpen(true); }} className="relative w-full bg-theme-bg-muted border border-brand-tactical/40 p-8 flex flex-col md:flex-row items-center justify-between gap-8 group hover:border-brand-tactical transition-all overflow-hidden shadow-2xl">
            <div className="flex items-center gap-6">
               <div className="p-5 bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical"><DollarSign size={28} /></div>
               <div className="text-left space-y-1">
                  <div className="text-xl font-heading font-black text-theme-text uppercase tracking-tighter italic">Venda Rápida Foto Segundo</div>
                  <div className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] italic">Registre o recebimento e libere o acesso na hora</div>
               </div>
            </div>
            <div className="flex items-center gap-4 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] group-hover:gap-6 transition-all">INICIAR OPERAÇÃO <ArrowRight size={14} /></div>
            <div className="absolute right-0 top-0 h-full w-32 bg-gradient-to-l from-brand-tactical/5 to-transparent pointer-events-none" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-theme-bg border border-theme-border/60 p-8 space-y-4 group hover:border-brand-tactical/50 transition-all shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Performance de Entrega</span><TrendingUp className="text-brand-tactical opacity-40 group-hover:opacity-100 transition-all" size={16} /></div>
             <div className="flex items-baseline gap-3"><span className="text-4xl font-heading font-black text-theme-text italic leading-none">{profile?.stats?.completedEvents || 0}</span><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Eventos</span></div>
             <div className="w-full h-1 bg-theme-bg-muted mt-4"><div className="h-full bg-brand-tactical/30 w-full animate-pulse" /></div>
          </div>
          <div className="bg-theme-bg border border-theme-border/60 p-8 space-y-4 group hover:border-brand-tactical/50 transition-all shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Acumulado Global</span><DollarSign className="text-brand-tactical opacity-40 group-hover:opacity-100 transition-all" size={16} /></div>
             <div className="flex items-baseline gap-3"><span className="text-4xl font-heading font-black text-brand-tactical italic leading-none">R$ {profile?.stats?.totalEarnings?.toLocaleString() || "0"}</span></div>
             <div className="text-[8px] font-black text-theme-muted uppercase tracking-widest mt-2">Provisionado p/ Repasse</div>
          </div>
          <div className="bg-theme-bg border border-theme-border/60 p-8 space-y-4 group hover:border-brand-tactical/50 transition-all shadow-sm relative overflow-hidden">
             <div className="flex justify-between items-start"><span className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic">Resultado do Mês</span><Award className="text-brand-tactical opacity-40 group-hover:opacity-100 transition-all" size={16} /></div>
             <div className="flex items-baseline gap-3"><span className="text-4xl font-heading font-black text-theme-text italic leading-none">R$ {profile?.stats?.monthEarnings?.toLocaleString() || "0"}</span></div>
             <div className="text-[8px] font-black text-theme-muted uppercase tracking-widest mt-2 flex items-center gap-2"><div className="w-1 h-1 rounded-full bg-green-500" /> Meta de Produção Ativa</div>
          </div>
        </div>

        <div className="bg-theme-bg-muted border-l-4 border-brand-tactical p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="space-y-1">
            <h4 className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Suporte de Campo</h4>
            <p className="text-[10px] text-theme-muted uppercase tracking-widest font-medium">Linha direta com a matriz para dúvidas operacionais ou técnicas.</p>
          </div>
          <a href="https://wa.me/5519984470420" target="_blank" rel="noopener noreferrer" className="w-full md:w-auto px-8 py-4 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-brand-tactical/10"><MessageCircle size={16} /> Falar com Matriz</a>
        </div>

        <div className="space-y-6">
          {activeTab === "financeiro" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-16 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />
                 <div className="relative z-10 space-y-12">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic">Performance Financeira</h3>
                        <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic">Extrato Tático de Repasses e Comissões</p>
                      </div>
                      <div className="bg-brand-tactical/10 px-6 py-3 border border-brand-tactical/20 flex items-center gap-3">
                         <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                         <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest">Ciclo de Repasse Ativo</span>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {profile?.payoutHistory?.map((p) => (
                        <div key={p.id} className="group flex flex-col md:flex-row justify-between md:items-center p-8 bg-theme-bg-muted/50 border border-theme-border/40 hover:border-brand-tactical/40 transition-all gap-8">
                          <div className="flex items-center gap-6">
                             <div className={`p-4 border ${p.status === 'PAID' ? 'bg-brand-tactical/10 border-brand-tactical/30 text-brand-tactical' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}>
                                {p.status === 'PAID' ? <Check size={20} /> : <TrendingUp size={20} />}
                             </div>
                             <div className="space-y-1">
                                <p className="text-base font-black text-theme-text uppercase tracking-tight italic">{p.payout?.weekStart ? formatDate(p.payout.weekStart) : 'REPASSE OPERACIONAL'}</p>
                                <div className="flex items-center gap-3">
                                   <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 border ${p.status === 'PAID' ? 'bg-brand-tactical text-theme-bg border-brand-tactical' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{p.status === 'PAID' ? 'LIQUIDADO' : 'EM PROCESSAMENTO'}</span>
                                   <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">{p.orderCount} VENDAS CONSOLIDADAS</span>
                                </div>
                             </div>
                          </div>
                          <div className="text-left md:text-right border-t md:border-t-0 border-theme-border/40 pt-4 md:pt-0">
                            <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Montante Líquido</p>
                            <p className="text-3xl font-heading font-black text-brand-tactical italic leading-none"><span className="text-sm mr-1 font-sans not-italic">R$</span>{Number(p.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                          </div>
                        </div>
                      ))}
                      {(!profile?.payoutHistory?.length) && <div className="py-24 text-center space-y-6 bg-theme-bg-muted/20 border border-dashed border-theme-border/40"><div className="flex justify-center text-theme-muted opacity-20"><DollarSign size={64} /></div><p className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] italic">Nenhum repasse liquidado</p></div>}
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === "network" && (
            <div className="space-y-12 animate-in fade-in duration-500">
               <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-16 space-y-12">
                  <div className="space-y-4">
                     <h3 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">Rede de Empatia</h3>
                     <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">Conecte-se com outros profissionais para delegar edições e expandir sua operação</p>
                  </div>

                  <div className="relative">
                    <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-tactical"><Search size={20} /></div>
                    <input 
                      type="text" 
                      placeholder="BUSCAR PROFISSIONAL PELO NOME OU E-MAIL..."
                      className="w-full bg-theme-bg-muted border border-theme-border/60 p-8 pl-16 text-[11px] font-black uppercase tracking-[0.2em] text-theme-text outline-none focus:border-brand-tactical transition-all"
                      value={networkSearch}
                      onChange={(e) => handleSearchNetwork(e.target.value)}
                    />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-300">
                      <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic mb-2">Resultados da Busca</p>
                      {searchResults.map(p => (
                        <div key={p.id} className="flex justify-between items-center p-6 bg-brand-tactical/5 border border-brand-tactical/20">
                          <div className="space-y-1">
                            <p className="text-sm font-black text-theme-text uppercase tracking-tight italic">{p.nome}</p>
                            <p className="text-[9px] text-theme-muted uppercase font-bold">{p.email}</p>
                          </div>
                          <button 
                            onClick={() => toggleFavorite(p.id)}
                            className="px-6 py-3 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                          >
                            ADICIONAR À REDE
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="space-y-8 pt-12 border-t border-theme-border/30">
                    <div className="flex items-center gap-4">
                      <div className="h-1 w-12 bg-brand-tactical" />
                      <h4 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tighter">Meus Parceiros Favoritos</h4>
                    </div>

                    {network.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {network.map(p => (
                          <div key={p.id} className="group relative p-8 bg-theme-bg-muted border border-theme-border/40 hover:border-brand-tactical/40 transition-all">
                             <div className="flex justify-between items-start">
                               <div className="space-y-2">
                                 <div className="flex items-center gap-3">
                                   <div className="p-2 bg-brand-tactical/10 text-brand-tactical rounded-full"><Users size={16} /></div>
                                   <p className="text-base font-black text-theme-text uppercase italic tracking-tight">{p.nome}</p>
                                 </div>
                                 <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">{p.email}</p>
                                 {p.whatsapp && (
                                   <p className="text-[10px] text-brand-tactical font-black uppercase tracking-widest flex items-center gap-2 mt-2">
                                     <MessageCircle size={12} /> {p.whatsapp}
                                   </p>
                                 )}
                               </div>
                               <button 
                                 onClick={() => toggleFavorite(p.id)}
                                 className="p-3 text-red-500/40 hover:text-red-500 transition-colors"
                                 title="Remover da Rede"
                               >
                                 <X size={20} />
                               </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-24 text-center space-y-6 bg-theme-bg-muted/10 border border-dashed border-theme-border/30">
                        <div className="flex justify-center text-theme-muted opacity-10"><Users size={64} /></div>
                        <div className="space-y-2">
                          <p className="text-[11px] font-black text-theme-muted uppercase tracking-[0.4em] italic">Sua rede está vazia</p>
                          <p className="text-[9px] text-theme-muted/60 uppercase font-bold tracking-widest">Busque profissionais acima para começar sua rede de empatia</p>
                        </div>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          )}

          {activeTab === "servicos" && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-16 space-y-12">
                 <div className="space-y-2">
                    <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">Matriz de Precificação</h3>
                    <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic">Configuração base para cálculo de orçamentos dinâmicos</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3"><div className="p-2 bg-theme-bg-muted border border-theme-border/60 text-brand-tactical"><Clock size={16} /></div><label className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Valor Hora (R$)</label></div>
                      <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-5 text-xl font-heading font-black text-theme-text italic outline-none focus:border-brand-tactical transition-all" value={profile?.hourlyRate || ""} onChange={(e) => setProfile(p => p ? { ...p, hourlyRate: Number(e.target.value) } : null)} placeholder="0.00" />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center gap-3"><div className="p-2 bg-theme-bg-muted border border-theme-border/60 text-brand-tactical"><Zap size={16} /></div><label className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Multiplicador Técnico</label></div>
                      <div className="w-full bg-theme-bg-muted/50 border border-theme-border/60 p-5 text-xl font-heading font-black text-brand-tactical italic flex justify-between items-center group relative">
                        <span>{profile?.equipmentMultiplier || "1.0"}</span>
                        <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black uppercase text-theme-muted tracking-tighter">Automação Ativa</span>
                        </div>
                      </div>
                      <p className="text-[9px] text-theme-muted uppercase italic font-bold">O multiplicador é calculado com base no seu inventário e experiência. <button onClick={() => setIsProfileOpen(true)} className="text-brand-tactical hover:underline cursor-pointer">GERENCIAR ATIVOS</button></p>
                    </div>
                 </div>
                 <button onClick={handleSavePricing} disabled={savingPrices} className="w-full md:w-auto px-12 py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:brightness-110 disabled:opacity-40 transition-all shadow-xl shadow-brand-tactical/20">{savingPrices ? "SINCRONIZANDO..." : <><Check size={20} /> ATUALIZAR VALOR HORA</>}</button>
              </div>

              <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-16 space-y-10">
                <div className="flex justify-between items-end">
                  <div className="space-y-2">
                    <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">Vitrine de Ativos</h3>
                    <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic">Serviços ativos e disponíveis para contratação</p>
                  </div>
                  <div className="text-right hidden md:block">
                     <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Total em Portfólio</p>
                     <p className="text-xl font-heading font-black text-theme-text italic leading-none">{profile?.proServices?.length || 0}</p>
                  </div>
                </div>
                {profile?.proServices?.length ? (
                  <div className="grid grid-cols-1 gap-6">
                    {profile.proServices.map(svc => (
                      <div key={svc.id} className="group flex flex-col sm:flex-row justify-between items-start sm:items-center p-8 bg-theme-bg-muted/30 border border-theme-border/40 hover:border-brand-tactical/40 transition-all relative overflow-hidden gap-6">
                        <div className="absolute left-0 top-0 h-full w-1 bg-brand-tactical opacity-20 group-hover:opacity-100 transition-all" />
                        <div className="space-y-2">
                          <div className="flex items-center gap-3"><Briefcase size={14} className="text-brand-tactical" /><div className="text-base font-black text-theme-text uppercase italic tracking-tight">{svc.name}</div></div>
                          {svc.description && <div className="text-[9px] text-theme-muted uppercase tracking-[0.2em] italic font-bold max-w-xl">{svc.description}</div>}
                        </div>
                        <div className="flex items-center gap-12">
                          <div className="text-left md:text-right"><p className="text-[8px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Preço Ativo</p><p className="text-2xl font-heading font-black text-theme-text italic leading-none">R$ {Number(svc.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p></div>
                          <button onClick={() => handleRemoveService(svc.id)} className="p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-brand-text transition-all border border-red-500/20"><X size={18} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : <div className="py-12 text-center text-theme-muted uppercase text-[9px] font-black tracking-widest bg-theme-bg-muted/20 border border-dashed border-theme-border/40">Sua vitrine está vazia. Importe itens do catálogo abaixo.</div>}
              </div>

              <div className="bg-theme-bg border border-theme-border/60 p-8 md:p-16 space-y-12">
                <div className="space-y-2"><h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">Catálogo Geral da Rede</h3><p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic">Benchmark de serviços e precificação sugerida por IA</p></div>
                <div className="grid grid-cols-1 gap-6">
                  {catalogServices.map(cat => {
                    const alreadyAdded = profile?.proServices?.some(s => s.catalogId === cat.id);
                    const suggested = Math.max(cat.basePrice, ((profile?.hourlyRate || 150) * (cat.estimatedMinutes / 60)) * (profile?.equipmentMultiplier || 1.0));
                    return (
                      <div key={cat.id} className="flex flex-col md:flex-row justify-between md:items-center p-8 bg-theme-bg-muted border border-theme-border/40 group hover:border-brand-tactical/30 transition-all gap-8 relative overflow-hidden">
                        <div className="space-y-3"><div className="text-base font-black text-theme-text uppercase tracking-tight italic">{cat.name}</div><div className="flex items-center gap-4"><div className="flex items-center gap-2 text-[9px] font-bold text-theme-muted uppercase tracking-widest italic"><Clock size={12} className="text-brand-tactical" /> {cat.estimatedMinutes} MINUTOS</div><div className="w-1 h-1 rounded-full bg-theme-border" /><div className="text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">PREÇO MÍNIMO: R$ {Number(cat.basePrice).toFixed(2)}</div></div></div>
                        <div className="flex items-center justify-between md:justify-end gap-12">
                          <div className="text-left md:text-right space-y-1"><div className="flex items-center md:justify-end gap-2 text-[8px] font-black text-brand-tactical uppercase tracking-widest italic"><TrendingUp size={10} /> Valor Sugerido p/ Você</div><div className="text-3xl font-heading font-black text-brand-tactical italic leading-none"><span className="text-sm mr-1 font-sans not-italic">R$</span>{suggested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></div>
                          {alreadyAdded ? <div className="px-6 py-3 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[10px] font-black uppercase tracking-widest italic flex items-center gap-3"><Check size={18} /> EM VITRINE</div> : <button onClick={() => handleAddService(cat)} className="px-10 py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-lg shadow-brand-tactical/10 italic">IMPORTAR</button>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {(activeTab === "agenda" || activeTab === "convites") && (
            <div className="space-y-8 animate-in fade-in duration-500">
               {viewTab === "lista" ? (
                 <div className="space-y-4">
                   {loading ? <div className="py-24 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.4em]">Sincronizando Dados de Campo...</div> : (displayEvents.length === 0 && unitInvites.length === 0) ? <div className="py-24 text-center bg-theme-bg-muted/20 border border-dashed border-theme-border/40 text-theme-muted text-[10px] font-black uppercase tracking-[0.2em]">Nenhum registro encontrado para esta visualização.</div> : (
                     <>
                        {activeTab === "convites" && unitInvites.map(ui => (
                          <div key={ui.id} className="lux-card bg-theme-bg border border-brand-tactical/60 p-8 md:p-10 relative overflow-hidden mb-6" style={{ background: "linear-gradient(145deg, rgba(133,185,172,0.08) 0%, rgba(10,10,10,1) 100%)" }}>
                            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                              <div className="space-y-4">
                                <div className="flex items-center gap-3"><div className="p-2 bg-brand-tactical text-zinc-950 rounded-sm"><ShieldCheck size={18} /></div><span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Oportunidade de Parceria Fixa</span></div>
                                <div className="space-y-1"><h3 className="text-2xl md:text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{ui.cartorio.razaoSocial}</h3><p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest italic">Base Operacional: {ui.cartorio.cidade} · Modalidade: {ui.tipo}</p></div>
                              </div>
                              <div className="flex gap-4"><button onClick={() => handleRespondUnit(ui.id, "REJECTED")} className="px-8 py-4 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 italic flex items-center gap-2"><X size={16} /> Recusar</button><button onClick={() => handleRespondUnit(ui.id, "ACCEPTED")} className="px-10 py-4 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 italic flex items-center gap-2 shadow-lg shadow-brand-tactical/20"><Check size={18} /> FIRMAR PARCERIA</button></div>
                            </div>
                          </div>
                        ))}
                        {displayEvents.map(ev => (
                          <div key={ev.id} className={`lux-card bg-theme-bg border ${selected?.id === ev.id ? 'border-brand-tactical' : 'border-theme-border/60'} p-6 md:p-8 flex flex-col md:flex-row gap-8 items-center relative overflow-hidden`} onClick={() => activeTab === "agenda" && setSelected(selected?.id === ev.id ? null : ev)}>
                            <div className={`absolute left-0 top-0 h-full w-1 ${ev.captacaoStatus === 'PENDING' ? 'bg-amber-500' : 'bg-brand-tactical'}`} />
                            <div className="min-w-[100px] text-center md:text-left"><div className="text-[9px] font-black text-theme-muted uppercase italic mb-1">DATA</div><div className="text-2xl font-heading font-black text-theme-text italic leading-none uppercase">{new Date(ev.dataEvento).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}</div></div>
                            <div className="flex-grow space-y-2"><div className="flex items-center gap-3"><h3 className="text-xl font-heading font-black text-theme-text uppercase italic">{ev.nomeNoivos}</h3><div className={`px-2 py-0.5 text-[7px] font-black border ${ev.captacaoStatus === 'ACCEPTED' ? 'bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>{ev.captacaoStatus === 'ACCEPTED' ? 'CONFIRMADO' : 'PENDENTE'}</div></div><div className="flex gap-4 text-[9px] text-theme-muted font-bold uppercase"><span className="flex items-center gap-1"><MapPin size={10} /> {ev.location || "Campo"}</span><span className="flex items-center gap-1"><Briefcase size={10} /> {ev.captacaoId === user?.id ? 'CAPTAÇÃO' : 'EDIÇÃO'}</span><DeadlineTimer event={ev} type="FOTO" /></div></div>
                            <div className="flex items-center gap-4">
                              {activeTab === "convites" ? (
                                <div className="flex gap-2"><button onClick={(e) => { e.stopPropagation(); handleRespond(ev.id, "REJECTED"); }} className="p-3 border border-red-500/30 text-red-500 hover:bg-red-500/10"><X size={14} /></button><button onClick={(e) => { e.stopPropagation(); handleRespond(ev.id, "ACCEPTED"); }} className="px-6 py-3 bg-brand-tactical text-brand-text text-[9px] font-black uppercase tracking-widest"><Check size={14} /> ACEITAR</button></div>
                              ) : <ChevronRight size={20} className={`text-theme-muted transition-transform ${selected?.id === ev.id ? 'rotate-90 text-brand-tactical' : ''}`} />}
                            </div>
                          </div>
                        ))}
                     </>
                   )}
                 </div>
               ) : (
                 <CalendarView events={displayEvents} currentMonth={currentMonth} setCurrentMonth={setCurrentMonth} onSelect={(ev) => { if(activeTab === "agenda"){ setSelected(ev); setViewTab("lista"); } }} />
               )}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <div onClick={() => setSelected(null)} className="fixed inset-0 z-[1000] flex items-center justify-center p-6" style={{ background: T.overlay, backdropFilter: "blur(20px)" }}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-theme-bg border border-theme-border/60 shadow-2xl animate-in zoom-in duration-300">
            <EventEditPanel event={selected} onUpdated={handleUpdated} onClose={() => setSelected(null)} />
          </div>
        </div>
      )}

      {isProfileOpen && profile && (
        <ProfileModal profile={profile} onClose={() => setIsProfileOpen(false)} onUpdated={(p) => { setProfile(p); setIsProfileOpen(false); }} />
      )}

      {isExpressModalOpen && (
        <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-theme-bg border border-theme-border shadow-[0_0_100px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col min-h-[680px]">
            {/* Top accent */}
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />

            <div className="p-8 md:p-12 border-b border-theme-border/60 space-y-6 relative z-10">
              <button onClick={() => setIsExpressModalOpen(false)} className="absolute top-8 right-8 text-theme-muted hover:text-brand-tactical transition-all"><X size={28} /></button>
              <div className="space-y-1">
                <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Unidade de Venda Direta</div>
                <h2 className="text-3xl font-heading font-black text-theme-text uppercase italic leading-none">
                  {expressStep === 1 ? "Identificação" : expressStep === 2 ? "Configuração" : expressStep === 3 ? "Logística" : "Finalização"}
                </h2>
              </div>
              
              {/* Progress Steps */}
              <div className="flex gap-3 pt-2">
                {[1, 2, 3, 4].map(step => (
                  <div key={step} className="flex-1 space-y-2">
                    <div className={`h-[2px] transition-all duration-500 ${expressStep >= step ? 'bg-brand-tactical' : 'bg-theme-border/20'}`} />
                    <div className={`text-[7px] font-black uppercase tracking-widest ${expressStep >= step ? 'text-brand-tactical' : 'text-theme-muted/20'}`}>Fase 0{step}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 md:p-12 flex flex-col flex-grow relative z-10">
              {/* FASE 01: DADOS DO CLIENTE */}
              {expressStep === 1 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 flex flex-col h-full">
                  <div className="space-y-8 flex-grow">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">E-mail do Cliente *</label>
                      <input 
                        type="email" 
                        autoFocus 
                        placeholder="cliente@exemplo.com"
                        value={expressFormData.customerEmail} 
                        onChange={e => setExpressFormData(p => ({ ...p, customerEmail: e.target.value }))} 
                        onBlur={async () => {
                          if (!expressFormData.customerEmail || !expressFormData.customerEmail.includes("@")) return;
                          try {
                            const { data } = await API.get(`/public/auth/check?email=${expressFormData.customerEmail}`);
                            if (data.exists) {
                              setExpressFormData(prev => ({
                                ...prev,
                                customerName: data.name || prev.customerName,
                                whatsapp: data.whatsapp || prev.whatsapp || ""
                              }));
                              showNotification(`Cliente ${data.name} identificado.`);
                            }
                          } catch (err) { console.error(err); }
                        }}
                        className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-lg" 
                      />
                    </div>
                    <div className="space-y-8">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Nome Completo</label>
                        <input 
                          type="text" 
                          placeholder="Ex: João Silva"
                          value={expressFormData.customerName} 
                          onChange={e => setExpressFormData(p => ({ ...p, customerName: e.target.value }))} 
                          className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium" 
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">WhatsApp</label>
                        <input 
                          type="tel" 
                          placeholder="(00) 00000-0000"
                          value={expressFormData.whatsapp} 
                          onChange={e => setExpressFormData(p => ({ ...p, whatsapp: e.target.value }))} 
                          className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium" 
                        />
                      </div>
                    </div>
                  </div>
                  <button 
                    disabled={!expressFormData.customerEmail} 
                    onClick={() => setExpressStep(2)} 
                    className="w-full py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 shadow-xl shadow-brand-tactical/20 italic mt-auto"
                  >
                    CONTINUAR OPERAÇÃO
                  </button>
                </div>
              )}

              {/* FASE 02: VALORES E PRODUTOS */}
              {expressStep === 2 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 flex flex-col h-full">
                  <div className="space-y-8 flex-grow">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Valor Nominal (R$)</label>
                      <div className="relative">
                        <input 
                          type="number" 
                          value={expressFormData.amount} 
                          onChange={e => setExpressFormData(p => ({ ...p, amount: Number(e.target.value) }))} 
                          className="w-full bg-theme-bg-muted border border-theme-border p-8 text-brand-tactical font-heading font-black italic text-4xl outline-none" 
                        />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-[12px] font-black text-theme-muted uppercase tracking-widest">BRL</div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Categoria de Ativo</label>
                      <div className="grid grid-cols-1 gap-3">
                        {([
                          { id: "FOTOS", label: "📸 FOTOS (ENTREGA DIGITAL)" },
                          { id: "REELS", label: "🎬 REELS / VÍDEO CURTO" },
                          { id: "SD_CARD", label: "💾 CARTÃO SD (FÍSICO)" },
                          { id: "ALBUM_IMPRESSO", label: "📖 ÁLBUM LUXO IMPRESSO" }
                        ] as const).map(p => (
                          <button 
                            key={p.id}
                            onClick={() => setExpressFormData(prev => ({ ...prev, productType: p.id }))}
                            className={`p-6 text-left text-[10px] font-black uppercase tracking-widest border transition-all ${expressFormData.productType === p.id ? 'bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg' : 'bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40'}`}
                          >
                            {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => setExpressStep(1)} className="flex-1 py-6 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest italic">Voltar</button>
                    <button onClick={() => setExpressStep(3)} className="flex-[2] py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 italic shadow-xl shadow-brand-tactical/20">LOGÍSTICA DE CAMPO</button>
                  </div>
                </div>
              )}

              {/* FASE 03: DELEGAÇÃO E PAGAMENTO */}
              {expressStep === 3 && (
                <div className="space-y-10 animate-in slide-in-from-right-4 flex flex-col h-full">
                  <div className="space-y-8 flex-grow">
                    {(expressFormData.productType === "FOTOS" || expressFormData.productType === "REELS") && (
                      <div className="space-y-4">
                        <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Delegar Edição (Split de 40%)</label>
                        <select 
                          value={expressFormData.editorId} 
                          onChange={e => setExpressFormData(p => ({ ...p, editorId: e.target.value }))} 
                          className="w-full bg-theme-bg-muted border border-brand-tactical/30 p-6 text-theme-text font-black text-[11px] uppercase outline-none focus:border-brand-tactical appearance-none cursor-pointer"
                        >
                          <option value="">EU MESMO (RECEBER 90%)</option>
                          {network.map(p => (
                            <option key={p.id} value={p.id}>{p.nome.toUpperCase()} (PARCEIRO DE REDE)</option>
                          ))}
                        </select>
                        <p className="text-[9px] text-theme-muted italic leading-relaxed">A plataforma automatiza o repasse para o parceiro selecionado assim que a venda for liquidada.</p>
                      </div>
                    )}

                    <div className="space-y-4">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Metodologia de Liquidação</label>
                      <div className="grid grid-cols-1 gap-4">
                        {([
                          { id: "MONEY", label: "💵 DINHEIRO (ABATER COMISSÃO POSTERIOR)" },
                          { id: "PIX", label: "⚡ PIX (RECEBIMENTO INSTANTÂNEO)" },
                          { id: "CARD", label: "💳 CARTÃO (MERCADO PAGO)" }
                        ] as const).map(m => (
                          <button 
                            key={m.id} 
                            onClick={() => setExpressFormData(p => ({ ...p, paymentMethod: m.id }))} 
                            className={`p-6 text-left text-[10px] font-black uppercase tracking-widest border transition-all ${expressFormData.paymentMethod === m.id ? 'bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg' : 'bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40'}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => setExpressStep(2)} className="flex-1 py-6 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest italic">Voltar</button>
                    <button onClick={() => setExpressStep(4)} className="flex-[2] py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 italic shadow-xl shadow-brand-tactical/20">REVISAR DADOS</button>
                  </div>
                </div>
              )}

              {/* FASE 04: REVISÃO FINAL */}
              {expressStep === 4 && (
                <div className="space-y-10 animate-in zoom-in-95 duration-300 flex flex-col h-full">
                  <div className="p-10 bg-brand-tactical/5 border border-brand-tactical/20 space-y-8 flex-grow">
                    <div className="flex justify-between items-center border-b border-brand-tactical/10 pb-6">
                      <span className="text-[11px] font-black text-brand-tactical uppercase tracking-widest italic">Borderô de Transação</span>
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-tactical animate-pulse" />
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Cliente</span><span className="text-[11px] font-black text-theme-text uppercase">{expressFormData.customerEmail}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Produto</span><span className="text-[11px] font-black text-theme-text uppercase italic">{expressFormData.productType}</span></div>
                      <div className="flex justify-between items-center"><span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Metodologia</span><span className="text-[11px] font-black text-brand-tactical uppercase italic">{expressFormData.paymentMethod}</span></div>
                      
                      <div className="pt-8 border-t border-brand-tactical/10">
                        <div className="flex justify-between items-end">
                          <div className="space-y-1">
                            <span className="text-[10px] font-black text-brand-tactical uppercase italic">Total Líquido</span>
                            <p className="text-[9px] text-theme-muted uppercase font-bold tracking-tighter">Após comissão da plataforma</p>
                          </div>
                          <span className="text-4xl font-heading font-black text-brand-tactical italic">R$ {expressFormData.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 mt-auto">
                    <button onClick={() => setExpressStep(3)} className="flex-1 py-6 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest italic">Ajustar</button>
                    <button 
                      onClick={handleExpressSaleSubmit} 
                      disabled={loading} 
                      className="flex-[2] py-6 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 shadow-xl shadow-brand-tactical/20 italic"
                    >
                      {loading ? "PROCESSANDO..." : expressFormData.paymentMethod === 'MONEY' ? "FINALIZAR VENDA" : `GERAR COBRANÇA ${expressFormData.paymentMethod}`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className={`fixed bottom-8 right-8 z-[10000] p-5 border shadow-2xl animate-in slide-in-from-right-4 bg-theme-bg ${notification.type === 'success' ? 'border-brand-tactical/60' : 'border-red-500/60'}`}>
          <div className="flex items-center gap-4"><div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-brand-tactical animate-pulse' : 'bg-red-500'}`} /><span className="text-[10px] font-black text-theme-text uppercase tracking-widest">{notification.message}</span></div>
        </div>
      )}
    </DashboardLayout>
  );
}

function EventEditPanel({ event, onUpdated, onClose }: { event: EventItem; onUpdated: (u: Partial<EventItem>) => void; onClose: () => void; }) {
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, { lightroomUrl: lrUrl || null, driveUrl: drUrl || null });
      onUpdated(data);
      onClose();
    } catch (err) {
      console.error(err);
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
              <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic mb-2">Painel de Entrega Técnica</div>
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic leading-none">{event.nomeNoivos}</h3>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-theme-bg-muted text-theme-muted hover:text-brand-tactical transition-all"><X size={24} /></button>
          </div>

          <div className="space-y-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Matriz Lightroom (Adobe)</label>
                <div className="text-[8px] font-bold text-brand-tactical uppercase tracking-tighter">Sincronização Ativa</div>
              </div>
              <input 
                placeholder="https://adobe.ly/..."
                value={lrUrl} 
                onChange={e => setLrUrl(e.target.value)} 
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-medium" 
              />
            </div>

            <div className="space-y-3">
              <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Repositório Final (Drive/Dropbox)</label>
              <input 
                placeholder="https://drive.google.com/..."
                value={drUrl} 
                onChange={e => setDrUrl(e.target.value)} 
                className="w-full bg-theme-bg-muted border border-theme-border p-5 text-theme-text outline-none focus:border-brand-tactical/50 transition-all text-xs font-medium" 
              />
            </div>
          </div>

          <div className="flex gap-4 pt-4">
             <button onClick={onClose} className="flex-1 py-5 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest hover:text-theme-text transition-all italic">Cancelar</button>
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

function CalendarView({ events, currentMonth, setCurrentMonth, onSelect }: { events: EventItem[], currentMonth: Date, setCurrentMonth: (d: Date) => void, onSelect: (ev: EventItem) => void }) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  const getEventsOnDay = (d: number) => events.filter(ev => { const date = new Date(ev.dataEvento); return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year; });
  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  return (
    <div className="bg-theme-bg border border-theme-border p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="flex items-center justify-between border-b border-theme-border pb-8 relative z-10">
        <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic">{monthNames[month]} {year}</h3>
        <div className="flex gap-3">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="p-3 bg-theme-bg-muted border border-theme-border text-theme-muted hover:text-brand-tactical transition-all"><ChevronLeft size={20} /></button>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="p-3 bg-theme-bg-muted border border-theme-border text-theme-muted hover:text-brand-tactical transition-all"><ChevronRight size={20} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-t border-l border-theme-border relative z-10">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map(d => (
          <div key={d} className="text-center py-5 border-r border-b border-theme-border bg-theme-bg-muted/50 text-[10px] font-black text-theme-muted uppercase italic tracking-widest">{d}</div>
        ))}
        {days.map((d, i) => (
          <div key={i} className={`min-h-[120px] p-3 border-r border-b border-theme-border relative hover:bg-brand-tactical/5 transition-all`}>
            {d && (
              <>
                <span className="text-[11px] font-black text-theme-muted/40">{d}</span>
                <div className="mt-3 space-y-2">
                  {getEventsOnDay(d).map(ev => (
                    <button 
                      key={ev.id} 
                      onClick={() => onSelect(ev)} 
                      className="w-full text-left p-2 bg-brand-tactical text-brand-text text-[8px] font-black uppercase truncate italic shadow-sm hover:brightness-110 transition-all"
                    >
                      {ev.nomeNoivos}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfileModal({ profile, onClose, onUpdated }: { profile: ProfileData; onClose: () => void; onUpdated: (p: ProfileData) => void }) {
  const [formData, setFormData] = useState<ProfileData>({ 
    ...profile,
    equipmentList: Array.isArray(profile.equipmentList) ? profile.equipmentList : [],
    experienceYears: profile.experienceYears || 0
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => { 
    setSaving(true); 
    try { 
      const { data } = await API.patch("profissional/me", formData); 
      onUpdated(data); 
      onClose();
    } catch (err) { 
      console.error(err); 
    } finally { 
      setSaving(false); 
    } 
  };

  const toggleSkill = (skill: string) => { 
    const current = formData.services || []; 
    const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill]; 
    setFormData({ ...formData, services: next }); 
  };

  const addEquipment = () => {
    setFormData(prev => ({
      ...prev,
      equipmentList: [...(prev.equipmentList || []), { name: "", value: 0 }]
    }));
  };

  const updateEquipment = (index: number, field: keyof EquipmentItem, val: string | number) => {
    const newList = [...(formData.equipmentList || [])];
    newList[index] = { ...newList[index], [field]: val };
    setFormData({ ...formData, equipmentList: newList });
  };

  const removeEquipment = (index: number) => {
    setFormData({
      ...formData,
      equipmentList: (formData.equipmentList || []).filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 md:p-8 animate-in fade-in duration-300 backdrop-blur-xl bg-black/40">
      <div className="w-full max-w-5xl max-h-[90vh] bg-theme-bg border border-theme-border flex flex-col relative overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.1)]">
        {/* Header Decore */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical/50 to-transparent" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/5 rounded-full blur-[100px] -mr-32 -mt-32 pointer-events-none" />

        {/* Top Bar */}
        <div className="flex justify-between items-center px-8 md:px-12 py-8 border-b border-theme-border/60 relative z-10">
          <div className="space-y-1">
            <h2 className="text-3xl font-heading font-black text-theme-text uppercase italic tracking-tighter leading-none">Configuração de Perfil</h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] italic font-bold">Gerenciamento de Identidade e Ativos Técnicos</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted text-theme-muted hover:text-brand-tactical transition-all"><X size={32} /></button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-8 md:p-12 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Coluna Esquerda: Dados e Especialidades */}
            <div className="space-y-12">
              <div className="space-y-8">
                <div className="flex items-center gap-4 text-brand-tactical">
                   <div className="w-8 h-[1px] bg-brand-tactical/30" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Credenciais Operacionais</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Nome de Operação</label>
                    <input className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium" value={formData.user?.nome || ""} onChange={e => setFormData({ ...formData, user: { ...formData.user, nome: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Linha Segura (WhatsApp)</label>
                    <input className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium" value={formData.user?.whatsapp || ""} onChange={e => setFormData({ ...formData, user: { ...formData.user, whatsapp: e.target.value } })} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Chave de Liquidação (PIX)</label>
                    <input className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-medium" value={formData.pixKey || ""} onChange={e => setFormData({ ...formData, pixKey: e.target.value })} placeholder="Email, CPF ou Aleatória" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Tempo de Atuação (Anos)</label>
                    <div className="relative">
                      <input type="number" className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text focus:border-brand-tactical/50 outline-none transition-all font-heading font-black italic text-xl" value={formData.experienceYears} onChange={e => setFormData({ ...formData, experienceYears: Number(e.target.value) })} />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-brand-tactical/40 uppercase italic tracking-widest">Anos</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-center gap-4 text-brand-tactical">
                   <div className="w-8 h-[1px] bg-brand-tactical/30" />
                   <span className="text-[11px] font-black uppercase tracking-[0.3em] italic">Matriz de Especialidades</span>
                </div>
                <div className="flex flex-wrap gap-4">
                  {["FOTO", "VÍDEO", "EDIÇÃO"].map(s => {
                    const active = formData.services?.includes(s);
                    return (
                      <button 
                        key={s} 
                        onClick={() => toggleSkill(s)} 
                        className={`flex-1 min-w-[120px] px-6 py-4 text-[10px] font-black border transition-all flex flex-col gap-2 items-center justify-center ${active ? 'bg-brand-tactical border-brand-tactical text-brand-text' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-brand-tactical/30'}`}
                      >
                        <span className="tracking-[0.4em] italic">{s}</span>
                        <div className={`w-4 h-[1px] ${active ? 'bg-brand-text/40' : 'bg-brand-tactical/20'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-4">
                 <label className="text-[9px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Qualificações Complementares</label>
                 <textarea 
                   className="w-full bg-theme-bg-muted border border-theme-border p-6 text-theme-text text-xs min-h-[120px] resize-none focus:border-brand-tactical/40 outline-none transition-all leading-relaxed" 
                   value={formData.otherHabilities || ""} 
                   placeholder="Pilotagem de drone, certificações, color grading avançado..."
                   onChange={e => setFormData({ ...formData, otherHabilities: e.target.value })} 
                 />
              </div>
            </div>

            {/* Coluna Direita: Inventário */}
            <div className="space-y-10">
              <div className="p-8 bg-theme-bg-muted/50 border border-theme-border space-y-8">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <p className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">Inventário Técnico</p>
                    <p className="text-[9px] text-theme-muted uppercase italic opacity-60 font-bold">Ativos usados para cálculo de multiplicador</p>
                  </div>
                  <button onClick={addEquipment} className="px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all italic">+ Inserir Item</button>
                </div>

                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {(formData.equipmentList || []).map((eq, i) => (
                    <div key={i} className="group flex gap-3 animate-in slide-in-from-right-4 duration-300" style={{ animationDelay: `${i * 50}ms` }}>
                      <div className="flex-[3] relative">
                         <input 
                           placeholder="Ex: Sony A7IV Body" 
                           className="w-full bg-theme-bg border border-theme-border p-4 text-[11px] text-theme-text focus:border-brand-tactical/40 outline-none" 
                           value={eq.name} 
                           onChange={e => updateEquipment(i, "name", e.target.value)} 
                         />
                      </div>
                      <div className="flex-[1.5] relative">
                         <input 
                           type="number" 
                           placeholder="Valor" 
                           className="w-full bg-theme-bg border border-theme-border p-4 text-[11px] text-brand-tactical font-black outline-none italic" 
                           value={eq.value} 
                           onChange={e => updateEquipment(i, "value", Number(e.target.value))} 
                         />
                         <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[8px] font-black text-theme-muted/40 uppercase">BRL</div>
                      </div>
                      <button onClick={() => removeEquipment(i)} className="p-4 bg-red-500/5 text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"><X size={16} /></button>
                    </div>
                  ))}
                  {(formData.equipmentList || []).length === 0 && (
                    <div className="py-20 text-center space-y-4 border border-dashed border-theme-border/40">
                       <div className="flex justify-center text-theme-muted/20"><Briefcase size={48} /></div>
                       <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] italic font-black">Nenhum ativo técnico registrado</p>
                    </div>
                  )}
                </div>

                <div className="pt-8 border-t border-theme-border flex justify-between items-center">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] italic">Patrimônio Técnico Estimado</span>
                  <span className="text-xl font-heading font-black text-theme-text italic">R$ {(formData.equipmentList || []).reduce((acc, curr) => acc + (curr.value || 0), 0).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-8 md:p-12 border-t border-theme-border/60 bg-theme-bg flex justify-end gap-6 relative z-10">
          <button onClick={onClose} className="px-8 py-5 text-theme-muted text-[11px] font-black uppercase tracking-[0.3em] hover:text-theme-text transition-all italic">Descartar</button>
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-16 py-5 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 disabled:opacity-40 transition-all shadow-2xl shadow-brand-tactical/20 italic flex items-center gap-4"
          >
            {saving ? "SINCRONIZANDO..." : <><Check size={20} /> EFETIVAR ATUALIZAÇÃO</>}
          </button>
        </div>
      </div>
    </div>
  );
}

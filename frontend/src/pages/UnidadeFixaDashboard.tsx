import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";

import { API } from "../lib/api";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, X, Download, Calendar, DollarSign, Settings, Users2, Camera, Star, ShieldCheck, ArrowRight, Share2, MapPin, Phone, UserCircle, Printer, AlertTriangle } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";

interface UnidadeStats {
  totalEventos: number;
  totalVendas: number;
  repasseEstimado: number;
  eventosMes: number;
  razaoSocial?: string;
  user?: {
    franchiseProfile?: {
      tier: "BRONZE" | "SILVER" | "GOLD" | "DIAMOND";
      approvedSalesVolume: number;
    } | null;
  };
}

interface GlobalService {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

interface ProfissionalTeam {
  id: string;
  userId: string;
  nome: string;
  email: string;
  whatsapp: string | null;
  services: string[];
  cameras: string[];
  vinculo: "FIXO" | "ROTATIVO" | null;
}

interface EventoAgenda {
  id: string;
  slug: string;
  title: string;
  date: string;
  location: string;
  status: string;
  clientName: string;
  clientEmail: string;
  captacao?: { nome?: string; user?: { name?: string; nome?: string } } | null;
  _count?: { orders: number };
}

interface DayConfig {
  open: string;
  close: string;
  closed: boolean;
}

type WorkingHours = Record<string, DayConfig>;

interface PayoutItem {
  id: string;
  amount: number;
  status: string;
  recipientName: string;
  orderCount: number;
  grossRevenue: number;
  splitPct: number;
  paidAt?: string | null;
  pixTxId?: string | null;
  payout: {
    weekStart: string;
    weekEnd: string;
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", year: "numeric",
  }).format(date);
}

function formatDateTime(d: string | null | undefined) {
  if (!d) return "—";
  const date = new Date(d);
  if (isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

type Tab = "agenda" | "financas" | "equipe" | "configuracoes" | "franquia";

export default function UnidadeFixaDashboard() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [tab, setTab] = useState<Tab>((searchParams.get("tab") as Tab) || "agenda");
  const [stats, setStats] = useState<UnidadeStats | null>(null);
  const [eventos, setEventos] = useState<EventoAgenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [repasses, setRepasses] = useState<PayoutItem[]>([]);

  // Landing Page State
  const [lpSlug, setLpSlug] = useState("");
  const [lpAddress, setLpAddress] = useState("");
  const [lpPhone, setLpPhone] = useState("");
  const [lpDescription, setLpDescription] = useState("");
  const [lpCoverUrl, setLpCoverUrl] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [lpFixedDuration, setLpFixedDuration] = useState(2);
  const [lpFixedTime, setLpFixedTime] = useState(false);
  const [lpHideDuration, setLpHideDuration] = useState(false);
  const [workingHours, setWorkingHours] = useState<WorkingHours>({
    mon: { open: "09:00", close: "18:00", closed: false },
    tue: { open: "09:00", close: "18:00", closed: false },
    wed: { open: "09:00", close: "18:00", closed: false },
    thu: { open: "09:00", close: "18:00", closed: false },
    fri: { open: "09:00", close: "18:00", closed: false },
    sat: { open: "09:00", close: "12:00", closed: true },
    sun: { open: "00:00", close: "00:00", closed: true },
   });
   const [disabledServices, setDisabledServices] = useState<string[]>([]);
   const [savingLp, setSavingLp] = useState(false);
  const [savingPix, setSavingPix] = useState(false);
  const [qrModalEvent, setQrModalEvent] = useState<EventoAgenda | null>(null);
  const [copied, setCopied] = useState(false);

  // Custom Prices State
  const [globalServices, setGlobalServices] = useState<GlobalService[]>([]);
  const [localPrices, setLocalPrices] = useState<Record<string, number>>({});
  const [savingPrices, setSavingPrices] = useState(false);

  // Team State
  const [teamData, setTeamData] = useState<ProfissionalTeam[]>([]);
  const [teamChanges, setTeamChanges] = useState<Record<string, "FIXO" | "ROTATIVO" | null>>({});
  const [savingTeam, setSavingTeam] = useState(false);
  const [teamLoaded, setTeamLoaded] = useState(false);



  // Evitar setState loop no useEffect
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    const mpConnected = searchParams.get("mp_connected");
    if (mpConnected) {
      handledRef.current = true;
      setSuccess("Mercado Pago conectado com sucesso! ✅");
    }
  }, [searchParams]);


  const loadLpData = useCallback(async () => {
    try {
      const [{ data: statsData }, { data: servicesData }] = await Promise.all([
        API.get("/unidade-fixa/stats"),
        API.get("/public/configs/services")
      ]);

      if (statsData.cartorio) {
        setLpSlug(statsData.cartorio.slug ?? "");
        setLpAddress(statsData.cartorio.address ?? "");
        setLpPhone(statsData.cartorio.phone ?? "");
        setLpDescription(statsData.cartorio.description ?? "");
        setLpCoverUrl(statsData.cartorio.coverUrl ?? "");
        setLpFixedDuration(statsData.cartorio.fixedDuration || 2);
        setLpFixedTime(statsData.cartorio.fixedTime || false);
         setLpHideDuration(statsData.cartorio.hideDuration || false);
         setDisabledServices(statsData.cartorio.disabledServices || []);
         if (statsData.cartorio.workingHours) setWorkingHours(statsData.cartorio.workingHours);
        setLocalPrices(statsData.cartorio.servicePrices || {});
        setPixKey(statsData.pixKey ?? "");
      }
      setGlobalServices(servicesData.services || []);
    } catch { /* silently ignore - LP data is optional */ }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, eventosRes, repassesRes] = await Promise.all([
        API.get("/unidade-fixa/stats"),
        API.get("/unidade-fixa/events"),
        API.get("/payouts/me")
      ]);
      setStats(statsRes.data);
      setEventos(eventosRes.data.events ?? eventosRes.data);
      setRepasses(repassesRes.data || []);
      await loadLpData();
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        setError("Perfil de unidade não configurado. Entre em contato com o administrador.");
      } else {
        setError("Erro ao carregar dados.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadLpData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (tab === "configuracoes") loadLpData();
  }, [tab, loadLpData]);

  const saveLpProfile = async () => {
    setSavingLp(true);
    try {
      await API.patch("/unidade-fixa/profile", {
        slug: lpSlug,
        address: lpAddress,
        phone: lpPhone,
        description: lpDescription,
        coverUrl: lpCoverUrl,
        fixedDuration: lpFixedDuration,
        fixedTime: lpFixedTime,
        hideDuration: lpHideDuration,
        workingHours
      });
      setSuccess("Página pública atualizada com sucesso! ✨");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar dados da página.");
    } finally {
      setSavingLp(false);
    }
  };

  const savePixKey = async () => {
    setSavingPix(true);
    try {
      await API.patch("/unidade-fixa/profile", { pixKey });
      setSuccess("Chave PIX atualizada com sucesso! 💎");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar chave PIX.");
    } finally {
      setSavingPix(false);
    }
  };

   const saveServicePrices = async () => {
     setSavingPrices(true);
     try {
       await API.patch("/unidade-fixa/profile", { 
         servicePrices: localPrices,
         disabledServices 
       });
       setSuccess("Tabela de preços e catálogo atualizados! 🏷️");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar tabela de preços.");
    } finally {
      setSavingPrices(false);
    }
  };

  const loadTeam = async () => {
    try {
      const { data } = await API.get("/unidade-fixa/team");
      setTeamData(data.profissionais || []);
      setTeamLoaded(true);
    } catch {
      setError("Erro ao carregar equipe.");
    }
  };

  const saveTeam = async () => {
    setSavingTeam(true);
    try {
      const assignments = Object.entries(teamChanges).map(([profissionalId, tipo]) => ({ profissionalId, tipo }));
      await API.put("/unidade-fixa/team", { assignments });
      setSuccess("Configuração de equipe salva com sucesso! 👥");
      setTeamChanges({});
      await loadTeam();
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erro ao salvar configuração de equipe.");
    } finally {
      setSavingTeam(false);
    }
  };

  const getVinculo = (p: ProfissionalTeam): "FIXO" | "ROTATIVO" | null => {
    if (p.id in teamChanges) return teamChanges[p.id];
    return p.vinculo;
  };

  const NAV_ITEMS = (tab: Tab, setTab: (t: Tab) => void): NavItem[] => [
    { label: "Agenda Tática", onClick: () => setTab("agenda"), isActive: tab === "agenda", icon: <Calendar size={18} /> },
    { label: "Fluxo Financeiro", onClick: () => setTab("financas"), isActive: tab === "financas", icon: <DollarSign size={18} />, badge: repasses.filter(r => r.status !== "PAID").length || undefined },
    { label: "Rede Técnica", onClick: () => { setTab("equipe"); if (!teamLoaded) loadTeam(); }, isActive: tab === "equipe", icon: <Users2 size={18} /> },
    { label: "Configuração", onClick: () => setTab("configuracoes"), isActive: tab === "configuracoes", icon: <Settings size={18} /> },
    ...(user?.franchiseProfile ? [
      { label: "Franquia Print", onClick: () => setTab("franquia"), isActive: tab === "franquia", icon: <Printer size={18} /> }
    ] : [])
  ];

  return (
    <DashboardLayout 
      title="Painel de Unidade" 
      navItems={NAV_ITEMS(tab, setTab)}
    >
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4 md:py-8 space-y-6 md:space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

        {/* Alertas Premium */}
        {(error || success) && (
          <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right duration-500">
            {error && (
              <div className="bg-red-500/10 border border-red-500/20 backdrop-blur-md px-8 py-4 flex items-center gap-4 shadow-2xl">
                <X size={18} className="text-red-500" />
                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{error}</p>
                <button onClick={() => setError("")} className="ml-4 opacity-40 hover:opacity-100"><X size={14} /></button>
              </div>
            )}
            {success && (
              <div className="bg-brand-tactical/10 border border-brand-tactical/20 backdrop-blur-md px-8 py-4 flex items-center gap-4 shadow-2xl">
                <Check size={18} className="text-brand-tactical" />
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest">{success}</p>
                <button onClick={() => setSuccess("")} className="ml-4 opacity-40 hover:opacity-100"><X size={14} /></button>
              </div>
            )}
          </div>
        )}

        {/* Header Seção */}
        {/* Tier & Growth Section */}
        {!loading && stats?.user?.franchiseProfile && (
          <div className="bg-theme-bg border-l-4 border-l-brand-tactical border border-theme-border/60 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-10 group overflow-hidden relative">
            <div className="absolute top-0 right-0 p-10 opacity-[0.02] pointer-events-none group-hover:scale-110 transition-transform duration-700">
               <Star size={120} />
            </div>
            
            <div className="flex items-center gap-8 relative z-10">
               <div className="w-20 h-20 md:w-24 md:h-24 bg-theme-bg-muted/40 border-2 border-brand-tactical flex items-center justify-center rotate-45 group-hover:rotate-[135deg] transition-all duration-700">
                  <div className="-rotate-45 group-hover:-rotate-[135deg] transition-all duration-700 text-brand-tactical text-center">
                    <p className="text-[8px] font-black uppercase tracking-widest leading-none mb-1">Nível</p>
                    <Star size={24} fill="currentColor" className="mx-auto" />
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-5xl font-display font-black text-theme-text uppercase tracking-tighter italic">
                      {stats.user.franchiseProfile.tier}
                    </h2>
                    <span className="px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[8px] font-black uppercase tracking-[0.2em] italic">Franqueado Verificado</span>
                  </div>
                  <p className="text-[10px] text-theme-muted uppercase font-bold tracking-[0.4em] italic">Selo de Qualidade & Performance B2B</p>
               </div>
            </div>

            <div className="flex-1 max-w-xl w-full space-y-4 relative z-10">
               <div className="flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Volume de Vendas Aprovadas</p>
                    <p className="text-xl font-heading font-black text-theme-text italic tracking-tight">{stats.user.franchiseProfile.approvedSalesVolume} / {
                      stats.user.franchiseProfile.tier === "BRONZE" ? "50" :
                      stats.user.franchiseProfile.tier === "SILVER" ? "150" :
                      stats.user.franchiseProfile.tier === "GOLD" ? "500" : "MAX"
                    }</p>
                  </div>
                  <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Próximo Nível</p>
               </div>
               <div className="h-1.5 w-full bg-theme-border/30 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-tactical transition-all duration-1000 ease-out" 
                    style={{ width: `${Math.min(100, (stats.user.franchiseProfile.approvedSalesVolume / (
                      stats.user.franchiseProfile.tier === "BRONZE" ? 50 :
                      stats.user.franchiseProfile.tier === "SILVER" ? 150 :
                      stats.user.franchiseProfile.tier === "GOLD" ? 500 : 1000
                    )) * 100)}%` }}
                  />
               </div>
               <p className="text-[8px] text-theme-muted font-bold uppercase tracking-widest text-right">
                 {stats.user.franchiseProfile.tier === "DIAMOND" ? "Tier Máximo Alcançado" : "Mantenha o volume para o próximo upgrade automático"}
               </p>
            </div>
          </div>
        )}

        {/* KPIs Dashboard */}
        {!loading && stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-theme-border/20 border border-theme-border/20 shadow-2xl">
            {[
              { label: "Operações / Mês", value: String(stats.eventosMes ?? 0), icon: <Calendar size={14} /> },
              { label: "Total Histórico", value: String(stats.totalEventos ?? 0), icon: <Camera size={14} /> },
              { label: "Conversões", value: String(stats.totalVendas ?? 0), icon: <Users2 size={14} /> },
              { label: "Crédito Previsto", value: formatCurrency(stats.repasseEstimado ?? 0), icon: <DollarSign size={14} />, highlight: true },
            ].map((m) => (
              <div key={m.label} className="bg-theme-bg-muted/40 p-4 md:p-6 space-y-2 md:space-y-4 group hover:bg-theme-bg-muted/60 transition-all duration-500">
                <div className="flex items-center gap-2 md:gap-3">
                  <div className={`p-1.5 md:p-2 rounded-none ${m.highlight ? 'bg-brand-tactical text-brand-text' : 'bg-theme-border/40 text-theme-muted'}`}>
                    {m.icon}
                  </div>
                  <p className="text-[8px] md:text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">{m.label}</p>
                </div>
                <p className={`text-xl md:text-2xl font-heading font-black italic tracking-tighter ${m.highlight ? 'text-brand-tactical' : 'text-theme-text'}`}>{m.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── AGENDA ── */}
        {tab === "agenda" && (
          <div className="space-y-10">
            {/* Tactical Summary Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-theme-border/20 border border-theme-border/20 shadow-xl overflow-hidden">
               <div className="bg-theme-bg-muted/30 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-brand-tactical/10 flex items-center justify-center text-brand-tactical border border-brand-tactical/20">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Próximas 72h</p>
                    <p className="text-sm font-black text-theme-text uppercase italic">{eventos.filter(e => {
                      const d = new Date(e.date);
                      const now = new Date();
                      const diff = d.getTime() - now.getTime();
                      return diff > 0 && diff < (72 * 60 * 60 * 1000);
                    }).length} Missões</p>
                  </div>
               </div>
               <div className="bg-theme-bg-muted/30 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <Users2 size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Rede Ativa</p>
                    <p className="text-sm font-black text-theme-text uppercase italic">{teamData.length} Agentes</p>
                  </div>
               </div>
               <div className="bg-theme-bg-muted/30 p-6 flex items-center gap-5">
                  <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-500/20">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest">Status de Unidade</p>
                    <p className="text-sm font-black text-theme-text uppercase italic">Operacional</p>
                  </div>
               </div>
            </div>

            <div className="space-y-6">
              {loading ? (
                <div className="p-12 md:p-24 text-center">
                  <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin mx-auto mb-6" />
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.5em]">Sincronizando Vetores...</p>
                </div>
              ) : eventos.length === 0 ? (
                <div className="relative group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/5 to-transparent opacity-50" />
                  <div className="relative p-12 md:p-24 border border-theme-border/40 text-center space-y-8 backdrop-blur-sm">
                    <div className="relative inline-block">
                      <Calendar size={48} className="mx-auto text-theme-border/30" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full animate-ping" />
                      <div className="absolute -top-2 -right-2 w-4 h-4 bg-brand-tactical rounded-full" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-lg font-heading font-black text-theme-text uppercase italic tracking-tighter">Standby Estratégico</p>
                      <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.3em] max-w-xs mx-auto leading-relaxed">
                        Nenhuma operação detectada nos radares desta unidade para o período atual.
                      </p>
                    </div>
                    <button 
                      onClick={() => navigate(lpSlug ? `/p/${lpSlug}` : "/")} 
                      className="inline-flex items-center gap-4 px-8 py-3 bg-theme-bg border border-theme-border text-[9px] font-black uppercase tracking-[0.4em] text-theme-text hover:bg-brand-tactical hover:text-brand-text hover:border-brand-tactical transition-all italic"
                    >
                      Ver Vitrine da Rede <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {eventos.map((ev) => (
                    <div key={ev.id} className="lux-card p-0 overflow-hidden group hover:border-brand-tactical/30 transition-all duration-700">
                      <div className="flex flex-col md:flex-row">
                        {/* Data Column */}
                        <div className="md:w-24 bg-theme-bg-muted/40 p-4 md:p-6 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-theme-border/60 group-hover:bg-brand-tactical/5 transition-colors">
                           <span className="text-[8px] font-black text-brand-tactical uppercase tracking-tighter mb-0.5">{new Date(ev.date).toLocaleDateString('pt-BR', { month: 'long' })}</span>
                           <span className="text-2xl md:text-3xl font-heading font-black text-theme-text italic leading-none">{new Date(ev.date).getDate()}</span>
                           <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mt-1">{new Date(ev.date).getFullYear()}</span>
                        </div>

                        {/* Content Column */}
                        <div className="flex-1 p-4 md:p-6 space-y-3 md:space-y-4">
                           <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 md:gap-6">
                              <div className="space-y-2 md:space-y-3">
                                 <div className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical animate-pulse" />
                                    <h3 className="text-lg md:text-xl font-heading font-black text-theme-text uppercase italic tracking-tight group-hover:text-brand-tactical transition-colors">{ev.title}</h3>
                                 </div>
                                 <div className="flex flex-wrap items-center gap-4 md:gap-6">
                                    <span className="flex items-center gap-2 text-[9px] font-black text-theme-muted uppercase tracking-widest"><MapPin size={10} className="text-brand-tactical" /> {ev.location}</span>
                                    <span className="flex items-center gap-2 text-[9px] font-black text-theme-muted uppercase tracking-widest"><Calendar size={10} className="text-brand-tactical" /> {formatDateTime(ev.date)}</span>
                                 </div>
                              </div>

                              <div className="flex items-center gap-8">
                                 <div className="text-right">
                                    {ev.captacao ? (
                                      <div className="space-y-1">
                                        <p className="text-[8px] font-black text-theme-muted uppercase tracking-[0.2em]">Agente Designado</p>
                                        <p className="text-[11px] font-black text-theme-text uppercase italic">{ev.captacao?.user?.name ?? ev.captacao?.user?.nome ?? ev.captacao?.nome}</p>
                                      </div>
                                    ) : (
                                      <div className="space-y-1">
                                        <p className="text-[8px] font-black text-theme-muted uppercase tracking-[0.2em]">Status de Rede</p>
                                        <p className="text-[11px] font-black text-amber-500 uppercase italic animate-pulse">Aguardando Agente</p>
                                      </div>
                                    )}
                                 </div>
                                 <button 
                                    onClick={() => { setQrModalEvent(ev); setCopied(false); }}
                                    className="p-5 bg-theme-bg border border-theme-border text-theme-text hover:bg-brand-tactical hover:text-brand-text hover:border-brand-tactical transition-all shadow-xl"
                                 >
                                    <QrCode size={20} />
                                 </button>
                              </div>
                           </div>
                           
                           {/* Sub-bar */}
                           <div className="pt-6 border-t border-theme-border/40 flex items-center justify-between">
                              <div className="flex items-center gap-6">
                                 <div className="flex items-center gap-2">
                                    <DollarSign size={12} className="text-brand-tactical" />
                                    <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">{ev._count?.orders ?? 0} Transações</span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                    <ShieldCheck size={12} className="text-blue-400" />
                                    <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Protocolo Ativo</span>
                                 </div>
                              </div>
                              <ArrowRight size={16} className="text-theme-border group-hover:text-brand-tactical group-hover:translate-x-2 transition-all" />
                           </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FINANÇAS ── */}
        {tab === "financas" && (
          <div className="space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Consolidation Info */}
              <div className="lg:col-span-2 lux-card p-6 md:p-8 border-l-4 border-l-brand-tactical bg-gradient-to-br from-brand-tactical/[0.03] to-transparent relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <ShieldCheck size={100} />
                </div>
                <div className="relative z-10 space-y-4 md:space-y-6">
                  <h3 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">Consolidação de Repasses</h3>
                  <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-relaxed max-w-2xl">
                    O fechamento tático da unidade ocorre semanalmente. Créditos são liquidados em <span className="text-brand-tactical">D+7</span> após a consolidação da rede técnica. Todas as sextas-feiras, os saldos aprovados são transferidos para a conta estratégica designada.
                  </p>
                  <div className="flex items-center gap-8 pt-4">
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
                        <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">Janela de Ciclo: Semanal</span>
                     </div>
                     <div className="flex items-center gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
                        <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">Taxa de Rede: 10%</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* PIX Destination Widget */}
              <div className="lux-card p-6 md:p-8 flex flex-col justify-between bg-theme-bg-muted/20 border-dashed border-theme-border/60">
                 <div className="space-y-4">
                    <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em]">Destino da Liquidação</p>
                    <div className="flex items-center gap-4">
                       <div className="p-3 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/20">
                          <DollarSign size={20} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">{pixKey || "NÃO CONFIGURADA"}</p>
                          <p className="text-[8px] font-bold text-theme-muted uppercase">CHAVE PIX ATIVA</p>
                       </div>
                    </div>
                 </div>
                 <button 
                  onClick={() => setTab("configuracoes")}
                  className="w-full mt-8 py-3 text-[9px] font-black uppercase tracking-[0.4em] border border-theme-border hover:border-brand-tactical hover:text-brand-tactical transition-all italic"
                 >
                   Alterar Destino
                 </button>
              </div>
            </div>

            {/* Financial History Table */}
            <div className="lux-card overflow-hidden">
              <div className="p-8 border-b border-theme-border/60 flex flex-col sm:flex-row justify-between items-center bg-theme-bg-muted/10 gap-6">
                <div className="flex items-center gap-4">
                   <div className="h-8 w-1 bg-brand-tactical" />
                   <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.4em] italic">Livro de Liquidações Históricas</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Crédito Acumulado:</span>
                  <div className="px-6 py-2.5 bg-brand-tactical text-brand-text shadow-lg shadow-brand-tactical/20">
                    <p className="text-[11px] font-black uppercase tracking-widest">{formatCurrency(repasses.filter(r => r.status !== "PAID").reduce((acc, r) => acc + r.amount, 0))}</p>
                  </div>
                </div>
              </div>

              {repasses.length === 0 ? (
                <div className="p-12 md:p-32 text-center relative group">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-brand-tactical/[0.02] pointer-events-none" />
                  <DollarSign size={48} className="mx-auto mb-8 text-theme-border/20" />
                  <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.3em] italic max-w-sm mx-auto">Nenhum fluxo financeiro registrado até o momento.</p>
                </div>
              ) : (
                <div className="divide-y divide-theme-border/30">
                  {repasses.map((r) => (
                    <div key={r.id} className="p-8 flex flex-col md:flex-row items-center justify-between group hover:bg-brand-tactical/[0.02] transition-all duration-500">
                      <div className="flex items-center gap-10">
                        <div className="w-12 h-12 bg-theme-bg border border-theme-border flex items-center justify-center text-theme-muted group-hover:border-brand-tactical/40 group-hover:text-brand-tactical transition-all">
                           <DollarSign size={20} />
                        </div>
                        <div className="space-y-2">
                          <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em]">Protocolo Semanal · {formatDate(r.payout.weekStart)} — {formatDate(r.payout.weekEnd)}</p>
                          <div className="flex items-center gap-6">
                            <span className="text-3xl font-heading font-black italic text-theme-text tracking-tighter group-hover:scale-105 transition-transform origin-left">{formatCurrency(r.amount)}</span>
                            <div className="flex items-center gap-3 px-3 py-1 bg-theme-bg border border-theme-border/60">
                               <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest">{r.orderCount} OPERAÇÕES</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-8 mt-6 md:mt-0">
                        <div className="text-right hidden sm:block">
                           {r.paidAt && (
                             <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">Liquidado em {formatDate(r.paidAt)}</p>
                           )}
                           <p className="text-[8px] font-medium text-theme-muted/40 uppercase tracking-tighter">ID: {r.id.slice(-8).toUpperCase()}</p>
                        </div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-6 py-3 border-2 transition-all ${
                          r.status === "PAID" 
                            ? 'bg-brand-tactical/5 border-brand-tactical text-brand-tactical' 
                            : 'bg-amber-500/5 border-amber-500 text-amber-500 animate-pulse'
                        }`}>
                          {r.status === "PAID" ? "LIQUIDADO" : "PENDENTE"}
                        </span>
                        <ArrowRight size={18} className="text-theme-border/40 group-hover:text-brand-tactical group-hover:translate-x-2 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── EQUIPE ── */}
        {tab === "equipe" && (
          <div className="space-y-10">
            {/* Tactical Intro Card */}
            <div className="lux-card p-10 border-l-4 border-l-brand-tactical bg-gradient-to-br from-brand-tactical/[0.03] to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Users2 size={120} />
              </div>
              <div className="relative z-10 space-y-6">
                <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">Escalabilidade da Rede Técnica</h3>
                <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-relaxed max-w-3xl">
                  Otimize sua operação designando profissionais <span className="text-brand-tactical font-black underline decoration-brand-tactical/30 underline-offset-4">FIXOS</span> para prioridade máxima em seus eventos ou integrando o pool <span className="text-blue-400 font-black">ROTATIVO</span> para demandas dinâmicas de rede.
                </p>
                <div className="flex items-center gap-6 pt-2">
                   <div className="px-4 py-2 bg-theme-bg border border-theme-border flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                      <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">{teamData.length} AGENTES IDENTIFICADOS</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {teamData.map(p => {
                const vinculo = getVinculo(p);
                return (
                  <div key={p.id} className={`lux-card p-0 overflow-hidden group transition-all duration-700 hover:border-brand-tactical/30 ${vinculo === "FIXO" ? 'border-brand-tactical/40 ring-1 ring-brand-tactical/10' : ''}`}>
                    <div className="flex flex-col md:flex-row md:items-stretch">
                       {/* Agent Identity Column */}
                       <div className={`md:w-24 flex items-center justify-center border-b md:border-b-0 md:border-r border-theme-border/60 transition-colors ${vinculo === "FIXO" ? 'bg-brand-tactical/5' : 'bg-theme-bg-muted/20'}`}>
                          {vinculo === "FIXO" ? (
                            <Star size={24} className="text-brand-tactical fill-brand-tactical animate-in zoom-in duration-500" />
                          ) : vinculo === "ROTATIVO" ? (
                            <Users2 size={24} className="text-blue-400 opacity-60" />
                          ) : (
                            <UserCircle size={24} className="text-theme-muted/40" />
                          )}
                       </div>

                       {/* Content Column */}
                       <div className="flex-1 p-8 flex flex-col md:flex-row md:items-center justify-between gap-10">
                          <div className="space-y-5">
                             <div className="space-y-1">
                                <div className="flex items-center gap-4">
                                   <h4 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tight group-hover:text-brand-tactical transition-colors">{p.nome}</h4>
                                   {vinculo === "FIXO" && (
                                     <span className="px-3 py-1 bg-brand-tactical text-brand-text text-[8px] font-black uppercase tracking-widest italic">PRIORIDADE</span>
                                   )}
                                </div>
                                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">{p.email}</p>
                             </div>

                             <div className="flex flex-wrap gap-3">
                                {p.services.length > 0 ? p.services.map(s => (
                                  <span key={s} className="px-4 py-1.5 bg-theme-bg border border-theme-border/60 text-[9px] font-black text-theme-text uppercase tracking-widest group-hover:border-brand-tactical/30 transition-colors">
                                    {s}
                                  </span>
                                )) : (
                                  <span className="text-[8px] font-bold text-theme-muted uppercase italic">Perfil em análise técnica</span>
                                )}
                             </div>
                          </div>

                          {/* Tactical Selector */}
                          <div className="flex flex-col gap-3">
                             <p className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em] text-center md:text-right mb-1 opacity-60">Status de Vínculo</p>
                             <div className="flex items-center gap-1 bg-theme-bg-muted/40 p-1.5 border border-theme-border/60 rounded-sm">
                                {([null, "ROTATIVO", "FIXO"] as const).map(tipo => (
                                  <button
                                    key={String(tipo)}
                                    onClick={() => setTeamChanges(prev => ({ ...prev, [p.id]: tipo }))}
                                    className={`px-6 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all duration-500 relative overflow-hidden ${
                                      vinculo === tipo 
                                        ? tipo === "FIXO" ? "bg-brand-tactical text-brand-text shadow-lg shadow-brand-tactical/20" : tipo === "ROTATIVO" ? "bg-blue-500 text-theme-text" : "bg-theme-border text-theme-text"
                                        : "text-theme-muted hover:text-theme-text hover:bg-theme-border/20"
                                    }`}
                                  >
                                    <span className="relative z-10">
                                      {tipo === null ? "Livre" : tipo === "ROTATIVO" ? "Rotativo" : "⭐ Fixo"}
                                    </span>
                                  </button>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {Object.keys(teamChanges).length > 0 && (
              <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
                <div className="bg-theme-bg-muted/90 backdrop-blur-xl border border-brand-tactical p-8 shadow-2xl flex items-center gap-10">
                  <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.3em]">
                    {Object.keys(teamChanges).length} ALTERAÇÃO(ÕES) PENDENTE(S) NO QUADRO TÁTICO
                  </p>
                  <button
                    disabled={savingTeam}
                    onClick={saveTeam}
                    className="bg-brand-tactical text-brand-text px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all italic"
                  >
                    {savingTeam ? "PROCESSANDO..." : "CONFIRMAR ESCALA"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── CONFIGURAÇÕES ── */}
        {tab === "configuracoes" && (
          <div className="space-y-12">
            {/* Header / Intro */}
            <div className="lux-card p-10 border-l-4 border-l-brand-tactical bg-gradient-to-br from-brand-tactical/[0.03] to-transparent relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Settings size={120} />
              </div>
              <div className="relative z-10 space-y-4">
                <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">Diretrizes e Parâmetros</h3>
                <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-relaxed max-w-3xl">
                  Configure os vetores estratégicos da sua unidade, desde a liquidação financeira (PIX) até o catálogo técnico de serviços e presença digital.
                </p>
              </div>
            </div>

            {/* PIX STRATEGIC KEY */}
            <div className="lux-card p-10 bg-theme-bg-muted/10 border-dashed border-theme-border/60">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-theme-text uppercase tracking-[0.5em] italic flex items-center gap-3">
                    <DollarSign size={16} className="text-brand-tactical" />
                    Chave Estratégica (PIX)
                  </h4>
                  <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest max-w-sm">
                    Identificador único para liquidação. Recomenda-se CNPJ para conformidade tributária.
                  </p>
                </div>
                <div className="flex flex-col md:flex-row gap-4 flex-1 max-w-xl">
                  <input 
                    value={pixKey} 
                    onChange={e => setPixKey(e.target.value)} 
                    className="flex-1 bg-theme-bg border border-theme-border p-4 text-xs font-black uppercase tracking-widest text-theme-text focus:border-brand-tactical outline-none transition-all"
                    placeholder="CHAVE-ALEATORIA-OU-CNPJ"
                  />
                  <button
                    disabled={savingPix}
                    onClick={savePixKey}
                    className="bg-brand-tactical text-brand-text px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all italic"
                  >
                    {savingPix ? "PROCESSANDO..." : "VINCULAR CHAVE"}
                  </button>
                </div>
              </div>
            </div>

            {/* PREÇOS LOCAIS - TABELA TÉCNICA */}
            <div className="space-y-10">
              <div className="flex items-center gap-6">
                <h4 className="text-[11px] font-black text-theme-text uppercase tracking-[0.6em] italic whitespace-nowrap">Catálogo Técnico</h4>
                <div className="h-px w-full bg-gradient-to-r from-theme-border/60 to-transparent" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-theme-border/20 border border-theme-border/20 shadow-2xl overflow-hidden">
                {globalServices.map(svc => {
                  const isDisabled = disabledServices.includes(svc.id);
                  return (
                    <div key={svc.id} className={`p-8 flex flex-col justify-between gap-8 group transition-all duration-700 ${isDisabled ? 'bg-theme-bg-muted/10 opacity-50 grayscale' : 'bg-theme-bg-muted/30 hover:bg-theme-bg-muted/50'}`}>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <h5 className="text-base font-heading font-black text-theme-text uppercase italic tracking-tight group-hover:text-brand-tactical transition-colors">
                              {svc.name}
                              {isDisabled && <span className="ml-3 text-[7px] bg-theme-border px-2 py-0.5 rounded text-theme-text-muted not-italic">INATIVO</span>}
                            </h5>
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-[0.3em]">Referência de Rede: {formatCurrency(svc.basePrice)}</span>
                          </div>
                          <button 
                            onClick={() => {
                              if (isDisabled) setDisabledServices(prev => prev.filter(id => id !== svc.id));
                              else setDisabledServices(prev => [...prev, svc.id]);
                            }}
                            className={`p-2 border transition-all ${isDisabled ? 'border-theme-border text-theme-text-muted hover:text-brand-tactical' : 'border-brand-tactical/30 text-brand-tactical hover:bg-brand-tactical/10'}`}
                            title={isDisabled ? "Ativar Serviço" : "Desativar Serviço"}
                          >
                            <Settings size={14} className={isDisabled ? "" : "animate-spin-slow"} />
                          </button>
                        </div>
                        <p className="text-[10px] font-medium text-theme-muted leading-relaxed opacity-60 group-hover:opacity-100 transition-opacity">{svc.description}</p>
                      </div>
                      
                      <div className="relative group/input">
                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-tactical font-black text-lg italic opacity-40 group-focus-within/input:opacity-100 transition-opacity">R$</span>
                        <input 
                          type="number"
                          disabled={isDisabled}
                          value={localPrices[svc.id] || ""} 
                          onChange={e => setLocalPrices({ ...localPrices, [svc.id]: Number(e.target.value) })}
                          className="w-full bg-theme-bg border border-theme-border/60 p-5 pl-14 text-2xl font-heading font-black text-theme-text focus:border-brand-tactical outline-none transition-all italic placeholder:text-theme-muted/10 disabled:opacity-30"
                          placeholder={String(svc.basePrice)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end pt-4">
                <button
                   disabled={savingPrices}
                   onClick={saveServicePrices}
                   className="bg-brand-tactical text-brand-text px-16 py-5 text-[10px] font-black uppercase tracking-[0.5em] hover:brightness-110 transition-all italic shadow-2xl shadow-brand-tactical/30 flex items-center gap-4 group"
                >
                   {savingPrices ? "ATUALIZANDO MATRIZ..." : "CONSOLIDAR TABELA"}
                   <ArrowRight size={16} className="group-hover:translate-x-2 transition-transform" />
                </button>
              </div>
            </div>

            {/* SEO & LANDING - PRESENÇA DIGITAL */}
            <div className="lux-card p-10 space-y-12 bg-theme-bg-muted/10 border-l-4 border-l-theme-text">
               <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b border-theme-border/40 pb-10">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight flex items-center gap-4">
                      <Share2 size={24} className="text-brand-tactical" />
                      Protocolo Digital (Vitrine)
                    </h3>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.3em]">Gestão de Identidade Visual e Regras de Cobertura da Unidade.</p>
                  </div>
                  {lpSlug && (
                    <a href={`/p/${lpSlug}`} target="_blank" rel="noreferrer" className="flex items-center gap-4 text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em] group pb-2 border-b-2 border-transparent hover:border-brand-tactical transition-all">
                      Sincronizar Preview <ArrowRight size={14} className="group-hover:translate-x-2 transition-transform" />
                    </a>
                  )}
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] ml-1 opacity-60">Slug Identificador (URL)</label>
                    <div className="flex items-center gap-2 text-theme-muted/40 font-black text-[10px] mb-1">fotosegundo.com/p/</div>
                    <input value={lpSlug} onChange={e => setLpSlug(e.target.value)} className="w-full bg-transparent border-b border-theme-border/60 py-3 text-sm font-black text-theme-text focus:border-brand-tactical outline-none transition-all" placeholder="UNIDADE-EXEMPLO" />
                  </div>

                  <div className="space-y-3">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] ml-1 opacity-60">Contato de Operação (WhatsApp)</label>
                    <div className="relative group">
                      <Phone size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" />
                      <input value={lpPhone} onChange={e => setLpPhone(e.target.value)} className="w-full bg-transparent border-b border-theme-border/60 py-3 pl-8 text-sm font-black text-theme-text focus:border-brand-tactical outline-none transition-all" placeholder="(00) 00000-0000" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] ml-1 opacity-60">Logradouro Institucional</label>
                    <div className="relative group">
                      <MapPin size={14} className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" />
                      <input value={lpAddress} onChange={e => setLpAddress(e.target.value)} className="w-full bg-transparent border-b border-theme-border/60 py-3 pl-8 text-sm font-black text-theme-text focus:border-brand-tactical outline-none transition-all" placeholder="RUA EXECUTIVA, 100 - CENTRO" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] ml-1 opacity-60">Manifesto / Descrição da Unidade</label>
                    <textarea value={lpDescription} onChange={e => setLpDescription(e.target.value)} rows={3} className="w-full bg-transparent border-b border-theme-border/60 py-3 text-xs font-medium text-theme-text focus:border-brand-tactical outline-none resize-none leading-relaxed" placeholder="Descreva o propósito e a infraestrutura desta unidade..." />
                  </div>

                  {/* Operational Controls Bar */}
                  <div className="md:col-span-2 bg-theme-bg-muted/30 p-8 border border-theme-border/40 space-y-8">
                     <div className="flex flex-col sm:flex-row items-center justify-between gap-8">
                        <div className="space-y-1">
                          <p className="text-[10px] font-black text-theme-text uppercase italic">Parâmetros de Cobertura</p>
                          <p className="text-[8px] font-bold text-theme-muted uppercase tracking-widest">Configuração padrão de tempo e visibilidade do cronômetro.</p>
                        </div>
                        <div className="flex items-center gap-6">
                           <div className="flex items-center gap-4 bg-theme-bg px-5 py-2 border border-theme-border shadow-inner">
                              <input 
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={lpFixedDuration} 
                                onChange={e => setLpFixedDuration(Number(e.target.value))} 
                                className="w-14 bg-transparent text-center text-2xl font-heading font-black text-brand-tactical outline-none"
                              />
                              <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Horas</span>
                           </div>
                           <div className="flex items-center gap-2 p-1 bg-theme-bg border border-theme-border">
                              <button onClick={() => setLpFixedTime(!lpFixedTime)} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest border transition-all ${lpFixedTime ? 'bg-brand-tactical border-brand-tactical text-brand-text' : 'border-transparent text-theme-muted hover:text-brand-text'}`}>Fixo</button>
                              <button onClick={() => setLpHideDuration(!lpHideDuration)} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest border transition-all ${lpHideDuration ? 'bg-brand-tactical border-brand-tactical text-brand-text' : 'border-transparent text-theme-muted hover:text-brand-text'}`}>Ocultar</button>
                           </div>
                        </div>
                     </div>
                  </div>
                  
                  {/* GRADE DE FUNCIONAMENTO */}
                  <div className="md:col-span-2 space-y-10 border-t border-theme-border/60 pt-12">
                     <div className="flex items-center gap-4">
                       <div className="h-8 w-1 bg-brand-tactical" />
                       <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.4em] italic">Grade de Disponibilidade Semanal</p>
                     </div>

                     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                       {Object.entries(workingHours).map(([day, config]: [string, DayConfig]) => {
                         const dayNames: Record<string, string> = { 
                           mon: "Segunda", tue: "Terça", wed: "Quarta", 
                           thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo" 
                         };
                         return (
                           <div key={day} className={`p-6 border transition-all duration-500 ${config.closed ? 'bg-theme-bg-muted/10 border-theme-border/40 opacity-60' : 'bg-theme-bg border-theme-border/60 hover:border-brand-tactical/40 shadow-xl shadow-black/5'}`}>
                              <div className="flex items-center justify-between mb-6">
                                 <span className="text-[10px] font-black text-theme-text uppercase tracking-widest">{dayNames[day]}</span>
                                 <button 
                                   onClick={() => setWorkingHours({...workingHours, [day]: {...config, closed: !config.closed}})}
                                   className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest border transition-all ${config.closed ? 'bg-theme-border text-theme-text' : 'bg-brand-tactical/5 border-brand-tactical text-brand-tactical'}`}
                                 >
                                   {config.closed ? "FECHADO" : "ABERTO"}
                                 </button>
                              </div>
                              
                              {!config.closed && (
                                <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                   <div className="flex items-center justify-between gap-4">
                                      <span className="text-[8px] font-bold text-theme-muted uppercase">Início</span>
                                      <input 
                                        type="time" 
                                        value={config.open} 
                                        onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, open: e.target.value}})}
                                        className="bg-transparent text-xs font-black text-theme-text focus:text-brand-tactical outline-none"
                                      />
                                   </div>
                                   <div className="flex items-center justify-between gap-4">
                                      <span className="text-[8px] font-bold text-theme-muted uppercase">Término</span>
                                      <input 
                                        type="time" 
                                        value={config.close} 
                                        onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, close: e.target.value}})}
                                        className="bg-transparent text-xs font-black text-theme-text focus:text-brand-tactical outline-none"
                                      />
                                   </div>
                                </div>
                              )}
                           </div>
                         );
                       })}
                     </div>
                  </div>
               </div>

                <div className="flex items-center justify-end pt-10">
                   <button
                     disabled={savingLp}
                     onClick={saveLpProfile}
                     className="bg-theme-text text-theme-bg px-14 py-5 text-[10px] font-black uppercase tracking-[0.5em] hover:bg-brand-tactical hover:text-brand-text transition-all italic shadow-xl"
                   >
                     {savingLp ? "SINCRO..." : "PUBLICAR DIRETRIZES DIGITAIS"}
                   </button>
                </div>
             </div>
          </div>
        )}

        {/* ── FRANQUIA ── */}
        {tab === "franquia" && user?.franchiseProfile && (
          <div className="space-y-10 animate-in fade-in duration-500">
            <div className="lux-card p-10 border-l-4 border-l-brand-tactical bg-gradient-to-br from-brand-tactical/[0.03] to-transparent relative overflow-hidden">
               <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                 <Printer size={120} />
               </div>
               <div className="relative z-10 space-y-4">
                 <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">Franquia de Impressão Phygital</h3>
                 <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-relaxed max-w-3xl">
                   Esta unidade está habilitada como ponto oficial de impressão Foto Segundo. Gerencie seus créditos de impressão e status de operação em tempo real.
                 </p>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-theme-border/20 border border-theme-border/20 shadow-2xl">
              <div className="bg-theme-bg-muted/40 p-8 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-brand-tactical/10 text-brand-tactical">
                     <Printer size={16} />
                   </div>
                   <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Saldo de Créditos</p>
                 </div>
                 <p className={`text-5xl font-heading font-black italic tracking-tighter ${user.franchiseProfile.printCredits < 50 ? 'text-amber-500' : 'text-brand-tactical'}`}>
                   {user.franchiseProfile.printCredits}
                 </p>
                 <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">FOTOS DISPONÍVEIS</p>
              </div>

              <div className="bg-theme-bg-muted/40 p-8 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-blue-500/10 text-blue-500">
                     <ShieldCheck size={16} />
                   </div>
                   <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Status da Franquia</p>
                 </div>
                 <p className={`text-xl font-heading font-black italic tracking-tighter uppercase ${user.franchiseProfile.active ? 'text-emerald-500' : 'text-red-500'}`}>
                   {user.franchiseProfile.active ? '● OPERACIONAL' : '● INATIVO'}
                 </p>
                 <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest">VINCULADO À REDE</p>
              </div>

              <div className="bg-theme-bg-muted/40 p-8 space-y-4">
                 <div className="flex items-center gap-3">
                   <div className="p-2 bg-theme-border/40 text-theme-muted">
                     <DollarSign size={16} />
                   </div>
                   <p className="text-[9px] font-black text-theme-muted uppercase tracking-widest">Recarga de Saldo</p>
                 </div>
                 <p className="text-[10px] font-bold text-theme-muted uppercase leading-relaxed tracking-widest">
                   Para adquirir novos créditos de impressão, entre em contato com a central de suporte.
                 </p>
                 <button 
                  onClick={() => window.open("https://wa.me/5519997843817", "_blank")}
                  className="mt-2 text-[9px] font-black text-brand-tactical uppercase tracking-widest hover:underline"
                 >
                   SOLICITAR RECARGA →
                 </button>
              </div>
            </div>

            {user.franchiseProfile.printCredits < 50 && (
              <div className="border border-amber-500/30 bg-amber-500/5 p-8 flex items-center gap-6 shadow-xl">
                 <AlertTriangle size={24} className="text-amber-500" />
                 <div>
                    <p className="text-[11px] font-black text-amber-500 uppercase tracking-widest">ALERTA DE SEGURANÇA: SALDO CRÍTICO</p>
                    <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest mt-1">Seu saldo está abaixo de 50 impressões. A operação pode ser suspensa automaticamente em breve.</p>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal QR Code Premium */}
      {qrModalEvent && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-2xl" onClick={() => setQrModalEvent(null)} />
          
          <div className="relative w-full max-w-[95vw] sm:max-w-lg bg-theme-bg border border-theme-border shadow-2xl animate-in zoom-in-95 duration-500">
            <button 
              onClick={() => setQrModalEvent(null)}
              className="absolute top-6 right-6 text-theme-muted hover:text-theme-text transition-all"
            >
              <X size={24} />
            </button>
            
            <div className="p-6 md:p-10 space-y-6 md:space-y-10 text-center">
              <div className="space-y-4">
                <div className="w-16 h-16 bg-brand-tactical/10 text-brand-tactical flex items-center justify-center mx-auto border border-brand-tactical/20">
                  <QrCode size={32} />
                </div>
                <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">QR Code Tático</h3>
                <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest max-w-xs mx-auto">Imprima para acesso direto via balcão ou compartilhe o protocolo digital.</p>
              </div>

              <div className="bg-white p-4 md:p-8 inline-block shadow-inner max-w-full overflow-hidden">
                <QRCodeSVG 
                  id="qr-code-svg"
                  value={`${window.location.origin}/e/${qrModalEvent.slug || qrModalEvent.id}`}
                  size={window.innerWidth < 400 ? 200 : 240}
                  level="H"
                  includeMargin={true}
                />
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/e/${qrModalEvent.slug}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-theme-bg-muted/50 border border-theme-border text-[10px] font-black uppercase tracking-widest hover:bg-theme-border transition-all italic"
                >
                  {copied ? (
                    <><Check size={16} className="text-brand-tactical" /> Protocolo Copiado</>
                  ) : (
                    <><Copy size={16} /> Copiar Link de Acesso</>
                  )}
                </button>
                <button 
                  onClick={() => {
                    const svg = document.querySelector("#qr-code-svg") as SVGGraphicsElement;
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    canvas.width = 1000;
                    canvas.height = 1000;
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      ctx?.drawImage(img, 0, 0, 1000, 1000);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QR_CODE_${qrModalEvent.title}.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
                  }}
                  className="w-full flex items-center justify-center gap-4 py-4 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all italic"
                >
                  <Download size={16} /> Exportar para Impressão
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

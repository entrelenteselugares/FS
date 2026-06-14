import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { T, Card } from "../lib/theme";
import AccessTypeModal from "../components/AccessTypeModal";
import { SideDrawer } from "../components/SideDrawer";
import { DashboardLayout, type NavItem } from "../components/DashboardLayout";
import { ExpressSaleModal, FlashEventModal, type Partner } from "../components/profissional";
import { AffiliateDashboard } from "../components/AffiliateDashboard";
import { 
 Users, Play, CheckCircle2, ArrowRight, 
 ShoppingBag, ShieldCheck, Clock, Image as ImageIcon,
 Zap, Lock, User, AlertTriangle, Briefcase, Building2, Camera,
 DollarSign, Printer, Settings, Sparkles, LayoutDashboard, MapPin, Wallet
} from "lucide-react";
import { ProfilePhotoUpload } from "../components/ProfilePhotoUpload";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import ProfissionalDashboard, { type ActiveTab as ProfissionalTab } from "./ProfissionalDashboard";
import UnidadeFixaDashboard, { type Tab as UnidadeTab } from "./UnidadeFixaDashboard";

type ActiveTab = 
 | "files" 
 | "profile" 
 | "wallet" 
 | "affiliate"
 | "agenda" 
 | "convites"
 | "financeiro" 
 | "servicos" 

 | "franquia"
 | "equipe" 
 | "configuracoes" 
 | "monitor"
 | "perfil"
 | "portfolio";

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
 type?: string;
 slug?: string | null;
 title: string;
 dataEvento: string;
 eventHours?: number | null;
 description?: string | null;
 location: string;
 city: string | null;
 coverPhotoUrl: string | null;
 coverPosition?: string | null;
 lightroomUrl?: string | null;
 driveUrl?: string | null;
 temFoto: boolean;
 temVideo: boolean;
 temReels: boolean;
 temFotoImpressa: boolean;
 temAlbumImpresso: boolean;
 temFotoEditada: boolean;
 temVideoEditado: boolean;
 };
 showAlbum: boolean;
 showVideo: boolean;
 manualType?: string | null;
 internalNotes?: string | null;
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

function getEventUrl(pedido: Pedido) {
 const event = pedido.event;
 // Vault: slug with 'vault-' prefix
 if (event?.slug && event.slug.startsWith('vault-')) {
  return `/meus-albuns/${event.slug.replace('vault-', '')}`;
 }
 // Vault: explicit type or manualType
 if (pedido.manualType === 'COFRE' || event?.type === 'VAULT') {
  return `/meus-albuns/${event.id}`;
 }
 return `/e/${event?.id}`;
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
 borderRadius: "1rem" 
 } as React.CSSProperties,
};

export default function ClienteArea() {
 const { user, updateMe } = useAuth();
 const navigate = useNavigate();
 const [searchParams, setSearchParams] = useSearchParams();
 const [pedidos, setPedidos] = useState<Pedido[]>([]);
 const [selected, setSelected] = useState<Pedido | null>(null);
 const [loading, setLoading] = useState(true);
 const [loadingDetalhe, setLoadingDetalhe] = useState(false);
 const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
 const activeTab = (searchParams.get("tab") as ActiveTab) || "files";

 const handleTabChange = useCallback((tab: string) => {
    let targetTab = tab as ActiveTab;
    if (tab === "financas") {
      targetTab = "financeiro";
    }

    // REMOVED redirects to /profissional and /unidade-fixa.
    // ClienteArea will now render these dashboards inline using noLayout={true}.

    setSearchParams(prev => {
      prev.set("tab", targetTab);
      // Removemos o set('s', ...) para evitar o loop infinito com o useEffect que escuta e deleta 's'
      return prev;
    }, { replace: true });
  }, [setSearchParams, user, navigate]);
 
 // Franchise States
 const [network, setNetwork] = useState<Partner[]>([]);
 const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
 const [isFlashModalOpen, setIsFlashModalOpen] = useState(false);


 const showNotification = useCallback((message: string, type: "success" | "error" = "success") => {
 if (type === "success") toast.success(message);
 else toast.error(message);
 }, []);
 
 const NAV_ITEMS = useMemo<NavItem[]>(() => {
 const items: NavItem[] = [
  { label: "Histórico de Compras", onClick: () => handleTabChange("files"), isActive: activeTab === "files", icon: <ShoppingBag size={18} /> },
  { label: "Meus Álbuns", onClick: () => navigate("/meus-albuns"), isActive: false, icon: <Lock size={18} /> },
  { label: "Minha Carteira", onClick: () => handleTabChange("wallet"), isActive: activeTab === "wallet", icon: <Wallet size={18} /> },
  { label: "Indique e Ganhe", onClick: () => handleTabChange("affiliate"), isActive: activeTab === "affiliate", icon: <Users size={18} /> },
  { label: "Meus Dados", onClick: () => handleTabChange("profile"), isActive: activeTab === "profile", icon: <User size={18} /> },
 ];

  const isProOrFranchise = (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE" || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";
  const isVerified = (user?.verificationStatus === "APPROVED" || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";

  if (isProOrFranchise && isVerified) {
    const proSubItems: NavItem[] = [
      { label: "Minha Agenda", onClick: () => handleTabChange("agenda"), isActive: activeTab === "agenda" || activeTab === "convites", icon: <Play size={18} /> },
      { label: "Meu Portfólio", onClick: () => handleTabChange("portfolio"), isActive: activeTab === "portfolio", icon: <ImageIcon size={18} /> },
      { label: "Serviços & Preços", onClick: () => handleTabChange("servicos"), isActive: activeTab === "servicos", icon: <Briefcase size={18} /> },
      { label: "Ficha Técnica & Pix", onClick: () => handleTabChange("perfil"), isActive: activeTab === "perfil", icon: <Settings size={18} /> },
      { label: "Vendas & Ganhos", onClick: () => handleTabChange("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={18} /> }
    ];
    
    items.push({
      label: "Painel Profissional",
      icon: <Briefcase size={18} />,
      subItems: proSubItems
    });

    if (user?.role === "FRANCHISEE" || user?.franchiseProfile) {
      const franchiseSubItems: NavItem[] = [];
      if (user?.role === "FRANCHISEE") {
        franchiseSubItems.push({ label: "Gestão de Franquia", onClick: () => navigate("/franquia"), isActive: false, icon: <LayoutDashboard size={18} /> });
      }
      franchiseSubItems.push(
        { label: "Rede Técnica", onClick: () => handleTabChange("equipe"), isActive: activeTab === "equipe", icon: <Users size={18} /> },
        { label: "Franquia Print", onClick: () => handleTabChange("franquia"), isActive: activeTab === "franquia", icon: <Printer size={18} /> }
      );
      
      items.push({
        label: "Gestão de Franquia",
        icon: <Building2 size={18} />,
        subItems: franchiseSubItems
      });
    }
  }

  if ((user?.role === "CARTORIO" || user?.role === "UNIDADE") && user?.verificationStatus === "APPROVED") {
    const unitSubItems: NavItem[] = [
      { label: "Agenda Unidade", onClick: () => handleTabChange("agenda"), isActive: activeTab === "agenda", icon: <Play size={18} /> },
      { label: "Fluxo Financeiro", onClick: () => handleTabChange("financeiro"), isActive: activeTab === "financeiro", icon: <DollarSign size={18} /> },
      { label: "Rede Técnica", onClick: () => handleTabChange("equipe"), isActive: activeTab === "equipe", icon: <Users size={18} /> },
      { label: "Configuração Pública", onClick: () => handleTabChange("configuracoes"), isActive: activeTab === "configuracoes", icon: <Settings size={18} /> }
    ];
    
    if (user?.franchiseProfile) {
      unitSubItems.push(
        { label: "Franquia Print", onClick: () => handleTabChange("franquia"), isActive: activeTab === "franquia", icon: <Printer size={18} /> },
        { label: "Monitor de Fila", onClick: () => handleTabChange("monitor"), isActive: activeTab === "monitor", icon: <Settings size={18} /> }
      );
    }

    items.push({
      label: "Gestão da Unidade",
      icon: <MapPin size={18} />,
      subItems: unitSubItems
    });
  }

  return items;
  }, [user, activeTab, navigate, handleTabChange]);

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

 const handleCepChange = async (val: string) => {
    const cleanCep = val.replace(/\D/g, "").slice(0, 8);
    let formattedCep = cleanCep;
    if (cleanCep.length > 5) {
      formattedCep = `${cleanCep.slice(0, 5)}-${cleanCep.slice(5, 8)}`;
    }
    
    setProfileData(p => ({ ...p, cep: formattedCep }));

    if (cleanCep.length === 8) {
      try {
        let logradouro = "";
        let bairro = "";
        let localidade = "";
        let uf = "";

        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro && data.localidade) {
          logradouro = data.logradouro || "";
          bairro = data.bairro || "";
          localidade = data.localidade || "";
          uf = data.uf || "";
        } else {
          // Fallback para AwesomeAPI caso o ViaCEP não encontre o CEP
          const fallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
          if (fallback.ok) {
            const fData = await fallback.json();
            logradouro = fData.address || "";
            bairro = fData.district || "";
            localidade = fData.city || "";
            uf = fData.state || "";
          }
        }

        if (localidade) {
          setProfileData(p => ({
            ...p,
            endereco: logradouro,
            bairro: bairro,
            cidade: localidade,
            estado: uf,
          }));
        }
      } catch (err) {
        // Se a chamada principal falhar (ex: erro de rede), tenta o fallback diretamente
        try {
          const fallback = await fetch(`https://cep.awesomeapi.com.br/json/${cleanCep}`);
          if (fallback.ok) {
            const fData = await fallback.json();
            setProfileData(p => ({
              ...p,
              endereco: fData.address || "",
              bairro: fData.district || "",
              cidade: fData.city || "",
              estado: fData.state || "",
            }));
          }
        } catch (e2) {
          console.error("Erro ao buscar CEP:", err, e2);
        }
      }
    }
  };

 const [isSaving, setIsSaving] = useState(false);
 const [saveSuccess, setSaveSuccess] = useState(false);
 const [isApplying, setIsApplying] = useState(false);
 const { applyRole } = useAuth();

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


 useEffect(() => {
  // 1. Atualização instantânea da aba (não bloqueia UX)
  const section = searchParams.get("s");
  
  if (section) {
    setSearchParams(prev => {
      const mapped = section === "menu" ? "profile" : section === "pedidos" ? "files" : section === "fotos" ? "files" : section;
      prev.set("tab", mapped);
      prev.delete("s");
      return prev;
    }, { replace: true });
  }

  // 2. Fetch em background de pedidos
 fetchPedidos().then(data => {
 const urlOrderId = searchParams.get("orderId");
 if (urlOrderId) {
 const found = data.find((p: Pedido) => p.id === urlOrderId);
 if (found) handleSelect(found);
 }
 });

 if (user) {
 const parts = (user.address || "").split('|');
 setProfileData({
 nome: user.nome || "",
 whatsapp: user.whatsapp || "",
 cep: parts[0] || "",
 endereco: parts[1] || "",
 numero: parts[2] || "",
 complemento: parts[3] || "",
 bairro: parts[4] || "",
 cidade: parts[5] || "",
 estado: parts[6] || ""
 });

 if (user.franchiseProfile) {
 API.get("profissional/network").then(r => setNetwork(r.data)).catch(() => {});
 }
 }
 }, [searchParams, setSearchParams, handleSelect, fetchPedidos, user]);

 const handleUpdateProfile = async (e: React.FormEvent) => {
 e.preventDefault();
 setIsSaving(true);
 setSaveSuccess(false);
 try {
 await updateMe(profileData);
 setSaveSuccess(true);
 setTimeout(() => setSaveSuccess(false), 3000);
 } catch {
 toast.error("Erro ao salvar perfil.");
 } finally {
 setIsSaving(false);
 }
 };

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

 const isProfessionalTab = ["agenda", "convites", "financeiro", "servicos", "network", "calendar", "franquia", "equipe", "perfil", "portfolio"].includes(activeTab) && 
 (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE") && user?.verificationStatus === "APPROVED";

 const isUnitTab = ["agenda", "financeiro", "equipe", "calendar", "franquia", "configuracoes", "monitor"].includes(activeTab) && 
 (user?.role === "CARTORIO" || user?.role === "UNIDADE") && user?.verificationStatus === "APPROVED";

 return (
 <DashboardLayout title="Minha Conta" navItems={NAV_ITEMS}>
 {isProfessionalTab ? (
 <ProfissionalDashboard 
 noLayout={true} 
 activeTab={activeTab as ProfissionalTab} 
 setActiveTab={handleTabChange as unknown as (tab: ProfissionalTab) => void} 
 />
 ) : isUnitTab ? (
 <UnidadeFixaDashboard 
 noLayout={true} 
 activeTab={(activeTab === "financeiro" ? "financas" : activeTab) as UnidadeTab} 
 setActiveTab={handleTabChange as unknown as (tab: UnidadeTab) => void} 
 />
 ) : (
 <>
 <style>{`
 @keyframes radarPulse { 0%,100% { transform:scale(1); opacity:.6; } 50% { transform:scale(1.4); opacity:0; } }
 @media (max-width: 768px) { .mobile-stack { flex-direction:column !important; align-items:flex-start !important; } }
 `}</style>

 <div className="max-w-[1400px] mx-auto px-2 md:px-6 py-4 md:py-6 space-y-4 md:space-y-8">

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
 <div className="flex items-center gap-4 px-3 md:px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-400">
 <AlertTriangle size={16} />
 <p className="text-[10px] font-bold uppercase tracking-widest">Atenção: {exp.length} álbum(ns) expiram em menos de 7 dias. Faça o download agora.</p>
 </div>
 );
 })()}

 {/* Header Section */}
 <div className="flex flex-col md:flex-row md:items-end justify-end gap-3 mb-3 md:mb-6 animate-in fade-in slide-in-from-top-4 duration-700">
 {user?.nome && (
 <div className="flex items-center gap-2 px-3 py-1.5 bg-brand-tactical/10 rounded-xl border border-brand-tactical/20 self-start md:shrink-0">
 <ShieldCheck size={12} className="text-brand-tactical" />
 <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest">{user.nome}</p>
 </div>
 )}
 </div>

 {/* KPI Bar */}
 {!loading && pedidos.length > 0 && (
 <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 animate-in fade-in slide-in-from-top-4 duration-1000 delay-300">
 {[
 { label: "Total Adquiridos", value: pedidos.filter(p => p.hasPaid).length, icon: <ImageIcon size={16} /> },
 { label: "Acesso Ativo", value: aprovados.length, icon: <CheckCircle2 size={16} />, highlight: true },
 { label: "Aguardando", value: pedidos.filter(p => !p.hasPaid).length, icon: <Clock size={16} /> },
 { label: "Créditos Reward", value: formatCurrency(user?.rewardCredits || 0), icon: <ShoppingBag size={16} />, isCash: true },
 ].map((m, idx) => (
 <div 
 key={m.label} 
 className={`relative overflow-hidden p-3 sm:p-5 md:p-6 border rounded-2xl transition-all duration-500 group backdrop-blur-xl hover:-translate-y-1 ${
 m.highlight ? 'bg-brand-tactical/10 border-brand-tactical/30 shadow-[0_8px_30px_rgba(133,185,172,0.1)]' : 'bg-theme-bg/60 border-white/5 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/10'
 }`}
 style={{ animationDelay: `${idx * 150}ms` }}
 >
 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-12 -translate-y-12" />
 <div className="relative z-10 space-y-3 sm:space-y-4">
 <div className="flex items-center gap-2 sm:gap-3">
 <div className={`p-1.5 sm:p-2 rounded-lg ${m.highlight ? 'bg-brand-tactical text-black shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted text-theme-text-muted border border-white/5'}`}>
 {m.icon}
 </div>
 <p className="text-[10px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">{m.label}</p>
 </div>
 <p className={`text-xl sm:text-3xl md:text-4xl font-heading font-black tracking-tight leading-none ${
 m.highlight || m.isCash ? 'text-brand-tactical drop-shadow-[0_0_15px_rgba(133,185,172,0.3)]' : 'text-theme-text'
 }`}>
 {m.value}
 </p>
 </div>
 </div>
 ))}
 </div>
 )}

 <AnimatePresence mode="wait">
 <motion.div
 key={activeTab}
 initial={{ opacity: 0, x: 10 }}
 animate={{ opacity: 1, x: 0 }}
 exit={{ opacity: 0, x: -10 }}
 transition={{ duration: 0.3 }}
 className="space-y-4 md:space-y-12"
 >
 {activeTab === "wallet" ? (
  <div className="space-y-4 md:space-y-10">
  {/* Wallet Header Section */}
  <div className="grid grid-cols-2 gap-3 md:gap-8">
  <div className="relative overflow-hidden bg-theme-bg border-2 border-theme-border p-3 sm:p-5 md:p-8 rounded-2xl transition-all duration-500 hover:border-brand-tactical hover:shadow-[0_0_20px_rgba(133,185,172,0.3)] hover:border-brand-tactical group">
  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-12 -translate-y-12 pointer-events-none" />
  <div className="relative z-10 space-y-2 sm:space-y-4">
  <label className="text-[10px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-[0.2em] block">Saldo Disponível</label>
  <div className="text-2xl md:text-4xl font-heading font-bold uppercase text-theme-text">
  {formatCurrency(user?.rewardCredits || 0)}
  </div>
  <p className="text-[10px] sm:text-[10px] text-theme-text-muted font-bold leading-normal sm:leading-relaxed uppercase tracking-widest max-w-xs ">
  Use seu saldo para abater em novos pedidos, impressões ou upgrades Phygital.
  </p>
  </div>
  </div>
  <div className="relative overflow-hidden bg-theme-bg border-2 border-theme-border p-3 sm:p-5 md:p-8 rounded-2xl transition-all duration-500 hover:border-brand-tactical hover:shadow-[0_0_20px_rgba(133,185,172,0.3)] hover:border-brand-tactical flex flex-col justify-between gap-3 sm:gap-6 group">
  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-12 -translate-y-12 pointer-events-none" />
  <div className="relative z-10 space-y-2 sm:space-y-4">
  <p className="text-[10px] sm:text-[10px] font-bold text-theme-text uppercase tracking-widest flex items-center gap-1.5 sm:gap-2">
  <Zap size={10} className="text-brand-tactical animate-pulse sm:w-3 sm:h-3" /> Como ganhar mais?
  </p>
  <p className="text-[10px] sm:text-[10px] text-theme-text-muted font-bold leading-relaxed uppercase tracking-widest max-w-[280px]">
  Indique amigos e ganhe cashback em todas as compras que eles fizerem na plataforma.
  </p>
  </div>
  <button 
  onClick={() => handleTabChange("affiliate")}
  className="relative z-10 self-start text-[10px] sm:text-[9px] font-bold uppercase tracking-[0.2em] text-brand-tactical border border-brand-tactical/30 px-3 sm:px-6 py-2 sm:py-3 hover:bg-brand-tactical hover:text-black transition-all duration-300"
  >
  Pegar meu Link →
  </button>
  </div>
  </div>
  
  {/* ── HISTÓRICO DO LEDGER ── */}
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="h-0.5 w-6 bg-brand-tactical" />
 <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">Extrato de Recompensas</p>
 </div>

 <div className="bg-theme-bg/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
 {user?.gamificationLedger && user.gamificationLedger.length > 0 ? (
 <div className="divide-y divide-white/5">
 {user.gamificationLedger.map(item => (
 <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical shadow-[0_0_8px_rgba(133,185,172,0.8)]" />
 <p className="text-[11px] font-bold text-theme-text uppercase ">
 {item.description}
 </p>
 </div>
 <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest ml-3">
 {new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.type}
 </p>
 </div>
 <div className="text-right">
 {(item.amount && Number(item.amount) > 0) ? (
 <p className="text-[14px] font-bold text-brand-tactical">
 +{formatCurrency(item.amount)}
 </p>
 ) : null}
 {item.points && (
 <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest mt-0.5">
 +{item.points} pts
 </p>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
                  <div className="p-5 md:p-10 md:p-14 text-center space-y-4">
                    <ShoppingBag size={24} className="mx-auto text-theme-border/30 drop-shadow-md mb-2" />
                    <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">
                      Sua carteira está aguardando as primeiras recompensas.
                    </p>
                  </div>
 )}
 </div>
 </div>
  </div>
  ) : activeTab === "files" ? (
 <div className="space-y-4 md:space-y-10">
 {/* Espaçamento tático para as memórias */}
 <div className="h-1 md:h-4" />

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
                     <div className="relative overflow-hidden border border-white/5 bg-theme-bg/40 backdrop-blur-xl p-4 md:p-10 text-center space-y-6 rounded-2xl shadow-xl">
                      {/* Background decoration */}
                      <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/5 to-transparent opacity-50" />
                      
                      <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-theme-bg border border-white/5 shadow-inner">
                        <ImageIcon size={24} className="text-theme-border/40" />
                        <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-brand-tactical rounded-full animate-pulse shadow-[0_0_10px_rgba(133,185,172,0.8)]" />
                      </div>
                      
                      <div className="relative space-y-2">
                        <h3 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">Histórico Vazio</h3>
                        <p className="text-[10px] md:text-[11px] font-bold text-theme-muted uppercase tracking-widest max-w-sm mx-auto leading-relaxed px-4">
                          Você ainda não realizou nenhuma compra. Explore a vitrine ou solicite uma cobertura.
                        </p>
                      </div>
                      
                      <div className="relative flex items-center justify-center gap-4 flex-wrap pt-2">
                        <button onClick={() => navigate("/vitrine")} className="px-3 md:px-6 py-3 bg-brand-tactical text-brand-text font-bold text-[10px] uppercase tracking-widest flex items-center gap-3 hover:brightness-110 transition-all shadow-lg shadow-brand-tactical/20">
                          Explorar Vitrine <ArrowRight size={14} />
                        </button>
                        <button onClick={() => navigate("/cotacao")} className="px-3 md:px-6 py-3 border border-theme-border text-theme-text font-bold text-[10px] uppercase tracking-widest hover:bg-theme-bg-muted transition-all flex items-center gap-3">
                          Solicitar Cobertura <ArrowRight size={14} />
                        </button>
                      </div>
                    </div>
 ) : (
 <div className="space-y-4 md:space-y-10">
 {groupedEvents.length > 0 && (
 <div className="space-y-6">
 {groupedEvents.map((group) => (
 <EventGroupRow 
 key={group.event.id} 
 group={group} 
 onSelectPedido={(p) => handleSelect(p)}
 />
 ))}
 </div>
 )}
 </div>
 )}
 {/* ── HISTÓRICO DO LEDGER ── */}
 <div className="space-y-6">
 <div className="flex items-center gap-3">
 <div className="h-0.5 w-6 bg-brand-tactical" />
 <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">Extrato de Recompensas</p>
 </div>

 <div className="bg-theme-bg/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
 {user?.gamificationLedger && user.gamificationLedger.length > 0 ? (
 <div className="divide-y divide-white/5">
 {user.gamificationLedger.map(item => (
 <div key={item.id} className="p-5 flex items-center justify-between hover:bg-white/[0.02] transition-all">
 <div className="space-y-1">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical shadow-[0_0_8px_rgba(133,185,172,0.8)]" />
 <p className="text-[11px] font-bold text-theme-text uppercase ">
 {item.description}
 </p>
 </div>
 <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-widest ml-3">
 {new Date(item.createdAt).toLocaleDateString('pt-BR')} • {item.type}
 </p>
 </div>
 <div className="text-right">
 {(item.amount && Number(item.amount) > 0) ? (
 <p className="text-[14px] font-bold text-brand-tactical">
 +{formatCurrency(item.amount)}
 </p>
 ) : null}
 {item.points && (
 <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest mt-0.5">
 +{item.points} pts
 </p>
 )}
 </div>
 </div>
 ))}
 </div>
 ) : (
                  <div className="p-5 md:p-10 md:p-14 text-center space-y-4">
                    <ShoppingBag size={24} className="mx-auto text-theme-border/30 drop-shadow-md mb-2" />
                    <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">
                      Sua carteira está aguardando as primeiras recompensas.
                    </p>
                  </div>
 )}
 </div>
 </div>
 </div>
 ) : activeTab === "profile" ? (
  <div className="space-y-6 md:space-y-8">
  <div className="lux-card p-4 md:p-8 max-w-2xl border-l-4 border-l-brand-tactical bg-theme-bg">
  <div className="flex flex-col md:flex-row gap-4 md:gap-8 items-center md:items-start mb-6 pb-6 md:mb-8 md:pb-8 border-b border-theme-border">
  <ProfilePhotoUpload 
    currentProfileUrl={user?.profileImageUrl} 
    currentNome={user?.nome} 
    onProfileUpdated={() => window.location.reload()} 
  />
 <div className="space-y-2 text-center md:text-left">
 <h2 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">Meus Dados</h2>
 <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.4em] ">Gerencie suas informações de contato e entrega</p>
 </div>
 </div>
 <form onSubmit={handleUpdateProfile} className="space-y-4 md:space-y-6">
 <div className="space-y-1.5 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-widest text-theme-muted block ">E-mail (Não editável)</label>
 <input type="text" disabled value={user?.email || ""} className="fs-input opacity-60" />
 </div>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6">
 <div className="space-y-1.5 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-widest text-theme-muted block ">Nome Completo</label>
 <input type="text" value={profileData.nome} onChange={e => setProfileData(p => ({ ...p, nome: e.target.value }))} className="fs-input" placeholder="Como quer ser chamado" />
 </div>
 <div className="space-y-1.5 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-widest text-theme-muted block ">WhatsApp</label>
 <input type="text" value={profileData.whatsapp} onChange={e => setProfileData(p => ({ ...p, whatsapp: e.target.value }))} className="fs-input" placeholder="(00) 00000-0000" />
 </div>
 </div>

 <div className="pt-2 md:pt-4 space-y-4 md:space-y-6">
 <div className="flex items-center gap-3">
 <div className="h-px w-6 bg-brand-tactical" />
 <p className="text-[10px] md:text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em]">Endereço de Entrega</p>
 </div>

 <div className="grid grid-cols-6 gap-2.5 md:gap-4">
 <div className="col-span-2 sm:col-span-2 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">CEP</label>
 <input type="text" value={profileData.cep} onChange={e => handleCepChange(e.target.value)} className="fs-input p-2.5 text-xs" placeholder="00000-000" />
 </div>
 <div className="col-span-4 sm:col-span-4 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">Endereço</label>
 <input type="text" value={profileData.endereco} onChange={e => setProfileData(p => ({ ...p, endereco: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="Nome da rua" />
 </div>

 <div className="col-span-2 sm:col-span-1 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">Nº</label>
 <input type="text" value={profileData.numero} onChange={e => setProfileData(p => ({ ...p, numero: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="123" />
 </div>
 <div className="col-span-4 sm:col-span-2 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">Complemento</label>
 <input type="text" value={profileData.complemento} onChange={e => setProfileData(p => ({ ...p, complemento: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="Apto, Bloco, etc" />
 </div>

 <div className="col-span-6 sm:col-span-3 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">Bairro</label>
 <input type="text" value={profileData.bairro} onChange={e => setProfileData(p => ({ ...p, bairro: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="Nome do bairro" />
 </div>
 <div className="col-span-4 sm:col-span-4 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">Cidade</label>
 <input type="text" value={profileData.cidade} onChange={e => setProfileData(p => ({ ...p, cidade: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="Sua cidade" />
 </div>
 <div className="col-span-2 sm:col-span-2 space-y-1 md:space-y-2">
 <label className="text-[10px] md:text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block ">UF</label>
 <input type="text" value={profileData.estado} onChange={e => setProfileData(p => ({ ...p, estado: e.target.value }))} className="fs-input p-2.5 text-xs" placeholder="SP" maxLength={2} />
 </div>
 </div>
 </div>
 <div className="flex items-center gap-3 md:gap-6">
 <button type="submit" disabled={isSaving} className="fs-btn bg-brand-tactical text-brand-text hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-tactical/20 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-none ">
 {isSaving ? "Salvando..." : "Salvar Alterações"}
 </button>
 {saveSuccess && <span className="text-brand-tactical text-[10px] font-bold uppercase tracking-widest">✓ Atualizado</span>}
 </div>
 </form>
 <div className="pt-4 md:pt-6 border-t border-theme-border space-y-3 md:space-y-4">
 <h3 className="text-[10px] md:text-[9px] font-bold text-red-400 uppercase tracking-[0.3em]">Zona de Suporte</h3>
 <p className="text-[10px] md:text-[11px] text-theme-muted">Para redefinir sua senha ou solicitar exclusão de dados, entre em contato com nosso suporte.</p>
 <a href="https://wa.me/5519981150440" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-[10px] font-bold text-theme-text uppercase tracking-widest hover:text-brand-tactical transition-colors">
 Falar com Suporte <ArrowRight size={12} />
 </a>
 </div>
 </div>

 {/* Role Application Section */}
 {(user?.role === "CLIENTE" || user?.verificationStatus === "PENDING") && (
 <div className="lux-card p-5 md:p-10 max-w-2xl border-l-4 border-l-emerald-500 bg-theme-bg">
 <div className="space-y-4 md:space-y-6">
 <div className="flex items-center gap-4">
 <div className="p-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
 <Briefcase size={24} />
 </div>
 <div className="space-y-1">
 <h3 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">Seja um Parceiro</h3>
 <p className="text-[9px] md:text-[10px] font-bold text-emerald-500 uppercase tracking-[0.4em] ">Transforme sua paixão em faturamento</p>
 </div>
 </div>

 {user?.verificationStatus === "PENDING" ? (
 <div className="p-3 md:p-6 bg-amber-500/10 border border-amber-500/20 space-y-3">
 <div className="flex items-center gap-3 text-amber-500">
 <Clock size={16} className="animate-pulse" />
 <p className="text-[10px] font-bold uppercase tracking-widest">Perfil em Análise Técnica</p>
 </div>
 <p className="text-xs text-theme-text-muted leading-relaxed">
 Recebemos sua solicitação! Nossa equipe está validando seu perfil e portfólio. 
 Você receberá um e-mail assim que seu acesso ao painel profissional for liberado.
 </p>
 </div>
 ) : (
 <div className="space-y-6">
 <p className="text-xs text-theme-text-muted leading-relaxed">
 Junte-se à maior rede de fotografia phygital do Brasil. Como parceiro, você terá acesso a ferramentas exclusivas de venda, monitoramento de pedidos e repasses automatizados.
 </p>
 
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <button 
 disabled={isApplying}
 onClick={async () => {
 setIsApplying(true);
 try {
 await applyRole({ role: "PROFISSIONAL" });
 toast.success("Solicitação enviada!");
 } catch {
 toast.error("Erro ao solicitar.");
 } finally {
 setIsApplying(false);
 }
 }}
 className="p-3 md:p-6 border-2 border-theme-border hover:border-emerald-500/60 transition-all text-left space-y-3 group bg-theme-bg/20"
 >
 <Camera size={20} className="text-theme-muted group-hover:text-emerald-500 transition-colors" />
 <div className="space-y-1">
 <p className="text-[11px] font-bold text-theme-text uppercase tracking-widest ">Fotógrafo Freelancer</p>
 <p className="text-[9px] text-theme-muted uppercase leading-tight tracking-widest">Atue em eventos e receba por diária + splits de vendas.</p>
 </div>
 </button>

 <button 
 disabled={isApplying}
 onClick={async () => {
 setIsApplying(true);
 try {
 await applyRole({ role: "CARTORIO" });
 toast.success("Solicitação enviada!");
 } catch {
 toast.error("Erro ao solicitar.");
 } finally {
 setIsApplying(false);
 }
 }}
 className="p-3 md:p-6 border-2 border-theme-border hover:border-emerald-500/60 transition-all text-left space-y-3 group bg-theme-bg/20"
 >
 <Building2 size={20} className="text-theme-muted group-hover:text-emerald-500 transition-colors" />
 <div className="space-y-1">
 <p className="text-[11px] font-bold text-theme-text uppercase tracking-widest ">Unidade Fixa (Local)</p>
 <p className="text-[9px] text-theme-muted uppercase leading-tight tracking-widest">Transforme seu estabelecimento em um ponto Foto Segundo.</p>
 </div>
 </button>
 </div>
 </div>
 )}
 </div>
 </div>
 )}
 </div>
 ) : activeTab === "affiliate" ? (
 <AffiliateDashboard />
 ) : null}
 </motion.div>
 </AnimatePresence>
 </div>

 {/* DETALHES DO PEDIDO (DRAWER) */}
 {selected && (
 <SideDrawer
 isOpen={!!selected}
 onClose={() => setSelected(null)}
 width="max-w-5xl"
 title={selected?.event?.title || "Detalhes do Álbum"}
 >
 <PedidoDetalhe
 pedido={selected}
 loading={loadingDetalhe}
 onGoToEvent={() => { setSelected(null); navigate(getEventUrl(selected)); }}
 onChangePrivacy={() => setIsPrivacyModalOpen(true)}
 onRefresh={fetchPedidos}
 />
 </SideDrawer>
 )}

 {isPrivacyModalOpen && selected && (
 <AccessTypeModal
 orderId={selected.id}
 eventTitle={selected.event.title}
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

 {null}
 </>
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

function EventGroupRow({ group, onSelectPedido }: {
  group: EventGroup;
  onSelectPedido: (p: Pedido) => void;
}) {
  const navigate = useNavigate();
  const { event, pedidos, hasAprovado, hasPendente, latestAprovado, firstPendente } = group;



  const purchaseDate = new Date(pedidos[0].createdAt).toLocaleDateString("pt-BR", { day: 'numeric', month: 'long' });
  const eventDateFmt = formatDate(event.dataEvento);
  const timeFmt = new Date(event.dataEvento).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' });
  const isCofre = event?.slug?.startsWith('vault-') || pedidos[0]?.manualType === 'COFRE';
  const displayTitle = isCofre ? `Ordem de Cofre: ${event.title}` : event.title;

  return (
    <div className="mb-6 space-y-2">
      {/* Date Header */}
      <h3 className="text-[10px] font-bold text-theme-text uppercase tracking-widest pl-1">
        {purchaseDate}
      </h3>

      <div className={`relative bg-[var(--bg-card)] border transition-all duration-300 rounded-xl overflow-hidden shadow-sm ${
        hasPendente ? 'border-amber-500/40' : 'border-theme-border'
      }`}>
        {/* Status Header */}
        <div className="px-4 py-3 border-b border-theme-border/50 bg-black/10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${hasAprovado ? 'text-emerald-500' : 'text-amber-500'}`}>
              {hasAprovado ? 'Acesso Liberado' : 'Pagamento Pendente'}
            </span>
            <p className="text-[10px] text-theme-text-muted">
              Evento: <strong className="text-theme-text">{eventDateFmt} às {timeFmt}</strong>
              {event.eventHours ? <span className="ml-1">• {event.eventHours}h</span> : null}
            </p>
          </div>
          {(() => {
            const desc = event.description || '';
            const marker = 'Descrição do Cliente:';
            const idx = desc.indexOf(marker);
            const clientNotes = idx >= 0 ? desc.slice(idx + marker.length).trim() : '';
            if (!clientNotes || clientNotes === 'undefined') return null;
            return (
              <p className="text-[10px] text-theme-text-muted mt-2 border-t border-white/5 pt-2">
                <strong className="text-theme-text">Obs:</strong> {clientNotes}
              </p>
            );
          })()}
        </div>

        {/* Body */}
        <div className="p-3 sm:p-4 flex flex-row gap-3 items-center">
          {/* Thumbnail */}
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-zinc-900 border border-theme-border rounded-lg overflow-hidden shrink-0">
            {event.coverPhotoUrl ? (
              <img 
                src={event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
                alt="" 
                className={`w-full h-full object-cover ${hasAprovado ? '' : 'grayscale brightness-50'}`} 
                style={{ objectPosition: event.coverPosition || 'center' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-black/20">
                <ImageIcon size={20} className="text-white/20" />
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-sm font-bold text-theme-text mb-1 truncate">
              {displayTitle}
            </h4>
            <p className="text-[10px] text-theme-text-muted flex items-center gap-1 mb-2">
              <MapPin size={10} /> <span className="truncate">{event.city || event.location || "Digital"}</span>
            </p>
            
            <div className="space-y-0.5">
              <p className="text-[9px] font-medium text-theme-text-muted">
                {pedidos.length} {pedidos.length === 1 ? 'item' : 'itens'}
              </p>
              {pedidos.slice(0, 2).map(p => (
                <p key={p.id} className="text-[10px] text-theme-text-muted truncate">
                  • {p.manualType || "Pacote de Serviços"}
                </p>
              ))}
              {pedidos.length > 2 && (
                <p className="text-[9px] text-brand-tactical/70 italic">
                  + {pedidos.length - 2} outros itens
                </p>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col justify-center gap-2 shrink-0 border-l border-white/5 pl-3 min-w-[90px] sm:min-w-[120px]">
            {hasAprovado ? (
              <>
                <button 
                  onClick={() => onSelectPedido(latestAprovado!)} 
                  className="w-full px-2 py-2 bg-brand-tactical text-black rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all text-center"
                >
                  Ver Compra
                </button>
                <button 
                  onClick={() => navigate(getEventUrl(pedidos[0]))} 
                  className="w-full px-2 py-2 bg-[var(--bg-card)] border border-theme-border text-theme-text rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:border-brand-tactical transition-all text-center"
                >
                  Acessar
                </button>
              </>
            ) : (
              <button 
                onClick={() => firstPendente && navigate(`/checkout?orderId=${firstPendente.id}`)} 
                className="w-full px-2 py-2 bg-amber-500 text-black rounded-lg text-[9px] sm:text-[10px] font-bold uppercase tracking-wider hover:brightness-110 transition-all text-center"
              >
                Pagar Agora
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PedidoDetalhe({ pedido, loading, onGoToEvent, onChangePrivacy, onRefresh }: {
  pedido: Pedido;
  loading: boolean;
  onGoToEvent: () => void;
  onChangePrivacy: () => void;
  onRefresh: () => void;
}) {
 const navigate = useNavigate();
 const [isEditing, setIsEditing] = useState(false);
 const [nome, setNome] = useState(pedido.event.title || "");
 const [coverUrl, setCoverUrl] = useState(pedido.event.coverPhotoUrl || "");
 const [coverPos, setCoverPos] = useState(pedido.event.coverPosition || "center");
 const [loc, setLoc] = useState(pedido.event.location || "");
 const [city, setCity] = useState(pedido.event.city || "");
 const [isSaving, setIsSaving] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [isUploading, setIsUploading] = useState(false);

 // Sync state with props when pedido changes (e.g. after a refresh)
 useEffect(() => {
 setNome(pedido.event.title || "");
 setCoverUrl(pedido.event.coverPhotoUrl || "");
 setCoverPos(pedido.event.coverPosition || "center");
 setLoc(pedido.event.location || "");
 setCity(pedido.event.city || "");
 }, [pedido]);

 const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // Valida tamanho (max 5MB)
 if (file.size > 5 * 1024 * 1024) {
 toast.error("A imagem deve ter no máximo 5MB.");
 return;
 }

 setIsUploading(true);
 const reader = new FileReader();
 reader.readAsDataURL(file);
 reader.onload = async () => {
 try {
 const base64 = reader.result as string;
 const { data } = await API.patch(`/cliente/pedidos/${pedido.id}/cover`, {
 imageBase64: base64,
 mimeType: file.type
 });
 
 setCoverUrl(data.coverPhotoUrl);
 pedido.event.coverPhotoUrl = data.coverPhotoUrl;
 onRefresh();
 } catch (err) {
 console.error("Erro no upload:", err);
 toast.error("Erro ao enviar imagem.");
 } finally {
 setIsUploading(false);
 }
 };
 };

 const handleSave = async () => {
 setIsSaving(true);
 try {
 await API.patch(`/cliente/pedidos/${pedido.id}/personalize`, {
 title: nome,
 coverPhotoUrl: coverUrl,
 coverPosition: coverPos,
 location: loc,
 city: city
 });
 pedido.event.title = nome;
 pedido.event.coverPhotoUrl = coverUrl;
 pedido.event.coverPosition = coverPos;
 pedido.event.location = loc;
 pedido.event.city = city;
 setIsEditing(false);
 onRefresh();
 } catch {
 toast.error("Erro ao salvar personalização.");
 } finally {
 setIsSaving(false);
 }
 };
 
 return (
 <div className="flex flex-col bg-theme-bg min-h-full">
 <div className="relative h-32 md:h-40 bg-zinc-900 overflow-hidden group">
 {pedido.event.coverPhotoUrl ? (
 <>
 <img 
 src={pedido.event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
 alt="" 
 className="w-full h-full object-cover opacity-60"
 onError={(e) => {
 const target = e.target as HTMLImageElement;
 target.onerror = null;
 target.src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IiMzZjNmNDYiIHN0cm9rZS13aWR0aD0iMiIHN0cm9rZS1saW5lY2FwPSJyb3VuZCIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCI+PHJlY3Qgd2lkdGg9IjE4IiBoZWlnaHQ9IjE4IiB4PSIzIiB5PSIzIiByeD0iMiIgcnk9IjIiLz48Y2lyY2xlIGN4PSI5IiBjeT0iOSIgcj0iMiIvPjxwYXRoIGQ9Im0yMSAxNS0zLjA4Ni0zLjA4NmEyIDIgMCAwIDAtMi44MjggMEw2IDIxIi8+PC9zdmc+';
 target.className = 'w-full h-full object-contain opacity-20 p-4';
 }}
 />
 <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/80 to-transparent pointer-events-none" />
 </>
 ) : (
 <div className="absolute inset-0 bg-gradient-to-br from-brand-tactical/20 to-transparent" />
 )}
 
 <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 space-y-1">
 <div className="flex items-center gap-2 mb-1">
 <div className="h-0.5 w-6 bg-brand-tactical" />
 <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-[0.4em]">Meu Álbum</p>
 </div>
 
 {!isEditing && (
 <div className="flex items-end justify-between">
 <div className="min-w-0 flex-1">
 <h3 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">
 {pedido.event.type === 'ALBUM_FULL' ? `Álbum: ${pedido.event.title}` : pedido.event.title}
 </h3>
 <p className="text-[9px] font-bold text-theme-muted uppercase tracking-widest mt-1 whitespace-pre-line">
 {formatDate(pedido.event.dataEvento)} {pedido.event.city && `• ${pedido.event.city}`}
 {pedido.event.location && `\n${pedido.event.location}`}
 </p>
 </div>
 {pedido.event.type === 'ALBUM_FULL' && (
 <button onClick={() => setIsEditing(true)} className="flex-shrink-0 ml-4 text-[9px] font-bold uppercase tracking-widest border border-theme-border/50 text-zinc-400 px-3 py-1.5 hover:text-brand-tactical hover:border-brand-tactical transition-colors rounded">
 Personalizar
 </button>
 )}
 </div>
 )}

 {isEditing && (
 <div className="flex items-center gap-2">
 <Zap size={12} className="text-brand-tactical animate-pulse" />
 <p className="text-[9px] font-bold text-white uppercase tracking-widest ">Modo de Edição Ativo</p>
 </div>
 )}
 </div>
 </div>

 <div className="p-3 md:p-6 space-y-8">
 {isEditing && (
 <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
 <div className="flex flex-col gap-5 bg-theme-bg p-3 md:p-6 border-2 border-theme-border rounded-lg">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.2em]">Identidade do Álbum</label>
 <input 
 value={nome} 
 onChange={(e) => setNome(e.target.value)}
 className="fs-input !text-xl !font-heading ! !border-b-2"
 placeholder="Ex: Casamento de Maria & João"
 />
 </div>

 <div className="space-y-2">
 <label className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.2em]">Capa do Álbum</label>
 <div className="flex items-center gap-3">
 <div className="flex-1 relative">
 <input 
 value={coverUrl} 
 onChange={(e) => setCoverUrl(e.target.value)}
 className="fs-input"
 placeholder="Cole a URL ou use o upload ao lado →"
 />
 </div>
 <input 
 type="file" 
 ref={fileInputRef} 
 onChange={handleFileChange} 
 className="hidden" 
 accept="image/*" 
 />
 <button 
 type="button"
 onClick={() => fileInputRef.current?.click()}
 disabled={isUploading}
 className="fs-btn bg-brand-tactical text-black min-w-[90px] !py-3"
 >
 {isUploading ? (
 <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
 ) : "UPLOAD"}
 </button>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-4">
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">Enquadramento</label>
 <select 
 value={coverPos} 
 onChange={(e) => setCoverPos(e.target.value)}
 className="fs-input !py-2.5 cursor-pointer"
 >
 <option value="center">Centro</option>
 <option value="top">Topo</option>
 <option value="bottom">Base</option>
 <option value="left">Esquerda</option>
 <option value="right">Direita</option>
 </select>
 </div>
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">Cidade <span className="opacity-40">(Opcional)</span></label>
 <input 
 value={city} 
 onChange={(e) => setCity(e.target.value)}
 className="fs-input !py-2.5"
 placeholder="Cidade"
 />
 </div>
 </div>
 
 <div className="space-y-1.5">
 <label className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em]">Endereço Completo / Localização</label>
 <textarea 
 value={loc} 
 onChange={(e) => setLoc(e.target.value)}
 className="fs-input min-h-[80px] resize-none"
 placeholder="Rua, Número, Bairro..."
 />
 </div>

 <div className="flex gap-3 mt-2 pt-4 border-t border-theme-border">
 <button 
 onClick={handleSave} 
 disabled={isSaving} 
 className="fs-btn bg-brand-tactical text-black flex-1 shadow-lg shadow-brand-tactical/20"
 >
 {isSaving ? "Salvando..." : "Salvar Alterações"}
 </button>
 <button 
 onClick={() => setIsEditing(false)} 
 className="fs-btn border border-theme-border text-zinc-400 flex-1 hover:bg-zinc-800"
 >
 Cancelar
 </button>
 </div>
 </div>
 </div>
 )}
 <div className="flex flex-col md:flex-row gap-4">
 <div className="flex-1 flex items-center justify-between p-4 border-2 border-theme-border bg-theme-bg">
 <div className="flex items-center gap-3">
 <ShieldCheck size={16} className="text-brand-tactical" />
 <div>
 <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest ">Acesso</p>
 <p className="text-[11px] text-theme-muted font-bold">
 {pedido.hasPaid ? (pedido.accessType === 'PRIVATE' ? 'PRIVADO' : 'PÚBLICO') : 'Pendente'}
 </p>
 </div>
 </div>
 <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest border ${pedido.hasPaid ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/5' : 'border-amber-500/50 text-amber-400 bg-amber-500/5'}`}>
 {pedido.hasPaid ? "Liberado" : "Pagar Agora"}
 </span>
 </div>

 {pedido.hasPaid && pedido.accessExpiresAt && (
 <div className="flex items-center justify-between p-4 border-2 border-theme-border bg-theme-bg md:w-64">
 <div>
 <p className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Válido Até</p>
 <p className="text-sm font-bold text-theme-text ">{formatDate(pedido.accessExpiresAt)}</p>
 </div>
 <Clock size={16} className="text-theme-muted opacity-50" />
 </div>
 )}
 </div>

 <div className="space-y-4">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-brand-tactical" />
 <p className="text-[9px] font-bold text-theme-text uppercase tracking-[0.3em]">Serviços Contratados</p>
 </div>
 
 {loading ? (
 <div className="py-5 md:py-10 flex flex-col items-center gap-3">
 <div className="w-6 h-6 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
 <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest animate-pulse">Sincronizando...</p>
 </div>
 ) : pedido.hasPaid ? (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {pedido.event.temFoto && (
 <MediaActionCard
 icon={<Camera size={20} />}
 title="Fotografia Digital"
 subtitle="Galeria de Fotos"
 url={pedido.event.lightroomUrl}
 disabled={!pedido.event.lightroomUrl}
 bgImage="https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temFotoEditada && (
 <MediaActionCard
 icon={<Sparkles size={20} />}
 title="Fotos Editadas"
 subtitle="Galeria Premium Editada"
 url={pedido.event.lightroomUrl}
 disabled={!pedido.event.lightroomUrl}
 bgImage="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temVideo && (
 <MediaActionCard
 icon={<Play size={20} />}
 title="Vídeo de Cinema"
 subtitle="Filme Completo do Evento"
 url={pedido.event.driveUrl}
 disabled={!pedido.event.driveUrl}
 bgImage="https://images.unsplash.com/photo-1601506521937-0121a7fc2a6b?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temVideoEditado && (
 <MediaActionCard
 icon={<Zap size={20} />}
 title="Vídeo Editado"
 subtitle="Corte Especial e Edição Premium"
 url={pedido.event.driveUrl}
 disabled={!pedido.event.driveUrl}
 bgImage="https://images.unsplash.com/photo-1585072044896-2248dc1055eb?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temReels && (
 <MediaActionCard
 icon={<Play size={20} />}
 title="Reels / Social"
 subtitle="Teasers verticais para redes"
 url={pedido.event.driveUrl}
 disabled={!pedido.event.driveUrl}
 bgImage="https://images.unsplash.com/photo-1611162617474-5b21e879e113?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temFotoImpressa && (
 <MediaActionCard
 icon={<Printer size={20} />}
 title="Fotos Impressas"
 subtitle="Fotos Reveladas Premium"
 disabled={true}
 bgImage="https://images.unsplash.com/photo-1533227260815-32bd72385311?auto=format&fit=crop&q=80&w=800"
 />
 )}
 {pedido.event.temAlbumImpresso && (
 <MediaActionCard
 icon={<Printer size={20} />}
 title="Álbum Físico"
 subtitle="Encadernação Premium"
 disabled={true}
 bgImage="https://images.unsplash.com/photo-1544473244-f6895e69da8e?auto=format&fit=crop&q=80&w=800"
 />
 )}
 </div>
 ) : (
 <div className="p-3 md:p-6 text-center border border-theme-border bg-brand-tactical/10 flex items-center justify-between gap-4">
 <div className="text-left space-y-1">
 <p className="text-[10px] font-bold text-theme-text uppercase tracking-widest ">Acesso Restrito</p>
 <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest">Aguardando pagamento</p>
 </div>
 <button 
 onClick={() => navigate(`/checkout?orderId=${pedido.id}`)}
 className="px-3 md:px-6 py-3 bg-brand-tactical text-black text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg hover:scale-105 transition-all"
 >
 Pagar
 </button>
 </div>
 )}
 </div>

 {/* Bottom Actions Compactos */}
 <div className="pt-6 border-t border-theme-border flex flex-col gap-3">
   {/* Botão principal de acesso — sempre visível se pago */}
   {pedido.hasPaid && (
     <button
       onClick={onGoToEvent}
       className="w-full py-3.5 bg-brand-tactical text-black text-[10px] font-bold uppercase tracking-[0.2em] hover:bg-brand-tactical/90 transition-all active:scale-95 flex items-center justify-center gap-2"
     >
       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
       Ver Álbum com Fotos Compradas
     </button>
   )}
   <div className="flex gap-3">
     <button
       onClick={onGoToEvent}
       className="flex-1 py-3 border border-theme-border text-[9px] font-bold uppercase tracking-[0.2em] text-theme-text hover:border-brand-tactical hover:text-brand-tactical transition-colors"
     >
       Acessar Mural
     </button>
     <button
       onClick={onChangePrivacy}
       disabled={!pedido.hasPaid}
       className="flex-1 py-3 border border-theme-border text-[9px] font-bold uppercase tracking-[0.2em] text-theme-text hover:border-amber-500 hover:text-amber-500 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
     >
       Privacidade
     </button>
   </div>
 </div>
 </div>
 </div>
 );
}


function MediaActionCard({ icon, title, subtitle, url, disabled, bgImage }: { 
  icon: React.ReactNode; 
  title: string; 
  subtitle: string; 
  url?: string | null; 
  disabled?: boolean;
  bgImage?: string;
 }) {
  if (disabled) {
  return (
  <div className="relative group h-36 rounded-xl overflow-hidden bg-theme-bg-muted border border-theme-border flex items-end p-4 cursor-not-allowed">
   {bgImage && (
    <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-10 filter grayscale" />
   )}
   <div className="absolute inset-0 bg-gradient-to-t from-theme-bg/90 via-theme-bg/50 to-theme-bg/10" />
   <div className="relative z-10 w-full">
    <div className="flex items-center gap-3 mb-2">
     <div className="p-2 bg-theme-bg-muted border border-theme-border opacity-40 rounded-lg text-theme-muted">{icon}</div>
     <div>
      <p className="text-[12px] font-bold uppercase tracking-widest text-theme-muted">{title}</p>
      <p className="text-[9px] font-bold opacity-60 text-theme-muted uppercase">Aguardando Publicação</p>
     </div>
    </div>
   </div>
  </div>
  );
  }
 
  return (
  <a 
  href={url || '#'} 
  target="_blank" 
  rel="noreferrer" 
  className="relative group h-36 rounded-xl overflow-hidden bg-theme-bg border-2 border-theme-border hover:border-brand-tactical transition-all duration-500 flex items-end p-4 shadow-lg hover:shadow-[0_0_20px_rgba(133,185,172,0.2)]"
  >
  {bgImage && (
   <img src={bgImage} alt="" className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-all duration-700 group-hover:scale-110" />
  )}
  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
  
  <div className="relative z-10 w-full flex items-center justify-between">
   <div className="flex flex-col gap-2">
    <div className="w-10 h-10 bg-brand-tactical/20 backdrop-blur-sm rounded-lg flex items-center justify-center text-brand-tactical group-hover:bg-brand-tactical group-hover:text-black transition-all duration-500 shadow-xl shadow-brand-tactical/10">
    {icon}
    </div>
    <div>
    <p className="text-[14px] font-bold text-white uppercase tracking-widest drop-shadow-lg">{title}</p>
    <p className="text-[10px] text-zinc-300 uppercase font-bold tracking-[0.2em]">{subtitle}</p>
    </div>
   </div>
   <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center group-hover:bg-brand-tactical group-hover:text-black text-white transition-all duration-500">
    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
   </div>
  </div>
  </a>
  );
 }

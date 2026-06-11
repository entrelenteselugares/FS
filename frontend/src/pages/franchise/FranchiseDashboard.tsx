import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout, type NavItem } from '../../components/DashboardLayout';
import { 
  Printer, 
  Users, 
  ShoppingBag, 
  Zap, 
  ShieldCheck, 
  AlertTriangle, 
  Copy, 
  ExternalLink,
  Activity,
  History,
  DollarSign,
  Palette,
  LayoutDashboard,
  Play,
  Briefcase,
  Lock,
  User,
  ImageIcon,
  Settings,
  Wallet,
  Building2
} from 'lucide-react';
import { API as api } from '../../lib/api';
import { useAuth } from '../../hooks/useAuth';

interface InventoryData {
  available: number;
  threshold: number;
  isLow: boolean;
}

interface Partner {
  id: string;
  user: {
    nome: string;
    isVerified: boolean;
    profissional?: {
      experienceYears: number;
    }
  }
}

interface FinanceStats {
  totalEarned: number;
  totalOrders: number;
  recentCommissions: {
    id: string;
    amount: number;
    eventTitle: string;
    date: string;
  }[];
  intel?: {
    networkEvents: number;
    networkOrders: number;
    avgOrdersPerEvent: string;
  };
}

const FranchiseDashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const navItems = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: "Histórico de Compras", onClick: () => navigate("/minha-conta?tab=files"), isActive: false, icon: <ShoppingBag size={18} /> },
      { label: "Meus Álbuns", onClick: () => navigate("/meus-albuns"), isActive: false, icon: <Lock size={18} /> },
      { label: "Minha Carteira", onClick: () => navigate("/minha-conta?tab=wallet"), isActive: false, icon: <Wallet size={18} /> },
      { label: "Indique e Ganhe", onClick: () => navigate("/minha-conta?tab=affiliate"), isActive: false, icon: <Users size={18} /> },
      { label: "Meus Dados", onClick: () => navigate("/minha-conta?tab=profile"), isActive: false, icon: <User size={18} /> },
    ];

    const isProOrFranchise = (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE" || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";
    const isVerified = (user?.verificationStatus === "APPROVED" || user?.isVerified || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";

    if (isProOrFranchise && isVerified) {
      const proSubItems: NavItem[] = [
        { label: "Minha Agenda", onClick: () => navigate("/minha-conta?tab=agenda"), isActive: false, icon: <Play size={18} /> },
        { label: "Meu Portfólio", onClick: () => navigate("/minha-conta?tab=portfolio"), isActive: false, icon: <ImageIcon size={18} /> },
        { label: "Serviços & Preços", onClick: () => navigate("/minha-conta?tab=servicos"), isActive: false, icon: <Briefcase size={18} /> },
        { label: "Ficha Técnica & Pix", onClick: () => navigate("/minha-conta?tab=perfil"), isActive: false, icon: <Settings size={18} /> },
        { label: "Vendas & Ganhos", onClick: () => navigate("/minha-conta?tab=financeiro"), isActive: false, icon: <DollarSign size={18} /> }
      ];

      items.push({
        label: "Painel Profissional",
        icon: <Briefcase size={18} />,
        subItems: proSubItems
      });

      if (user?.role === "FRANCHISEE" || user?.franchiseProfile) {
        const franchiseSubItems: NavItem[] = [];
        if (user?.role === "FRANCHISEE") {
          franchiseSubItems.push(
            { label: "Gestão de Franquia", onClick: () => navigate("/franquia"), isActive: true, icon: <LayoutDashboard size={18} /> }
          );
        }
        franchiseSubItems.push(
          { label: "Rede Técnica", onClick: () => navigate("/minha-conta?tab=equipe"), isActive: false, icon: <Users size={18} /> },
          { label: "Franquia Print", onClick: () => navigate("/minha-conta?tab=franquia"), isActive: false, icon: <Printer size={18} /> }
        );

        items.push({
          label: "Gestão de Franquia",
          icon: <Building2 size={18} />,
          subItems: franchiseSubItems
        });
      }
    }
    return items;
  }, [user, navigate]);

  const [loading, setLoading] = useState(true);
  const [savingBranding, setSavingBranding] = useState(false);
  const [printerStatus] = useState<'ONLINE' | 'OFFLINE' | 'ERROR'>('ONLINE');
  const [branding, setBranding] = useState({
    logoUrl: user?.tenantLogoUrl || "",
    brandColor: user?.tenantBrandColor || "#14b8a6"
  });
  const [inventory, setInventory] = useState<InventoryData>({
    available: 0,
    threshold: 50,
    isLow: false
  });

  const [referralCode, setReferralCode] = useState("");
  const [partners, setPartners] = useState<Partner[]>([]);
  const [finance, setFinance] = useState<FinanceStats>({
    totalEarned: 0,
    totalOrders: 0,
    recentCommissions: []
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, refRes, netRes, finRes] = await Promise.all([
          api.get('/franchise/inventory'),
          api.get('/franchise/referral'),
          api.get('/franchise/network'),
          api.get('/franchise/finance')
        ]);

        setInventory(invRes.data);
        setReferralCode(refRes.data.code);
        setPartners(netRes.data);
        setFinance(finRes.data);
      } catch {
        console.error("Failed to fetch dashboard data:");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const copyReferral = () => {
    navigator.clipboard.writeText(`${window.location.origin}/register?ref=${referralCode}`);
    alert("Link de indicação copiado!");
  };

  const handleReorder = async (packType: string) => {
    try {
      await api.post('/franchise/reorder', { packType });
      alert("Pedido de reabastecimento gerado! Redirecionando para pagamento...");
      // In a real scenario, we'd redirect to the checkout page of the new order
    } catch {
      alert("Erro ao gerar pedido.");
    }
  };

  const handleSaveBranding = async () => {
    setSavingBranding(true);
    try {
      await api.patch('/franchise/branding', {
        tenantLogoUrl: branding.logoUrl,
        tenantBrandColor: branding.brandColor
      });
      alert("Configurações de marca atualizadas com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar configurações de marca.");
    } finally {
      setSavingBranding(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      // Create a hidden anchor element to download the CSV blob
      const response = await api.get('/franchise/finance/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `fechamento_franquia_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error(err);
      alert("Erro ao exportar fechamento. Verifique se existem vendas no período.");
    }
  };

  return (
    <DashboardLayout title="Gestão de Franquia" navItems={navItems}>
      {loading ? (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.5em] animate-pulse">
            Sincronizando Hub B2B...
          </div>
        </div>
      ) : (
      <div style={{ padding: "clamp(8px, 2vw, 32px)", maxWidth: "100%", margin: "0 auto", minHeight: "100vh" }}>
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER OPERACIONAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-brand-tactical uppercase tracking-[0.4em] ">Gestão de Franquia</span>
          <h1 className="text-2xl md:text-4xl font-heading font-bold uppercase text-theme-text">
            Command <span className="text-brand-tactical">Center</span>
          </h1>
        </div>

        <div className="grid grid-cols-2 md:flex gap-4 w-full md:w-auto">
          {/* PRINTER STATUS WIDGET */}
          <div className={`flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-4 border border-theme-border bg-theme-bg-muted transition-all ${printerStatus === 'ONLINE' ? 'border-brand-tactical/30' : 'border-red-500/30'}`}>
            <div className="relative">
              <Printer size={20} className={printerStatus === 'ONLINE' ? 'text-brand-tactical' : 'text-red-500'} />
              <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${printerStatus === 'ONLINE' ? 'bg-brand-tactical' : 'bg-red-500'}`} />
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Status Agent</span>
              <span className={`text-xs sm:text-sm font-black uppercase italic ${printerStatus === 'ONLINE' ? 'text-brand-tactical' : 'text-red-500'}`}>
                {printerStatus}
              </span>
            </div>
          </div>

          {/* REVENUE STATUS WIDGET */}
          <div className="flex items-center gap-4 px-4 py-3 sm:px-6 sm:py-4 border border-theme-border bg-theme-bg-muted border-blue-500/30">
            <div className="relative">
              <DollarSign size={20} className="text-blue-400" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            </div>
            <div className="space-y-0.5">
              <span className="text-[8px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Renda Passiva</span>
              <span className="text-xs sm:text-sm font-bold uppercase text-blue-400">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finance.totalEarned)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
        
        {/* COLUNA 1: INVENTÁRIO PREDITIVO */}
        <div className="lg:col-span-2 space-y-4 md:space-y-8">
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} className="text-theme-text" />
            </div>
            
            <div className="relative z-10 space-y-4 md:space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">Monitor de Insumos</h3>
                <ShieldCheck size={18} className="text-brand-tactical opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-10">
                {/* CRÉDITOS DE IMPRESSÃO */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-widest">Créditos de Foto</span>
                    <span className={`text-lg font-black italic ${inventory.isLow ? 'text-red-500' : 'text-theme-text'}`}>
                      {inventory.available} <span className="text-xs opacity-40">disponíveis</span>
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-theme-border/20 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${inventory.isLow ? 'bg-red-500' : 'bg-brand-tactical'}`}
                      style={{ width: `${Math.min(100, (inventory.available / (inventory.threshold * 4)) * 100)}%` }}
                    />
                  </div>
                  {inventory.isLow && (
                    <div className="flex items-center gap-2 text-red-500 animate-pulse">
                      <AlertTriangle size={14} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">Nível Crítico: Reposição Necessária</span>
                    </div>
                  )}
                </div>

                {/* STATUS DO PAPEL (RFID SIMULATION) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-bold text-theme-muted uppercase tracking-widest">Papel & Ribbon</span>
                    <span className="text-lg font-bold text-theme-text ">ESTÁVEL</span>
                  </div>
                  <div className="h-1.5 w-full bg-theme-border/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-theme-text transition-all duration-1000"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-50">
                    <span>Vencimento Estimado: 4 dias</span>
                    <span>Consumo Médio: 12p/dia</span>
                  </div>
                </div>
              </div>

              {/* QUICK REORDER CTA */}
              <div className="pt-3 md:pt-6 border-t border-theme-border/10 flex flex-col sm:flex-row gap-3">
                <button 
                  onClick={() => handleReorder('CREDITS_500')}
                  className="flex-1 bg-brand-tactical text-zinc-950 py-2.5 md:py-5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={14} /> Reabastecer Créditos (Pix)
                </button>
                <button 
                  onClick={() => handleReorder('PHYSICAL_KIT')}
                  className="flex-1 bg-transparent border border-theme-border text-theme-text py-2.5 md:py-5 text-[10px] md:text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-theme-bg-muted transition-all flex items-center justify-center gap-2"
                >
                  <Zap size={14} /> Solicitar Kit Físico
                </button>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE IMPRESSÕES */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <History size={18} className="text-theme-muted" />
                 <h3 className="text-sm font-bold text-theme-text uppercase tracking-widest ">Logs de Operação</h3>
              </div>
              <button className="text-[9px] font-bold text-theme-muted hover:text-brand-tactical uppercase tracking-widest transition-colors flex items-center gap-1">
                Ver Tudo <ExternalLink size={10} />
              </button>
            </div>

            <div className="space-y-1">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center justify-between py-3 border-b border-theme-border/5 last:border-0 group cursor-default">
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-bold text-theme-muted tabular-nums opacity-40">14:3{i}</span>
                       <p className="text-[11px] font-bold text-theme-text uppercase group-hover:text-brand-tactical transition-colors">Impressão realizada: Hub B2B Automático</p>
                    </div>
                    <span className="text-[9px] font-bold text-brand-tactical ">-1 CRÉDITO</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: NETWORKING & REFERRALS */}
        <div className="space-y-4 md:space-y-8">
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 space-y-4 md:space-y-8 border-brand-tactical/20">
            <div className="space-y-1.5">
              <Users size={22} className="text-brand-tactical" />
              <h3 className="text-xl md:text-2xl font-heading font-bold uppercase text-theme-text">Minha Rede</h3>
              <p className="text-[10px] text-theme-muted font-bold leading-relaxed uppercase ">
                Indique fotógrafos e expanda sua capilaridade regional.
              </p>
            </div>

            {/* REFERRAL TOOL */}
            <div className="space-y-4">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Seu Link de Indicação</span>
              <div className="flex bg-black/40 border border-theme-border p-1">
                <input 
                  type="text" 
                  readOnly 
                  value={referralCode ? `${window.location.host}/register?ref=${referralCode}` : "Gerando..."}
                  className="bg-transparent border-0 flex-1 px-4 text-[10px] font-bold text-theme-text focus:ring-0 truncate"
                />
                <button onClick={copyReferral} className="bg-brand-tactical p-3 text-zinc-950 hover:bg-white transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* PARTNER LIST (CARDS) */}
            <div className="space-y-4 pt-4">
              <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-60">Parceiros Vinculados ({partners.length})</span>
              <div className="space-y-3">
                {partners.length === 0 ? (
                  <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-40 py-4 text-center border  border-theme-border">
                    Nenhum parceiro vinculado ainda.
                  </p>
                ) : partners.map(p => (
                  <div key={p.id} className="p-4 border border-theme-border hover:border-brand-tactical/30 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold text-theme-text uppercase ">{p.user.nome}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 ${p.user.isVerified ? 'bg-brand-tactical text-zinc-950' : 'bg-zinc-800 text-zinc-400'} uppercase`}>
                        {p.user.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-bold text-theme-muted uppercase tracking-widest opacity-40">Experiência</span>
                      <span className="text-[11px] font-bold text-theme-text ">{p.user.profissional?.experienceYears || 0} Anos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B WHITE-LABEL SETTINGS */}
            <div className="space-y-4 pt-4 border-t border-theme-border">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={16} className="text-brand-tactical" />
                <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest opacity-80">White-Label (B2B)</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-theme-muted block mb-2">URL da Logo</label>
                  <input 
                    type="url" 
                    value={branding.logoUrl}
                    onChange={(e) => setBranding(prev => ({...prev, logoUrl: e.target.value}))}
                    placeholder="https://sua-logo.com/img.png"
                    className="w-full bg-black/40 border border-theme-border p-3 text-[10px] font-bold text-theme-text focus:border-brand-tactical transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-widest text-theme-muted block mb-2">Cor da Marca (Hex)</label>
                  <div className="flex gap-2">
                    <input 
                      type="color" 
                      value={branding.brandColor}
                      onChange={(e) => setBranding(prev => ({...prev, brandColor: e.target.value}))}
                      className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                    />
                    <input 
                      type="text" 
                      value={branding.brandColor}
                      onChange={(e) => setBranding(prev => ({...prev, brandColor: e.target.value}))}
                      className="flex-1 bg-black/40 border border-theme-border p-3 text-[10px] font-bold text-theme-text focus:border-brand-tactical transition-colors outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="w-full py-2.5 md:py-4 bg-brand-tactical/10 text-brand-tactical hover:bg-brand-tactical hover:text-zinc-950 transition-all text-[9px] font-bold uppercase tracking-[0.3em] disabled:opacity-50"
                >
                  {savingBranding ? 'Salvando...' : 'Salvar Customização'}
                </button>
              </div>
            </div>
          </div>

          {/* PASSIVE INCOME LIST & COHORT INTEL */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 space-y-4 md:space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-theme-text uppercase tracking-widest ">Comissões & Fechamento</h3>
              <button 
                onClick={handleExportCSV}
                className="text-[9px] font-bold text-brand-tactical border border-brand-tactical/30 px-3 py-1.5 uppercase tracking-widest hover:bg-brand-tactical hover:text-black transition-colors"
              >
                Exportar CSV
              </button>
            </div>

            {/* COHORT INTEL METRICS */}
            {finance.intel && (
              <div className="grid grid-cols-3 gap-4 pb-6 border-b border-theme-border">
                <div>
                  <span className="block text-[8px] font-bold text-theme-muted uppercase tracking-widest">Eventos da Rede</span>
                  <span className="text-lg font-bold text-white">{finance.intel.networkEvents}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-theme-muted uppercase tracking-widest">Pedidos (Vendas)</span>
                  <span className="text-lg font-bold text-white">{finance.intel.networkOrders}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-bold text-theme-muted uppercase tracking-widest">Conv. (Orders/Event)</span>
                  <span className="text-lg font-bold text-brand-tactical">{finance.intel.avgOrdersPerEvent}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {finance.recentCommissions.length === 0 ? (
                <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-40 py-4 text-center border  border-theme-border">
                  Nenhuma comissão passiva registrada.
                </p>
              ) : finance.recentCommissions.map(c => (
                <div key={c.id} className="flex flex-col gap-1 py-3 border-b border-theme-border/10 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-theme-text uppercase truncate max-w-[140px]">{c.eventTitle}</span>
                    <span className="text-[11px] font-bold text-blue-400">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.amount)}</span>
                  </div>
                  <span className="text-[8px] font-bold text-theme-muted uppercase opacity-40">{new Date(c.date).toLocaleDateString('pt-BR')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        </div>
      </div>
    </div>
      )}
  </DashboardLayout>
);
};

export default FranchiseDashboard;

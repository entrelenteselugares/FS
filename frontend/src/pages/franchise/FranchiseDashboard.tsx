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
  Calendar,
  Lock,
  User
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
      { label: "Carrinho", onClick: () => navigate("/minha-conta?s=files"), isActive: false, icon: <ShoppingBag size={18} /> },
      { label: "Meus Álbuns", onClick: () => navigate("/meus-albuns"), isActive: false, icon: <Lock size={18} /> },
      { label: "Indique e Ganhe", onClick: () => navigate("/minha-conta?s=affiliate"), isActive: false, icon: <Users size={18} /> },
      { label: "Meus Dados", onClick: () => navigate("/minha-conta?s=menu"), isActive: false, icon: <User size={18} /> },
    ];

    const isProOrFranchise = (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE" || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";
    const isVerified = (user?.verificationStatus === "APPROVED" || user?.isVerified || !!user?.franchiseProfile) && user?.role !== "UNIDADE" && user?.role !== "CARTORIO";

    if (isProOrFranchise && isVerified) {
      items.push(
        { label: "ÁREA PROFISSIONAL", isHeader: true },
        { label: "Minha Agenda", onClick: () => navigate("/minha-conta?s=agenda"), isActive: false, icon: <Play size={18} /> },
        { label: "Portfólio & Serviços", onClick: () => navigate("/minha-conta?s=servicos"), isActive: false, icon: <Briefcase size={18} /> },
        { label: "Vendas & Ganhos", onClick: () => navigate("/minha-conta?s=financeiro"), isActive: false, icon: <DollarSign size={18} /> },
        { label: "Agenda Google", onClick: () => navigate("/minha-conta?s=calendar"), isActive: false, icon: <Calendar size={18} /> }
      );

      if (user?.role === "FRANCHISEE" || user?.franchiseProfile) {
        if (user?.role === "FRANCHISEE") {
          items.push(
            { label: "Gestão de Franquia", onClick: () => navigate("/franquia"), isActive: true, icon: <LayoutDashboard size={18} /> }
          );
        }
        items.push(
          { label: "Rede Técnica", onClick: () => navigate("/minha-conta?s=equipe"), isActive: false, icon: <Users size={18} /> },
          { label: "Franquia Print", onClick: () => navigate("/minha-conta?s=franquia"), isActive: false, icon: <Printer size={18} /> }
        );
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
          <div className="text-[10px] font-black text-theme-muted uppercase tracking-[0.5em] animate-pulse">
            Sincronizando Hub B2B...
          </div>
        </div>
      ) : (
      <div style={{ padding: "clamp(8px, 2vw, 32px)", maxWidth: "100%", margin: "0 auto", minHeight: "100vh" }}>
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* HEADER OPERACIONAL */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <span className="text-[11px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Gestão de Franquia</span>
          <h1 className="text-4xl md:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter leading-none italic">
            Command <span className="text-brand-tactical">Center</span>
          </h1>
        </div>

        {/* PRINTER STATUS WIDGET */}
        <div className={`flex items-center gap-4 px-6 py-4 border border-theme-border bg-theme-bg-muted/50 transition-all ${printerStatus === 'ONLINE' ? 'border-brand-tactical/30' : 'border-red-500/30'}`}>
          <div className="relative">
            <Printer size={24} className={printerStatus === 'ONLINE' ? 'text-brand-tactical' : 'text-red-500'} />
            <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-ping ${printerStatus === 'ONLINE' ? 'bg-brand-tactical' : 'bg-red-500'}`} />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Status Agent</span>
            <span className={`text-sm font-black uppercase italic ${printerStatus === 'ONLINE' ? 'text-brand-tactical' : 'text-red-500'}`}>
              {printerStatus}
            </span>
          </div>
        </div>

        {/* REVENUE STATUS WIDGET */}
        <div className="flex items-center gap-4 px-6 py-4 border border-theme-border bg-theme-bg-muted/50 border-blue-500/30">
          <div className="relative">
            <DollarSign size={24} className="text-blue-400" />
            <div className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          </div>
          <div className="space-y-0.5">
            <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Renda Passiva</span>
            <span className="text-sm font-black uppercase italic text-blue-400">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(finance.totalEarned)}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* COLUNA 1: INVENTÁRIO PREDITIVO */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-theme-bg-muted border border-theme-border p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Activity size={120} className="text-theme-text" />
            </div>
            
            <div className="relative z-10 space-y-8">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-heading font-black text-theme-text uppercase italic tracking-tight">Monitor de Insumos</h3>
                <ShieldCheck size={20} className="text-brand-tactical opacity-50" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* CRÉDITOS DE IMPRESSÃO */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black text-theme-muted uppercase tracking-widest">Créditos de Foto</span>
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
                      <span className="text-[9px] font-black uppercase tracking-widest">Nível Crítico: Reposição Necessária</span>
                    </div>
                  )}
                </div>

                {/* STATUS DO PAPEL (RFID SIMULATION) */}
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <span className="text-[11px] font-black text-theme-muted uppercase tracking-widest">Papel & Ribbon</span>
                    <span className="text-lg font-black text-theme-text italic">ESTÁVEL</span>
                  </div>
                  <div className="h-1.5 w-full bg-theme-border/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-theme-text transition-all duration-1000"
                      style={{ width: '85%' }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-black text-theme-muted uppercase tracking-widest opacity-50">
                    <span>Vencimento Estimado: 4 dias</span>
                    <span>Consumo Médio: 12p/dia</span>
                  </div>
                </div>
              </div>

              {/* QUICK REORDER CTA */}
              <div className="pt-6 border-t border-theme-border/10 flex flex-col md:flex-row gap-4">
                <button 
                  onClick={() => handleReorder('CREDITS_500')}
                  className="flex-1 bg-brand-tactical text-zinc-950 py-5 text-[11px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <ShoppingBag size={16} /> Reabastecer Créditos (Pix)
                </button>
                <button 
                  onClick={() => handleReorder('PHYSICAL_KIT')}
                  className="flex-1 bg-transparent border border-theme-border text-theme-text py-5 text-[11px] font-black uppercase tracking-[0.2em] hover:bg-white/5 transition-all flex items-center justify-center gap-3"
                >
                  <Zap size={16} /> Solicitar Kit Físico
                </button>
              </div>
            </div>
          </div>

          {/* HISTÓRICO DE IMPRESSÕES */}
          <div className="bg-theme-bg-muted border border-theme-border p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <History size={18} className="text-theme-muted" />
                 <h3 className="text-sm font-black text-theme-text uppercase tracking-widest italic">Logs de Operação</h3>
              </div>
              <button className="text-[9px] font-black text-theme-muted hover:text-brand-tactical uppercase tracking-widest transition-colors flex items-center gap-1">
                Ver Tudo <ExternalLink size={10} />
              </button>
            </div>

            <div className="space-y-1">
               {[1, 2, 3].map(i => (
                 <div key={i} className="flex items-center justify-between py-3 border-b border-theme-border/5 last:border-0 group cursor-default">
                    <div className="flex items-center gap-4">
                       <span className="text-[9px] font-black text-theme-muted tabular-nums opacity-40">14:3{i}</span>
                       <p className="text-[11px] font-black text-theme-text uppercase tracking-tight group-hover:text-brand-tactical transition-colors">Impressão realizada: Hub B2B Automático</p>
                    </div>
                    <span className="text-[9px] font-black text-brand-tactical italic">-1 CRÉDITO</span>
                 </div>
               ))}
            </div>
          </div>
        </div>

        {/* COLUNA 2: NETWORKING & REFERRALS */}
        <div className="space-y-8">
          <div className="bg-theme-bg-muted border border-theme-border p-8 space-y-8 border-brand-tactical/20">
            <div className="space-y-2">
              <Users size={28} className="text-brand-tactical" />
              <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tighter">Minha Rede</h3>
              <p className="text-[10px] text-theme-muted font-black leading-relaxed uppercase tracking-tight">
                Indique fotógrafos e expanda sua capilaridade regional.
              </p>
            </div>

            {/* REFERRAL TOOL */}
            <div className="space-y-4">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Seu Link de Indicação</span>
              <div className="flex bg-black/40 border border-theme-border p-1">
                <input 
                  type="text" 
                  readOnly 
                  value={referralCode ? `${window.location.host}/register?ref=${referralCode}` : "Gerando..."}
                  className="bg-transparent border-0 flex-1 px-4 text-[10px] font-black text-theme-text focus:ring-0 truncate"
                />
                <button onClick={copyReferral} className="bg-brand-tactical p-3 text-zinc-950 hover:bg-white transition-colors">
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {/* PARTNER LIST (CARDS) */}
            <div className="space-y-4 pt-4">
              <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-60">Parceiros Vinculados ({partners.length})</span>
              <div className="space-y-3">
                {partners.length === 0 ? (
                  <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-40 py-4 text-center border border-dashed border-theme-border">
                    Nenhum parceiro vinculado ainda.
                  </p>
                ) : partners.map(p => (
                  <div key={p.id} className="p-4 border border-theme-border hover:border-brand-tactical/30 transition-all group">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-theme-text uppercase tracking-tight">{p.user.nome}</span>
                      <span className={`text-[8px] font-black px-2 py-0.5 ${p.user.isVerified ? 'bg-brand-tactical text-zinc-950' : 'bg-zinc-800 text-zinc-400'} uppercase`}>
                        {p.user.isVerified ? 'VERIFIED' : 'PENDING'}
                      </span>
                    </div>
                    <div className="flex justify-between items-end">
                      <span className="text-[9px] font-black text-theme-muted uppercase tracking-widest opacity-40">Experiência</span>
                      <span className="text-[11px] font-black text-theme-text italic">{p.user.profissional?.experienceYears || 0} Anos</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* B2B WHITE-LABEL SETTINGS */}
            <div className="space-y-4 pt-4 border-t border-theme-border/20">
              <div className="flex items-center gap-2 mb-4">
                <Palette size={16} className="text-brand-tactical" />
                <span className="text-[10px] font-black text-theme-muted uppercase tracking-widest opacity-80">White-Label (B2B)</span>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-theme-muted block mb-2">URL da Logo</label>
                  <input 
                    type="url" 
                    value={branding.logoUrl}
                    onChange={(e) => setBranding(prev => ({...prev, logoUrl: e.target.value}))}
                    placeholder="https://sua-logo.com/img.png"
                    className="w-full bg-black/40 border border-theme-border p-3 text-[10px] font-black text-theme-text focus:border-brand-tactical transition-colors outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-theme-muted block mb-2">Cor da Marca (Hex)</label>
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
                      className="flex-1 bg-black/40 border border-theme-border p-3 text-[10px] font-black text-theme-text focus:border-brand-tactical transition-colors outline-none"
                    />
                  </div>
                </div>
                <button 
                  onClick={handleSaveBranding}
                  disabled={savingBranding}
                  className="w-full py-4 bg-brand-tactical/10 text-brand-tactical hover:bg-brand-tactical hover:text-zinc-950 transition-all text-[9px] font-black uppercase tracking-[0.3em] disabled:opacity-50"
                >
                  {savingBranding ? 'Salvando...' : 'Salvar Customização'}
                </button>
              </div>
            </div>
          </div>

          {/* PASSIVE INCOME LIST & COHORT INTEL */}
          <div className="bg-theme-bg-muted border border-theme-border p-8 space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-theme-text uppercase tracking-widest italic">Comissões & Fechamento</h3>
              <button 
                onClick={handleExportCSV}
                className="text-[9px] font-black text-brand-tactical border border-brand-tactical/30 px-3 py-1.5 uppercase tracking-widest hover:bg-brand-tactical hover:text-black transition-colors"
              >
                Exportar CSV
              </button>
            </div>

            {/* COHORT INTEL METRICS */}
            {finance.intel && (
              <div className="grid grid-cols-3 gap-4 pb-6 border-b border-theme-border/20">
                <div>
                  <span className="block text-[8px] font-black text-theme-muted uppercase tracking-widest">Eventos da Rede</span>
                  <span className="text-lg font-black text-white">{finance.intel.networkEvents}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-theme-muted uppercase tracking-widest">Pedidos (Vendas)</span>
                  <span className="text-lg font-black text-white">{finance.intel.networkOrders}</span>
                </div>
                <div>
                  <span className="block text-[8px] font-black text-theme-muted uppercase tracking-widest">Conv. (Orders/Event)</span>
                  <span className="text-lg font-black text-brand-tactical">{finance.intel.avgOrdersPerEvent}</span>
                </div>
              </div>
            )}

            <div className="space-y-4">
              {finance.recentCommissions.length === 0 ? (
                <p className="text-[9px] text-theme-muted uppercase tracking-widest opacity-40 py-4 text-center border border-dashed border-theme-border">
                  Nenhuma comissão passiva registrada.
                </p>
              ) : finance.recentCommissions.map(c => (
                <div key={c.id} className="flex flex-col gap-1 py-3 border-b border-theme-border/10 last:border-0">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-theme-text uppercase truncate max-w-[140px]">{c.eventTitle}</span>
                    <span className="text-[11px] font-black text-blue-400">+{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(c.amount)}</span>
                  </div>
                  <span className="text-[8px] font-black text-theme-muted uppercase tracking-tighter opacity-40">{new Date(c.date).toLocaleDateString('pt-BR')}</span>
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

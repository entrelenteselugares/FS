import { useState, useEffect } from 'react';
import { API } from '../lib/api';
import { Share2, Users, Banknote, Trophy, Copy, Check, Clock } from 'lucide-react';
import { toast } from 'sonner';

function formatCurrency(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

interface AffiliateData {
  tier: 'STANDARD' | 'VIP';
  referralCode: string;
  totalL1: number;
  totalL2: number;
  commissionsL1: number;
  commissionsL2: number;
  pendingPayout: number;
  availablePayout: number;
}

export function AffiliateDashboard() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await API.get('/affiliate/dashboard');
        setData(res.data);
      } catch (err) {
        console.error("Erro ao carregar dados de afiliado", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopy = () => {
    if (!data) return;
    const link = `${window.location.origin}/register?ref=${data.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 pt-24">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-theme-card border border-theme-border rounded-2xl p-6 h-[120px] animate-pulse flex flex-col justify-between">
             <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-theme-bg-muted rounded-xl border border-white/10" />
                <div className="w-20 h-4 bg-theme-bg-muted rounded border border-white/10" />
             </div>
             <div className="w-full h-8 bg-theme-bg-muted rounded border border-white/10 mt-auto" />
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-12 text-center border  border-theme-border rounded-2xl bg-theme-bg-muted/5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted ">Não foi possível carregar as informações do seu painel de indicações.</p>
      </div>
    );
  }

  const isVip = data.tier === 'VIP';

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header & Link */}
      <div className={`p-8 rounded-2xl border transition-all duration-500 ${
        isVip 
          ? 'bg-gradient-to-r from-brand-tactical/10 to-amber-600/10 border-brand-tactical/30 shadow-[0_0_30px_rgba(242,193,46,0.03)]' 
          : 'bg-theme-bg border-theme-border hover:border-theme-border'
      }`}>
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-theme-text uppercase flex items-center gap-2">
              <Share2 className="text-brand-tactical" size={22} />
              Indique e Ganhe
              {isVip && <span className="text-[8px] px-2 py-0.5 bg-brand-tactical text-black font-bold uppercase tracking-widest rounded-full ml-2">Conta VIP</span>}
            </h2>
            <p className="text-xs text-theme-text-muted max-w-lg leading-relaxed">
              Compartilhe seu link exclusivo e ganhe comissões em todas as compras dos seus indicados.
            </p>
          </div>

          <div className="w-full lg:w-auto space-y-2">
            <label className="text-[9px] font-bold uppercase tracking-widest text-theme-text-muted block ">Seu Link de Convite</label>
            <div className="flex items-center gap-2">
              <code className="bg-theme-bg-field px-4 py-2.5 rounded-xl text-theme-text-muted font-mono text-xs border border-theme-border flex items-center min-h-[44px] select-all truncate max-w-xs md:max-w-md">
                {window.location.host}/register?ref={data.referralCode}
              </code>
              <button 
                onClick={handleCopy}
                className="p-2.5 bg-brand-tactical/10 hover:bg-brand-tactical/20 border border-brand-tactical/30 rounded-xl transition-all text-brand-tactical shrink-0"
              >
                {copied ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        {/* L1 Network */}
        <div className="bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl hover:border-theme-border transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8" />
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-brand-tactical/10 text-brand-tactical rounded-xl border border-brand-tactical/20">
              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Indicados Diretos</h3>
          </div>
          <p className="text-2xl sm:text-4xl font-heading font-bold text-theme-text leading-none">{data.totalL1}</p>
        </div>

        {/* L1 Earnings */}
        <div className="bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl hover:border-theme-border transition-all duration-500 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8" />
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Ganhos Diretos (L1)</h3>
          </div>
          <p className="text-xl sm:text-3xl font-heading font-bold text-emerald-400 leading-none">
            {formatCurrency(data.commissionsL1 || 0)}
          </p>
        </div>

        {/* L2 Network */}
        <div className={`bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isVip ? 'hover:border-theme-border' : 'opacity-80 grayscale'}`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8" />
          {!isVip && (
             <div className="absolute inset-0 bg-theme-bg/95 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-3 sm:p-4 text-center">
               <Trophy size={14} className="text-brand-tactical mb-0.5 sm:mb-1 animate-bounce sm:w-4 sm:h-4" />
               <span className="text-[7px] sm:text-[8px] text-brand-tactical font-bold uppercase tracking-widest">Exclusivo VIP</span>
             </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Users size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Rede Indireta (L2)</h3>
          </div>
          <p className="text-2xl sm:text-4xl font-heading font-bold text-theme-text leading-none">{data.totalL2}</p>
        </div>

        {/* L2 Earnings */}
        <div className={`bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl transition-all duration-500 group relative overflow-hidden ${isVip ? 'hover:border-theme-border' : 'opacity-80 grayscale'}`}>
          <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8" />
           {!isVip && (
             <div className="absolute inset-0 bg-theme-bg/95 backdrop-blur-[1px] flex flex-col items-center justify-center z-10 p-3 sm:p-4 text-center">
               <span className="text-[7px] sm:text-[8px] text-brand-tactical font-bold uppercase tracking-widest">Seja VIP para Ganhar</span>
             </div>
          )}
          <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
            <div className="p-1.5 sm:p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
            </div>
            <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Ganhos de Rede (L2)</h3>
          </div>
          <p className="text-xl sm:text-3xl font-heading font-bold text-emerald-400 leading-none">
            {formatCurrency(data.commissionsL2 || 0)}
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="h-px w-6 bg-theme-border/40" />
          <p className="text-[9px] font-bold text-theme-text-muted uppercase tracking-[0.3em]">Resumo de Ganhos</p>
        </div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-6">
           {/* Liberado para Saque Card */}
           <div className="bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl hover:border-theme-border transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-brand-tactical/10 text-brand-tactical rounded-xl border border-brand-tactical/20">
                  <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Liberado para Saque</h3>
              </div>
              <p className="text-xl sm:text-3xl font-heading font-bold text-brand-tactical leading-none">
                {formatCurrency(data.availablePayout || 0)}
              </p>
           </div>

           {/* Em Processamento Card */}
           <div className="bg-theme-bg border border-theme-border p-4 sm:p-6 rounded-2xl hover:border-theme-border transition-all duration-500 group relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-white/5 to-transparent rotate-45 translate-x-8 -translate-y-8 pointer-events-none" />
              <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-4">
                <div className="p-1.5 sm:p-2 bg-theme-bg-muted text-theme-text-muted rounded-xl border border-theme-border">
                  <Clock size={16} className="sm:w-[18px] sm:h-[18px]" />
                </div>
                <h3 className="text-[8px] sm:text-[9px] font-bold text-theme-text-muted uppercase tracking-widest">Em Processamento</h3>
              </div>
              <p className="text-xl sm:text-3xl font-heading font-bold text-theme-text-muted leading-none">
                {formatCurrency(data.pendingPayout || 0)}
              </p>
           </div>
        </div>
      </div>

      {/* Help Note */}
      {!isVip && (
        <div className="p-6 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Trophy className="text-brand-tactical mt-0.5 shrink-0" size={20} />
          <div className="space-y-1">
            <h4 className="font-heading font-bold text-brand-tactical uppercase tracking-widest text-[11px] ">Quer faturar na profundidade?</h4>
            <p className="text-xs text-theme-text-muted leading-relaxed">
              Atualmente você ganha comissões apenas das suas indicações diretas. Nossos parceiros <span className="text-brand-tactical font-bold">VIP</span> também ganham sobre as vendas da segunda geração (indicados dos seus indicados). Fale com o suporte técnico para saber como se qualificar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}


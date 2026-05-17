import { useState, useEffect } from 'react';
import { API } from '../lib/api';
import { Share2, Users, Banknote, Trophy, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

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
    return <div className="p-8 text-center animate-pulse">Carregando seu painel de afiliado...</div>;
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-gray-500">
        Não foi possível carregar as informações do seu painel de indicações.
      </div>
    );
  }

  const isVip = data.tier === 'VIP';

  return (
    <div className="space-y-6">
      {/* Header & Link */}
      <div className={`p-6 rounded-2xl ${isVip ? 'bg-gradient-to-r from-yellow-500/20 to-amber-600/20 border border-yellow-500/30' : 'bg-fs-800 border border-fs-700'}`}>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Share2 className={isVip ? 'text-yellow-500' : 'text-blue-500'} size={24} />
              Indique e Ganhe
              {isVip && <span className="text-xs px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full font-medium ml-2">Conta VIP</span>}
            </h2>
            <p className="text-gray-400 mt-1">
              Compartilhe seu link exclusivo e ganhe comissões em todas as compras dos seus indicados.
            </p>
          </div>

          <div className="w-full md:w-auto">
            <label className="text-xs text-gray-400 mb-1 block">Seu Link de Convite</label>
            <div className="flex items-center gap-2">
              <code className="bg-fs-900 px-3 py-2 rounded-lg text-fs-300 font-mono text-sm border border-fs-700">
                {window.location.host}/register?ref={data.referralCode}
              </code>
              <button 
                onClick={handleCopy}
                className="p-2 bg-fs-700 hover:bg-fs-600 rounded-lg transition-colors"
              >
                {copied ? <Check size={18} className="text-green-400" /> : <Copy size={18} className="text-gray-300" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* L1 Network */}
        <div className="bg-fs-800 border border-fs-700 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Indicados Diretos</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalL1}</p>
        </div>

        {/* L1 Earnings */}
        <div className="bg-fs-800 border border-fs-700 p-5 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
              <Banknote size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Ganhos Diretos (L1)</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {(data.commissionsL1 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>

        {/* L2 Network */}
        <div className="bg-fs-800 border border-fs-700 p-5 rounded-2xl relative overflow-hidden">
          {!isVip && (
             <div className="absolute inset-0 bg-fs-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
               <Trophy size={20} className="text-yellow-500 mb-1 opacity-50" />
               <span className="text-xs text-yellow-500 font-medium">Exclusivo VIP</span>
             </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/20 text-purple-400 rounded-lg">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Rede Indireta (L2)</h3>
          </div>
          <p className="text-3xl font-bold text-white">{data.totalL2}</p>
        </div>

        {/* L2 Earnings */}
        <div className="bg-fs-800 border border-fs-700 p-5 rounded-2xl relative overflow-hidden">
           {!isVip && (
             <div className="absolute inset-0 bg-fs-900/80 backdrop-blur-[2px] flex flex-col items-center justify-center z-10">
               <span className="text-xs text-yellow-500 font-medium">Torne-se VIP para ganhar</span>
             </div>
          )}
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-500/20 text-green-400 rounded-lg">
              <Banknote size={20} />
            </div>
            <h3 className="text-sm font-medium text-gray-400">Ganhos de Rede (L2)</h3>
          </div>
          <p className="text-3xl font-bold text-white">
            R$ {(data.commissionsL2 || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* Summary Box */}
      <div className="bg-fs-800 border border-fs-700 p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white">Resumo de Ganhos</h3>
          <p className="text-sm text-gray-400">Seu saldo acumulado com indicações</p>
        </div>
        
        <div className="flex gap-8">
           <div className="text-right">
             <span className="block text-sm text-gray-400">Liberado para Saque</span>
             <span className="text-2xl font-bold text-green-400">
               R$ {(data.availablePayout || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
           </div>
           <div className="text-right">
             <span className="block text-sm text-gray-400">Em Processamento</span>
             <span className="text-xl font-bold text-gray-300">
               R$ {(data.pendingPayout || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
             </span>
           </div>
        </div>
      </div>

      {/* Help Note */}
      {!isVip && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-start gap-3">
          <Trophy className="text-yellow-500 text-xl flex-shrink-0 mt-1" size={24} />
          <div>
            <h4 className="font-bold text-yellow-500">Quer ganhar na profundidade?</h4>
            <p className="text-sm text-yellow-200/80 mt-1">
              Atualmente você ganha comissões apenas das suas indicações diretas. Nossos parceiros VIP também ganham sobre as vendas da segunda geração (indicados dos seus indicados). Fale com o suporte para saber como se qualificar.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

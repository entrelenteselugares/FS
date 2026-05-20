import React, { useState, useEffect } from 'react';
import { API } from '../../lib/api';
import { 
  Users, 
  ShoppingBag, 
  TrendingDown, 
  Mail, 
  MessageCircle, 
  Clock,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Lead {
  id: string;
  email: string;
  source: string;
  createdAt: string;
  event?: {
    nomeNoivos: string;
  };
}

interface AbandonedCart {
  id: string;
  valor: number;
  createdAt: string;
  event: {
    nomeNoivos: string;
  };
  cliente?: {
    nome: string;
    email: string;
    whatsapp: string;
  };
  buyerEmail?: string;
  buyerWhatsapp?: string;
  recoverySentAt?: string;
}

export const AdminLeadsPage: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [abandoned, setAbandoned] = useState<AbandonedCart[]>([]);
  const [stats, setStats] = useState({ totalSent: 0, recoveredCount: 0, recoveredRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'leads' | 'abandoned'>('abandoned');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [leadsRes, abandonedRes, statsRes] = await Promise.all([
          API.get('/admin/crm/leads'),
          API.get('/admin/crm/abandoned-carts'),
          API.get('/admin/crm/stats')
        ]);
        setLeads(leadsRes.data);
        setAbandoned(abandonedRes.data);
        setStats(statsRes.data);
      } catch (err) {
        console.error('[AdminLeads] Error fetching CRM data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);


  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center gap-6">
        <div className="w-px h-8 bg-gradient-to-b from-transparent via-brand-tactical to-transparent" />
        <div className="text-[10px] font-display font-black uppercase tracking-[0.3em] text-brand-tactical/40 animate-pulse">Sincronizando Leads...</div>
      </div>
    );
  }

  return (
    <div className="space-y-12 animate-in fade-in duration-500">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            CRM & <span className="text-brand-tactical">Leads</span>
          </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Funil de Vendas e Prospecção</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Header */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-theme-bg-muted border border-theme-border rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-theme-text-muted">
            <Users size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Total Leads</span>
          </div>
          <div className="text-4xl font-heading font-black italic text-theme-text">{leads.length}</div>
          <p className="text-[9px] text-theme-text-muted uppercase font-bold tracking-widest leading-relaxed">Capturados via formulário na galeria.</p>
        </div>

        <div className="bg-theme-bg-muted border border-theme-border rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-orange-500">
            <ShoppingBag size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Abandono de Checkout</span>
          </div>
          <div className="text-4xl font-heading font-black italic text-theme-text">{abandoned.length}</div>
          <p className="text-[9px] text-theme-text-muted uppercase font-bold tracking-widest leading-relaxed">Pedidos pendentes há mais de 1 hora.</p>
        </div>

        <div className="bg-brand-tactical/10 border border-brand-tactical/30 rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-brand-tactical">
            <TrendingDown size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Receita Recuperada</span>
          </div>
          <div className="text-4xl font-heading font-black italic text-brand-tactical">R$ {stats.recoveredRevenue.toFixed(2)}</div>
          <p className="text-[9px] text-brand-tactical/60 uppercase font-bold tracking-widest leading-relaxed">Impacto real das automações de CRM.</p>
        </div>

        <div className="bg-theme-bg-muted border border-theme-border rounded-2xl p-8 space-y-4 shadow-sm">
          <div className="flex items-center gap-3 text-theme-text-muted">
            <TrendingDown size={16} />
            <span className="text-[10px] font-black uppercase tracking-widest">Taxa de Conversão</span>
          </div>
          <div className="text-4xl font-heading font-black italic text-theme-text">
            {stats.totalSent > 0 ? ((stats.recoveredCount / stats.totalSent) * 100).toFixed(1) : 0}%
          </div>
          <p className="text-[9px] text-theme-text-muted uppercase font-bold tracking-widest leading-relaxed">Eficiência dos disparos automáticos.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-8 border-b border-theme-border">
        <button 
          onClick={() => setActiveSubTab('abandoned')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeSubTab === 'abandoned' ? 'text-brand-tactical' : 'text-theme-text-muted'}`}
        >
          Carrinhos Abandonados
          {activeSubTab === 'abandoned' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-tactical" />}
        </button>
        <button 
          onClick={() => setActiveSubTab('leads')}
          className={`pb-4 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeSubTab === 'leads' ? 'text-brand-tactical' : 'text-theme-text-muted'}`}
        >
          Leads Capturados
          {activeSubTab === 'leads' && <motion.div layoutId="subtab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-tactical" />}
        </button>
      </div>

      {/* Content */}
      <div className="bg-theme-bg-muted/30 border border-theme-border overflow-x-auto w-full rounded-2xl">
        {activeSubTab === 'abandoned' ? (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Cliente / Contato</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Evento</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Valor</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Início</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted text-right">Ações de Recuperação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {abandoned.map((item) => (
                <tr key={item.id} className="hover:bg-brand-tactical/5 transition-colors group">
                  <td className="p-6">
                    <div className="space-y-1">
                      <div className="text-[10px] font-black text-theme-text uppercase italic">{item.cliente?.nome || 'Cliente não identificado'}</div>
                      <div className="text-[9px] font-bold text-theme-text-muted lowercase flex items-center gap-2">
                        {item.cliente?.email || item.buyerEmail}
                        {item.recoverySentAt && (
                          <span className="px-2 py-0.5 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/20 rounded-full text-[7px] font-black uppercase">
                            Lembrete Enviado
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-6">
                    <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-text-muted">{item.event.nomeNoivos}</span>
                  </td>
                  <td className="p-6">
                    <span className="text-xs font-heading font-black italic text-theme-text">R$ {Number(item.valor).toFixed(2)}</span>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center gap-2 text-theme-text-muted">
                      <Clock size={12} />
                      <span className="text-[9px] font-bold">{new Date(item.createdAt).toLocaleString('pt-BR')}</span>
                    </div>
                  </td>
                  <td className="p-6">
                    <div className="flex items-center justify-end gap-3">
                      {(item.cliente?.whatsapp || item.buyerWhatsapp) && (
                        <button 
                          onClick={() => window.open(`https://wa.me/${(item.cliente?.whatsapp || item.buyerWhatsapp)?.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Vimos que você iniciou um pedido no Foto Segundo para o evento ' + item.event.nomeNoivos + '. Ficou com alguma dúvida?')}`, '_blank')}
                          className="p-2 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366] hover:text-white transition-all rounded-lg"
                        >
                          <MessageCircle size={14} />
                        </button>
                      )}
                      <button 
                        onClick={() => window.open(`mailto:${item.cliente?.email || item.buyerEmail}?subject=${encodeURIComponent('Seu pedido no Foto Segundo')}`, '_blank')}
                        className="p-2 bg-brand-tactical/10 text-brand-tactical hover:bg-brand-tactical hover:text-black transition-all rounded-lg"
                      >
                        <Mail size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {abandoned.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhum abandono detectado na última hora.</td>
                </tr>
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme-border">
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Email do Lead</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Evento de Origem</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Data de Captura</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted">Fonte</th>
                <th className="p-6 text-[10px] font-bold uppercase tracking-wider text-theme-text-muted text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-theme-border">
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-brand-tactical/5 transition-colors">
                  <td className="p-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-brand-tactical/10 flex items-center justify-center rounded-full text-brand-tactical">
                        <UserPlus size={14} />
                      </div>
                      <span className="text-[10px] font-black text-theme-text lowercase">{lead.email}</span>
                    </div>
                  </td>
                  <td className="p-6 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-text-muted">
                    {lead.event?.nomeNoivos || 'Captação Geral'}
                  </td>
                  <td className="p-6 text-[9px] font-bold text-theme-text-muted">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="p-6">
                    <span className="px-2 py-1 bg-theme-bg border border-theme-border rounded text-[8px] font-black text-theme-text-muted uppercase tracking-widest rounded-2xl">{lead.source}</span>
                  </td>
                  <td className="p-6 text-right">
                    <button 
                      onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
                      className="text-brand-tactical hover:text-white transition-colors"
                    >
                      <ArrowRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-[10px] font-black text-zinc-600 uppercase tracking-widest">Nenhum lead capturado ainda.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminLeadsPage;

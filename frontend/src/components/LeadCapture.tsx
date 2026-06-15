import React, { useState } from 'react';
import { Mail, CheckCircle2, ArrowRight } from 'lucide-react';
import { API } from '../lib/api';

interface LeadCaptureProps {
  eventId: string;
}

const LeadCapture: React.FC<LeadCaptureProps> = ({ eventId }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      await API.post('/public/crm/leads', {
        email,
        eventId,
        source: 'EVENT_GALLERY'
      });
      setSuccess(true);
    } catch (err) {
      console.error('[LeadCapture] Error:', err);
      alert('Erro ao salvar contato. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="p-8 bg-brand-tactical/10 border border-brand-tactical/30 text-center space-y-4 animate-in fade-in zoom-in duration-500">
        <CheckCircle2 size={32} className="mx-auto text-brand-tactical" />
        <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest">
          Contato Sincronizado!
        </p>
        <p className="text-[9px] text-theme-muted uppercase font-bold leading-relaxed">
          Você será avisado sobre novas capturas e promoções deste evento.
        </p>
      </div>
    );
  }

  return (
    <div className="relative p-8 overflow-hidden rounded-[24px] border border-theme-border shadow-2xl bg-gradient-to-br from-theme-bg-muted to-theme-bg group">
      <div className="absolute -top-12 -right-12 w-32 h-32 bg-brand-tactical/10 blur-3xl rounded-full group-hover:bg-brand-tactical/20 transition-all duration-700" />
      <div className="relative z-10 space-y-6">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.4em]">Convite VIP</p>
          <h3 className="text-xl font-bold uppercase text-theme-text">Acesso Prioritário</h3>
        </div>
        
        <p className="text-[9px] text-theme-text-muted uppercase font-bold leading-relaxed">
          Cadastre seu e-mail para receber notificações em tempo real e promoções exclusivas desta galeria.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
            <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-text-muted" />
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-theme-bg/50 backdrop-blur-sm border border-theme-border px-10 py-4 text-xs font-medium text-theme-text placeholder:text-theme-text-muted/50 focus:border-brand-tactical transition-all outline-none rounded-xl"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-theme-text text-theme-bg text-[10px] font-bold uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2 shadow-lg"
          >
            {loading ? "PROCESSANDO..." : "GARANTIR ACESSO VIP"}
            <ArrowRight size={14} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default LeadCapture;

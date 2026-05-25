import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { API } from "../../lib/api";
import { Check, X, FileText, User as UserIcon, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Application {
  id: string;
  nome: string;
  email: string;
  role: string;
  createdAt: string;
  verificationDocs: unknown;
  profissional?: {
    services: string[];
    otherHabilities: string;
  };
  cartorio?: {
    razaoSocial: string;
    cidade: string;
    cnpj: string;
  };
}

export const AdminApprovalHub: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/applications");
      setApplications(data);
    } catch (err) {
      console.error("Erro ao carregar aplicações:", err);
      toast.error("Erro ao carregar solicitações de aprovação.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setProcessingId(id);
    try {
      await API.patch(`/admin/applications/${id}/${action}`);
      setApplications(prev => prev.filter(a => a.id !== id));
      toast.success(action === 'approve' ? "Solicitação aprovada com sucesso! 🛡️" : "Solicitação rejeitada com sucesso. 🚫");
    } catch (err) {
      console.error(`Erro ao ${action} aplicação:`, err);
      toast.error(action === 'approve' ? "Erro ao aprovar solicitação." : "Erro ao rejeitar solicitação.");
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/10 animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic rounded-2xl">
        Sincronizando Solicitações Pendentes...

      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div className="space-y-4 min-w-0">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Central de <span className="text-brand-tactical">Aprovações</span>
          </h1>
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-brand-tactical" />
              <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Auditoria de Cadastros e Saques</p>
            </div>
          </div>
        </div>
      </div>

      {applications.length === 0 ? (
        <div className="bg-theme-surface border border-theme-border/60 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 bg-brand-tactical/10 rounded-full flex items-center justify-center text-brand-tactical">
            <Check size={24} />
          </div>
          <p className="text-theme-muted text-sm">Nenhuma aplicação pendente no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <AnimatePresence>
            {applications.map((app) => (
              <motion.div
                key={app.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-theme-surface border border-theme-border/60 rounded-2xl overflow-hidden group hover:border-brand-tactical/50 transition-all duration-300"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-tactical/10 rounded-xl flex items-center justify-center text-brand-tactical">
                        {app.role === 'PROFISSIONAL' ? <UserIcon size={20} /> : <Building2 size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-theme-text text-sm tracking-tight">{app.nome}</h3>
                        <p className="text-[10px] text-theme-muted font-mono">{app.email}</p>
                      </div>
                    </div>
                    <div className="bg-brand-tactical/10 text-brand-tactical text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest">
                      {app.role}
                    </div>
                  </div>

                  <div className="bg-theme-background rounded-xl p-4 space-y-3">
                    {app.role === 'PROFISSIONAL' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-theme-muted">
                          <FileText size={12} />
                          <span className="text-[10px] uppercase tracking-wider font-bold">Portfólio / Serviços</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {app.profissional?.services?.map(s => (
                            <span key={s} className="bg-theme-surface text-theme-text text-[9px] px-1.5 py-0.5 rounded border border-theme-border/60">{s}</span>
                          ))}
                        </div>
                        {app.profissional?.otherHabilities && (
                          <p className="text-[10px] text-theme-muted line-clamp-2 italic">"{app.profissional.otherHabilities}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-theme-muted">
                          <Building2 size={12} />
                          <span className="text-[10px] uppercase tracking-wider font-bold">Dados da Unidade</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <p className="text-brand-tactical uppercase font-black tracking-tighter">CNPJ</p>
                            <p className="text-theme-text font-mono">{app.cartorio?.cnpj}</p>
                          </div>
                          <div>
                            <p className="text-brand-tactical uppercase font-black tracking-tighter">Cidade</p>
                            <p className="text-theme-text">{app.cartorio?.cidade}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(app.id, 'approve')}
                      disabled={processingId === app.id}
                      className="flex-1 h-9 bg-brand-tactical hover:bg-brand-tactical/90 disabled:opacity-50 text-brand-text text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-tactical/20"
                    >
                      {processingId === app.id ? "Processando..." : <><Check size={14} /> Aprovar</>}
                    </button>
                    <button
                      onClick={() => handleAction(app.id, 'reject')}
                      disabled={processingId === app.id}
                      className="w-9 h-9 border border-theme-border/60 text-theme-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

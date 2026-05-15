import React, { useState, useEffect } from "react";
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
    } catch (err) {
      console.error(`Erro ao ${action} aplicação:`, err);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-bold text-white uppercase tracking-wider">Hub de Aprovações</h2>
        <p className="text-white/40 text-xs font-medium">Gerencie novas solicitações de profissionais e unidades fixas.</p>
      </div>

      {applications.length === 0 ? (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center text-white/20">
            <Check size={24} />
          </div>
          <p className="text-white/60 text-sm">Nenhuma aplicação pendente no momento.</p>
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
                className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden group hover:border-emerald-500/30 transition-all duration-300"
              >
                <div className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-500">
                        {app.role === 'PROFISSIONAL' ? <UserIcon size={20} /> : <Building2 size={20} />}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-sm tracking-tight">{app.nome}</h3>
                        <p className="text-[10px] text-white/40 font-mono">{app.email}</p>
                      </div>
                    </div>
                    <div className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black uppercase px-2 py-1 rounded-md tracking-widest">
                      {app.role}
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-4 space-y-3">
                    {app.role === 'PROFISSIONAL' ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/40">
                          <FileText size={12} />
                          <span className="text-[10px] uppercase tracking-wider font-bold">Portfólio / Serviços</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {app.profissional?.services?.map(s => (
                            <span key={s} className="bg-white/5 text-white/60 text-[9px] px-1.5 py-0.5 rounded border border-white/5">{s}</span>
                          ))}
                        </div>
                        {app.profissional?.otherHabilities && (
                          <p className="text-[10px] text-white/60 line-clamp-2 italic">"{app.profissional.otherHabilities}"</p>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-white/40">
                          <Building2 size={12} />
                          <span className="text-[10px] uppercase tracking-wider font-bold">Dados da Unidade</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <p className="text-white/20 uppercase font-black tracking-tighter">CNPJ</p>
                            <p className="text-white/60 font-mono">{app.cartorio?.cnpj}</p>
                          </div>
                          <div>
                            <p className="text-white/20 uppercase font-black tracking-tighter">Cidade</p>
                            <p className="text-white/60">{app.cartorio?.cidade}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAction(app.id, 'approve')}
                      disabled={processingId === app.id}
                      className="flex-1 h-9 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all"
                    >
                      {processingId === app.id ? "Processando..." : <><Check size={14} /> Aprovar</>}
                    </button>
                    <button
                      onClick={() => handleAction(app.id, 'reject')}
                      disabled={processingId === app.id}
                      className="w-9 h-9 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center transition-all"
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

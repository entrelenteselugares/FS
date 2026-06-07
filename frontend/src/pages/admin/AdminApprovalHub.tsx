import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { API } from "../../lib/api";
import { Check, X, FileText, User as UserIcon, Building2, Clock, ExternalLink, ShieldCheck, Star } from "lucide-react";
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

interface ExperienceValidation {
  id: string; // profissionalId
  userId: string;
  firstJobUrl: string;
  experienceYears: number;
  isExperienceValidated: boolean;
  user: {
    id: string;
    nome: string;
    email: string;
  };
}

export const AdminApprovalHub: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [expValidations, setExpValidations] = useState<ExperienceValidation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expLoading, setExpLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"applications" | "experience">("experience");

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

  const fetchExpValidations = async () => {
    setExpLoading(true);
    try {
      const { data } = await API.get("/admin/experience-validations");
      setExpValidations(data);
    } catch (err) {
      console.error("Erro ao carregar validações:", err);
      toast.error("Erro ao carregar validações de experiência.");
    } finally {
      setExpLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    fetchExpValidations();
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

  const handleReviewExperience = async (profId: string, approve: boolean) => {
    setProcessingId(profId);
    try {
      await API.patch(`/admin/experience-validations/${profId}/review`, { approve });
      setExpValidations(prev => prev.filter(v => v.id !== profId));
      toast.success(approve
        ? "Experiência validada! Medalha Foco de Bronze desbloqueada 🏆"
        : "Experiência reprovada. Profissional será notificado."
      );
    } catch (err) {
      console.error("Erro ao revisar experiência:", err);
      toast.error("Erro ao processar validação.");
    } finally {
      setProcessingId(null);
    }
  };

  const totalPending = applications.length + expValidations.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative border-b border-theme-border pb-8 space-y-4">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div>
            <p className="text-theme-muted mt-2 text-sm">Central de aprovações pendentes do sistema</p>
          </div>
          {totalPending > 0 && (
            <div className="px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl flex items-center gap-2">
              <Clock size={14} className="text-amber-500" />
              <span className="text-amber-500 text-[10px] font-black uppercase tracking-widest">
                {totalPending} PENDENTE{totalPending > 1 ? "S" : ""}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-theme-border pb-0">
        {([
          { key: "experience", label: "Validação de Experiência", count: expValidations.length, icon: <Star size={14} /> },
          { key: "applications", label: "Aprovações de Acesso", count: applications.length, icon: <ShieldCheck size={14} /> },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all -mb-px ${
              activeTab === tab.key
                ? "border-brand-tactical text-brand-tactical"
                : "border-transparent text-theme-muted hover:text-theme-text"
            }`}
          >
            {tab.icon}
            {tab.label}
            {tab.count > 0 && (
              <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                activeTab === tab.key
                  ? "bg-brand-tactical text-black"
                  : "bg-theme-border text-theme-muted"
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── TAB: VALIDAÇÃO DE EXPERIÊNCIA ── */}
      {activeTab === "experience" && (
        <div>
          {expLoading ? (
            <div className="py-24 text-center border border-theme-border bg-theme-bg animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic rounded-2xl">
              Buscando validações pendentes...
            </div>
          ) : expValidations.length === 0 ? (
            <div className="bg-theme-surface border border-theme-border rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 bg-brand-tactical/10 rounded-full flex items-center justify-center text-brand-tactical">
                <Check size={24} />
              </div>
              <p className="text-theme-muted text-sm">Nenhuma validação de experiência pendente.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-[10px] text-theme-muted uppercase tracking-widest font-black italic">
                Como funciona: O profissional informou um link de trabalho antigo para provar seus anos de experiência.
                Acesse o link, verifique a data de publicação e aprove ou reprove abaixo.
              </p>

              <AnimatePresence>
                {expValidations.map((v) => (
                  <motion.div
                    key={v.id}
                    layout
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden hover:border-brand-tactical/30 transition-all"
                  >
                    <div className="p-6 space-y-5">
                      {/* Profissional info */}
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-tactical/10 rounded-xl flex items-center justify-center text-brand-tactical font-black text-sm">
                            {v.user.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                          </div>
                          <div>
                            <h3 className="font-black text-theme-text text-sm tracking-tight">{v.user.nome}</h3>
                            <p className="text-[10px] text-theme-muted font-mono">{v.user.email}</p>
                          </div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[9px] font-black uppercase px-3 py-1.5 rounded-xl tracking-widest flex items-center gap-1.5">
                          <Clock size={10} />
                          {v.experienceYears} ANO{v.experienceYears !== 1 ? "S" : ""} DECLARADOS
                        </div>
                      </div>

                      {/* Link do trabalho */}
                      <div className="bg-theme-bg-muted border border-theme-border rounded-xl p-4 space-y-2">
                        <div className="flex items-center gap-2 text-theme-muted">
                          <FileText size={12} />
                          <span className="text-[10px] uppercase tracking-wider font-black">Link do Primeiro Trabalho</span>
                        </div>
                        <a
                          href={v.firstJobUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-brand-tactical hover:underline text-sm font-bold break-all"
                        >
                          <ExternalLink size={14} className="flex-shrink-0" />
                          {v.firstJobUrl}
                        </a>
                        <p className="text-[9px] text-theme-muted/60 font-bold uppercase tracking-widest">
                          Verifique a data de publicação deste link para confirmar o tempo de atuação declarado.
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleReviewExperience(v.id, false)}
                          disabled={processingId === v.id}
                          className="flex-1 h-10 border border-theme-border text-theme-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 rounded-xl flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <X size={14} /> Reprovar
                        </button>
                        <button
                          onClick={() => handleReviewExperience(v.id, true)}
                          disabled={processingId === v.id}
                          className="flex-[2] h-10 bg-brand-tactical hover:bg-brand-tactical/90 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-tactical/20"
                        >
                          {processingId === v.id ? "..." : <><Check size={14} /> Validar Experiência</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: APROVAÇÕES DE ACESSO ── */}
      {activeTab === "applications" && (
        <div>
          {loading ? (
            <div className="py-24 text-center border border-theme-border bg-theme-bg animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic rounded-2xl">
              Sincronizando Solicitações Pendentes...
            </div>
          ) : applications.length === 0 ? (
            <div className="bg-theme-surface border border-theme-border rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
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
                    className="bg-theme-surface border border-theme-border rounded-2xl overflow-hidden group hover:border-brand-tactical/50 transition-all duration-300"
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
                                <span key={s} className="bg-theme-surface text-theme-text text-[9px] px-1.5 py-0.5 rounded border border-theme-border">{s}</span>
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
                                <p className="text-theme-text font-mono">{app.cartorio?.cnpj || <span className="text-theme-muted italic text-[9px]">Não informado</span>}</p>
                              </div>
                              <div>
                                <p className="text-brand-tactical uppercase font-black tracking-tighter">Cidade</p>
                                <p className="text-theme-text">{app.cartorio?.cidade || <span className="text-theme-muted italic text-[9px]">Não informada</span>}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleAction(app.id, 'reject')}
                          disabled={processingId === app.id}
                          className="flex-1 h-9 border border-theme-border text-theme-muted hover:text-red-500 hover:border-red-500/50 hover:bg-red-500/10 rounded-lg flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest"
                        >
                          <X size={14} /> Reprovar
                        </button>
                        <button
                          onClick={() => handleAction(app.id, 'approve')}
                          disabled={processingId === app.id}
                          className="flex-1 h-9 bg-brand-tactical hover:bg-brand-tactical/90 disabled:opacity-50 text-black text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-tactical/20"
                        >
                          {processingId === app.id ? "..." : <><Check size={14} /> Aprovar</>}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

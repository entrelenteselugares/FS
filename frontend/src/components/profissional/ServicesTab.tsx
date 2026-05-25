import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Clock, TrendingUp, Check, X, ShieldCheck, Zap, Pencil, Plus, AlertCircle } from "lucide-react";
import type { ProfileData, ServiceCatalog } from "./types";

interface ServicesTabProps {
  profile: ProfileData | null;
  catalogServices: ServiceCatalog[];
  onAddService: (cat: ServiceCatalog) => void;
  onRemoveService: (serviceId: string) => void;
  onOpenProfile: () => void;
  minHourlyRate?: number;
  onUpdateServicePrice?: (serviceId: string, newPrice: number) => Promise<void>;
}

export function ServicesTab({ profile, catalogServices, onAddService, onRemoveService, onOpenProfile, minHourlyRate = 14, onUpdateServicePrice }: ServicesTabProps) {
  const navigate = useNavigate();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingPriceValue, setEditingPriceValue] = useState<string>("");
  const [loadingUpdate, setLoadingUpdate] = useState<boolean>(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSavePrice = async (serviceId: string, estimatedMinutes?: number) => {
    if (!onUpdateServicePrice) return;
    
    const priceNum = parseFloat(editingPriceValue);
    if (isNaN(priceNum) || priceNum < 0) {
      setLocalError("Preço inválido.");
      return;
    }

    if (estimatedMinutes && estimatedMinutes > 0) {
      const minPrice = minHourlyRate * (estimatedMinutes / 60);
      if (priceNum < minPrice) {
        setLocalError(`Mínimo R$ ${minPrice.toFixed(2)} (${estimatedMinutes}m)`);
        return;
      }
    }

    setLoadingUpdate(true);
    setLocalError(null);
    try {
      await onUpdateServicePrice(serviceId, priceNum);
      setEditingServiceId(null);
    } catch (err: any) {
      const errMsg = err?.response?.data?.details || err?.response?.data?.error || "Erro ao atualizar preço.";
      setLocalError(errMsg);
    } finally {
      setLoadingUpdate(false);
    }
  };

  const getStatusBadge = (status?: string, note?: string | null) => {
    switch (status) {
      case "PENDING_REVIEW":
        return <span className="px-2 py-0.5 rounded-md bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1" title="Em Análise"><Clock size={10} /> Em Análise</span>;
      case "NETWORK":
        return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1" title="Rede Global"><ShieldCheck size={10} /> Rede Global</span>;
      case "EXCLUSIVE":
        return <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1" title="Exclusivo"><Briefcase size={10} /> Exclusivo</span>;
      case "REJECTED":
        return <span className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border border-red-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1" title={note || "Recusado"}><X size={10} /> Recusado</span>;
      case "NEEDS_ADJUSTMENT":
        return <span className="px-2 py-0.5 rounded-md bg-orange-500/10 text-orange-500 border border-orange-500/20 text-[8px] font-black uppercase tracking-widest flex items-center gap-1" title={note || "Requer Ajustes"}><AlertCircle size={10} /> Requer Ajustes</span>;
      case "APPROVED":
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">

      {/* Pricing Matrix */}
      <div className="bg-theme-bg border border-theme-border/60 rounded-2xl p-4 sm:p-6 md:p-12 space-y-8 md:space-y-12">
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">
            Matriz de <span className="text-brand-tactical">Precificação</span>
          </h3>
          <p className="text-[9px] sm:text-[10px] text-theme-muted uppercase tracking-[0.2em] sm:tracking-[0.4em] italic">
            Configuração base para cálculo de orçamentos dinâmicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-12">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-bg-muted border border-theme-border/60 rounded-xl text-brand-tactical"><Clock size={16} /></div>
              <label className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Valor Hora Automático (R$)</label>
            </div>
            <div className="w-full bg-theme-bg-muted/30 border border-theme-border/40 rounded-xl p-4 sm:p-5 text-lg sm:text-xl font-heading font-black text-theme-text/40 italic flex justify-between items-center">
              <span>{Number(profile?.hourlyRate || 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
              <ShieldCheck size={16} className="text-brand-tactical animate-pulse" />
            </div>
            <p className="text-[9px] text-theme-muted uppercase italic font-bold">
              O seu valor hora é definido automaticamente pela sua meritocracia técnica.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-theme-bg-muted border border-theme-border/60 rounded-xl text-brand-tactical"><Zap size={16} /></div>
              <label className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Multiplicador Técnico</label>
            </div>
            <div className="w-full bg-theme-bg-muted/50 border border-theme-border/60 rounded-xl p-4 sm:p-5 text-lg sm:text-xl font-heading font-black text-brand-tactical italic flex justify-between items-center">
              <span>{profile?.equipmentMultiplier || "1.0"}</span>
              <span className="text-[8px] font-black uppercase text-theme-muted tracking-tighter">Nível de Ativos</span>
            </div>
            <p className="text-[9px] text-theme-muted uppercase italic font-bold">
              Gerencie seus ativos para aumentar seu potencial de ganho.{" "}
              <button onClick={onOpenProfile} className="text-brand-tactical hover:underline cursor-pointer">
                GERENCIAR INVENTÁRIO
              </button>
            </p>
          </div>
        </div>
      </div>

      {/* My Services Vitrine */}
      <div className="bg-theme-bg border border-theme-border/60 rounded-2xl p-4 sm:p-6 md:p-12 space-y-8 md:space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div className="space-y-2">
            <h3 className="text-xl sm:text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">
              Vitrine de <span className="text-brand-tactical">Ativos</span>
            </h3>
            <p className="text-[9px] sm:text-[10px] text-theme-muted uppercase tracking-[0.2em] sm:tracking-[0.4em] italic">
              Serviços ativos e disponíveis para contratação
            </p>
          </div>
          <div className="flex items-center gap-6 w-full sm:w-auto">
            <button 
              onClick={() => navigate("/profissional/novo-servico")}
              className="w-full sm:w-auto flex justify-center items-center gap-2 px-6 py-3 bg-brand-tactical/10 text-brand-tactical border border-brand-tactical/30 hover:bg-brand-tactical hover:text-brand-text hover:scale-[1.02] hover:shadow-lg hover:shadow-brand-tactical/20 transition-all rounded-xl text-[10px] font-black uppercase tracking-widest"
            >
              <Plus size={14} /> CRIAR SERVIÇO PERSONALIZADO
            </button>
            <div className="text-right hidden md:block">
              <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Total</p>
              <p className="text-xl font-heading font-black text-theme-text italic leading-none">{profile?.proServices?.length || 0}</p>
            </div>
          </div>
        </div>

        {profile?.proServices?.length ? (
          <div className="grid grid-cols-1 gap-6">
            {profile.proServices.map((svc) => (
              <div
                key={svc.id}
                className="group flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl p-4 sm:p-6 bg-theme-bg-muted/30 border border-theme-border/40 hover:border-brand-tactical/40 transition-all relative overflow-hidden gap-6"
              >
                <div className="absolute left-0 top-0 h-full w-1 bg-brand-tactical opacity-20 group-hover:opacity-100 transition-all" />
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <Briefcase size={14} className="text-brand-tactical" />
                    <div className="text-base font-black text-theme-text uppercase italic tracking-tight">{svc.name}</div>
                    {getStatusBadge(svc.reviewStatus, svc.reviewNote)}
                  </div>
                  {svc.description && (
                    <div className="text-[9px] text-theme-muted uppercase tracking-[0.2em] italic font-bold max-w-xl">{svc.description}</div>
                  )}
                  {svc.reviewStatus === "NEEDS_ADJUSTMENT" && svc.reviewNote && (
                     <div className="text-[10px] text-orange-500 italic mt-2">
                       Nota da Admin: {svc.reviewNote}
                     </div>
                  )}
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12 w-full sm:w-auto">
                  {editingServiceId === svc.id ? (
                    <div className="flex flex-col items-end gap-1.5 w-full sm:w-auto">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-theme-muted uppercase italic">R$</span>
                        <input
                          type="number"
                          value={editingPriceValue}
                          onChange={(e) => setEditingPriceValue(e.target.value)}
                          disabled={loadingUpdate}
                          className="w-24 px-2.5 py-1.5 bg-theme-bg border border-brand-tactical/50 rounded-xl font-heading font-black text-theme-text text-right text-sm focus:outline-none focus:border-brand-tactical transition-all"
                          step="0.01"
                        />
                        <button
                          onClick={() => handleSavePrice(svc.id, svc.catalog?.estimatedMinutes)}
                          disabled={loadingUpdate}
                          className="p-2 bg-brand-tactical/10 text-brand-tactical hover:bg-brand-tactical hover:text-brand-text transition-all rounded-xl border border-brand-tactical/20 cursor-pointer"
                          title="Salvar preço"
                        >
                          <Check size={14} />
                        </button>
                        <button
                          onClick={() => { setEditingServiceId(null); setLocalError(null); }}
                          disabled={loadingUpdate}
                          className="p-2 bg-theme-bg-muted border border-theme-border/60 hover:bg-theme-bg/60 text-theme-muted transition-all rounded-xl cursor-pointer"
                          title="Cancelar"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {localError && (
                        <p className="text-[8px] text-red-500 font-bold uppercase tracking-widest text-right max-w-[200px]">
                          {localError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-12 w-full sm:w-auto">
                      <div className="text-left md:text-right">
                        <p className="text-[8px] font-black text-theme-muted uppercase tracking-widest mb-1 italic opacity-60">Preço Ativo</p>
                        <p className="text-xl sm:text-2xl font-heading font-black text-theme-text italic leading-none flex items-center gap-2">
                          <span>R$ {Number(svc.price).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          {onUpdateServicePrice && (
                            <button
                              onClick={() => {
                                setEditingServiceId(svc.id);
                                setEditingPriceValue(svc.price.toString());
                                setLocalError(null);
                              }}
                              className="p-1.5 text-theme-muted hover:text-brand-tactical transition-colors rounded-lg hover:bg-theme-bg-muted cursor-pointer"
                              title="Editar Preço"
                            >
                              <Pencil size={12} />
                            </button>
                          )}
                        </p>
                      </div>
                      <button
                        onClick={() => onRemoveService(svc.id)}
                        className="p-3 sm:p-4 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-brand-text transition-all rounded-xl border border-red-500/20 cursor-pointer"
                        title="Remover Serviço"
                      >
                        <X size={18} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center text-theme-muted uppercase text-[9px] font-black tracking-widest rounded-2xl bg-theme-bg-muted/20 border border-dashed border-theme-border/40">
            Sua vitrine está vazia. Importe itens do catálogo abaixo ou crie um personalizado.
          </div>
        )}
      </div>

      {/* Global Catalog */}
      <div className="bg-theme-bg border border-theme-border/60 rounded-2xl p-4 sm:p-6 md:p-12 space-y-8 md:space-y-12">
        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">
            Catálogo Geral da <span className="text-brand-tactical">Rede</span>
          </h3>
          <p className="text-[9px] sm:text-[10px] text-theme-muted uppercase tracking-[0.2em] sm:tracking-[0.4em] italic">
            Benchmark de serviços e precificação sugerida por IA
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6">
          {catalogServices.map((cat) => {
            const alreadyAdded = profile?.proServices?.some((s) => s.catalogId === cat.id);
            const suggested = Math.max(
              cat.basePrice,
              ((profile?.hourlyRate || minHourlyRate) * (cat.estimatedMinutes / 60)) * (profile?.equipmentMultiplier || 1.0)
            );
            return (
              <div
                key={cat.id}
                className="flex flex-col md:flex-row justify-between md:items-center rounded-2xl p-4 sm:p-6 bg-theme-bg-muted border border-theme-border/40 group hover:border-brand-tactical/30 transition-all gap-4 sm:gap-8 relative overflow-hidden"
              >
                <div className="space-y-2 md:space-y-3">
                  <div className="text-base font-black text-theme-text uppercase tracking-tight italic">{cat.name}</div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-1.5 text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">
                      <Clock size={12} className="text-brand-tactical" /> {cat.estimatedMinutes} MINUTOS
                    </div>
                    <div className="hidden sm:block w-1 h-1 rounded-full bg-theme-border" />
                    <div className="text-[9px] font-bold text-theme-muted uppercase tracking-widest italic">
                      Mínimo: R$ {(minHourlyRate * cat.estimatedMinutes / 60).toFixed(2)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between md:justify-end gap-4 sm:gap-12 w-full md:w-auto border-t border-theme-border/20 pt-4 md:pt-0 md:border-t-0">
                  <div className="text-left md:text-right space-y-0.5">
                    <div className="flex items-center md:justify-end gap-1.5 text-[8px] font-black text-brand-tactical uppercase tracking-widest italic">
                      <TrendingUp size={10} /> Valor Sugerido p/ Você
                    </div>
                    <div className="text-2xl sm:text-3xl font-heading font-black text-brand-tactical italic leading-none">
                      <span className="text-xs mr-0.5 font-sans not-italic">R$</span>
                      {suggested.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  {alreadyAdded ? (
                    <div className="px-4 sm:px-6 py-2 sm:py-3 bg-brand-tactical/10 border border-brand-tactical/30 rounded-xl text-brand-tactical text-[9px] sm:text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2">
                      <Check size={16} /> EM VITRINE
                    </div>
                  ) : (
                    <button
                      onClick={() => onAddService(cat)}
                      className="px-6 sm:px-10 py-3 sm:py-4 bg-brand-tactical text-brand-text text-[10px] sm:text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-tactical/30 transition-all shadow-lg shadow-brand-tactical/10 italic cursor-pointer"
                    >
                      IMPORTAR
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

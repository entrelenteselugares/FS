import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { API } from "../../lib/api";
import { X, TrendingUp, ArrowRight } from "lucide-react";

interface Contest {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: "DRAFT" | "ACTIVE" | "FINISHED";
  prize1st: string;
  prize1stPts: number;
  prize2nd?: string;
  prize2ndPts?: number;
  prize3rd?: string;
  prize3rdPts?: number;
}

export const AdminContests: React.FC = () => {
  const [contests, setContests] = useState<Contest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [editingContest, setEditingContest] = useState<Contest | null>(null);






  const [formData, setFormData] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    prize1st: "3 fotos impressas",
    prize2nd: "",
    prize3rd: "",
    prize1stPts: 1000,
    prize2ndPts: 500,
    prize3rdPts: 250,
  });

  const [dynamicType, setDynamicType] = useState('CREATE_ALBUMS');
  const [dynamicTarget, setDynamicTarget] = useState(10);
  const [customRule, setCustomRule] = useState('');

  const getDynamicText = (desc: string) => {
    if (!desc) return "Sem dinâmica definida";
    try {
      const data = JSON.parse(desc);
      if (data.type === 'CREATE_ALBUMS') return `Criar ${data.target} Álbuns`;
      if (data.type === 'POST_PHOTOS') return `Postar ${data.target} Fotos`;
      if (data.type === 'INVITE_FRIENDS') return `Convidar ${data.target} Amigos`;
      if (data.type === 'PARTICIPATE_GUEST') return `Participar de ${data.target} Eventos como Convidado`;
      if (data.type === 'CITY_EVENT') return `Fazer Evento na Própria Cidade`;
      if (data.type === 'CUSTOM') return `${data.customRule}`;
      return desc;
    } catch {
      return desc;
    }
  };

  const fetchContests = async () => {
    setLoading(true);
    try {
      const { data } = await API.get("/admin/contests");
      setContests(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContests();
  }, []);

  const handleCreateClick = () => {
    setEditingContest(null);
    setFormData({
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      prize1st: "3 fotos impressas",
      prize2nd: "",
      prize3rd: "",
      prize1stPts: 1000,
      prize2ndPts: 500,
      prize3rdPts: 250,
    });
    setDynamicType('CREATE_ALBUMS');
    setDynamicTarget(10);
    setCustomRule('');
    setShowModal(true);
  };

  const handleEditClick = (contest: Contest) => {
    setEditingContest(contest);
    let dynamicType = 'CREATE_ALBUMS';
    let dynamicTarget = 10;
    let customRule = '';
    if (contest.description) {
      try {
        const data = JSON.parse(contest.description);
        dynamicType = data.type || 'CREATE_ALBUMS';
        dynamicTarget = data.target || 10;
        customRule = data.customRule || '';
      } catch {
        customRule = contest.description;
        dynamicType = 'CUSTOM';
      }
    }
    setFormData({
      title: contest.title,
      description: contest.description || "",
      startDate: contest.startDate ? contest.startDate.substring(0, 10) : "",
      endDate: contest.endDate ? contest.endDate.substring(0, 10) : "",
      prize1st: contest.prize1st,
      prize2nd: contest.prize2nd || "",
      prize3rd: contest.prize3rd || "",
      prize1stPts: contest.prize1stPts,
      prize2ndPts: contest.prize2ndPts || 500,
      prize3rdPts: contest.prize3rdPts || 250,
    });
    setDynamicType(dynamicType);
    setDynamicTarget(dynamicTarget);
    setCustomRule(customRule);
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dynamicPayload = {
        type: dynamicType,
        target: dynamicTarget,
        customRule: customRule
      };
      
      const payload = {
        ...formData,
        description: JSON.stringify(dynamicPayload)
      };

      if (editingContest) {
        await API.patch(`/admin/contests/${editingContest.id}`, payload);
        toast.success("Concurso atualizado com sucesso!");
      } else {
        await API.post("/admin/contests", payload);
        toast.success("Concurso lançado com sucesso! 🏆");
      }
      setShowModal(false);
      fetchContests();
    } catch {
      toast.error(editingContest ? "Erro ao atualizar concurso." : "Erro ao criar concurso.");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.patch(`/admin/contests/${id}`, { status });
      toast.success(`Status atualizado para ${status}!`);
      fetchContests();
    } catch {
      toast.error("Erro ao atualizar status.");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este concurso?")) return;
    try {
      await API.delete(`/admin/contests/${id}`);
      toast.success("Concurso excluído com sucesso!");
      fetchContests();
    } catch {
      toast.error("Erro ao excluir concurso.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Padronizado */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative z-10">
          <div>
                        <p className="text-theme-muted mt-2 text-sm">Gerenciamento de concursos e competições</p>
          </div>
          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button 
              onClick={handleCreateClick}
              className="flex-1 md:flex-none px-8 py-4 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 shadow-xl transition-all italic text-center w-full break-words leading-tight"
            >
              NOVO CONCURSO
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-24 text-center border border-theme-border bg-theme-bg-muted/10 animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black italic rounded-2xl">Sincronizando Concursos da Rede...</div>
        ) : contests.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest border border-theme-border bg-black/10 italic">Nenhum concurso programado.</div>
        ) : (
          contests.map(c => (
            <div key={c.id} className="border border-theme-border p-5 bg-theme-bg group hover:border-brand-tactical/30 transition-all shadow-sm rounded-2xl">
              <div className="flex justify-between items-center">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 uppercase tracking-[0.1em] border ${
                      c.status === 'ACTIVE' 
                        ? 'bg-brand-tactical/10 text-brand-tactical border-brand-tactical/30' 
                        : 'bg-theme-bg-muted text-theme-muted border-theme-border'
                    }`}>
                      {c.status === 'ACTIVE' ? 'ATIVO' : c.status === 'FINISHED' ? 'FINALIZADO' : 'RASCUNHO'}
                    </span>
                    <h3 className="text-lg font-black text-theme-text uppercase tracking-tight">{c.title}</h3>
                  </div>
                  <div className="text-[9px] text-theme-muted font-black uppercase tracking-[0.1em] flex gap-4">
                    <span>DE: {new Date(c.startDate).toLocaleDateString()}</span>
                    <span>ATÉ: {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                  <div className="mt-2 text-[8px] text-theme-muted uppercase tracking-[0.05em] flex flex-col gap-1">
                    <div>🎯 Meta / Dinâmica: <span className="text-brand-tactical font-black">{getDynamicText(c.description)}</span></div>
                    <div>🏆 Premiação: <span className="text-theme-text font-black">{c.prize1st} (+{c.prize1stPts} pts)</span></div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.status !== "FINISHED" && (
                    <button 
                      onClick={() => handleEditClick(c)} 
                      className="px-3 py-1.5 bg-theme-bg-muted border border-theme-border/60 hover:border-brand-tactical text-theme-text text-[8px] font-black cursor-pointer hover:text-brand-tactical transition-all rounded rounded-2xl"
                    >
                      EDITAR
                    </button>
                  )}

                  {c.status === "DRAFT" && (
                    <button 
                      onClick={() => updateStatus(c.id, "ACTIVE")} 
                      className="px-3 py-1.5 bg-brand-tactical text-zinc-950 text-[8px] font-black border-none cursor-pointer hover:brightness-110 transition-all rounded"
                    >
                      ATIVAR
                    </button>
                  )}
                  {c.status === "ACTIVE" && (
                    <>
                      <button 
                        onClick={() => updateStatus(c.id, "DRAFT")} 
                        className="px-3 py-1.5 bg-amber-500/20 border border-amber-500/40 text-amber-400 hover:bg-amber-500/30 text-[8px] font-black cursor-pointer transition-all rounded"
                      >
                        PAUSAR
                      </button>
                      <button 
                        onClick={() => updateStatus(c.id, "FINISHED")} 
                        className="px-3 py-1.5 bg-red-500/20 border border-red-500/40 text-red-400 hover:bg-red-500/30 text-[8px] font-black cursor-pointer transition-all rounded"
                      >
                        ENCERRAR
                      </button>
                    </>
                  )}

                  <button 
                    onClick={() => handleDelete(c.id)} 
                    className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 text-[8px] font-black cursor-pointer transition-all rounded"
                  >
                    EXCLUIR
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <TrendingUp className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{editingContest ? "Ajustar Campanha" : "Engenharia de Concurso"}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">{editingContest ? "Atualização de Regras e Premiações" : "Motor de Gamificação e Engajamento Viral"}</p>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <form id="contest-form" onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Título da Campanha</label>
                <input required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value.toUpperCase()})} placeholder="EX: CORRIDA DOS 10 ÁLBUNS" />
              </div>

              {/* DINÂMICA / META */}
              <div className="p-8 bg-brand-tactical/5 border border-brand-tactical/20 rounded-[30px] space-y-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-1 italic">Estilo da Dinâmica (Meta Tática)</label>
                  <select 
                    className="w-full bg-transparent border-b border-brand-tactical/40 p-4 text-xs font-black text-theme-text outline-none focus:border-brand-tactical cursor-pointer uppercase appearance-none"
                    value={dynamicType}
                    onChange={e => setDynamicType(e.target.value)}
                  >
                    <option value="CREATE_ALBUMS">Quantidade de Álbuns Criados</option>
                    <option value="POST_PHOTOS">Quantidade de Fotos Diárias</option>
                    <option value="INVITE_FRIENDS">Membros Convidados para a Rede</option>
                    <option value="PARTICIPATE_GUEST">Participações como Convidado</option>
                    <option value="CITY_EVENT">Operação na Própria Cidade</option>
                    <option value="CUSTOM">Protocolo Personalizado (Texto)</option>
                  </select>
                </div>

                {dynamicType !== 'CITY_EVENT' && dynamicType !== 'CUSTOM' && (
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-1 italic">Quantidade Alvo (KPIS)</label>
                    <input 
                      type="number" 
                      required 
                      className="w-full bg-transparent border-b border-brand-tactical/40 p-4 text-3xl font-black text-brand-tactical outline-none focus:border-brand-tactical" 
                      value={dynamicTarget} 
                      onChange={e => setDynamicTarget(Number(e.target.value))} 
                    />
                  </div>
                )}

                {dynamicType === 'CUSTOM' && (
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-1 italic">Regra Operacional da Meta</label>
                    <textarea 
                      required 
                      className="w-full bg-transparent border-b border-brand-tactical/40 p-4 text-[11px] font-black text-theme-text outline-none focus:border-brand-tactical h-24 resize-none uppercase" 
                      value={customRule} 
                      onChange={e => setCustomRule(e.target.value.toUpperCase())} 
                      placeholder="EX: FAZER UM ÁLBUM DE ANIVERSÁRIO COM MAIS DE 50 FOTOS..."
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Início da Operação</label>
                  <input type="date" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl [color-scheme:dark]" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Encerramento</label>
                  <input type="date" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl [color-scheme:dark]" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-theme-border/60">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Recompensa: 1º Lugar</label>
                  <input className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20" value={formData.prize1st} onChange={e => setFormData({...formData, prize1st: e.target.value.toUpperCase()})} placeholder="EX: 3 FOTOS IMPRESSAS" />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Pontos Bônus de Ranking</label>
                  <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-emerald-500 font-black outline-none focus:border-brand-tactical rounded-xl" value={formData.prize1stPts} onChange={e => setFormData({...formData, prize1stPts: Number(e.target.value)})} />
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button onClick={() => setShowModal(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                type="submit" form="contest-form"                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                {editingContest ? "Salvar Alterações" : "Lançar Concurso"}
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {null}
    </div>
  );
};

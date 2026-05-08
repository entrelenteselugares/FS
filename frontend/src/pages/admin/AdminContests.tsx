import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";

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
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const dynamicPayload = {
        type: dynamicType,
        target: dynamicTarget,
        customRule: customRule
      };
      
      await API.post("/admin/contests", {
        ...formData,
        description: JSON.stringify(dynamicPayload)
      });
      setShowModal(false);
      showNotification("Concurso lançado com sucesso!");
      fetchContests();
    } catch {
      showNotification("Erro ao criar concurso.", "error");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.patch(`/admin/contests/${id}`, { status });
      showNotification(`Status atualizado para ${status}`);
      fetchContests();
    } catch {
      showNotification("Erro ao atualizar status.", "error");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-center border-b border-theme-border pb-6">
        <div>
          <h2 className="text-3xl font-black text-theme-text uppercase tracking-tighter leading-none">Concursos e Rankings</h2>
          <p className="text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] mt-2 italic">Motor de Engajamento Viral</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-tactical text-zinc-950 px-6 py-3 text-[9px] font-black uppercase tracking-[0.2em] hover:brightness-110 shadow-lg transition-all"
        >
          NOVO CONCURSO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest bg-black/20">Carregando Concursos...</div>
        ) : contests.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest border border-theme-border bg-black/10 italic">Nenhum concurso programado.</div>
        ) : (
          contests.map(c => (
            <div key={c.id} className="border border-theme-border p-5 bg-theme-bg group hover:border-brand-tactical/30 transition-all shadow-sm">
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

                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.status === "DRAFT" && (
                    <button onClick={() => updateStatus(c.id, "ACTIVE")} className="px-4 py-2 bg-brand-tactical text-zinc-950 text-[8px] font-black border-none cursor-pointer hover:brightness-110">ATIVAR</button>
                  )}
                  {c.status === "ACTIVE" && (
                    <button onClick={() => updateStatus(c.id, "FINISHED")} className="px-4 py-2 bg-theme-bg-muted text-theme-text text-[8px] font-black border border-theme-border cursor-pointer hover:bg-zinc-800">ENCERRAR</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="w-full max-w-xl bg-theme-bg border border-brand-tactical/20 rounded-[2rem] p-8 relative shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar">
            <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-brand-tactical transition-colors text-2xl">×</button>
            
            <div className="mb-8">
              <h2 className="text-xl font-black text-theme-text uppercase tracking-tighter">Configurar Concurso</h2>
              <div className="w-12 h-1 bg-brand-tactical mt-1" />
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Título do Concurso</label>
                <input required className="fs-input py-2.5" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Corrida dos 10 Álbuns" />
              </div>

              {/* DINÂMICA / META */}
              <div className="p-5 border border-white/5 bg-black/40 rounded-2xl space-y-4">
                 <div className="space-y-2">
                    <label className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em]">Estilo da Dinâmica (Meta)</label>
                    <select 
                      className="fs-input py-2.5 appearance-none cursor-pointer text-[10px]"
                      value={dynamicType}
                      onChange={e => setDynamicType(e.target.value)}
                    >
                      <option value="CREATE_ALBUMS">Criar Quantidade de Álbuns</option>
                      <option value="POST_PHOTOS">Postar Quantidade de Fotos Diárias</option>
                      <option value="INVITE_FRIENDS">Convidar Amigos para a Rede</option>
                      <option value="PARTICIPATE_GUEST">Participar como Convidado em Álbuns</option>
                      <option value="CITY_EVENT">Fazer Evento na Própria Cidade</option>
                      <option value="CUSTOM">Meta Personalizada (Texto Livre)</option>
                    </select>
                 </div>

                 {dynamicType !== 'CITY_EVENT' && dynamicType !== 'CUSTOM' && (
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Quantidade (Alvo)</label>
                      <input 
                        type="number" 
                        required 
                        className="fs-input py-2.5 text-brand-tactical text-lg font-black" 
                        value={dynamicTarget} 
                        onChange={e => setDynamicTarget(Number(e.target.value))} 
                      />
                   </div>
                 )}

                 {dynamicType === 'CUSTOM' && (
                   <div className="space-y-2">
                      <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Regra da Meta</label>
                      <textarea 
                        required 
                        className="fs-input py-2.5 h-20 resize-none text-[10px]" 
                        value={customRule} 
                        onChange={e => setCustomRule(e.target.value)} 
                        placeholder="Ex: Fazer um álbum de aniversário com mais de 50 fotos..."
                      />
                   </div>
                 )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Data Início</label>
                  <input type="date" required className="fs-input py-2.5 [color-scheme:dark]" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Data Fim</label>
                  <input type="date" required className="fs-input py-2.5 [color-scheme:dark]" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-2 border-t border-theme-border/30">
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Prêmio 1º Lugar</label>
                    <input className="fs-input py-2.5" value={formData.prize1st} onChange={e => setFormData({...formData, prize1st: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Pontos Bônus</label>
                    <input type="number" className="fs-input py-2.5 text-emerald-500 font-black" value={formData.prize1stPts} onChange={e => setFormData({...formData, prize1stPts: Number(e.target.value)})} />
                </div>
              </div>

              <button className="w-full mt-4 bg-brand-tactical text-zinc-950 rounded-2xl px-10 py-5 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 shadow-lg shadow-brand-tactical/10 transition-all">
                LANÇAR CONCURSO
              </button>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[110] p-6 border border-brand-tactical bg-theme-bg shadow-2xl min-w-[300px] animate-in slide-in-from-right-10 duration-500">
          <div className="flex flex-col gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-tactical">Notificação Sistema</span>
             <p className="text-[11px] font-bold text-theme-text uppercase tracking-widest">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

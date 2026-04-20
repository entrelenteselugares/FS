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
      await API.post("/admin/contests", formData);
      setShowModal(false);
      fetchContests();
    } catch {
      alert("Erro ao criar concurso.");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await API.patch(`/admin/contests/${id}`, { status });
      fetchContests();
    } catch {
      alert("Erro ao atualizar status.");
    }
  };

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Concursos e Rankings</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Motor de Engajamento Viral</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-brand-tactical text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 text-black hover:brightness-110 transition-all rounded-none"
        >
          NOVO CONCURSO
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest bg-black/20">Carregando Concursos...</div>
        ) : contests.length === 0 ? (
          <div className="py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest border border-white/5 bg-black/10 italic">Nenhum concurso programado.</div>
        ) : (
          contests.map(c => (
            <div key={c.id} className="border border-white/5 p-8 bg-white/[0.01] flex items-center justify-between group">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-2">
                  <span className={`text-[8px] font-black px-3 py-1 uppercase tracking-widest ${
                    c.status === 'ACTIVE' ? 'bg-green-500/20 text-green-400' : 
                    c.status === 'FINISHED' ? 'bg-zinc-800 text-zinc-500' : 'bg-brand-tactical/20 text-brand-tactical'
                  }`}>
                    {c.status === 'ACTIVE' ? 'ATIVO' : c.status === 'FINISHED' ? 'FINALIZADO' : 'RASCUNHO'}
                  </span>
                  <h3 className="text-xl font-heading text-white uppercase tracking-tighter font-bold">{c.title}</h3>
                </div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold flex gap-4 italic font-sans">
                  <span>DE: {new Date(c.startDate).toLocaleDateString()}</span>
                  <span>ATÉ: {new Date(c.endDate).toLocaleDateString()}</span>
                </div>
                <div className="mt-4 text-[9px] text-zinc-600 uppercase tracking-widest">
                  🏆 Premiação: <span className="text-white">{c.prize1st} (+{c.prize1stPts} pts)</span>
                </div>
              </div>

              <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                {c.status === "DRAFT" && (
                  <button onClick={() => updateStatus(c.id, "ACTIVE")} className="px-6 py-3 bg-brand-tactical/10 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical hover:text-black transition-all">ATIVAR</button>
                )}
                {c.status === "ACTIVE" && (
                  <button onClick={() => updateStatus(c.id, "FINISHED")} className="px-6 py-3 bg-zinc-800 text-zinc-400 text-[9px] font-black uppercase tracking-widest hover:bg-white hover:text-black transition-all">ENCERRAR</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-[#080808] border border-white/5 p-12 relative animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">×</button>
            <h2 className="text-3xl font-heading text-white tracking-tighter uppercase mb-2">Configurar Concurso</h2>
            <div className="w-12 h-1 bg-brand-tactical mb-10" />

            <form onSubmit={handleCreate} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Título do Concurso</label>
                <input required className="w-full bg-black border border-white/5 p-4 text-sm text-white focus:outline-none focus:border-brand-tactical rounded-none" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Data Início</label>
                  <input type="date" required className="w-full bg-black border border-white/5 p-4 text-sm text-white focus:outline-none focus:border-brand-tactical rounded-none invert brightness-150" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Data Fim</label>
                  <input type="date" required className="w-full bg-black border border-white/5 p-4 text-sm text-white focus:outline-none focus:border-brand-tactical rounded-none invert brightness-150" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Prêmio 1º Lugar</label>
                    <input className="w-full bg-black border border-white/5 p-4 text-sm text-white focus:outline-none focus:border-brand-tactical rounded-none" value={formData.prize1st} onChange={e => setFormData({...formData, prize1st: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Pontos Bônus</label>
                    <input type="number" className="w-full bg-black border border-white/5 p-4 text-sm text-white focus:outline-none focus:border-brand-tactical rounded-none" value={formData.prize1stPts} onChange={e => setFormData({...formData, prize1stPts: Number(e.target.value)})} />
                </div>
              </div>

              <button className="w-full bg-brand-tactical text-black font-bold uppercase tracking-[0.4em] py-6 text-[11px] hover:brightness-110 transition-all rounded-none shadow-xl shadow-brand-tactical/10">
                LANÇAR CONCURSO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${T.border}`, paddingBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 32, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1, lineHeight: 1 }}>Concursos e Rankings</h2>
          <p style={{ fontSize: 9, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2, marginTop: 8, fontStyle: "italic" }}>Motor de Engajamento Viral</p>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          style={{ 
            background: T.brand, color: T.brandText, padding: "12px 24px", 
            fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
            letterSpacing: "0.2em", cursor: "pointer", border: "none",
            transition: "all 0.2s"
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "0.8"}
          onMouseLeave={e => e.currentTarget.style.opacity = "1"}
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
            <div key={c.id} style={{ border: `1px solid ${T.border}`, padding: "20px", background: T.bgCard }} className="group hover:border-brand-tactical/30 transition-all">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <span style={{ 
                      fontSize: 8, fontWeight: 900, padding: "2px 6px", textTransform: "uppercase", letterSpacing: 1,
                      background: c.status === 'ACTIVE' ? `${T.brand}11` : T.bgField,
                      color: c.status === 'ACTIVE' ? T.brand : T.text3,
                      border: `1px solid ${c.status === 'ACTIVE' ? T.brand : T.border}44`
                    }}>
                      {c.status === 'ACTIVE' ? 'ATIVO' : c.status === 'FINISHED' ? 'FINALIZADO' : 'RASCUNHO'}
                    </span>
                    <h3 style={{ fontSize: 18, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5 }}>{c.title}</h3>
                  </div>
                  <div style={{ fontSize: 9, color: T.text3, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1, display: "flex", gap: 16 }}>
                    <span>DE: {new Date(c.startDate).toLocaleDateString()}</span>
                    <span>ATÉ: {new Date(c.endDate).toLocaleDateString()}</span>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 8, color: T.text2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    🏆 Premiação: <span style={{ color: T.text, fontWeight: 900 }}>{c.prize1st} (+{c.prize1stPts} pts)</span>
                  </div>
                </div>

                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  {c.status === "DRAFT" && (
                    <button onClick={() => updateStatus(c.id, "ACTIVE")} style={{ padding: "8px 16px", background: T.brand, color: T.brandText, fontSize: 8, fontWeight: 900, border: "none", cursor: "pointer" }}>ATIVAR</button>
                  )}
                  {c.status === "ACTIVE" && (
                    <button onClick={() => updateStatus(c.id, "FINISHED")} style={{ padding: "8px 16px", background: T.bgField, color: T.text, fontSize: 8, fontWeight: 900, border: `1px solid ${T.border}`, cursor: "pointer" }}>ENCERRAR</button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.95)", backdropFilter: "blur(20px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
          <div style={{ width: "100%", maxWidth: 640, background: "#080808", border: `1px solid ${T.border}`, padding: 40, position: "relative" }} className="animate-in zoom-in-95 duration-300">
            <button onClick={() => setShowModal(false)} style={{ position: "absolute", top: 24, right: 24, background: "none", border: "none", color: T.text3, fontSize: 24, cursor: "pointer" }}>×</button>
            <h2 style={{ fontSize: 24, fontFamily: T.fontD, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -1, marginBottom: 8 }}>Configurar Concurso</h2>
            <div style={{ width: 40, height: 2, background: T.brand, marginBottom: 32 }} />

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2 }}>Título do Concurso</label>
                <input required style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: 12, fontSize: 13, color: T.text, outline: "none" }} value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2 }}>Data Início</label>
                  <input type="date" required style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: 12, fontSize: 13, color: T.text, outline: "none", colorScheme: "dark" }} value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2 }}>Data Fim</label>
                  <input type="date" required style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: 12, fontSize: 13, color: T.text, outline: "none", colorScheme: "dark" }} value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2 }}>Prêmio 1º Lugar</label>
                    <input style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: 12, fontSize: 13, color: T.text, outline: "none" }} value={formData.prize1st} onChange={e => setFormData({...formData, prize1st: e.target.value})} />
                </div>
                <div className="space-y-2">
                    <label style={{ fontSize: 8, fontWeight: 900, color: T.text3, textTransform: "uppercase", letterSpacing: 2 }}>Pontos Bônus</label>
                    <input type="number" style={{ width: "100%", background: T.bgField, border: `1px solid ${T.border}`, padding: 12, fontSize: 13, color: T.text, outline: "none" }} value={formData.prize1stPts} onChange={e => setFormData({...formData, prize1stPts: Number(e.target.value)})} />
                </div>
              </div>

              <button style={{ 
                width: "100%", background: T.brand, color: T.brandText, padding: 16, 
                fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
                letterSpacing: 4, border: "none", cursor: "pointer", marginTop: 16
              }}>
                LANÇAR CONCURSO
              </button>
            </form>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[110] p-6 border border-brand-tactical bg-zinc-950 shadow-2xl min-w-[300px] animate-in slide-in-from-right-10 duration-500">
          <div className="flex flex-col gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-tactical">Notificação Sistema</span>
             <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

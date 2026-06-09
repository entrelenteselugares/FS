import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { Users2, Star, UserCircle, Search } from "lucide-react";

interface ProfissionalEquipe {
  id: string;
  userId: string;
  nome: string;
  email: string;
  whatsapp: string;
  profileImageUrl?: string | null;
  services: string[];
  cameras: string[];
  vinculo: "FIXO" | "ROTATIVO" | null;
  status: string | null;
}

export function TeamTab() {
  const [teamData, setTeamData] = useState<ProfissionalEquipe[]>([]);
  const [search, setSearch] = useState("");
  const [teamChanges, setTeamChanges] = useState<Record<string, "FIXO" | "ROTATIVO" | null>>({});
  const [savingTeam, setSavingTeam] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadTeam = async () => {
    try {
      const { data } = await API.get("/unidade-fixa/team");
      setTeamData(data.profissionais || []);
    } catch (err) {
      console.error("Erro ao carregar equipe:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTeam();
  }, []);

  const saveTeam = async () => {
    setSavingTeam(true);
    try {
      const assignments = Object.entries(teamChanges).map(([profissionalId, tipo]) => ({
        profissionalId,
        tipo
      }));
      await API.put("/unidade-fixa/team", { assignments });
      setTeamChanges({});
      await loadTeam();
    } catch (err) {
      console.error("Erro ao salvar equipe:", err);
    } finally {
      setSavingTeam(false);
    }
  };

  const getVinculo = (p: ProfissionalEquipe) => {
    if (p.id in teamChanges) return teamChanges[p.id];
    return p.vinculo;
  };

  const filteredTeam = teamData.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    (p.services || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  if (loading) {
    return <div className="p-10 text-center text-theme-muted uppercase font-black text-[10px] tracking-widest">Carregando Rede Técnica...</div>;
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Tactical Intro Card */}
      <div className="lux-card p-10 border-l-4 border-l-brand-tactical rounded-2xl bg-gradient-to-br from-brand-tactical/[0.03] to-transparent relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
          <Users2 size={120} />
        </div>
        <div className="relative z-10 space-y-6">
          <h3 className="text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">Escalabilidade da Rede Técnica</h3>
          <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-relaxed max-w-3xl">
            Otimize sua operação designando profissionais <span className="text-brand-tactical font-black underline decoration-brand-tactical/30 underline-offset-4">FIXOS</span> para prioridade máxima em seus eventos ou integrando o pool <span className="text-blue-400 font-black">ROTATIVO</span> para demandas dinâmicas de rede.
          </p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
              <div className="px-4 py-3 bg-theme-bg border border-theme-border rounded-xl flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                <span className="text-[9px] font-black text-theme-text uppercase tracking-widest">{filteredTeam.length} AGENTES IDENTIFICADOS</span>
              </div>
              
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted" size={16} />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou serviço..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-theme-bg border border-theme-border rounded-xl text-theme-text text-sm focus:border-brand-tactical/50 outline-none transition-colors"
                />
              </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTeam.map(p => {
          const vinculo = getVinculo(p);
          return (
            <div key={p.id} className={`lux-card p-0 rounded-2xl overflow-hidden group transition-all duration-700 hover:border-brand-tactical/30 shadow-sm ${vinculo === "FIXO" ? 'border-brand-tactical/40 ring-1 ring-brand-tactical/10' : ''}`}>
              <div className="flex flex-col h-full">
                  <div className={`p-6 flex items-center gap-4 border-b border-theme-border transition-colors ${vinculo === "FIXO" ? 'bg-brand-tactical/10' : 'bg-theme-bg'}`}>
                    <div className="shrink-0">
                      {p.profileImageUrl ? (
                        <div className="w-12 h-12 rounded-full overflow-hidden border border-theme-border flex items-center justify-center relative">
                           <img src={p.profileImageUrl} alt={p.nome} className="w-full h-full object-cover" />
                           {vinculo === "FIXO" && <Star size={12} className="absolute bottom-0 right-0 text-brand-tactical fill-brand-tactical bg-theme-bg rounded-full p-0.5" />}
                        </div>
                      ) : vinculo === "FIXO" ? (
                        <Star size={24} className="text-brand-tactical fill-brand-tactical animate-in zoom-in duration-500" />
                      ) : vinculo === "ROTATIVO" ? (
                        <Users2 size={24} className="text-blue-400 opacity-60" />
                      ) : (
                        <UserCircle size={24} className="text-theme-muted/40" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                            <h4 className="text-lg font-heading font-black text-theme-text uppercase italic tracking-tight truncate group-hover:text-brand-tactical transition-colors" title={p.nome}>{p.nome}</h4>
                            {vinculo === "FIXO" && (
                              <span className="px-2 py-0.5 bg-brand-tactical text-brand-text text-[8px] font-black uppercase tracking-widest italic rounded-full shrink-0">PRIORIDADE</span>
                            )}
                        </div>
                        <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.2em] truncate" title={p.email}>{p.email}</p>
                    </div>
                  </div>

                  <div className="flex-1 p-6 flex flex-col justify-between gap-6">
                    <div className="flex flex-wrap gap-2">
                      {p.services.length > 0 ? p.services.map(s => (
                        <span key={s} className="px-3 py-1 bg-theme-bg border border-theme-border rounded-lg text-[9px] font-black text-theme-text uppercase tracking-widest group-hover:border-brand-tactical/30 transition-colors shadow-sm truncate max-w-full">
                          {s}
                        </span>
                      )) : (
                        <span className="text-[8px] font-bold text-theme-muted uppercase italic">Perfil em análise Técnica</span>
                      )}
                    </div>

                    <div className="space-y-3 mt-auto">
                        <p className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em] opacity-60">Status de vínculo</p>
                        <div className="grid grid-cols-3 gap-1 bg-theme-bg-muted p-1 border border-theme-border rounded-xl">
                          {([null, "ROTATIVO", "FIXO"] as const).map(tipo => (
                            <button
                              key={String(tipo)}
                              onClick={() => setTeamChanges(prev => ({ ...prev, [p.id]: tipo }))}
                              className={`py-2 text-[8px] sm:text-[9px] font-black uppercase tracking-widest rounded-lg transition-all duration-300 relative overflow-hidden truncate px-1 ${
                                vinculo === tipo 
                                  ? tipo === "FIXO" ? "bg-brand-tactical text-brand-text shadow-lg shadow-brand-tactical/20" : tipo === "ROTATIVO" ? "bg-blue-500 text-theme-text shadow-md shadow-blue-500/20" : "bg-theme-border text-theme-text shadow-sm"
                                  : "text-theme-muted hover:text-theme-text hover:bg-theme-border/20"
                              }`}
                            >
                              <span className="relative z-10">
                                {tipo === null ? "Livre" : tipo === "ROTATIVO" ? "Rotativo" : "⭐ Fixo"}
                              </span>
                            </button>
                          ))}
                        </div>
                    </div>
                  </div>
              </div>
            </div>
          );
        })}
      </div>

      {Object.keys(teamChanges).length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500 w-[90%] md:w-auto">
          <div className="bg-theme-bg-muted/90 backdrop-blur-xl border border-brand-tactical/50 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col md:flex-row items-center gap-6 md:gap-10">
            <p className="text-[10px] font-black text-theme-text uppercase tracking-[0.3em] text-center md:text-left">
              {Object.keys(teamChanges).length} ALTERAÇÃO(ÕES) PENDENTE(S) NO QUADRO TÁTICO
            </p>
            <button
              disabled={savingTeam}
              onClick={saveTeam}
              className="bg-brand-tactical text-brand-text rounded-xl px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all italic shadow-lg w-full md:w-auto"
            >
              {savingTeam ? "PROCESSANDO..." : "CONFIRMAR ESCALA"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

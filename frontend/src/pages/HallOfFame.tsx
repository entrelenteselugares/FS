import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { motion } from "framer-motion";
import { Award, Heart, Shield, Star } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

interface RankingItem {
  event: {
    id: string;
    nomeNoivos: string;
    slug: string;
    coverPhotoUrl: string;
    cartorio: string;
  };
  likes: number;
}

interface ContestResult {
  contest: {
    id: string;
    title: string;
    endDate: string;
  };
  winners: RankingItem[];
}

const THEME = {
  bg: "#050505",
  card: "#0a0a0a",
  accent: "var(--brand-tactical)", // New Primary Brand Color
  gold: "#d4af37",
  silver: "#c0c0c0",
  bronze: "#cd7f32",
};

export const HallOfFame: React.FC = () => {
  const navigate = useNavigate();
  const [activeContest, setActiveContest] = useState<{ contest: { title: string }; ranking: RankingItem[] } | null>(null);
  const [history, setHistory] = useState<ContestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [activeRes, historyRes] = await Promise.all([
          API.get("/public/contests/active"),
          API.get("/public/contests/hall-of-fame"),
        ]);
        setActiveContest(activeRes.data);
        setHistory(historyRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="min-h-screen bg-theme-bg flex items-center justify-center text-theme-muted uppercase tracking-[.5em] text-[10px] font-black">Escaneando Hall da Fama...</div>;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-300">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&display=swap');
      `}</style>

      {/* Back Button */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none flex justify-between items-center">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-theme-muted hover:text-theme-text transition-all bg-theme-bg-muted backdrop-blur-md px-6 py-3 border border-theme-border"
        >
          <span className="text-lg">←</span> Vitrine
        </button>
        <div className="pointer-events-auto">
          <ThemeToggle />
        </div>
      </nav>
      
      {/* Hero Section */}
      <section className="pt-20 pb-40 px-6 max-w-7xl mx-auto text-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-center mb-6">
            <Award size={48} className="text-theme-border" />
          </div>
          <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-6" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
            Hall da <span style={{ color: THEME.accent }}>Fama</span>
          </h1>
          <p className="text-theme-muted uppercase tracking-[0.3em] text-[11px] font-bold max-w-md mx-auto leading-relaxed">
            Celebrando os registros mais amados da nossa rede. Onde o amor encontra a arte.
          </p>
        </motion.div>
      </section>

      {/* Concurso ATIVO */}
      {activeContest && activeContest.contest && (
        <section className="pb-32 px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-4 mb-12">
            <div className="w-10 h-[1px] bg-theme-border" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.6em] text-theme-muted">Em Disputa: {activeContest.contest.title}</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {activeContest.ranking.map((item: RankingItem, idx: number) => (
              <motion.div 
                key={item.event.id}
                whileHover={{ y: -5 }}
                className="bg-theme-bg-muted border border-theme-border relative group p-6"
              >
                <div className="absolute top-0 right-0 p-4">
                    <div className="text-[40px] font-black opacity-10 group-hover:opacity-30 transition-opacity" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
                        #{idx + 1}
                    </div>
                </div>

                <div className="relative aspect-square mb-6 overflow-hidden border border-theme-border">
                  <img src={item.event.coverPhotoUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60 group-hover:opacity-100" alt="" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                </div>

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{item.event.nomeNoivos}</h3>
                <p className="text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-6">{item.event.cartorio}</p>

                  <div className="flex items-center gap-2">
                    <Heart size={14} className="text-brand-tactical fill-brand-tactical" />
                    <span className="text-lg font-black">{item.likes}</span>
                  </div>
                  <a href={`/eventos/${item.event.slug || item.event.id}`} className="text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-theme-text border-b border-theme-border hover:border-theme-text transition-all pb-1">APOIAR CASAL</a>
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {/* Histórico / Galeria de Vencedores */}
      <section className="bg-theme-bg-muted/30 py-32 border-t border-theme-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center gap-4 mb-20 justify-center">
            <Shield size={20} className="text-theme-muted" />
            <h2 className="text-[11px] font-black uppercase tracking-[0.8em] text-theme-muted">Vencedores de Edições Anteriores</h2>
            <Shield size={20} className="text-theme-muted" />
          </div>

          <div className="space-y-32">
            {history.map((res) => (
              <div key={res.contest.id}>
                <div className="text-center mb-16">
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-2" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{res.contest.title}</h3>
                    <div className="text-[9px] text-theme-muted uppercase tracking-[0.3em] font-bold">Encerrado em {new Date(res.contest.endDate).toLocaleDateString()}</div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-12">
                   {res.winners.map((winner, widx) => (
                      <div key={winner.event.id} className="text-center">
                        <div className="relative w-40 h-40 mx-auto mb-8">
                            <div className="absolute inset-0 border-2 border-zinc-800 -rotate-6 transition-transform hover:rotate-0" />
                            <img src={winner.event.coverPhotoUrl} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" alt="" />
                            <div className="absolute -top-4 -right-4 bg-theme-bg-muted border border-theme-border w-10 h-10 flex items-center justify-center">
                                <Star size={16} fill={widx === 0 ? THEME.gold : widx === 1 ? THEME.silver : THEME.bronze} className="stroke-none" />
                            </div>
                        </div>
                        <h4 className="text-xl font-bold uppercase tracking-tighter mb-1">{winner.event.nomeNoivos}</h4>
                        <div className="text-[11px] font-black text-brand-tactical">
                            {widx === 0 ? "GRANDE CAMPEÃO" : widx === 1 ? "MENÇÃO PRATA" : "DESTAQUE BRONZE"}
                        </div>
                      </div>
                   ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="py-40 text-center border-t border-theme-border">
        <div className="max-w-xl mx-auto px-6">
            <h2 className="text-4xl font-black uppercase tracking-tighter mb-8" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Quer ver seu álbum aqui?</h2>
            <p className="text-theme-muted text-[11px] uppercase tracking-widest font-bold leading-relaxed mb-12">Compartilhe sua galeria e peça curtidas aos seus convidados. Os álbuns mais engajados recebem premiações exclusivas em todos os concursos.</p>
            <button onClick={() => window.location.href='/cotacao'} className="px-12 py-5 bg-brand-tactical text-theme-bg text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-2xl shadow-brand-tactical/20">RESERVAR MEU GRANDE DIA</button>
        </div>
      </footer>
    </div>
  );
};

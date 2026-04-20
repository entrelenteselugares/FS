import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { motion } from "framer-motion";
import { MapPin, Phone, MessageSquare, Calendar, Star } from "lucide-react";

interface PartnerData {
  razaoSocial: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  coverUrl: string | null;
  slug: string;
}

interface RecentEvent {
  id: string;
  nomeNoivos: string;
  slug: string;
  dataEvento: string;
  coverPhotoUrl: string;
}


export const PartnerLP: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<{ partner: PartnerData; recentEvents: RecentEvent[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get(`/public/partners/${slug}`)
      .then(res => setData(res.data))
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !data) return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-[10px] text-zinc-800 uppercase tracking-widest font-black">Sincronizando Localização...</div>;

  const { partner, recentEvents } = data;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&display=swap');
      `}</style>

      {/* Back Button */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-all bg-black/20 backdrop-blur-md px-6 py-3 border border-white/5"
        >
          <span className="text-lg">←</span> Vitrine
        </button>
      </nav>

      {/* Hero / Cover */}
      <section className="relative h-[80vh] overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={partner.coverUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600"} 
            className="w-full h-full object-cover opacity-40 grayscale"
            alt="" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent" />
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
           <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
             <div className="text-[10px] font-black uppercase tracking-[0.6em] text-brand-tactical mb-6">Ponto Parceiro Autorizado</div>
             <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] mb-8" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>
               {partner.razaoSocial}
             </h1>
             <div className="flex flex-wrap justify-center gap-6 text-[11px] font-bold uppercase tracking-widest text-zinc-400 italic">
               <div className="flex items-center gap-2"><MapPin size={14} /> {partner.address || "Campinas, SP"}</div>
               <div className="flex items-center gap-2"><Phone size={14} /> {partner.phone || "(19) 98765-4321"}</div>
             </div>
           </motion.div>
        </div>
      </section>

      {/* Info Sections */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-20 py-32 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 italic" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Sobre este Local</h2>
          <p className="text-zinc-500 leading-relaxed uppercase tracking-widest text-[11px] font-bold mb-12">
            {partner.description || "Este cartório é um parceiro estratégico da plataforma Foto Segundo, oferecendo infraestrutura otimizada para registros de registros civis de alto padrão. Localizado em área nobre, com iluminação preparada para fotografia profissional."}
          </p>
          
          <div className="space-y-6">
             {[
               "Acesso prioritário para profissionais Foto Segundo",
               "Iluminação natural otimizada para retratos",
               "Área privativa para fotos de família",
               "Sincronização imediata de álbuns"
             ].map(feat => (
               <div key={feat} className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 group">
                 <div className="w-1.5 h-1.5 bg-brand-tactical group-hover:scale-150 transition-transform" />
                 {feat}
               </div>
             ))}
          </div>
        </div>

        <div className="bg-[#0a0a0a] border border-white/5 p-12 flex flex-col justify-center items-center text-center">
            <Calendar className="text-brand-tactical mb-8" size={48} />
            <h3 className="text-4xl font-black uppercase tracking-tighter mb-4" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Solicite seu Registro</h3>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-10">Agende sua cobertura fotográfica ou cinematográfica diretamente para este local com preços exclusivos de ponto parceiro.</p>
            <button 
                onClick={() => navigate(`/cotacao?partner=${partner.slug}`)}
                className="w-full py-6 bg-brand-tactical text-white text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all shadow-2xl shadow-brand-tactical/20"
            >
                INICIAR ORÇAMENTO EXPRESS
            </button>
        </div>
      </section>

      {/* Recents Gallery */}
      <section className="py-32 px-6 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-20">
            <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter italic" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Registrados Recentemente</h2>
                <p className="text-[10px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-2">Neste Local de Atendimento</p>
            </div>
            <div className="hidden md:flex items-center gap-2 text-zinc-800">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {recentEvents.length === 0 ? (
                <div className="col-span-full py-20 text-center text-zinc-800 uppercase tracking-widest text-[9px] border border-dashed border-zinc-900 italic">Os registros deste local serão indexados em breve.</div>
            ) : recentEvents.map(event => (
                <motion.div 
                    key={event.id}
                    onClick={() => navigate(`/eventos/${event.slug || event.id}`)}
                    whileHover={{ y: -5 }}
                    className="group"
                >
                    <div className="aspect-[4/5] overflow-hidden border border-white/5 mb-6 bg-zinc-950 relative">
                        <img 
                            src={event.coverPhotoUrl} 
                            className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 hover:scale-110" 
                            alt="" 
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80" />
                        <div className="absolute bottom-0 left-0 p-8">
                             <h4 className="text-xl font-black uppercase tracking-tighter mb-1" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>{event.nomeNoivos}</h4>
                             <div className="text-[9px] text-brand-tactical font-black uppercase tracking-widest">{new Date(event.dataEvento).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</div>
                        </div>
                    </div>
                </motion.div>
            ))}
        </div>
      </section>

      {/* Footer / Location */}
      <footer className="py-40 border-t border-white/5 bg-zinc-900/10">
        <div className="max-w-xl mx-auto text-center px-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-8" style={{ fontFamily: "'Barlow Condensed', sans-serif" }}>Visite-nos</h3>
            <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-widest leading-relaxed mb-12">
                {partner.address || "Endereço em processamento..."}
            </p>
            <div className="flex justify-center gap-10">
                <a href={`tel:${partner.phone}`} className="flex flex-col items-center gap-4 group">
                    <div className="w-12 h-12 flex items-center justify-center border border-zinc-800 rounded-none group-hover:border-brand-tactical transition-colors">
                        <Phone size={18} className="text-zinc-600 group-hover:text-brand-tactical" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">Ligar</span>
                </a>
                <a href="#" className="flex flex-col items-center gap-4 group">
                    <div className="w-12 h-12 flex items-center justify-center border border-zinc-800 rounded-none group-hover:border-brand-tactical transition-colors">
                        <MessageSquare size={18} className="text-zinc-600 group-hover:text-brand-tactical" />
                    </div>
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-700">WhatsApp</span>
                </a>
            </div>
        </div>
      </footer>
    </div>
  );
};

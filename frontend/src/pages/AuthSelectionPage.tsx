import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Building2, User } from "lucide-react";
import { motion } from "framer-motion";

export const AuthSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: "cliente",
      title: "OPERADOR CLIENTE",
      description: "Acesso reservado a portadores de convite e portfólios autorizados.",
      icon: <User className="text-zinc-600" size={24} strokeWidth={1.5} />,
      label: "ENTRAR NA GALERIA",
      role: "CLIENTE"
    },
    {
      id: "profissional",
      title: "REDE TÉCNICA",
      description: "Infraestrutura analítica para fotógrafos e inteligência de campo.",
      icon: <Camera className="text-zinc-600" size={24} strokeWidth={1.5} />,
      label: "PAINEL OPERACIONAL",
      role: "PROFISSIONAL"
    },
    {
      id: "cartorio",
      title: "CENTRAL UNIDADE",
      description: "Gestão institucional, regramento de ativos e fluxos de logística.",
      icon: <Building2 className="text-zinc-600" size={24} strokeWidth={1.5} />,
      label: "PORTAL DA UNIDADE",
      role: "CARTORIO"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center px-6 py-20 overflow-hidden relative">
      {/* Editorial Background Lines */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-white/5" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-white/5" />
      </div>
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: [0.19, 1, 0.22, 1] }}
        className="text-center mb-32 relative z-10"
      >
        <img src="/assets/logo.png" alt="Foto Segundo" className="h-8 w-auto invert brightness-0 mb-16 mx-auto opacity-80" />
        <h1 className="text-6xl md:text-9xl font-heading tracking-tighter text-white mb-8 uppercase font-black">
          GATE<span className="text-brand-tactical">KEEPER</span>
        </h1>
        <div className="flex items-center justify-center gap-6">
           <div className="w-16 h-1.5 bg-brand-tactical" />
           <p className="text-zinc-600 uppercase tracking-[0.8em] text-[10px] font-bold">Protocolo de Identidade</p>
           <div className="w-16 h-1.5 bg-brand-tactical" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-0 max-w-7xl w-full relative z-10 border border-white/5 bg-white/[0.01]">
        {options.map((opt, idx) => (
          <motion.div
            key={opt.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 + idx * 0.1, duration: 1 }}
            onClick={() => navigate(`/login?role=${opt.role}`)}
            className="group p-20 flex flex-col items-start border-r border-white/5 last:border-r-0 hover:bg-white/[0.02] cursor-pointer transition-all duration-1000"
          >
            <div className="mb-12 opacity-40 group-hover:opacity-100 group-hover:text-brand-tactical transition-all transform group-hover:scale-110 duration-500">
              {opt.icon}
            </div>
            <h3 className="text-4xl font-heading text-white mb-6 tracking-tighter transition-all duration-500 font-bold uppercase">
              {opt.title}
            </h3>
            <p className="text-zinc-700 text-[11px] leading-[1.8] mb-16 font-bold lg:pr-10 uppercase tracking-widest">
              {opt.description}
            </p>
            
            <div className="mt-auto flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.5em] text-zinc-700 group-hover:text-brand-tactical transition-all duration-500">
              <span className="w-8 h-1 bg-zinc-900 group-hover:bg-brand-tactical transition-all" />
              {opt.label}
            </div>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        onClick={() => navigate("/")}
        className="mt-32 text-zinc-800 hover:text-brand-tactical text-[11px] font-bold uppercase tracking-[0.8em] transition-all duration-500 flex items-center gap-6 group"
      >
        <span className="w-12 h-1.5 bg-zinc-900 group-hover:w-16 group-hover:bg-brand-tactical transition-all" />
        VOLTAR À VITRINE
      </motion.button>
    </div>
  );
};

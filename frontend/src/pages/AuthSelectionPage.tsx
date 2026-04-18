import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Building2, User } from "lucide-react";
import { motion } from "framer-motion";

export const AuthSelectionPage: React.FC = () => {
  const navigate = useNavigate();

  const options = [
    {
      id: "cliente",
      title: "Private Client",
      description: "Acesso reservado a portadores de convite e clientes VIP.",
      icon: <User className="text-zinc-500" size={20} strokeWidth={1.5} />,
      label: "Entrar na Galeria",
      role: "CLIENTE"
    },
    {
      id: "profissional",
      title: "Network Artist",
      description: "Infraestrutura analítica para fotógrafos e curadores do coletivo.",
      icon: <Camera className="text-zinc-500" size={20} strokeWidth={1.5} />,
      label: "Painel de Criação",
      role: "PROFISSIONAL"
    },
    {
      id: "cartorio",
      title: "Estabelecimentos", // Termo neutro como solicitado
      description: "Gestão institucional, regramento de ativos e fluxos de repasse.",
      icon: <Building2 className="text-zinc-500" size={20} strokeWidth={1.5} />,
      label: "Área de Unidade",
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
        <h1 className="text-6xl md:text-8xl font-serif tracking-tight text-white mb-8">
          Portal de <span className="italic text-zinc-700">Acesso</span>
        </h1>
        <div className="flex items-center justify-center gap-6">
           <div className="w-12 h-[1px] bg-brand-olive/40" />
           <p className="text-zinc-600 uppercase tracking-[0.6em] text-[10px] font-bold">The Photography Collective</p>
           <div className="w-12 h-[1px] bg-brand-olive/40" />
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
            <div className="mb-12 opacity-30 group-hover:opacity-100 group-hover:text-brand-olive transition-all transform group-hover:scale-110 duration-700">
              {opt.icon}
            </div>
            <h3 className="text-3xl font-serif text-white mb-6 tracking-tight group-hover:italic transition-all duration-700 font-light">
              {opt.title}
            </h3>
            <p className="text-zinc-600 text-xs leading-[1.8] mb-16 font-light lg:pr-10 uppercase tracking-widest font-bold">
              {opt.description}
            </p>
            
            <div className="mt-auto flex items-center gap-6 text-[9px] font-bold uppercase tracking-[0.5em] text-zinc-600 group-hover:text-white transition-all duration-700">
              <span className="w-6 h-[1px] bg-zinc-900 group-hover:bg-brand-olive transition-all" />
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
        className="mt-32 text-zinc-800 hover:text-brand-olive text-[11px] font-bold uppercase tracking-[0.6em] transition-all duration-500 flex items-center gap-4 group"
      >
        <span className="w-8 h-[1px] bg-zinc-900 group-hover:w-12 group-hover:bg-brand-olive transition-all" />
        Return to Home
      </motion.button>
    </div>
  );
};

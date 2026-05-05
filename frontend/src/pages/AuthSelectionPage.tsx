import React from "react";
import { useNavigate } from "react-router-dom";
import { Camera, Building2, User } from "lucide-react";


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
      description: "Infraestrutura analítica para PROFISSIONAIS e inteligência de campo.",
      icon: <Camera className="text-zinc-600" size={24} strokeWidth={1.5} />,
      label: "PAINEL OPERACIONAL",
      role: "PROFISSIONAL"
    },
    {
      id: "unidade-fixa",
      title: "UNIDADES FIXAS",
      description: "Gestão institucional, regramento de ativos e fluxos de logística.",
      icon: <Building2 className="text-zinc-600" size={24} strokeWidth={1.5} />,
      label: "PORTAL DA UNIDADE",
      role: "CARTORIO"
    }
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col items-center justify-center px-6 py-20 overflow-hidden relative transition-colors duration-300">
      {/* Back Button */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-theme-text/40 hover:text-theme-text transition-all bg-theme-bg-muted/20 backdrop-blur-md px-6 py-3 border border-theme-border/5"
        >
          <span className="text-lg">←</span> Vitrine
        </button>
      </nav>

      {/* Editorial Background Lines */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[1px] h-full bg-theme-border/5" />
        <div className="absolute top-0 right-1/4 w-[1px] h-full bg-theme-border/5" />
      </div>
      
      <div 
        className="text-center mb-16 md:mb-32 relative z-10"
      >
        <img src="/logo-fs.png" alt="Foto Segundo" className="h-10 w-auto mb-16 mx-auto opacity-80" />
        <h1 className="font-sans tracking-tighter text-theme-text mb-8 uppercase font-black" style={{ fontSize: 'clamp(40px, 12vw, 96px)' }}>
          GATE<span className="text-brand-tactical">KEEPER</span>
        </h1>
        <div className="flex items-center justify-center gap-6">
           <div className="w-16 h-1.5 bg-brand-tactical" />
           <p className="text-theme-muted uppercase tracking-[0.8em] text-[10px] font-bold">Protocolo de Identidade</p>
           <div className="w-16 h-1.5 bg-brand-tactical" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full relative z-10 px-4">
        {options.map((opt) => (
          <div
            key={opt.id}
            onClick={() => navigate(`/login?role=${opt.role}`)}
            className="lux-card group p-10 md:p-16 flex flex-col items-start cursor-pointer transition-all duration-700 bg-theme-bg-muted/40 backdrop-blur-md"
          >
            <div className="mb-12 p-5 bg-theme-bg rounded-2xl border border-theme-border shadow-inner opacity-60 group-hover:opacity-100 group-hover:text-brand-tactical transition-all transform group-hover:scale-110 duration-500">
              {opt.icon}
            </div>
            <h3 className="text-3xl md:text-4xl font-display text-theme-text mb-4 md:mb-6 tracking-tighter transition-all duration-500 font-black uppercase italic">
              {opt.title}
            </h3>
            <p className="text-theme-muted text-[11px] leading-[1.8] mb-12 md:mb-20 font-bold uppercase tracking-[0.2em]">
              {opt.description}
            </p>
            
            <button 
              className="lux-button-ghost w-full py-5 text-[10px] font-black uppercase tracking-[0.5em] group-hover:bg-brand-tactical group-hover:text-black group-hover:border-brand-tactical transition-all duration-500"
            >
              {opt.label}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={() => navigate("/")}
        className="mt-32 text-theme-muted hover:text-brand-tactical text-[11px] font-bold uppercase tracking-[0.8em] transition-all duration-500 flex items-center gap-6 group"
      >
        <span className="w-12 h-1.5 bg-theme-border group-hover:w-16 group-hover:bg-brand-tactical transition-all" />
        VOLTAR À VITRINE
      </button>
    </div>
  );
};

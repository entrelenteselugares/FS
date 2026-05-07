import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, User, Briefcase } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const dashPath = user?.role === "ADMIN" ? "/admin"
    : user?.role === "PROFISSIONAL" ? "/profissional"
    : (user?.role === "CARTORIO" || user?.role === "UNIDADE") ? "/unidade-fixa"
    : "/minha-conta";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/80 backdrop-blur-xl border-t border-white/10 z-[100] px-6 py-3 flex items-center justify-between pb-safe">
      <button 
        onClick={() => navigate("/")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-emerald-500" : "text-white/40"}`}
      >
        <Home size={20} />
        <span className="text-[8px] font-black uppercase tracking-widest italic">Home</span>
      </button>

      <button 
        onClick={() => document.getElementById("vitrine")?.scrollIntoView({ behavior: 'smooth' })}
        className="flex flex-col items-center gap-1 text-white/40"
      >
        <Search size={20} />
        <span className="text-[8px] font-black uppercase tracking-widest italic">Buscar</span>
      </button>

      <button 
        onClick={() => navigate("/minha-conta")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive("/minha-conta") ? "text-emerald-500" : "text-white/40"}`}
      >
        <ShoppingBag size={20} />
        <span className="text-[8px] font-black uppercase tracking-widest italic">Pedidos</span>
      </button>

      {user ? (
        <button 
          onClick={() => navigate(dashPath)}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive(dashPath) ? "text-emerald-500" : "text-white/40"}`}
        >
          {user.role === "PROFISSIONAL" ? <Briefcase size={20} /> : <User size={20} />}
          <span className="text-[8px] font-black uppercase tracking-widest italic">Painel</span>
        </button>
      ) : (
        <button 
          onClick={() => navigate("/login")}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive("/login") ? "text-emerald-500" : "text-white/40"}`}
        >
          <User size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest italic">Entrar</span>
        </button>
      )}
    </div>
  );
};

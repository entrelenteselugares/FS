import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Search, ShoppingBag, Image, Menu } from "lucide-react";
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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg)]/80 backdrop-blur-xl border-t border-theme-border/10 z-[100] px-6 py-3 flex items-center justify-between pb-safe">
      <button 
        onClick={() => navigate("/")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
      >
        <Home size={20} strokeWidth={1.5} />
        <span className="text-[7.5px] font-bold uppercase tracking-tight">Home</span>
      </button>

      <button 
        onClick={() => {
          if (location.pathname !== "/") navigate("/");
          setTimeout(() => document.getElementById("vitrine")?.scrollIntoView({ behavior: 'smooth' }), 100);
        }}
        className="flex flex-col items-center gap-1 text-[var(--text)]/40"
      >
        <Search size={20} strokeWidth={1.5} />
        <span className="text-[7.5px] font-bold uppercase tracking-tight">Buscar</span>
      </button>

      <button 
        onClick={() => navigate("/minha-conta")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive("/minha-conta") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
      >
        <ShoppingBag size={20} strokeWidth={1.5} />
        <span className="text-[7.5px] font-bold uppercase tracking-tight">Carrinho</span>
      </button>

      <button 
        onClick={() => navigate("/meus-albuns")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive("/meus-albuns") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
      >
        <Image size={20} strokeWidth={1.5} />
        <span className="text-[7.5px] font-bold uppercase tracking-tight">Meus Álbuns</span>
      </button>

      <button 
        onClick={() => navigate(user ? dashPath : "/login")}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive(dashPath) || isActive("/login") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
      >
        <Menu size={20} strokeWidth={1.5} />
        <span className="text-[7.5px] font-bold uppercase tracking-tight">Opções</span>
      </button>
    </div>
  );
};

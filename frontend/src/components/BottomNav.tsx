import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Home, Image, Bell, User } from "lucide-react";


export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isHome = location.pathname === "/";
  const isAlbums = location.pathname.startsWith("/meus-albuns");
  const isNotifications = location.search.includes("tab=notificacoes");
  const isProfile = location.pathname === "/minha-conta" && !isNotifications;
  
  // Ocultar a bottom nav em áreas onde o layout já provê menu completo (painéis desktop-first)
  // ou áreas públicas isoladas (login, checkout)
  const hiddenPaths = [
    "/checkout",
    "/delivery",
    "/flash",
    "/invitation",
    "/cotacao",
    "/login",
    "/cadastro",
    "/register"
  ];

  const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));

  if (shouldHide) return null;

  return (
    <div
      className="md:hidden fixed bottom-0 left-0 w-full bg-[var(--bg-card)] border-t border-theme-border z-[100] px-3 pt-2 flex items-center justify-around"
      style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}
    >
      <button 
        onClick={() => navigate("/", { replace: true })}
        className={`flex flex-col items-center gap-1 transition-all ${isHome ? "text-emerald-500" : "text-theme-text opacity-40 hover:opacity-100"}`}
      >
        <Home size={20} strokeWidth={isHome ? 2.5 : 1.5} />
        <span className="text-[10px] font-bold uppercase">Vitrine</span>
      </button>

      <button 
        onClick={() => navigate("/meus-albuns", { replace: true })}
        className={`flex flex-col items-center gap-1 transition-all ${isAlbums ? "text-emerald-500" : "text-theme-text opacity-40 hover:opacity-100"}`}
      >
        <Image size={20} strokeWidth={isAlbums ? 2.5 : 1.5} />
        <span className="text-[10px] font-bold uppercase">Álbuns</span>
      </button>

      <button 
        onClick={() => navigate("/minha-conta?tab=notificacoes", { replace: true })}
        className={`flex flex-col items-center gap-1 transition-all ${isNotifications ? "text-emerald-500" : "text-theme-text opacity-40 hover:opacity-100"}`}
      >
        <Bell size={20} strokeWidth={isNotifications ? 2.5 : 1.5} />
        <span className="text-[10px] font-bold uppercase">Notificações</span>
      </button>

      <button 
        onClick={() => navigate("/minha-conta", { replace: true })}
        className={`flex flex-col items-center gap-1 transition-all ${isProfile ? "text-emerald-500" : "text-theme-text opacity-40 hover:opacity-100"}`}
      >
        <User size={20} strokeWidth={isProfile ? 2.5 : 1.5} />
        <span className="text-[10px] font-bold uppercase">Perfil</span>
      </button>
    </div>
  );
};

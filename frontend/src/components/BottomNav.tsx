import React, { useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { Home, Search, ShoppingBag, Image, Menu, X, Play, Briefcase, DollarSign, Calendar, Printer, Settings, Lock, Users, User, Image as ImageIcon } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import type { NavItem } from "./DashboardLayout";

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const s = searchParams.get("s");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (path: string) => location.pathname === path;

  const hiddenPaths = [
    "/admin",
    "/checkout",
    "/delivery",
    "/flash",
    "/invitation",
    // "/meus-albuns",
    // "/minha-conta",
  ];

  const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));

  const NAV_ITEMS = useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { label: "Minhas Memórias", onClick: () => { navigate("/minha-conta?s=fotos"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "fotos", icon: <ImageIcon size={18} /> },
      { label: "Meus Álbuns", onClick: () => { navigate("/meus-albuns"); setDrawerOpen(false); }, isActive: location.pathname.startsWith("/meus-albuns"), icon: <Lock size={18} /> },
      { label: "Carrinho", onClick: () => { navigate("/minha-conta?s=wallet"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "wallet", icon: <ShoppingBag size={18} /> },
      { label: "Indique e Ganhe", onClick: () => { navigate("/minha-conta?s=affiliate"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "affiliate", icon: <Users size={18} /> },
      { label: "Meus Dados", onClick: () => { navigate("/minha-conta?s=menu"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "menu", icon: <User size={18} /> },
    ];

    if (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE") {
      items.push(
        { label: "ÁREA PROFISSIONAL", isHeader: true },
        { label: "Minha Agenda", onClick: () => { navigate("/minha-conta?s=agenda"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "agenda", icon: <Play size={18} /> },
        { label: "Portfólio & Serviços", onClick: () => { navigate("/minha-conta?s=servicos"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "servicos", icon: <Briefcase size={18} /> },
        { label: "Minhas Vendas & Ganhos", onClick: () => { navigate("/minha-conta?s=financeiro"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "financeiro", icon: <DollarSign size={18} /> },
        { label: "Agenda Google", onClick: () => { navigate("/minha-conta?s=calendar"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "calendar", icon: <Calendar size={18} /> }
      );

      if (user?.franchiseProfile) {
        items.push(
          { label: "Franquia Print", onClick: () => { navigate("/minha-conta?s=franquia"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "franquia", icon: <Printer size={18} /> }
        );
      }
    }

    if (user?.role === "CARTORIO" || user?.role === "UNIDADE") {
      items.push(
        { label: "ÁREA DA UNIDADE", isHeader: true },
        { label: "Agenda Unidade", onClick: () => { navigate("/minha-conta?s=agenda"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "agenda", icon: <Play size={18} /> },
        { label: "Fluxo Financeiro", onClick: () => { navigate("/minha-conta?s=financeiro"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "financeiro", icon: <DollarSign size={18} /> },
        { label: "Rede Técnica", onClick: () => { navigate("/minha-conta?s=equipe"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "equipe", icon: <Users size={18} /> },
        { label: "Google Calendar", onClick: () => { navigate("/minha-conta?s=calendar"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "calendar", icon: <Calendar size={18} /> },
        { label: "Franquia Print", onClick: () => { navigate("/minha-conta?s=franquia"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "franquia", icon: <Printer size={18} /> },
        { label: "Configuração Pública", onClick: () => { navigate("/minha-conta?s=configuracoes"); setDrawerOpen(false); }, isActive: location.pathname === "/minha-conta" && s === "configuracoes", icon: <Settings size={18} /> }
      );
    }

    if (user?.role === "ADMIN") {
      items.push(
        { label: "ADMINISTRAÇÃO", isHeader: true },
        { label: "Painel Central", onClick: () => { navigate("/admin"); setDrawerOpen(false); }, isActive: location.pathname.startsWith("/admin"), icon: <Settings size={18} /> }
      );
    }

    return items;
  }, [user, navigate, location.pathname, s]);

  if (shouldHide) return null;

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--bg)]/80 backdrop-blur-xl border-t border-theme-border/10 z-[100] px-3 py-3 flex items-center justify-around pb-safe">
        <button 
          onClick={() => navigate("/")}
          className={`flex flex-col items-center gap-1 transition-colors ${isActive("/") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
        >
          <Home size={20} strokeWidth={1.5} />
          <span className="text-[7.5px] font-bold uppercase tracking-tight">Home</span>
        </button>

        <button 
          onClick={() => {
            if (location.pathname !== "/") {
              navigate("/");
              setTimeout(() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                document.getElementById("mobile-search-input")?.focus();
              }, 100);
            } else {
              window.scrollTo({ top: 0, behavior: "smooth" });
              document.getElementById("mobile-search-input")?.focus();
            }
          }}
          className="flex flex-col items-center gap-1 text-[var(--text)]/40"
        >
          <Search size={20} strokeWidth={1.5} />
          <span className="text-[7.5px] font-bold uppercase tracking-tight">Buscar</span>
        </button>

        <button 
          onClick={() => navigate("/minha-conta?s=wallet")}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname === "/minha-conta" && (s === "wallet" || s === "pedidos") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
        >
          <ShoppingBag size={20} strokeWidth={1.5} />
          <span className="text-[7.5px] font-bold uppercase tracking-tight">Carrinho</span>
        </button>

        <button 
          onClick={() => navigate("/meus-albuns")}
          className={`flex flex-col items-center gap-1 transition-colors ${location.pathname.startsWith("/meus-albuns") ? "text-emerald-500" : "text-[var(--text)]/40"}`}
        >
          <Image size={20} strokeWidth={1.5} />
          <span className="text-[7.5px] font-bold uppercase tracking-tight">Meus Álbuns</span>
        </button>

        <button 
          onClick={() => setDrawerOpen(true)}
          className={`flex flex-col items-center gap-1 transition-colors ${
            drawerOpen ||
            location.pathname.startsWith("/profissional") || 
            location.pathname.startsWith("/unidade-fixa") || 
            location.pathname.startsWith("/admin") || 
            (location.pathname === "/minha-conta" && s !== "wallet" && s !== "pedidos")
              ? "text-emerald-500" 
              : "text-[var(--text)]/40"
          }`}
        >
          <Menu size={20} strokeWidth={1.5} />
          <span className="text-[7.5px] font-bold uppercase tracking-tight">Opções</span>
        </button>
      </div>

      {/* ── Mobile Drawer Backdrop ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] transition-opacity duration-300 md:hidden"
        />
      )}

      {/* ── Mobile Drawer ── */}
      <aside 
        className={`fixed inset-y-0 left-0 bg-[var(--bg)] border-r border-theme-border/60 z-[200] w-72 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border/60">
          <Link to="/" onClick={() => setDrawerOpen(false)}>
            <img src="/logo.png" alt="Foto Segundo" className="h-6 object-contain" style={{ filter: "var(--logo-filter)" }} />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            className="p-1.5 text-zinc-500 hover:text-white rounded-lg border border-theme-border/40 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* User Info / Guest CTA */}
        <div className="p-4 border-b border-theme-border/40 bg-[var(--bg-card)]">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-display font-black text-emerald-500 italic">
                {user.nome.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-black uppercase italic tracking-tight truncate text-white">{user.nome}</p>
                <p className="text-[9px] font-black uppercase tracking-wider text-emerald-500/80">
                  {user.role === "PROFISSIONAL" ? "Profissional da Rede" : user.role === "ADMIN" ? "Administrador" : "Cliente"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Acesse sua conta</p>
              <button
                onClick={() => { navigate("/login"); setDrawerOpen(false); }}
                className="w-full py-2.5 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2 italic"
              >
                <User size={12} />
                Entrar
              </button>
            </div>
          )}
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto py-3">
          {user ? (
            NAV_ITEMS.map((item: NavItem, idx: number) => {
              if (item.isHeader) {
                return (
                  <div
                    key={`header-${idx}`}
                    className="px-5 pt-4 pb-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60"
                  >
                    {item.label}
                  </div>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-medium tracking-wide transition-all border-none text-left bg-transparent ${
                    item.isActive 
                      ? "bg-zinc-900/60 text-white font-black" 
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className={item.isActive ? "text-emerald-500" : "text-zinc-500"}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => { navigate("/"); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-xs text-zinc-400 hover:text-white transition-colors border-none bg-transparent text-left"
              >
                <Home size={18} className="text-zinc-500" />
                Vitrine de Eventos
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

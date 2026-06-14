import React, { useState, useMemo } from "react";
import { useNavigate, useLocation, useSearchParams, Link } from "react-router-dom";
import { Home, Search, ShoppingBag, Image, Menu, X, Play, Briefcase, DollarSign, Printer, Settings, Lock, Users, User, Wallet, Building2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
// ImageIcon alias for portfolio nav item
const ImageIcon = Image;
import type { NavItem } from "./DashboardLayout";
import { Camera } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const s = searchParams.get("s");

  const [drawerOpen, setDrawerOpen] = useState(false);

  const startNativeCameraCapture = () => {
    const currentEventId = window.fsCurrentEventId || "EVENT_TESTE";
    navigate(`/phygital-capture?e=${currentEventId}&camera=true`);
  };

  const isActive = (path: string) => location.pathname === path;

  const hiddenPaths = [
    "/checkout",
    "/delivery",
    "/flash",
    "/invitation",
    "/cotacao",
    "/login",
    "/cadastro",
    "/register",
    "/meus-albuns/",
    "/admin",
    "/profissional",
    // "/franquia",
    "/unidade-fixa",
    // "/minha-conta",
  ];

  const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));

  const NAV_ITEMS = useMemo<NavItem[]>(() => {
    const tab = searchParams.get("tab") || searchParams.get("s");

    const items: NavItem[] = [
      { label: "Histórico de Compras", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=files", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && (tab === "files" || tab === "fotos" || tab === "pedidos"), icon: <ShoppingBag size={18} /> },
      { label: "Meus Álbuns", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/meus-albuns", { replace: true }), 50); }, isActive: location.pathname.startsWith("/meus-albuns"), icon: <Lock size={18} /> },
      { label: "Minha Carteira", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=wallet", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "wallet", icon: <Wallet size={18} /> },
      { label: "Indique e Ganhe", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=affiliate", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "affiliate", icon: <Users size={18} /> },
      { label: "Meus Dados", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=profile", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "profile", icon: <User size={18} /> },
    ];

    // Strict role check: only genuine PROFISSIONAL or FRANCHISEE roles unlock pro/franchise menus.
    // Do NOT rely solely on franchiseProfile presence — admins also have it and must not bleed into this path.
    const isProOrFranchise = user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE";
    const isVerified = (user?.verificationStatus === "APPROVED" || user?.isVerified || !!user?.franchiseProfile) &&
      user?.role !== "UNIDADE" && user?.role !== "CARTORIO";

    if (isProOrFranchise && isVerified) {
      items.push(
        { label: "PAINEL PROFISSIONAL", isHeader: true },
        { label: "Minha Agenda", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=agenda", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && (tab === "agenda" || tab === "convites"), icon: <Play size={18} /> },
        { label: "Meu Portfólio", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=portfolio", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "portfolio", icon: <ImageIcon size={18} /> },
        { label: "Serviços & Preços", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=servicos", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "servicos", icon: <Briefcase size={18} /> },
        { label: "Ficha Técnica & Pix", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=perfil", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "perfil", icon: <Settings size={18} /> },
        { label: "Vendas & Ganhos", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=financeiro", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "financeiro", icon: <DollarSign size={18} /> }
      );

      if (user?.role === "FRANCHISEE" || user?.franchiseProfile) {
        items.push({ label: "GESTÃO DE FRANQUIA", isHeader: true });

        if (user?.role === "FRANCHISEE") {
          items.push(
            { label: "Painel da Franquia", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/franquia", { replace: true }), 50); }, isActive: location.pathname === "/franquia", icon: <Building2 size={18} /> }
          );
        }
        items.push(
          { label: "Rede Técnica", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=equipe", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "equipe", icon: <Users size={18} /> },
          { label: "Franquia Print", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=franquia", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "franquia", icon: <Printer size={18} /> }
        );
      }
    }

    if ((user?.role === "CARTORIO" || user?.role === "UNIDADE") && user?.verificationStatus === "APPROVED") {
      items.push(
        { label: "GESTÃO DA UNIDADE", isHeader: true },
        { label: "Agenda Unidade", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=agenda", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "agenda", icon: <Play size={18} /> },
        { label: "Fluxo Financeiro", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=financeiro", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "financeiro", icon: <DollarSign size={18} /> },
        { label: "Rede Técnica", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=equipe", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "equipe", icon: <Users size={18} /> },
        { label: "Configuração Pública", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=configuracoes", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "configuracoes", icon: <Settings size={18} /> }
      );

      if (user?.franchiseProfile) {
        items.push(
          { label: "Franquia Print", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=franquia", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "franquia", icon: <Printer size={18} /> },
          { label: "Monitor de Fila", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/minha-conta?tab=monitor", { replace: true }), 50); }, isActive: location.pathname === "/minha-conta" && tab === "monitor", icon: <Settings size={18} /> }
        );
      }
    }

    if (user?.role === "ADMIN") {
      items.push(
        { label: "ADMINISTRAÇÃO", isHeader: true },
        { label: "Painel Central", onClick: () => { setDrawerOpen(false); setTimeout(() => navigate("/admin", { replace: true }), 50); }, isActive: location.pathname.startsWith("/admin"), icon: <Settings size={18} /> }
      );
    }

    return items;
  }, [user, navigate, location.pathname, searchParams]);

  if (shouldHide) return null;

  const isEventPage = location.pathname.startsWith("/e/");

  return (
    <>
      <div className="md:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--bg)]/80 backdrop-blur-xl border-t border-theme-border/10 z-[100] px-3 py-3 flex items-center justify-around pb-safe">
        {isEventPage ? (
          <>
            <button 
              onClick={() => navigate("/", { replace: true })}
              className="flex flex-col items-center gap-1 text-theme-text opacity-40 transition-all hover:opacity-100"
            >
              <Home size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Home</span>
            </button>

            {user && (
              <button 
                onClick={() => navigate("/minha-conta?s=files", { replace: true })}
                className="flex flex-col items-center gap-1 text-theme-text opacity-40 transition-all hover:opacity-100"
              >
                <ShoppingBag size={20} strokeWidth={1.5} />
                <span className="text-[7.5px] font-bold uppercase">Compras</span>
              </button>
            )}

            <button 
              onClick={startNativeCameraCapture}
              className="flex flex-col items-center gap-1 transition-all text-brand-tactical"
            >
              <Camera size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Câmera</span>
            </button>

            {user && (
              <button 
                onClick={() => navigate("/meus-albuns", { replace: true })}
                className="flex flex-col items-center gap-1 text-theme-text opacity-40 transition-all hover:opacity-100"
              >
                <Image size={20} strokeWidth={1.5} />
                <span className="text-[7.5px] font-bold uppercase">Álbuns</span>
              </button>
            )}

            <button 
              onClick={() => setDrawerOpen(true)}
              className="flex flex-col items-center gap-1 text-theme-text opacity-40 transition-all hover:opacity-100"
            >
              <Menu size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Menu</span>
            </button>
          </>
        ) : (
          <>
            <button 
              onClick={() => navigate("/", { replace: true })}
              className={`flex flex-col items-center gap-1 transition-all ${isActive("/") ? "text-theme-brand" : "text-theme-text opacity-40"}`}
            >
              <Home size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Home</span>
            </button>

            <button 
              onClick={() => {
                if (location.pathname !== "/") {
                  navigate("/", { replace: true });
                  setTimeout(() => {
                    window.scrollTo({ top: 0, behavior: "smooth" });
                    document.getElementById("mobile-search-input")?.focus();
                  }, 100);
                } else {
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  document.getElementById("mobile-search-input")?.focus();
                }
              }}
              className="flex flex-col items-center gap-1 text-theme-text opacity-40 transition-all hover:opacity-100"
            >
              <Search size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Buscar</span>
            </button>

            {user && (
              <>
                <button 
                  onClick={() => navigate("/minha-conta?s=files", { replace: true })}
                  className={`flex flex-col items-center gap-1 transition-all ${location.pathname === "/minha-conta" && (s === "files" || s === "fotos" || s === "wallet" || s === "pedidos") ? "text-theme-brand" : "text-theme-text opacity-40"}`}
                >
                  <ShoppingBag size={20} strokeWidth={1.5} />
                  <span className="text-[7.5px] font-bold uppercase">Compras</span>
                </button>

                <button 
                  onClick={() => navigate("/meus-albuns", { replace: true })}
                  className={`flex flex-col items-center gap-1 transition-all ${location.pathname.startsWith("/meus-albuns") ? "text-theme-brand" : "text-theme-text opacity-40"}`}
                >
                  <Image size={20} strokeWidth={1.5} />
                  <span className="text-[7.5px] font-bold uppercase">Meus Álbuns</span>
                </button>
              </>
            )}

            <button 
              onClick={() => setDrawerOpen(true)}
              className={`flex flex-col items-center gap-1 transition-all ${
                drawerOpen ||
                location.pathname.startsWith("/profissional") || 
                location.pathname.startsWith("/unidade-fixa") || 
                location.pathname.startsWith("/admin") || 
                location.pathname.startsWith("/franquia") || 
                (location.pathname === "/minha-conta" && s !== "wallet" && s !== "pedidos")
                  ? "text-theme-brand" 
                  : "text-theme-text opacity-40"
              }`}
            >
              <Menu size={20} strokeWidth={1.5} />
              <span className="text-[7.5px] font-bold uppercase">Opções</span>
            </button>
          </>
        )}
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
        className={`fixed inset-y-0 left-0 bg-[var(--bg)] border-r border-theme-border z-[200] w-72 flex flex-col transition-transform duration-300 ease-out md:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-4 border-b border-theme-border">
          <Link to="/" onClick={() => setDrawerOpen(false)}>
            <img src="/logo.png" alt="Foto Segundo" className="h-6 object-contain" style={{ filter: "var(--logo-filter)" }} />
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setDrawerOpen(false)}
              className="p-1.5 text-theme-muted hover:text-theme-text rounded-lg border border-theme-border transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* User Info / Guest CTA */}
        <div className="p-4 border-b border-theme-border bg-[var(--bg-card)]">
          {user ? (
            <div className="flex items-center gap-3">
              {user.profileImageUrl ? (
                <img src={user.profileImageUrl} alt={user.nome} className="w-9 h-9 rounded-full object-cover border border-emerald-500/30" />
              ) : (
                <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-display font-bold text-theme-brand">
                  {user.nome?.charAt(0)?.toUpperCase() || "?"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold uppercase truncate text-theme-text">{user.nome}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-theme-brand/80">
                  {user.role === "PROFISSIONAL" ? "Profissional da Rede" : user.role === "ADMIN" ? "Administrador" : user.role === "FRANCHISEE" ? "Franqueado" : user.role === "UNIDADE" ? "Unidade Fixa" : user.role === "CARTORIO" ? "Cartório" : "Cliente"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Acesse sua conta</p>
              <button
                onClick={() => { navigate("/login"); setDrawerOpen(false); }}
                className="w-full py-2.5 bg-emerald-500 text-theme-text text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2"
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
                    className="px-5 pt-4 pb-1.5 text-[9px] font-bold uppercase tracking-[0.2em] text-theme-brand/60"
                  >
                    {item.label}
                  </div>
                );
              }

              return (
                <button
                  key={item.label}
                  onClick={item.onClick}
                  className={`w-full flex items-center gap-3 px-5 py-3 text-xs font-medium tracking-wide transition-all border-none text-left mx-2 w-[calc(100%-16px)] rounded-xl ${
                    item.isActive 
                      ? "bg-theme-bg-muted text-theme-text font-black shadow-sm" 
                      : "bg-transparent text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-muted/50"
                  }`}
                >
                  <span className={item.isActive ? "text-brand-tactical" : "text-theme-text-muted opacity-70"}>{item.icon}</span>
                  {item.label}
                </button>
              );
            })
          ) : (
            <div className="space-y-1">
              <button
                onClick={() => { navigate("/"); setDrawerOpen(false); }}
                className="w-full flex items-center gap-3 px-5 py-3 text-xs text-theme-text-muted hover:text-theme-text hover:bg-theme-bg-muted/50 transition-colors border-none bg-transparent text-left mx-2 w-[calc(100%-16px)] rounded-xl"
              >
                <Home size={18} className="text-theme-text-muted opacity-70" />
                Vitrine de Eventos
              </button>
            </div>
          )}
        </nav>
      </aside>
    </>
  );
};

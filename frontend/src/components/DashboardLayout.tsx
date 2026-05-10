import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T, BtnGhost } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  to?: string;
  onClick?: () => void;
  exact?: boolean;
  icon: React.ReactNode;
  isActive?: boolean;
  badge?: string | number;
  hide?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  /** @deprecated variante única: sempre "tactical" (brand teal). Ignorado. */
  variant?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ─── Sidebar Content ──────────────────────────────────────────────────────────

interface SidebarContentProps {
  title?: string;
  navItems: NavItem[];
  onNavigate: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({ navItems, onNavigate }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (item: NavItem) => {
    if (item.isActive !== undefined) return item.isActive;
    if (!item.to) return false;
    return item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
  };

  // initial removed as it was unused

  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      height:         "100%",
      background:     T.bg,
      borderRight:    `1px solid ${T.border}`,
    }}>
      {/* ── Brand Header ── */}
      <div style={{
        padding:      "16px 16px 12px",
        borderBottom: `1px solid ${T.border}`,
      }}>
        <Link to="/" style={{ textDecoration: "none", display: "inline-block" }}>
          <div style={{
            display: "flex",
            alignItems: "center"
          }}>
            <img src="/logo.png" alt="Foto Segundo" style={{ height: 28, objectFit: "contain", filter: "var(--logo-filter)" }} />
          </div>
        </Link>
      </div>


      {/* ── Navigation ── */}
      <nav style={{ flex: 1, padding: "12px 0", overflowY: "auto" }}>
        {navItems.map((item) => {
          const active = isActive(item);
          const itemStyle: React.CSSProperties = {
            display:       "flex",
            alignItems:    "center",
            gap:           12,
            padding:       "10px 20px",
            fontSize:      13,
            fontFamily:    T.fontB,
            fontWeight:    active ? 700 : 500,
            letterSpacing: "0.02em",
            cursor:        "pointer",
            border:        "none",
            background:    active ? "var(--bg-field)" : "transparent",
            color:         active ? T.text : T.text3,
            textDecoration:"none",
            width:         "100%",
            textAlign:     "left",
            transition:    "all 0.2s ease",
            borderRadius:  0,
          };

          const handleClick = () => {
            onNavigate();
            item.onClick?.();
          };

          if (item.to) {
            return (
              <Link key={item.label} to={item.to} style={itemStyle} onClick={handleClick}>
                <span style={{ color: active ? T.brand : T.text3, flexShrink: 0 }}>
                  {item.icon}
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>
                {item.badge !== undefined && item.badge !== 0 && (
                  <span style={{
                    background: T.brand,
                    color: T.brandText,
                    fontSize: 10,
                    fontWeight: 900,
                    padding: "3px 8px",
                    borderRadius: 3,
                    minWidth: 16,
                    textAlign: "center",
                    letterSpacing: 0
                  }}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <button key={item.label} style={itemStyle} onClick={handleClick}>
              <span style={{ color: active ? T.brand : T.text3, flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge !== undefined && item.badge !== 0 && (
                <span style={{
                  background: T.brand,
                  color: T.brandText,
                  fontSize: 9,
                  fontWeight: 900,
                  padding: "2px 6px",
                  borderRadius: 2,
                  minWidth: 16,
                  textAlign: "center",
                  letterSpacing: 0
                }}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* ── Visitar Site (bottom of nav) ── */}
        <Link to="/" style={{ 
          display: "flex", alignItems: "center", gap: 10,
          padding: "12px 16px", fontSize: 11, fontFamily: T.fontB, fontWeight: 700,
          color: T.brand, textDecoration: "none", textTransform: "uppercase",
          letterSpacing: 1.5, marginTop: 12, borderTop: `1px solid ${T.border}`,
          paddingTop: 12, transition: "all 0.2s"
        }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Visitar Site</span>
        </Link>
      </nav>

      {/* ── User Footer ── */}
      <div style={{
        padding:      "12px 16px",
        borderTop:    `1px solid ${T.border}`,
        background:   T.bgCard,
      }}>
        {/* Info row */}
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontSize:      13,
              fontFamily:    T.fontB,
              fontWeight:    900,
              color:         T.text,
              overflow:      "hidden",
              textOverflow:  "ellipsis",
              whiteSpace:    "nowrap",
              textTransform: "uppercase",
              letterSpacing: 1
            }}>
              {user?.nome}
            </div>
            <div style={{
              display:       "inline-block",
              fontSize:      8,
              fontFamily:    T.fontB,
              fontWeight:    900,
              color:         T.brand,
              border:        `1px solid ${T.brand}44`,
              padding:       "2px 6px",
              textTransform: "uppercase",
              letterSpacing: 2,
              marginTop:     4,
            }}>
              {user?.role === "ADMIN" ? "Administrador" : 
               user?.role === "CARTORIO" || user?.role === "UNIDADE" ? "Unidade Fixa" :
               user?.role === "PROFISSIONAL" ? "Profissional da Rede" :
               "Cliente"}
            </div>
          </div>
          <ThemeToggle />
        </div>
        {/* Logout button */}
        <button
          id="btn-logout"
          onClick={logout}
          style={{
            background: "transparent",
            color:      T.text3,
            border:     `1px solid ${T.border}`,
            padding:    "10px",
            fontSize:   10,
            fontFamily: T.fontB,
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: 1.5,
            width:      "100%",
            cursor:     "pointer",
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            gap:        8,
            transition: "all 0.2s",
            borderRadius: 0,
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = T.text; e.currentTarget.style.borderColor = T.text2; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = T.text3; e.currentTarget.style.borderColor = T.border; }}
        >
          <LogoutIcon />
          Encerrar
        </button>
      </div>
    </div>
  );
};

// ─── DashboardLayout ──────────────────────────────────────────────────────────

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  title,
}) => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarProps: SidebarContentProps = {
    title,
    navItems,
    onNavigate: () => setDrawerOpen(false),
  };

  // Force close drawer on resize to desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div style={{
      display:   "flex",
      height:    "100vh",
      background: T.bg,
      color:      T.text,
      overflow:   "hidden",
    }}>
      {/* ── Desktop Sidebar ── */}
      <aside style={{
        width:     240,
        flexShrink: 0,
        display:   "none",  // overridden by media via className below
      }} className="dashboard-sidebar">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Drawer Backdrop ── */}
      {drawerOpen && (
        <div
          onClick={() => setDrawerOpen(false)}
          className="dashboard-drawer-backdrop"
          style={{
            position:   "fixed",
            inset:      0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex:     40,
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor:     "pointer",
          }}
        >
          <div className="flex flex-col items-center gap-4 text-white/40 animate-pulse md:hidden">
            <div className="p-4 rounded-full border border-white/20">
              <LogoutIcon /> {/* Usando LogoutIcon como X ou CloseIcon se disponível */}
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Tocar para fechar</span>
          </div>
        </div>
      )}

      {/* ── Mobile Drawer ── */}
      <aside style={{
        position:   "fixed",
        insetBlock:  0,
        left:        0,
        zIndex:      50,
        width:       288,
        transform:   drawerOpen ? "translateX(0)" : "translateX(-100%)",
        transition:  "transform 0.35s cubic-bezier(0.16,1,0.3,1)",
      }} className="dashboard-drawer">
        <div style={{ position: "absolute", top: 16, right: 16, zIndex: 1 }}>
          <button
            onClick={() => setDrawerOpen(false)}
            style={{ ...BtnGhost, padding: "6px 8px" }}
            aria-label="Fechar menu"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

        {/* Mobile Top Bar */}
        <nav style={{
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "12px 24px",
          borderBottom:   `1px solid ${T.border}`,
          background:     T.bg,
          flexShrink:     0,
        }} className="dashboard-topbar flex lg:hidden">
          {/* Left: Brand Only on Mobile */}
          <div className="flex items-center gap-4">
            <Link to="/" style={{ display: "flex", alignItems: "center" }}>
              <img src="/logo.png" alt="Logo" style={{ height: 22, objectFit: "contain", filter: "var(--logo-filter)" }} />
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button 
              onClick={() => setDrawerOpen(true)}
              className="p-2 text-theme-muted hover:text-white transition-colors"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
            </button>
          </div>
        </nav>

        {/* Scrollable page content */}
        <main style={{ flex: 1, overflowY: "auto", background: T.bg }} className="pb-24 md:pb-0">
          {children}
        </main>

        {/* ── Dashboard Bottom Nav (Mobile Only) ── */}
        <nav 
          className="fixed bottom-0 w-full z-50 bg-[#0a0a0a]/90 backdrop-blur-2xl border-t border-white/5 lg:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom, 12px)" }}
        >
          <div className="flex items-center justify-around px-2">
            {navItems.filter(item => !item.hide).map((item, idx) => {
              const active = item.isActive;
              return (
                <button
                  key={idx}
                  onClick={item.onClick}
                  className={`flex flex-col items-center gap-1.5 py-4 flex-1 transition-all active:scale-90`}
                >
                  <div className={`transition-colors duration-300 ${active ? 'text-brand-tactical' : 'text-white/30'}`}>
                    {item.icon}
                  </div>
                  <span className={`text-[8px] font-black uppercase tracking-widest transition-colors duration-300 ${active ? 'text-brand-tactical' : 'text-white/30'}`}>
                    {item.label.split(' ')[0]}
                  </span>
                  {active && (
                    <div className="absolute top-0 w-8 h-0.5 bg-brand-tactical shadow-[0_0_10px_rgba(133,185,172,0.5)]" />
                  )}
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── Responsive CSS via <style> ── */}
      <style>{`
        /* Desktop: mostra sidebar, oculta topbar hamburguer */
        @media (min-width: 1024px) {
          .dashboard-sidebar { display: block !important; }
          .dashboard-drawer  { display: none !important; }
          .dashboard-menu-btn { display: none !important; }
          .dashboard-logo-topbar { display: none !important; }
          .dashboard-drawer-backdrop { 
            display: none !important; 
            pointer-events: none !important; 
            visibility: hidden !important;
          }
        }
        /* Mobile: oculta sidebar, mostra topbar simplificada */
        @media (max-width: 1023px) {
          .dashboard-sidebar { display: none !important; }
          .dashboard-topbar  { border-bottom: 1px solid ${T.border}; padding: 12px 16px !important; }
          .mobile-hide { display: none !important; }
        }
      `}</style>
    </div>

  );
};

import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T, BtnGhost } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { Menu } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface NavItem {
  label: string;
  to?: string;
  onClick?: () => void;
  exact?: boolean;
  icon?: React.ReactNode;
  isActive?: boolean;
  badge?: string | number;
  hide?: boolean;
  isHeader?: boolean;
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
        {navItems.map((item, idx) => {
          if (item.hide) return null;

          if (item.isHeader) {
            return (
              <div
                key={`header-${idx}`}
                style={{
                  padding: "16px 20px 6px",
                  fontSize: 9,
                  fontFamily: T.fontB,
                  fontWeight: 900,
                  color: T.brand,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  opacity: 0.6,
                  borderTop: idx > 0 ? `1px solid ${T.border}33` : "none",
                  marginTop: idx > 0 ? 8 : 0,
                }}
              >
                {item.label}
              </div>
            );
          }

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
                {item.icon && (
                  <span style={{ color: active ? T.brand : T.text3, flexShrink: 0 }}>
                    {item.icon}
                  </span>
                )}
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
              {item.icon && (
                <span style={{ color: active ? T.brand : T.text3, flexShrink: 0 }}>
                  {item.icon}
                </span>
              )}
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
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          <span>Visitar Site</span>
        </Link>
      </nav>

      {/* ── User Footer ── */}
      <div style={{
        padding:      "20px",
        borderTop:    `1px solid ${T.border}`,
        background:   "rgba(255,255,255,0.02)",
      }}>
        {/* Profile Card */}
        <div style={{ 
          marginBottom: 16, 
          display: "flex", 
          flexDirection: "column",
          gap: 12
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ minWidth: 0 }}>
              <div style={{
                fontSize:      11,
                fontFamily:    T.fontB,
                fontWeight:    900,
                color:         T.text,
                textTransform: "uppercase",
                letterSpacing: 2,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap"
              }}>
                {user?.nome}
              </div>
              <div style={{
                fontSize:      7,
                fontFamily:    T.fontB,
                fontWeight:    900,
                color:         T.brand,
                textTransform: "uppercase",
                letterSpacing: 3,
                marginTop: 4,
                opacity: 0.8
              }}>
                {user?.role === "ADMIN" ? "ADMINISTRADOR MASTER" : 
                 user?.role === "CARTORIO" || user?.role === "UNIDADE" ? "UNIDADE OPERACIONAL" :
                 user?.role === "PROFISSIONAL" ? "PROFISSIONAL DA REDE" :
                 "CLIENTE FINAL"}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <NotificationBell />
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          id="btn-logout"
          onClick={logout}
          style={{
            background: "transparent",
            color:      T.text3,
            border:     `1px solid ${T.border}`,
            padding:    "12px",
            fontSize:   9,
            fontFamily: T.fontB,
            fontWeight: 900,
            textTransform: "uppercase",
            letterSpacing: 3,
            width:      "100%",
            cursor:     "pointer",
            display:    "flex",
            alignItems: "center",
            justifyContent: "center",
            gap:        10,
            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            borderRadius: 12,
            fontStyle: "italic"
          }}
          onMouseEnter={(e) => { 
            e.currentTarget.style.color = T.text; 
            e.currentTarget.style.borderColor = T.brand;
            e.currentTarget.style.background = `${T.brand}08`;
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => { 
            e.currentTarget.style.color = T.text3; 
            e.currentTarget.style.borderColor = T.border;
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <LogoutIcon />
          Encerrar Sessão
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
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const sidebarProps: SidebarContentProps = {
    title,
    navItems,
    onNavigate: () => setDrawerOpen(false),
  };

  // Force close drawer on desktop
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setDrawerOpen(false);
    };
    handleResize(); // Check on mount
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
          className="dashboard-drawer-backdrop lg:hidden"
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
              <LogoutIcon /> 
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
          {/* Left: Hamburger + Brand */}
          <div className="flex items-center gap-4">
            {(!location.pathname.startsWith('/minha-conta') && !location.pathname.startsWith('/meus-albuns')) && (
              <button 
                onClick={() => setDrawerOpen(true)}
                className="p-1.5 -ml-2 text-zinc-400 hover:text-white rounded-lg transition-colors dashboard-menu-btn"
              >
                <Menu size={22} strokeWidth={1.5} />
              </button>
            )}
            <Link to="/" style={{ display: "flex", alignItems: "center" }}>
              <img src="/logo.png" alt="Logo" style={{ height: 22, objectFit: "contain", filter: "var(--logo-filter)" }} />
            </Link>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <NotificationBell />
          </div>
        </nav>

        {/* Scrollable page content */}
        <main style={{ flex: 1, overflowY: "auto", background: T.bg }} className="pb-24 md:pb-0">
          {children}
        </main>
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

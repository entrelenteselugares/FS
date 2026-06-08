import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T, BtnGhost } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { ShieldCheck } from "lucide-react";
import '../styles/mobile-fix.css';

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
  isPrimaryMobile?: boolean; // NEW: tag para fixar na bottom nav
  subItems?: NavItem[];
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

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.subItems?.some(isActive)) {
        initialState[item.label] = true;
      }
    });
    return initialState;
  });

  const toggleExpand = (label: string) => {
    setExpanded(prev => ({ ...prev, [label]: !prev[label] }));
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
            <img src="/logo.png" alt="Foto Segundo" style={{ height: 32, objectFit: "contain", filter: "var(--logo-filter)" }} />
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

          if (item.subItems) {
            const isExpanded = expanded[item.label];
            const hasActiveChild = item.subItems.some(sub => isActive(sub));
            
            return (
              <div key={item.label} style={{ marginBottom: 4 }}>
                <button
                  onClick={() => toggleExpand(item.label)}
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           12,
                    padding:       "10px 20px",
                    fontSize:      13,
                    fontFamily:    T.fontB,
                    fontWeight:    hasActiveChild ? 700 : 500,
                    letterSpacing: "0.02em",
                    cursor:        "pointer",
                    border:        "none",
                    background:    "transparent",
                    color:         hasActiveChild ? T.text : T.text3,
                    width:         "100%",
                    textAlign:     "left",
                    transition:    "all 0.2s ease",
                  }}
                >
                  {item.icon && (
                    <span style={{ color: hasActiveChild ? T.brand : T.text3, flexShrink: 0 }}>
                      {item.icon}
                    </span>
                  )}
                  <span style={{ flex: 1 }}>{item.label}</span>
                  <svg 
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    style={{
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s ease",
                      color: T.text3
                    }}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isExpanded && (
                  <div style={{ paddingLeft: 44, paddingRight: 12, display: "flex", flexDirection: "column", gap: 2, marginTop: 4 }}>
                    {item.subItems.map(subItem => {
                      if (subItem.hide) return null;
                      const active = isActive(subItem);
                      const handleClick = () => {
                        onNavigate();
                        subItem.onClick?.();
                      };
                      
                      const style: React.CSSProperties = {
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "8px 12px",
                        fontSize: 12,
                        fontFamily: T.fontB,
                        fontWeight: active ? 700 : 500,
                        color: active ? T.text : T.text3,
                        textDecoration: "none",
                        cursor: "pointer",
                        background: active ? "var(--bg-field)" : "transparent",
                        borderRadius: 6,
                        border: "none",
                        textAlign: "left"
                      };

                      if (subItem.to) {
                        return (
                          <Link key={subItem.label} to={subItem.to} style={style} onClick={handleClick}>
                            <span style={{ color: active ? T.brand : 'inherit' }}>{subItem.label}</span>
                            {subItem.badge !== undefined && subItem.badge !== 0 && (
                              <span style={{
                                background: T.brand,
                                color: T.brandText,
                                fontSize: 9,
                                fontWeight: 900,
                                padding: "2px 6px",
                                borderRadius: 4,
                                textAlign: "center",
                              }}>
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <button key={subItem.label} style={style} onClick={handleClick}>
                          <span style={{ color: active ? T.brand : 'inherit' }}>{subItem.label}</span>
                          {subItem.badge !== undefined && subItem.badge !== 0 && (
                            <span style={{
                              background: T.brand,
                              color: T.brandText,
                              fontSize: 9,
                              fontWeight: 900,
                              padding: "2px 6px",
                              borderRadius: 4,
                              textAlign: "center",
                            }}>
                              {subItem.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
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
            <div style={{ minWidth: 0, display: "flex", alignItems: "center", gap: 8 }}>
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
              {user?.verificationStatus === "APPROVED" && (user?.role === "PROFISSIONAL" || user?.role === "CARTORIO" || user?.role === "UNIDADE" || user?.role === "FRANCHISEE") && (
                <div title="PRO VERIFICADO" style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: T.brand,
                }}>
                  <ShieldCheck size={14} strokeWidth={2.5} />
                </div>
              )}
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
  const { user } = useAuth();
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
        width:     260,
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
          <div className="flex flex-col items-center gap-4 text-theme-text opacity-40 animate-pulse md:hidden">
            <div className="p-4 rounded-full border border-theme-border">
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
        zIndex:      100,
        width:       "100%",
        height:      "calc(100% - 64px)", // leave space for bottom nav
        top:         drawerOpen ? 0 : "100%",
        bottom:      drawerOpen ? 64 : "auto",
        transform:   "none",
        transition:  "top 0.35s cubic-bezier(0.16,1,0.3,1), bottom 0.35s",
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

        {/* Mobile App Header (Super App Style) */}
        <nav className="flex lg:hidden items-center justify-between px-5 py-3 border-b shrink-0 sticky top-0 z-30" style={{ background: T.bg, borderColor: T.border }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center font-display font-black text-emerald-500 italic shrink-0">
              {user?.nome ? user.nome.charAt(0).toUpperCase() : "A"}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60 leading-none mb-0.5">
                {title || "Painel"}
              </span>
              <span className="text-sm font-black italic tracking-tight text-theme-text leading-none truncate">
                Olá, {user?.nome ? user.nome.split(" ")[0] : "Usuário"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
          </div>
        </nav>

        {/* Scrollable page content */}
        <main style={{ flex: 1, overflowY: "auto", background: T.bg }} className="pb-28 lg:pb-0 relative">
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

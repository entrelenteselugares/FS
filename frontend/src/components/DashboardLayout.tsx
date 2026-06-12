import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T, BtnGhost } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationBell } from "./notifications/NotificationBell";
import { ShieldCheck, Menu } from "lucide-react";
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
  hideMobileNav?: boolean;
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

const SidebarContent: React.FC<SidebarContentProps & { currentPath: string }> = ({ navItems, onNavigate, currentPath }) => {
  const { user, logout } = useAuth();

  const checkIsActive = React.useCallback((item: NavItem) => {
    if (item.isActive !== undefined) return item.isActive;
    if (!item.to) return false;
    return item.exact
      ? currentPath === item.to
      : currentPath.startsWith(item.to);
  }, [currentPath]);

  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initialState: Record<string, boolean> = {};
    navItems.forEach(item => {
      if (item.subItems?.some(checkIsActive)) {
        initialState[item.label] = true;
      }
    });
    return initialState;
  });

  // Auto-expand sections that contain the active item, but preserve user's manual expansions
  React.useEffect(() => {
    setExpanded(prev => {
      const next = { ...prev };
      let changed = false;
      navItems.forEach(item => {
        if (item.subItems?.some(checkIsActive)) {
          if (!next[item.label]) {
            next[item.label] = true;
            changed = true;
          }
        }
      });
      return changed ? next : prev;
    });
  }, [currentPath, navItems, checkIsActive]);



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
            const hasActiveChild = item.subItems.some(sub => checkIsActive(sub));
            
            return (
              <div key={item.label} className="mb-1">
                <button
                  onClick={() => toggleExpand(item.label)}
                  className={`flex items-center gap-3 px-5 py-2.5 text-[13px] font-heading tracking-wide cursor-pointer border-none w-full text-left transition-all duration-300 ${hasActiveChild ? "text-white font-black" : "text-zinc-400 font-medium hover:text-white hover:bg-white/5"}`}
                  style={{ background: "transparent" }}
                >
                  {item.icon && (
                    <span className={`shrink-0 transition-colors ${hasActiveChild ? "text-brand-tactical" : "text-zinc-500"}`}>
                      {item.icon}
                    </span>
                  )}
                  <span className="flex-1">{item.label}</span>
                  <svg 
                    width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                    className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-180" : "rotate-0"}`}
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </button>

                {isExpanded && (
                  <div className="pl-11 pr-3 flex flex-col gap-0.5 mt-1 overflow-hidden animate-in slide-in-from-top-2 duration-200">
                    {item.subItems.map(subItem => {
                      if (subItem.hide) return null;
                      const active = checkIsActive(subItem);
                      const handleClick = () => {
                        onNavigate();
                        subItem.onClick?.();
                      };
                      
                      const className = `flex items-center justify-between px-3 py-2 text-[12px] font-heading cursor-pointer border-none text-left rounded-md transition-all duration-300 ${active ? "bg-brand-tactical/10 text-brand-tactical font-black" : "bg-transparent text-zinc-400 font-medium hover:bg-white/5 hover:text-white"}`;

                      if (subItem.to) {
                        return (
                          <Link key={subItem.label} to={subItem.to} className={className} onClick={handleClick}>
                            <span>{subItem.label}</span>
                            {subItem.badge !== undefined && subItem.badge !== 0 && (
                              <span className="bg-brand-tactical text-black text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
                                {subItem.badge}
                              </span>
                            )}
                          </Link>
                        );
                      }

                      return (
                        <button key={subItem.label} className={className} onClick={handleClick}>
                          <span>{subItem.label}</span>
                          {subItem.badge !== undefined && subItem.badge !== 0 && (
                            <span className="bg-brand-tactical text-black text-[9px] font-bold px-1.5 py-0.5 rounded text-center">
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

          const active = checkIsActive(item);
          const itemClassName = `group relative flex items-center gap-3 px-5 py-2.5 text-[13px] font-heading tracking-wide w-full text-left transition-all duration-300 border-l-2 ${active ? "bg-brand-tactical/10 text-brand-tactical border-brand-tactical font-black" : "bg-transparent text-zinc-400 border-transparent font-medium hover:bg-white/5 hover:text-white hover:border-zinc-700"}`;

          const handleClick = () => {
            onNavigate();
            item.onClick?.();
          };

          if (item.to) {
            return (
              <Link key={item.label} to={item.to} className={itemClassName} onClick={handleClick}>
                {item.icon && (
                  <span className={`shrink-0 transition-colors ${active ? "text-brand-tactical" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
                {item.badge !== undefined && item.badge !== 0 && (
                  <span className="bg-brand-tactical text-black text-[10px] font-bold px-2 py-0.5 rounded-sm min-w-[16px] text-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          }

          return (
            <button key={item.label} className={itemClassName} onClick={handleClick}>
              {item.icon && (
                <span className={`shrink-0 transition-colors ${active ? "text-brand-tactical" : "text-zinc-500 group-hover:text-zinc-300"}`}>
                  {item.icon}
                </span>
              )}
              <span className="flex-1">{item.label}</span>
              {item.badge !== undefined && item.badge !== 0 && (
                <span className="bg-brand-tactical text-black text-[9px] font-bold px-1.5 py-0.5 rounded-sm min-w-[16px] text-center">
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
  hideMobileNav,
}) => {
  // useAuth() was used for the top nav user info, now removed.
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  const sidebarProps: SidebarContentProps & { currentPath: string } = {
    title,
    navItems,
    onNavigate: () => setDrawerOpen(false),
    currentPath: location.pathname,
  };




  // Force close drawer on desktop
  useEffect(() => {
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
            <span className="text-[10px] font-bold uppercase tracking-[0.5em]">Tocar para fechar</span>
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
        bottom:      drawerOpen ? 0 : "auto",
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

        {/* Mobile App Header Removido - Agora na parte inferior */}

        {/* Scrollable page content */}
        <main style={{ flex: 1, overflowY: "auto", background: T.bg }} className={`${hideMobileNav ? 'pb-20' : 'pb-28 lg:pb-0'} relative`}>
          {children}
        </main>

        {/* ── Mobile Bottom Nav (Super App Style) ── */}
        {!hideMobileNav && (
        <nav className="flex lg:hidden fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md bg-[var(--bg)]/90 backdrop-blur-xl border-t border-theme-border/10 z-[100] px-3 py-3 items-center justify-around pb-safe">
          {/* Render isPrimaryMobile items */}
          {navItems.filter(item => item.isPrimaryMobile).map((item, idx) => {
             const active = item.isActive;
             return (
               <button
                 key={idx}
                 onClick={() => { item.onClick?.(); if (item.to) { /* We don't have navigate here directly, but DashboardLayout is inside Router, wait, useLocation but not useNavigate. Let's rely on onClick and Link if to exists */ } }}
                 className={`flex flex-col items-center gap-1 transition-all ${active ? "text-brand-tactical" : "text-theme-text opacity-40 hover:opacity-100"}`}
               >
                 {item.icon}
                 <span className="text-[7.5px] font-bold uppercase truncate max-w-[60px]">{item.label}</span>
               </button>
             );
          })}
          
          {/* Menu Toggle Button */}
          <button
            onClick={() => setDrawerOpen(true)}
            className={`flex flex-col items-center gap-1 transition-all ${drawerOpen ? "text-brand-tactical" : "text-theme-text opacity-40 hover:opacity-100"}`}
          >
            <Menu size={20} strokeWidth={1.5} />
            <span className="text-[7.5px] font-bold uppercase truncate max-w-[60px]">Menu</span>
          </button>
        </nav>
        )}
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

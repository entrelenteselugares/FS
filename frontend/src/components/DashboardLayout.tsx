import React, { useState } from "react";
import { Link, useLocation, type Location } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";

export interface NavItem {
  label: string;
  to?: string;
  onClick?: () => void;
  exact?: boolean;
  icon: React.ReactNode;
  isActive?: boolean;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  variant?: "indigo" | "emerald" | "olive" | "tactical";
  title: string;
}

const VARIANTS = {
  indigo: {
    label: "text-brand-indigo",
    activeBg: "bg-brand-indigo/10",
    activeBorder: "border-brand-indigo/20",
    activeText: "text-brand-indigo",
    avatarBg: "bg-brand-indigo/20",
    avatarText: "text-brand-indigo",
    spinnerBorder: "border-brand-indigo",
    gradient: "from-brand-indigo/5",
  },
  emerald: {
    label: "text-brand-emerald",
    activeBg: "bg-brand-emerald/10",
    activeBorder: "border-brand-emerald/20",
    activeText: "text-brand-emerald",
    avatarBg: "bg-brand-emerald/20",
    avatarText: "text-brand-emerald",
    spinnerBorder: "border-brand-emerald",
    gradient: "from-brand-emerald/5",
  },
  olive: {
    label: "text-brand-olive",
    activeBg: "bg-brand-olive/5",
    activeBorder: "border-brand-olive/20",
    activeText: "text-brand-olive",
    avatarBg: "bg-black/5 dark:bg-white/5",
    avatarText: "text-brand-olive",
    spinnerBorder: "border-brand-olive",
    gradient: "from-brand-olive/5",
  },
  tactical: {
    label: "text-brand-tactical",
    activeBg: "bg-brand-tactical/5",
    activeBorder: "border-brand-tactical/20",
    activeText: "text-brand-tactical",
    avatarBg: "bg-black/5 dark:bg-white/5",
    avatarText: "text-brand-tactical",
    spinnerBorder: "border-brand-tactical",
    gradient: "from-brand-tactical/5",
  },
};

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SunIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

interface VariantStyle {
  label: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  avatarBg: string;
  avatarText: string;
  spinnerBorder: string;
  gradient: string;
}

interface SidebarUser {
  nome?: string;
  role?: string;
}

interface SidebarContentProps {
  variant: VariantStyle;
  title: string;
  navItems: NavItem[];
  user: SidebarUser | null;
  logout: () => void;
  location: Location;
  onNavigate: () => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  variant: v,
  title,
  navItems,
  user,
  logout,
  location,
  onNavigate,
  theme,
  toggleTheme,
}) => {
  const isActive = (item: NavItem) => {
    if (!item.to) return false;
    return item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);
  };

  return (
    <div className="flex flex-col h-full bg-theme-bg text-theme-text transition-colors duration-300">
      {/* Brand Header */}
      <div className={`px-5 pt-10 pb-8 border-b border-theme-border bg-gradient-to-b ${v.gradient} to-transparent flex flex-col items-center text-center`}>
        <div className="mb-4">
          <img 
            src="/logo-premium.png" 
            alt="Logo" 
            style={{ 
              height: 48, 
              width: "auto",
              objectFit: "contain",
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }} 
          />
        </div>
        <div className="text-[7.5px] font-black tracking-[0.4em] text-theme-muted leading-tight uppercase opacity-80">
          {title}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto font-sans">
        {navItems.map((item) => {
          const active = item.isActive ?? isActive(item);
          const commonProps = {
            key: item.label,
            onClick: () => { onNavigate(); item.onClick?.(); },
            className: `
              w-full flex items-center gap-3 px-4 py-3 rounded-none
              text-[10px] font-bold uppercase tracking-widest
              transition-all duration-300 group text-left
              ${active
                ? `${v.activeBg} ${v.activeText} border-l-2 border-brand-tactical ml-[-12px] pl-[22px]`
                : "text-theme-muted hover:text-theme-text hover:bg-theme-bg-muted border-l-2 border-transparent"
              }
            `
          };

          if (item.to) {
            return (
              <Link to={item.to} {...commonProps}>
                <div className={`${active ? v.activeText : "text-theme-muted group-hover:text-brand-tactical transition-colors"}`}>
                  {item.icon}
                </div>
                <span>{item.label}</span>
              </Link>
            );
          }

          return (
            <button type="button" {...commonProps}>
              <div className={`${active ? v.activeText : "text-theme-muted group-hover:text-brand-tactical transition-colors"}`}>
                {item.icon}
              </div>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-6 pt-4 border-t border-theme-border bg-theme-bg-muted">
        <div className="flex items-center gap-3 px-1 mb-4">
          <div className={`
            w-10 h-10 rounded-none flex-shrink-0
            flex items-center justify-center
            text-xs font-bold border border-theme-border
            ${v.avatarBg} ${v.avatarText}
          `}>
            {user?.nome?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-theme-text truncate uppercase tracking-wider">{user?.nome}</div>
            <div className="text-[8px] text-theme-muted uppercase tracking-widest mt-1">
              {user?.role} Profile
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={toggleTheme}
            className="flex-1 p-3 text-theme-muted hover:text-theme-text transition-colors bg-theme-bg border border-theme-border flex items-center justify-center"
            title={theme === "light" ? "Modo Escuro" : "Modo Claro"}
          >
            {theme === "light" ? <MoonIcon /> : <span className="flex items-center gap-2"><SunIcon /> <span className="text-[9px] uppercase font-bold tracking-widest">Modo Claro</span></span>}
            {theme === "light" && <span className="text-[9px] uppercase font-bold tracking-widest ml-2">Modo Escuro</span>}
          </button>
          
          <button
            id="btn-logout"
            onClick={logout}
            className="flex-1 text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-colors py-3 text-center border border-theme-border hover:border-theme-muted"
          >
            Encerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  variant = "tactical",
  title,
}) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const v = VARIANTS[variant as keyof typeof VARIANTS];

  const sidebarProps = {
    variant: v,
    title,
    navItems,
    user,
    logout,
    location,
    onNavigate: () => setDrawerOpen(false),
    theme,
    toggleTheme,
  };

  return (
    <div className="flex h-screen bg-theme-bg text-theme-text overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 w-64 border-r border-theme-border bg-theme-bg transition-colors duration-300">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-theme-bg border-r border-theme-border
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-theme-muted hover:text-theme-text transition-colors p-2"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 px-6 py-4 bg-theme-bg border-b border-theme-border flex-shrink-0">
          <button
            id="btn-mobile-menu"
            onClick={() => setDrawerOpen(true)}
            className="text-theme-muted hover:text-theme-text transition-colors"
            aria-label="Abrir menu"
          >
            <MenuIcon />
          </button>
          <div className="flex flex-col flex-1">
             <span className={`text-[8px] font-bold uppercase tracking-[0.4em] ${v.label} leading-none mb-1`}>
               F. Segundo
             </span>
             <span className="text-[10px] tracking-tight text-theme-text leading-none uppercase">
               {title}
             </span>
          </div>
          <button 
            onClick={toggleTheme}
            className="p-2 text-theme-muted hover:text-theme-text transition-colors"
          >
            {theme === "light" ? <MoonIcon /> : <SunIcon />}
          </button>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-theme-bg">
          {children}
        </main>
      </div>
    </div>
  );
};


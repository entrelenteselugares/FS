import React, { useState } from "react";
import { Link, useLocation, type Location } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export interface NavItem {
  label: string;
  to: string;
  exact?: boolean;
  icon: React.ReactNode;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  variant?: "indigo" | "emerald" | "olive";
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
    avatarBg: "bg-white/5",
    avatarText: "text-brand-olive",
    spinnerBorder: "border-brand-olive",
    gradient: "from-brand-olive/5",
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
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  variant: v,
  title,
  navItems,
  user,
  logout,
  location,
  onNavigate,
}) => {
  const isActive = (item: NavItem) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  return (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className={`px-5 pt-8 pb-5 border-b border-white/5 bg-gradient-to-b ${v.gradient} to-transparent`}>
        <div className={`text-[9px] font-bold uppercase tracking-[0.5em] ${v.label} mb-2.5`}>
          Protocolo
        </div>
        <div className="text-lg font-serif tracking-tight text-white leading-tight">
          {title}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto font-sans">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-none
                text-[10px] font-bold uppercase tracking-widest
                transition-all duration-300 group
                ${active
                  ? `${v.activeBg} ${v.activeText} border-l-2 border-brand-olive ml-[-12px] pl-[22px]`
                  : "text-zinc-600 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent"
                }
              `}
            >
              <span className={`w-3.5 h-3.5 flex-shrink-0 transition-colors ${active ? v.activeText : "text-zinc-700 group-hover:text-zinc-400"}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-6 pt-4 border-t border-white/5 bg-white/[0.01]">
        <div className="flex items-center gap-3 px-1 mb-4">
          <div className={`
            w-10 h-10 rounded-none flex-shrink-0
            flex items-center justify-center
            text-xs font-bold border border-white/10
            ${v.avatarBg} ${v.avatarText}
          `}>
            {user?.nome?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-white truncate uppercase tracking-wider">{user?.nome}</div>
            <div className="text-[8px] text-zinc-600 uppercase tracking-widest mt-1">
              {user?.role} Profile
            </div>
          </div>
        </div>
        <button
          id="btn-logout"
          onClick={logout}
          className="w-full text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-600 hover:text-white transition-colors py-3 text-center border border-white/5 hover:border-white/10"
        >
          Encerrar
        </button>
      </div>
    </div>
  );
};

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  variant = "olive",
  title,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const v = (VARIANTS as any)[variant];

  const sidebarProps = {
    variant: v,
    title,
    navItems,
    user,
    logout,
    location,
    onNavigate: () => setDrawerOpen(false),
  };

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 w-64 border-r border-white/5 bg-[#0a0a0a]">
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-72 bg-[#0a0a0a] border-r border-white/5
          transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) lg:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute top-6 right-6">
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-zinc-600 hover:text-white transition-colors p-2"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-4 px-6 py-4 bg-[#0a0a0a] border-b border-white/5 flex-shrink-0">
          <button
            id="btn-mobile-menu"
            onClick={() => setDrawerOpen(true)}
            className="text-zinc-500 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <MenuIcon />
          </button>
          <div className="flex flex-col">
             <span className={`text-[8px] font-bold uppercase tracking-[0.4em] ${v.label} leading-none mb-1`}>
               F. Segundo
             </span>
             <span className="text-[10px] font-serif tracking-tight text-white leading-none">
               {title}
             </span>
          </div>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-[#050505]">
          {children}
        </main>
      </div>
    </div>
  );
};

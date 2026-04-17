import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
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
  variant?: "indigo" | "emerald";
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
};

const MenuIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  variant = "indigo",
  title,
}) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const v = VARIANTS[variant];

  const isActive = (item: NavItem) =>
    item.exact
      ? location.pathname === item.to
      : location.pathname.startsWith(item.to);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Brand Header */}
      <div className={`px-5 pt-6 pb-5 border-b border-white/5 bg-gradient-to-b ${v.gradient} to-transparent`}>
        <div className={`text-[9px] font-black uppercase tracking-[0.5em] ${v.label} mb-1.5`}>
          Foto Segundo
        </div>
        <div className="text-sm font-black italic uppercase tracking-tight text-white leading-tight">
          {title}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setDrawerOpen(false)}
              className={`
                flex items-center gap-3 px-3 py-2.5 rounded-xl
                text-[11px] font-bold uppercase tracking-widest
                transition-all duration-150 group
                ${active
                  ? `${v.activeBg} ${v.activeText} border ${v.activeBorder}`
                  : "text-zinc-500 hover:text-white hover:bg-white/5 border border-transparent"
                }
              `}
            >
              <span className={`w-4 h-4 flex-shrink-0 transition-colors ${active ? v.activeText : "text-zinc-600 group-hover:text-zinc-300"}`}>
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      <div className="px-4 pb-5 pt-3 border-t border-white/5">
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className={`
            w-9 h-9 rounded-full flex-shrink-0
            flex items-center justify-center
            text-sm font-black
            ${v.avatarBg} ${v.avatarText}
          `}>
            {user?.nome?.charAt(0).toUpperCase() ?? "?"}
          </div>
          <div className="min-w-0">
            <div className="text-[11px] font-bold text-white truncate">{user?.nome}</div>
            <div className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">
              {user?.role}
            </div>
          </div>
        </div>
        <button
          id="btn-logout"
          onClick={logout}
          className="w-full text-[10px] font-black uppercase tracking-widest text-zinc-600 hover:text-red-400 transition-colors py-2 text-center rounded-xl hover:bg-red-400/5"
        >
          Encerrar Sessão
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#050505] overflow-hidden">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-shrink-0 w-60 glass border-r border-white/5">
        <SidebarContent />
      </aside>

      {/* Mobile Drawer Backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 glass border-r border-white/5
          transform transition-transform duration-300 ease-in-out lg:hidden
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setDrawerOpen(false)}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <CloseIcon />
          </button>
        </div>
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Mobile top bar */}
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 glass border-b border-white/5 flex-shrink-0">
          <button
            id="btn-mobile-menu"
            onClick={() => setDrawerOpen(true)}
            className="text-zinc-400 hover:text-white transition-colors"
            aria-label="Abrir menu"
          >
            <MenuIcon />
          </button>
          <span className={`text-[9px] font-black uppercase tracking-[0.5em] ${v.label}`}>
            Foto Segundo
          </span>
          <span className="text-xs font-black italic uppercase tracking-tight text-white">
            {title}
          </span>
        </header>

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

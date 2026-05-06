import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Search, ShoppingBag, Lock, Menu, Home } from "lucide-react";
import { T } from "../lib/theme";

/**
 * BottomNav — App-style navigation bar for mobile viewports.
 * Only renders on screens < md (768px). Hidden on desktop.
 * Features: Smart Hide (hides on scroll down, shows on scroll up).
 */
export function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Scroll visibility logic
  useEffect(() => {
    let scrollTimeout: ReturnType<typeof setTimeout>;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear previous timeout
      clearTimeout(scrollTimeout);
      
      // Always show at the very top or if we've scrolled up significantly
      if (currentScrollY < 10) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY && currentScrollY > 60) {
        // Scrolling down + past a small threshold
        setIsVisible(false);
      } else if (currentScrollY < lastScrollY) {
        // Scrolling up
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);

      // detect scroll stop
      scrollTimeout = setTimeout(() => {
        setIsVisible(true);
      }, 800);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(scrollTimeout);
    };
  }, [lastScrollY]);

  // Resolve the correct dashboard path per role
  // We add unique dummy search params so isActive can distinguish them even if they point to /login
  const tabs = [
    { id: "home",    label: "Home",      icon: Home,       path: "/" },
    { id: "buscar",  label: "Buscar",    icon: Search,     path: "/?buscar=1" },
    { id: "pedidos", label: "Carrinho",  icon: ShoppingBag, path: user ? "/minha-conta?s=pedidos" : "/login?s=pedidos" },
    { id: "cofres",  label: "Fotos",     icon: Lock,        path: user ? "/cofres" : "/login?next=cofres" },
    { id: "menu",    label: "Opções",    icon: Menu,        path: user ? (user.role === 'CLIENTE' ? "/minha-conta?s=menu" : "/dashboard") : "/auth" },
  ];

  const isActive = (tabPath: string) => {
    const { pathname, search } = location;
    
    // 1. Strict check for query-based paths (Buscar, login?s=...)
    if (tabPath.includes("?")) {
      const [base, query] = tabPath.split("?");
      return pathname === base && search.includes(query);
    }
    
    // 2. Strict check for "Home" (must be exactly / and NO query)
    if (tabPath === "/") {
      return pathname === "/" && search === "";
    }
    
    // 3. Fallback for simple paths
    return pathname === tabPath || pathname.startsWith(tabPath + "/");
  };

  // Routes where BottomNav should never appear (Camera, Checkout, etc.)
  const hiddenRoutes = ["/captura", "/phygital-capture", "/checkout"];
  if (hiddenRoutes.some(r => location.pathname.startsWith(r))) {
    return null;
  }

  return (
    <>
      <nav
        className="fixed bottom-0 w-full z-50 bg-[#141414] border-t border-[#2a2a2a] md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom, 8px)",
          transform: isVisible ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.4s cubic-bezier(0.23, 1, 0.32, 1)",
        }}
      >
        <div className="flex items-stretch relative">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = isActive(tab.path);

            return (
              <button
                key={tab.id}
                onClick={() => navigate(tab.path)}
                className="flex-1 flex flex-col items-center justify-center gap-1 py-3 transition-all duration-200 active:scale-90"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  position: "relative"
                }}
              >
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.5}
                  style={{ color: active ? T.brand : T.text3, transition: "color 0.2s" }}
                />
                <span
                  style={{
                    fontSize: 9,
                    fontFamily: T.fontB,
                    fontWeight: active ? 700 : 400,
                    letterSpacing: "0.05em",
                    textTransform: "uppercase",
                    color: active ? T.brand : T.text3,
                    transition: "color 0.2s",
                  }}
                >
                  {tab.label}
                </span>
                {active && (
                  <span
                    style={{
                      position: "absolute",
                      top: 0,
                      width: 24,
                      height: 2,
                      background: T.brand,
                      borderRadius: "0 0 2px 2px",
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}

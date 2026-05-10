import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { T, BtnPrimary, BtnSecondary } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import { ShoppingBag } from "lucide-react";
import { CartModal } from "./CartModal";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const [userMenu, setUserMenu] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const dashPath = user?.role === "ADMIN" ? "/admin"
    : user?.role === "PROFISSIONAL" ? "/profissional"
    : (user?.role === "CARTORIO" || user?.role === "UNIDADE") ? "/unidade-fixa"
    : "/minha-conta";

  return (
    <>
      <nav className="flex items-center justify-between sticky top-0 z-[100]" style={{
        padding: "12px 16px", borderBottom: `1px solid ${T.border}`,
        background: T.bgNav, backdropFilter: "blur(20px)",
      }}>
        <div className="flex items-center gap-4">
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img 
              src="/logo.png" 
              alt="Foto Segundo" 
              style={{ 
                height: 28, 
                objectFit: "contain",
                filter: "var(--logo-filter)"
              }} 
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="mobile-hide md:flex items-center gap-2">
            <ThemeToggle />
            <span style={{ fontSize: 16 }}>🇧🇷</span>
          </div>

          <button 
            onClick={() => setCartOpen(true)}
            title="Meu Carrinho"
            className="relative p-2 border rounded-md transition-all hover:bg-brand-tactical/10 group"
            style={{ 
              borderColor: T.border,
              color: T.text,
            }}
          >
            <ShoppingBag size={18} />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-tactical text-black text-[9px] font-black flex items-center justify-center rounded-sm animate-pulse-soft">
                {totalItems}
              </span>
            )}
          </button>

          {user ? (
            <div className="relative">
              <button onClick={() => setUserMenu(v => !v)} style={{ ...BtnSecondary, fontSize: 9, padding: "7px 10px" }}>
                {user.nome?.split(" ")[0] || "CONTA"} <span style={{ fontSize: 8, marginLeft: 2 }}>▾</span>
              </button>
              {userMenu && (
                <div style={{ 
                  position: "absolute", right: 0, top: "calc(100% + 8px)", 
                  background: T.bgCard, border: `1px solid ${T.border}`, 
                  minWidth: 180, zIndex: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' 
                }}>
                  <button onClick={() => { setUserMenu(false); navigate("/meus-albuns"); }} style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11, fontFamily: T.fontD, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontStyle: 'italic' }}>🖼️ Meus Álbuns</button>
                  <button onClick={() => { setUserMenu(false); navigate(dashPath); }} style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11, fontFamily: T.fontD, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontStyle: 'italic' }}>👤 Meu Painel</button>
                  <button onClick={() => { logout(); setUserMenu(false); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", color: T.text2, fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Sair</button>
                </div>
              )}
            </div>
          ) : (
            <button onClick={() => navigate("/login")} style={{ ...BtnSecondary, fontSize: 9, padding: "7px 10px" }}>
              LOGIN
            </button>
          )}
          
          <button onClick={() => navigate("/cotacao")} style={{ ...BtnPrimary, fontSize: 9, padding: "8px 12px", whiteSpace: 'nowrap' }}>
            Agendar
          </button>
        </div>
      </nav>

      <CartModal isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
};

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { T, BtnPrimary, BtnSecondary } from "../lib/theme";
import { ThemeToggle } from "./ThemeToggle";
import { ShoppingBag } from "lucide-react";

export const Navbar: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [userMenu, setUserMenu] = useState(false);

  const dashPath = user?.role === "ADMIN" ? "/admin"
    : user?.role === "PROFISSIONAL" ? "/profissional"
    : (user?.role === "CARTORIO" || user?.role === "UNIDADE") ? "/unidade-fixa"
    : "/minha-conta";

  return (
    <nav className="flex items-center justify-between sticky top-0 z-[100]" style={{
      padding: "8px 16px", borderBottom: `1px solid ${T.border}`,
      background: T.bgNav, backdropFilter: "blur(20px)",
    }}>
      <div className="flex items-center gap-8">
        <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
          <img 
            src="/logo-fs.png" 
            alt="Foto Segundo" 
            style={{ 
              height: 26, 
              objectFit: "contain",
              filter: "var(--logo-filter)"
            }} 
          />
        </div>


      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "clamp(4px, 2vw, 12px)" }}>
        <div className="mobile-hide">
          <ThemeToggle />
        </div>
        
        {user && (
          <button 
            onClick={() => navigate("/minha-conta")}
            title="Meus Pedidos / Carrinho"
            style={{ 
              background: "none", border: `1px solid ${T.border}`, 
              padding: "8px", borderRadius: 6, color: T.text, 
              cursor: "pointer", display: "flex", alignItems: "center",
              transition: "all 0.2s"
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = T.brand)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
          >
            <ShoppingBag size={18} />
          </button>
        )}

        {user ? (
          <div style={{ position: "relative" }} className="mobile-hide">
            <button onClick={() => setUserMenu(v => !v)} style={{ ...BtnSecondary, fontSize: 10, padding: "8px 10px" }}>
              {user.nome?.split(" ")[0] || "CONTA"} <span style={{ fontSize: 8, marginLeft: 2 }}>▾</span>
            </button>
            {userMenu && (
              <div style={{ 
                position: "absolute", right: 0, top: "calc(100% + 8px)", 
                background: T.bgCard, border: `1px solid ${T.border}`, 
                minWidth: 180, zIndex: 200, boxShadow: '0 20px 50px rgba(0,0,0,0.3)' 
              }}>
                <button onClick={() => { setUserMenu(false); navigate("/cofres"); }} style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11, fontFamily: T.fontD, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontStyle: 'italic' }}>🔒 Cofres de Memórias</button>
                <button onClick={() => { setUserMenu(false); navigate(dashPath); }} style={{ width: "100%", textAlign: "left", padding: "14px 16px", background: "transparent", border: "none", borderBottom: `1px solid ${T.border}`, color: T.text, fontSize: 11, fontFamily: T.fontD, fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer", fontStyle: 'italic' }}>👤 Meu Painel</button>
                <div className="mobile-only" style={{ borderBottom: `1px solid ${T.border}`, padding: "8px 16px" }}>
                  <ThemeToggle />
                </div>
                <button onClick={() => { logout(); setUserMenu(false); }} style={{ width: "100%", textAlign: "left", padding: "12px 16px", background: "transparent", border: "none", color: T.text2, fontSize: 11, fontFamily: T.fontB, letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer" }}>Sair</button>
              </div>
            )}
          </div>
        ) : (
          <button onClick={() => navigate("/login")} className="mobile-hide" style={{ ...BtnSecondary, fontSize: 10, padding: "8px 10px" }}>
            LOGIN
          </button>
        )}
        
        <button onClick={() => navigate("/cotacao")} style={{ ...BtnPrimary, fontSize: 10, padding: "9px 12px", whiteSpace: 'nowrap' }}>
          Agendar
        </button>
      </div>
    </nav>
  );
};

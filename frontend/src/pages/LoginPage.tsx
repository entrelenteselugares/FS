import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";

// ── Design System "Tactical Professional" 🛡️🎨 ──────────────────
const T = {
  bg:       "#0c0c0c",
  bgCard:   "#111",
  bgField:  "#0c0c0c",
  border:   "#1c1c1c",
  border2:  "#2a2a2a",
  text:     "#f0ede8",
  text2:    "#888",
  text3:    "#555",
  accent:   "#8a9a5b",
  fontDisplay: "'Barlow Condensed', sans-serif",
  fontBody:    "'Inter', sans-serif",
} as const;

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const preferredRole = params.get("role");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const authUser = await login(email, senha);
      
      const pendingEventId = localStorage.getItem("pending_purchase_event_id");
      if (pendingEventId) {
        localStorage.removeItem("pending_purchase_event_id");
        navigate(`/eventos/${pendingEventId}`);
        return;
      }

      const destinos: Record<string, string> = {
        ADMIN: "/admin",
        PROFISSIONAL: "/profissional",
        UNIDADE: "/cartorio",
        CLIENTE: "/minha-conta",
      };

      navigate(destinos[authUser.role] || "/");
    } catch (err: any) {
      const errorMsg = err.response?.data?.error;
      setError(typeof errorMsg === 'string' ? errorMsg : "Acesso negado. Verifique suas credenciais.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily: T.fontBody, background: T.bg, color: T.text, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "0 24px", position: "relative", overflow: "hidden" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: ${T.accent} !important; outline: none; }
        input::placeholder { color: #333; }
      `}</style>

      {/* Decorative */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)" }} />
      <div style={{ position: "absolute", bottom: "20%", left: "10%", width: "1px", height: 120, background: `${T.accent}20` }} />

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ width: "100%", maxWidth: 480, position: "relative", zIndex: 10 }}
      >
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 6, color: T.text3, marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <span style={{ width: 30, height: 1, background: "#1a1a1a" }} />
            Secure Access
            <span style={{ width: 30, height: 1, background: "#1a1a1a" }} />
          </div>
          <h1 style={{ fontFamily: T.fontDisplay, fontSize: "clamp(50px, 8vw, 80px)", fontWeight: 900, lineHeight: 0.9, textTransform: "uppercase", letterSpacing: "-0.5px", color: "#fff", marginBottom: 8 }}>
            ACESSO <span style={{ color: T.text3 }}>PRIVADO</span>
          </h1>
          <p style={{ fontSize: 10, letterSpacing: 4, textTransform: "uppercase", color: T.accent, fontWeight: 800 }}>
            {preferredRole === "CARTORIO" || preferredRole === "UNIDADE" ? "PORTAL DA UNIDADE" : preferredRole ? `IDENTIDADE: ${preferredRole}` : "COLETIVO FOTO SEGUNDO"}
          </p>
        </div>

        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "40px 40px" }}>
          {error && (
            <div style={{ border: `1px solid rgba(248,113,113,0.1)`, background: "rgba(248,113,113,0.05)", padding: 20, marginBottom: 40, textAlign: "center" }}>
              <p style={{ color: "#f87171", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, margin: 0 }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3, color: T.text3, marginLeft: 2 }}>E-mail de Registro</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Mail style={{ position: "absolute", left: 0, color: "#222" }} size={14} strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border2}`, padding: "12px 0 12px 28px", fontSize: 13, color: "#fff", fontFamily: T.fontBody }}
                  placeholder="IDENTIFIER@DOMAIN.COM"
                  required
                />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 3, color: T.text3, marginLeft: 2 }}>Código de Segurança</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <Lock style={{ position: "absolute", left: 0, color: "#222" }} size={14} strokeWidth={1.5} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${T.border2}`, padding: "12px 0 12px 28px", fontSize: 13, color: "#fff", fontFamily: T.fontBody }}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%", background: T.accent, color: "#0c0c0c", border: "none",
                padding: "20px", fontWeight: 900, fontSize: 14, textTransform: "uppercase",
                letterSpacing: 4, cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
                transition: "all 0.3s", opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "AUTHENTICATING..." : (
                <>
                  Entrar no Sistema <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: 40, paddingTop: 30, borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
            <p style={{ color: T.text3, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, marginBottom: 15 }}>Novo no Coletivo?</p>
            <Link 
              to="/register?role=CLIENTE"
              style={{ color: "#fff", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 3, textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, fontStyle: "italic" }}
            >
              Solicitar Registro <span style={{ width: 30, height: 1, background: "#1a1a1a" }} />
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 30, textAlign: "center" }}>
          <Link to="/" style={{ color: T.text3, fontSize: 9, fontWeight: 800, textTransform: "uppercase", letterSpacing: 4, textDecoration: "none" }}>
            Return to Public Showcase
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

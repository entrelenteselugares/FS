import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { T, BtnPrimary, FieldLabel, FieldInput } from "../lib/theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { API } from "../lib/api";

const EyeIcon = ({ open }: { open: boolean }) => open ? (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
) : (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
    <line x1="1" y1="1" x2="23" y2="23"/>
  </svg>
);

const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN:        "/admin",
  PROFISSIONAL: "/profissional",
  CARTORIO:     "/unidade-fixa",
  UNIDADE:      "/unidade-fixa",
  CLIENTE:      "/minha-conta",
};

export const LoginPage: React.FC = () => {
  const [email,      setEmail]      = useState("");
  const [senha,      setSenha]      = useState("");
  const [showSenha,  setShowSenha]  = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);

  const { login }  = useAuth();
  const navigate   = useNavigate();
  const [resetSent, setResetSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const authUser = await login(email.trim().toLowerCase(), senha);

      // Redireciona para evento pendente se existir
      const pending = localStorage.getItem("pending_purchase_event_id");
      if (pending) {
        localStorage.removeItem("pending_purchase_event_id");
        navigate(`/e/${pending}`);
        return;
      }

      navigate(ROLE_DESTINATIONS[authUser.role] ?? "/");
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Credenciais inválidas.")
        : "Erro ao autenticar. Tente novamente.";
      setError(typeof msg === "string" ? msg : "Acesso negado.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError("Por favor, digite seu e-mail primeiro para solicitar a recuperação.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await API.post("/auth/forgot-password", { email: email.trim().toLowerCase() });
      setResetSent(true);
      setError("");
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Erro ao solicitar recuperação.")
        : "Erro ao solicitar recuperação.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "16px 20px", fontFamily: T.fontB }}>
      <Helmet>
        <title>Acesso — Foto Segundo</title>
        <meta name="description" content="Acesse sua conta e visualize as fotos e vídeos do seu evento." />
      </Helmet>

      <style>{`
        .lp-input:focus { border-color: ${T.brand} !important; }
        .lp-input::placeholder { color: ${T.text3}; }
        .lp-eye { background: none; border: none; cursor: pointer; color: ${T.text3}; padding: 4px; display: flex; align-items: center; transition: color 0.15s; }
        .lp-eye:hover { color: ${T.text2}; }
        .lp-back { font-size: 9px; font-family: ${T.fontB}; color: ${T.text3}; text-decoration: none; letter-spacing: 0.15em; text-transform: uppercase; transition: color 0.15s; opacity: 0.5; }
        .lp-back:hover { color: ${T.text}; opacity: 1; }
        .lp-reg { color: ${T.brand}; text-decoration: none; font-size: 11px; font-family: ${T.fontB}; letter-spacing: 0.1em; text-transform: uppercase; transition: opacity 0.15s; }
        .lp-reg:hover { opacity: 0.75; }
        .lp-forgot { background: none; border: none; color: ${T.text3}; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; padding: 6px 0; margin-top: 2px; transition: color 0.15s; align-self: flex-end; display: inline-block; opacity: 0.6; }
        .lp-forgot:hover { color: ${T.text}; opacity: 1; }
      `}</style>

      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 100 }}>
        <ThemeToggle />
      </div>

      <div style={{ width: "100%", maxWidth: 380 }}>

        {/* ── Brand ── */}
        <div style={{ textAlign: "center", marginBottom: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 32, objectFit: "contain", marginBottom: 8 }} />
          <p style={{ fontSize: 11, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>
            Painel de Controle
          </p>
        </div>

        {/* ── Card ── */}
        <div style={{
          background:   "var(--bg-card)",
          border:       `1px solid ${T.border}`,
          borderRadius: 0,
          padding:      32,
        }}>

          {/* Success Reset */}
          {resetSent && (
            <div style={{ background: "rgba(133, 185, 172, 0.1)", border: `1px solid ${T.brand}33`, padding: "12px 16px", marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 11, color: T.brand, fontWeight: 700, fontFamily: T.fontB, letterSpacing: "0.05em" }}>
                E-mail de recuperação enviado! Verifique sua caixa de entrada (e spam).
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", padding: "12px 16px", marginBottom: 24 }}>
              <p style={{ margin: 0, fontSize: 11, color: "#f87171", fontFamily: T.fontB, letterSpacing: "0.05em" }}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* E-mail */}
            <div>
              <label style={FieldLabel} htmlFor="lp-email">E-mail</label>
              <input
                id="lp-email"
                className="lp-input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="username"
                required
                style={{ ...FieldInput, borderRadius: 0 }}
              />
            </div>

            {/* Senha */}
            <div style={{ display: "flex", flexDirection: "column" }}>
              <label style={FieldLabel} htmlFor="lp-senha">Senha</label>
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  id="lp-senha"
                  className="lp-input"
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                  style={{ ...FieldInput, borderRadius: 0, paddingRight: 40 }}
                />
                <button
                  type="button"
                  className="lp-eye"
                  onClick={() => setShowSenha(v => !v)}
                  title={showSenha ? "Ocultar senha" : "Mostrar senha"}
                  style={{ position: "absolute", right: 12 }}
                >
                  <EyeIcon open={showSenha} />
                </button>
              </div>
              <button type="button" onClick={handleForgotPassword} className="lp-forgot">
                Esqueci minha senha
              </button>
            </div>

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              style={{
                ...BtnPrimary,
                width:          "100%",
                justifyContent: "center",
                padding:        "14px 24px",
                fontSize:       13,
                opacity:        loading ? 0.6 : 1,
                cursor:         loading ? "not-allowed" : "pointer",
                marginTop:      4,
              }}
            >
              {loading ? "Autenticando..." : "Entrar"}
            </button>
          </form>

          {/* Registro */}
          <div style={{ marginTop: 28, paddingTop: 24, borderTop: `1px solid ${T.border}`, textAlign: "center" }}>
            <p style={{ margin: "0 0 10px", fontSize: 10, fontFamily: T.fontB, color: T.text3, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Ainda não tem conta?
            </p>
            <Link to="/register" className="lp-reg">
              Solicitar Registro →
            </Link>
          </div>
        </div>

        {/* Voltar */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to="/" className="lp-back">
            ← Voltar para a vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

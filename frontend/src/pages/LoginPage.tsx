import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg relative overflow-hidden px-6 py-12">
      {/* Ambient Glow */}
      <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-500/5 blur-[150px] rounded-full -mr-64 -mb-64 opacity-20" />
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
        <div className="text-center mb-10 flex flex-col items-center">
          <img src="/logo-fs.png" alt="Foto Segundo" className="h-8 object-contain mb-6" />
          <h1 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">
            Portal de Acesso Exclusivo
          </h1>
        </div>

        {/* ── Card ── */}
        <div className="bg-theme-card border border-theme-border p-8 md:p-12 relative shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />

          {/* Success Reset */}
          {resetSent && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 mb-8">
              <p className="text-[11px] text-emerald-500 font-black uppercase tracking-widest leading-relaxed">
                E-mail de recuperação enviado com sucesso.
              </p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-4 mb-8">
              <p className="text-[11px] text-red-500 font-black uppercase tracking-widest leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>

            {/* E-mail */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted block">Identificação</label>
              <input
                id="lp-email"
                className="fs-input w-full"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="USUÁRIO OU E-MAIL"
                autoComplete="username"
                required
              />
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase tracking-widest text-theme-muted block">Chave de Acesso</label>
                <button type="button" onClick={handleForgotPassword} className="text-[9px] font-black uppercase tracking-widest text-emerald-500/60 hover:text-emerald-500 transition-colors">
                  ESQUECI A SENHA
                </button>
              </div>
              <div className="relative flex items-center group">
                <input
                  id="lp-senha"
                  className="fs-input w-full pr-12"
                  type={showSenha ? "text" : "password"}
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-4 text-theme-subtle hover:text-emerald-500 transition-colors"
                  onClick={() => setShowSenha(v => !v)}
                >
                  <EyeIcon open={showSenha} />
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              id="btn-login-submit"
              type="submit"
              disabled={loading}
              className="w-full py-5 bg-emerald-500 text-theme-text font-display font-black text-xs uppercase tracking-[0.4em] hover:bg-white transition-all shadow-xl shadow-emerald-500/10 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "VALIDANDO..." : "ENTRAR NO SISTEMA"}
            </button>
          </form>

          {/* Registro */}
          <div className="mt-12 pt-8 border-t border-theme-border text-center">
            <p className="text-[9px] font-black text-theme-subtle uppercase tracking-widest mb-4">
              Solicitação de novas credenciais
            </p>
            <Link to="/register" className="text-[11px] font-display font-black text-emerald-500 uppercase tracking-widest hover:text-white transition-colors">
              INICIAR REGISTRO PROFISSIONAL →
            </Link>
          </div>
        </div>

        {/* Voltar */}
        <div className="text-center mt-12">
          <Link to="/" className="text-[10px] font-black text-theme-subtle uppercase tracking-[0.3em] hover:text-emerald-500 transition-colors">
            ← VOLTAR PARA VITRINE PÚBLICA
          </Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContextCore";
import { PhotoMosaic } from "../components/PhotoMosaic";

const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN:        "/admin",
  PROFISSIONAL: "/minha-conta?s=agenda",
  CARTORIO:     "/minha-conta?s=agenda",
  UNIDADE:      "/minha-conta?s=agenda",
  FRANCHISEE:   "/franquia",
  CLIENTE:      "/minha-conta",
};

export const LoginPage: React.FC = () => {
  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [showSenha, setShowSenha] = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);

  const { login }       = useAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { toggle, isDark } = useTheme();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const authUser = await login(email.trim().toLowerCase(), senha);

      import("../lib/analytics").then(({ trackEvent, GA_EVENTS }) => {
        trackEvent(GA_EVENTS.LOGIN, { role: authUser.role, user_id: authUser.id });
      });

      const returnUrl = searchParams.get("returnUrl");
      if (returnUrl) {
        navigate(returnUrl);
        return;
      }

      const pending = localStorage.getItem("pending_purchase_event_id");
      if (pending) {
        localStorage.removeItem("pending_purchase_event_id");
        navigate(`/e/${pending}`);
        return;
      }

      navigate(ROLE_DESTINATIONS[authUser.role] ?? "/");
    } catch (err: unknown) {
      console.error("[LOGIN ERROR]", err);
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Credenciais inválidas.")
        : "Erro ao autenticar. Tente novamente.";
      setError(typeof msg === "string" ? msg : "Acesso negado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col lg:flex-row overflow-hidden bg-theme-bg">
      <Helmet>
        <title>Acesso — Foto Segundo</title>
      </Helmet>

      {/* ── LEFT: Animated Photo Mosaic ── */}
      <div className="flex flex-none h-[30vh] lg:h-auto lg:flex-1 relative overflow-hidden">
        {/* Gradient overlays */}
        <div className="absolute inset-0 z-10 pointer-events-none">
          {/* Top fade */}
          <div className={`absolute top-0 left-0 right-0 h-32 bg-gradient-to-b ${isDark ? "from-black" : "from-stone-100"} to-transparent`} />
          {/* Bottom fade */}
          <div className={`absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t ${isDark ? "from-black" : "from-stone-100"} to-transparent`} />
          {/* Right edge vignette → blends into form panel */}
          <div className={`absolute top-0 right-0 bottom-0 w-32 bg-gradient-to-l ${isDark ? "from-zinc-950" : "from-stone-100"} to-transparent`} />
          {/* Cyan tint overlay for brand color */}
          <div className="absolute inset-0 bg-brand-tactical/10 mix-blend-overlay" />
        </div>

        {/* Brand watermark / centered logo on photo side */}
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <div className="bg-theme-bg/60 backdrop-blur-md px-4 md:px-8 py-3 md:py-6 rounded-3xl shadow-2xl border border-theme-border/30 pointer-events-auto transition-transform hover:scale-105">
            <Link to="/">
              <img
                src="/logo.png"
                alt="Foto Segundo"
                style={{ height: 46, objectFit: "contain", filter: "var(--logo-filter)" }}
              />
            </Link>
          </div>
        </div>

        {/* Tagline bottom-left */}
        <div className="absolute bottom-8 left-8 z-20 hidden lg:block">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic">
            Cada segundo conta.
          </p>
        </div>

        {/* 3 scrolling columns */}
        <PhotoMosaic />
      </div>

      {/* ── RIGHT: Login Panel ── */}
      <div
        className="w-full lg:w-[400px] xl:w-[460px] flex-1 lg:flex-none flex flex-col justify-between relative bg-theme-bg lg:border-l border-t lg:border-t-0 border-theme-border shadow-2xl lg:h-screen overflow-y-auto"
      >
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="absolute top-6 right-6 p-2.5 rounded-full transition-all z-10 bg-theme-bg-muted hover:bg-theme-border text-theme-muted hover:text-theme-text"
          title={isDark ? "Modo claro" : "Modo escuro"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Center: Form & Header */}
        <div className="flex-1 flex flex-col justify-center px-3 md:px-6 md:px-10 xl:px-14 py-3 md:py-6 md:py-12 space-y-10">
          {/* Header Group */}
          <div className="space-y-2">
            <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.5em] mb-4 italic">
              Portal de Acesso
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-theme-text">
              Acessar Conta
            </h1>
            <p className="text-[10px] md:text-xs font-medium uppercase tracking-widest text-theme-muted">
              Bem-vindo de volta ao sistema
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-400 text-[9px] font-black uppercase tracking-[0.2em] p-4 text-center border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">
                Identificação
              </label>
              <div className="relative flex items-center rounded-xl border border-theme-border bg-theme-bg-muted focus-within:border-brand-tactical transition-all">
                <Mail className="absolute left-4 text-theme-muted" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent py-4 pl-11 pr-4 text-xs outline-none text-theme-text placeholder:text-theme-muted placeholder:opacity-50"
                  placeholder="seu@email.com"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">
                  Chave de Acesso
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[8px] font-black uppercase tracking-widest text-brand-tactical hover:brightness-110 transition-colors italic"
                >
                  Esqueci a senha →
                </Link>
              </div>
              <div className="relative flex items-center rounded-xl border border-theme-border bg-theme-bg-muted focus-within:border-brand-tactical transition-all">
                <Lock className="absolute left-4 text-theme-muted" size={14} />
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full bg-transparent py-4 pl-11 pr-12 text-xs outline-none text-theme-text placeholder:text-theme-muted placeholder:opacity-50"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-4 text-theme-muted hover:text-theme-text transition-colors"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="fs-btn w-full bg-brand-tactical text-zinc-950 py-5 group italic shadow-lg shadow-brand-tactical/20 mt-2"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-zinc-900/30 border-t-zinc-900 rounded-full animate-spin" />
                  Validando acesso...
                </span>
              ) : (
                <>
                  Entrar no sistema
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Bottom: Footer */}
        <div className="px-5 md:px-10 xl:px-14 pb-8 pt-6 border-t border-theme-border flex flex-col gap-4 text-center">
          <p className="text-[8px] font-black uppercase tracking-[0.3em] text-theme-muted">
            Novo por aqui?{" "}
            <Link
              to="/registro"
              className="ml-2 transition-all underline underline-offset-4 text-theme-muted hover:text-brand-tactical decoration-theme-border hover:decoration-brand-tactical/50"
            >
              Solicitar Cadastro
            </Link>
          </p>
          <Link
            to="/"
            className="text-[8px] font-black uppercase tracking-[0.4em] transition-all italic text-theme-muted opacity-50 hover:opacity-100"
          >
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sun, Moon } from "lucide-react";
import { useTheme } from "../contexts/ThemeContextCore";
import { PhotoMosaic } from "../components/PhotoMosaic";
import { Button } from "../components/UI/Button";
import { Input } from "../components/UI/Input";
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

  const { user, login, loginWithGoogle } = useAuth();
  const navigate        = useNavigate();
  const [searchParams]  = useSearchParams();
  const { toggle, isDark } = useTheme();

  useEffect(() => {
    if (user) {
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
      navigate(ROLE_DESTINATIONS[user.role] ?? "/");
    }
  }, [user, navigate, searchParams]);


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
          <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-white/30 ">
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
            <div className="text-overline mb-2">
              Portal de Acesso
            </div>
            <h1 className="mb-1">
              Acessar Conta
            </h1>
            <p className="text-caption uppercase tracking-widest text-theme-muted">
              Bem-vindo de volta ao sistema
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 text-red-400 text-[9px] font-bold uppercase tracking-[0.2em] p-4 text-center border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          {/* Form */}
          <div className="space-y-5">
            <div className="space-y-3">
              <Button 
                type="button" 
                onClick={loginWithGoogle}
                variant="secondary"
                fullWidth
                className="bg-white text-black hover:bg-gray-100 border-gray-300 h-12 flex items-center justify-center relative"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="absolute left-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-bold text-xs uppercase tracking-wider">Entrar com Google</span>
              </Button>
            </div>

            <div className="flex items-center gap-4 my-2">
              <div className="flex-1 h-px bg-theme-border"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-muted">Ou e-mail</span>
              <div className="flex-1 h-px bg-theme-border"></div>
            </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <Input
              type="email"
              label="Identificação"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              leftIcon={<Mail size={16} />}
            />

            {/* Password */}
            <div className="space-y-1">
              <div className="flex justify-end w-full mb-1">
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold uppercase tracking-widest text-brand hover:brightness-110 transition-colors"
                >
                  Esqueci a senha →
                </Link>
              </div>
              <Input
                type={showSenha ? "text" : "password"}
                label="Chave de Acesso"
                required
                value={senha}
                onChange={e => setSenha(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                leftIcon={<Lock size={16} />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="hover:text-theme-text transition-colors"
                  >
                    {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            </div>

            {/* Submit */}
            <Button
              type="submit"
              variant="primary"
              isLoading={loading}
              fullWidth
              className="mt-4"
              rightIcon={<ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
            >
              Entrar no sistema
            </Button>
          </form>
          </div>
        </div>

        {/* Bottom: Footer */}
        <div className="px-5 md:px-10 xl:px-14 pb-8 pt-6 border-t border-theme-border flex flex-col gap-4 text-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted">
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
            className="text-[10px] font-bold uppercase tracking-[0.4em] transition-all text-theme-muted opacity-50 hover:opacity-100"
          >
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { ThemeToggle } from "../components/ThemeToggle";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN:        "/admin",
  PROFISSIONAL: "/profissional",
  CARTORIO:     "/unidade-fixa",
  UNIDADE:      "/unidade-fixa",
  FRANCHISEE:   "/franquia",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    
    try {
      console.log("[LOGIN ATTEMPT]", email.toLowerCase());
      const authUser = await login(email.trim().toLowerCase(), senha);

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
    <div className="min-h-screen flex flex-col items-center justify-center bg-theme-bg relative overflow-hidden px-6 py-12 transition-colors duration-300">
      <Helmet>
        <title>Acesso — Foto Segundo</title>
      </Helmet>

      {/* Decorative Editorial Lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-theme-border opacity-10" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-theme-border opacity-10" />

      <div className="absolute top-6 right-6 z-50 scale-90">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[400px] relative z-10">
        {/* ── Brand ── */}
        <div className="text-center mb-10">
          <div className="flex justify-center mb-6">
            <img src="/logo-fs.png" alt="Foto Segundo" className="h-8 object-contain" />
          </div>
          <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] mb-3 italic">Portal de Acesso</div>
          <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase italic leading-none tracking-tighter">
            EFETUAR <span className="opacity-20">LOGIN</span>
          </h1>
        </div>

        {/* ── Card ── */}
        <div className="bg-theme-bg-muted/30 border border-theme-border shadow-2xl overflow-hidden">
          {error && (
            <div className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] p-4 text-center border-b border-red-500/10">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-8">
            {/* E-mail */}
            <div className="space-y-3">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">Identificação</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-10 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                  placeholder="USUÁRIO@DOMINIO.COM"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">Chave de Acesso</label>
              </div>
              <div className="relative group flex items-center">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                <input
                  type={showSenha ? "text" : "password"}
                  required
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-10 pr-10 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all"
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-0 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-text transition-colors p-2"
                >
                  {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-tactical text-brand-text hover:brightness-110 font-black uppercase tracking-[0.5em] text-[10px] py-5 transition-all flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale shadow-xl shadow-brand-tactical/10 italic"
            >
              {loading ? "VALIDANDO ACESSO..." : (
                <>
                  Entrar no Sistema <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Registro */}
          <div className="px-10 py-6 border-t border-theme-border/40 text-center bg-theme-bg-muted/10">
            <p className="text-theme-muted text-[8px] font-black uppercase tracking-[0.3em]">
              Novo por aqui? <Link to="/register" className="text-theme-text hover:text-brand-tactical ml-3 transition-all underline underline-offset-4 decoration-theme-border">Solicitar Cadastro</Link>
            </p>
          </div>
        </div>

        {/* Voltar */}
        <div className="mt-8 text-center">
          <Link to="/" className="text-theme-muted hover:text-theme-text text-[8px] font-black uppercase tracking-[0.5em] transition-all opacity-40 hover:opacity-100">
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

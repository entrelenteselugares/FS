import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";
import { Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";

const ROLE_DESTINATIONS: Record<string, string> = {
  ADMIN:        "/admin",
  PROFISSIONAL: "/minha-conta",
  CARTORIO:     "/minha-conta",
  UNIDADE:      "/minha-conta",
  FRANCHISEE:   "/minha-conta",
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
      const authUser = await login(email.trim().toLowerCase(), senha);

      // GA4: Track Login
      import("../lib/analytics").then(({ trackEvent, GA_EVENTS }) => {
        trackEvent(GA_EVENTS.LOGIN, { 
          role: authUser.role,
          user_id: authUser.id 
        });
      });

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
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6">
      <Helmet>
        <title>Acesso — Foto Segundo</title>
      </Helmet>

      <div className="w-full max-w-md space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <Link to="/" className="inline-block">
            <img src="/logo.png" alt="Foto Segundo" style={{ height: 38, objectFit: "contain", filter: "var(--logo-filter)" }} />
          </Link>
          <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Portal de Acesso</div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <div className="text-center">
             <h1 className="text-3xl md:text-4xl font-heading font-black text-theme-text uppercase italic leading-none tracking-tighter">
              EFETUAR <span className="opacity-20">LOGIN</span>
            </h1>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] p-4 text-center border border-red-500/20 rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            <div className="space-y-4">
               <div className="space-y-2">
                 <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 ml-1">Identificação</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type="email"
                     required
                     value={email}
                     onChange={e => setEmail(e.target.value)}
                     className="w-full bg-theme-bg-field border border-theme-border/20 py-4 pl-12 pr-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all placeholder:text-theme-text-muted/40"
                     placeholder="seu@email.com"
                     autoComplete="email"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <div className="flex justify-between items-center px-1">
                   <label className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Chave de Acesso</label>
                   <Link to="/forgot-password" 
                     className="text-[8px] font-black uppercase tracking-widest text-brand-tactical hover:opacity-70 transition-all italic">
                     Esqueci a Senha →
                   </Link>
                 </div>
                 <div className="relative group flex items-center">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type={showSenha ? "text" : "password"}
                     required
                     value={senha}
                     onChange={e => setSenha(e.target.value)}
                     className="w-full bg-theme-bg-field border border-theme-border/20 py-4 pl-12 pr-12 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all placeholder:text-theme-text-muted/40"
                     placeholder="••••••••"
                     autoComplete="current-password"
                   />
                   <button
                     type="button"
                     onClick={() => setShowSenha(!showSenha)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
                   >
                     {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-tactical text-black hover:bg-white font-black uppercase tracking-[0.5em] text-[10px] py-5 transition-all flex items-center justify-center gap-4 group disabled:opacity-30 rounded-2xl italic"
            >
              {loading ? "VALIDANDO ACESSO..." : (
                <>
                  Entrar no Sistema <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-8 flex flex-col items-center gap-6 text-center border-t border-theme-border/20">
           <p className="text-zinc-500 text-[8px] font-black uppercase tracking-[0.3em]">
            Novo por aqui? <Link to="/registro" className="text-theme-text hover:text-brand-tactical ml-2 transition-all underline underline-offset-4 decoration-theme-text/10">Solicitar Cadastro</Link>
          </p>
          <Link to="/" className="text-zinc-600 hover:text-white text-[8px] font-black uppercase tracking-[0.5em] transition-all italic">
            ← Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

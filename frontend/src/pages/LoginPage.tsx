import React, { useState } from "react";
import { isAxiosError } from "axios";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail, ArrowLeft, Sun, Moon } from "lucide-react";

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

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
    } catch (err: unknown) {
      let errorMsg = "Acesso negado. Verifique suas credenciais.";
      if (isAxiosError(err)) {
        errorMsg = err.response?.data?.error || errorMsg;
      }
      setError(typeof errorMsg === "string" ? errorMsg : "Acesso negado.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans flex items-center justify-center px-6 relative overflow-hidden transition-colors duration-500">
      <style>{`
        .login-input {
          width: 100%;
          background: transparent;
          border: none;
          border-bottom: 1px solid var(--theme-border);
          padding: 12px 0 12px 28px;
          font-size: 13px;
          color: var(--theme-text);
          font-family: 'Outfit', sans-serif;
          outline: none;
          transition: border-color 0.2s;
        }
        .login-input:focus { border-color: var(--brand-primary); }
        .login-input::placeholder { color: var(--theme-muted); opacity: 0.4; }
      `}</style>

      {/* Floating Controls */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.35em] text-theme-muted hover:text-theme-text transition-all bg-theme-bg-muted/60 backdrop-blur-lg px-6 py-3 border border-theme-border"
        >
          <ArrowLeft size={14} /> Vitrine
        </button>
        
        <button 
          onClick={toggleTheme}
          className="pointer-events-auto w-10 h-10 flex items-center justify-center border border-theme-border bg-theme-bg-muted/60 backdrop-blur-lg text-theme-muted hover:text-theme-text transition-all"
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </nav>

      {/* Decorative */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-brand-primary/20 to-transparent" />
      <div className="absolute bottom-1/4 left-10 w-px h-32 bg-brand-primary/10" />
      <div className="absolute top-1/3 right-10 w-px h-20 bg-brand-primary/10" />

      <motion.div 
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="flex justify-center mb-10">
          <img 
            src="/logo-premium.png" 
            alt="Logo" 
            style={{ 
              height: 60, 
              objectFit: "contain",
              filter: theme === 'dark' ? 'brightness(0) invert(1)' : 'none'
            }} 
          />
        </div>
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-6 text-[9px] font-bold uppercase tracking-[0.6em] text-theme-muted mb-6">
            <span className="w-8 h-px bg-theme-border block" />
            Acesso Seguro
            <span className="w-8 h-px bg-theme-border block" />
          </div>
        </div>


        {/* Card */}
        <div className="bg-theme-bg-muted border border-theme-border p-10 editorial-shadow">
          {error && (
            <div className="border border-red-400/10 bg-red-400/5 p-5 mb-10 text-center">
              <p className="text-red-400 text-[10px] font-bold uppercase tracking-[0.2em]">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-8">
            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">
                E-mail de Registro
              </label>
              <div className="relative flex items-center">
                <Mail className="absolute left-0 text-theme-muted" size={14} strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="login-input"
                  placeholder="USUARIO@DOMINIO.COM"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">
                Código de Segurança
              </label>
              <div className="relative flex items-center">
                <Lock className="absolute left-0 text-theme-muted" size={14} strokeWidth={1.5} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="login-input"
                  placeholder="••••••••"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-6 font-black text-[11px] uppercase tracking-[0.5em] flex items-center justify-center gap-4 hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-primary/20"
              style={{ 
                backgroundColor: 'var(--brand-primary)', 
                color: 'var(--theme-text-on-brand)' 
              }}
            >
              {loading ? "AUTENTICANDO..." : (
                <>Entrar no Sistema <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-theme-border text-center">
            <p className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.2em] mb-5">Novo no Coletivo?</p>
            <Link 
              to="/register?role=CLIENTE"
              className="text-theme-text text-[11px] font-bold uppercase tracking-[0.3em] no-underline flex items-center justify-center gap-4 hover:text-brand-primary transition-colors"
            >
              Solicitar Registro <span className="w-8 h-px bg-theme-border block" />
            </Link>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-theme-muted text-[9px] font-bold uppercase tracking-[0.4em] no-underline hover:text-theme-text transition-colors">
            Voltar para a Vitrine Pública
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

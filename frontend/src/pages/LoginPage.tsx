import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { motion } from "framer-motion";
import { ArrowRight, Lock, Mail } from "lucide-react";

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
      
      // Verificação de Intenção de Compra Pendente
      const pendingEventId = localStorage.getItem("pending_purchase_event_id");
      if (pendingEventId) {
        localStorage.removeItem("pending_purchase_event_id");
        navigate(`/eventos/${pendingEventId}`);
        return;
      }

      // Redirecionamento por Role
      const destinos: Record<string, string> = {
        ADMIN: "/admin",
        PROFISSIONAL: "/profissional",
        CARTORIO: "/cartorio",
        CLIENTE: "/minha-conta",
      };

      navigate(destinos[authUser.role] || "/");

    } catch (err: any) {
      const errorMsg = err.response?.data?.error;
      setError(typeof errorMsg === 'string' ? errorMsg : "Acesso negado. Credenciais expiradas ou incorretas.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 relative overflow-hidden">
      {/* Editorial Decorative Elements */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent" />
      <div className="absolute bottom-1/4 left-1/4 w-[1px] h-32 bg-brand-olive/20" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-lg relative z-10"
      >
        <div className="text-center mb-16">
          <div className="text-sm font-bold uppercase tracking-[0.5em] text-zinc-600 mb-8 flex items-center justify-center gap-4">
            <span className="w-8 h-[1px] bg-zinc-900" />
            Secure Authentication
            <span className="w-8 h-[1px] bg-zinc-900" />
          </div>
          <h1 className="text-5xl md:text-6xl font-serif text-white tracking-tight italic mb-4">
            Acesso <span className="text-zinc-700">Privado</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-olive/80">
            {preferredRole === "CARTORIO" ? "PORTAL DE ESTABELECIMENTO" : preferredRole ? `IDENTIDADE: ${preferredRole}` : "COLETIVO FOTO SEGUNDO"}
          </p>
        </div>

        <div className="border border-white/5 bg-white/[0.01] p-10 md:p-16">
          {error && (
            <div className="border border-red-900/20 bg-red-900/5 text-red-700 text-[9px] font-bold uppercase tracking-[0.3em] p-5 mb-10 text-center">
              {typeof error === 'string' ? error : (error as any).error || JSON.stringify(error)}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-10">
            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">E-mail de Registro</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="IDENTIFIER@DOMAIN.COM"
                  required
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">Código de Segurança</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  autoComplete="current-password"
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.5em] text-[10px] py-5 transition-all flex items-center justify-center gap-4 group"
            >
              {loading ? "AUTHENTICATING..." : (
                <>
                  Entrar no Sistema <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 pt-10 border-t border-white/5 text-center">
            <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-[0.3em] mb-6 font-light">Novo no Coletivo?</p>
            <Link 
              to="/register?role=CLIENTE"
              className="text-white hover:text-brand-olive text-[10px] font-bold uppercase tracking-[0.4em] transition-all flex items-center justify-center gap-4 group italic"
            >
              Solicitar Registro <span className="w-8 h-[1px] bg-zinc-900 group-hover:w-12 group-hover:bg-brand-olive transition-all" />
            </Link>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="text-zinc-800 hover:text-white text-[9px] font-bold uppercase tracking-[0.5em] transition-all">
            Return to Public Showcase
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

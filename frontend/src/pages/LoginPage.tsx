import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const roleRedirect: Record<string, string> = {
  ADMIN: "/admin",
  CARTORIO: "/cartorio",
  PROFISSIONAL: "/profissional",
  CLIENTE: "/",
};

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, senha);
      const stored = JSON.parse(atob(localStorage.getItem("fs_token")!.split(".")[1]));
      navigate(roleRedirect[stored.role] || "/");
    } catch {
      setError("Email ou senha incorretos.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-indigo/5 rounded-full blur-[140px] pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-10">
          <div className="text-xs font-black uppercase tracking-[0.4em] text-brand-indigo mb-3">Foto Segundo</div>
          <h1 className="text-3xl font-black italic tracking-tighter uppercase">Acesso ao Painel</h1>
          <p className="text-zinc-500 text-sm mt-2">Entre com suas credenciais para continuar</p>
        </div>

        <form onSubmit={handleSubmit} className="glass rounded-3xl p-8 space-y-5">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Email</label>
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
              placeholder="seu@email.com"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">Senha</label>
            <input
              id="login-senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-400 text-xs text-center font-medium">{error}</div>
          )}

          <button
            id="login-submit"
            type="submit"
            disabled={loading}
            className="w-full bg-brand-indigo hover:bg-brand-indigo/80 text-white font-black uppercase tracking-widest text-xs py-4 rounded-xl transition-all duration-300 disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Acessar Painel"}
          </button>
        </form>
      </div>
    </div>
  );
};

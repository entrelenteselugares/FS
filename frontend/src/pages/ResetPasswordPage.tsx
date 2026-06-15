import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../lib/api";
import { ShieldCheck, ArrowRight, Lock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setMessage({ type: "error", text: "Token de recuperação ausente. Verifique o link no seu e-mail." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    if (password.length < 6) {
      return setMessage({ type: "error", text: "A senha deve ter pelo menos 6 caracteres." });
    }
    if (password !== confirmPassword) {
      return setMessage({ type: "error", text: "As senhas não coincidem." });
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await API.post("/auth/reset-password", { token, novaSenha: password });
      setMessage({ type: "success", text: "Senha atualizada com sucesso! Redirecionando..." });
      setTimeout(() => navigate("/login"), 3000);
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Erro ao atualizar senha. O link pode ter expirado.")
        : "Erro ao atualizar senha.";
      setMessage({ type: "error", text: msg });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-3 md:p-6 transition-colors duration-700">
      <div className="w-full max-w-lg space-y-10 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        
        {/* Brand */}
        <div className="text-center space-y-4">
          <div className="inline-flex p-4 rounded-full bg-brand-tactical/10 text-brand-tactical mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-theme-text uppercase">
            Segurança de Conta
          </h1>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.4em]">
            Foto Segundo · Recuperação de Acesso
          </p>
        </div>

        {/* Card */}
        <div className="lux-card p-5 md:p-10 space-y-8 border-l-4 border-l-brand-tactical bg-theme-bg-muted/5 backdrop-blur-sm">
          {!token ? (
            <div className="text-center space-y-6">
              <div className="flex justify-center text-brand-danger">
                <AlertTriangle size={48} />
              </div>
              <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest leading-relaxed">
                Este link parece ser inválido ou expirou.<br/>
                Solicite uma nova recuperação na tela de login.
              </p>
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 border border-theme-border text-[10px] font-bold uppercase tracking-[0.4em] text-theme-text hover:border-brand-tactical transition-all"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold text-theme-text uppercase">Criar Nova Senha</h2>
                <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em]">Defina uma credencial forte e segura</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block">Nova Senha</label>
                  <div className="relative group">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" />
                    <input 
                      type="password" 
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-[13px] font-medium text-theme-text focus:border-brand-tactical outline-none transition-all" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block">Confirmar Senha</label>
                  <div className="relative group">
                    <Lock size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" />
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-[13px] font-medium text-theme-text focus:border-brand-tactical outline-none transition-all" 
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {message.text && (
                  <div className={`p-4 flex items-center gap-3 animate-in fade-in zoom-in-95 duration-300 ${
                    message.type === "error" ? 'bg-brand-danger/10 border border-brand-danger/20 text-brand-danger' : 'bg-brand-tactical/10 border border-brand-tactical/20 text-brand-tactical'
                  }`}>
                    {message.type === "error" ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                    <p className="text-[10px] font-bold uppercase tracking-widest">{message.text}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading || message.type === "success"}
                  className="w-full py-4 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
                >
                  {loading ? "Processando..." : (
                    <>
                      Atualizar Senha <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <p className="text-center text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em]">
          Ambiente Protegido por Foto Segundo &copy; {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}

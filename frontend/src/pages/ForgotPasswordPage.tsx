import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { isAxiosError } from "axios";
import { API } from "../lib/api";
import { ShieldCheck, ArrowRight, Mail, AlertTriangle, CheckCircle2, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      await API.post("/auth/forgot-password", { email });
      setMessage({ 
        type: "success", 
        text: "E-mail de recuperação enviado! Verifique sua caixa de entrada (e a pasta de spam)." 
      });
    } catch (err: unknown) {
      const msg = isAxiosError(err)
        ? (err.response?.data?.error ?? "Erro ao solicitar recuperação. Verifique o e-mail informado.")
        : "Erro ao solicitar recuperação.";
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
          <h1 className="text-2xl md:text-4xl font-heading font-bold text-theme-text uppercase ">
            Recuperar Acesso
          </h1>
          <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.4em]">
            Foto Segundo · Segurança de Conta
          </p>
        </div>

        {/* Card */}
        <div className="lux-card p-5 md:p-10 space-y-8 border-l-4 border-l-brand-tactical bg-theme-bg-muted/5 backdrop-blur-sm">
          {message.type === "success" ? (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center text-brand-tactical animate-in zoom-in-95 duration-500">
                <CheckCircle2 size={56} />
              </div>
              <p className="text-[11px] font-bold text-theme-text uppercase tracking-widest leading-relaxed">
                {message.text}
              </p>
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-[0.4em] hover:brightness-110 transition-all"
              >
                Voltar ao Login
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <h2 className="text-xl font-heading font-bold text-theme-text uppercase ">Esqueceu sua senha?</h2>
                <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em]">Informe seu e-mail para receber as instruções de recuperação</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-theme-muted block">E-mail Cadastrado</label>
                  <div className="relative group">
                    <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" />
                    <input 
                      type="email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full bg-theme-bg border border-theme-border p-4 pl-12 text-[13px] font-medium text-theme-text focus:border-brand-tactical outline-none transition-all" 
                      placeholder="seu@email.com"
                      required
                    />
                  </div>
                </div>

                {message.text && message.type === "error" && (
                  <div className="p-4 flex items-center gap-3 bg-red-400/10 border border-red-400/20 text-red-400 animate-in fade-in zoom-in-95 duration-300">
                    <AlertTriangle size={16} />
                    <p className="text-[10px] font-bold uppercase tracking-widest">{message.text}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-5 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-[0.4em] hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-3 group shadow-xl shadow-brand-tactical/10"
                >
                  {loading ? "ENVIANDO..." : (
                    <>
                      Enviar Instruções <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all"
                  >
                    <ArrowLeft size={10} /> Voltar ao Login
                  </Link>
                </div>
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

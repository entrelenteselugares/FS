import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, User, Camera, Building2, Mail, Lock, UserCircle, Phone } from "lucide-react";
import { API } from "../lib/api";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") || "CLIENTE") as "CLIENTE" | "PROFISSIONAL" | "CARTORIO";
  
  const [role, setRole] = useState<"CLIENTE" | "PROFISSIONAL" | "CARTORIO">(initialRole);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    whatsapp: ""
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log(`[REGISTERING] User Role: ${role}`);
      const response = await API.post("/auth/register", { ...formData, role });
      
      console.log("[REGISTER SUCCESS]", response.data);

      const hasPending = !!localStorage.getItem("pending_purchase_event_id");
      if (hasPending) {
        alert("Registro concluído com sucesso. Agora faça login para finalizar sua compra.");
      } else {
        alert("Inscrição submetida. Por favor, autentique sua conta para continuar.");
      }
      
      navigate("/login");
    } catch (err: any) {
      console.error("[REGISTER CRITICAL FAILURE]:", err.response?.data || err.message);
      
      const apiError = err.response?.data;
      const displayMsg = typeof apiError?.error === 'string' 
        ? `${apiError.error}${apiError.details ? ` (${apiError.details})` : ""}`
        : "Não foi possível processar o registro. Verifique sua conexão e tente novamente.";
        
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "CLIENTE", label: "Private Client", icon: <User size={14} /> },
    { id: "PROFISSIONAL", label: "Network Artist", icon: <Camera size={14} /> },
    { id: "CARTORIO", label: "Estabelecimento", icon: <Building2 size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-6 py-20 relative overflow-hidden">
      {/* Decorative Editorial Lines */}
      <div className="absolute top-0 left-1/3 w-[1px] h-full bg-white/[0.02]" />
      <div className="absolute top-0 right-1/3 w-[1px] h-full bg-white/[0.02]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="w-full max-w-2xl relative z-10"
      >
        <div className="text-center mb-16">
          <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600 mb-8 font-light italic">Request Membership</div>
          <h1 className="text-5xl md:text-7xl font-serif text-white tracking-tight mb-4">
            Solicitar <span className="text-zinc-700 italic">Registro</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-olive/80">The Collective Network Protocol</p>
        </div>

        <div className="border border-white/5 bg-white/[0.01] p-8 md:p-16">
          {error && (
            <div className="border border-red-900/20 bg-red-900/5 text-red-700 text-[9px] font-bold uppercase tracking-[0.3em] p-6 mb-12 text-center font-bold">
              {typeof error === 'string' ? error : ((error as any).error || JSON.stringify(error))}
            </div>
          )}

          {/* Role Selector Editorial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 mb-16">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as any)}
                className={`flex flex-col items-center justify-center py-8 px-4 transition-all duration-700 group ${
                  role === r.id ? "bg-white text-black" : "text-zinc-500 hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                <div className={`mb-4 transition-transform group-hover:scale-110 ${role === r.id ? "opacity-100" : "opacity-30 group-hover:opacity-100"}`}>
                  {r.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em]">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4 md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">Entidade / Nome Completo</label>
              <div className="relative group">
                <UserCircle className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="TITULAR DO REGISTRO"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">Comunicação (WhatsApp)</label>
              <div className="relative group">
                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">E-mail Cadastral</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="EMAIL@DOMAIN.COM"
                />
              </div>
            </div>

            <div className="space-y-4 md:col-span-2">
              <label className="text-[9px] font-bold uppercase tracking-[0.4em] text-zinc-700 ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-brand-olive transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full bg-transparent border-b border-zinc-900 py-3 pl-8 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-olive transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 bg-white text-black hover:bg-zinc-200 font-bold uppercase tracking-[0.5em] text-[10px] py-6 transition-all mt-6 flex items-center justify-center gap-4 group"
            >
              {loading ? "PROCESSING REQUEST..." : (
                <>
                  Confirmar Inscrição <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 text-center border-t border-white/5 pt-10">
            <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-[0.3em] mb-4">
              Já possui credenciais? <Link to="/login" className="text-white hover:text-brand-olive ml-4 transition-all italic underline underline-offset-4 decoration-white/10">Fazer Login</Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="text-zinc-800 hover:text-white text-[9px] font-bold uppercase tracking-[0.5em] transition-all">
            Return to Showcase
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

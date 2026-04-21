import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, User, Camera, Building2, Mail, Lock, UserCircle, Phone } from "lucide-react";
import { API } from "../lib/api";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") || "CLIENTE") as "CLIENTE" | "PROFISSIONAL" | "UNIDADE";
  
  const [role, setRole] = useState<"CLIENTE" | "PROFISSIONAL" | "UNIDADE">(initialRole);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    whatsapp: "",
    // Campos Profissional
    habilidades: [] as string[],
    outrasHabilidades: "",
    equipamento: "",
    // Campos Unidade
    razaoSocial: "",
    endereco: "",
    acceptedTerms: false,
    acceptedPrivacy: false,
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
      
      // Logar automaticamente salvando o token e dados do usuário
      const { token, user } = response.data;
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));

      console.log("[REGISTER & LOGIN SUCCESS]", user.nome);

      const hasPending = localStorage.getItem("pending_purchase_event_id");
      if (hasPending) {
        // Se estava tentando comprar, volta para o evento
        navigate(`/public/events/${hasPending}`);
      } else {
        // Senão, vai para o dashboard correto
        const target = user.role === "ADMIN" ? "/admin" : user.role === "UNIDADE" || user.role === "CARTORIO" ? "/cartorio" : user.role === "PROFISSIONAL" ? "/profissional" : "/#eventos";
        navigate(target);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string, details?: string } }, message?: string };
      console.error("[REGISTER CRITICAL FAILURE]:", error.response?.data || error.message);
      
      const apiError = error.response?.data;
      const displayMsg = typeof apiError?.error === 'string' 
        ? `${apiError.error}${apiError.details ? ` (${apiError.details})` : ""}`
        : "Não foi possível processar o registro. Verifique sua conexão e tente novamente.";
        
      setError(displayMsg);
    } finally {
      setLoading(false);
    }
  };

  const roles = [
    { id: "CLIENTE", label: "Cliente Privado", icon: <User size={14} /> },
    { id: "PROFISSIONAL", label: "Artista da Rede", icon: <Camera size={14} /> },
    { id: "UNIDADE", label: "Unidade Local", icon: <Building2 size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center px-6 py-20 relative overflow-hidden transition-colors duration-300">
      {/* Back Button */}
      <nav className="absolute top-0 left-0 w-full z-50 p-6 pointer-events-none">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.4em] text-white/40 hover:text-white transition-all bg-black/20 backdrop-blur-md px-6 py-3 border border-white/5"
        >
          <span className="text-lg">←</span> Vitrine
        </button>
      </nav>

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
          <div className="text-[10px] font-bold uppercase tracking-[0.6em] text-theme-muted mb-8 font-light">Solicitar Adesão</div>
          <h1 className="text-5xl md:text-7xl font-sans font-black text-theme-text tracking-tighter mb-4 uppercase">
            SOLICITAR <span className="text-theme-muted opacity-50">REGISTRO</span>
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-brand-tactical">Protocolo Coletivo de Rede</p>
        </div>

        <div className="border border-theme-border bg-theme-bg-muted/30 p-8 md:p-16">
          {error && (
            <div className="border border-red-900/10 bg-red-900/5 text-red-600 text-[10px] font-bold uppercase tracking-[0.2em] p-6 mb-12 text-center font-bold">
              {error}
            </div>
          )}

          {/* Role Selector Editorial */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-white/5 border border-white/5 mb-16">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as "CLIENTE" | "PROFISSIONAL" | "UNIDADE")}
                className={`flex flex-col items-center justify-center py-8 px-4 transition-all duration-700 group rounded-none ${
                  role === r.id ? "bg-brand-tactical text-white" : "text-zinc-500 hover:bg-white/[0.02] hover:text-white"
                }`}
              >
                <div className={`mb-4 transition-transform group-hover:scale-110 ${role === r.id ? "opacity-100" : "opacity-30 group-hover:opacity-100"}`}>
                  {r.icon}
                </div>
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] font-bold">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted ml-1">Entidade / Nome Completo</label>
              <div className="relative group">
                <UserCircle className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full bg-transparent border-b border-theme-border py-3 pl-8 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all"
                  placeholder="EX: JOÃO DA SILVA"
                  autoComplete="name"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted ml-1">Comunicação (WhatsApp)</label>
              <div className="relative group">
                <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="text"
                  required
                  value={formData.whatsapp}
                  onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                  className="w-full bg-transparent border-b border-theme-border py-3 pl-8 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted ml-1">E-mail Cadastral</label>
              <div className="relative group">
                <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-transparent border-b border-theme-border py-3 pl-8 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all"
                  placeholder="EMAIL@DOMINIO.COM"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Campos Dinâmicos baseado no Role */}
            {role === "PROFISSIONAL" && (
              <div className="md:col-span-2 space-y-8 mt-4 border-l-2 border-brand-tactical/20 pl-8 py-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted">Minhas Especialidades</label>
                  <div className="flex flex-wrap gap-4">
                    {["CAPTAÇÃO", "EDIÇÃO"].map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => {
                          const current = formData.habilidades;
                          const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
                          setFormData({ ...formData, habilidades: next });
                        }}
                        className={`px-6 py-3 text-[9px] font-black uppercase tracking-widest border transition-all ${
                          formData.habilidades.includes(skill) ? "bg-brand-tactical text-white border-brand-tactical" : "border-white/5 text-zinc-600 hover:border-white/10"
                        }`}
                      >
                        {skill}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted">Habilidades Extras</label>
                  <textarea
                    value={formData.outrasHabilidades}
                    onChange={(e) => setFormData({ ...formData, outrasHabilidades: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border py-3 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all resize-none"
                    placeholder="EX: TRATAMENTO DE COR, EDIÇÃO ÁGIL..."
                    rows={2}
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted">Meus Equipamentos</label>
                  <textarea
                    value={formData.equipamento}
                    onChange={(e) => setFormData({ ...formData, equipamento: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border py-3 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all resize-none"
                    placeholder="EX: DRONE, ILUMINAÇÃO, CÂMERA..."
                    rows={2}
                  />
                </div>
              </div>
            )}

            {role === "UNIDADE" && (
              <div className="md:col-span-2 space-y-8 mt-4 border-l-2 border-brand-tactical/20 pl-8 py-4">
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">Razão Social / Identificação</label>
                  <input
                    type="text"
                    required
                    value={formData.razaoSocial}
                    onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                    className="w-full bg-transparent border-b border-zinc-900 py-3 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-tactical transition-all"
                    placeholder="NOME OFICIAL DA UNIDADE"
                  />
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-zinc-600">Localização Estratégica (Endereço)</label>
                  <input
                    type="text"
                    required
                    value={formData.endereco}
                    onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
                    className="w-full bg-transparent border-b border-zinc-900 py-3 text-xs text-white placeholder-zinc-800 focus:outline-none focus:border-brand-tactical transition-all"
                    placeholder="CIDADE, ESTADO, ENDEREÇO..."
                  />
                </div>
              </div>
            )}

            <div className="space-y-4 md:col-span-2">
              <label className="text-[10px] font-bold uppercase tracking-[0.4em] text-theme-muted ml-1">Senha de Acesso</label>
              <div className="relative group">
                <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={14} strokeWidth={1.5} />
                <input
                  type="password"
                  required
                  value={formData.senha}
                  onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                  className="w-full bg-transparent border-b border-theme-border py-3 pl-8 text-xs text-theme-text placeholder:text-theme-muted/40 focus:outline-none focus:border-brand-tactical transition-all"
                  placeholder="••••••••"
                  autoComplete="new-password"
                />
              </div>
            </div>

            {/* LGPD Compliance */}
            <div className="md:col-span-2 space-y-4 mt-6">
              <div className="flex items-start gap-4 cursor-pointer" onClick={() => setFormData({ ...formData, acceptedTerms: !formData.acceptedTerms })}>
                <div className={`mt-1 w-4 h-4 border transition-all flex items-center justify-center ${formData.acceptedTerms ? "bg-brand-tactical border-brand-tactical" : "border-theme-border bg-theme-bg-muted"}`}>
                  {formData.acceptedTerms && <div className="w-1.5 h-1.5 bg-white" />}
                </div>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest leading-relaxed">
                  Eu aceito os <a href="/termos" target="_blank" className="text-theme-text underline underline-offset-4 decoration-brand-tactical/30">Termos de Uso</a> do Coletivo Foto Segundo.
                </p>
              </div>

              <div className="flex items-start gap-4 cursor-pointer" onClick={() => setFormData({ ...formData, acceptedPrivacy: !formData.acceptedPrivacy })}>
                <div className={`mt-1 w-4 h-4 border transition-all flex items-center justify-center ${formData.acceptedPrivacy ? "bg-brand-tactical border-brand-tactical" : "border-theme-border bg-theme-bg-muted"}`}>
                  {formData.acceptedPrivacy && <div className="w-1.5 h-1.5 bg-white" />}
                </div>
                <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest leading-relaxed">
                  Eu concordo com a <a href="/privacidade" target="_blank" className="text-theme-text underline underline-offset-4 decoration-brand-tactical/30">Política de Privacidade</a> e o uso de meus dados.
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
              className="md:col-span-2 bg-brand-tactical text-white hover:brightness-110 font-bold uppercase tracking-[0.5em] text-[11px] py-6 transition-all mt-6 flex items-center justify-center gap-4 group rounded-none disabled:opacity-30 disabled:grayscale transition-all"
            >
              {loading ? "PROCESSANDO SOLICITAÇÃO..." : (
                <>
                  Confirmar Inscrição <ArrowRight size={12} className="group-hover:translate-x-2 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-16 text-center border-t border-white/5 pt-10">
            <p className="text-zinc-700 text-[9px] font-bold uppercase tracking-[0.3em] mb-4">
              Já possui credenciais? <Link to="/login" className="text-white hover:text-brand-tactical ml-4 transition-all font-bold underline underline-offset-4 decoration-white/10">Fazer Login</Link>
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/" className="text-theme-muted hover:text-theme-text text-[9px] font-bold uppercase tracking-[0.5em] transition-all">
            Voltar para a Vitrine
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

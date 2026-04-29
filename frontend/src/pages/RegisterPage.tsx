import React, { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

import { ArrowRight, Camera, Mail, Lock, UserCircle, Phone, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { API } from "../lib/api";
import { ThemeToggle } from "../components/ThemeToggle";

export const RegisterPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") || "CLIENTE") as "CLIENTE" | "PROFISSIONAL" | "CARTORIO";
  
  const [role, setRole] = useState<"CLIENTE" | "PROFISSIONAL" | "CARTORIO">(initialRole);
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
    cep: "",
    logradouro: "",
    numero: "",
    bairro: "",
    cidade: "",
    uf: "",
    referencia: "",
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [loading, setLoading] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleCepChange = async (cepValue: string) => {
    const rawCep = cepValue.replace(/\D/g, "").slice(0, 8);
    
    // Masking 00000-000
    let masked = rawCep;
    if (rawCep.length > 5) {
      masked = `${rawCep.slice(0, 5)}-${rawCep.slice(5)}`;
    }
    
    setFormData(prev => ({ ...prev, cep: masked }));

    if (rawCep.length === 8) {
      setIsCepLoading(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${rawCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP:", err);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log(`[REGISTERING] User Role: ${role}`);
      
      let finalPayload = { ...formData, role };
      
      // Se for Unidade, consolidamos o endereço
      if (role === "CARTORIO") {
        const fullAddress = `${formData.logradouro}, ${formData.numero}${formData.referencia ? ` - ${formData.referencia}` : ""} | ${formData.bairro} | ${formData.cidade}-${formData.uf}`;
        finalPayload = { 
          ...finalPayload, 
          endereco: fullAddress,
          cidade: formData.cidade // Também envia cidade separada se o backend permitir
        };
      }

      const response = await API.post("/auth/register", finalPayload);
      
      // Logar automaticamente salvando o token e dados do usuário
      const { token, user } = response.data;
      localStorage.setItem("fs_token", token);
      
      // Notificamos o sistema que estamos logados antes de navegar
      API.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      console.log("[REGISTER & LOGIN SUCCESS]", user.nome);

      const target = role === "PROFISSIONAL" ? "/profissional"
        : (role === "CARTORIO") ? "/unidade-fixa"
        : "/minha-conta";

      const hasPending = localStorage.getItem("pending_purchase_event_id");
      
      // Navegação imediata sem resetar loading local para evitar crash de remoção de nó no mobile
      if (hasPending) {
        window.location.href = `/public/events/${hasPending}`;
      } else {
        window.location.href = target;
      }
      return; // Interrompe o fluxo para evitar setLoading(false)
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
    { id: "CLIENTE",      label: "Cliente Privado",   icon: <UserCircle size={14} /> },
    { id: "PROFISSIONAL", label: "Profissional da Rede", icon: <Camera size={14} /> },
    { id: "CARTORIO",     label: "Unidade Fixa",      icon: <ShieldCheck size={14} /> },
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex items-center justify-center px-4 py-8 md:py-12 relative overflow-hidden transition-colors duration-300">
      {/* Back Button */}
      <nav className="absolute top-0 left-0 w-full z-50 p-4 pointer-events-none flex justify-between items-center">
        <button 
          onClick={() => navigate("/")} 
          className="pointer-events-auto flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all bg-theme-bg-muted/50 backdrop-blur-md px-5 py-2.5 border border-theme-border"
        >
          <span className="text-base">←</span> Vitrine
        </button>
        <div className="pointer-events-auto scale-90 origin-right">
          <ThemeToggle />
        </div>
      </nav>

      {/* Decorative Editorial Lines */}
      <div className="absolute top-0 left-1/4 w-[1px] h-full bg-theme-border opacity-10" />
      <div className="absolute top-0 right-1/4 w-[1px] h-full bg-theme-border opacity-10" />
      
      <div 
        key="register-container"
        className="w-full max-w-xl relative z-10"
      >
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 32, objectFit: "contain" }} />
          </div>
          <div className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] mb-3 italic">Solicitar Adesão</div>
          <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase italic leading-none tracking-tighter">
            SOLICITAR <span className="opacity-20">REGISTRO</span>
          </h1>
          <p className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em] mt-3 opacity-60">Protocolo de Registro de Rede (Técnico & Unidades)</p>
        </div>

        <div className="bg-theme-bg-muted/30 border border-theme-border shadow-2xl overflow-hidden">
          {error && (
            <div className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-[0.2em] p-4 text-center border-b border-red-500/10">
              {error}
            </div>
          )}

          {/* Role Selector Editorial */}
          <div className="grid grid-cols-3 gap-px bg-theme-border/20 border-b border-theme-border/20">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id as "CLIENTE" | "PROFISSIONAL" | "CARTORIO")}
                className={`flex flex-col items-center justify-center py-5 px-2 transition-all duration-500 group relative overflow-hidden ${
                  role === r.id ? "bg-brand-tactical text-brand-text" : "text-theme-muted hover:bg-theme-bg-muted hover:text-theme-text"
                }`}
              >
                <div className={`mb-2 transition-transform group-hover:scale-110 ${role === r.id ? "opacity-100" : "opacity-30 group-hover:opacity-100"}`}>
                  {r.icon}
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em]">{r.label}</span>
                {role === r.id && <div className="absolute bottom-0 left-0 w-full h-[3px] bg-theme-bg-muted/20" />}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="p-8 md:p-10 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
              <div className="space-y-3 md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">Entidade / Nome Completo</label>
                <div className="relative group">
                  <UserCircle className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                  <input
                    type="text"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-8 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                    placeholder="EX: JOÃO DA SILVA"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">Comunicação (WhatsApp)</label>
                <div className="relative group">
                  <Phone className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                  <input
                    type="text"
                    required
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-8 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">E-mail Cadastral</label>
                <div className="relative group">
                  <Mail className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-8 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                    placeholder="EMAIL@DOMINIO.COM"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Campos Dinâmicos baseado no Role */}
              {role === "PROFISSIONAL" && (
                <div className="md:col-span-2 space-y-6 pt-4 border-l-2 border-brand-tactical/20 pl-6 animate-in slide-in-from-left duration-500">
                  <div className="space-y-3">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Minhas Especialidades</label>
                    <div className="flex flex-wrap gap-3">
                      {["FOTO", "VÍDEO", "EDIÇÃO"].map(skill => (
                        <button
                          key={skill}
                          type="button"
                          onClick={() => {
                            const current = formData.habilidades;
                            const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
                            setFormData({ ...formData, habilidades: next });
                          }}
                          className={`px-4 py-2.5 text-[8px] font-black uppercase tracking-widest border transition-all ${
                            formData.habilidades.includes(skill) ? "bg-brand-tactical text-brand-text border-brand-tactical" : "border-theme-border/40 text-theme-muted hover:border-brand-tactical/30"
                          }`}
                        >
                          {skill}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {role === "CARTORIO" && (
                <div className="md:col-span-2 space-y-6 pt-4 border-l-2 border-brand-tactical/20 pl-6 animate-in slide-in-from-left duration-500">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Razão Social / Nome Unidade</label>
                      <input
                        type="text"
                        required
                        value={formData.razaoSocial}
                        onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                        className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                        placeholder="NOME OFICIAL DA UNIDADE"
                      />
                    </div>
                    <div className="space-y-3 relative">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">CEP</label>
                      <input
                        type="text"
                        required
                        value={formData.cep}
                        onChange={(e) => handleCepChange(e.target.value)}
                        className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text focus:outline-none focus:border-brand-tactical transition-all font-mono"
                        placeholder="00000-000"
                      />
                      {isCepLoading && <div className="absolute right-0 bottom-2 w-3 h-3 border-t-2 border-brand-tactical rounded-full animate-spin" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="md:col-span-3 space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Logradouro / Rua</label>
                      <input
                        type="text"
                        required
                        value={formData.logradouro}
                        onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                        className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all font-medium"
                        placeholder="NOME DA RUA OU AVENIDA"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Número</label>
                      <input
                        type="text"
                        required
                        value={formData.numero}
                        onChange={(e) => setFormData({ ...formData, numero: e.target.value })}
                        className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text focus:outline-none focus:border-brand-tactical transition-all font-medium"
                        placeholder="S/N"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Bairro / Localidade</label>
                      <input
                        type="text"
                        required
                        value={formData.bairro}
                        onChange={(e) => setFormData({ ...formData, bairro: e.target.value })}
                        className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text focus:outline-none focus:border-brand-tactical transition-all font-medium"
                        placeholder="BAIRRO"
                      />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted opacity-60">Cidade / UF</label>
                      <div className="w-full bg-transparent border-b border-theme-border/60 py-2 text-[11px] text-theme-text/40 flex justify-between uppercase">
                        <span>{formData.cidade || "Cidade"}</span>
                        <span className="font-black text-brand-tactical">{formData.uf || "UF"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-3 md:col-span-2">
                <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted ml-1 opacity-60">Senha de Acesso</label>
                <div className="relative group flex items-center">
                  <Lock className="absolute left-0 top-1/2 -translate-y-1/2 text-theme-muted/40 group-focus-within:text-brand-tactical transition-colors" size={14} />
                  <input
                    type={showSenha ? "text" : "password"}
                    required
                    value={formData.senha}
                    onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                    className="w-full bg-transparent border-b border-theme-border/60 py-2.5 pl-8 pr-10 text-xs text-theme-text placeholder:text-theme-muted/20 focus:outline-none focus:border-brand-tactical transition-all"
                    placeholder="••••••••"
                    autoComplete="new-password"
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
            </div>

            {/* LGPD Compliance */}
            <div className="md:col-span-2 space-y-3">
              {[
                { key: "acceptedTerms", label: "Aceito os Termos de Uso", link: "/termos" },
                { key: "acceptedPrivacy", label: "Concordo com a Política de Privacidade", link: "/privacidade" }
              ].map(item => (
                <div key={item.key} className="flex items-center gap-3 cursor-pointer group" onClick={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })}>
                  <div className={`w-3.5 h-3.5 border transition-all flex items-center justify-center ${formData[item.key as keyof typeof formData] ? "bg-brand-tactical border-brand-tactical" : "border-theme-border bg-theme-bg-muted/50 group-hover:border-brand-tactical/50"}`}>
                    {formData[item.key as keyof typeof formData] && <div className="w-1.5 h-1.5 bg-theme-bg" />}
                  </div>
                  <p className="text-[8px] text-theme-muted font-black uppercase tracking-[0.2em]">
                    Eu {item.label.toLowerCase()} do <a href={item.link} target="_blank" className="text-theme-text underline decoration-brand-tactical/30">Foto Segundo</a>.
                  </p>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
              className="w-full bg-brand-tactical text-brand-text hover:brightness-110 font-black uppercase tracking-[0.5em] text-[10px] py-5 transition-all flex items-center justify-center gap-4 group disabled:opacity-30 disabled:grayscale shadow-xl shadow-brand-tactical/10 italic"
            >
              {loading ? "PROCESSANDO SOLICITAÇÃO..." : (
                <>
                  Confirmar Inscrição <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="px-10 py-6 border-t border-theme-border/40 text-center bg-theme-bg-muted/10">
            <p className="text-theme-muted text-[8px] font-black uppercase tracking-[0.3em]">
              Já possui credenciais? <Link to="/login" className="text-theme-text hover:text-brand-tactical ml-3 transition-all underline underline-offset-4 decoration-theme-border">Fazer Login</Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/" className="text-theme-muted hover:text-theme-text text-[8px] font-black uppercase tracking-[0.5em] transition-all opacity-40 hover:opacity-100">
            Voltar para a Vitrine
          </Link>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { Camera, Mail, Lock, UserCircle, Phone, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { API } from "../lib/api";
import { Helmet } from "react-helmet-async";
import { fetchCepData } from "../hooks/useViaCep";

export const RegisterPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawRole = searchParams.get("role")?.toUpperCase() || "CLIENTE";
  const role = (rawRole === "UNIDADE" ? "CARTORIO" : rawRole) as "CLIENTE" | "PROFISSIONAL" | "CARTORIO";
  
  const { loginWithGoogle } = useAuth();
  
  // Detecta convite de álbum pendente via ?next= ou localStorage
  const nextUrl = searchParams.get("next") || "";
  const inviteCodeFromUrl = nextUrl.startsWith("/invitation/") ? nextUrl.replace("/invitation/", "") : null;
  const inviteCode = inviteCodeFromUrl || localStorage.getItem("fs_pending_invite") || null;

  const updateRole = (newRole: string) => {
    setSearchParams(prev => {
      prev.set("role", newRole === "CARTORIO" ? "UNIDADE" : newRole);
      return prev;
    }, { replace: true });
  };
  const [formData, setFormData] = useState({
    nome: searchParams.get("nome") || "",
    email: searchParams.get("email") || "",
    senha: "",
    whatsapp: "",
    // Campos Profissional
    habilidades: [] as string[],
    outrasHabilidades: "",
    equipamento: "",
    workflowType: ["TRADICIONAL"] as string[], // ["TRADICIONAL", "MOBILE"]

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
  // referralCode do dono do álbum que enviou o convite
  const [inviteOwnerRef, setInviteOwnerRef] = useState<string | null>(null);

  const [showSenha, setShowSenha] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // Busca os detalhes do convite para extrair o referralCode do dono
  useEffect(() => {
    if (!inviteCode) return;
    API.get(`/vaults/invitation/${inviteCode}`)
      .then(({ data }) => {
        const ownerRef = data?.album?.owner?.referralCode;
        if (ownerRef) setInviteOwnerRef(ownerRef);
      })
      .catch(() => { /* Convite inválido ou expirado — ignora silenciosamente */ });
  }, [inviteCode]);

  const handleCepChange = async (cepValue: string) => {
    const rawCep = cepValue.replace(/\D/g, "").slice(0, 8);
    
    // Masking 00000-000
    let masked = rawCep;
    if (rawCep.length > 5) {
      masked = `${rawCep.slice(0, 5)}-${rawCep.slice(5)}`;
    }
    
    setFormData(prev => ({ ...prev, cep: masked }));

    if (rawCep.length === 8) {
      try {
        const data = await fetchCepData(rawCep);
        
        if (data && !data.erro) {
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
      }
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const claim = searchParams.get("claim");
      // Prioridade: ref do convite de álbum > ref do link de indicação > localStorage
      const refCode = inviteOwnerRef || searchParams.get("ref") || localStorage.getItem("fs_referral");
      let finalPayload = { ...formData, role, claim, ref: refCode };
      
      // Se for Unidade, consolidamos o endereço
      if (role === "CARTORIO") {
        const fullAddress = `${formData.logradouro}, ${formData.numero}${formData.referencia ? ` - ${formData.referencia}` : ""} | ${formData.bairro} | ${formData.cidade}-${formData.uf}`;
        finalPayload = { 
          ...finalPayload, 
          endereco: fullAddress,
          cidade: formData.cidade // Também envia cidade separada se o backend permitir
        };
      }

      await API.post("/auth/register", finalPayload);
      
      // O backend já configurou os cookies HttpOnly
      // Apenas navegamos para a próxima página

      const target = "/minha-conta";

      const hasPending = localStorage.getItem("pending_purchase_event_id");
      
      // Limpa o convite pendente do localStorage
      if (inviteCode) localStorage.removeItem("fs_pending_invite");

      // Navegação imediata — prioridade: convite > returnUrl > claim > pending purchase > conta
      const returnUrl = searchParams.get("returnUrl");

      if (inviteCode) {
        window.location.href = `/invitation/${inviteCode}`;
      } else if (returnUrl) {
        window.location.href = returnUrl;
      } else if (claim) {
        window.location.href = "/minha-conta?claimed=true";
      } else if (hasPending) {
        window.location.href = `/e/${hasPending}`;
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
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-3 md:p-6 py-3 md:py-6 md:py-12">
      <Helmet>
        <title>Registro — Foto Segundo</title>
      </Helmet>

      <div className="w-full max-w-2xl space-y-12">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-theme-border pb-6">
          <button 
            onClick={() => navigate("/")} 
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-all"
          >
            <span className="text-base">← </span> Vitrine
          </button>
          <div className="flex flex-col items-center">
            <Link to="/"><img src="/logo.png" alt="Foto Segundo" style={{ height: 38, objectFit: "contain", filter: "var(--logo-filter)" }} /></Link>
            <span className="text-[10px] font-bold tracking-[0.3em] text-zinc-600 uppercase ">Solicitar Adesão</span>
          </div>
          <div className="w-10" /> {/* Spacer */}
        </div>

        {/* Content */}
        <div className="space-y-10">
          <div className="text-center">
             <h1 className="text-3xl md:text-5xl font-heading font-bold text-theme-text uppercase leading-none ">
              SOLICITAR <span className="opacity-20">REGISTRO</span>
            </h1>
            <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.3em] mt-3">Protocolo de Registro de Rede</p>
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 text-[9px] font-bold uppercase tracking-[0.2em] p-5 text-center border border-red-500/20 rounded-2xl">
              {error}
            </div>
          )}

          {/* Role Selector */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => updateRole(r.id)}
                className={`flex flex-col items-center justify-center py-3 md:py-6 px-4 rounded-3xl transition-all duration-500 border ${
                  role === r.id ? "bg-brand-tactical border-brand-tactical text-black shadow-[0_15px_30px_rgba(133,185,172,0.2)]" : "bg-theme-bg-muted border-theme-border text-theme-text-muted hover:border-theme-border hover:text-theme-text"
                }`}
              >
                <div className="mb-2">{r.icon}</div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-center">{r.label}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-8">
            <div className="space-y-3">
              <button 
                type="button" 
                onClick={loginWithGoogle}
                className="w-full bg-white text-black hover:bg-gray-100 border border-gray-300 h-12 flex items-center justify-center relative rounded-2xl transition-all"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg" className="absolute left-4">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                <span className="font-bold text-[10px] uppercase tracking-[0.2em]">Cadastrar com Google</span>
              </button>
            </div>

            <div className="flex items-center gap-4 my-6">
              <div className="flex-1 h-px bg-theme-border"></div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-muted">Ou cadastre com e-mail</span>
              <div className="flex-1 h-px bg-theme-border"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
               <div className="space-y-2 md:col-span-2">
                 <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Entidade / Nome Completo</label>
                 <div className="relative group">
                   <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type="text"
                     required
                     value={formData.nome}
                     onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                     className="w-full bg-theme-bg-field border border-theme-border py-4 pl-12 pr-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                     placeholder="EX: JOÃO DA SILVA"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Comunicação (WhatsApp)</label>
                 <div className="relative group">
                   <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type="text"
                     required
                     value={formData.whatsapp}
                     onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                     className="w-full bg-theme-bg-field border border-theme-border py-4 pl-12 pr-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                     placeholder="(00) 00000-0000"
                   />
                 </div>
               </div>

               <div className="space-y-2">
                 <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">E-mail Cadastral</label>
                 <div className="relative group">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type="email"
                     required
                     value={formData.email}
                     onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                     className="w-full bg-theme-bg-field border border-theme-border py-4 pl-12 pr-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                     placeholder="EMAIL@DOMINIO.COM"
                   />
                 </div>
               </div>

               {/* Campos Dinâmicos Profissional */}
               {role === "PROFISSIONAL" && (
                 <div className="md:col-span-2 space-y-8 p-4 md:p-8 bg-theme-bg-muted border border-theme-border rounded-3xl animate-in fade-in duration-500">
                    <div className="space-y-4">
                        <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest ">Especialidades</p>
                       <div className="flex flex-wrap gap-3">
                         {["FOTO", "VÍDEO", "EDIÇÃO", "IMPRESSÃO"].map(skill => (
                           <button
                             key={skill}
                             type="button"
                             onClick={() => {
                               const current = formData.habilidades;
                               const next = current.includes(skill) ? current.filter(s => s !== skill) : [...current, skill];
                               setFormData({ ...formData, habilidades: next });
                             }}
                             className={`px-5 py-3 text-[10px] font-black uppercase tracking-widest border rounded-xl transition-all ${
                               formData.habilidades.includes(skill) ? "bg-brand-tactical border-brand-tactical text-black" : "border-white/10 text-zinc-500 hover:border-white/20"
                             }`}
                           >
                             {skill}
                           </button>
                         ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest ">Workflow</p>
                       <div className="grid grid-cols-2 gap-4">
                          {[
                            { id: "TRADICIONAL", label: "Tradicional", icon: <Camera size={14} /> },
                            { id: "MOBILE", label: "Mobile Maker", icon: <Phone size={14} /> }
                          ].map(type => (
                            <button
                              key={type.id}
                              type="button"
                              onClick={() => {
                                const current = formData.workflowType;
                                const next = current.includes(type.id) ? current.filter(id => id !== type.id) : [...current, type.id];
                                if (next.length > 0) setFormData({ ...formData, workflowType: next });
                              }}
                              className={`p-5 flex items-center gap-4 border rounded-2xl transition-all ${
                                formData.workflowType.includes(type.id) ? "bg-brand-tactical/10 border-brand-tactical text-brand-tactical" : "bg-theme-bg border-theme-border text-theme-muted hover:border-theme-border"
                              }`}
                            >
                              {type.icon}
                              <span className="text-[10px] font-bold uppercase tracking-widest">{type.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
               )}

               {/* Campos Dinâmicos Unidade */}
               {role === "CARTORIO" && (
                 <div className="md:col-span-2 space-y-8 p-4 md:p-8 bg-theme-bg-muted border border-theme-border rounded-3xl animate-in fade-in duration-500">
                    <div className="grid grid-cols-2 gap-3 md:gap-6">
                       <div className="space-y-2 md:col-span-2">
                          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Razão Social / Nome Unidade</label>
                          <input
                            type="text"
                            required
                            value={formData.razaoSocial}
                            onChange={(e) => setFormData({ ...formData, razaoSocial: e.target.value })}
                            className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                            placeholder="NOME OFICIAL DA UNIDADE"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">CEP</label>
                          <input
                            type="text"
                            required
                            value={formData.cep}
                            onChange={(e) => handleCepChange(e.target.value)}
                            className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all font-mono"
                            placeholder="00000-000"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Logradouro</label>
                          <input
                            type="text"
                            required
                            value={formData.logradouro}
                            onChange={(e) => setFormData({ ...formData, logradouro: e.target.value })}
                            className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                            placeholder="RUA / AVENIDA"
                          />
                       </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Número</label>
                           <input type="text" required value={formData.numero} onChange={(e) => setFormData({ ...formData, numero: e.target.value })} className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all" placeholder="123" />
                        </div>
                        <div className="col-span-2 space-y-2">
                           <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Complemento</label>
                           <input type="text" value={formData.referencia} onChange={(e) => setFormData({ ...formData, referencia: e.target.value })} className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all" placeholder="SALA 01, FUNDOS..." />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Bairro</label>
                           <input type="text" required value={formData.bairro} onChange={(e) => setFormData({ ...formData, bairro: e.target.value })} className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all" placeholder="PREENCHIDO VIA CEP" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Cidade</label>
                           <input type="text" required value={formData.cidade} onChange={(e) => setFormData({ ...formData, cidade: e.target.value })} className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all" placeholder="PREENCHIDA VIA CEP" />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">Estado (UF)</label>
                           <input type="text" required maxLength={2} value={formData.uf} onChange={(e) => setFormData({ ...formData, uf: e.target.value.toUpperCase() })} className="w-full bg-theme-bg-field border border-theme-border py-4 px-4 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all font-mono uppercase" placeholder="SP" />
                        </div>
                    </div>
                 </div>
               )}

               <div className="space-y-2 md:col-span-2">
                 <label className="text-[10px] font-bold uppercase tracking-[0.3em] text-zinc-500 ml-1">Senha de Acesso</label>
                 <div className="relative group flex items-center">
                   <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors" size={14} />
                   <input
                     type={showSenha ? "text" : "password"}
                     required
                     value={formData.senha}
                     onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                     className="w-full bg-theme-bg-field border border-theme-border py-4 pl-12 pr-12 text-xs text-theme-text rounded-2xl focus:border-brand-tactical transition-all"
                     placeholder="••••••••"
                   />
                   <button
                     type="button"
                     onClick={() => setShowSenha(!showSenha)}
                     className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-theme-text transition-colors"
                   >
                     {showSenha ? <EyeOff size={16} /> : <Eye size={16} />}
                   </button>
                 </div>
               </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "acceptedTerms", label: "Aceito os Termos de Uso" },
                { key: "acceptedPrivacy", label: "Concordo com a Política de Privacidade" }
              ].map(item => (
                <label key={item.key} className="flex items-center gap-4 cursor-pointer group py-3">
                   <input type="checkbox" className="hidden" checked={formData[item.key as keyof typeof formData] as boolean} onChange={() => setFormData({ ...formData, [item.key]: !formData[item.key as keyof typeof formData] })} />
                   <div className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center shrink-0 ${formData[item.key as keyof typeof formData] ? "bg-brand-tactical border-brand-tactical" : "bg-theme-bg-field border-theme-border group-hover:border-brand-tactical/50"}`}>
                    {formData[item.key as keyof typeof formData] && <div className="w-2.5 h-2.5 bg-brand-text rounded-sm" />}
                  </div>
                  <p className="text-[10px] text-theme-muted font-bold uppercase tracking-[0.2em] leading-relaxed select-none">
                    Eu {item.label.toLowerCase()} do Foto Segundo.
                  </p>
                </label>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || !formData.acceptedTerms || !formData.acceptedPrivacy}
              className="w-full bg-brand-tactical text-black hover:bg-white font-bold uppercase tracking-[0.5em] text-[10px] py-5 transition-all flex items-center justify-center gap-4 group disabled:opacity-30 rounded-2xl "
            >
              {loading ? "PROCESSANDO..." : "Confirmar Inscrição"}
            </button>
          </form>
        </div>

        {/* Footer */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-3 md:gap-6 border-t border-theme-border">
           <p className="text-zinc-600 text-[9px] font-bold uppercase tracking-[0.3em]">
            Já possui acesso? <Link to="/login" className="text-white hover:text-brand-tactical ml-2 transition-all">Fazer Login</Link>
          </p>
          <div className="flex items-center gap-4">
             <ShieldCheck size={16} className="text-brand-tactical opacity-50" />
             <span className="text-[9px] font-bold text-zinc-600 uppercase tracking-widest ">Inscrição Criptografada</span>
          </div>
        </div>
      </div>
    </div>
  );
};

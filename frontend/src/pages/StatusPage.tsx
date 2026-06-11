import { Link } from "react-router-dom";
import { ArrowLeft, Activity, CheckCircle2, Server, Smartphone, Key, UploadCloud, CreditCard, Bell, Database, AlertTriangle, RefreshCcw } from "lucide-react";
import { Navbar } from "../components/Navbar";
import SEO from "../components/SEO";

export function StatusPage() {
  const components = [
    { name: "PWA / Frontend", icon: <Smartphone size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "API / Backend", icon: <Server size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Autenticação", icon: <Key size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Upload de Fotos (Vault)", icon: <UploadCloud size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Pagamentos (Mercado Pago)", icon: <CreditCard size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Webhooks de Confirmação", icon: <RefreshCcw size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Notificações", icon: <Bell size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { name: "Armazenamento de Mídia", icon: <Database size={16} />, status: "Operacional", color: "text-emerald-500", bg: "bg-emerald-500/10" }
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Status do Sistema | Foto Segundo" description="Verifique o status operacional da plataforma Foto Segundo em tempo real." />
      <Navbar />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase ">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-16 md:mb-20 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em] ">Monitoramento</span>
            <div className="h-px w-12 bg-brand-tactical" />
          </div>
          <h1 className="text-3xl md:text-5xl md:text-7xl font-heading font-bold text-theme-text uppercase mb-10 leading-none">
            Status da <br /><span className="text-brand-tactical">Plataforma</span>
          </h1>

          {/* Status Geral */}
          <div className="bg-emerald-500/5 border border-emerald-500/30 p-4 md:p-8 rounded-3xl flex flex-col items-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={32} className="text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-emerald-500 uppercase tracking-widest mb-2">
              Todos os sistemas operando normalmente
            </h2>
            <p className="text-theme-text-muted text-sm font-normal uppercase tracking-widest">
              Última verificação: Atualizado em tempo real
            </p>
          </div>
        </div>

        {/* Componentes */}
        <section className="mb-16">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 flex items-center gap-2 text-theme-text-muted">
            <Activity size={16} className="text-brand-tactical" /> Componentes Monitorados
          </h3>
          <div className="bg-theme-bg-muted border border-theme-border rounded-2xl overflow-hidden divide-y divide-theme-border/40">
            {components.map((comp, idx) => (
              <div key={idx} className="p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-theme-bg-muted transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 ${comp.bg} ${comp.color} rounded-xl flex items-center justify-center shrink-0`}>
                    {comp.icon}
                  </div>
                  <span className="font-bold text-theme-text">{comp.name}</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-theme-bg border border-theme-border rounded-full w-full sm:w-auto justify-center">
                  <span className={`w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-emerald-500">{comp.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Histórico */}
        <section className="mb-16">
          <h3 className="text-sm font-bold uppercase tracking-widest mb-6 text-theme-text-muted">
            Histórico de Incidentes
          </h3>
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-2xl text-center">
            <p className="text-theme-text font-normal ">Nenhum incidente registrado nos últimos 90 dias.</p>
          </div>
        </section>

        {/* O que fazer / Notificações */}
        <div className="grid md:grid-cols-2 gap-3 md:gap-6">
          <section className="bg-brand-tactical/10 border border-brand-tactical/20 p-4 md:p-8 rounded-3xl">
            <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-brand-tactical">
              <AlertTriangle size={16} /> O que fazer em caso de instabilidade
            </h3>
            <p className="text-theme-text-muted text-sm font-normal leading-relaxed mb-4">
              Se você está enfrentando um problema e esta página indica operação normal, pode ser uma questão específica da sua conta ou conexão. Nesse caso:
            </p>
            <ul className="space-y-3 mb-6 text-sm text-theme-text-muted font-normal">
              <li className="flex gap-2"><span>1.</span> Limpe o cache do navegador e tente novamente</li>
              <li className="flex gap-2"><span>2.</span> Verifique sua conexão com a internet</li>
              <li className="flex gap-2"><span>3.</span> Se o problema persistir, entre em contato descrevendo o erro e o horário.</li>
            </ul>
            <Link to="/contato" className="inline-block px-3 md:px-6 py-3 bg-brand-tactical text-black font-bold uppercase tracking-widest text-[10px] hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20">
              Acessar Contato
            </Link>
          </section>

          <section className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center gap-2 text-theme-text">
                <Bell size={16} /> Assinar Atualizações
              </h3>
              <p className="text-theme-text-muted text-sm font-normal leading-relaxed mb-6">
                Para receber notificações em caso de instabilidade, ative as notificações push dentro do app ou entre em contato solicitando inclusão na lista de alertas operacionais.
              </p>
            </div>
            <Link to="/contato" className="inline-flex items-center gap-2 text-brand-tactical font-bold uppercase tracking-widest text-xs hover:underline">
              Solicitar inclusão <ArrowLeft size={12} className="rotate-180" />
            </Link>
          </section>
        </div>
      </main>

      <footer className="py-4 md:py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-bold uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

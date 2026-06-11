import { Link } from "react-router-dom";
import { ArrowLeft, MessageSquare, HeadphonesIcon, Building2, Camera, Megaphone, ShieldCheck, Activity, MapPin } from "lucide-react";
import { Navbar } from "../components/Navbar";
import SEO from "../components/SEO";

export function ContactPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Contato | Foto Segundo" description="Fale com a Foto Segundo. Suporte, parcerias, profissionais e imprensa." />
      <Navbar />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black tracking-widest uppercase italic">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Comunicação Direta</span>
            <div className="h-px w-12 bg-brand-tactical" />
          </div>
          <h1 className="text-3xl md:text-5xl md:text-7xl font-heading font-black text-theme-text uppercase tracking-tighter mb-6 italic leading-none">
            Fale com a <br /><span className="text-brand-tactical">Gente</span>
          </h1>
          <p className="text-theme-text-muted font-light text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            Estamos aqui para ajudar. Escolha o canal mais adequado para sua necessidade e nossa equipe responderá com a agilidade do protocolo tático.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-3 md:gap-6 mb-16">
          {/* Suporte */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors">
            <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
              <HeadphonesIcon size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Suporte ao Cliente</h2>
            <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
              Para dúvidas sobre pedidos, pagamentos, álbuns ou acesso à plataforma.
            </p>
            <a href="mailto:suporte@fotosegundo.com.br" className="text-sm font-bold text-theme-text hover:text-brand-tactical transition-colors flex items-center gap-2 mb-2">
              <MessageSquare size={16} className="text-brand-tactical" /> suporte@fotosegundo.com.br
            </a>
            <p className="text-xs text-theme-text-muted uppercase tracking-widest font-bold mb-6">⏱ Resposta: Até 24h úteis</p>
            <div className="pt-6 border-t border-theme-border">
              <p className="text-xs font-light text-theme-text-muted leading-relaxed">
                Antes de enviar, consulte a <Link to="/suporte" className="text-brand-tactical hover:underline font-medium">Central de Ajuda</Link> — a maioria das dúvidas é resolvida por lá.
              </p>
            </div>
          </div>

          {/* Parcerias */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors">
            <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
              <Building2 size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Parcerias B2B</h2>
            <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
              Para se tornar um ponto autorizado da rede ou saber mais sobre o modelo de parceria.
            </p>
            <a href="mailto:parcerias@fotosegundo.com.br" className="text-sm font-bold text-theme-text hover:text-brand-tactical transition-colors flex items-center gap-2 mb-6">
              <MessageSquare size={16} className="text-brand-tactical" /> parcerias@fotosegundo.com.br
            </a>
            <div className="pt-6 border-t border-theme-border">
              <Link to="/parcerias" className="text-xs font-black uppercase tracking-widest text-brand-tactical hover:brightness-110 flex items-center gap-2">
                Conhecer o programa <ArrowLeft size={12} className="rotate-180" />
              </Link>
            </div>
          </div>

          {/* Profissionais */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors">
            <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
              <Camera size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Profissionais da Rede</h2>
            <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
              Para credenciamento como fotógrafo, editor ou operador de ponto fixo.
            </p>
            <a href="mailto:profissionais@fotosegundo.com.br" className="text-sm font-bold text-theme-text hover:text-brand-tactical transition-colors flex items-center gap-2 mb-3">
              <MessageSquare size={16} className="text-brand-tactical" /> profissionais@fotosegundo.com.br
            </a>
            <p className="text-xs text-theme-text-muted font-light">Assunto sugerido: <strong className="text-theme-text">"Quero ser profissional da rede"</strong> (Não esqueça o portfólio!)</p>
          </div>

          {/* Imprensa */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors">
            <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
              <Megaphone size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Imprensa</h2>
            <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
              Para solicitações de entrevista, press kit ou informações institucionais.
            </p>
            <a href="mailto:imprensa@fotosegundo.com.br" className="text-sm font-bold text-theme-text hover:text-brand-tactical transition-colors flex items-center gap-2">
              <MessageSquare size={16} className="text-brand-tactical" /> imprensa@fotosegundo.com.br
            </a>
          </div>

          {/* LGPD */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors">
            <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Privacidade e LGPD</h2>
            <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
              Para exercer seus direitos como titular de dados ou reportar questões de privacidade.
            </p>
            <a href="mailto:privacidade@fotosegundo.com.br" className="text-sm font-bold text-theme-text hover:text-brand-tactical transition-colors flex items-center gap-2 mb-6">
              <MessageSquare size={16} className="text-brand-tactical" /> privacidade@fotosegundo.com.br
            </a>
            <div className="pt-6 border-t border-theme-border">
              <Link to="/privacidade" className="text-xs font-black uppercase tracking-widest text-brand-tactical hover:brightness-110 flex items-center gap-2">
                Ler Política de Privacidade <ArrowLeft size={12} className="rotate-180" />
              </Link>
            </div>
          </div>

          {/* Status */}
          <div className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-3xl hover:border-brand-tactical/50 transition-colors flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
                <Activity size={24} />
              </div>
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-3">Status da Plataforma</h2>
              <p className="text-theme-text-muted text-sm font-light leading-relaxed mb-6">
                Para verificar se há instabilidades em andamento nos serviços ou uploads.
              </p>
            </div>
            <div className="pt-6 border-t border-theme-border">
              <Link to="/status" className="text-xs font-black uppercase tracking-widest text-brand-tactical hover:brightness-110 flex items-center gap-2">
                Acessar Painel de Status <ArrowLeft size={12} className="rotate-180" />
              </Link>
            </div>
          </div>
        </div>

        {/* Sede */}
        <div className="mt-16 text-center border-t border-theme-border pt-16">
          <MapPin size={32} className="text-brand-tactical mx-auto mb-6" />
          <h2 className="text-2xl font-black uppercase italic tracking-tight mb-2">Sede</h2>
          <p className="text-theme-text font-medium text-lg uppercase tracking-widest mb-1">Foto Segundo</p>
          <p className="text-theme-text-muted font-light mb-4">Sumaré, São Paulo — Brasil</p>
          <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest">CNPJ: (a preencher)</p>
        </div>
      </main>

      <footer className="py-4 md:py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-black italic uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowLeft, Camera, Edit3, Video, Briefcase, CheckCircle2, DollarSign, Target, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/Navbar";
import SEO from "../components/SEO";

export function BusinessLanding() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text selection:bg-brand-tactical/30">
      <SEO title="Negócios | Foto Segundo" description="Faça parte da maior rede de audiovisual do Brasil como fotógrafo ou videomaker." />
      <Navbar />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-5xl mx-auto">
        <div className="mb-16 md:mb-24 text-center max-w-4xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em]">Rede Profissional</span>
            <div className="h-px w-12 bg-brand-tactical" />
          </div>
          <h1 className="text-3xl md:text-5xl md:text-7xl font-heading font-bold text-theme-text uppercase mb-6 leading-none">
            A maior rede de <br /><span className="text-brand-tactical">Audiovisual</span> do Brasil
          </h1>
          <p className="text-theme-text-muted font-normal text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
            A Foto Segundo está construindo a infraestrutura que o mercado de fotografia e audiovisual sempre precisou — e você pode fazer parte disso.
          </p>
        </div>

        {/* Intro */}
        <section className="mb-20">
          <div className="bg-brand-tactical/10 border border-brand-tactical/20 p-4 md:p-8 md:p-12 rounded-3xl text-center">
            <Camera className="text-brand-tactical mx-auto mb-6" size={48} />
            <p className="text-lg md:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
              Se você é fotógrafo, videomaker, editor, drone operator ou qualquer profissional do universo audiovisual, a plataforma é a sua central de negócios: <strong className="text-brand-tactical font-bold">mais clientes, menos burocracia, pagamento garantido.</strong>
            </p>
          </div>
        </section>

        {/* Problema vs Solução */}
        <section className="mb-24">
          <div className="grid lg:grid-cols-2 gap-4 md:gap-8">
            {/* Problema */}
            <div className="border border-red-500/30 bg-red-500/5 p-4 md:p-8 md:p-10 rounded-3xl">
              <h2 className="text-xl font-bold text-red-500 uppercase mb-6">
                O problema que resolvemos
              </h2>
              <ul className="space-y-4">
                {[
                  "Depender do Instagram para conseguir clientes é instável e trabalhoso",
                  "Negociar preço no WhatsApp consome tempo e desvaloriza seu trabalho",
                  "Receber após o evento gera insegurança financeira",
                  "Gerenciar agenda, contratos e entregas em ferramentas separadas é caótico"
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-theme-text-muted font-normal text-sm md:text-base leading-relaxed">
                    <span className="text-red-500 mt-1">✗</span> {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Solução */}
            <div className="border border-brand-tactical/30 bg-brand-tactical/10 p-4 md:p-8 md:p-10 rounded-3xl">
              <h2 className="text-xl font-bold text-brand-tactical uppercase mb-6 flex items-center gap-2">
                <ShieldCheck size={24} /> O que oferecemos
              </h2>
              <ul className="space-y-4">
                {[
                  { t: "Leads qualificados", d: "entregues direto no seu painel — clientes que já querem contratar" },
                  { t: "Agenda integrada", d: "com bloqueio automático de horários para evitar overbooking" },
                  { t: "Pagamento garantido", d: "o cliente paga antes do evento, você recebe após a entrega" },
                  { t: "Wallet própria", d: "acompanhe seus ganhos em tempo real dentro da plataforma" },
                  { t: "Zero taxa de adesão", d: "você só ganha quando vende" }
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-theme-text-muted font-normal text-sm md:text-base leading-relaxed">
                    <CheckCircle2 size={18} className="text-brand-tactical shrink-0 mt-0.5" />
                    <span><strong className="text-theme-text">{item.t}</strong> — {item.d}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Modalidades */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold uppercase mb-12 text-center">
            Modalidades de <span className="text-brand-tactical">Atuação</span>
          </h2>
          <div className="grid md:grid-cols-3 gap-3 md:gap-6">
            {[
              { i: <Camera size={28} />, t: "Fotógrafo / Captador", d: "Atende eventos agendados (casamentos, corporativos) e Flash Events. Recebe jobs do sistema e entrega via painel." },
              { i: <Edit3 size={28} />, t: "Editor", d: "Recebe material bruto de captações da rede e realiza a edição dentro dos padrões editoriais. Remunerado por job." },
              { i: <Video size={28} />, t: "Ponto Fixo (Flash Event)", d: "Atua em locais de alto fluxo (praias, pontos turísticos) criando eventos instantâneos e vendendo fotos avulsas na hora." }
            ].map((m, idx) => (
              <div key={idx} className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-2xl hover:border-brand-tactical/50 transition-colors">
                <div className="w-14 h-14 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
                  {m.i}
                </div>
                <h3 className="text-lg font-bold uppercase tracking-widest mb-3">{m.t}</h3>
                <p className="text-theme-text-muted text-sm font-normal leading-relaxed">{m.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Como funciona o credenciamento e Remuneração */}
        <section className="mb-24 grid lg:grid-cols-2 gap-3 md:gap-6 md:gap-12">
          <div>
            <h2 className="text-2xl font-bold uppercase mb-8">
              Como funciona o <span className="text-brand-tactical">Credenciamento</span>
            </h2>
            <div className="space-y-6">
              {[
                { n: "1", t: "Interesse", d: "Preencha o formulário com seus dados e portfólio" },
                { n: "2", t: "Avaliação", d: "Nossa equipe analisa seu perfil em até 5 dias úteis" },
                { n: "3", t: "Onboarding", d: "Acesso ao painel profissional e treinamento da plataforma" },
                { n: "4", t: "Primeiro job", d: "Você começa a receber leads e oportunidades da rede" }
              ].map((step, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-brand-tactical/20 border border-brand-tactical text-brand-tactical flex items-center justify-center font-bold text-sm shrink-0">
                    {step.n}
                  </div>
                  <div>
                    <h3 className="font-bold text-theme-text text-sm uppercase tracking-widest">{step.t}</h3>
                    <p className="text-theme-text-muted text-sm font-normal mt-1">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-brand-tactical text-theme-text rounded-3xl p-4 md:p-8 md:p-10 relative overflow-hidden">
            <DollarSign className="absolute -right-8 -top-8 text-theme-text/5" size={200} />
            <div className="relative z-10">
              <h2 className="text-2xl font-bold uppercase mb-6">
                Remuneração
              </h2>
              <p className="font-medium text-sm md:text-base leading-relaxed mb-4">
                Calculada automaticamente pelo sistema de <strong className="font-bold">Split Dinâmico</strong> a cada pedido aprovado. 
              </p>
              <p className="font-medium text-sm md:text-base leading-relaxed mb-6">
                Os valores são definidos no momento do credenciamento e ficam travados por pedido — alterações futuras de tabela não afetam jobs já realizados.
              </p>
              <div className="bg-black/10 p-4 rounded-xl font-bold uppercase tracking-widest text-xs flex items-center gap-3">
                <Briefcase size={16} /> Acompanhe em tempo real na sua Wallet
              </div>
            </div>
          </div>
        </section>

        {/* Requisitos */}
        <section className="mb-24 border-t border-theme-border pt-16">
          <h2 className="text-2xl font-bold uppercase mb-8 text-center">
            Requisitos <span className="text-brand-tactical">Mínimos</span>
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {[
              "Equipamento profissional compatível",
              "Experiência comprovada (portfólio)",
              "Disponibilidade de prazos",
              "Conta bancária para repasses"
            ].map((req, idx) => (
              <div key={idx} className="bg-theme-bg-muted border border-theme-border p-5 rounded-xl text-center">
                <Target className="text-brand-tactical mx-auto mb-3" size={20} />
                <p className="text-sm text-theme-text-muted font-normal">{req}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase mb-6">
            Quero fazer <span className="text-brand-tactical">Parte</span>
          </h2>
          <p className="text-theme-text-muted font-normal mb-10 max-w-lg mx-auto">
            Entre em contato com nossa equipe com o assunto <strong className="text-theme-text">&quot;Quero ser profissional da rede&quot;</strong> e não se esqueça de incluir o link do seu portfólio.
          </p>
          <Link to="/contato" className="inline-block px-3 md:px-6 md:px-12 py-5 bg-brand-tactical text-theme-text font-bold uppercase tracking-[0.3em] text-[10px] hover:brightness-110 transition-all shadow-2xl shadow-brand-tactical/20">
            Acessar Contato
          </Link>
        </section>
      </main>

      <footer className="py-4 md:py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-bold uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

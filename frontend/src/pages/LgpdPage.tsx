import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Scale, FileText, CheckSquare, Mail } from "lucide-react";
import SEO from "../components/SEO";

export function LgpdPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text selection:bg-brand-tactical/30">
      <SEO title="Portal LGPD | Foto Segundo" description="Portal de Transparência e conformidade com a Lei Geral de Proteção de Dados (LGPD) da Foto Segundo." />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em]">Transparência Legal</span>
          </div>
          <h1 className="text-2xl md:text-4xl md:text-5xl font-heading font-bold text-theme-text uppercase mb-4">
            Portal <span className="text-brand-tactical">LGPD</span>
          </h1>
          <p className="text-theme-text-muted font-medium text-sm">
            Conformidade com a Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais
          </p>
          <div className="mt-8 p-3 md:p-6 bg-brand-tactical/10 border border-brand-tactical/20 rounded-2xl flex items-start gap-4">
            <Scale className="text-brand-tactical shrink-0 mt-1" size={24} />
            <p className="text-sm md:text-base text-theme-text font-normal leading-relaxed">
              A Foto Segundo preza pela privacidade e segurança dos seus dados. Este portal foi criado para dar transparência ao uso de dados na nossa plataforma e facilitar o exercício dos seus direitos previstos na lei brasileira.
            </p>
          </div>
        </div>

        <div className="space-y-16">
          {/* Princípios LGPD */}
          <section>
            <h2 className="text-xl font-bold uppercase mb-8 flex items-center gap-3">
              <span className="text-brand-tactical">1.</span> Nossos Princípios (Art. 6º)
            </h2>
            <div className="grid md:grid-cols-2 gap-3 md:gap-6">
              {[
                { title: "Finalidade", desc: "Apenas processamos dados para fins legítimos, específicos e informados." },
                { title: "Necessidade", desc: "Coletamos o mínimo necessário para a realização da prestação de serviço fotográfico." },
                { title: "Livre Acesso", desc: "Você tem o direito de consultar seus dados de forma gratuita." },
                { title: "Segurança", desc: "Utilizamos medidas técnicas rígidas contra acessos não autorizados." },
              ].map((p, idx) => (
                <div key={idx} className="border border-theme-border p-3 md:p-6 rounded-xl hover:border-brand-tactical/30 transition-colors">
                  <h3 className="text-sm font-bold text-theme-text uppercase tracking-widest mb-2 flex items-center gap-2">
                    <CheckSquare size={16} className="text-brand-tactical" /> {p.title}
                  </h3>
                  <p className="text-sm text-theme-text-muted font-normal leading-relaxed">{p.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Exercício de Direitos */}
          <section>
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">2.</span> Exerça Seus Direitos (Art. 18)
            </h2>
            <div className="bg-theme-bg-muted border border-theme-border p-3 md:p-6 rounded-xl space-y-6">
              <p className="text-theme-text text-sm font-normal leading-relaxed">
                A LGPD garante a você diversos direitos. Na Foto Segundo, facilitamos esse processo através do painel &quot;Minha Conta&quot; ou via requisição direta ao nosso Encarregado de Dados (DPO).
              </p>
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-theme-bg p-4 rounded-lg border border-theme-border">
                  <p className="font-bold text-theme-text text-sm mb-1">Direito de Confirmação e Acesso</p>
                  <p className="text-xs text-theme-text-muted">Acesso instantâneo a todos os seus dados no seu painel.</p>
                </div>
                <div className="bg-theme-bg p-4 rounded-lg border border-theme-border">
                  <p className="font-bold text-theme-text text-sm mb-1">Direito de Correção</p>
                  <p className="text-xs text-theme-text-muted">Edição direta do seu perfil a qualquer momento.</p>
                </div>
                <div className="bg-theme-bg p-4 rounded-lg border border-theme-border">
                  <p className="font-bold text-theme-text text-sm mb-1">Direito à Eliminação</p>
                  <p className="text-xs text-theme-text-muted">Opção de deletar sua conta de forma permanente (sujeito à retenção legal do Art. 16).</p>
                </div>
                <div className="bg-theme-bg p-4 rounded-lg border border-theme-border">
                  <p className="font-bold text-theme-text text-sm mb-1">Direito de Revogação de Consentimento</p>
                  <p className="text-xs text-theme-text-muted">Ajuste de preferências de comunicação e termos de aceite.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Canal de Comunicação */}
          <section>
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">3.</span> Encarregado de Dados (DPO)
            </h2>
            <div className="border border-brand-tactical/30 bg-brand-tactical/10 p-4 md:p-8 rounded-xl flex flex-col sm:flex-row items-center gap-4 md:gap-8">
              <div className="w-16 h-16 rounded-full bg-brand-tactical/10 flex items-center justify-center text-brand-tactical shrink-0 border border-brand-tactical/20">
                <ShieldCheck size={32} />
              </div>
              <div>
                <p className="text-theme-text-muted text-sm font-normal mb-4">
                  Se você tiver dúvidas sobre o processamento dos seus dados ou quiser exercer direitos que não estejam disponíveis de forma automatizada no painel, entre em contato direto com o nosso Encarregado de Proteção de Dados.
                </p>
                <a href="mailto:dpo@fotosegundo.com.br" className="inline-flex items-center gap-2 bg-theme-bg border border-brand-tactical/40 px-3 md:px-6 py-3 text-[10px] font-bold text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all rounded-lg">
                  <Mail size={14} /> Falar com o DPO
                </a>
              </div>
            </div>
          </section>

          {/* Links e Documentos Complementares */}
          <section>
            <h2 className="text-xl font-bold uppercase mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">4.</span> Documentos Complementares
            </h2>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link to="/privacidade" className="flex-1 flex items-center gap-4 bg-theme-bg-muted border border-theme-border p-4 rounded-xl hover:border-brand-tactical/50 transition-all group">
                <FileText className="text-theme-text-muted group-hover:text-brand-tactical transition-colors" size={24} />
                <div>
                  <p className="font-bold text-theme-text text-sm">Política de Privacidade Completa</p>
                  <p className="text-xs text-theme-text-muted">Detalhes sobre cookies e retenção de dados.</p>
                </div>
              </Link>
              <Link to="/termos" className="flex-1 flex items-center gap-4 bg-theme-bg-muted border border-theme-border p-4 rounded-xl hover:border-brand-tactical/50 transition-all group">
                <FileText className="text-theme-text-muted group-hover:text-brand-tactical transition-colors" size={24} />
                <div>
                  <p className="font-bold text-theme-text text-sm">Termos de Uso</p>
                  <p className="text-xs text-theme-text-muted">Regras de uso da plataforma Foto Segundo.</p>
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>

      <footer className="py-4 md:py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-bold uppercase tracking-[0.3em]">Conformidade Legal & Segurança</p>
      </footer>
    </div>
  );
}

import { Link } from "react-router-dom";
import { ArrowLeft, FileText, Check, X, ShieldAlert } from "lucide-react";
import SEO from "../components/SEO";

export function TermsPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Termos de Uso | Foto Segundo" description="Termos de Uso da plataforma Foto Segundo." />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black tracking-widest uppercase italic">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Segurança Legal</span>
          </div>
          <h1 className="text-2xl md:text-4xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter mb-4 italic">
            Termos de <span className="text-brand-tactical">Uso</span>
          </h1>
          <p className="text-theme-text-muted font-medium text-sm">
            Última atualização: maio de 2026
          </p>
          <div className="mt-8 p-3 md:p-6 bg-theme-bg-muted border border-theme-border rounded-2xl flex items-start gap-4">
            <FileText className="text-brand-tactical shrink-0 mt-1" size={24} />
            <p className="text-sm md:text-base text-theme-text font-light leading-relaxed">
              Ao acessar ou utilizar a plataforma Foto Segundo ("Plataforma"), você concorda com estes Termos de Uso. Se não concordar com qualquer parte, não utilize a Plataforma.
            </p>
          </div>
        </div>

        <div className="space-y-12">
          {/* Seção 2 */}
          <section className="scroll-mt-24" id="descrição-do-serviço">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">2.</span> Descrição do Serviço
            </h2>
            <p className="text-theme-text-muted text-sm md:text-base font-light leading-relaxed mb-6">
              A Foto Segundo é uma plataforma digital que conecta clientes a profissionais de audiovisual e oferece ferramentas para criação de álbuns colaborativos, contratação de serviços fotográficos e entrega de mídias digitais e físicas.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-theme-bg-muted border border-theme-border p-5 rounded-xl">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-xs mb-2">Contratação Profissional</h3>
                <p className="text-theme-text-muted text-sm font-light leading-relaxed">Agendamento de cobertura fotográfica com profissionais da rede</p>
              </div>
              <div className="bg-theme-bg-muted border border-theme-border p-5 rounded-xl">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-xs mb-2">Álbuns Colaborativos</h3>
                <p className="text-theme-text-muted text-sm font-light leading-relaxed">Criação de cofres privados (Vaults) para upload e votação colaborativa de fotos entre convidados</p>
              </div>
              <div className="bg-theme-bg-muted border border-theme-border p-5 rounded-xl">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-xs mb-2">Assinatura Premium</h3>
                <p className="text-theme-text-muted text-sm font-light leading-relaxed">Plano mensal de impressão e entrega das fotos mais votadas</p>
              </div>
            </div>
          </section>

          {/* Seção 3 e 5 em Grid */}
          <div className="grid md:grid-cols-2 gap-4 md:gap-8">
            <section className="bg-theme-bg-muted p-3 md:p-6 rounded-2xl border border-theme-border">
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">3.</span> Cadastro e Conta
              </h2>
              <ul className="space-y-4 text-theme-text-muted text-sm font-light">
                <li className="flex gap-3"><span className="text-brand-tactical font-black">3.1</span> Para utilizar a Plataforma, é necessário criar uma conta com informações verdadeiras e atualizadas.</li>
                <li className="flex gap-3"><span className="text-brand-tactical font-black">3.2</span> Você é responsável pela confidencialidade da sua senha e por todas as atividades realizadas em sua conta.</li>
                <li className="flex gap-3"><span className="text-brand-tactical font-black">3.3</span> A Foto Segundo reserva-se o direito de suspender ou encerrar contas que violem estes Termos.</li>
              </ul>
            </section>

            <section className="bg-theme-bg-muted p-3 md:p-6 rounded-2xl border border-theme-border">
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">5.</span> Pagamentos e Reembolsos
              </h2>
              <ul className="space-y-4 text-theme-text-muted text-sm font-light">
                <li className="flex gap-3"><span className="text-brand-tactical font-black">5.1</span> Os pagamentos são processados via Mercado Pago, com suporte a PIX e cartão de crédito.</li>
                <li className="flex gap-3"><span className="text-brand-tactical font-black">5.2</span> O agendamento de eventos exige pagamento de 50% no ato da reserva e 50% até 56 horas antes do evento.</li>
                <li className="flex gap-3"><span className="text-brand-tactical font-black">5.3</span> Cancelamentos &gt;72 horas: reembolso integral. Cancelamentos {'<'}72 horas: retenção do sinal de 50%.</li>
                <li className="flex gap-3"><span className="text-brand-tactical font-black">5.4</span> Assinaturas podem ser canceladas a qualquer momento.</li>
              </ul>
            </section>
          </div>

          {/* Seção 4 */}
          <section className="scroll-mt-24">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">4.</span> Uso Aceitável
            </h2>
            <div className="grid md:grid-cols-2 gap-3 md:gap-6">
              <div className="border border-brand-tactical/30 bg-brand-tactical/10 p-3 md:p-6 rounded-xl">
                <h3 className="text-sm font-black text-brand-tactical uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Check size={18} /> É permitido
                </h3>
                <ul className="space-y-3">
                  {[
                    "Criar álbuns para eventos pessoais e profissionais",
                    "Convidar pessoas para contribuir com fotos em seus álbuns",
                    "Contratar profissionais cadastrados na rede",
                    "Compartilhar links de álbuns com seus convidados"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-theme-text-muted font-light">
                      <span className="text-brand-tactical mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="border border-red-500/30 bg-red-500/5 p-3 md:p-6 rounded-xl">
                <h3 className="text-sm font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <X size={18} /> É proibido
                </h3>
                <ul className="space-y-3">
                  {[
                    "Fazer upload de conteúdo que viole direitos de terceiros",
                    "Utilizar a Plataforma para fins ilegais ou fraudulentos",
                    "Tentar acessar conteúdo de outros usuários sem autorização",
                    "Simular aprovações de pagamento ou manipular o sistema de pedidos",
                    "Fazer upload de conteúdo com nudez, violência ou infrações legais"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-theme-text-muted font-light">
                      <span className="text-red-500 mt-0.5">•</span> {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 6 e 7 */}
          <section className="space-y-12">
            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
                <span className="text-brand-tactical">6.</span> Propriedade Intelectual
              </h2>
              <div className="space-y-4 text-theme-text-muted text-sm md:text-base font-light leading-relaxed">
                <p><strong className="text-theme-text font-medium">6.1</strong> As fotos enviadas pelos usuários permanecem de propriedade dos seus autores originais.</p>
                <p><strong className="text-theme-text font-medium">6.2</strong> Ao fazer upload na Plataforma, o usuário concede à Foto Segundo licença limitada e não exclusiva para armazenar, exibir e processar o conteúdo exclusivamente para operação do serviço contratado.</p>
                <p><strong className="text-theme-text font-medium">6.3</strong> A Foto Segundo não utilizará fotos de usuários para fins publicitários sem consentimento expresso.</p>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
                <span className="text-brand-tactical">7.</span> Responsabilidades dos Profissionais
              </h2>
              <div className="space-y-4 text-theme-text-muted text-sm md:text-base font-light leading-relaxed">
                <p><strong className="text-theme-text font-medium">7.1</strong> Os profissionais cadastrados na rede são prestadores de serviço independentes, não empregados da Foto Segundo.</p>
                <p><strong className="text-theme-text font-medium">7.2</strong> A Foto Segundo atua como intermediária e não se responsabiliza por falhas operacionais de profissionais autônomos, desde que tenha tomado as medidas razoáveis de verificação.</p>
                <p><strong className="text-theme-text font-medium">7.3</strong> Em caso de não entrega do serviço contratado por parte do profissional, a Foto Segundo adotará as medidas cabíveis de mediação e reembolso.</p>
              </div>
            </div>
          </section>

          {/* Seção 8, 9 e 10 */}
          <div className="grid md:grid-cols-3 gap-3 md:gap-6 pt-8 border-t border-theme-border">
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-tactical" /> 8. Limitações
              </h2>
              <p className="text-xs text-theme-text-muted font-light leading-relaxed">
                Não nos responsabilizamos por interrupções temporárias de servidor, perda de dados causada por serviços terceiros ou danos indiretos pelo uso da Plataforma.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-tactical" /> 9. Modificações
              </h2>
              <p className="text-xs text-theme-text-muted font-light leading-relaxed">
                A Foto Segundo pode atualizar estes Termos. Notificaremos usuários por e-mail ou in-app com antecedência mínima de 15 dias para alterações relevantes.
              </p>
            </div>
            <div className="space-y-4">
              <h2 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <ShieldAlert size={16} className="text-brand-tactical" /> 10. Foro e Lei
              </h2>
              <p className="text-xs text-theme-text-muted font-light leading-relaxed">
                Estes Termos são regidos pela legislação brasileira. Fica eleito o foro da comarca de Sumaré/SP para dirimir quaisquer controvérsias.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 md:py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-black italic uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

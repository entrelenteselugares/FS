import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Shield, Lock, Eye, CheckCircle2 } from "lucide-react";
import { Navbar } from "../components/Navbar";
import SEO from "../components/SEO";

export function PrivacyPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Política de Privacidade | Foto Segundo" description="Política de Privacidade e Proteção de Dados da plataforma Foto Segundo (LGPD)." />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border/40 z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black tracking-widest uppercase italic">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-6 md:px-8 max-w-4xl mx-auto">
        <div className="mb-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Segurança Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter mb-4 italic">
            Política de <span className="text-brand-tactical">Privacidade</span>
          </h1>
          <p className="text-theme-text-muted font-medium text-sm">
            Última atualização: maio de 2026
          </p>
          <div className="mt-8 p-6 bg-brand-tactical/5 border border-brand-tactical/20 rounded-2xl flex items-start gap-4">
            <Shield className="text-brand-tactical shrink-0 mt-1" size={24} />
            <p className="text-sm md:text-base text-theme-text font-light leading-relaxed">
              Esta Política descreve como a Foto Segundo coleta, utiliza, armazena e protege seus dados pessoais, em total conformidade com a <strong className="text-brand-tactical font-black">Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018)</strong>.
            </p>
          </div>
        </div>

        <div className="space-y-16">
          {/* Seção 1 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">1.</span> Controlador dos Dados
            </h2>
            <div className="bg-theme-bg-muted border border-theme-border/60 p-6 rounded-xl space-y-2">
              <p className="font-bold text-theme-text uppercase tracking-wider text-sm">Foto Segundo</p>
              <p className="text-theme-text-muted text-sm">Sumaré, São Paulo — Brasil</p>
              <p className="text-sm mt-4">
                <span className="text-theme-text-muted">Contato DPO: </span>
                <a href="mailto:privacidade@fotosegundo.com.br" className="text-brand-tactical hover:underline font-medium">privacidade@fotosegundo.com.br</a>
              </p>
            </div>
          </section>

          {/* Seção 2 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-8 flex items-center gap-3">
              <span className="text-brand-tactical">2.</span> Dados que Coletamos
            </h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div className="border border-theme-border/40 p-6 rounded-xl hover:border-brand-tactical/30 transition-colors">
                <h3 className="text-sm font-black text-brand-tactical uppercase tracking-widest mb-4 flex items-center gap-2">
                  <User size={16} /> Fornecidos por você
                </h3>
                <ul className="space-y-3">
                  {["Nome completo e e-mail (cadastro)", "Telefone (para notificações e contato)", "Dados de pagamento (processados pelo Mercado Pago — não armazenamos dados de cartão)", "Fotos e vídeos enviados para álbuns e eventos", "Informações de eventos (data, local, número de convidados)"].map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-theme-text-muted">
                      <CheckCircle2 size={16} className="text-brand-tactical/50 shrink-0 mt-0.5" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border border-theme-border/40 p-6 rounded-xl hover:border-brand-tactical/30 transition-colors">
                <h3 className="text-sm font-black text-brand-tactical uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Eye size={16} /> Coletados automaticamente
                </h3>
                <ul className="space-y-3">
                  {["Endereço IP e dados de navegação", "Tipo de dispositivo e sistema operacional", "Páginas acessadas e tempo de sessão", "Tokens de autenticação (JWT) armazenados localmente no dispositivo"].map((i, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-theme-text-muted">
                      <CheckCircle2 size={16} className="text-brand-tactical/50 shrink-0 mt-0.5" />
                      <span>{i}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>

          {/* Seção 3 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">3.</span> Como Usamos seus Dados
            </h2>
            <div className="overflow-x-auto rounded-xl border border-theme-border/60">
              <table className="w-full text-left text-sm">
                <thead className="bg-theme-bg-muted text-xs uppercase tracking-wider text-theme-text">
                  <tr>
                    <th className="p-4 font-black">Finalidade</th>
                    <th className="p-4 font-black">Base Legal (LGPD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border/40 text-theme-text-muted">
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Criar e gerenciar sua conta</td><td className="p-4">Execução de contrato (Art. 7º, V)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Processar pagamentos e pedidos</td><td className="p-4">Execução de contrato (Art. 7º, V)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Enviar notificações sobre seu evento</td><td className="p-4">Execução de contrato (Art. 7º, V)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Calcular e distribuir splits financeiros</td><td className="p-4">Execução de contrato (Art. 7º, V)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Melhorar a Plataforma e corrigir erros</td><td className="p-4">Legítimo interesse (Art. 7º, IX)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Enviar comunicações de marketing</td><td className="p-4">Consentimento (Art. 7º, I)</td></tr>
                  <tr className="hover:bg-theme-bg-muted/30"><td className="p-4">Cumprir obrigações legais</td><td className="p-4">Cumprimento de obrigação legal (Art. 7º, II)</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Seção 4 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">4.</span> Armazenamento e Retenção
            </h2>
            <div className="space-y-4 text-theme-text-muted text-sm md:text-base font-light leading-relaxed">
              <p><strong className="text-theme-text">4.1</strong> Seus dados são armazenados em servidores seguros com acesso restrito.</p>
              <p><strong className="text-theme-text">4.2</strong> Fotos e mídias de eventos são armazenadas em serviços de nuvem (Adobe Lightroom e Google Drive) e na infraestrutura da Plataforma, com acesso controlado por sistema de Paywall.</p>
              <p><strong className="text-theme-text">4.3</strong> Dados de pedidos e transações financeiras são retidos por <strong className="text-brand-tactical">5 anos</strong> para fins contábeis e fiscais, mesmo após encerramento da conta.</p>
              <p><strong className="text-theme-text">4.4</strong> Fotos de álbuns colaborativos são retidas enquanto o álbum estiver ativo. Após exclusão do álbum pelo proprietário, as mídias são removidas em até 30 dias.</p>
            </div>
          </section>

          {/* Seção 5 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">5.</span> Compartilhamento de Dados
            </h2>
            <p className="text-theme-text-muted text-sm md:text-base font-light mb-4">
              Seus dados <strong className="text-brand-tactical">não são vendidos</strong> a terceiros. Compartilhamos apenas com:
            </p>
            <ul className="grid md:grid-cols-2 gap-4">
              <li className="bg-theme-bg-muted p-4 rounded-xl border border-theme-border/40 text-sm">
                <strong className="text-theme-text block mb-1">Mercado Pago</strong> processamento de pagamentos
              </li>
              <li className="bg-theme-bg-muted p-4 rounded-xl border border-theme-border/40 text-sm">
                <strong className="text-theme-text block mb-1">Profissionais da rede</strong> dados necessários para execução do serviço (nome, contato, localização)
              </li>
              <li className="bg-theme-bg-muted p-4 rounded-xl border border-theme-border/40 text-sm">
                <strong className="text-theme-text block mb-1">Parceiros (Cartórios)</strong> quando a contratação ocorre via unidade parceira
              </li>
              <li className="bg-theme-bg-muted p-4 rounded-xl border border-theme-border/40 text-sm">
                <strong className="text-theme-text block mb-1">Autoridades legais</strong> quando exigido por lei ou ordem judicial
              </li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section>
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-6 flex items-center gap-3">
              <span className="text-brand-tactical">6.</span> Seus Direitos (LGPD)
            </h2>
            <p className="text-theme-text-muted text-sm md:text-base font-light mb-6">Como titular dos dados, você tem direito a:</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
              {[
                { t: "Acesso", d: "saber quais dados temos sobre você" },
                { t: "Correção", d: "atualizar dados incorretos ou desatualizados" },
                { t: "Eliminação", d: "solicitar a exclusão dos seus dados" },
                { t: "Portabilidade", d: "receber seus dados em formato estruturado" },
                { t: "Revogação", d: "cancelar autorizações a qualquer momento" },
                { t: "Oposição", d: "contestar tratamento baseado em legítimo interesse" }
              ].map((r, i) => (
                <div key={i} className="border-l-2 border-brand-tactical pl-4 py-1">
                  <p className="font-bold text-theme-text text-sm">{r.t}</p>
                  <p className="text-xs text-theme-text-muted mt-1">{r.d}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-theme-text bg-brand-tactical/5 p-4 rounded-lg border border-brand-tactical/20">
              Para exercer seus direitos, acesse <strong className="font-black">Meus Dados</strong> no painel ou entre em contato pelo e-mail de privacidade.
            </p>
          </section>

          {/* Seções 7, 8, 9, 10 */}
          <div className="grid md:grid-cols-2 gap-12">
            <section>
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">7.</span> Cookies
              </h2>
              <p className="text-theme-text-muted text-sm font-light leading-relaxed">
                Utilizamos <strong>localStorage</strong> e <strong>Tokens JWT</strong> para manter sua sessão ativa com segurança. Não utilizamos cookies de rastreamento publicitário de terceiros.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">8.</span> Segurança
              </h2>
              <ul className="text-theme-text-muted text-sm font-light space-y-2">
                <li>• Autenticação JWT com expiração</li>
                <li>• Validação HMAC-SHA256 em webhooks</li>
                <li>• Controle de acesso por roles (RBAC)</li>
                <li>• HTTPS em todas as comunicações</li>
                <li>• Soft delete em entidades vitais</li>
              </ul>
            </section>
            <section>
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">9.</span> Menores de Idade
              </h2>
              <p className="text-theme-text-muted text-sm font-light leading-relaxed">
                Não destinada a menores de 18 anos sem consentimento. Dados identificados como de menores sem autorização são excluídos imediatamente.
              </p>
            </section>
            <section>
              <h2 className="text-lg font-black uppercase italic tracking-tight mb-4 flex items-center gap-2">
                <span className="text-brand-tactical">10.</span> Alterações
              </h2>
              <p className="text-theme-text-muted text-sm font-light leading-relaxed">
                Notificaremos alterações relevantes via e-mail ou notificação in-app com antecedência mínima de 15 dias.
              </p>
            </section>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center border-t border-theme-border/40">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-black italic uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

// User is not exported from lucide-react in this exact import context? We'll define a dummy or use a different icon if it fails, but User is standard. Let's make sure it doesn't fail.
function User(props: any) {
  return <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}

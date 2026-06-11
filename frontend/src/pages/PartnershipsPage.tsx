import { Link } from "react-router-dom";
import { ArrowLeft, Handshake, Store, QrCode, Wallet, LayoutDashboard, BadgeCheck, Zap, Users } from "lucide-react";
import SEO from "../components/SEO";

export function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Parcerias e Afiliados | Foto Segundo" description="Seja um ponto autorizado da rede Foto Segundo e gere receita passiva." />
      
      {/* Header Minimalista */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-bold tracking-widest uppercase ">
          <ArrowLeft size={16} /> Voltar para o início
        </Link>
      </header>

      <main className="pt-32 pb-24 px-3 md:px-6 md:px-8 max-w-5xl mx-auto">
        <div className="mb-16 md:mb-24 text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-4 mb-6">
            <div className="h-px w-12 bg-brand-tactical" />
            <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.5em] ">B2B & Institucional</span>
            <div className="h-px w-12 bg-brand-tactical" />
          </div>
          <h1 className="text-3xl md:text-5xl md:text-7xl font-heading font-bold text-theme-text uppercase mb-6 leading-none">
            Seja um ponto <br /><span className="text-brand-tactical">Autorizado</span>
          </h1>
          <p className="text-theme-text-muted font-normal text-base md:text-lg leading-relaxed">
            A Foto Segundo opera com um modelo de parceria que transforma negócios locais em pontos de geração de receita passiva dentro do ecossistema de audiovisual mais moderno do Brasil.
          </p>
        </div>

        {/* Intro */}
        <section className="mb-20">
          <div className="bg-brand-tactical/10 border border-brand-tactical/20 p-4 md:p-8 md:p-12 rounded-3xl text-center">
            <Handshake className="text-brand-tactical mx-auto mb-6" size={48} />
            <p className="text-lg md:text-xl font-normal leading-relaxed max-w-3xl mx-auto">
              Se você tem um estabelecimento físico com fluxo de clientes que realizam ou planejam eventos — cartório, buffet, espaço de festas, floricultura, loja de noivas, academia, clube — você pode se tornar uma <strong className="text-brand-tactical font-bold">Unidade Fixa Autorizada</strong> da rede.
            </p>
          </div>
        </section>

        {/* Como Funciona */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold uppercase mb-12 text-center">
            Como funciona a <span className="text-brand-tactical">Parceria</span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
            {[
              { i: <Store size={24} />, t: "Cadastro e Credenciamento", d: "Você se cadastra e passa por um processo simples. Recebe acesso ao painel exclusivo de parceiros." },
              { i: <QrCode size={24} />, t: "Indicação Orgânica", d: "Quando um cliente fecha um evento via seu balcão ou QR Code físico, o sistema vincula a venda a você." },
              { i: <Wallet size={24} />, t: "Receita Passiva (Split)", d: "A cada venda, você recebe automaticamente sua comissão pelo Split Dinâmico, direto na sua Wallet." },
              { i: <LayoutDashboard size={24} />, t: "Painel Exclusivo", d: "Acompanhe em tempo real todos os leads gerados, eventos vinculados e seu extrato financeiro." }
            ].map((s, idx) => (
              <div key={idx} className="bg-theme-bg-muted border border-theme-border p-4 md:p-8 rounded-2xl relative overflow-hidden group hover:border-brand-tactical/50 transition-colors">
                <div className="text-[120px] font-bold absolute -right-6 -bottom-10 text-theme-border/20 group-hover:text-brand-tactical/5 transition-colors z-0 pointer-events-none">
                  {idx + 1}
                </div>
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-brand-tactical/10 text-brand-tactical rounded-xl flex items-center justify-center mb-6">
                    {s.i}
                  </div>
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-3">{s.t}</h3>
                  <p className="text-theme-text-muted text-sm font-normal leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Quem Pode Ser Parceiro */}
        <section className="mb-24">
          <h2 className="text-3xl font-bold uppercase mb-12 text-center">
            Quem pode ser <span className="text-brand-tactical">Parceiro</span>
          </h2>
          <div className="overflow-hidden rounded-2xl border border-theme-border">
            <table className="w-full text-left">
              <thead className="bg-theme-bg-muted text-xs uppercase tracking-widest">
                <tr>
                  <th className="p-5 font-bold text-theme-text border-b border-theme-border">Perfil de Negócio</th>
                  <th className="p-5 font-bold text-theme-text border-b border-theme-border hidden md:table-cell">Exemplo de Caso de Uso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-theme-border/40 bg-theme-bg-muted text-sm">
                {[
                  { p: "Cartórios e registros civis", e: "Casamentos e uniões estáveis" },
                  { p: "Buffets e espaços de eventos", e: "Festas, formaturas, confraternizações" },
                  { p: "Academias e clubes esportivos", e: "Corridas, campeonatos, eventos fitness" },
                  { p: "Lojas de noivas e cerimonialistas", e: "Planejamento de casamentos" },
                  { p: "Hotéis e pousadas", e: "Eventos corporativos e comemorações" },
                  { p: "Escolas e faculdades", e: "Formaturas e colações de grau" }
                ].map((row, idx) => (
                  <tr key={idx} className="hover:bg-theme-bg-muted transition-colors">
                    <td className="p-5 font-bold text-theme-text flex items-center gap-3">
                      <BadgeCheck size={16} className="text-brand-tactical" /> {row.p}
                    </td>
                    <td className="p-5 text-theme-text-muted hidden md:table-cell">{row.e}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Vantagens */}
        <section className="mb-24 bg-brand-tactical text-black rounded-3xl p-4 md:p-8 md:p-12">
          <h2 className="text-3xl font-bold uppercase mb-10">
            Vantagens da Rede
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-y-8 gap-x-12">
            {[
              { t: "Zero Investimento", d: "Não há taxa de adesão ou custo mensal para se tornar uma unidade física autorizada." },
              { t: "Receita Recorrente", d: "Ganhe em cada evento ou serviço fechado pela sua rede de indicação passiva." },
              { t: "Tabela Personalizada", d: "Sua unidade pode ter condições exclusivas e margens de preço definidas para seus clientes." },
              { t: "Suporte Dedicado", d: "Acesso direto à equipe matriz da Foto Segundo para dúvidas e operações táticas." },
              { t: "Material Físico", d: "Receba QR Codes, tótens de balcão e materiais de divulgação impressos para o seu espaço." }
            ].map((v, idx) => (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={18} className="text-black" strokeWidth={3} />
                  <h3 className="font-bold uppercase tracking-widest text-sm">{v.t}</h3>
                </div>
                <p className="text-black/70 text-sm font-medium leading-relaxed pl-7">{v.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Afiliados Digitais */}
        <section className="mb-24 border border-theme-border bg-theme-bg-muted p-4 md:p-8 md:p-12 rounded-3xl relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-5 pointer-events-none">
            <Users size={300} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-bold uppercase mb-4 flex items-center gap-3">
              <span className="text-brand-tactical">#</span> Programa de Afiliados Digital
            </h2>
            <p className="text-theme-text-muted font-normal leading-relaxed mb-6">
              Além das unidades físicas, a Foto Segundo possui um programa de afiliados digital com estrutura de dois níveis (L1 e L2). Se você é um criador de conteúdo, influenciador ou profissional do setor de eventos com audiência digital, pode gerar renda indicando a plataforma para sua rede.
            </p>
            <p className="text-theme-text font-bold text-sm bg-theme-bg p-4 rounded-xl border border-theme-border inline-flex items-center gap-3">
              Acesse <span className="text-brand-tactical">Indique e Ganhe</span> dentro da plataforma para gerar seu link exclusivo e acompanhar seus créditos.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase mb-6">
            Pronto para ser um <span className="text-brand-tactical">Parceiro?</span>
          </h2>
          <p className="text-theme-text-muted font-normal mb-10 max-w-lg mx-auto">
            Preencha o formulário de interesse e nossa equipe entrará em contato em até 2 dias úteis com o seu link de ativação.
          </p>
          <Link to="/contato" className="inline-block px-3 md:px-6 md:px-12 py-5 bg-brand-tactical text-black font-bold uppercase tracking-[0.3em] text-[10px] hover:brightness-110 transition-all shadow-2xl shadow-brand-tactical/20">
            Preencher Formulário de Interesse
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


import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export function AboutPage() {
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-theme-bg/80 backdrop-blur-lg border-b border-theme-border z-50 flex items-center px-4 md:px-8">
        <Link to="/" className="text-brand-tactical hover:brightness-110 transition-all flex items-center gap-2 text-xs font-black tracking-widest uppercase italic">
          <ArrowLeft size={16} /> Voltar
        </Link>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-20 px-6 md:px-12 max-w-3xl mx-auto">
        <div className="mb-16 text-center">
          <h1 className="text-4xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter mb-4 italic">
            Sobre a <span className="text-brand-tactical">Foto Segundo</span>
          </h1>
          <p className="text-brand-tactical font-black italic tracking-[0.2em] uppercase text-xs md:text-sm">
            Protocolo Editorial de Imagem e Cinema.<br />
            <span className="text-theme-text-muted">Suas memórias, entregues agora.</span>
          </p>
        </div>

        <section className="space-y-12">
          {/* O que é */}
          <div>
            <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight mb-4 flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-brand-tactical block"></span> O que é a Foto Segundo
            </h2>
            <div className="space-y-4 text-theme-text-muted leading-relaxed font-light text-base md:text-lg">
              <p>A Foto Segundo é uma plataforma brasileira que reinventa a forma como eventos são fotografados, organizados e eternizados.</p>
              <p>Nascemos da frustração de um problema simples e universal: após uma festa, as fotos ficam espalhadas entre dezenas de celulares, se perdem no WhatsApp com qualidade ruim, e as melhores memórias simplesmente somem.</p>
              <p>Construímos a infraestrutura que faltava — um sistema completo que conecta quem quer registrar momentos a profissionais de audiovisual qualificados, e que centraliza todas as fotos de um evento em um único álbum colaborativo, com qualidade editorial e entrega em tempo recorde.</p>
            </div>
          </div>

          {/* O Problema */}
          <div>
            <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight mb-4 flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-brand-tactical block"></span> O problema que resolvemos
            </h2>
            <p className="text-theme-text-muted font-light text-base md:text-lg mb-4">Todo mundo já viveu isso:</p>
            <ul className="space-y-3 mb-6">
              {[
                "Pediu as fotos do aniversário pelo grupo e metade nunca mandou",
                "Recebeu as fotos com qualidade péssima depois da compressão do WhatsApp",
                "Contratou um fotógrafo e ficou esperando semanas pela entrega",
                "Perdeu os registros de um momento único porque não havia um lugar central para guardá-los"
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-theme-text-muted font-light">
                  <span className="text-brand-tactical mt-1">✦</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-theme-text font-bold tracking-widest uppercase text-sm">A Foto Segundo existe para que isso nunca mais aconteça.</p>
          </div>

          {/* Como Funciona */}
          <div>
            <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight mb-6 flex items-center gap-3 italic">
              <span className="w-8 h-1 bg-brand-tactical block"></span> Como funciona
            </h2>
            
            <div className="space-y-8">
              <div className="bg-theme-bg-muted p-6 md:p-8 rounded-2xl border border-theme-border">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-sm mb-3">Para quem quer contratar um profissional</h3>
                <p className="text-theme-text-muted font-light leading-relaxed">Agende sua cobertura fotográfica em poucos cliques. Selecione uma unidade fixa autorizada ou solicite um orçamento personalizado, informe os detalhes do seu evento e garanta sua data com pagamento seguro via PIX — parcelado em até 2x. Receba sua galeria editada com qualidade editorial após o evento.</p>
              </div>

              <div className="bg-theme-bg-muted p-6 md:p-8 rounded-2xl border border-theme-border">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-sm mb-3">Para quem quer um álbum colaborativo</h3>
                <p className="text-theme-text-muted font-light leading-relaxed">Crie um Cofre (Vault) privado para o seu evento, gere um link de convite e compartilhe com seus convidados. Cada um envia as fotos que tirou diretamente pela plataforma — sem compressão, sem perda de qualidade. A galeria se forma em tempo real, os convidados votam nas melhores poses, e você pode materializar as favoritas em impressões físicas entregues na sua casa.</p>
              </div>

              <div className="bg-theme-bg-muted p-6 md:p-8 rounded-2xl border border-theme-border">
                <h3 className="text-brand-tactical font-black uppercase tracking-widest text-sm mb-3">Para profissionais de audiovisual</h3>
                <p className="text-theme-text-muted font-light leading-relaxed">A Foto Segundo é a sua central de negócios. Gerencie sua agenda, receba leads qualificados, entregue seus trabalhos e acompanhe seus ganhos — tudo em um único painel. Sem depender de Instagram, sem negociar preço no WhatsApp.</p>
              </div>
            </div>
          </div>

          {/* Números */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-theme-border">
            <div>
              <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">Fundação</p>
              <p className="text-theme-text font-black text-xl">2025</p>
            </div>
            <div>
              <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">Sede</p>
              <p className="text-theme-text font-black text-xl">Sumaré, SP</p>
            </div>
            <div>
              <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">Cobertura</p>
              <p className="text-theme-text font-black text-xl">Brasil</p>
            </div>
            <div>
              <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">Modelo</p>
              <p className="text-brand-tactical font-black text-sm uppercase tracking-wider mt-1">Marketplace + SaaS</p>
            </div>
          </div>

          {/* Missão e Tecnologia */}
          <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight mb-4 flex items-center gap-3 italic">
                <span className="w-8 h-1 bg-brand-tactical block"></span> Nossa missão
              </h2>
              <p className="text-theme-text-muted font-light text-base md:text-lg leading-relaxed">
                Democratizar o acesso a profissionais de audiovisual de qualidade e devolver às pessoas o controle sobre suas próprias memórias — com tecnologia, agilidade e padrão editorial.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-black text-theme-text uppercase tracking-tight mb-4 flex items-center gap-3 italic">
                <span className="w-8 h-1 bg-brand-tactical block"></span> A tecnologia por trás
              </h2>
              <p className="text-theme-text-muted font-light text-base md:text-lg leading-relaxed mb-4">
                A plataforma foi construída com uma stack moderna de ponta a ponta — PWA mobile-first, infraestrutura em nuvem, pagamentos via Mercado Pago com confirmação instantânea por webhook, e um motor de álbuns colaborativos com compressão inteligente de imagens diretamente no navegador do usuário.
              </p>
              <p className="text-theme-text-muted font-light text-base md:text-lg leading-relaxed">
                Cada detalhe foi pensado para funcionar no celular, em qualquer conexão, em qualquer evento.
              </p>
            </div>
          </div>

          {/* Fale com a gente */}
          <div className="mt-16 pt-12 border-t border-theme-border text-center">
            <h2 className="text-xl font-black text-theme-text uppercase tracking-tight mb-6">Tem dúvidas ou quer ser parceiro?</h2>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/suporte" className="px-8 py-3 bg-theme-bg-muted border border-theme-border text-theme-text font-bold tracking-widest uppercase text-xs rounded-full hover:bg-theme-border/20 transition-all">
                Central de Ajuda
              </Link>
              <Link to="/parcerias" className="px-8 py-3 bg-brand-tactical hover:brightness-110 text-white font-black tracking-widest uppercase text-xs rounded-full transition-all">
                Seja um Parceiro
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 text-center border-t border-theme-border">
        <p className="text-theme-text-muted text-xs font-bold uppercase tracking-widest mb-1">© 2026 Foto Segundo. Todos os direitos reservados.</p>
        <p className="text-brand-tactical/50 text-[10px] font-black italic uppercase tracking-[0.3em]">Protocolo Editorial de Imagem e Cinema</p>
      </footer>
    </div>
  );
}

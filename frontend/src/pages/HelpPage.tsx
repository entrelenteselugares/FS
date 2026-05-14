import React from 'react';
import { Navbar } from '../components/Navbar';
import SEO from '../components/SEO';
import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Clock, CreditCard, Truck, HelpCircle } from 'lucide-react';

const HelpPage: React.FC = () => {
  const faqItems = [
    {
      icon: <CreditCard className="text-brand-tactical" />,
      title: "Como funciona o Checkout PIX?",
      desc: "O pagamento é processado instantaneamente via Mercado Pago. Assim que confirmado, o acesso digital é liberado imediatamente no seu painel 'Minha Conta'."
    },
    {
      icon: <Truck className="text-brand-tactical" />,
      title: "Prazos de Entrega (Produtos Físicos)",
      desc: "Produtos físicos (Phygital) levam de 5 a 10 dias úteis para produção e postagem. Você receberá o código de rastreio por e-mail."
    },
    {
      icon: <ShieldCheck className="text-brand-tactical" />,
      title: "Segurança e Proteção de Dados",
      desc: "Suas fotos são protegidas por criptografia e marcas d'água táticas até a confirmação do pagamento. Não armazenamos dados de cartão de crédito."
    },
    {
      icon: <Clock className="text-brand-tactical" />,
      title: "Acesso a Galerias Privadas",
      desc: "Galerias privadas exigem um token de acesso enviado pelo profissional ou anfitrião do evento. O token é persistido no seu navegador para facilitar o retorno."
    }
  ];

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30">
      <SEO title="Ajuda e Suporte" description="Central de ajuda da Foto Segundo. Tire suas dúvidas sobre pagamentos, entregas e segurança." />
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-16"
        >
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="h-px w-12 bg-brand-tactical" />
              <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">Central de Ajuda</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-heading font-black uppercase italic tracking-tighter leading-none">
              Como podemos <br /> <span className="text-brand-tactical">ajudar você?</span>
            </h1>
          </div>

          {/* FAQ Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {faqItems.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-8 bg-theme-bg-muted border border-theme-border/60 hover:border-brand-tactical/40 transition-all group"
              >
                <div className="w-12 h-12 bg-brand-tactical/10 border border-brand-tactical/20 flex items-center justify-center mb-6 group-hover:bg-brand-tactical group-hover:text-black transition-all">
                  {item.icon}
                </div>
                <h3 className="text-xl font-black uppercase italic mb-4 tracking-tight">{item.title}</h3>
                <p className="text-theme-text-muted text-sm leading-relaxed font-medium">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Contact Section */}
          <div className="p-12 bg-brand-tactical/5 border border-brand-tactical/20 text-center space-y-6">
            <HelpCircle size={48} className="mx-auto text-brand-tactical animate-pulse" />
            <div className="space-y-2">
              <h2 className="text-2xl font-black uppercase italic tracking-tight">Ainda tem dúvidas?</h2>
              <p className="text-theme-text-muted text-sm uppercase tracking-widest font-bold">
                Nossa equipe tática está pronta para atender você.
              </p>
            </div>
            <button className="px-12 py-5 bg-brand-tactical text-black font-black uppercase tracking-[0.3em] text-[10px] italic hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20">
              Falar com Suporte (WhatsApp)
            </button>
          </div>
        </motion.div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-theme-border/40 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.5em] italic">
            © 2026 Foto Segundo • Tactical Performance
          </div>
          <div className="flex gap-8">
            <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest cursor-pointer hover:text-brand-tactical transition-colors">Termos</span>
            <span className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest cursor-pointer hover:text-brand-tactical transition-colors">Privacidade</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;

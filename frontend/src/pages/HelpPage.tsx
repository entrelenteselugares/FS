import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import SEO from '../components/SEO';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, Camera, Calendar, User, Briefcase, Wrench, ChevronDown, CreditCard } from 'lucide-react';

const HelpPage: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState<string>("vaults");
  const [openItem, setOpenItem] = useState<string | null>(null);

  const categories = [
    { id: "vaults", label: "Álbuns Colaborativos", icon: <Camera size={18} /> },
    { id: "pagamentos", label: "Pagamentos e Assinatura", icon: <CreditCard size={18} /> },
    { id: "agendamento", label: "Agendamento", icon: <Calendar size={18} /> },
    { id: "conta", label: "Conta e Acesso", icon: <User size={18} /> },
    { id: "profissionais", label: "Para Profissionais", icon: <Briefcase size={18} /> },
    { id: "tecnico", label: "Problemas Técnicos", icon: <Wrench size={18} /> },
  ];

  const faqData: Record<string, { q: string, a: string | React.ReactNode }[]> = {
    vaults: [
      {
        q: "Como crio um álbum para meu evento?",
        a: "Acesse **Meus Álbuns** no menu lateral e clique em **+ Novo Álbum**. Dê um nome ao álbum, configure as opções e pronto — seu cofre estará criado e pronto para receber fotos."
      },
      {
        q: "Como convido meus amigos para enviar fotos?",
        a: "Dentro do seu álbum, clique em **Convidar**. Um link único será gerado. Compartilhe esse link no grupo do WhatsApp ou pelo canal que preferir. Seus convidados poderão acessar sem precisar de conta."
      },
      {
        q: "Preciso ter conta para enviar fotos como convidado?",
        a: "Sim, um cadastro rápido é necessário para garantir que cada foto fique vinculada a quem enviou e que o álbum seja protegido contra envios indesejados."
      },
      {
        q: "As fotos perdem qualidade ao serem enviadas?",
        a: "Não. A plataforma comprime as imagens de forma inteligente para otimizar a velocidade de envio, mantendo qualidade suficiente para exibição em tela e impressão no formato de álbum (até 1800px no lado maior). Diferente do WhatsApp, que comprime de forma agressiva, nossas fotos chegam nítidas."
      },
      {
        q: "Como funciona a votação?",
        a: "Qualquer membro do álbum pode dar \"corações\" nas fotos favoritas. As mais votadas ficam destacadas e são usadas como base para a materialização."
      },
      {
        q: "O que é \"Materializar\"?",
        a: "É o processo de transformar as fotos do álbum em produto físico. Ao clicar em **Materializar**, você acessa o checkout para imprimir as fotos mais votadas e recebê-las em casa."
      }
    ],
    pagamentos: [
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "PIX e cartão de crédito, processados pelo Mercado Pago."
      },
      {
        q: "Como funciona o pagamento parcelado?",
        a: "Para contratação de serviços fotográficos, cobramos 50% no momento do agendamento e os outros 50% até 56 horas antes do evento."
      },
      {
        q: "O que é o plano de assinatura?",
        a: "Por R$ 49,90/mês, você recebe mensalmente as **36 fotos mais votadas** do seu álbum impressas e entregues em casa. O plano pode ser cancelado a qualquer momento."
      },
      {
        q: "Como cancelo minha assinatura?",
        a: "Acesse **Meus Dados** no painel, vá em **Assinatura** e clique em **Cancelar**. O cancelamento é imediato e válido para o próximo ciclo de cobrança."
      },
      {
        q: "Não recebi a confirmação do pagamento. O que faço?",
        a: "Aguarde até 10 minutos — confirmações PIX são automáticas mas podem ter pequeno atraso. Se após esse tempo o pedido ainda aparecer como **Pendente**, entre em contato pela nossa <a href='/contato' class='text-brand-tactical hover:underline'>página de Contato</a> com o comprovante do PIX."
      }
    ],
    agendamento: [
      {
        q: "Como agendar um fotógrafo?",
        a: "Clique em **Agendar** no menu principal, selecione uma unidade fixa autorizada ou solicite um orçamento para seu local. Informe a data, o tipo de evento e o número de convidados. Você receberá uma análise tática e poderá confirmar com pagamento seguro."
      },
      {
        q: "Posso cancelar um agendamento?",
        a: "Sim. Cancelamentos com mais de 72 horas de antecedência recebem reembolso integral. Cancelamentos com menos de 72 horas estão sujeitos à retenção do sinal de 50%."
      },
      {
        q: "Em quanto tempo recebo as fotos após o evento?",
        a: "O prazo de entrega varia conforme o pacote contratado e é informado no momento do agendamento. Trabalhamos com agilidade recorde — a maioria das entregas ocorre em até 48 horas após o evento."
      }
    ],
    conta: [
      {
        q: "Esqueci minha senha. Como recupero?",
        a: "Na tela de login, clique em **Esqueci minha senha** e informe seu e-mail. Você receberá um link de redefinição em instantes."
      },
      {
        q: "Como atualizo meus dados cadastrais?",
        a: "Acesse **Meus Dados** no menu lateral do painel."
      },
      {
        q: "Como excluo minha conta?",
        a: "Entre em contato pela nossa <a href='/contato' class='text-brand-tactical hover:underline'>página de Contato</a> solicitando a exclusão. Dados financeiros são retidos por 5 anos conforme exigência legal — os demais dados são removidos em até 30 dias."
      }
    ],
    profissionais: [
      {
        q: "Como me cadastro como fotógrafo na rede?",
        a: "Acesse a <a href='/negocios' class='text-brand-tactical hover:underline'>página de Negócios</a> e preencha o formulário de interesse. Nossa equipe entrará em contato para apresentar os critérios de credenciamento."
      },
      {
        q: "Como funciona o pagamento aos profissionais?",
        a: "Após a aprovação do pedido pelo cliente, o valor é calculado automaticamente pelo sistema e creditado na sua **Wallet** dentro da plataforma. Os valores ficam disponíveis conforme o ciclo de repasse acordado."
      },
      {
        q: "Posso ver meu histórico financeiro?",
        a: "Sim. No painel profissional, acesse **Minhas Vendas & Ganhos** para visualizar todo o extrato de transações."
      }
    ],
    tecnico: [
      {
        q: "O app não está carregando. O que faço?",
        a: "Tente limpar o cache do navegador e recarregar a página. Se o problema persistir, verifique nossa <a href='/status' class='text-brand-tactical hover:underline'>página de Status</a> para saber se há alguma instabilidade em andamento."
      },
      {
        q: "Uma foto não foi enviada durante o upload.",
        a: "Ao final do upload, a plataforma informa quantas fotos foram enviadas com sucesso e quantas falharam. Fotos que falham geralmente são arquivos muito grandes (acima de 4.5MB antes da compressão) ou foram interrompidas por instabilidade de rede. Tente reenviar em uma conexão mais estável."
      },
      {
        q: "Não consigo acessar meu álbum após o pagamento.",
        a: "O desbloqueio é automático após confirmação do pagamento. Se o acesso não foi liberado em até 10 minutos após o PIX, entre em contato com o comprovante pela nossa <a href='/contato' class='text-brand-tactical hover:underline'>página de Contato</a>."
      }
    ]
  };

  const currentFaqs = faqData[activeCategory] || [];

  return (
    <div className="min-h-screen bg-theme-bg text-brand-text selection:bg-brand-tactical/30">
      <SEO title="Central de Ajuda | Foto Segundo" description="Encontre respostas rápidas para as dúvidas mais comuns." />
      <Navbar />

      <main className="max-w-4xl mx-auto px-3 md:px-6 py-24 lg:py-32">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-12"
        >
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-heading font-bold uppercase leading-none">
              Central de <span className="text-brand-tactical">Ajuda</span>
            </h1>
            <p className="text-theme-text-muted text-sm uppercase tracking-widest font-bold">
              Protocolo Editorial de Imagem e Cinema
            </p>
          </div>

          <div className="bg-theme-bg-muted border border-theme-border p-2 md:p-4 flex flex-wrap gap-2 justify-center rounded-2xl">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategory(cat.id); setOpenItem(null); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl transition-all duration-300 font-bold uppercase tracking-widest text-[10px] ${
                  activeCategory === cat.id 
                    ? "bg-brand-tactical text-brand-text shadow-lg shadow-brand-tactical/20" 
                    : "bg-theme-bg border border-theme-border text-brand-text hover:border-brand-tactical/40"
                }`}
              >
                {cat.icon}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="space-y-4 min-h-[400px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {currentFaqs.map((faq, idx) => {
                  const isOpen = openItem === `${activeCategory}-${idx}`;
                  
                  return (
                    <div 
                      key={idx}
                      className={`border transition-all duration-300 rounded-xl overflow-hidden ${
                        isOpen ? 'border-brand-tactical bg-theme-bg-muted' : 'border-theme-border bg-theme-bg-muted hover:border-brand-tactical/40'
                      }`}
                    >
                      <button 
                        onClick={() => setOpenItem(isOpen ? null : `${activeCategory}-${idx}`)}
                        className="w-full flex items-center justify-between p-3 md:p-6 text-left"
                      >
                        <h3 className="text-lg md:text-xl font-bold uppercase pr-8">
                          {faq.q}
                        </h3>
                        <ChevronDown 
                          size={24} 
                          className={`text-brand-tactical transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180' : ''}`} 
                        />
                      </button>
                      
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-3 md:px-6 pb-6 text-theme-text-muted text-sm md:text-base leading-relaxed font-medium pt-2 border-t border-theme-border">
                              {typeof faq.a === 'string' ? (
                                <p dangerouslySetInnerHTML={{ __html: faq.a.replace(/\*\*(.*?)\*\*/g, '<strong class="text-theme-text">$1</strong>') }} />
                              ) : (
                                <p>{faq.a}</p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Contact Section */}
          <div className="p-4 md:p-8 md:p-12 bg-brand-tactical/10 border border-brand-tactical/20 text-center space-y-6 mt-16 rounded-2xl">
            <HelpCircle size={48} className="mx-auto text-brand-tactical" />
            <div className="space-y-2">
              <h2 className="text-2xl font-bold uppercase">Não encontrou sua resposta?</h2>
              <p className="text-theme-text-muted text-sm uppercase tracking-widest font-bold max-w-md mx-auto">
                Entre em contato com nossa equipe pela página de contato. Respondemos em até 24 horas úteis.
              </p>
            </div>
            <Link to="/contato" className="inline-block px-3 md:px-6 md:px-12 py-4 bg-brand-tactical text-brand-text font-bold uppercase tracking-[0.3em] text-[10px] hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20 rounded-full">
              Falar com o Suporte
            </Link>
          </div>
        </motion.div>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t border-theme-border py-3 md:py-6 md:py-12 px-3 md:px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 md:gap-8">
          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-[0.5em]">
            © 2026 Foto Segundo • Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HelpPage;

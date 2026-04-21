import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, CreditCard, Lock } from "lucide-react";
import { API } from "../lib/api";

export const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get("orderId");
  const effectiveOrderId = orderId || orderIdFromQuery;
  
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!effectiveOrderId) {
      setLoading(false);
      setError("Protocolo de pagamento não identificado.");
      return;
    }

    const fetchOrder = async () => {
      try {
        const { data } = await API.get(`/public/orders/${effectiveOrderId}`);
        setOrder(data);
      } catch (err) {
        console.error("Erro ao carregar pedido:", err);
        setError("Não foi possível carregar os detalhes do pedido.");
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [effectiveOrderId]);

  const handlePayment = async () => {
    if (!order) return;
    
    try {
      // Inicia o checkout pro do Mercado Pago
      const { data } = await API.post("/checkout", {
        eventId: order.event?.id || order.eventId, // Precisamos garantir que o order tenha o eventId
        email: "checkout@cliente.com", // Placeholder - em prod pegaria do input ou auth
        orderId: order.id
      });

      if (data.init_point) {
        window.location.href = data.init_point;
      }
    } catch (err: any) {
      const msg = err.response?.data?.details || "Erro ao processar pagamento. Tente novamente.";
      alert(`Erro: ${msg}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-proportional animate-pulse">Sincronizando Protocolo de Pagamento...</div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
        <h2 className="heading-luxury mb-4 text-red-500">ERRO</h2>
        <p className="text-proportional mb-8">{error || "Pedido não encontrado."}</p>
        <button onClick={() => navigate("/")} className="lux-button-ghost">Voltar para a home</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans">
      <nav className="p-6 md:p-10 border-b border-theme-border flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="flex items-center gap-3 text-proportional hover:text-brand-primary transition-all">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="text-proportional opacity-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-brand-primary" /> Checkout Seguro
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 md:px-10 py-12 md:py-24 space-y-20">
        {/* Resumo do Pedido */}
        <div className="animate-reveal">
          <div className="mb-0">
             <div className="text-proportional text-brand-primary mb-4">Resumo da Aquisição</div>
             <h1 className="heading-luxury mb-12 !text-3xl md:!text-5xl !tracking-tight flex gap-3 justify-center items-center">
               <span className="text-theme-text opacity-100 font-black">RESERVA</span> 
               <span 
                 className="opacity-40" 
                 style={{ 
                   WebkitTextStroke: "1px var(--theme-text)", 
                   color: "transparent",
                   fontWeight: 900
                 }}
               >CONFIRMADA</span>
             </h1>
          </div>

          <div className="lux-card editorial-shadow space-y-8 !bg-white !text-[#0a0a0a] !border-none !rounded-sm">
            <div className="flex flex-col items-center gap-6 border-b border-gray-100 pb-8">
              <img 
                src="/logo-minimalista.png" 
                alt="Logo Minimalista" 
                className="h-14 object-contain"
              />
              <div className="text-center">
                <div className="text-xl font-black uppercase tracking-tighter mb-1">{order.event?.nomeNoivos}</div>
                <div className="text-[10px] opacity-40 font-bold uppercase tracking-widest">{new Date(order.event?.dataEvento).toLocaleDateString("pt-BR")}</div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                <span>Investimento Base</span>
                <span>R$ {Number(order.amount).toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest opacity-40">
                <span>Taxas & Encargos</span>
                <span>Incluso</span>
              </div>
              <div className="pt-6 border-t border-gray-100 flex justify-between items-center">
                <div className="text-[11px] !opacity-100 uppercase font-black tracking-widest">Total a Liquidar</div>
                <div className="text-4xl font-black tracking-tighter text-brand-primary">R$ {Number(order.amount).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pagamento */}
        <div className="animate-reveal" style={{ animationDelay: "0.2s" }}>
          <div className="text-center mb-10">
            <div className="text-proportional text-brand-primary mb-4">Forma de Pagamento</div>
            <p className="text-proportional">Processamento via Mercado Pago com criptografia de 256 bits.</p>
          </div>

          <div className="space-y-4">
            <button 
              onClick={handlePayment}
              className="w-full bg-brand-primary hover:brightness-110 text-[#0a0a0a] py-6 !text-sm flex flex-col items-center gap-1 transition-all"
            >
              <div className="flex items-center gap-3 font-black">
                <CreditCard size={18} /> PAGAR COM CARTÃO / PIX
              </div>
              <span className="text-[9px] opacity-60 tracking-[0.2em] font-medium">Liberação Imediata via Checkout Pro</span>
            </button>
            
            <div className="flex items-center justify-center gap-4 py-4">
               <div className="w-8 h-px bg-theme-border" />
               <Lock size={12} className="text-theme-text opacity-30" />
               <div className="w-8 h-px bg-theme-border" />
            </div>

            <p className="text-[10px] text-center text-theme-muted uppercase tracking-widest leading-relaxed px-6">
              Ao clicar em pagar, você será redirecionado para o ambiente seguro da matiz para concluir sua transação.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import { API } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";

interface OrderEvent {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  location?: string;
  coverPhotoUrl?: string;
  isCrowdfund: boolean;
}

interface OrderDetail {
  id: string;
  amount: number;
  status: string;
  eventId: string;
  clienteId?: string;
  buyerEmail?: string;
  event: OrderEvent;
  isContribution: boolean;
  contributorName?: string;
}

export const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get("orderId");
  const effectiveOrderId = orderId || orderIdFromQuery;
  
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; ticketUrl: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const brickController = useRef<{ unmount: () => void } | null>(null);
  const initializationStarted = useRef(false);
  const { theme } = useTheme();

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

  // Inicialização do Mercado Pago Brick para Checkout Transparente
  useEffect(() => {
    // Se já houver um processo de inicialização ou se os dados não estiverem prontos, aborta.
    if (!order || pixData || paymentSuccess || loading || initializationStarted.current) return;
    
    initializationStarted.current = true;

    const mpPublicKey = "APP_USR-18f8ccc4-8ed4-4f99-bb6d-e333d026e578";
    
    const win = window as Window & { MercadoPago?: any };
    if (!win.MercadoPago) {
      console.warn("Mercado Pago SDK não detectado no window.");
      initializationStarted.current = false;
      return;
    }

    const renderPaymentBrick = async () => {
      // Limpa o container antes de qualquer ação para garantir unicidade no DOM
      const container = document.getElementById("paymentBrick_container");
      if (container) container.innerHTML = "";

      const mp = new win.MercadoPago(mpPublicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      const settings = {
        initialization: {
          amount: Number(order.amount),
          payer: {
            email: order.buyerEmail || "cliente@fotosegundo.com.br",
            entityType: "individual",
          },
        },
        customization: {
          paymentMethods: {
            creditCard: "all" as const,
            bankTransfer: ["pix"] as any,
            maxInstallments: 12,
          },
          visual: {
            style: {
              theme: (theme === "dark" ? "dark" : "default") as any,
            },
          },
        },
        callbacks: {
          onReady: () => {
            console.log("[Payment Brick] Ready");
          },
          onSubmit: async ({ selectedPaymentMethod, formData }: { selectedPaymentMethod: string, formData: any }) => {
            try {
              const { data } = await API.post("/checkout/payment", {
                eventId: order.event.id || order.eventId,
                userId: order.clienteId || null,
                orderId: order.id,
                email: formData.payer.email,
                cpf: formData.payer.identification?.number,
                cardToken: formData.token,
                installments: formData.installments,
                paymentMethodId: formData.payment_method_id,
                method: selectedPaymentMethod
              });

              if (data.hasPaid) {
                setPaymentSuccess(true);
              } else if (data.qr_code) {
                setPixData({
                  qrCode: data.qr_code,
                  qrCodeBase64: data.qr_code_base64,
                  ticketUrl: data.ticket_url
                });
              } else {
                alert(`Status do Pagamento: ${data.status}`);
              }
            } catch (err: any) {
              console.error("Erro no processamento transparente:", err);
              alert("Erro ao processar pagamento. Verifique seus dados.");
            }
          },
          onError: (error: unknown) => {
            console.error("[Payment Brick] Error:", error);
            initializationStarted.current = false; // Permite tentar novamente em caso de erro
          },
        },
      };

      brickController.current = await bricksBuilder.create("payment", "paymentBrick_container", settings);
    };

    renderPaymentBrick();

    return () => {
      if (brickController.current) {
        brickController.current.unmount();
        brickController.current = null;
      }
      initializationStarted.current = false;
    };
  }, [order, pixData, paymentSuccess, loading, theme]); // Adicionado theme como dependência para atualizar o brick se o tema mudar

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
    <div className="min-h-screen bg-theme-bg text-theme-text font-['Inter']">
      <nav className="h-16 flex items-center justify-between px-6 border-b border-theme-border sticky top-0 z-50 bg-theme-bg/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-proportional opacity-40 hover:opacity-100 transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div className="text-proportional opacity-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-brand-primary" /> <span className="mobile-hide">Checkout Seguro</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-16">
        {paymentSuccess ? (
          <div className="lux-card editorial-shadow text-center py-20 animate-reveal rounded-none border-zinc-200 dark:border-zinc-800">
            <div className="w-24 h-24 bg-brand-primary/10 rounded-full flex items-center justify-center mx-auto mb-10">
              <ShieldCheck size={48} className="text-brand-primary" />
            </div>
            <h1 className="heading-luxury mb-6 tracking-tighter">COMPRA APROVADA</h1>
            <p className="text-proportional opacity-60 mb-10 max-w-sm mx-auto font-medium">
              Sua galeria já está liberada! Enviamos as instruções de acesso para o seu e-mail.
            </p>
            <button 
              onClick={() => navigate(`/e/${order.event.id || order.eventId}`)} 
              className="lux-button-base lux-button-tactical w-full py-6 !text-lg shadow-2xl"
            >
              ACESSAR MINHAS FOTOS
            </button>
          </div>
        ) : pixData ? (
          <div className="lux-card editorial-shadow animate-reveal rounded-none border-zinc-200 dark:border-zinc-800">
            <div className="mb-10 text-left border-b border-theme-border pb-6">
              <h2 className="heading-luxury !text-2xl mb-2 italic">QUASE LÁ!</h2>
              <p className="text-proportional opacity-60 text-[10px]">Escaneie o código PIX para liberação imediata.</p>
            </div>
            
            <div className="bg-white p-6 rounded-none w-fit mx-auto mb-10 shadow-2xl border border-zinc-100">
              <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="QR Code PIX" className="w-64 h-64" />
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-theme-bg-muted border border-theme-border rounded-none text-left relative">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-4 font-['Outfit']">Pix Copia e Cola</p>
                <div className="flex items-center gap-6">
                  <input readOnly value={pixData.qrCode} className="bg-transparent text-sm w-full outline-none truncate font-mono text-theme-text" />
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(pixData.qrCode); 
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }} 
                    className="flex items-center gap-2 text-brand-primary text-[10px] font-black uppercase whitespace-nowrap tracking-widest"
                  >
                    {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                    {copied ? "Copiado" : "Copiar Código"}
                  </button>
                </div>
              </div>
              <p className="text-[10px] text-center uppercase tracking-[0.3em] opacity-30 italic font-bold">Válido por 30 minutos</p>
            </div>
          </div>
        ) : (
          <>
            {/* Resumo do Pedido Estilo Editorial */}
            <div className="lux-aura">
              <div className="lux-card editorial-shadow !bg-theme-bg-muted !border-theme-border rounded-none animate-reveal">
                <div className="flex flex-col items-center gap-8 border-b border-theme-border pb-10 mb-10 text-center">
                  <h1 className="heading-luxury !text-3xl md:!text-5xl italic tracking-tighter">
                    {order.event?.nomeNoivos}
                  </h1>
                  <div className="text-proportional !opacity-100 tracking-[0.4em] font-black">Resumo da Aquisição</div>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between items-center text-proportional font-black">
                    <span>Investimento Base</span>
                    <span className="opacity-100 text-theme-text">R$ {Number(order.amount).toFixed(2)}</span>
                  </div>
                  <div className="pt-8 border-t border-theme-border flex justify-between items-center">
                    <div className="text-proportional !opacity-100 font-black tracking-[0.4em]">Total a Liquidar</div>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter text-brand-primary italic">R$ {Number(order.amount).toFixed(2)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Container do Pagamento Bricks */}
            <div className="lux-card editorial-shadow !p-4 md:!p-10 min-h-[400px] rounded-none border-theme-border animate-reveal" style={{ animationDelay: "0.2s" }}>
              <div className="mb-10 text-center">
                <div className="text-proportional mb-4 tracking-[0.3em] font-black">Forma de Pagamento</div>
                <p className="text-[10px] uppercase tracking-widest opacity-40">Processamento via Mercado Pago com criptografia 256 bits</p>
              </div>
              <div id="paymentBrick_container"></div>
            </div>

            <div className="text-center space-y-6 opacity-30 animate-reveal" style={{ animationDelay: "0.4s" }}>
              <div className="flex items-center justify-center gap-8">
                <img src="https://static.mlstatic.com/org-img/vendors/br/logo-mercado-pago.png" alt="MP" className="h-4 grayscale brightness-0 dark:brightness-200" />
                <div className="w-px h-4 bg-theme-border" />
                <ShieldCheck size={16} />
                <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">PAGAMENTO BLINDADO</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

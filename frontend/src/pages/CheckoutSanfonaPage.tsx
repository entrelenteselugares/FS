import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, CheckCircle2, ShieldCheck, Mail, Phone, Lock, Copy, ExternalLink } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { API } from "../lib/api";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";
import { AuthContext } from "../contexts/AuthContextBase";

interface MPBrickSettings {
  initialization: {
    amount: number;
    payer?: { email?: string; entityType?: string };
  };
  customization: {
    paymentMethods: { creditCard: string; bankTransfer?: string; maxInstallments: number; mercadoPago?: string };
    visual?: { style?: { theme?: string } };
  };
  callbacks: {
    onReady: () => void;
    onSubmit: (data: { 
      selectedPaymentMethod: string; 
      formData: {
        payer?: { identification?: { number?: string } };
        token?: string;
        installments?: number;
        payment_method_id?: string;
        [key: string]: unknown;
      } 
    }) => Promise<void>;
    onError: (error: unknown) => void;
  };
}

interface CheckoutOrder {
  id: string;
  amount: number | string;
  buyerEmail?: string;
  clienteId?: string;
  eventId?: string;
  status?: string;
  event?: {
    id: string;
    title: string;
    slug: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    price: number | string;
    media?: { shortId?: string };
  }>;
}

export default function CheckoutSanfonaPage() {
  const navigate = useNavigate();
  const { orderId: orderIdParam } = useParams();
  const [searchParams] = useSearchParams();
  const orderId = orderIdParam || searchParams.get("orderId") || undefined;
  
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [pixData, setPixData] = useState<{ qr_code: string; qr_code_base64: string; ticket_url?: string; orderId: string } | null>(null);
  
  // Order state
  const [order, setOrder] = useState<CheckoutOrder | null>(null);
  const [orderLoading, setOrderLoading] = useState(!!orderId);
  const [orderError, setOrderError] = useState("");

  // Guest Capture
  const [userEmail, setUserEmail] = useState("");
  const [userWhatsApp, setUserWhatsApp] = useState("");
  const [showBrick, setShowBrick] = useState(false);

  const initializationStarted = useRef(false);
  const brickController = useRef<{ unmount: () => void } | null>(null);

  const { user: authUser, loading: authLoading } = useContext(AuthContext)!;

  // 1. Fetch Order if orderId is provided
  useEffect(() => {
    if (!orderId) {
      setOrderLoading(false);
      return;
    }
    
    API.get(`/public/orders/${orderId}`)
      .then(({ data }) => {
        setOrder(data);
        if (data.status === 'APROVADO' || data.status === 'PAGO') {
          setPaymentSuccess(true);
        }
      })
      .catch(() => setOrderError("Não foi possível carregar os detalhes do pedido."))
      .finally(() => setOrderLoading(false));
  }, [orderId]);

  // 2. Resolve User Email (Auto-fill for authenticated users)
  useEffect(() => {
    if (authLoading) return;
    
    if (authUser?.email) {
      setUserEmail(authUser.email);
      setShowBrick(true); // Se tem conta, vai direto pro Brick
    } else if (order?.buyerEmail) {
      setUserEmail(order.buyerEmail);
      // Se veio com email mas sem conta, mostra o brick
      setShowBrick(true); 
    }
  }, [authUser, authLoading, order]);

  // Derived Values
  const price = order ? Number(order.amount) : 27.90;
  const isSubscription = !orderId;
  const title = isSubscription ? "Clube do Álbum Sanfona" : (order?.event?.title || "Sua Galeria");
  const description = isSubscription 
    ? "Receba um álbum sanfona exclusivo em casa todo mês com as suas 10 melhores fotos." 
    : "Acesso permanente e download em alta resolução das suas memórias.";

  const handleGuestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userEmail.includes('@')) {
      toast.error("Por favor, informe um e-mail válido.");
      return;
    }
    setShowBrick(true);
  };

  // 3. Render MP Brick
  useEffect(() => {
    if (paymentSuccess || initializationStarted.current || orderLoading || !showBrick) return;

    const mpPublicKey = "APP_USR-18f8ccc4-8ed4-4f99-bb6d-e333d026e578"; // Chave de Produção
    let isMounted = true;
    let controller: { unmount: () => void } | null = null;

    const renderPaymentBrick = async () => {
      let attempts = 0;
      const mpGlobal = window as unknown as { MercadoPago?: new (key: string, options: { locale: string }) => { bricks: () => { create: (brick: string, container: string, settings: MPBrickSettings) => Promise<{ unmount: () => void }> } } };
      while (!mpGlobal.MercadoPago && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 500));
        attempts++;
      }

      if (!mpGlobal.MercadoPago) {
        console.error("[Checkout] MercadoPago SDK not found.");
        return;
      }

      if (initializationStarted.current) return;
      initializationStarted.current = true;

      const container = document.getElementById("paymentBrick_container");
      if (!container) {
        initializationStarted.current = false;
        return;
      }
      container.innerHTML = "";
      
      const mp = new mpGlobal.MercadoPago(mpPublicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      const settings: MPBrickSettings = {
        initialization: {
          amount: price,
          payer: { email: userEmail, entityType: "individual" },
        },
        customization: {
          // Se for assinatura, apenas crédito 1x. Se for pedido avulso, aceita PIX e parcelamento.
          paymentMethods: { 
            creditCard: "all", 
            bankTransfer: isSubscription ? undefined : "all",
            maxInstallments: isSubscription ? 1 : 12 
          },
          visual: { style: { theme: "dark" } },
        },
        callbacks: {
          onReady: () => {},
          onSubmit: async ({ formData }) => {
            setLoading(true);
            try {
              if (isSubscription) {
                // Fluxo de Assinatura
                const { data } = await API.post("/sanfona/subscribe", {
                  cardTokenId: formData.token
                });
                if (data.subscriptionId) {
                  setPaymentSuccess(true);
                  setTimeout(() => navigate("/minha-conta?tab=files&sanfona=success"), 3000);
                }
              } else {
                // Fluxo de Pedido Comum
                const { data } = await API.post("/checkout/payment", {
                  eventId: order.event?.id || order.eventId,
                  userId: order.clienteId || null,
                  orderId: order.id,
                  email: userEmail,
                  whatsapp: userWhatsApp, // Guest capture
                  cpf: formData.payer?.identification?.number,
                  cardToken: formData.token,
                  installments: formData.installments,
                  paymentMethodId: formData.payment_method_id,
                });
                
                if (data.hasPaid) {
                  setPaymentSuccess(true);
                  // Redireciona para o evento após 3 segundos
                  const eventSlug = order.event?.slug;
                  if (eventSlug) setTimeout(() => navigate(`/e/${eventSlug}`), 3000);
                } else if (data.qr_code) {
                  // Mostra o PIX na própria tela — não redireciona
                  setPixData({
                    qr_code: data.qr_code,
                    qr_code_base64: data.qr_code_base64,
                    ticket_url: data.ticket_url,
                    orderId: data.orderId || order.id,
                  });
                } else {
                  toast.error("Não foi possível processar o pagamento. Tente novamente.");
                }
              }
            } catch (err: unknown) {
              const errorObj = err as { response?: { data?: { error?: string } } };
              const errorMessage = errorObj.response?.data?.error || "Erro ao processar pagamento.";
              Sentry.captureException(err, { tags: { context: "checkout_unified_failure" }, extra: { errorMessage } });
              toast.error(errorMessage);
            } finally {
              setLoading(false);
            }
          },
          onError: (error: unknown) => {
            console.error("[Payment Brick] Fatal Error:", error);
            initializationStarted.current = false;
          },
        },
      };

      try {
        const createdController = await bricksBuilder.create("payment", "paymentBrick_container", settings);
        if (!isMounted) {
          createdController.unmount();
        } else {
          brickController.current = createdController;
          controller = createdController;
        }
      } catch (err) {
        console.error("[Payment Brick] Create Error:", err);
      }
    };

    renderPaymentBrick();

    return () => {
      isMounted = false;
      initializationStarted.current = false;
      if (controller) controller.unmount();
      else if (brickController.current) brickController.current.unmount();
      brickController.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentSuccess, showBrick, price, userEmail, isSubscription, order, orderLoading, navigate]);

  if (orderError) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <p className="text-red-400 font-bold tracking-widest">{orderError}</p>
          <button onClick={() => navigate(-1)} className="px-6 py-2 bg-theme-bg-muted rounded-full">Voltar</button>
        </div>
      </div>
    );
  }

  // ── PIX Screen ──
  if (pixData) {
    return (
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-3 md:p-6">
          <div className="max-w-md w-full space-y-8 text-center animate-in fade-in zoom-in duration-700">
            <div className="space-y-2">
              <p className="text-[9px] font-bold uppercase tracking-[0.4em] text-brand-tactical">Pague com PIX</p>
              <h2 className="text-2xl md:text-4xl font-heading font-bold uppercase">Aguardando Pagamento</h2>
              <p className="text-theme-text-muted text-sm">Escaneie o QR Code abaixo com o app do seu banco</p>
            </div>

            {pixData.qr_code_base64 && (
              <div className="mx-auto w-56 h-56 bg-white rounded-2xl p-3 shadow-2xl">
                <img
                  src={`data:image/png;base64,${pixData.qr_code_base64}`}
                  alt="PIX QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            <div className="bg-theme-bg-muted border border-white/5 rounded-xl p-4 space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">Código PIX (copia e cola)</p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs text-theme-text bg-black/40 p-3 rounded-lg overflow-hidden text-ellipsis whitespace-nowrap">
                  {pixData.qr_code}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(pixData!.qr_code); toast.success("Copiado!"); }}
                  className="shrink-0 p-3 bg-brand-tactical/10 border border-brand-tactical/30 rounded-lg text-brand-tactical hover:bg-brand-tactical/20 transition-all"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            {pixData.ticket_url && (
              <a
                href={pixData.ticket_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-all"
              >
                <ExternalLink size={12} /> Abrir página de pagamento
              </a>
            )}

            <p className="text-[9px] text-theme-text-muted">
              Após o pagamento, seu acesso será liberado automaticamente.<br />
              Verifique o e-mail <span className="text-brand-tactical">{userEmail}</span> para confirmação.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-3 md:p-6">
          <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-tactical/20 blur-3xl rounded-full animate-pulse" />
              <CheckCircle2 size={80} className="text-brand-tactical relative z-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-3xl md:text-5xl font-heading font-bold text-theme-text uppercase leading-none">
                {isSubscription ? "Assinatura Confirmada" : "Pagamento Confirmado"}
              </h2>
              <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                {isSubscription 
                  ? "Sua assinatura do Clube do Álbum Sanfona está ativa." 
                  : "Seu acesso foi liberado com sucesso."}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col pb-safe">
      <Helmet>
        <title>Checkout - {title} | Foto Segundo</title>
      </Helmet>
      <Navbar />
      <div className="flex-1 max-w-4xl mx-auto px-3 md:px-6 py-6 md:py-12 w-full animate-in fade-in duration-700">
        <div className="flex justify-between items-center mb-12 border-b border-theme-border pb-8">
          <button onClick={() => navigate(-1)} className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-all flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>
          <div className="flex items-center gap-2 text-brand-tactical text-[9px] font-bold uppercase tracking-widest"><ShieldCheck size={14} /> Checkout Blindado</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.4em] mb-4">
                {isSubscription ? "Assinatura Mensal" : "Acesso Premium"}
              </p>
              <h1 className="text-2xl md:text-4xl font-bold uppercase leading-none">
                {title}
              </h1>
              <p className="text-theme-muted text-sm mt-4 font-medium leading-relaxed">
                {description}
              </p>
            </div>

            <div className="bg-theme-bg-muted border border-white/5 p-6 rounded-xl space-y-4">
               {isSubscription && (
                 <>
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
                     <span>Plano</span>
                     <span className="text-theme-text">Mensal</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
                     <span>Renovação</span>
                     <span className="text-theme-text">Automática</span>
                   </div>
                 </>
               )}
               {(order?.items as Array<{ id: string; quantity: number; price: number; media?: { shortId?: string } }>)?.map((item) => (
                 <div key={item.id} className="flex justify-between text-sm text-theme-text-muted">
                   <span>{item.quantity}x {item.media?.shortId || "Produto"}</span>
                   <span className="text-theme-text">R$ {Number(item.price).toFixed(2)}</span>
                 </div>
               ))}
               <div className="h-px bg-white/10 my-4" />
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-tactical">Total Hoje</span>
                 <span className="text-2xl font-heading font-bold text-theme-text">R$ {price.toFixed(2)}</span>
               </div>
            </div>
          </div>

          <div data-theme="dark" className="bg-[#1e1e1e] rounded-xl p-4 md:p-6 shadow-2xl relative min-h-[400px]">
            {(orderLoading || loading) && (
               <div className="absolute inset-0 z-50 bg-[#1e1e1e]/80 backdrop-blur-sm flex items-center justify-center rounded-xl">
                 <div className="text-[10px] font-bold tracking-[0.5em] text-brand-tactical animate-pulse uppercase">Processando...</div>
               </div>
            )}
            
            <h3 className="text-xs font-bold uppercase tracking-widest text-theme-text mb-6">Pagamento Seguro</h3>
            
            {!showBrick ? (
              <form onSubmit={handleGuestSubmit} className="space-y-6 animate-in fade-in duration-500">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Mail size={12} /> Seu E-mail
                  </label>
                  <input
                    type="email"
                    required
                    value={userEmail}
                    onChange={e => setUserEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:border-brand-tactical focus:ring-1 focus:ring-brand-tactical outline-none transition-all"
                    placeholder="Para receber o comprovante e acesso"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest flex items-center gap-2">
                    <Phone size={12} /> WhatsApp (Opcional)
                  </label>
                  <input
                    type="tel"
                    value={userWhatsApp}
                    onChange={e => setUserWhatsApp(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/30 focus:border-brand-tactical focus:ring-1 focus:ring-brand-tactical outline-none transition-all"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                
                <button 
                  type="submit"
                  className="w-full bg-brand-tactical text-black font-bold uppercase tracking-widest text-[11px] py-4 rounded-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                >
                  Continuar para Pagamento <Lock size={14} />
                </button>
              </form>
            ) : (
              <div id="paymentBrick_container" className="lux-brick-midnight" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

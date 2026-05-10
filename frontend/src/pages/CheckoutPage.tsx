import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, CheckCircle2, RefreshCw, Clock, Lock, Image as ImageIcon, Printer, ShoppingBag, Copy, Check, MapPin } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Navbar } from "../components/Navbar";


import { QRCodeSVG } from "qrcode.react";

import { API } from "../lib/api";
import { AuthContext } from "../contexts/AuthContextBase";
import { useContext } from "react";
import { useCart } from "../hooks/useCart";

interface OrderEvent {
  id: string;
  slug?: string;
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
  manualType?: string | null;
  isGuestOrder?: boolean;
  deliveryType?: string;
  shippingAddress?: unknown;
  shippingFee?: number | string;
  internalNotes?: string | null;
  items?: {
    id: string;
    price: number;
    quantity: number;
    media?: { shortId: string; url: string };
    printProduct?: { name: string; sku: string };
  }[];
}

interface MPFormData {
  payer: {
    email: string;
    identification?: { number: string; type: string };
  };
  token?: string;
  installments?: number;
  payment_method_id?: string;
  [key: string]: unknown;
}

interface MPBrickSettings {
  initialization: {
    amount: number;
    payer: { email: string; entityType: string };
  };
  customization: {
    paymentMethods: {
      creditCard: "all";
      bankTransfer: string[];
      maxInstallments: number;
    };
    visual: { style: { theme: "default" | "dark" } };
  };
  callbacks: {
    onReady: () => void;
    onSubmit: (data: { selectedPaymentMethod: string; formData: MPFormData }) => Promise<void>;
    onError: (error: unknown) => void;
  };
}



export const CheckoutPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderIdFromQuery = searchParams.get("orderId");
  const effectiveOrderId = (orderId === "payment" ? null : orderId) || orderIdFromQuery || localStorage.getItem('fs_last_order_id');

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; ticketUrl: string; orderId: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixSecondsLeft, setPixSecondsLeft] = useState(30 * 60); // 30 min
  const [pollingStatus, setPollingStatus] = useState<"idle" | "polling" | "found">("idle");
  const [showItems, setShowItems] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const brickController = useRef<{ unmount: () => void } | null>(null);
  const initializationStarted = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user: authUser, login: authLogin, register: authRegister, loading: authGlobalLoading } = useContext(AuthContext)!;
  const { digitalPhotos, physicalItems, totalPrice, clearCart } = useCart();
  console.log("[Checkout] Component Mounting...", { orderId, orderIdFromQuery, effectiveOrderId, hasAuthUser: !!authUser, authGlobalLoading });

  // Estados de Autenticação Tática
  const [authStep, setAuthStep] = useState<'loading' | 'required' | 'login' | 'register' | 'authorized'>('loading');
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [localAuthError, setLocalAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Estados de Logística
  const [shippingData, setShippingData] = useState({
    cep: "",
    street: "",
    number: "",
    neighborhood: "",
    city: "",
    state: "",
    complement: ""
  });
  const [isShippingLoading, setIsShippingLoading] = useState(false);
  interface ShippingOption {
    id: string;
    name: string;
    price: number;
    currency: string;
    deliveryTimeDays: number;
  }

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

  // ── Carrega o pedido ─────────────────────────────────────────────────────────
  useEffect(() => {
    if (!effectiveOrderId) {
      Promise.resolve().then(() => {
        setLoading(false);
        setError("Protocolo de pagamento não identificado.");
      });
      return;
    }
    API.get(`/public/orders/${effectiveOrderId}`)
      .then(({ data }) => {
        setOrder(data);
        // Pre-fill shipping if available in the order record
        if (data.shippingAddress) {
          try {
            const addr = typeof data.shippingAddress === 'string' ? JSON.parse(data.shippingAddress) : data.shippingAddress;
            if (typeof addr === 'object' && addr !== null) {
              setShippingData(prev => ({
                ...prev,
                cep: addr.cep || prev.cep,
                street: addr.street || addr.logradouro || addr.rua || prev.street,
                number: addr.number || addr.numero || prev.number,
                city: addr.city || addr.localidade || prev.city,
                state: addr.state || addr.uf || prev.state,
                complement: addr.complement || prev.complement
              }));
            } else if (typeof data.shippingAddress === 'string' && data.shippingAddress.length > 5) {
               // Fallback for simple string addresses
               setShippingData(prev => ({ ...prev, street: data.shippingAddress }));
            }
          } catch {
            if (typeof data.shippingAddress === 'string' && data.shippingAddress.length > 5) {
               setShippingData(prev => ({ ...prev, street: data.shippingAddress }));
            }
          }
        }
      })
      .catch(() => setError("Não foi possível carregar os detalhes do pedido."))
      .finally(() => setLoading(false));
  }, [effectiveOrderId]);

  const loadRegisteredAddress = async () => {
    try {
      setIsShippingLoading(true);
      const { data } = await API.get("/profissional/me");
      const user = data.user;
      
      if (user && user.address) {
        const parts = user.address.split('|');
        if (parts.length >= 6) {
          setShippingData({
            cep: parts[0] || "",
            street: parts[1] || "",
            number: parts[2] || "",
            neighborhood: parts[3] || "",
            city: parts[4] || "",
            state: parts[5] || "",
            complement: parts[6] || ""
          });
          return;
        } else {
          setShippingData(prev => ({ ...prev, street: user.address }));
        }
      }
      
      const lastAddr = localStorage.getItem("fs_last_shipping");
      if (lastAddr) {
        setShippingData(JSON.parse(lastAddr));
      }
    } catch (err) {
      console.error("Erro ao carregar endereço:", err);
      try {
         const { data: authData } = await API.get("/auth/me");
         if (authData?.user?.address) {
            const parts = authData.user.address.split('|');
            if (parts.length >= 6) {
              setShippingData({
                cep: parts[0] || "", street: parts[1] || "", number: parts[2] || "",
                neighborhood: parts[3] || "", city: parts[4] || "", state: parts[5] || "", complement: parts[6] || ""
              });
            }
         }
      } catch { /* generic auth fallback failed */ }
    } finally {
      setIsShippingLoading(false);
    }
  };

  // ── Controle de Autenticação (Bypass para Guest Checkout) ────────────────────
  useEffect(() => {
    let isMounted = true;
    console.log("[Checkout] useEffect auth check:", { loading, authGlobalLoading, hasOrder: !!order, hasUser: !!authUser });
    
    if (loading || authGlobalLoading || !order) return;

    // SE FOR GUEST ORDER (Magic Link), AUTORIZA DIRETO!
    if (order.isGuestOrder) {
      console.log("[Checkout] Authorized via Guest Order");
      setAuthStep('authorized');
      return;
    }

    // Se já está logado, autoriza
    if (authUser) {
      console.log("[Checkout] Authorized via Global AuthContext:", authUser.email);
      setAuthStep('authorized');
      return;
    }

    // Se não está logado, verifica se o e-mail do pedido tem conta
    const verifyAuth = async () => {
      try {
        const { data } = await API.get(`/public/auth/check?email=${order.buyerEmail}`);
        if (!isMounted) return;
        if (data.exists) {
          setAuthStep('login');
        } else {
          setAuthStep('register');
        }
      } catch (err) {
        if (!isMounted) return;
        console.error("Erro ao verificar auth:", err);
        setAuthStep('register');
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, [loading, order, authUser, authGlobalLoading]);

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || password.length < 6) {
      setLocalAuthError("A senha deve ter pelo menos 6 caracteres.");
      return;
    }
    setAuthLoading(true);
    setLocalAuthError("");

    const targetEmail = order!.buyerEmail || email;
    if (!targetEmail) {
      setLocalAuthError("O e-mail é obrigatório.");
      setAuthLoading(false);
      return;
    }

    try {
      if (authStep === 'login') {
        try {
          await authLogin(targetEmail, password);
        } catch (loginErr: unknown) {
          const axiosError = loginErr as { response?: { status: number, data?: { error?: string } } };
          // Se o erro for "usuário não encontrado", tentamos registrar automaticamente
          if (axiosError.response?.status === 404 || axiosError.response?.data?.error?.includes("encontrado")) {
            setAuthStep('register');
            await authRegister(targetEmail, password, order!.contributorName || order!.event.nomeNoivos || "Cliente");
          } else {
            throw loginErr;
          }
        }
      } else {
        await authRegister(targetEmail, password, order!.contributorName || order!.event.nomeNoivos || "Cliente");
      }
      setAuthStep('authorized');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const msg = axiosError.response?.data?.error || "Falha na identificação. Verifique sua senha.";
      setLocalAuthError(msg);
    } finally {
      setAuthLoading(false);
    }
  };

  // ── Lógica de Frete/Logística ───────────────────────────────────────────────
  const handleCepBlur = async () => {
    const cleanCep = shippingData.cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;
    setIsShippingLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setShippingData(prev => ({
          ...prev,
          street: data.logradouro,
          neighborhood: data.bairro,
          city: data.localidade,
          state: data.uf
        }));

        // Busca cotação real no backend
        const { data: quoteData } = await API.get(`/checkout/shipping-quote?cep=${cleanCep}&orderId=${order?.id}`);
        if (quoteData.quotes && quoteData.quotes.length > 0) {
          setShippingOptions(quoteData.quotes);
          setSelectedShipping(quoteData.quotes[0]); // Seleciona o primeiro (geralmente mais barato)
        }
      }
    } catch (err) {
      console.error("Erro ao buscar CEP/Frete:", err);
    } finally {
      setIsShippingLoading(false);
    }
  };


  // ── Polling de status do Pix ─────────────────────────────────────────────────
  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback((pOrderId: string) => {
    if (pollingRef.current) return;
    setPollingStatus("polling");

    pollingRef.current = setInterval(async () => {
      try {
        const { data } = await API.get(`/public/orders/${pOrderId}/check-payment`);
        if (data.status === "APROVADO") {
          stopPolling();
          setPollingStatus("found");
          setPaymentSuccess(true);
        }
      } catch {
        // Continue trying
      }
    }, 4000);
  }, [stopPolling]);

  // Timer effects... (Same as before)
  useEffect(() => {
    if (!pixData) return;
    startPolling(pixData.orderId);
    const timer = setInterval(() => {
      setPixSecondsLeft((s: number) => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { clearInterval(timer); stopPolling(); };
  }, [pixData, startPolling, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  useEffect(() => {
    if (!paymentSuccess || !order) return;
    
    // Limpa estado local após sucesso
    const slug = order.event.slug || order.event.id;
    localStorage.removeItem(`fs_order_${slug}`);
    localStorage.removeItem(`fs_cart_${order.event.id}`);

    const timer = setTimeout(() => {
       if (order.eventId === "FRANCHISE_SHOP") {
         navigate("/profissional?tab=franquia");
       } else {
         navigate(`/minha-conta?orderId=${order.id}`);
       }
    }, 5000);
    return () => clearTimeout(timer);
  }, [paymentSuccess, order, navigate]);

  const handleManualCouponSubmit = async () => {
    if (!couponCode || !order) return;
    setApplyingCoupon(true);
    try {
      const { data } = await API.post("/checkout/payment", {
        eventId: order.event?.id || order.eventId,
        userId: order.clienteId || null,
        orderId: order.id,
        email: order.buyerEmail || "cliente@fotosegundo.com.br",
        shippingAddress: order.deliveryType === 'SHIPPING' ? shippingData : null,
        shippingFee: selectedShipping?.price || 0,
        shippingMethod: selectedShipping?.name || null,
        couponCode
      });

      if (data.hasPaid || data.method === "FREE") {
        setPaymentSuccess(true);
      } else {
        alert("Cupom aplicado, mas valor ainda restante. Por favor, pague via Mercado Pago (Lógica Parcial pendente).");
      }
    } catch (err: unknown) {
      console.error(err);
      alert((err as { response?: { data?: { error?: string } } }).response?.data?.error || "Cupom inválido ou não atingiu 100% de desconto.");
    } finally {
      setApplyingCoupon(false);
    }
  };

  // ── MP Bricks Initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (!order || pixData || paymentSuccess || loading || authStep !== 'authorized' || initializationStarted.current) return;
    
    // Se for SHIPPING e não preencheu endereço, não renderiza brick ainda
    if (order.deliveryType === 'SHIPPING' && !shippingData.street) return;

    const mpPublicKey = "APP_USR-18f8ccc4-8ed4-4f99-bb6d-e333d026e578";

    let isMounted = true;
    let controller: { unmount: () => void } | null = null;

    const renderPaymentBrick = async () => {
      // Polling for MercadoPago SDK (Max 15s)
      let attempts = 0;
      const mpGlobal = window as unknown as { 
        MercadoPago: new (key: string, options: Record<string, unknown>) => { 
          bricks: () => { 
            create: (brick: string, container: string, settings: MPBrickSettings) => Promise<{ unmount: () => void }> 
          } 
        } 
      };
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
          amount: Number(order.amount) - Number(order.shippingFee || 0) + Number(selectedShipping?.price || 0),
          payer: { email: order.buyerEmail || "cliente@fotosegundo.com.br", entityType: "individual" },
        },
        customization: {
          paymentMethods: { creditCard: "all", bankTransfer: ["pix"], maxInstallments: 12 },
          visual: { style: { theme: "dark" } },
        },
        callbacks: {
          onReady: () => {},
          onSubmit: async ({ formData }) => {
            try {
              const { data } = await API.post("/checkout/payment", {
                eventId: order.event?.id || order.eventId,
                userId: order.clienteId || null,
                orderId: order.id,
                email: formData.payer.email,
                cpf: formData.payer.identification?.number,
                cardToken: formData.token,
                installments: formData.installments,
                paymentMethodId: formData.payment_method_id,
                shippingAddress: order.deliveryType === 'SHIPPING' ? shippingData : null,
                shippingFee: selectedShipping?.price || 0,
                shippingMethod: selectedShipping?.name || null
              });
              
              // Salva último endereço para conveniência futura
              if (order.deliveryType === 'SHIPPING' && shippingData.cep) {
                localStorage.setItem("fs_last_shipping", JSON.stringify(shippingData));
              }

              if (data.hasPaid) {
                setPaymentSuccess(true);
              } else if (data.qr_code) {
                setPixData({
                  qrCode: data.qr_code,
                  qrCodeBase64: data.qr_code_base64,
                  ticketUrl: data.ticket_url,
                  orderId: data.orderId || order.id,
                });
              }
            } catch {
              alert("Erro ao processar pagamento.");
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
      if (controller) {
        controller.unmount();
      } else if (brickController.current) {
        brickController.current.unmount();
      }
      brickController.current = null;
    };
  }, [order, pixData, paymentSuccess, loading, authStep, shippingData, selectedShipping]);

  // ── Render Helpers ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <Helmet>
        <title>Checkout | Foto Segundo</title>
      </Helmet>
      <div className="text-[10px] font-black tracking-[0.5em] text-brand-tactical animate-pulse uppercase">Protocolo Midnight Seguro...</div>
    </div>
  );

  // Empty Cart State: No protocol and no items
  if (!effectiveOrderId && digitalPhotos.length === 0 && physicalItems.length === 0) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="space-y-8 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
            <div className="absolute inset-0 bg-white/5 blur-2xl rounded-full" />
            <ShoppingBag size={48} className="text-theme-text-muted" strokeWidth={1} />
          </div>
          <div className="space-y-4">
            <h2 className="text-3xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter leading-none">
              Seu Carrinho <br/> está Vazio
            </h2>
            <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
              Explore nossa vitrine e selecione as memórias que deseja eternizar.
            </p>
          </div>
          <div className="pt-8">
            <button 
              onClick={() => navigate("/")}
              className="w-full py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all italic"
            >
              Voltar para a Vitrine
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Recovery Mode: No effectiveOrderId but items in cart
  if (!effectiveOrderId && (digitalPhotos.length > 0 || physicalItems.length > 0)) {
    const firstEventId = digitalPhotos[0]?.eventId || physicalItems[0]?.eventId;
    
    const handleGenerateOrder = async () => {
      setLoading(true);
      try {
        const { data } = await API.post("/checkout/pending", {
          eventId: firstEventId,
          userId: authUser?.id,
          email: authUser?.email || "cliente@fotosegundo.com.br",
          cart: digitalPhotos.filter(p => p.eventId === firstEventId).map(p => p.shortId),
          physicalItems: physicalItems.filter(p => p.eventId === firstEventId).map(i => ({
            id: i.productId,
            quantity: i.quantity,
            selectedPhotos: i.selectedPhotos
          }))
        });
        localStorage.setItem('fs_last_order_id', data.orderId);
        navigate(`/checkout/${data.orderId}`);
        window.location.reload(); // Force reload to trigger order fetch
      } catch (err) {
        console.error("Recovery failed:", err);
        setError("Não foi possível processar seu carrinho. Tente voltar ao evento.");
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-8 text-center">
        <div className="space-y-8 max-w-lg animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
            <div className="absolute inset-0 bg-brand-tactical/20 blur-2xl rounded-full" />
            <RefreshCw size={40} className="text-brand-tactical animate-spin-slow" />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter leading-none">
              Recuperar Carrinho
            </h2>
            <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-[0.2em] leading-relaxed max-w-sm mx-auto">
              Identificamos itens ativos na sua sessão. Deseja gerar um novo protocolo de pagamento para finalizar sua compra?
            </p>
          </div>
          
          <div className="bg-theme-bg-muted/30 border border-theme-border/40 p-6 space-y-4 text-left">
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-theme-text-muted">
               <span>Itens Digitais</span>
               <span className="text-white">{digitalPhotos.length}</span>
             </div>
             <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-theme-text-muted">
               <span>Itens Físicos</span>
               <span className="text-white">{physicalItems.length}</span>
             </div>
             <div className="h-px bg-theme-border/40" />
             <div className="flex justify-between items-center">
               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-tactical">Estimativa Total</span>
               <span className="text-2xl font-heading font-black text-white italic">R$ {totalPrice(15).toFixed(2)}</span>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button 
              onClick={() => { clearCart(); navigate("/"); }}
              className="py-5 border border-white/10 text-[10px] font-black uppercase tracking-[0.4em] hover:bg-red-500/10 hover:text-red-500 transition-all italic"
            >
              Limpar e Sair
            </button>
            <button 
              onClick={handleGenerateOrder}
              className="py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all italic shadow-[0_20px_40px_rgba(20,184,166,0.2)]"
            >
              Finalizar Agora
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) return (
    <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-8 text-center">
      <div className="space-y-6 max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
        <h2 className="text-4xl md:text-5xl font-heading font-black text-red-500 uppercase italic tracking-tighter leading-none">
          Protocolo não <br/> localizado
        </h2>
        <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-[0.2em] leading-relaxed max-w-xs mx-auto">
          {error || "Não conseguimos identificar seu protocolo de pagamento ativo."}
        </p>
        <div className="pt-8">
          <button 
            onClick={() => navigate("/")}
            className="w-full py-5 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-brand-tactical hover:text-black transition-all italic shadow-2xl rounded-2xl"
          >
            Voltar para a Vitrine
          </button>
        </div>
      </div>
    </div>
  );


  if (paymentSuccess) {
    return (
      <div className="min-h-screen bg-theme-bg text-theme-text font-sans flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-xl w-full text-center space-y-8 animate-in fade-in zoom-in duration-700">
            <div className="relative mx-auto w-24 h-24 flex items-center justify-center">
              <div className="absolute inset-0 bg-brand-tactical/20 blur-3xl rounded-full animate-pulse" />
              <CheckCircle2 size={80} className="text-brand-tactical relative z-10" />
            </div>
            <div className="space-y-4">
              <h2 className="text-5xl md:text-6xl font-heading font-black text-white uppercase italic tracking-tighter leading-none">
                Missão <br/> Cumprida
              </h2>
              <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                Seu pagamento foi processado e as memórias foram liberadas em sua conta.
              </p>
            </div>
            <div className="pt-8">
              <button 
                onClick={() => navigate("/minha-conta")}
                className="w-full py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all italic"
              >
                Acessar Minha Galeria
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans flex flex-col">
      <Navbar />
      <div className="flex-1 max-w-7xl mx-auto px-6 py-12 w-full animate-in fade-in duration-700">
        <div className="flex justify-between items-center mb-12 border-b border-theme-border/20 pb-8">
          <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-all flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>
          <img src="/logo.png" alt="Foto Segundo" style={{ height: 16, objectFit: "contain", filter: "var(--logo-filter)" }} />
          <div className="flex items-center gap-2 text-brand-tactical text-[9px] font-black uppercase tracking-widest"><ShieldCheck size={14} /> Checkout Blindado</div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-16 items-start">
          {/* Lado Esquerdo: Resumo e Logística */}
          <div className="space-y-8">
            <div>
              <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] mb-4">Investimento</p>
              <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{order.event?.nomeNoivos}</h1>
              <p className="text-zinc-500 text-sm mt-4 font-medium">{order.manualType || "Seleção Digital de Alta Resolução"}</p>
            </div>

            <div className="space-y-4">
              <div 
                 className="flex items-center justify-between cursor-pointer group bg-white/5 border border-white/5 p-4 rounded-xl"
                 onClick={() => setShowItems(!showItems)}
              >
                 <p className="text-[9px] font-black text-zinc-500 group-hover:text-white transition-colors uppercase tracking-widest italic">
                   Resumo da Seleção ({order.items?.length || 0} itens)
                 </p>
                 <div className="w-6 h-6 rounded-md border border-white/10 flex items-center justify-center group-hover:border-white/30 group-hover:bg-white/5 transition-all text-white">
                    {showItems ? "−" : "+"}
                 </div>
              </div>
              {showItems && (
                <div className="space-y-2 animate-in slide-in-from-top-2 fade-in duration-300">
                  {order.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-zinc-900 border border-white/10 flex items-center justify-center rounded-lg overflow-hidden">
                          {item.media?.url ? (
                             <img src={item.media.url} alt="Thumb" className="w-full h-full object-cover" />
                          ) : item.media ? (
                             <ImageIcon size={14} className="text-brand-tactical" />
                          ) : (
                             <Printer size={14} className="text-brand-tactical" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-white uppercase italic">
                            {item.media ? `Foto #${item.media.shortId}` : item.printProduct?.name}
                          </span>
                          <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">
                            {item.media ? "Digital HD" : "Produto Físico"}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-black italic text-white">R$ {Number(item.price).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Logística Condicional */}
            {order.deliveryType === 'SHIPPING' && authStep === 'authorized' && (
              <div className="animate-in slide-in-from-top-4 duration-500 space-y-6 p-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
                 <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                       <div className="h-0.5 w-6 bg-brand-tactical" />
                       <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">Endereço de Entrega</p>
                    </div>
                    <button 
                       type="button"
                       onClick={loadRegisteredAddress}
                       className="text-[8px] font-black text-white/40 hover:text-brand-tactical transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                       <MapPin size={10} /> Usar endereço de cadastro
                    </button>
                 </div>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    <div className="col-span-2 md:col-span-2">
                      <input 
                        placeholder="CEP" 
                        value={shippingData.cep}
                        onBlur={handleCepBlur}
                        onChange={e => setShippingData({...shippingData, cep: e.target.value})}
                        className="fs-input font-mono bg-theme-bg-field"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-3">
                      <input 
                        placeholder="Logradouro" 
                        value={shippingData.street}
                        disabled={isShippingLoading}
                        onChange={e => setShippingData({...shippingData, street: e.target.value})}
                        className="fs-input bg-theme-bg-field"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <input 
                        placeholder="Nº" 
                        value={shippingData.number}
                        onChange={e => setShippingData({...shippingData, number: e.target.value})}
                        className="fs-input bg-theme-bg-field"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-2">
                      <input 
                        placeholder="Bairro" 
                        value={shippingData.neighborhood}
                        onChange={e => setShippingData({...shippingData, neighborhood: e.target.value})}
                        className="fs-input bg-theme-bg-field"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <input 
                        placeholder="Cidade" 
                        value={shippingData.city}
                        readOnly
                        className="fs-input bg-theme-bg-field opacity-50"
                      />
                    </div>
                    <div className="col-span-1 md:col-span-1">
                      <input 
                        placeholder="UF" 
                        value={shippingData.state}
                        readOnly
                        className="fs-input bg-theme-bg-field opacity-50"
                      />
                    </div>
                    <div className="col-span-2 md:col-span-1">
                      <input 
                        placeholder="Compl." 
                        value={shippingData.complement}
                        onChange={e => setShippingData({...shippingData, complement: e.target.value})}
                        className="fs-input bg-theme-bg-field"
                      />
                    </div>
                  </div>
                 {shippingOptions.length > 0 && (
                   <div className="space-y-3 mt-6">
                     <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest italic">Opções de Envio</p>
                     {shippingOptions.map(opt => (
                       <button
                         key={opt.id}
                         onClick={() => setSelectedShipping(opt)}
                         className={`w-full p-4 flex justify-between items-center border rounded-xl transition-all ${selectedShipping?.id === opt.id ? 'border-brand-tactical bg-brand-tactical/10' : 'border-zinc-800 hover:border-zinc-700'}`}
                       >
                         <div className="text-left">
                           <p className="text-[10px] font-black uppercase text-white">{opt.name}</p>
                           <p className="text-[8px] text-zinc-500 uppercase">Até {opt.deliveryTimeDays} dias úteis</p>
                         </div>
                         <span className="text-xs font-black italic text-brand-tactical">R$ {opt.price.toFixed(2)}</span>
                       </button>
                     ))}
                   </div>
                 )}
              </div>
            )}

            {/* Totais */}
            <div className="p-8 bg-theme-bg-muted border border-theme-border/20 rounded-3xl space-y-6">
              <div className="flex justify-between items-center text-[10px] font-black text-theme-text-muted uppercase tracking-widest">
                <span>Subtotal</span>
                <span className="text-theme-text">R$ {(Number(order.amount) - Number(order.shippingFee || 0)).toFixed(2)}</span>
              </div>
              {order.deliveryType === 'SHIPPING' && (
                <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  <span>Frete</span>
                  <span className={(Number(order.shippingFee || 0)) === 0 ? "text-emerald-500" : "text-white"}>
                    {(Number(order.shippingFee || 0)) === 0 ? "GRÁTIS" : `R$ ${Number(order.shippingFee || 0).toFixed(2)}`}
                  </span>
                </div>
              )}
              <div className="pt-6 border-t border-white/10 flex justify-between items-end">
                <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Total</span>
                <span className="text-4xl font-black italic tracking-tighter text-theme-text">R$ {(Number(order.amount || 0) - Number(order.shippingFee || 0) + Number(selectedShipping?.price || 0)).toFixed(2)}</span>
              </div>

              {order.internalNotes?.includes("[ROTEAMENTO]") && (
                <div className="mt-4 p-4 bg-brand-tactical/5 border border-brand-tactical/20 rounded-xl">
                  <div className="flex items-center gap-2 text-[8px] font-black text-brand-tactical uppercase tracking-widest italic">
                    <ShieldCheck size={12} /> Produção Regional Ativada
                  </div>
                  <p className="text-[10px] text-zinc-400 mt-1 font-bold">
                    {order.internalNotes.split("\n").find(l => l.includes("[ROTEAMENTO]"))?.replace("[ROTEAMENTO] ", "")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Lado Direito: Pagamento */}
          <div className="space-y-8 lg:border-l lg:border-white/5 lg:pl-16">
            <div className="text-center lg:text-left">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Finalizar Pagamento</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed max-w-xs mx-auto lg:mx-0">
                Sua transação é processada em ambiente tático com criptografia de ponta.
              </p>
            </div>

            {authStep === 'authorized' ? (
              <div className="space-y-8">
                <div className="space-y-4 mb-4">
                  <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">Tem um Cupom Especial?</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      placeholder="Código do Cupom"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      className="fs-input bg-theme-bg-field uppercase flex-1"
                    />
                    {couponCode && (
                       <button 
                         onClick={handleManualCouponSubmit}
                         disabled={applyingCoupon}
                         className="px-6 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all italic disabled:opacity-50"
                       >
                         {applyingCoupon ? "Aplicando..." : "Aplicar"}
                       </button>
                    )}
                  </div>
                </div>

                {!pixData && (
                  <div id="paymentBrick_container" className="lux-brick-midnight min-h-[400px]" />
                )}

                {pixData && (
                  <div className="space-y-8 animate-in zoom-in-95 duration-500 text-center">
                    <div className="flex flex-col items-center gap-3">
                       <div className="flex items-center gap-2 text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em] italic animate-pulse">
                         <RefreshCw size={12} className="animate-spin" /> {pollingStatus === "polling" ? "Aguardando Pagamento..." : "Verificando..."}
                       </div>
                       <div className="bg-white p-4 inline-block rounded-3xl shadow-2xl border-8 border-zinc-900">
                         {pixData.qrCodeBase64 ? (
                           <img src={`data:image/png;base64,${pixData.qrCodeBase64}`} alt="Pix" className="w-60 h-60" />
                         ) : (
                           <QRCodeSVG value={pixData.qrCode} size={240} level="H" includeMargin />
                         )}
                       </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-3 text-zinc-500 mb-4">
                        <Clock size={14} />
                        <span className="text-[10px] font-black tabular-nums uppercase tracking-widest">Expira em {Math.floor(pixSecondsLeft / 60)}:{(pixSecondsLeft % 60).toString().padStart(2, '0')}</span>
                      </div>
                      
                      <button 
                         onClick={() => {
                           navigator.clipboard.writeText(pixData.qrCode);
                           setCopied(true);
                           setTimeout(() => setCopied(false), 2000);
                         }}
                         className={`w-full py-5 text-[10px] font-black uppercase tracking-widest transition-all border rounded-2xl flex items-center justify-center gap-3 ${copied ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-zinc-900 border-white/5 text-white hover:border-brand-tactical shadow-2xl'}`}
                      >
                         {copied ? <Check size={14} /> : <Copy size={14} />}
                         {copied ? "CÓDIGO COPIADO!" : "COPIAR CÓDIGO PIX"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <form onSubmit={handleAuthSubmit} className="space-y-6">
                 <div className="text-center p-8 bg-zinc-900/50 border border-white/5 rounded-3xl">
                    <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest mb-4">
                      {authStep === 'login' ? 'Identificação Necessária' : 'Crie sua Conta'}
                    </p>
                    <input 
                      type="email"
                      value={order.buyerEmail || email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!!order.buyerEmail}
                      className="fs-input mb-4 text-center bg-theme-bg-field"
                      placeholder="seu@email.com"
                    />
                    <input 
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="fs-input text-center bg-theme-bg-field"
                      placeholder="Sua Senha"
                      autoFocus
                    />
                    {localAuthError && <p className="text-[9px] text-red-500 font-black mt-4 uppercase tracking-widest">{localAuthError}</p>}
                    <button 
                      type="submit"
                      className="w-full mt-8 py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] hover:bg-white transition-all rounded-2xl italic"
                    >
                      {authLoading ? "CONECTANDO..." : "Continuar para Pagamento"}
                    </button>
                 </div>
              </form>
            )}
            
            <div className="pt-8 border-t border-white/5 flex items-center justify-between opacity-30">
               <img src="https://static.mlstatic.com/org-img/vendors/br/logo-mercado-pago.png" alt="MP" className="h-3 grayscale brightness-200" />
               <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"><Lock size={10} /> 256-bit SSL</div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fs-input {
          width: 100%;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.05);
          padding: 1rem 1.5rem;
          color: white;
          font-size: 11px;
          text-transform: uppercase;
          font-weight: 900;
          letter-spacing: 0.1em;
          transition: all 0.3s;
        }
        .fs-input:focus {
          border-color: #14b8a6;
          outline: none;
          background: rgba(20,184,166,0.05);
        }
      `}</style>
    </div>
  );
};

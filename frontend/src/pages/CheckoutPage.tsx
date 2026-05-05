import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, CheckCircle2, Clock, RefreshCw, Lock, Image as ImageIcon, Printer } from "lucide-react";


import { QRCodeSVG } from "qrcode.react";

import { API } from "../lib/api";
import { AuthContext } from "../contexts/AuthContextBase";
import { useContext } from "react";

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
  const effectiveOrderId = (orderId === "payment" ? null : orderId) || orderIdFromQuery;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pixData, setPixData] = useState<{ qrCode: string; qrCodeBase64: string; ticketUrl: string; orderId: string } | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixSecondsLeft, setPixSecondsLeft] = useState(30 * 60); // 30 min
  const [pollingStatus, setPollingStatus] = useState<"idle" | "polling" | "found">("idle");
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  const brickController = useRef<{ unmount: () => void } | null>(null);
  const initializationStarted = useRef(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { user: authUser, login: authLogin, register: authRegister } = useContext(AuthContext)!;

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
    complement: "",
    city: "",
    state: ""
  });
  const [isShippingLoading, setIsShippingLoading] = useState(false);

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
      })
      .catch(() => setError("Não foi possível carregar os detalhes do pedido."))
      .finally(() => setLoading(false));
  }, [effectiveOrderId]);

  // ── Controle de Autenticação (Bypass para Guest Checkout) ────────────────────
  useEffect(() => {
    if (loading || !order) return;

    // SE FOR GUEST ORDER (Magic Link), AUTORIZA DIRETO!
    if (order.isGuestOrder) {
      setAuthStep('authorized');
      return;
    }

    // Se já está logado, autoriza
    if (authUser) {
      setAuthStep('authorized');
      return;
    }

    // Se não está logado, verifica se o e-mail do pedido tem conta
    const verifyAuth = async () => {
      try {
        const { data } = await API.get(`/public/auth/check?email=${order.buyerEmail}`);
        if (data.exists) {
          setAuthStep('login');
        } else {
          setAuthStep('register');
        }
      } catch (err) {
        console.error("Erro ao verificar auth:", err);
        setAuthStep('register');
      }
    };

    verifyAuth();
  }, [loading, order, authUser]);

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
        } catch (loginErr: any) {
          // Se o erro for "usuário não encontrado", tentamos registrar automaticamente
          if (loginErr.response?.status === 404 || loginErr.response?.data?.error?.includes("encontrado")) {
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
    if (shippingData.cep.replace(/\D/g, "").length !== 8) return;
    setIsShippingLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${shippingData.cep}/json/`);
      const data = await resp.json();
      if (!data.erro) {
        setShippingData(prev => ({
          ...prev,
          street: data.logradouro,
          city: data.localidade,
          state: data.uf
        }));
      }
    } catch {
      console.error("Erro ao buscar CEP");
    } finally {
      setIsShippingLoading(false);
    }
  };

  // ── Baixa em Dinheiro (Admin/Franqueado) ────────────────────────────────────
  const handleCashPayment = async () => {
    if (!confirm("Confirmar recebimento em dinheiro e liberar acesso/impressão agora?")) return;
    setAuthLoading(true);
    try {
      await API.post(`/public/orders/${order!.id}/manual-payment`, {
        method: "CASH"
      });
      setPaymentSuccess(true);
    } catch {
      console.error("Erro ao processar pagamento manual");
      alert("Erro ao confirmar pagamento manual.");
    } finally {
      setAuthLoading(false);
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
      setPixSecondsLeft(s => {
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

    const timer = setInterval(() => {
      setRedirectCountdown(c => {
        if (c <= 1) {
          clearInterval(timer);
          navigate(`/minha-conta?orderId=${order.id}`);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentSuccess, order, navigate]);

  // ── MP Bricks Initialization ────────────────────────────────────────────────
  useEffect(() => {
    if (!order || pixData || paymentSuccess || loading || authStep !== 'authorized' || initializationStarted.current) return;
    
    // Se for SHIPPING e não preencheu endereço, não renderiza brick ainda
    if (order.deliveryType === 'SHIPPING' && !shippingData.street) return;

    initializationStarted.current = true;
    const mpPublicKey = "APP_USR-18f8ccc4-8ed4-4f99-bb6d-e333d026e578";
    const win = window as unknown as Record<string, { new (k: string, o: { locale: string }): { bricks: () => { create: (a: string, b: string, c: unknown) => Promise<{ unmount: () => void }> } } }>;
    if (!win.MercadoPago) {
      initializationStarted.current = false;
      return;
    }

    const renderPaymentBrick = async () => {
      await new Promise(resolve => setTimeout(resolve, 100));
      const container = document.getElementById("paymentBrick_container");
      if (!container) {
        initializationStarted.current = false;
        return;
      }
      container.innerHTML = "";
      const mp = new win.MercadoPago(mpPublicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      const settings: MPBrickSettings = {
        initialization: {
          amount: Number(order.amount),
          payer: { email: order.buyerEmail || "cliente@fotosegundo.com.br", entityType: "individual" },
        },
        customization: {
          paymentMethods: { creditCard: "all", bankTransfer: ["pix"], maxInstallments: 12 },
          visual: { style: { theme: "dark" } },
        },
        callbacks: {
          onReady: () => console.log("[Payment Brick] Ready"),
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
                shippingAddress: order.deliveryType === 'SHIPPING' ? shippingData : null
              });

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
            console.error("[Payment Brick] Error:", error);
            initializationStarted.current = false;
          },
        },
      };

      brickController.current = await bricksBuilder.create("payment", "paymentBrick_container", settings);
    };

    renderPaymentBrick();
    return () => {
      if (brickController.current) { brickController.current.unmount(); brickController.current = null; }
      initializationStarted.current = false;
    };
  }, [order, pixData, paymentSuccess, loading, authStep, shippingData]);

  // ── Render Helpers ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="text-[10px] font-black tracking-[0.5em] text-brand-tactical animate-pulse uppercase">Protocolo Midnight Seguro...</div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
      <h2 className="text-4xl font-black text-red-500 italic mb-4">FALHA NO PROTOCOLO</h2>
      <p className="text-xs uppercase tracking-widest text-zinc-500 mb-8 max-w-xs">{error || "Pedido não encontrado."}</p>
      <button onClick={() => navigate("/")} className="px-10 py-4 border border-zinc-800 text-[10px] font-black uppercase tracking-widest hover:bg-theme-card transition-all">Voltar para a home</button>
    </div>
  );

  const eventTarget = order.event?.id || order.eventId;

  if (paymentSuccess) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="relative mx-auto mb-10 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-emerald-500/10 animate-ping" />
          <div className="relative w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/30">
            <CheckCircle2 size={56} className="text-emerald-500" strokeWidth={1} />
          </div>
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-emerald-500 mb-4">PAGAMENTO CONFIRMADO</p>
        <h1 className="text-4xl md:text-6xl font-black text-theme-text italic tracking-tighter mb-6 uppercase">Acesso Liberado</h1>
        <p className="text-xs text-zinc-500 mb-10">Suas memórias estão prontas. Redirecionando em {redirectCountdown}s...</p>
        <button onClick={() => navigate(`/e/${eventTarget}`)} className="w-full py-5 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">ACESSAR GALERIA AGORA</button>
      </div>
    </div>
  );


  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <nav className="h-20 flex items-center justify-between px-8 border-b border-zinc-900 sticky top-0 z-50 bg-theme-bg/90 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>
        <img src="/logo-fs.png" alt="Foto Segundo" className="h-5" />
        <div className="flex items-center gap-2 text-brand-tactical text-[9px] font-black uppercase tracking-widest"><ShieldCheck size={14} /> Checkout Blindado</div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Lado Esquerdo: Resumo e Logística */}
        <div className="space-y-8">
          <div>
            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] mb-4">Investimento</p>
            <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none">{order.event?.nomeNoivos}</h1>
            <p className="text-zinc-500 text-sm mt-4">Memórias Eternizadas no Papel · {order.manualType || "Álbum Digital Completo"}</p>
          </div>

          <div className="space-y-4">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest italic">Resumo da Seleção</p>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-white/5 border border-white/5">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-900 border border-white/10 flex items-center justify-center">
                      {item.media ? <ImageIcon size={14} className="text-brand-tactical" /> : <Printer size={14} className="text-brand-tactical" />}
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
          </div>

          <div className="p-8 bg-theme-bg border border-zinc-900 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical/20" />
            <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-theme-text">R$ {(Number(order.amount) - Number(order.shippingFee || 0)).toFixed(2)}</span>
            </div>
            {order.deliveryType === 'SHIPPING' && (
              <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <span>Frete</span>
                <span className={Number(order.shippingFee) === 0 ? "text-emerald-500" : "text-theme-text"}>
                  {Number(order.shippingFee) === 0 ? "GRÁTIS" : `R$ ${Number(order.shippingFee).toFixed(2)}`}
                </span>
              </div>
            )}
            <div className="pt-6 border-t border-zinc-900 flex justify-between items-end">
              <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em]">Total</span>
              <span className="text-4xl font-black italic tracking-tighter text-theme-text">R$ {Number(order.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Logística Condicional */}
          {order.deliveryType === 'SHIPPING' && authStep === 'authorized' && (
            <div className="animate-in slide-in-from-top-4 duration-500 space-y-6 p-8 bg-theme-bg border border-brand-tactical/20">
               <div className="flex items-center gap-3">
                  <div className="h-0.5 w-6 bg-brand-tactical" />
                  <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest">Endereço de Entrega</p>
               </div>
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <input 
                      placeholder="CEP" 
                      value={shippingData.cep}
                      onBlur={handleCepBlur}
                      onChange={e => setShippingData({...shippingData, cep: e.target.value})}
                      className="fs-input font-mono"
                    />
                  </div>
                  <div className="col-span-2">
                    <input 
                      placeholder="Endereço" 
                      value={shippingData.street}
                      disabled={isShippingLoading}
                      onChange={e => setShippingData({...shippingData, street: e.target.value})}
                      className="fs-input opacity-80"
                    />
                  </div>
                  <input 
                    placeholder="Número" 
                    value={shippingData.number}
                    onChange={e => setShippingData({...shippingData, number: e.target.value})}
                    className="fs-input"
                  />
                  <input 
                    placeholder="Cidade" 
                    value={shippingData.city}
                    disabled
                    className="fs-input opacity-50"
                  />
               </div>
               {isShippingLoading && <p className="text-[8px] animate-pulse text-brand-tactical uppercase font-black">Buscando endereço...</p>}
            </div>
          )}

          {/* Botão de Caixa (Dinheiro) */}
          {(authUser?.role === 'ADMIN' || authUser?.role === 'PROFISSIONAL' || authUser?.franchiseProfile) && authStep === 'authorized' && (
            <button 
              onClick={handleCashPayment}
              disabled={authLoading}
              className="w-full py-5 border-2 border-brand-tactical/30 bg-brand-tactical/5 text-brand-tactical text-[10px] font-black uppercase tracking-[0.3em] hover:bg-brand-tactical hover:text-black transition-all"
            >
              {authLoading ? "PROCESSANDO..." : "Confirmar Recebimento em Dinheiro"}
            </button>
          )}
        </div>

        {/* Lado Direito: Auth ou Payment Brick */}
        <div className="lg:border-l lg:border-zinc-900 lg:pl-12">
           <div className="mb-8">
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">Finalizar Pagamento</p>
              <p className="text-[9px] text-zinc-600 uppercase tracking-widest leading-relaxed">Sua transação é processada em ambiente seguro com criptografia de ponta.</p>
           </div>

            {authStep === 'authorized' ? (
              <div className="space-y-8 animate-in fade-in duration-700">
                {order.deliveryType === 'SHIPPING' && !shippingData.street && (
                  <div className="p-10 border border-dashed border-zinc-800 text-center">
                    <p className="text-[10px] text-zinc-600 uppercase font-black italic">Preencha o endereço de entrega para liberar o pagamento.</p>
                  </div>
                )}
                <div className="relative">
                  {/* Container do Brick - Ocultado se houver PIX */}
                  {!pixData && (
                    <div id="paymentBrick_container" className="lux-brick-midnight animate-in fade-in duration-500" />
                  )}

                  {/* QR Code Integrado */}
                  {pixData && (
                    <div className="space-y-8 animate-in zoom-in-95 duration-500 bg-theme-bg relative z-10">
                      <div className="p-6 md:p-10 bg-brand-tactical/5 border border-brand-tactical/20 text-center space-y-8 shadow-2xl">
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center gap-2 text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em] italic">
                            <RefreshCw size={12} className="animate-spin" /> {pollingStatus === "polling" ? "Aguardando Confirmação..." : "Verificando..."}
                          </div>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Escaneie o código abaixo com o app do seu banco</p>
                        </div>
                        
                        <div className="bg-white p-4 inline-block rounded-xl shadow-[0_0_50px_rgba(133,185,172,0.15)] border-4 border-white">
                          {pixData.qrCodeBase64 ? (
                            <img 
                              src={`data:image/png;base64,${pixData.qrCodeBase64}`} 
                              alt="Pix" 
                              width="240"
                              height="240"
                              style={{ width: "240px", height: "240px" }}
                              className="block" 
                            />
                          ) : (
                            <QRCodeSVG 
                              value={String(pixData.qrCode || "invalid")} 
                              size={240}
                              level="H"
                              includeMargin={true}
                            />
                          )}
                        </div>

                        <div className="space-y-4">
                           <div className="flex flex-col gap-3">
                             <button 
                               onClick={() => {
                                 navigator.clipboard.writeText(pixData.qrCode);
                                 setCopied(true);
                                 setTimeout(() => setCopied(false), 2000);
                               }}
                               className={`w-full py-4 text-[10px] font-black uppercase tracking-widest transition-all border flex items-center justify-center gap-3 ${copied ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-theme-bg border-zinc-800 text-theme-text hover:border-brand-tactical'}`}
                             >
                               {copied ? <><CheckCircle2 size={14} /> COPIADO!</> : <><RefreshCw size={14} /> COPIAR CÓDIGO PIX</>}
                             </button>
                             
                             <button 
                               onClick={() => { setPixData(null); initializationStarted.current = false; }}
                               className="w-full py-4 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-white transition-all"
                             >
                               ← ALTERAR MÉTODO DE PAGAMENTO
                             </button>
                           </div>

                           <div className="pt-6 border-t border-zinc-900/50 flex items-center justify-center gap-4 text-zinc-500">
                              <Clock size={14} />
                              <span className="text-[10px] font-black tabular-nums">EXPIRA EM {Math.floor(pixSecondsLeft / 60)}:{(pixSecondsLeft % 60).toString().padStart(2, '0')}</span>
                           </div>
                        </div>
                      </div>

                      <div className="p-6 border border-zinc-900 bg-zinc-900/20 rounded-lg flex items-start gap-4">
                         <Lock size={16} className="text-brand-tactical mt-0.5" />
                         <p className="text-[10px] text-zinc-500 leading-relaxed uppercase tracking-tight">
                           Sua segurança é nossa prioridade. Após o pagamento, o acesso será liberado instantaneamente nesta mesma tela.
                         </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                  <h2 className="text-2xl font-black italic uppercase">Identificação</h2>
                  <p className="text-xs text-zinc-500">{authStep === 'login' ? "Identificamos seu e-mail. Digite sua senha de acesso." : "Defina uma senha para acessar suas fotos após o pagamento."}</p>
                </div>
                <form onSubmit={handleAuthSubmit} className="space-y-4">
                  <input 
                    type="email" 
                    value={order.buyerEmail || email} 
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!!order.buyerEmail} 
                    placeholder="seu@email.com"
                    className={`fs-input ${order.buyerEmail ? 'opacity-50' : ''}`} 
                  />
                  <div className="relative group">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-brand-tactical transition-colors z-10 pointer-events-none">
                      <Lock size={16} />
                    </div>
                    <input 
                      type="password"
                      placeholder="Senha (mín. 6 dígitos)" 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="fs-input"
                      style={{ paddingLeft: '3.5rem' }}
                      required
                    />
                  </div>
                  {localAuthError && <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{localAuthError}</p>}
                  <button 
                    disabled={authLoading}
                    type="submit" 
                    className="w-full py-5 bg-brand-tactical text-black text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 italic"
                  >
                    {authLoading ? "PROCESSANDO..." : "CONTINUAR PARA PAGAMENTO"}
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAuthStep(authStep === 'login' ? 'register' : 'login')}
                    className="w-full text-[9px] font-black text-zinc-500 uppercase tracking-widest hover:text-white transition-all"
                  >
                    {authStep === 'login' ? "NÃO SOU EU / CRIAR NOVA CONTA" : "JÁ TENHO CONTA / FAZER LOGIN"}
                  </button>
                </form>
              </div>
            )}

           <div className="mt-12 pt-8 border-t border-zinc-900 flex items-center justify-between opacity-30">
              <img src="https://static.mlstatic.com/org-img/vendors/br/logo-mercado-pago.png" alt="MP" className="h-3 grayscale brightness-200" />
              <div className="flex items-center gap-2 text-[8px] font-black uppercase tracking-widest"><Lock size={10} /> 256-bit SSL</div>
           </div>
        </div>
      </div>
      
      <style>{`
        .lux-brick-midnight { min-height: 400px; }
        #paymentBrick_container { border-radius: 0 !important; }
        #paymentBrick_container iframe { border-radius: 0 !important; }
      `}</style>
    </div>
  );
};

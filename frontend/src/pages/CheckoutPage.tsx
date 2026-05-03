import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, CheckCircle2, Clock, RefreshCw, Lock } from "lucide-react";


import { API } from "../lib/api";
import { AuthContext } from "../contexts/AuthContextBase";
import { useContext } from "react";

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
  manualType?: string | null;
  isGuestOrder?: boolean;
  deliveryType?: string;
  shippingAddress?: unknown;
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
        await authLogin(targetEmail, password);
      } else {
        await authRegister(targetEmail, password, order!.contributorName || order!.event.nomeNoivos || "Cliente");
      }
      setAuthStep('authorized');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string } } };
      const msg = axiosError.response?.data?.error || "Falha na autenticação. Verifique sua senha.";
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

  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

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

  if (pixData) return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <nav className="h-20 flex items-center justify-between px-8 border-b border-theme-border sticky top-0 z-50 bg-theme-bg/90 backdrop-blur-xl">
        <button onClick={() => navigate(-1)} className="text-[11px] font-black uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-all flex items-center gap-2"><ArrowLeft size={14} /> Voltar</button>
        <img src="/logo-fs.png" alt="Foto Segundo" className="h-5" />
        <div className="flex items-center gap-2 text-brand-tactical text-[11px] font-black uppercase tracking-widest"><ShieldCheck size={14} /> Checkout Blindado</div>
      </nav>
      <div className="max-w-md mx-auto px-6 py-12 space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-3 px-5 py-2.5 bg-brand-tactical/5 border border-brand-tactical/20 text-[11px] font-black uppercase tracking-[0.2em] text-brand-tactical italic">
            <RefreshCw size={12} className="animate-spin" /> {pollingStatus === "polling" ? "Aguardando Confirmação..." : "Verificando..."}
          </div>
        </div>
        <div className="bg-theme-bg-muted border border-theme-border p-8 space-y-8 rounded-sm">
          <div className="text-center space-y-3">
            <h1 className="text-2xl font-black italic tracking-tighter text-theme-text">QUASE LÁ!</h1>
            <p className="text-[11px] text-theme-text-muted uppercase tracking-widest">Complete o pagamento na página do Mercado Pago</p>
          </div>

          {pixData.ticketUrl && (
            <div className="text-center space-y-4">
              <a 
                href={pixData.ticketUrl} 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-3 w-full px-8 py-5 bg-[#00B1EA] text-white text-[12px] font-black uppercase tracking-widest hover:brightness-110 transition-all rounded-sm shadow-lg shadow-[#00B1EA]/20"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Pagar com Pix no Mercado Pago
              </a>
              <p className="text-[9px] text-theme-text-muted uppercase tracking-widest">A página de pagamento abrirá em uma nova aba</p>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-theme-text-muted">
            <Clock size={12} /> <span className="text-[11px] font-black uppercase tracking-widest">Expira em {fmtTimer(pixSecondsLeft)}</span>
          </div>

          <div className="p-5 bg-theme-bg border border-theme-border space-y-3">
             <label className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest opacity-60">Pix Copia e Cola</label>
             <div className="flex items-center gap-4 overflow-hidden">
                <input readOnly value={pixData.qrCode} className="bg-transparent text-[11px] w-full outline-none truncate font-mono text-theme-text-muted" />
                <button onClick={() => { navigator.clipboard.writeText(pixData.qrCode); setCopied(true); setTimeout(() => setCopied(false), 2000); }} className="text-brand-tactical text-[11px] font-black uppercase tracking-widest">{copied ? "COPIADO" : "COPIAR"}</button>
             </div>
          </div>

        </div>
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

          <div className="p-8 bg-theme-bg border border-zinc-900 space-y-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-brand-tactical/20" />
            <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
              <span>Subtotal</span>
              <span className="text-theme-text">R$ {Number(order.amount).toFixed(2)}</span>
            </div>
            {order.deliveryType === 'SHIPPING' && (
              <div className="flex justify-between items-center text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                <span>Frete</span>
                <span className="text-emerald-500">GRÁTIS</span>
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
                <div id="paymentBrick_container" className="lux-brick-midnight" />
             </div>
           ) : (
             <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <div className="space-y-2">
                   <h2 className="text-2xl font-black italic uppercase">{authStep === 'login' ? "Bem-vindo de Volta" : "Sua Nova Conta"}</h2>
                   <p className="text-xs text-zinc-500">{authStep === 'login' ? "Identificamos seu e-mail. Digite sua senha." : "Defina uma senha para acessar suas memórias depois."}</p>
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
                        placeholder="Senha (mín. 6 dígitos)" 
                        className="fs-input" 
                        style={{ paddingLeft: "3.5rem" }}
                        type="password" 
                        autoComplete="current-password"
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        autoFocus
                      />
                    </div>
                   {localAuthError && <p className="text-[9px] text-red-500 font-black uppercase tracking-widest">{localAuthError}</p>}
                   <button type="submit" disabled={authLoading} className="fs-btn w-full bg-white text-theme-text">
                      {authLoading ? "AUTENTICANDO..." : (authStep === 'login' ? "ENTRAR E PAGAR" : "CRIAR CONTA E CONTINUAR")}
                   </button>
                   <button type="button" onClick={() => setAuthStep(s => s === 'login' ? 'register' : 'login')} className="w-full text-[9px] text-zinc-500 font-black uppercase tracking-widest hover:text-brand-tactical">
                      {authStep === 'login' ? "Não tem conta? Registre-se" : "Já tem conta? Faça login"}
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

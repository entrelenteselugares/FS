import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ShieldCheck, ArrowLeft, Copy, CheckCircle2, Clock, RefreshCw, Lock, Mail, Key, User as UserIcon } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { API } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";
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

interface MPMediator {
  bricks: () => {
    create: (type: string, containerId: string, settings: MPBrickSettings) => Promise<{ unmount: () => void }>;
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
  const { theme } = useTheme();
  const { user: authUser, login: authLogin, register: authRegister } = useContext(AuthContext)!;

  // Estados de Autenticação Tática
  const [authStep, setAuthStep] = useState<'loading' | 'required' | 'login' | 'register' | 'authorized'>('loading');
  const [password, setPassword] = useState("");
  const [localAuthError, setLocalAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

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

  // ── Controle de Autenticação ────────────────────────────────────────────────
  useEffect(() => {
    if (loading || !order) return;

    // Se já está logado, autoriza
    if (authUser) {
      setAuthStep('authorized');
      return;
    }

    // Se não está logado, verifica se o e-mail do pedido tem conta
    const verifyAuth = async () => {
      try {
        const { data } = await API.get(`/public/auth/check?email=${order.buyerEmail}`);
        if (data.exists && data.hasAuth) {
          setAuthStep('login');
        } else {
          setAuthStep('register');
        }
      } catch (err) {
        console.error("Erro ao verificar auth:", err);
        setAuthStep('register'); // Fallback para cadastro
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

    try {
      if (authStep === 'login') {
        await authLogin(order!.buyerEmail!, password);
      } else {
        await authRegister(order!.buyerEmail!, password, order!.contributorName || order!.event.nomeNoivos || "Cliente");
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
        // Usa o endpoint que consulta o MP diretamente — não depende de webhook
        const { data } = await API.get(`/public/orders/${pOrderId}/check-payment`);
        if (data.status === "APROVADO") {
          stopPolling();
          setPollingStatus("found");
          setPaymentSuccess(true);
        }
      } catch {
        // Ignora erros de rede e continua tentando
      }
    }, 4000);
  }, [stopPolling]);

  // Quando pixData chega, inicia polling e timer de expiração
  useEffect(() => {
    if (!pixData) return;
    Promise.resolve().then(() => {
      startPolling(pixData.orderId);
    });

    // Timer regressivo do QR (30 min)
    const timer = setInterval(() => {
      setPixSecondsLeft(s => {
        if (s <= 1) { clearInterval(timer); return 0; }
        return s - 1;
      });
    }, 1000);

    return () => { clearInterval(timer); stopPolling(); };
  }, [pixData, startPolling, stopPolling]);

  // Cleanup ao desmontar
  useEffect(() => () => stopPolling(), [stopPolling]);

  // Countdown de redirecionamento após pagamento confirmado
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

  // ── MP Bricks ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!order || pixData || paymentSuccess || loading || authStep !== 'authorized' || initializationStarted.current) return;
    initializationStarted.current = true;

    const mpPublicKey = "APP_USR-18f8ccc4-8ed4-4f99-bb6d-e333d026e578";
    const win = window as Window & { MercadoPago?: new (key: string, options: { locale: string }) => MPMediator };
    if (!win.MercadoPago) {
      console.warn("Mercado Pago SDK não detectado.");
      initializationStarted.current = false;
      return;
    }

    const renderPaymentBrick = async () => {
      // Pequeno delay para garantir que o React renderizou o container no DOM
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const container = document.getElementById("paymentBrick_container");
      if (!container) {
        console.warn("Aguardando container do Payment Brick...");
        initializationStarted.current = false;
        return;
      }
      container.innerHTML = "";
      if (!win.MercadoPago) return;

      const mp = new win.MercadoPago(mpPublicKey, { locale: "pt-BR" });
      const bricksBuilder = mp.bricks();

      const settings: MPBrickSettings = {
        initialization: {
          amount: Number(order.amount),
          payer: { email: order.buyerEmail || "cliente@fotosegundo.com.br", entityType: "individual" },
        },
        customization: {
          paymentMethods: { creditCard: "all", bankTransfer: ["pix"], maxInstallments: 12 },
          visual: { style: { theme: theme === "dark" ? "dark" : "default" } },
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
              } else {
                alert(`Status: ${data.status || "Pendente"}`);
              }
            } catch (err: unknown) {
              console.error("Erro no pagamento:", err);
              alert("Erro ao processar pagamento. Verifique seus dados.");
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
  }, [order, pixData, paymentSuccess, loading, theme, authStep]);

  // ── Formatação do timer ───────────────────────────────────────────────────────
  const fmtTimer = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Loading / Error ───────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="text-proportional animate-pulse">Sincronizando Protocolo de Pagamento...</div>
    </div>
  );

  if (error || !order) return (
    <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center p-6 text-center">
      <h2 className="heading-luxury mb-4 text-red-500">ERRO</h2>
      <p className="text-proportional mb-8">{error || "Pedido não encontrado."}</p>
      <button onClick={() => navigate("/")} className="lux-button-ghost">Voltar para a home</button>
    </div>
  );

  const eventTarget = order.event?.id || order.eventId;

  // ── Tela de Sucesso ───────────────────────────────────────────────────────────
  if (paymentSuccess) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center p-4">
      <div className="max-w-lg w-full text-center animate-in fade-in zoom-in-95 duration-500">
        {/* Ícone animado */}
        <div className="relative mx-auto mb-10 w-32 h-32">
          <div className="absolute inset-0 rounded-full bg-brand-tactical/10 animate-ping" style={{ animationDuration: "2s" }} />
          <div className="relative w-32 h-32 rounded-full bg-brand-tactical/10 flex items-center justify-center border border-brand-tactical/30">
            <CheckCircle2 size={56} className="text-brand-tactical" strokeWidth={1.5} />
          </div>
        </div>

        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-brand-tactical mb-4">
          PAGAMENTO CONFIRMADO
        </p>
        <h1 className="heading-luxury text-4xl md:text-6xl tracking-tighter mb-6">
          ACESSO LIBERADO
        </h1>
        <p className="text-proportional opacity-60 mb-3 max-w-sm mx-auto">
          Suas memórias estão prontas! Você já pode visualizá-las diretamente no seu painel de controle.
        </p>
        <p className="text-proportional !text-brand-tactical font-black mb-10">
          {order.event?.nomeNoivos}
        </p>

        {/* Countdown de redirecionamento */}
        <div className="mb-8 flex items-center justify-center gap-3 text-proportional opacity-40">
          <RefreshCw size={12} className="animate-spin" style={{ animationDuration: "2s" }} />
          Redirecionando em {redirectCountdown}s...
        </div>

        <button
          onClick={() => navigate(`/e/${eventTarget}`)}
          className="lux-button-base lux-button-tactical w-full py-5 text-base tracking-widest"
        >
          ACESSAR MINHA GALERIA AGORA
        </button>

        <button
          onClick={() => navigate("/")}
          className="mt-4 text-proportional opacity-30 hover:opacity-60 transition-opacity w-full py-3"
        >
          Voltar para a Vitrine
        </button>
      </div>
    </div>
  );

  // ── Tela de Pix (QR Code + Polling) ──────────────────────────────────────────
  if (pixData) return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <nav className="h-16 flex items-center justify-between px-6 border-b border-theme-border sticky top-0 z-50 bg-theme-bg/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-proportional opacity-40 hover:opacity-100 transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div className="text-proportional flex items-center gap-2">
          <ShieldCheck size={14} className="text-brand-tactical" />
          <span className="desktop-only">Checkout Seguro</span>
        </div>
      </nav>

      <div className="max-w-md mx-auto px-4 py-12 space-y-8">

        {/* Status do polling */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-brand-tactical/20 bg-brand-tactical/5 text-[10px] font-black uppercase tracking-widest text-brand-tactical">
            <span className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
            {pollingStatus === "polling" ? "Aguardando confirmação de pagamento..." : "Verificando..."}
          </div>
        </div>

        {/* Card principal */}
        <div className="lux-card editorial-shadow rounded-none border-theme-border">
          <div className="border-b border-theme-border pb-6 mb-6 text-center">
            <h1 className="heading-luxury !text-2xl md:!text-3xl italic mb-1">QUASE LÁ!</h1>
            <p className="text-proportional opacity-50 text-[10px]">
              Escaneie o código PIX para liberação imediata
            </p>
          </div>

          {/* QR Code — Gerado localmente para garantir visibilidade instantânea */}
          <div className="flex justify-center mb-6">
            <div className="bg-white p-4 border border-zinc-100 shadow-2xl">
              <QRCodeSVG 
                value={pixData.qrCode}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>
          </div>

          {/* Timer de expiração */}
          <div className={`flex items-center justify-center gap-2 mb-6 ${pixSecondsLeft < 300 ? "text-red-400" : "text-proportional opacity-40"}`}>
            <Clock size={12} />
            <span className="text-[10px] font-black uppercase tracking-widest">
              {pixSecondsLeft > 0 ? `Expira em ${fmtTimer(pixSecondsLeft)}` : "CÓDIGO EXPIRADO — Tente novamente"}
            </span>
          </div>

          {/* Pix Copia e Cola */}
          <div className="p-4 bg-theme-bg-muted border border-theme-border">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-3">Pix Copia e Cola</p>
            <div className="flex items-center gap-4">
              <input
                readOnly
                value={pixData.qrCode}
                className="bg-transparent text-[11px] w-full outline-none truncate font-mono text-theme-text"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(pixData.qrCode);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-2 text-brand-tactical text-[9px] font-black uppercase whitespace-nowrap tracking-widest hover:brightness-125 transition-all"
              >
                {copied ? <CheckCircle2 size={14} /> : <Copy size={14} />}
                {copied ? "Copiado!" : "Copiar"}
              </button>
            </div>
          </div>
        </div>

        {/* Instrução */}
        <div className="text-center space-y-2">
          <p className="text-[10px] uppercase tracking-[0.3em] opacity-30 font-bold">
            Esta página atualiza automaticamente
          </p>
          <p className="text-[9px] opacity-20">
            Abra seu banco, escaneie o QR code ou use o código copia e cola
          </p>
        </div>

      </div>
    </div>
  );

  // ── Renderização do Checkout Autenticado ─────────────────────────────────────
  const renderCheckout = () => {
    if (authStep === 'loading') {
      return (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <RefreshCw size={24} className="animate-spin text-brand-tactical" />
          <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Verificando Credenciais...</p>
        </div>
      );
    }

    if (authStep === 'authorized') {
      return (
        <div className="animate-in fade-in duration-500">
          <div className="flex items-center gap-4 p-4 bg-brand-tactical/5 border border-brand-tactical/20 mb-8">
            <div className="w-10 h-10 rounded-full bg-brand-tactical/10 flex items-center justify-center">
              <UserIcon size={18} className="text-brand-tactical" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Logado como</p>
              <p className="text-xs font-bold">{authUser?.nome || authUser?.email}</p>
            </div>
            <div className="ml-auto">
              <CheckCircle2 size={16} className="text-brand-tactical" />
            </div>
          </div>
          <div id="paymentBrick_container" />
        </div>
      );
    }

    // Fluxo de Autenticação Intermediário
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="flex flex-col items-center text-center mb-10">
          <div className="w-16 h-16 rounded-full bg-brand-tactical/10 flex items-center justify-center mb-6 border border-brand-tactical/20">
            <Lock size={28} className="text-brand-tactical" />
          </div>
          <h2 className="heading-luxury !text-2xl md:!text-3xl italic mb-3">
            {authStep === 'login' ? 'BEM-VINDO DE VOLTA' : 'QUASE LÁ!'}
          </h2>
          <p className="text-proportional opacity-60 text-xs max-w-xs">
            {authStep === 'login' 
              ? 'Identificamos que você já possui uma conta. Por favor, faça o login para prosseguir com o pagamento.'
              : 'Para garantir o acesso às suas memórias após o pagamento, escolha uma senha para sua nova conta.'
            }
          </p>
        </div>

        <form onSubmit={handleAuthSubmit} className="space-y-6 max-w-sm mx-auto">
          <div className="space-y-4">
            <div className="relative group">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" />
              <input 
                type="email" 
                value={order.buyerEmail} 
                disabled 
                className="w-full bg-theme-bg-muted border border-theme-border py-4 pl-12 pr-4 text-sm opacity-50 cursor-not-allowed"
              />
            </div>
            
            <div className="relative group">
              <Key size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" />
              <input 
                type="password" 
                placeholder={authStep === 'login' ? 'Sua senha' : 'Crie uma senha (mín. 6 dígitos)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-theme-bg-muted border border-theme-border py-4 pl-12 pr-4 text-sm focus:border-brand-tactical outline-none transition-all"
                autoFocus
              />
            </div>
          </div>

          {localAuthError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest text-center animate-in fade-in zoom-in-95">
              {localAuthError}
            </div>
          )}

          <button 
            type="submit" 
            disabled={authLoading}
            className="lux-button-base lux-button-tactical w-full py-4 text-xs font-black tracking-[0.3em] flex items-center justify-center gap-3"
          >
            {authLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                {authStep === 'login' ? 'AUTENTICANDO...' : 'CRIANDO CONTA...'}
              </>
            ) : (
              <>
                {authStep === 'login' ? 'ENTRAR E PAGAR' : 'CRIAR CONTA E CONTINUAR'}
              </>
            )}
          </button>

          <p className="text-center text-[10px] opacity-30 tracking-widest uppercase mt-6">
            <ShieldCheck size={10} className="inline mr-1" /> Seus dados estão protegidos
          </p>
        </form>
      </div>
    );
  };

  // ── Tela Principal: Resumo + MP Brick ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-theme-bg text-theme-text">
      <nav className="h-16 flex items-center justify-between px-6 border-b border-theme-border sticky top-0 z-50 bg-theme-bg/80 backdrop-blur-md">
        <button onClick={() => navigate(-1)} className="text-proportional opacity-40 hover:opacity-100 transition-all flex items-center gap-2">
          <ArrowLeft size={16} /> Voltar
        </button>
        <div className="absolute left-1/2 -translate-x-1/2">
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 22, objectFit: "contain" }} />
        </div>
        <div className="text-proportional opacity-100 flex items-center gap-2">
          <ShieldCheck size={14} className="text-brand-tactical" />
          <span className="desktop-only">Checkout Seguro</span>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* Resumo do Pedido */}
        <div className="lux-aura">
          <div className="lux-card editorial-shadow !bg-theme-bg-muted !border-theme-border rounded-none animate-reveal">
            <div className="flex flex-col items-center gap-6 border-b border-theme-border pb-8 mb-8 text-center">
              <h1 className="heading-luxury !text-3xl md:!text-5xl italic tracking-tighter">
                {order.event?.nomeNoivos}
              </h1>
              <div className="text-proportional !opacity-100 tracking-[0.4em] font-black">Resumo da Aquisição</div>
            </div>
            <div className="space-y-6">
              <div className="flex justify-between items-center text-proportional font-black">
                <span>{order.manualType || "Investimento"}</span>
                <span className="opacity-100 text-theme-text">R$ {Number(order.amount).toFixed(2)}</span>
              </div>
              <div className="pt-6 border-t border-theme-border flex justify-between items-center">
                <div className="text-proportional !opacity-100 font-black tracking-[0.4em]">Total</div>
                <div className="text-3xl md:text-5xl font-black tracking-tighter text-brand-tactical italic">
                  R$ {Number(order.amount).toFixed(2)}
                </div>
              </div>
              <div className="flex justify-end">
                <span className="bg-brand-tactical/10 text-brand-tactical text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest animate-pulse">
                  ✨ Parcelamento em até 3x sem juros
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Brick de Pagamento */}
        <div className="lux-card editorial-shadow !p-4 md:!p-10 min-h-[400px] rounded-none border-theme-border animate-reveal" style={{ animationDelay: "0.2s" }}>
          <div className="mb-8 text-center">
            <div className="text-proportional mb-3 tracking-[0.3em] font-black">Forma de Pagamento</div>
            <p className="text-[10px] uppercase tracking-widest opacity-40 mb-10">
              Processamento via Mercado Pago com criptografia 256 bits
            </p>
            {renderCheckout()}
          </div>
        </div>

        {/* Selos de segurança */}
        <div className="text-center flex items-center justify-center gap-6 opacity-20 animate-reveal" style={{ animationDelay: "0.4s" }}>
          <img src="https://static.mlstatic.com/org-img/vendors/br/logo-mercado-pago.png" alt="MP" className="h-4 grayscale brightness-0 dark:brightness-200" />
          <div className="w-px h-4 bg-theme-border" />
          <ShieldCheck size={16} />
          <span className="text-[10px] font-black tracking-[0.3em] uppercase italic">PAGAMENTO BLINDADO</span>
        </div>
      </div>
    </div>
  );
};

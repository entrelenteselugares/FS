import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { API } from "../lib/api";
import { toast } from "sonner";
import * as Sentry from "@sentry/react";

interface MPBrickSettings {
  initialization: {
    amount: number;
    payer?: { email?: string; entityType?: string };
  };
  customization: {
    paymentMethods: { creditCard: string; bankTransfer?: string[]; maxInstallments: number; mercadoPago?: string };
    visual?: { style?: { theme?: string } };
  };
  callbacks: {
    onReady: () => void;
    onSubmit: (data: { formData: { token: string } }) => Promise<void>;
    onError: (error: unknown) => void;
  };
}

export default function CheckoutSanfonaPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const price = 27.90;
  const [userEmail, setUserEmail] = useState("contatofotosegundo@gmail.com");
  
  const initializationStarted = useRef(false);
  const brickController = useRef<{ unmount: () => void } | null>(null);

  useEffect(() => {
    // Busca informações do usuário
    API.get("/auth/me").then(({ data }) => {
      if (data?.user?.email) {
        setUserEmail(data.user.email);
      }
    }).catch(err => {
      console.warn("Failed to fetch user data for checkout", err);
    });

    // Idealmente também buscaria o preço dinâmico aqui se houvesse uma rota pública.
    // Usaremos 27.90 como fallback.
  }, []);

  useEffect(() => {
    if (paymentSuccess || initializationStarted.current) return;

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
          // Apenas cartão de crédito habilitado para assinatura recorrente
          paymentMethods: { creditCard: "all", maxInstallments: 1 },
          visual: { style: { theme: "dark" } },
        },
        callbacks: {
          onReady: () => {},
          onSubmit: async ({ formData }) => {
            Sentry.addBreadcrumb({
              category: "checkout-sanfona",
              message: "Cliente submeteu form de pagamento no MP Brick para Assinatura",
              level: "info"
            });
            setLoading(true);
            try {
              // Envia o token para criar a assinatura transparente
              const { data } = await API.post("/sanfona/subscribe", {
                cardTokenId: formData.token
              });
              
              if (data.subscriptionId) {
                setPaymentSuccess(true);
                toast.success("Assinatura confirmada com sucesso!");
                setTimeout(() => {
                  navigate("/minha-conta?tab=files&sanfona=success");
                }, 3000);
              }
            } catch (err: unknown) {
              const errorObj = err as { response?: { data?: { error?: string } } };
              const errorMessage = errorObj.response?.data?.error || "Erro ao processar assinatura.";
              Sentry.captureException(err, {
                tags: { context: "checkout_sanfona_failure" },
                extra: { errorMessage }
              });
              toast.error(errorMessage);
            } finally {
              setLoading(false);
            }
          },
          onError: (error: unknown) => {
            Sentry.captureException(error, { tags: { context: "mp_brick_render_error_sanfona" } });
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
  }, [paymentSuccess, price, userEmail, navigate]);

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
              <h2 className="text-3xl md:text-5xl md:text-6xl font-heading font-bold text-theme-text uppercase leading-none">
                Assinatura <br/> Confirmada
              </h2>
              <p className="text-[10px] text-theme-text-muted font-bold uppercase tracking-[0.3em] leading-relaxed max-w-xs mx-auto">
                Sua assinatura do Clube do Álbum Sanfona está ativa. Liberando acesso...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="text-[10px] font-bold tracking-[0.5em] text-brand-tactical animate-pulse uppercase">Processando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text flex flex-col">
      <Helmet>
        <title>Checkout - Clube do Álbum Sanfona | Foto Segundo</title>
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
              <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.4em] mb-4">Assinatura Mensal</p>
              <h1 className="text-2xl md:text-4xl font-bold uppercase leading-none">
                Clube do Álbum Sanfona
              </h1>
              <p className="text-theme-muted text-sm mt-4 font-medium leading-relaxed">
                Receba um álbum sanfona exclusivo em casa todo mês com as suas 10 melhores fotos.
              </p>
            </div>

            <div className="bg-theme-bg-muted border border-white/5 p-6 rounded-xl space-y-4">
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
                 <span>Plano</span>
                 <span className="text-theme-text">Mensal</span>
               </div>
               <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-theme-text-muted">
                 <span>Renovação</span>
                 <span className="text-theme-text">Automática</span>
               </div>
               <div className="h-px bg-white/10 my-4" />
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-tactical">Total Hoje</span>
                 <span className="text-2xl font-heading font-bold text-theme-text">R$ {price.toFixed(2)}</span>
               </div>
            </div>
          </div>

          <div className="bg-[#1e1e1e] rounded-xl p-4 md:p-6 shadow-2xl relative">
            <h3 className="text-xs font-bold uppercase tracking-widest text-theme-text mb-6">Pagamento Seguro</h3>
            <div id="paymentBrick_container" className="lux-brick-midnight min-h-[400px]" />
          </div>
        </div>
      </div>
    </div>
  );
}

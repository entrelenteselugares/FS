import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../contexts/ThemeContext";
import { API as api } from "../lib/api";
import AccessTypeModal from "../components/AccessTypeModal";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Calendar, 
  MapPin, 
  ArrowLeft, 
  CreditCard, 
  Gift, 
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Info
} from "lucide-react";

interface MercadoPagoInstance {
  createCardToken: (data: Record<string, string>) => Promise<{ id: string }>;
}

declare global {
  interface Window {
    MercadoPago: new (publicKey: string) => MercadoPagoInstance;
  }
}

interface EventData {
  id: string;
  nomeNoivos: string;
  slug: string;
  date: string;
  location: string;
  city: string | null;
  description: string | null;
  coverPhotoUrl: string | null;
  priceBase: number;
  priceEarly: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  cartorio?: { razaoSocial: string; city: string | null } | null;
  isCrowdfund: boolean;
  targetAmount: number | null;
  collectedAmount: number;
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
}

function formatDate(d: string) {
  try {
    const dateObj = new Date(d);
    if (isNaN(dateObj.getTime())) return "Data a definir";
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    }).format(dateObj);
  } catch {
    return "Data a definir";
  }
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "master";
  if (/^3[47]/.test(n)) return "amex";
  return "visa";
}

type Step = "paywall" | "checkout" | "processing" | "success";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  useTheme(); // ensures ThemeProvider is available — renders correctly in both modes

  const [event, setEvent]       = useState<EventData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep]         = useState<Step>("paywall");
  const [access, setAccess]     = useState<AccessData | null>(null);
  const [orderId, setOrderId]   = useState<string | null>(null);
  const [error, setError]       = useState("");
  const [mpLoaded, setMpLoaded] = useState(false);
  const [cardToken, setCardToken] = useState("");
  const [tokenizing, setTokenizing] = useState(false);
  const [cardData, setCardData] = useState({
    number: "", name: "", month: "", year: "", cvv: "", email: "", cpf: "",
  });

  // LGPD State
  const [needsAccessChoice, setNeedsAccessChoice] = useState(false);
  const [_accessType, setAccessType] = useState<string | null>(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState<number>(50); // Valor padrão
  const [contributorName, setContributorName] = useState<string>("");

  useEffect(() => {
    if (!id) return;
    api.get(`/public/events/${id}`)
      .then((r) => setEvent(r.data))
      .catch((e) => { if (e.response?.status === 404) setNotFound(true); })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const checkAccessLocal = async (oid: string) => {
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        
        if (data.status === "PENDING_CHOICE") {
            setStep("success");
            setNeedsAccessChoice(true);
            return;
        }

        if (data.status === "EXPIRED") {
            setStep("success");
            setAccess({ lightroomUrl: null, driveUrl: null });
            return;
        }

        if (data.status === "ACTIVE") {
            setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl });
            setAccessType(data.accessType);
            setAccessExpiresAt(data.accessExpiresAt);
            setStep("success");
            setNeedsAccessChoice(false);
        }
      } catch { /* ainda não pago */ }
    };

    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${id}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessLocal(oid); }
  }, [id, searchParams]);

  useEffect(() => {
    if (window.MercadoPago) { setMpLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => setMpLoaded(true);
    document.head.appendChild(s);
  }, []);

  const checkAccess = async (oid: string) => {
    try {
      const { data } = await api.get(`/orders/${oid}/access-status`);
      
      if (data.status === "PENDING_CHOICE") {
          setStep("success");
          setNeedsAccessChoice(true);
          return;
      }

      if (data.status === "EXPIRED") {
          setStep("success");
          setAccess({ lightroomUrl: null, driveUrl: null });
          return;
      }

      if (data.status === "ACTIVE") {
          setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl });
          setAccessType(data.accessType);
          setAccessExpiresAt(data.accessExpiresAt);
          setStep("success");
          setNeedsAccessChoice(false);
      }

      if (data.status === "PENDING_GOAL") {
          setStep("success");
          setNeedsAccessChoice(false);
          // Atualiza o evento localmente se necessário para mostrar o progresso real
          if (event) {
            setEvent({
              ...event, 
              collectedAmount: data.collectedAmount,
              targetAmount: data.targetAmount 
            });
          }
      }
    } catch { /* ainda não pago */ }
  };

  const handleTokenize = async () => {
    const mpLib = window.MercadoPago;
    if (!mpLib || !mpLoaded) return;
    setTokenizing(true); setError("");
    try {
      const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY ?? "").trim();
      const mp = new mpLib(publicKey);
      const result = await mp.createCardToken({
        cardNumber: cardData.number.replace(/\s/g, ""),
        cardholderName: cardData.name,
        cardExpirationMonth: cardData.month,
        cardExpirationYear: cardData.year,
        securityCode: cardData.cvv,
      });
      setCardToken(result.id);
    } catch {
      setError("Dados do cartão inválidos. Verifique e tente novamente.");
    } finally {
      setTokenizing(false);
    }
  };

  const handlePay = async () => {
    if (!event || !cardToken) return;
    setStep("processing"); setError("");
    try {
      const { data } = await api.post("/checkout/payment", {
        eventId: event.id,
        cardToken,
        installments: 1,
        paymentMethodId: detectBrand(cardData.number),
        email: cardData.email,
        cpf: cardData.cpf,
        contributionAmount: event.isCrowdfund ? contributionAmount : null,
        contributorName: event.isCrowdfund ? contributorName : null,
      });
      const oid = data.orderId;
      localStorage.setItem(`fs_order_${id}`, oid);
      setOrderId(oid);
      navigate(`/e/${id}?orderId=${oid}`, { replace: true });
      if (data.hasPaid) await checkAccess(oid);
      else pollStatus(oid);
    } catch (err: unknown) {
      let msg = "Erro ao processar pagamento.";
      if (axios.isAxiosError(err)) {
        msg = err.response?.data?.error ?? msg;
      }
      setError(msg);
      setStep("checkout");
    }
  };

  const pollStatus = (oid: string) => {
    let n = 0;
    const t = setInterval(async () => {
      n++;
      try { await checkAccess(oid); clearInterval(t); }
      catch { if (n >= 10) { clearInterval(t); setStep("checkout"); setError("Pagamento em análise. Você receberá acesso por e-mail."); } }
    }, 3000);
  };

  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCardData((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (notFound || !event) return (
    <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-theme-text uppercase">
        Protocolo não localizado
      </h1>
      <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.3em]">O registro solicitado não existe em nossa rede</p>
      <button 
        onClick={() => navigate("/")} 
        className="mt-8 text-[10px] font-bold uppercase tracking-[0.4em] text-brand-primary border-b border-brand-primary/30 pb-1 hover:border-brand-primary transition-all"
      >
        ← Retornar à Vitrine
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans transition-colors duration-500 overflow-x-hidden">
      <style>{`
        .editorial-shadow { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.15); }
        .dark .editorial-shadow { box-shadow: 0 40px 100px -20px rgba(0,0,0,0.6); }
      `}</style>

      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-theme-bg/80 backdrop-blur-xl border-b border-theme-border px-6 py-4 flex justify-between items-center transition-colors">
        <button 
          onClick={() => navigate("/")} 
          className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all"
        >
          <ArrowLeft size={14} /> <span className="hidden md:inline">Protocolos</span>
        </button>
        <div className="text-center">
          <span className="text-[14px] font-bold uppercase tracking-[0.5em] text-theme-text block md:inline md:mr-1">FOTO</span>
          <span className="text-[14px] font-light uppercase tracking-[0.5em] text-theme-text">SEGUNDO</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-muted hidden sm:block">
            {user?.role === 'ADMIN' ? 'Painel de Controle' : 'Acesso Editorial'}
          </span>
          <div className="w-1.5 h-1.5 rounded-full bg-brand-primary animate-pulse" />
        </div>
      </nav>

      {/* Main Content Layout */}
      <main className="max-w-7xl mx-auto px-6 py-12 md:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-start">
        
        {/* Left Column: Visual & Header */}
        <div className="lg:col-span-7 space-y-12">
          
          {/* Immersive Cover */}
          <div className="relative group overflow-hidden bg-theme-bg-muted aspect-[4/3] md:aspect-[16/9] editorial-shadow">
            <AnimatePresence mode="wait">
              <motion.img 
                key={event.coverPhotoUrl}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: step === "success" ? 1 : 0.6, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                src={event.coverPhotoUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600"} 
                className={`w-full h-full object-cover transition-all duration-1000 ${step !== "success" ? "grayscale blur-[2px]" : "grayscale-0 blur-0"}`}
                alt={event.nomeNoivos} 
              />
            </AnimatePresence>
            
            {step !== "success" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-black/40 backdrop-blur-[1px]">
                <div className="w-16 h-16 rounded-full border border-white/20 flex items-center justify-center mb-6">
                  <Lock size={20} className="text-white/60" strokeWidth={1} />
                </div>
                <div className="text-[10px] font-bold uppercase tracking-[0.6em] text-white/40 mb-2">Acesso Restrito</div>
                <div className="text-[12px] font-medium tracking-[0.2em] text-white/60 uppercase">Protocolo Protegido por Paywall</div>
              </div>
            )}
            
            {step === "success" && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-6 left-6 flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 border border-white/20 rounded-full"
              >
                <div className="w-2 h-2 rounded-full bg-brand-primary" />
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-white">Visualização Liberada</span>
              </motion.div>
            )}
          </div>

          {/* Header Info */}
          <div className="space-y-6">
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.2 }}
               className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.5em] text-brand-primary"
            >
              <div className="w-8 h-[1px] bg-brand-primary/40" />
              {event.cartorio?.razaoSocial ?? event.location}
            </motion.div>
            
            <motion.h1 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.3 }}
               className="text-5xl md:text-7xl font-extrabold tracking-tighter leading-[1] text-theme-text uppercase"
            >
              {event.nomeNoivos}
            </motion.h1>
            
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               transition={{ delay: 0.4 }}
               className="flex flex-wrap items-center gap-x-10 gap-y-4 text-[11px] font-bold uppercase tracking-[0.2em] text-theme-muted border-y border-theme-border py-6"
            >
              <div className="flex items-center gap-3"><Calendar size={14} className="text-brand-primary" /> {formatDate(event.date)}</div>
              <div className="flex items-center gap-3"><MapPin size={14} className="text-brand-primary" /> {event.city ?? event.location}</div>
            </motion.div>
          </div>

          {/* Features / Services */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              { active: event.temFoto, name: "Galeria Editorial", desc: "Curadoria completa em alta resolução" },
              { active: event.temVideo, name: "Cinema & Filme", desc: "Produção cinematográfica em 4K" },
              { active: event.temReels, name: "Conteúdo para Redes", desc: "Reels e Stories prontos para compartilhar" },
              { active: event.temFotoImpressa, name: "Papel Algodão", desc: "Impressão fine-art no local do evento" },
            ].filter((s) => s.active).map((s, idx) => (
              <motion.div 
                key={s.name}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + (idx * 0.1) }}
                className="group p-6 border border-theme-border bg-theme-bg-muted/30 hover:border-brand-primary transition-all duration-500"
              >
                <div className="flex items-start gap-5">
                  <div className="w-1.5 h-1.5 rounded-none bg-brand-primary mt-1.5 group-hover:scale-x-4 transition-transform origin-left" />
                  <div>
                    <h4 className="text-[12px] font-bold uppercase tracking-[0.2em] mb-2">{s.name}</h4>
                    <p className="text-[11px] text-theme-muted font-bold uppercase tracking-wider">{s.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </section>

          {/* Delivery Links (Success) */}
          {step === "success" && (
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-10 border border-brand-primary bg-brand-primary/5 space-y-8"
            >
              {access?.lightroomUrl || access?.driveUrl ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-3xl font-extrabold tracking-tight uppercase">Seus Registros Estão Prontos</h3>
                      <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary mt-2">Download em Alta Definição</p>
                    </div>
                    <Unlock size={24} className="text-brand-primary" strokeWidth={1} />
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {access.lightroomUrl && (
                      <a href={access.lightroomUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-6 bg-theme-bg border border-theme-border hover:border-theme-text transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 flex items-center justify-center border border-theme-border text-theme-muted group-hover:text-theme-text transition-all font-sans font-bold">Lr</div>
                          <div>
                            <p className="text-[13px] font-bold uppercase tracking-widest text-theme-text">Álbum de Fotos</p>
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-1">Adobe Creative Cloud</p>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-theme-muted group-hover:text-theme-text transition-all" />
                      </a>
                    )}
                    {access.driveUrl && (
                      <a href={access.driveUrl} target="_blank" rel="noopener noreferrer"
                        className="flex items-center justify-between p-6 bg-theme-bg border border-theme-border hover:border-theme-text transition-all group">
                        <div className="flex items-center gap-5">
                          <div className="w-10 h-10 flex items-center justify-center border border-theme-border text-theme-muted group-hover:text-theme-text transition-all">
                            <motion.div animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: "linear" }}>🎥</motion.div>
                          </div>
                          <div>
                            <p className="text-[13px] font-bold uppercase tracking-widest text-theme-text">Vídeos & Reels</p>
                            <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-1">Google Drive Storage</p>
                          </div>
                        </div>
                        <ExternalLink size={16} className="text-theme-muted group-hover:text-theme-text transition-all" />
                      </a>
                    )}
                  </div>

                  {accessExpiresAt && (
                    <div className="flex items-center gap-3 p-4 bg-theme-bg-muted/50 border border-theme-border text-[9px] font-medium uppercase tracking-[0.2em] text-theme-muted">
                      <Info size={14} className="text-brand-primary" />
                      O acesso expira em {new Date(accessExpiresAt).toLocaleDateString("pt-BR")} · 
                      Restam {Math.ceil((new Date(accessExpiresAt).getTime() - Date.now()) / 86400000)} dias
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                   <Gift className="mx-auto mb-6 text-brand-primary/40" size={48} strokeWidth={1} />
                   <h3 className="text-2xl font-extrabold tracking-tight uppercase text-theme-text">Contribuição Registrada</h3>
                   <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.2em] mt-4 leading-relaxed max-w-sm mx-auto">
                     A meta de {formatCurrency(event.targetAmount || 0)} ainda não foi atingida. 
                     Os registros serão desbloqueados para todos assim que o objetivo coletivo for concluído.
                   </p>
                   {/* Progress Visual in success state */}
                   <div className="mt-8 max-w-xs mx-auto">
                      <div className="w-full h-[2px] bg-theme-border relative">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (Number(event.collectedAmount) / Number(event.targetAmount || 1)) * 100)}%` }}
                          className="absolute inset-0 bg-brand-primary"
                        />
                      </div>
                      <div className="flex justify-between mt-3 text-[9px] font-bold uppercase tracking-widest text-brand-primary">
                        <span>{Math.round((Number(event.collectedAmount) / Number(event.targetAmount || 1)) * 100)}%</span>
                        <span>{formatCurrency(Number(event.collectedAmount))}</span>
                      </div>
                   </div>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Right Column: Checkout Flow */}
        <aside className="lg:col-span-5 space-y-8 lg:sticky lg:top-32">
          
          {/* STEP: PAYWALL */}
          {step === "paywall" && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-theme-bg-muted border border-theme-border p-8 md:p-12 editorial-shadow transition-colors"
            >
              <div className="text-[10px] font-bold uppercase tracking-[0.5em] text-brand-primary mb-6">Arquivo Editorial</div>
              <div className="space-y-1 mb-10">
                <div className="text-5xl font-black tracking-tight text-theme-text uppercase">
                  {formatCurrency(Number(event.priceBase))}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-theme-muted">Acesso Vitalício Individual</div>
              </div>

              {Number(event.priceEarly) < Number(event.priceBase) && (
                <div className="p-4 bg-brand-primary/10 border border-brand-primary/20 mb-8">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary">
                    Desconto Antecipado: {formatCurrency(Number(event.priceEarly))}
                  </p>
                </div>
              )}

              <ul className="space-y-4 mb-12 border-t border-theme-border pt-8">
                {[
                  "Arquivos originais em alta resolução",
                  "Sem marcas d'água de proteção",
                  "Licença para uso em redes sociais",
                  "Backup garantido por 12 meses"
                ].map(item => (
                  <li key={item} className="flex items-center gap-4 text-[11px] font-medium uppercase tracking-wider text-theme-muted">
                    <CheckCircle2 size={14} className="text-brand-primary" /> {item}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => setStep("checkout")}
                className="w-full py-6 bg-theme-text text-theme-bg text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all flex items-center justify-center gap-3"
              >
                DESBLOQUEAR PROTOCOLO <ChevronRight size={14} />
              </button>

              <div className="mt-8 flex items-center justify-center gap-6 opacity-30">
                <ShieldCheck size={20} strokeWidth={1} />
                <CreditCard size={20} strokeWidth={1} />
              </div>
            </motion.div>
          )}

          {/* STEP: CROWDFUND / GIFT */}
          {step === "paywall" && event.isCrowdfund && (
            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="bg-brand-primary/5 border border-brand-primary/20 p-8 md:p-12 editorial-shadow"
            >
              <div className="flex items-center gap-3 mb-8">
                <Gift size={20} className="text-brand-primary" strokeWidth={1.5} />
                <h3 className="text-[14px] font-bold uppercase tracking-[0.3em] text-theme-text">Cota de Presente</h3>
              </div>

              {/* Progress Visual */}
              <div className="mb-10 space-y-4">
                <div className="flex items-end justify-between font-bold text-2xl uppercase">
                  <span className="text-theme-text font-black">{formatCurrency(Number(event.collectedAmount))}</span>
                  <span className="text-[11px] font-bold uppercase tracking-widest text-theme-muted">Meta: {formatCurrency(Number(event.targetAmount || 0))}</span>
                </div>
                <div className="w-full h-[3px] bg-theme-border overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (Number(event.collectedAmount) / Number(event.targetAmount || 1)) * 100)}%` }}
                    className="h-full bg-brand-primary shadow-[0_0_15px_rgba(133,185,172,0.5)]"
                    transition={{ duration: 2, ease: "circOut" }}
                  />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted text-center">
                  {Math.round((Number(event.collectedAmount) / Number(event.targetAmount || 1)) * 100)}% Arrecadado
                </p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                  {[30, 50, 100, 200].map(val => (
                    <button 
                      key={val} 
                      onClick={() => { setContributionAmount(val); setStep("checkout"); }}
                      className="py-4 border border-theme-border text-theme-text font-bold text-[12px] tracking-widest hover:border-brand-primary hover:text-brand-primary transition-all"
                    >
                      {formatCurrency(val)}
                    </button>
                  ))}
                </div>
                
                <div className="space-y-3">
                  <input 
                    type="text" 
                    placeholder="Nome p/ o Relatório"
                    value={contributorName}
                    onChange={(e) => setContributorName(e.target.value)}
                    className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[12px] font-medium placeholder:text-theme-muted/50 focus:border-brand-primary outline-none transition-colors"
                  />
                  <div className="relative">
                    <input 
                      type="number" 
                      placeholder="Outro Valor..."
                      value={contributionAmount}
                      onChange={(e) => setContributionAmount(Number(e.target.value))}
                      className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[12px] font-medium placeholder:text-theme-muted/50 focus:border-brand-primary outline-none transition-colors"
                    />
                    <button 
                      onClick={() => setStep("checkout")}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-primary hover:text-theme-text"
                    >
                      Presentear
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: CHECKOUT FORM */}
          {step === "checkout" && (
            <motion.div 
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               className="bg-theme-bg-muted border border-theme-border editorial-shadow overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-theme-border flex justify-between items-center bg-theme-bg/30">
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted">Finalização Segura</span>
                <button 
                  onClick={() => setStep("paywall")} 
                  className="text-[9px] font-bold uppercase tracking-[0.2em] text-theme-muted hover:text-brand-primary transition-colors"
                >
                  Cancelar
                </button>
              </div>

              <div className="p-8 space-y-8">
                {/* Order Summary */}
                <div className="flex justify-between items-end border-b border-theme-border pb-8">
                  <div className="text-3xl font-black tracking-tight uppercase">
                    {formatCurrency(event.isCrowdfund ? contributionAmount : Number(event.priceBase))}
                  </div>
                </div>

                {error && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    className="p-4 bg-red-400/5 border border-red-400/20 text-red-500 text-[11px] font-medium uppercase tracking-wider"
                  >
                    {error}
                  </motion.div>
                )}

                {/* Card Inputs */}
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Número do Cartão</label>
                    <div className="relative">
                      <input
                        value={cardData.number}
                        onChange={handleChange("number")}
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[13px] font-medium placeholder:text-theme-muted/30 focus:border-theme-text outline-none transition-all"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-20">
                        <CreditCard size={18} strokeWidth={1} />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Titular (Impressão)</label>
                    <input
                      value={cardData.name}
                      onChange={handleChange("name")}
                      placeholder="Identico ao Cartão"
                      className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[13px] font-medium placeholder:text-theme-muted/30 focus:border-theme-text outline-none transition-all uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Mês</label>
                      <input value={cardData.month} onChange={handleChange("month")} placeholder="MM" maxLength={2} className="w-full bg-theme-bg border border-theme-border px-4 py-4 text-[13px] text-center font-medium focus:border-theme-text outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Ano</label>
                      <input value={cardData.year} onChange={handleChange("year")} placeholder="AA" maxLength={2} className="w-full bg-theme-bg border border-theme-border px-4 py-4 text-[13px] text-center font-medium focus:border-theme-text outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">CVV</label>
                      <input value={cardData.cvv} onChange={handleChange("cvv")} placeholder="000" maxLength={4} className="w-full bg-theme-bg border border-theme-border px-4 py-4 text-[13px] text-center font-medium focus:border-theme-text outline-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">Documento (CPF)</label>
                    <input value={cardData.cpf} onChange={handleChange("cpf")} placeholder="000.000.000-00" className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[13px] font-medium focus:border-theme-text outline-none" />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-theme-muted">E-mail para Recebimento</label>
                    <input value={cardData.email} onChange={handleChange("email")} placeholder="seu@email.com" className="w-full bg-theme-bg border border-theme-border px-5 py-4 text-[13px] font-medium focus:border-theme-text outline-none" />
                  </div>
                </div>

                <div className="space-y-4 pt-4">
                  {!cardToken ? (
                    <button 
                      onClick={handleTokenize} 
                      disabled={tokenizing || !mpLoaded}
                      className="w-full py-4 border border-theme-text/20 text-[10px] font-bold uppercase tracking-[0.3em] hover:bg-theme-text hover:text-theme-bg transition-all disabled:opacity-30"
                    >
                      {tokenizing ? "Sincronizando..." : "Validar Cartão"}
                    </button>
                  ) : (
                    <div className="py-4 bg-brand-primary/10 border border-brand-primary/30 text-[10px] font-bold uppercase tracking-[0.3em] text-brand-primary text-center">
                      ✓ Sincronização Autêntica
                    </div>
                  )}

                  <button 
                    onClick={handlePay} 
                    disabled={!cardToken}
                    className="w-full py-6 bg-theme-text text-theme-bg text-[12px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all disabled:opacity-20"
                  >
                    Confirmar Transação
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP: PROCESSING */}
          {step === "processing" && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-theme-bg-muted border border-theme-border p-16 editorial-shadow text-center"
            >
              <div className="w-12 h-12 border-2 border-brand-primary border-t-transparent rounded-full animate-spin mx-auto mb-10" />
              <h3 className="text-3xl font-extrabold tracking-tight uppercase mb-4">Registrando Acesso</h3>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted">Sincronizando com a Rede Foto Segundo...</p>
            </motion.div>
          )}

          {/* STEP: SUCCESS SIDEBAR */}
          {step === "success" && (
            <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="bg-brand-primary/10 border border-brand-primary p-12 editorial-shadow text-center relative overflow-hidden"
            >
              <motion.div 
                initial={{ rotate: -15, x: 20, y: -20, opacity: 0.2 }}
                className="absolute top-0 right-0 text-brand-primary"
              >
                <CheckCircle2 size={120} strokeWidth={0.5} />
              </motion.div>
              
              <div className="relative z-10">
                <div className="w-16 h-16 bg-brand-primary/20 rounded-full flex items-center justify-center mx-auto mb-8 border border-brand-primary/40">
                  <CheckCircle2 size={32} className="text-brand-primary" strokeWidth={1} />
                </div>
                <h3 className="text-3xl font-extrabold tracking-tight uppercase mb-3">Sucesso Editorial</h3>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted mb-10">Protocolo Desbloqueado com Sucesso</p>
                
                {orderId && (
                  <div className="pt-8 border-t border-brand-primary/20 flex flex-col items-center gap-2">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-theme-muted">Autenticação do Pedido</span>
                    <span className="text-[12px] font-sans font-bold text-brand-primary uppercase tracking-widest">{orderId.slice(-12)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </aside>
      </main>

      {/* Footer / Legal */}
      <footer className="mt-24 py-24 border-t border-theme-border bg-theme-bg-muted/30">
        <div className="max-w-xl mx-auto text-center px-6 opacity-40 hover:opacity-100 transition-opacity duration-700">
           <h4 className="text-[14px] font-bold uppercase tracking-[0.5em] mb-8">FOTO SEGUNDO EDITORIAL</h4>
           <p className="text-[9px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-6">
             Plataforma de curadoria fotográfica e cinematográfica. 
             Todos os registros são protegidos por direitos autorais e sincronizados em tempo real.
           </p>
           <div className="text-[8px] font-medium tracking-[0.1em] text-theme-muted uppercase">
             © {new Date().getFullYear()} REDE FS · TODOS OS DIREITOS RESERVADOS
           </div>
        </div>
      </footer>

      {needsAccessChoice && orderId && event && (
        <AccessTypeModal
          orderId={orderId}
          eventTitle={event.nomeNoivos}
          onConfirmed={(type, expiresAt) => {
            setAccessType(type);
            setAccessExpiresAt(expiresAt);
            setNeedsAccessChoice(false);
            checkAccess(orderId);
          }}
        />
      )}
    </div>
  );
}


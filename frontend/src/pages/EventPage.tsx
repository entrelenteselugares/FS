import { useState, useEffect, useCallback } from "react";
import { Check, Video, Zap, Printer } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { T, BtnPrimary, BtnSecondary, FieldLabel, FieldInput } from "../lib/theme";
import { AuthModal } from "../components/AuthModal";
import { Modal } from "../components/UI/Modal";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/Navbar";
import { PrintStoreModal } from "../components/PrintStoreModal";

const Item = ({ val, label }: { val: number, label: string }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, color: T.text, lineHeight: 1 }}>{String(val).padStart(2, "0")}</div>
    <div style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: T.text3, marginTop: 4 }}>{label}</div>
  </div>
);

const Countdown: React.FC<{ targetDate: string }> = ({ targetDate }) => {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = new Date(targetDate).getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(timer);
        return;
      }
      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff / (1000 * 60 * 60)) % 24),
        m: Math.floor((diff / 1000 / 60) % 60),
        s: Math.floor((diff / 1000) % 60),
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  return (
    <div style={{ display: "flex", gap: 20, marginBottom: "1.25rem", borderBottom: `1px solid ${T.border}`, paddingBottom: "0.75rem" }}>
      <Item val={timeLeft.d} label="Dias" />
      <Item val={timeLeft.h} label="Horas" />
      <Item val={timeLeft.m} label="Min" />
      <Item val={timeLeft.s} label="Seg" />
    </div>
  );
};

interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento?: string | null;
  paywall: { active: boolean; message: string };
  lightroomUrl?: string | null;
  driveUrl?: string | null;
  slug?: string | null;
  location?: string | null;
  city?: string | null;
  description?: string | null;
  coverPhotoUrl: string | null;
  priceBase: number;
  temFoto?: boolean;
  temVideo?: boolean;
  temReels?: boolean;
  temFotoImpressa?: boolean;
  cartorio?: string | null;
  isCrowdfund?: boolean;
  targetAmount?: number | null;
  collectedAmount?: number;
  previewPhotos?: string[];
  isComingSoon?: boolean;
  priceUnit?: number;
  pendingOrderId?: string | null;
  type?: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
  pricePerPhoto?: number;
  isUnitSale?: boolean;
  recentOrders?: { id: string; contributorName: string; valor: number; createdAt: string }[];
  clientEmail?: string | null;
  isPrimaryClient?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  active?: boolean;
}

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
  price?: number | null;
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
  expiresAt: string;
  eventTitle: string;
  accessType?: "PUBLIC" | "PRIVATE";
}

interface PrintProductData {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  finalPrice: number;
  description: string | null;
  active: boolean;
}

interface ServiceData {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
}

const Spinner = () => (
  <div style={{ width: 24, height: 24, border: `2px solid ${T.border}`, borderTopColor: T.brand, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
);

const SERVICES = [
  { key: "temFoto", label: "Fotos em Alta" },
  { key: "temVideo", label: "Vídeo Cinema" },
  { key: "temReels", label: "Reels Vertical" },
  { key: "temFotoImpressa", label: "Impressão" }
];

const mpErrors: Record<string, string> = {
  "205": "Número do cartão inválido.",
  "208": "Mês de vencimento inválido.",
  "209": "Ano de vencimento inválido.",
  "211": "CPF inválido.",
  "E301": "Número do cartão incompleto.",
  "E302": "Código de segurança inválido.",
  "default": "Verifique os dados do cartão e tente novamente."
};

interface MPInstance {
  createCardToken: (data: unknown) => Promise<{ token: string; error?: unknown }>;
}
type MPConstructor = new (key: string) => MPInstance;

const MP_PUBLIC_KEY = import.meta.env.VITE_MP_PUBLIC_KEY;

const loadMP = () => new Promise<unknown>((resolve) => {
  const w = window as Window & { MercadoPago?: unknown };
  if (w.MercadoPago) { resolve(w.MercadoPago); return; }
  const script = document.createElement("script");
  script.src = "https://sdk.mercadopago.com/js/v2";
  script.onload = () => resolve(w.MercadoPago);
  document.body.appendChild(script);
});

const detectBrand = (number: string) => {
  const n = number.replace(/\s/g, "");
  if (n.startsWith("4")) return "visa";
  if (/^5[1-5]/.test(n)) return "mastercard";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "discover";
  return "visa";
};

export default function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);
  const [medias, setMedias] = useState<EventMedia[]>([]);
  const [step, setStep] = useState<"paywall" | "auth" | "choice" | "upsell" | "checkout" | "processing" | "countdown" | "denied" | "success">("paywall");
  const [access, setAccess] = useState<AccessData | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [needsAccessChoice, setNeedsAccessChoice] = useState(false);
  const [accessType, setAccessType] = useState<"PUBLIC" | "PRIVATE">("PUBLIC");
  
  const [cart, setCart] = useState<string[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceData[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [includeLivePrint, setIncludeLivePrint] = useState(false);
  const [includeShipping] = useState(false);

  const [cardData, setCardData] = useState({ number: "", name: "", month: "", year: "", cvv: "", cpf: "", email: user?.email || "" });
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [tokenizing, setTokenizing] = useState(false);
  const [error, setError] = useState("");
  const [showPrintStore, setShowPrintStore] = useState(false);

  // Carrega carrinho do localStorage
  useEffect(() => {
    if (event?.id) {
      const saved = localStorage.getItem(`fs_cart_${event.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCart(parsed);
          setCartTotal(parsed.length * (event.pricePerPhoto || 15));
        } catch (e) {
          console.error("Erro ao carregar carrinho:", e);
        }
      }
    }
  }, [event?.id, event?.pricePerPhoto]);

  // Salva carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (event?.id) {
      localStorage.setItem(`fs_cart_${event.id}`, JSON.stringify(cart));
    }
  }, [cart, event?.id]);

  // Print Catalog States
  const [printProducts, setPrintProducts] = useState<PrintProductData[]>([]);
  const [selectedPrintProductId] = useState<string | null>(null);

  const handleShare = async () => {
    if (access?.accessType === "PRIVATE") {
      alert("Este álbum está em modo PRIVADO. Para compartilhar com seus convidados, você precisa torná-lo PÚBLICO na sua área do cliente (Minha Conta).");
      navigate("/minha-conta");
      return;
    }

    const isMarketplace = event?.type === 'PHOTO_MARKETPLACE';
    const deliveryUrl = isMarketplace 
      ? `${window.location.origin}/e/${event?.slug || event?.id}`
      : `${window.location.origin}/delivery/${event?.id}`;

    const shareData = {
      title: `Álbum: ${event?.nomeNoivos}`,
      text: isMarketplace ? `Veja as fotos ao vivo de ${event?.nomeNoivos}!` : `Confira as fotos do evento ${event?.nomeNoivos} no Foto Segundo!`,
      url: deliveryUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(deliveryUrl);
        alert("Link copiado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const params = user?.id ? { userId: user.id } : {};
    api.get(`/public/events/${slug}`, { params })
      .then((r) => {
        const eventData = r.data;
        setEvent(eventData);

        const eventDate = eventData.dataEvento ? new Date(eventData.dataEvento) : null;
        
        const now = new Date();
        const isFuture = eventDate && (eventDate.getTime() + (12 * 60 * 60 * 1000)) > now.getTime();

        const intent = searchParams.get("intent");

        if (intent === "upgrade") {
          setStep("paywall");
        } else if (isFuture && !eventData.lightroomUrl && !eventData.driveUrl && (!eventData.previewPhotos || eventData.previewPhotos.length === 0)) {
          setStep("countdown");
        } else if ((!isFuture || eventData.active) && eventData.type === 'ALBUM_FULL') {
          // Apenas álbuns tradicionais (ALBUM_FULL) vão para a página de entrega Luxury
          navigate(`/delivery/${eventData.id}`);
        } else if (eventData.isPrivate && !eventData.isPrimaryClient && !eventData.isOwner) {
          setStep("denied");
        } else if ((eventData.paywall && !eventData.paywall.active) || eventData.isOwner || eventData.type === 'PHOTO_MARKETPLACE') {
          setStep("success"); 
        }

        if (eventData.type === 'PHOTO_MARKETPLACE') {
          api.get(`/marketplace/events/${eventData.id}/media`)
            .then(res => setMedias(res.data))
            .catch(err => console.error("Erro ao carregar mídias:", err));
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) setStep("denied");
        else navigate("/404");
      })
      .finally(() => setLoading(false));

    api.get('/public/print-catalog').then(res => setPrintProducts(res.data)).catch(err => console.error(err));
    api.get('/public/service-catalog').then(res => setServiceCatalog(res.data || [])).catch(err => console.error(err));

    const interval = setInterval(() => setCurrentBannerIndex(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, [slug, navigate, user?.id, searchParams]);

  const handleAutoConfirmChoice = useCallback(async (oid: string) => {
    try {
      await api.post(`/orders/${oid}/access-type`, { accessType: "PUBLIC" });
      const { data } = await api.get(`/orders/${oid}/access-status`);
      setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
    } catch (err) { console.error("Erro no auto-confirm:", err); }
  }, [event?.nomeNoivos]);

  useEffect(() => {
    const checkAccessStatus = async (oid: string) => {
      if (!event) return; 
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        if (data.status === "PENDING_CHOICE") {
          setStep("success");
          if (event?.isPrimaryClient) setNeedsAccessChoice(true);
          else handleAutoConfirmChoice(oid);
        } else if (data.status === "ACTIVE") {
          setStep("success");
          setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
        }
      } catch { /* not paid */ }
    };
    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessStatus(oid); }
  }, [slug, searchParams, event, handleAutoConfirmChoice]);

  const handleTokenize = async () => {
    if (!MP_PUBLIC_KEY) { setError("Erro de configuração: Chave MP ausente."); return; }
    setTokenizing(true); setError("");
    try {
      const MP = (await loadMP()) as MPConstructor;
      const mp = new MP(MP_PUBLIC_KEY);
      const { token, error: mpErr } = await mp.createCardToken({
        cardNumber: cardData.number.replace(/\s/g, ""),
        cardholderName: cardData.name,
        cardExpirationMonth: cardData.month,
        cardExpirationYear: cardData.year,
        securityCode: cardData.cvv,
        identificationType: "CPF",
        identificationNumber: cardData.cpf.replace(/\D/g, ""),
      });
      if (mpErr) { setError("Dados do cartão inválidos. Verifique os campos."); return; }
      setCardToken(token);
    } catch { setError("Erro ao validar cartão."); }
    finally { setTokenizing(false); }
  };

  const pollPaymentStatus = async (oid: string) => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 10) { clearInterval(interval); setError("O pagamento está demorando. Verifique seu e-mail."); setStep("checkout"); return; }
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        if (data.status === "PENDING_CHOICE" || data.status === "ACTIVE") {
          clearInterval(interval);
          navigate("/minha-conta");
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  const handlePay = async () => {
    if (!event || !cardToken) return;
    setStep("processing"); setError("");
    try {
      const { data } = await api.post("/checkout/payment", {
        eventId: event.id, userId: user?.id, email: cardData.email, cpf: cardData.cpf,
        cardToken, installments: 1, paymentMethodId: detectBrand(cardData.number), accessType,
        cart, printProductId: selectedPrintProductId, selectedServices, includeLivePrint, includeShipping,  
      });
      if (data.hasPaid) { setOrderId(data.orderId); setJustPaid(true); setStep("success"); }
      else pollPaymentStatus(data.orderId);
    } catch (err: unknown) {
      const errorResponse = err as { response?: { data?: { code?: string; error?: string } } };
      const msg = errorResponse.response?.data?.code 
        ? (mpErrors[errorResponse.response.data.code] || errorResponse.response.data.error || "Erro no processamento.") 
        : "Erro no pagamento.";
      setError(msg); setStep("checkout"); setCardToken(null);
    }
  };

  const handleUnlockClick = async () => { 
    if (!event) return;
    if (!user) { setStep("auth"); return; }
    if (event.pendingOrderId) { navigate(`/checkout?orderId=${event.pendingOrderId}`); return; }
    if (searchParams.get("intent") === "upgrade") {
      try {
        const { data } = await api.post("/checkout/pending", {
          eventId: event.id, userId: user?.id, email: user?.email, selectedServices, includeLivePrint, includeShipping
        });
        navigate(`/checkout/${data.orderId}`);
      } catch (err) { console.error(err); alert("Erro ao iniciar upgrade. Tente novamente."); }
      return;
    }
    if (event.isPrimaryClient) setStep("choice");
    else { setAccessType("PUBLIC"); setStep(printProducts.length > 0 ? "upsell" : "checkout"); }
  };
  
  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCardData(p => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div style={{ height: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}><Spinner /></div>
  );

  if (!event) return null;

  const paid = step === "success";
  const isMarketplace = event.type === 'PHOTO_MARKETPLACE';
  
  const activeServices = SERVICES.filter(s => {
    const val = event[s.key as keyof EventData];
    return val === true || val === "true";
  });

  const toggleCart = (shortId: string) => {
    setCart(prev => {
      const exists = prev.includes(shortId);
      const next = exists ? prev.filter(s => s !== shortId) : [...prev, shortId];
      const price = event.pricePerPhoto || 15;
      setCartTotal(next.length * price);
      return next;
    });
  };

  return (
    <div 
      className="ep-main-container" 
      onContextMenu={(e) => e.preventDefault()}
      style={{ 
        height: "100vh", background: T.bg, color: T.text, fontFamily: T.fontB, 
        display: "flex", flexDirection: "column", userSelect: "none", overflow: "hidden"
      }}
    >
      <Helmet><title>{`Álbum: ${event.nomeNoivos} | Foto Segundo`}</title></Helmet>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .ep-grid { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 52px); overflow: hidden; }
        .ep-sidebar { overflow-y: auto; scrollbar-width: thin; scrollbar-color: ${T.border} transparent; }
        @media (max-width: 900px) {
          .ep-main-container { overflow: auto !important; height: auto !important; }
          .ep-grid { grid-template-columns: 1fr; grid-template-rows: auto; height: auto; overflow: visible; }
          .ep-cover { height: 65vh; min-height: 400px; }
          .mobile-hide { display: none !important; }
          .ep-sidebar { border-left: none !important; border-top: 1px solid ${T.border}; margin-bottom: 80px; }
          .ls-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 8px !important; }
          .ls-header { padding: 20px 16px 12px !important; }
          .ls-body { padding: 0 16px 32px !important; }
          .side-inner { padding: 24px 16px !important; }
          .sticky-mobile-buy { display: flex !important; }
        }
      `}</style>

      <Navbar />

      <div className="ep-grid">
        <div className="ep-cover" style={{ position: "relative", overflow: "hidden", background: T.bgCard }}>
          {(() => {
            const bannerImages = [event.coverPhotoUrl, ...(event.previewPhotos || [])].filter(Boolean).slice(0, 3);
            return (
              <div style={{ width: "100%", height: "100%", position: "relative" }}>
                {bannerImages.length > 0 ? bannerImages.map((img, i) => (
                  <img 
                    key={i} src={img as string} alt=""
                    style={{ 
                      position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", 
                      filter: paid ? "none" : "blur(6px) brightness(0.7)", 
                      transition: "opacity 1.5s ease-in-out",
                      opacity: (currentBannerIndex % bannerImages.length) === i ? 1 : 0
                    }}
                  />
                )) : (
                  <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a" }}>
                    <div style={{ fontFamily: T.fontD, fontSize: "10vw", color: "#fff", opacity: 0.05, textTransform: "uppercase" }}>{event.nomeNoivos}</div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* MARKETPLACE LIVE FEED */}
          {isMarketplace && (
            <div style={{ position: "absolute", inset: 0, zIndex: 10, display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.92)", backdropFilter: "blur(25px)" }}>
               <div className="ls-header" style={{ padding: "40px 30px 20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: T.brand, boxShadow: `0 0 10px ${T.brand}` }} />
                    <h2 style={{ fontFamily: T.fontD, fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 900, color: T.text, margin: 0, textTransform: "uppercase", letterSpacing: 2 }}>Live Stream</h2>
                  </div>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0, opacity: 0.8 }}>Capturas em tempo real. Selecione para imprimir ou baixar.</p>
               </div>

               <div className="ls-body" style={{ flex: 1, overflowY: "auto", padding: "0 30px 40px" }}>
                  <div className="ls-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 15 }}>
                    {event.previewPhotos?.map((url, idx) => {
                      const refCode = url.split('/').pop()?.split('.')[0] || `FOTO-${idx}`;
                      const isSelected = cart.includes(refCode);
                      return (
                        <div 
                          key={idx} onClick={() => toggleCart(refCode)}
                          style={{ 
                            position: "relative", aspectRatio: "3/4", background: T.bgField, cursor: "pointer",
                            border: `2px solid ${isSelected ? T.brand : "transparent"}`, transition: "all 0.2s ease"
                          }}
                        >
                           <img src={url} alt={refCode} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: isSelected ? 0.6 : 1 }} />
                            {/* Reference Badge (White bar style) */}
                            <div style={{ 
                              position: "absolute", bottom: 0, left: 0, right: 0, 
                              background: isSelected ? T.brand : "#fff", 
                              padding: "12px 16px", zIndex: 10, display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}>
                               <span style={{ fontSize: 20, fontWeight: 900, color: "#000", letterSpacing: 1, fontFamily: T.fontD }}>
                                 {refCode}
                               </span>
                               {isSelected && <Check size={20} color="#000" strokeWidth={5} />}
                            </div>
                        </div>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}

          {/* Overlay unificado se não for marketplace */}
          {!isMarketplace && (
            <div className="mobile-w-full" style={{ position: "absolute", inset: 0, zIndex: 10, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 36px" }}>
              <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                {activeServices.map(s => (
                  <span key={s.key} style={{ fontSize: 8, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, padding: "4px 8px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)", color: "#fff" }}>{s.label}</span>
                ))}
              </div>
              <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(28px, 4vw, 48px)", color: "#fff", textTransform: "uppercase", margin: 0 }}>{event.nomeNoivos}</h1>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 8 }}>{event.dataEvento ? new Date(event.dataEvento).toLocaleDateString() : ""}</div>
            </div>
          )}
        </div>

        <aside className="ep-sidebar" style={{ borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column", background: T.bg }}>
          {justPaid && (
            <div style={{ padding: "12px 20px", background: "#4ade8008", borderBottom: `1px solid #4ade8020`, display: "flex", alignItems: "center", gap: 10 }}>
              <Check size={14} color="#4ade80" strokeWidth={3} />
              <span style={{ fontSize: 9, fontWeight: 800, color: "#4ade80", textTransform: "uppercase", letterSpacing: 2 }}>Pagamento confirmado</span>
            </div>
          )}

          <div className="side-inner" style={{ padding: "40px 28px", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
            {step === "paywall" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.3s ease" }}>
                <div>
                  <p style={{ fontSize: 10, color: T.brand, textTransform: "uppercase", fontWeight: 900, letterSpacing: 2 }}>{searchParams.get("intent") === "upgrade" ? "Upgrades Disponíveis" : (isMarketplace ? "Sua Seleção" : "Álbum Completo")}</p>
                  <p style={{ fontFamily: T.fontD, fontSize: 40, fontWeight: 900, color: T.text, margin: 0 }}>
                    R$ {(searchParams.get("intent") === "upgrade" 
                      ? (serviceCatalog.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.basePrice), 0) + (includeLivePrint ? 150 : 0) + (includeShipping ? 25 : 0))
                      : (isMarketplace ? cartTotal : event.priceBase)
                    ).toFixed(2).replace(".", ",")}
                  </p>
                </div>

                {searchParams.get("intent") === "upgrade" && (
                   <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {serviceCatalog.map(s => (
                        <div key={s.id} onClick={() => setSelectedServices(p => p.includes(s.id) ? p.filter(id => id !== s.id) : [...p, s.id])}
                          style={{ padding: 12, border: `1px solid ${selectedServices.includes(s.id) ? T.brand : T.border}`, background: selectedServices.includes(s.id) ? `${T.brand}10` : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                           {s.category === 'VÍDEO' ? <Video size={16} color={T.brand} /> : <Zap size={16} color={T.brand} />}
                           <div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700 }}>{s.name}</div><div style={{ fontSize: 9, color: T.text3 }}>R$ {Number(s.basePrice).toFixed(0)}</div></div>
                           <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${T.border}`, background: selectedServices.includes(s.id) ? T.brand : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{selectedServices.includes(s.id) && <Check size={8} color="black" strokeWidth={4} />}</div>
                        </div>
                      ))}
                      <div onClick={() => setIncludeLivePrint(!includeLivePrint)} style={{ padding: 12, border: `1px solid ${includeLivePrint ? T.brand : T.border}`, background: includeLivePrint ? `${T.brand}10` : "transparent", cursor: "pointer", display: "flex", alignItems: "center", gap: 12 }}>
                        <Printer size={16} color={T.brand} /><div style={{ flex: 1 }}><div style={{ fontSize: 11, fontWeight: 700 }}>Totem de Impressão</div><div style={{ fontSize: 9, color: T.text3 }}>R$ 150</div></div>
                        <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1px solid ${T.border}`, background: includeLivePrint ? T.brand : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>{includeLivePrint && <Check size={8} color="black" strokeWidth={4} />}</div>
                      </div>
                   </div>
                )}

                <button onClick={handleUnlockClick} style={{ ...BtnPrimary, width: "100%", justifyContent: "center" }}>
                  {searchParams.get("intent") === "upgrade" ? "CONFIRMAR UPGRADE" : (isMarketplace ? "COMPRAR SELEÇÃO" : "DESBLOQUEAR ÁLBUM")}
                </button>
              </div>
            )}

            {step === "countdown" && (
              <div style={{ textAlign: "center", animation: "fadeUp 0.3s ease" }}>
                <p style={{ color: T.brand, fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 2 }}>Evento em breve</p>
                <p style={{ fontSize: 12, color: T.text2, marginBottom: 24 }}>O álbum será liberado aqui após o evento.</p>
                {event.dataEvento && <Countdown targetDate={event.dataEvento} />}
                <button onClick={handleShare} style={{ ...BtnSecondary, width: "100%", marginTop: 32 }}>COMPARTILHAR ESPERA</button>
              </div>
            )}

            {step === "success" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 20, animation: "fadeUp 0.3s ease" }}>
                <p style={{ color: T.brand, fontWeight: 900, textTransform: "uppercase", fontSize: 10, letterSpacing: 2 }}>Acesso Liberado</p>
                {event.lightroomUrl && (
                  <a href={event.lightroomUrl} target="_blank" rel="noreferrer" style={{ ...BtnPrimary, textDecoration: "none", justifyContent: "center" }}>
                    📸 VER TODAS AS FOTOS
                  </a>
                )}
                {event.driveUrl && (
                  <a href={event.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, textDecoration: "none", justifyContent: "center", color: T.text }}>
                    🎬 VER VÍDEOS
                  </a>
                )}
                <button onClick={() => setShowPrintStore(true)} style={{ ...BtnSecondary, color: T.brand, borderColor: T.brand }}>📖 ETERNIZE NO PAPEL</button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* STICKY MOBILE BUY BAR (MARKETPLACE) */}
      {isMarketplace && cart.length > 0 && (
        <div className="sticky-mobile-buy" style={{ 
          display: "none", position: "fixed", bottom: 0, left: 0, right: 0, 
          background: T.bgCard, borderTop: `1px solid ${T.brand}`, 
          padding: "16px 20px", zIndex: 100, alignItems: "center", justifyContent: "space-between",
          boxShadow: "0 -10px 30px rgba(0,0,0,0.5)", backdropFilter: "blur(20px)"
        }}>
          <div>
            <div style={{ fontSize: 9, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>{cart.length} Selecionadas</div>
            <div style={{ fontSize: 18, color: T.brand, fontFamily: T.fontD, fontWeight: 900 }}>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cartTotal)}</div>
          </div>
          <button 
            onClick={handleUnlockClick} 
            style={{ ...BtnPrimary, padding: "12px 24px", fontSize: 11 }}
          >
            COMPRAR AGORA
          </button>
        </div>
      )}

      <Modal isOpen={step === "checkout" || step === "processing" || step === "choice" || step === "upsell"} onClose={() => setStep("paywall")} title="Pagamento Seguro">
         {step === "checkout" && (
           <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
             <div style={{ background: T.bgCard, padding: 16, border: `1px solid ${T.border}`, marginBottom: 8 }}>
               <div style={{ fontSize: 10, color: T.text3, textTransform: "uppercase" }}>Total a Pagar</div>
               <div style={{ fontSize: 24, fontWeight: 900, color: T.brand }}>R$ {((isMarketplace ? cartTotal : event.priceBase) + (selectedPrintProductId ? printProducts.find(p => p.id === selectedPrintProductId)?.finalPrice || 0 : 0)).toFixed(2)}</div>
             </div>
             <div><label style={FieldLabel}>Nome no Cartão</label><input style={FieldInput} placeholder="NOME IMPRESSO" value={cardData.name} onChange={handleChange("name")} /></div>
             <div><label style={FieldLabel}>Número do Cartão</label><input style={FieldInput} placeholder="0000 0000 0000 0000" value={cardData.number} onChange={handleChange("number")} /></div>
             <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
               <div><label style={FieldLabel}>Mês</label><input style={FieldInput} placeholder="MM" value={cardData.month} onChange={handleChange("month")} /></div>
               <div><label style={FieldLabel}>Ano</label><input style={FieldInput} placeholder="AA" value={cardData.year} onChange={handleChange("year")} /></div>
               <div><label style={FieldLabel}>CVV</label><input style={FieldInput} placeholder="000" value={cardData.cvv} onChange={handleChange("cvv")} /></div>
             </div>
             <div><label style={FieldLabel}>CPF</label><input style={FieldInput} placeholder="000.000.000-00" value={cardData.cpf} onChange={handleChange("cpf")} /></div>
             <div><label style={FieldLabel}>E-mail</label><input style={FieldInput} placeholder="seu@email.com" value={cardData.email} onChange={handleChange("email")} /></div>
             
             {error && <div style={{ fontSize: 11, color: "#f87171", background: "#f8717111", padding: 10, border: "1px solid #f8717133" }}>{error}</div>}
             
             {!cardToken ? (
               <button onClick={handleTokenize} disabled={tokenizing} style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 10 }}>{tokenizing ? "VALIDANDO..." : "PRÓXIMO PASSO"}</button>
             ) : (
               <button onClick={handlePay} style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 10 }}>FINALIZAR PAGAMENTO</button>
             )}
           </div>
         )}
         {step === "processing" && (
           <div style={{ textAlign: "center", padding: "40px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
             <Spinner /><p style={{ fontSize: 14, fontWeight: 700 }}>Processando seu pagamento...</p>
           </div>
         )}
         {step === "choice" && (
           <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
             <p style={{ fontSize: 13, color: T.text2 }}>Como você deseja configurar o acesso ao álbum?</p>
             <button onClick={() => { setAccessType("PUBLIC"); setStep("checkout"); }} style={{ ...BtnSecondary, padding: 20, textAlign: "left", display: "block" }}>
               <div style={{ fontWeight: 900, color: T.brand }}>🔓 MODO PÚBLICO</div>
               <div style={{ fontSize: 10, textTransform: "none" }}>O link poderá ser compartilhado com qualquer pessoa.</div>
             </button>
             <button onClick={() => { setAccessType("PRIVATE"); setStep("checkout"); }} style={{ ...BtnSecondary, padding: 20, textAlign: "left", display: "block" }}>
               <div style={{ fontWeight: 900, color: T.text }}>🔒 MODO PRIVADO</div>
               <div style={{ fontSize: 10, textTransform: "none" }}>Apenas você poderá acessar via login.</div>
             </button>
           </div>
         )}
      </Modal>

      {step === "auth" && <AuthModal onSuccess={() => setStep("paywall")} onClose={() => setStep("paywall")} />}
      {showPrintStore && <PrintStoreModal eventId={event.id} eventTitle={event.nomeNoivos} medias={medias} onClose={() => setShowPrintStore(false)} />}
      {needsAccessChoice && orderId && <AccessTypeModal orderId={orderId} eventTitle={event.nomeNoivos} isPrimaryClient={true} onConfirmed={() => setNeedsAccessChoice(false)} onClose={() => setNeedsAccessChoice(false)} />}
    </div>
  );
}

import { useState, useEffect } from "react";
import { Check } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { T, BtnPrimary, BtnSecondary, FieldLabel, FieldInput } from "../lib/theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthModal } from "../components/AuthModal";
import { Modal } from "../components/UI/Modal";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/Navbar";

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
    <div style={{ display: "flex", gap: 20, padding: "20px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, margin: "10px 0" }}>
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
  category: string;
  name: string;
  description?: string;
  finalPrice: number;
}

type Step = "paywall" | "auth" | "choice" | "upsell" | "checkout" | "processing" | "success";

const Spinner = () => (
  <div style={{ width: 28, height: 28, border: `2px solid ${T.brand}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
);

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "master";
  if (/^3[47]/.test(n)) return "amex";
  return "visa";
}

const mpErrors: Record<string, string> = {
  cc_rejected_insufficient_amount: "Cartão sem limite suficiente.",
  cc_rejected_bad_filled_security_code: "CVV inválido.",
  cc_rejected_bad_filled_date: "Data de validade incorreta.",
  cc_rejected_call_for_authorize: "Pagamento não autorizado. Contate seu banco.",
  cc_rejected_card_disabled: "Cartão desabilitado. Contate seu banco.",
};

const MP_PUBLIC_KEY = (import.meta.env.VITE_MP_PUBLIC_KEY ?? "").trim().replace(/[\r\n\t]/g, "");

const loadMP = () => new Promise((resolve) => {
  const win = window as Window & { MercadoPago?: unknown };
  if (win.MercadoPago) return resolve(win.MercadoPago);
  const script = document.createElement("script");
  script.src = "https://sdk.mercadopago.com/js/v2";
  script.onload = () => resolve(win.MercadoPago);
  document.body.appendChild(script);
});

const SERVICES = [
  { key: "temFoto", label: "Fotos em Alta" },
  { key: "temVideo", label: "Vídeo Cinema" },
  { key: "temReels", label: "Reels / Stories" },
  { key: "temFotoImpressa", label: "Foto Impressa" },
];

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [step, setStep] = useState<Step>("paywall");
  const [access, setAccess] = useState<AccessData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [justPaid, setJustPaid] = useState(false);
  const [error, setError] = useState("");
  const [tokenizing, setTokenizing] = useState(false);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [cardData, setCardData] = useState({ number: "", name: "", month: "", year: "", cvv: "", email: "", cpf: "" });
  const [needsAccessChoice, setNeedsAccessChoice] = useState(false);
  const [accessType, setAccessType] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const { user } = useAuth();

  // Marketplace States
  const [medias, setMedias] = useState<EventMedia[]>([]);
  const [cart, setCart] = useState<string[]>([]); // Array de shortIds selecionados
  const [cartTotal, setCartTotal] = useState(0);

  // Carrega carrinho do localStorage ao iniciar
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
  const [selectedPrintProductId, setSelectedPrintProductId] = useState<string | null>(null);

  const handleShare = async () => {
    if (access?.accessType === "PRIVATE") {
      alert("Este álbum está em modo PRIVADO. Para compartilhar com seus convidados, você precisa torná-lo PÚBLICO na sua área do cliente (Minha Conta).");
      navigate("/minha-conta");
      return;
    }

    const shareData = {
      title: `Álbum: ${event?.nomeNoivos}`,
      text: `Confira as fotos do evento ${event?.nomeNoivos} no Foto Segundo!`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setSharing(true);
        setTimeout(() => setSharing(false), 2000);
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
        setEvent(r.data);
        if ((r.data.paywall && !r.data.paywall.active) || r.data.isOwner) {
          setStep("success"); 
        }
        // Se for marketplace, busca as mídias
        if (r.data.type === 'PHOTO_MARKETPLACE') {
          api.get(`/marketplace/events/${r.data.id}/media`)
            .then(res => setMedias(res.data))
            .catch(err => console.error("Erro ao carregar mídias:", err));
        }
      })
      .catch(() => navigate("/404"))
      .finally(() => setLoading(false));

    // Fetch Print Catalog
    api.get('/public/print-catalog')
      .then(res => setPrintProducts(res.data))
      .catch(err => console.error("Erro ao carregar catálogo de impressão:", err));
  }, [slug, navigate, user?.id, user?.role]);

  useEffect(() => {
    const checkAccessStatus = async (oid: string) => {
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        if (data.status === "PENDING_CHOICE") {
          setStep("success");
          setNeedsAccessChoice(true);
        } else if (data.status === "ACTIVE") {
          setStep("success");
        }
      } catch { /* not paid */ }
    };
    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessStatus(oid); }
  }, [slug, searchParams, event?.nomeNoivos, navigate, user?.role]);

  const handleTokenize = async () => {
    if (!MP_PUBLIC_KEY) { setError("Erro de configuração: Chave MP ausente."); return; }
    setTokenizing(true); setError("");
    try {
      const MP: unknown = await loadMP();
      const mp = new (MP as { new(key: string): { createCardToken: (d: unknown) => Promise<{ token: string; error?: unknown }> } })(MP_PUBLIC_KEY);
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
        cart, // Envia os shortIds selecionados
        printProductId: selectedPrintProductId, // Envia o produto impresso se houver
      });
      if (data.hasPaid) { setOrderId(data.orderId); setJustPaid(true); setStep("success"); }
      else pollPaymentStatus(data.orderId);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { code?: string; error?: string } } };
      const msg = axiosErr.response?.data?.code
        ? (mpErrors[axiosErr.response.data.code] || axiosErr.response.data.error || "Erro no processamento.")
        : "Erro no pagamento.";
      setError(msg); setStep("checkout"); setCardToken(null);
    }
  };

  const handleUnlockClick = () => { 
    if (!event) return;
    if (!user) {
      setStep("auth"); 
      return;
    }
    if (event.pendingOrderId) {
      navigate(`/checkout?orderId=${event.pendingOrderId}`);
      return;
    }
    setStep("choice"); 
  };
  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCardData(p => ({ ...p, [k]: e.target.value }));

  // ── SEO & Fallback Logic ───────────────────────────────────────────────────
  const getSEOData = () => {
    if (!event) return { title: "Foto Segundo", description: "Plataforma de Fotografia", image: "" };
    const defaults = ["/defaults/cover1.png", "/defaults/cover2.png", "/defaults/cover3.png"];
    const index = event.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaults.length;
    const fallback = window.location.origin + defaults[index];
    const image = event.coverPhotoUrl || fallback;
    const dateStr = event.dataEvento ? new Date(event.dataEvento).toLocaleDateString("pt-BR") : "";
    const description = `Confira as fotos de ${event.nomeNoivos}${dateStr ? " em " + dateStr : ""}. Acesse suas memórias digitais e recorde os melhores momentos no Foto Segundo.`;

    return {
      title: `Álbum: ${event.nomeNoivos} | Foto Segundo`,
      description,
      image,
      url: window.location.href
    };
  };

  const seo = getSEOData();

  if (loading) return (
    <div style={{ height: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (!event) return null;

  const paid = step === "success";
  const activeServices = SERVICES.filter(s => event[s.key as keyof EventData]);
  const dateStr = event.dataEvento
    ? new Date(event.dataEvento).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
    : "";

  const isMarketplace = event.type === 'PHOTO_MARKETPLACE';

  const toggleCart = (shortId: string) => {
    setCart(prev => {
      const exists = prev.includes(shortId);
      const next = exists ? prev.filter(s => s !== shortId) : [...prev, shortId];
      // Calcula total
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
        height: "100vh", 
        background: T.bg, 
        color: T.text, 
        fontFamily: T.fontB, 
        display: "flex", 
        flexDirection: "column",
        userSelect: "none",
        overflow: "hidden"
      }}
    >
      <Helmet>
        <title>{seo.title}</title>
        <meta name="description" content={seo.description} />
        
        {/* OpenGraph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content={seo.url} />
        <meta property="og:title" content={seo.title} />
        <meta property="og:description" content={seo.description} />
        <meta property="og:image" content={seo.image} />

        {/* Twitter */}
        <meta property="twitter:card" content="summary_large_image" />
        <meta property="twitter:url" content={seo.url} />
        <meta property="twitter:title" content={seo.title} />
        <meta property="twitter:description" content={seo.description} />
        <meta property="twitter:image" content={seo.image} />
      </Helmet>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .ep-grid { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 52px); overflow: hidden; }
        .ep-sidebar { overflow-y: auto; }
        @media (min-width: 901px) {
          .desktop-hide { display: none !important; }
        }
        .ep-main-container { overflow: hidden; }
        @media (max-width: 900px) {
          .ep-main-container { overflow: auto !important; height: auto !important; }
          .ep-grid { grid-template-columns: 1fr; grid-template-rows: auto; height: auto; overflow: auto; }
          .ep-cover { height: 75vh; min-height: 480px; }
          .mobile-hide { display: none !important; }
        }
      `}</style>

      <Navbar />

      <div className="ep-grid">
        <div className="ep-cover" style={{ position: "relative", overflow: "hidden", background: T.bgCard }}>
          {event.coverPhotoUrl ? (
            <img src={event.coverPhotoUrl} alt={event.nomeNoivos}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: paid ? "none" : "blur(6px) brightness(0.7)", transition: "filter 0.8s ease" }}
            />
          ) : (
            <div style={{ 
              width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", 
              background: `radial-gradient(circle at center, #1a1a1a 0%, #0a0a0a 100%)`,
              position: "relative", overflow: "hidden"
            }}>
              {/* Marca d'água do nome do evento */}
              <div style={{ 
                position: "absolute", fontFamily: T.fontD, fontSize: "15vw", fontWeight: 900, 
                color: "#fff", opacity: 0.03, textTransform: "uppercase", whiteSpace: "nowrap",
                pointerEvents: "none", userSelect: "none"
              }}>
                {event.nomeNoivos}
              </div>
              
              {/* Logo Centralizada */}
              <img 
                src="/logo-fs.png" 
                alt="Foto Segundo" 
                style={{ 
                  height: "clamp(30px, 5vw, 60px)", 
                  opacity: 0.3, 
                  filter: "brightness(0) invert(1)", // Torna a logo branca
                  zIndex: 1 
                }} 
              />
              <div style={{ 
                marginTop: 20, fontSize: 10, letterSpacing: 5, color: "#fff", 
                opacity: 0.2, textTransform: "uppercase", fontWeight: 300, zIndex: 1 
              }}>
                Álbum em Processamento
              </div>
            </div>
          )}

          {/* Overlay gradiente unificado */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 36px" }}>
            {!paid && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ padding: 18, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)", borderRadius: "50%", color: "rgba(255,255,255,0.7)" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
              </div>
            )}

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 24, height: 2, background: T.brand }} />
              <span style={{ fontSize: 9, letterSpacing: 3, textTransform: "uppercase", color: T.brand, fontWeight: 700 }}>
                {typeof event.cartorio === "string" ? event.cartorio : "Registro Editorial"}
              </span>
            </div>

            <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(28px, 4vw, 48px)", lineHeight: 1, color: "#fff", textTransform: "uppercase", margin: "0 0 8px" }}>
              {event.nomeNoivos}
            </h1>

            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginBottom: 20 }}>
              {dateStr}{event.city ? ` · ${event.city}` : ""}
            </div>

            {activeServices.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {activeServices.map(s => (
                  <span key={s.key} style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, padding: "5px 10px", border: "1px solid rgba(255,255,255,0.2)", color: "rgba(255,255,255,0.65)", backdropFilter: "blur(4px)" }}>
                    {s.label}
                  </span>
                ))}
              </div>
            )}

            {paid && access && (access.lightroomUrl || access.driveUrl) && (
              <div className="desktop-hide" style={{ display: "flex", gap: 10, marginTop: 24, animation: "fadeUp 0.5s ease" }}>
                {access.lightroomUrl && (
                  <a href={access.lightroomUrl} target="_blank" rel="noreferrer" style={{ ...BtnPrimary, flex: 1, justifyContent: "center", textDecoration: "none", fontSize: 11 }}>
                    Álbum de Fotos
                  </a>
                )}
                {access.driveUrl && (
                  <a href={access.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, flex: 1, justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 11 }}>
                    Vídeos
                  </a>
                )}
              </div>
            )}

            {isMarketplace && !paid && medias.length > 0 && (
              <div style={{ marginTop: 20, animation: "fadeUp 0.6s ease" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
                  {medias.map(m => (
                    <div 
                      key={m.id} 
                      onClick={() => toggleCart(m.shortId)}
                      style={{ 
                        aspectRatio: "1/1", 
                        background: T.bgCard, 
                        border: `1px solid ${cart.includes(m.shortId) ? T.brand : T.border}`,
                        position: "relative",
                        cursor: "pointer",
                        overflow: "hidden"
                      }}
                    >
                      <img src={m.url} alt={m.shortId} style={{ width: "100%", height: "100%", objectFit: "cover", filter: "blur(2px) grayscale(1) brightness(0.6)" }} />
                      <div style={{ position: "absolute", top: 8, left: 8, background: cart.includes(m.shortId) ? T.brand : "rgba(0,0,0,0.5)", color: cart.includes(m.shortId) ? "black" : "white", padding: "2px 6px", fontSize: 9, fontWeight: 900 }}>
                        #{m.shortId}
                      </div>
                      {cart.includes(m.shortId) && (
                        <div style={{ position: "absolute", inset: 0, border: `3px solid ${T.brand}`, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(133,185,172,0.1)" }}>
                          <Check size={32} color={T.brand} />
                        </div>
                      )}
                      
                      {paid && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12 }}>
                           <button 
                            onClick={(e) => { e.stopPropagation(); window.open(m.url, '_blank'); }}
                            style={{ background: T.brand, color: "black", border: "none", padding: "6px 12px", fontSize: 9, fontWeight: 900, cursor: "pointer", borderRadius: 2 }}
                           >
                            VER ORIGINAL
                           </button>
                           <a 
                            href={m.url} 
                            download={`foto-${m.shortId}.jpg`}
                            onClick={e => e.stopPropagation()}
                            style={{ background: "white", color: "black", padding: "6px 12px", fontSize: 9, fontWeight: 900, textDecoration: "none", borderRadius: 2 }}
                           >
                            DOWNLOAD
                           </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <aside className="ep-sidebar" style={{ borderLeft: `1px solid ${T.border}`, display: "flex", flexDirection: "column" }}>

          {justPaid && (
            <div style={{ padding: "10px 20px", background: "#4ade8012", borderBottom: `1px solid #4ade8030`, display: "flex", alignItems: "center", gap: 10, animation: "fadeUp 0.4s ease" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              <span style={{ fontSize: 10, fontWeight: 700, color: "#4ade80", textTransform: "uppercase", letterSpacing: 2 }}>Pagamento confirmado</span>
              {orderId && <span style={{ fontSize: 9, fontFamily: "monospace", color: T.text3, marginLeft: "auto" }}>#{orderId.slice(-8).toUpperCase()}</span>}
            </div>
          )}

          <div style={{ padding: 28, flex: 1 }}>

            {step === "paywall" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 24, animation: "fadeUp 0.3s ease" }}>
                <div>
                  <p style={{ fontSize: 9, letterSpacing: 3, color: T.brand, textTransform: "uppercase", margin: "0 0 8px", fontWeight: 700 }}>
                    {isMarketplace ? "Sua Galeria Particular" : (event.isUnitSale ? "Clique Único / Foto Avulsa" : "Exclusive Collection")}
                  </p>
                  <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 40, color: T.text, margin: "0 0 2px", lineHeight: 1 }}>
                    {isMarketplace 
                      ? (cart.length > 0 ? `R$ ${cartTotal.toFixed(2).replace(".", ",")}` : "Selecione...")
                      : `R$ ${Number(event.isUnitSale ? event.priceUnit : event.priceBase).toFixed(2).replace(".", ",")}`
                    }
                  </p>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>
                    {isMarketplace 
                      ? `${cart.length} fotos selecionadas (R$ ${event.pricePerPhoto}/cada)`
                      : (event.isUnitSale ? "Download do arquivo original" : "Acesso vitalício · Download imediato")
                    }
                  </p>
                </div>

                {isMarketplace && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, maxHeight: 200, overflowY: "auto", padding: "10px", background: "rgba(255,255,255,0.02)", border: `1px solid ${T.border}` }}>
                    {cart.map(id => (
                      <div key={id} style={{ fontSize: 10, fontWeight: 900, color: T.brand, display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 10px", background: "rgba(133,185,172,0.1)" }}>
                        <span>#{id}</span>
                        <button onClick={() => toggleCart(id)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>×</button>
                      </div>
                    ))}
                    {cart.length === 0 && <div style={{ gridColumn: "span 2", textAlign: "center", fontSize: 9, color: T.text3, padding: 20 }}>Nenhuma foto selecionada</div>}
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  {isMarketplace 
                    ? ["Arquivos em alta resolução", "Liberação instantânea após PIX", "Seleção protegida"].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.text2 }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, flexShrink: 0 }} /> {item}
                      </div>
                    ))
                    : ["Arquivos originais em 4K", "Sem marcas d'água", "Direito de uso comercial"].map(item => (
                      <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.text2 }}>
                        <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, flexShrink: 0 }} /> {item}
                      </div>
                    ))
                  }
                </div>
                
                <button 
                  onClick={handleUnlockClick} 
                  disabled={isMarketplace && cart.length === 0}
                  className="mobile-hide"
                  style={{ ...BtnPrimary, width: "100%", justifyContent: "center", opacity: (isMarketplace && cart.length === 0) ? 0.5 : 1 }}
                >
                  {event.pendingOrderId ? "FINALIZAR AGORA" : (isMarketplace ? "COMPRAR SELEÇÃO" : "DESBLOQUEAR ÁLBUM")}
                </button>

                {/* Mobile Sticky CTA */}
                <div className="desktop-hide" style={{ position: "fixed", bottom: 0, left: 0, right: 0, padding: "16px 20px", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(10px)", borderTop: `1px solid ${T.border}`, zIndex: 100, display: "flex", justifyContent: "center" }}>
                   <button 
                    onClick={handleUnlockClick} 
                    disabled={isMarketplace && cart.length === 0}
                    style={{ ...BtnPrimary, width: "100%", justifyContent: "center", opacity: (isMarketplace && cart.length === 0) ? 0.5 : 1 }}
                  >
                    {event.pendingOrderId ? "FINALIZAR AGORA" : (isMarketplace ? "COMPRAR SELEÇÃO" : "DESBLOQUEAR ÁLBUM")}
                  </button>
                </div>

                <p style={{ fontSize: 9, color: T.text3, textAlign: "center", margin: 0 }}>Secure Payment · SSL · Instant Access</p>
              </div>
            )}

            {step === "success" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.3s ease" }}>
                {!access?.lightroomUrl && !access?.driveUrl ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: T.brand, margin: 0 }}>
                      Evento em breve
                    </p>
                    <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>
                      {(orderId || justPaid) 
                        ? "Sua compra foi confirmada! O contador abaixo mostra o tempo restante para o grande dia."
                        : "O grande dia está chegando! Fique atento, as fotos serão liberadas aqui após o evento."}
                    </p>
                    {event.dataEvento && <Countdown targetDate={event.dataEvento} />}
                    <button onClick={handleShare} style={{ ...BtnSecondary, width: "100%", justifyContent: "center", color: T.text }}>
                      {sharing ? "LINK COPIADO!" : "COMPARTILHAR LINK"}
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: T.brand, margin: 0 }}>
                      {(orderId || justPaid) ? (justPaid ? "Tudo pronto!" : "Acesso Liberado") : "Fotos Disponíveis!"}
                    </p>
                    <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>
                      {(orderId || justPaid) 
                        ? "Seus arquivos estão disponíveis nos botões abaixo."
                        : "Confira as memórias desse dia incrível nos links abaixo."}
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {access.lightroomUrl && <a href={access.lightroomUrl} target="_blank" rel="noreferrer" style={{ ...BtnPrimary, textDecoration: "none", justifyContent: "center" }}>Álbum de Fotos</a>}
                      {access.driveUrl && <a href={access.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, color: T.text, borderColor: T.brand, textDecoration: "none", justifyContent: "center" }}>Vídeos</a>}
                      
                      <a 
                        href={`https://wa.me/5519997843817?text=Gostaria%20de%20encomendar%20um%20%C3%A1lbum%20impresso%20do%20evento%3A%20${encodeURIComponent(event.nomeNoivos)}`} 
                        target="_blank" 
                        rel="noreferrer" 
                        style={{ ...BtnSecondary, color: T.brand, borderColor: T.brand, textDecoration: "none", justifyContent: "center", marginTop: 8, fontWeight: 900, borderStyle: 'dashed' }}
                      >
                        ETERNIZE NO PAPEL: ÁLBUM IMPRESSO
                      </a>

                      <div style={{ marginTop: 8, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                        <button onClick={handleShare} style={{ ...BtnSecondary, width: "100%", justifyContent: "center", border: "none", color: T.text3, fontSize: 11, letterSpacing: 1 }}>
                          {sharing ? "LINK COPIADO!" : "COMPARTILHAR ÁLBUM"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {event.recentOrders && event.recentOrders.length > 0 && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}`, animation: "fadeUp 0.4s ease" }}>
                <p style={{ fontSize: 9, letterSpacing: 2, color: T.brand, textTransform: "uppercase", margin: "0 0 16px", fontWeight: 700 }}>Mural de Contribuições</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {event.recentOrders.map((ord: { id: string; contributorName: string; valor: number }) => (
                    <div key={ord.id} style={{ display: "flex", alignItems: "center", gap: 10, background: `${T.brand}08`, padding: "10px 14px", border: `1px solid ${T.border}` }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: T.brand }}></div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 11, color: T.text, margin: 0, fontWeight: 700 }}>
                          {ord.contributorName.split(' ')[0]} presenteou os noivos
                        </p>
                        <p style={{ fontSize: 9, color: T.text3, margin: 0, textTransform: 'uppercase' }}>há pouco tempo</p>
                      </div>
                      <div style={{ fontWeight: 900, color: T.brand, fontSize: 12 }}>
                        R$ {Number(ord.valor).toFixed(0)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.previewPhotos && event.previewPhotos.filter(p => !!p).length > 0 && (
              <div style={{ marginTop: 32, paddingTop: 24, borderTop: `1px solid ${T.border}`, animation: "fadeUp 0.6s ease" }}>
                <p style={{ fontSize: 9, letterSpacing: 2, color: T.text3, textTransform: "uppercase", margin: "0 0 16px", fontWeight: 700 }}>Destaques da Galeria</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {event.previewPhotos.filter(p => !!p).map((url, idx) => (
                    <div key={idx} style={{ 
                      aspectRatio: "16/9", 
                      background: T.bgCard, 
                      overflow: "hidden", 
                      border: `1px solid ${T.border}`,
                      position: "relative"
                    }}>
                      <img 
                        src={url} 
                        alt={`Preview ${idx + 1}`} 
                        style={{ 
                          width: "100%", 
                          height: "100%", 
                          objectFit: "cover",
                          filter: paid ? "none" : "blur(4px) grayscale(1) opacity(0.6)",
                          transition: "filter 0.5s ease"
                        }} 
                      />
                      {!paid && (
                        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                           <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* Footer info */}
          <div style={{ padding: "16px 28px", borderTop: `1px solid ${T.border}`, fontSize: 9, color: T.text3, letterSpacing: 1 }}>
            FOTO SEGUNDO · {event.slug?.toUpperCase()}
          </div>
        </aside>
      </div>

      {/* MODAL DE CHECKOUT UNIFICADO (v2.0) */}
      <Modal 
        isOpen={step === "choice" || step === "upsell" || step === "checkout" || step === "processing"} 
        onClose={() => setStep("paywall")}
        title={step === "choice" ? "Privacidade do Álbum" : step === "upsell" ? "Oferta Especial" : "Pagamento Seguro"}
      >
        {step === "choice" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <p style={{ fontSize: 13, color: T.text2, lineHeight: 1.5 }}>
              Como você deseja que seu acesso seja configurado?
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              <button 
                onClick={() => { setAccessType("PUBLIC"); setStep(printProducts.length > 0 ? "upsell" : "checkout"); }}
                style={{ ...BtnSecondary, justifyContent: "flex-start", padding: 20, textAlign: "left", flexDirection: "column", alignItems: "flex-start" }}
              >
                <div style={{ fontWeight: 900, color: T.brand, marginBottom: 4 }}>🔓 MODO PÚBLICO</div>
                <div style={{ fontSize: 10, textTransform: "none", letterSpacing: 0 }}>Permite compartilhar o link com amigos e familiares.</div>
              </button>
              <button 
                onClick={() => { setAccessType("PRIVATE"); setStep(printProducts.length > 0 ? "upsell" : "checkout"); }}
                style={{ ...BtnSecondary, justifyContent: "flex-start", padding: 20, textAlign: "left", flexDirection: "column", alignItems: "flex-start" }}
              >
                <div style={{ fontWeight: 900, color: T.text, marginBottom: 4 }}>🔒 MODO PRIVADO</div>
                <div style={{ fontSize: 10, textTransform: "none", letterSpacing: 0 }}>Apenas você (logado) poderá visualizar as fotos.</div>
              </button>
            </div>
          </div>
        )}

        {step === "upsell" && printProducts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <p style={{ fontSize: 12, color: T.text2, lineHeight: 1.4 }}>
              Deseja eternizar esse momento em um lindo álbum impresso? Enviamos para todo o Brasil.
            </p>
            <div style={{ display: "grid", gap: 12, maxHeight: "50vh", overflowY: "auto", paddingRight: 4 }}>
              {printProducts.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPrintProductId(selectedPrintProductId === p.id ? null : p.id)}
                  style={{
                    border: `1px solid ${selectedPrintProductId === p.id ? T.brand : T.border}`,
                    background: selectedPrintProductId === p.id ? "rgba(133,185,172,0.05)" : T.bgField,
                    padding: 16,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 12
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 10, color: T.brand, fontWeight: 900, textTransform: "uppercase" }}>{p.category}</div>
                    <div style={{ fontSize: 13, color: T.text, fontWeight: 700, margin: "4px 0" }}>{p.name}</div>
                    {p.description && <div style={{ fontSize: 10, color: T.text3 }}>{p.description}</div>}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 14, fontFamily: T.fontD, fontWeight: 900, color: T.text }}>
                      +R$ {p.finalPrice.toFixed(2)}
                    </div>
                    <div style={{ width: 20, height: 20, borderRadius: "50%", border: `1px solid ${selectedPrintProductId === p.id ? T.brand : T.border}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "8px 0 0 auto", background: selectedPrintProductId === p.id ? T.brand : "transparent" }}>
                      {selectedPrintProductId === p.id && <Check size={12} color="black" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button onClick={() => { setSelectedPrintProductId(null); setStep("checkout"); }} style={{ ...BtnSecondary, flex: 1, justifyContent: "center" }}>
                PULAR
              </button>
              <button onClick={() => setStep("checkout")} style={{ ...BtnPrimary, flex: 1, justifyContent: "center" }}>
                CONTINUAR
              </button>
            </div>
          </div>
        )}

        {step === "checkout" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ background: T.bgField, border: `1px solid ${T.border}`, padding: 14, marginBottom: 10 }}>
              <div style={{ fontSize: 10, color: T.text2, textTransform: "uppercase", letterSpacing: 1 }}>{event.nomeNoivos}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: T.text, fontFamily: T.fontD }}>
                R$ {
                  (
                    (isMarketplace ? cartTotal : Number(event.isUnitSale ? event.priceUnit : event.priceBase)) + 
                    (selectedPrintProductId ? printProducts.find(p => p.id === selectedPrintProductId)?.finalPrice || 0 : 0)
                  ).toFixed(2)
                }
              </div>
              {selectedPrintProductId && (
                <div style={{ fontSize: 10, color: T.brand, marginTop: 4, fontWeight: 700 }}>
                  + INCLUI: {printProducts.find(p => p.id === selectedPrintProductId)?.name}
                </div>
              )}
            </div>

            {(["number", "name"] as const).map(k => (
              <div key={k}>
                <label style={FieldLabel}>{k === "number" ? "Número do Cartão" : "Nome no Cartão"}</label>
                <input style={FieldInput} value={cardData[k]} onChange={handleChange(k)} placeholder={k === "number" ? "0000 0000 0000 0000" : "NOME IMPRESSO"} />
              </div>
            ))}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {(["month", "year", "cvv"] as const).map(k => (
                <div key={k}>
                  <label style={FieldLabel}>{k === "month" ? "Mês" : k === "year" ? "Ano" : "CVV"}</label>
                  <input style={FieldInput} value={cardData[k]} onChange={handleChange(k)} placeholder={k === "month" ? "MM" : k === "year" ? "AA" : "000"} />
                </div>
              ))}
            </div>
            {(["cpf", "email"] as const).map(k => (
              <div key={k}>
                <label style={FieldLabel}>{k === "cpf" ? "CPF" : "E-mail"}</label>
                <input style={FieldInput} value={cardData[k]} onChange={handleChange(k)} placeholder={k === "cpf" ? "000.000.000-00" : "seu@email.com"} />
              </div>
            ))}

            {error && <div style={{ fontSize: 11, color: "#f87171", background: "#f8717111", padding: 12, border: "1px solid #f8717133" }}>{error}</div>}

            {!cardToken ? (
              <button onClick={handleTokenize} disabled={tokenizing || !cardData.number || !cardData.cvv}
                style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 10 }}>
                {tokenizing ? "VALIDANDO..." : "PRÓXIMO PASSO"}
              </button>
            ) : (
              <button onClick={handlePay} style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 10 }}>
                FINALIZAR PAGAMENTO
              </button>
            )}
            <p style={{ fontSize: 9, color: T.text3, textAlign: "center", marginTop: 10 }}>AMBIENTE SEGURO · MERCADO PAGO · SSL</p>
          </div>
        )}

        {step === "processing" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 0" }}>
            <Spinner />
            <div style={{ textAlign: "center" }}>
              <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 18, textTransform: "uppercase", margin: "0 0 6px" }}>Processando</h3>
              <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>Validando sua transação com o banco...</p>
            </div>
          </div>
        )}
      </Modal>

      {step === "auth" && <AuthModal onSuccess={() => setStep("choice")} onClose={() => setStep("paywall")} />}

      {needsAccessChoice && orderId && event && (
        <AccessTypeModal orderId={orderId} eventTitle={event.nomeNoivos}
          onConfirmed={async () => {
            setNeedsAccessChoice(false);
            try {
              const { data } = await api.get(`/orders/${orderId}/access-status`);
              setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event.nomeNoivos });
            } catch (err) { console.error("Erro ao atualizar links:", err); }
          }}
        />
      )}
    </div>
  );
}

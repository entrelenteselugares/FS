import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API as api } from "../lib/api";
import AccessTypeModal from "../components/AccessTypeModal";
import axios from "axios";

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
  title: string;
  slug: string;
  date: string;
  location: string;
  city: string | null;
  description: string | null;
  coverUrl: string | null;
  priceBase: number;
  priceEarly: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  cartorio?: { razaoSocial: string; city: string | null } | null;
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

// ── Tema ─────────────────────────────────────────────
const T = {
  bg:      "#0c0c0c",
  bgCard:  "#111",
  bgField: "#0c0c0c",
  border:  "#1c1c1c",
  border2: "#2a2a2a",
  text:    "#f0ede8",
  text2:   "#999",
  text3:   "#555",
  accent:  "#8a9a5b",
  fontD:   "'Barlow Condensed', sans-serif",
  fontB:   "'Inter', sans-serif",
};

type Step = "paywall" | "checkout" | "processing" | "success";

export default function EventPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

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
  const [accessType, setAccessType] = useState<string | null>(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState<string | null>(null);

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

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCardData((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: 28, height: 28, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", animation: "spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (notFound || !event) return (
    <div style={{ background: T.bg, minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 16 }}>
      <p style={{ fontFamily: T.fontD, fontSize: 32, fontWeight: 900, color: "#fff", textTransform: "uppercase" }}>Evento não encontrado</p>
      <button onClick={() => navigate("/")} style={{ fontSize: 11, color: T.accent, background: "none", border: "none", cursor: "pointer", letterSpacing: 1.5, textTransform: "uppercase" }}>
        ← Voltar à vitrine
      </button>
    </div>
  );

  return (
    <div style={{ fontFamily: T.fontB, background: T.bg, color: T.text, minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:ital,wght@0,700;0,800;0,900;1,700;1,900&family=Inter:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input { transition: border-color .15s; }
        input:focus { border-color: ${T.accent} !important; outline: none; }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 28px", borderBottom: `1px solid ${T.border}` }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: T.text3, fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase", display: "flex", alignItems: "center", gap: 6 }}>
          ← Vitrine
        </button>
        <div style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 18, color: "#fff", letterSpacing: 1 }}>
          FOTO SEGUNDO.
        </div>
        <span style={{ fontSize: 12, color: T.text3 }}>{user?.nome ?? "Login"}</span>
      </nav>

      {/* LAYOUT */}
      <div style={{ maxWidth: 1040, margin: "0 auto", padding: "40px 28px", display: "grid", gridTemplateColumns: "1fr 360px", gap: "48px", alignItems: "start" }}>

        {/* ESQUERDA */}
        <div>
          {/* Capa */}
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#161616", border: `1px solid ${T.border}`, position: "relative", overflow: "hidden", marginBottom: 28 }}>
            {event.coverUrl ? (
              <img src={event.coverUrl} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover", filter: step === "success" ? "none" : "blur(3px) brightness(0.5)" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke={T.accent} strokeWidth="0.8" opacity={0.3}>
                  <rect x="3" y="3" width="18" height="18" rx="1"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/>
                </svg>
              </div>
            )}
            {step !== "success" && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, background: "rgba(0,0,0,0.5)" }}>
                <div style={{ width: 36, height: 36, border: "1.5px solid rgba(255,255,255,0.25)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                  </svg>
                </div>
                <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.35)" }}>Acesso Reservado</span>
              </div>
            )}
          </div>

          {/* Info */}
          <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.accent, marginBottom: 10, display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ width: 16, height: 1, background: T.accent, display: "inline-block" }} />
            {event.cartorio?.razaoSocial ?? event.location}
          </p>
          <h1 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: "clamp(40px, 5vw, 56px)", color: "#fff", textTransform: "uppercase", lineHeight: 0.95, letterSpacing: "0.5px", marginBottom: 10 }}>
            {event.title}
          </h1>
          <p style={{ fontSize: 13, color: T.text2, marginBottom: 28, letterSpacing: "0.3px" }}>
            {formatDate(event.date)} · {event.city ?? event.location}
          </p>

          {/* Serviços */}
          {(event.temFoto || event.temVideo || event.temReels || event.temFotoImpressa) && (
            <div>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.text3, marginBottom: 14 }}>
                Serviços inclusos
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[
                  { active: event.temFoto, name: "Galeria Digital", desc: "Fotos editadas no Adobe Portfolio" },
                  { active: event.temVideo, name: "Cinema & Filme", desc: "Vídeo cinematográfico completo" },
                  { active: event.temReels, name: "Social Media", desc: "Reels e Stories para redes sociais" },
                  { active: event.temFotoImpressa, name: "Foto Impressa", desc: "Impressão no local do evento" },
                ].filter((s) => s.active).map((s) => (
                  <div key={s.name} style={{ padding: 12, border: `1px solid ${T.border}`, display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <span style={{ width: 5, height: 5, background: T.accent, borderRadius: "50%", flexShrink: 0, marginTop: 5 }} />
                    <div>
                      <p style={{ fontSize: 12, fontWeight: 500, color: "#ddd", marginBottom: 2 }}>{s.name}</p>
                      <p style={{ fontSize: 11, color: T.text3, lineHeight: 1.4 }}>{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Links desbloqueados */}
          {step === "success" && access && (
            <div style={{ marginTop: 28, border: `1px solid #1e3a1e`, padding: 20 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: "#4ade80", marginBottom: 16 }}>
                ✓ Acesso Liberado
              </p>
              
              {accessExpiresAt && (
                <div style={{ 
                  marginBottom: 16, 
                  padding: "10px 14px", 
                  background: accessType === "PRIVATE" ? "#1a0a0a" : "#0f130a", 
                  border: `1px solid ${accessType === "PRIVATE" ? "#3a1a1a" : T.border}`,
                  borderRadius: 2
                }}>
                  <p style={{ fontSize: 11, color: accessType === "PRIVATE" ? "#f87171" : T.accent, margin: 0 }}>
                    {accessType === "PRIVATE" ? "⚠️ ACESSO PRIVADO" : "📅 ÁLBUM PÚBLICO"} — Expira em{" "}
                    <strong>{new Date(accessExpiresAt).toLocaleDateString("pt-BR")}</strong>
                    {" "}({Math.ceil((new Date(accessExpiresAt).getTime() - Date.now()) / 86400000)} dias restantes)
                  </p>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {access.lightroomUrl && (
                  <a href={access.lightroomUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: T.bg, border: `1px solid #1e3a1e`, textDecoration: "none" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>Álbum de Fotos</p>
                      <p style={{ fontSize: 11, color: T.text3 }}>Adobe Portfolio · Alta resolução</p>
                    </div>
                    <span style={{ fontSize: 12, color: T.accent }}>Abrir ↗</span>
                  </a>
                )}
                {access.driveUrl && (
                  <a href={access.driveUrl} target="_blank" rel="noopener noreferrer"
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 16px", background: T.bg, border: `1px solid #1e3a1e`, textDecoration: "none" }}>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 2 }}>Vídeo & Reels</p>
                      <p style={{ fontSize: 11, color: T.text3 }}>Google Drive · Download disponível</p>
                    </div>
                    <span style={{ fontSize: 12, color: T.accent }}>Abrir ↗</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* DIREITA */}
        <div style={{ position: "sticky", top: "2rem" }}>

          {/* PAYWALL */}
          {step === "paywall" && (
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: 24 }}>
              <p style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.accent, marginBottom: 16 }}>Exclusive Collection</p>
              <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 44, color: "#fff", marginBottom: 4 }}>
                {formatCurrency(Number(event.priceBase))}
              </p>
              <p style={{ fontSize: 12, color: T.text3, marginBottom: 20 }}>Acesso vitalício · Download imediato</p>
              {Number(event.priceEarly) < Number(event.priceBase) && (
                <div style={{ background: "#0f130a", border: `1px solid ${T.border}`, padding: "10px 12px", marginBottom: 20 }}>
                  <p style={{ fontSize: 11, color: T.accent }}>
                    Antecipado: {formatCurrency(Number(event.priceEarly))}
                  </p>
                </div>
              )}
              <div style={{ borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, padding: "16px 0", marginBottom: 20 }}>
                {[
                  event.temFoto && "Álbum completo em alta resolução",
                  event.temVideo && "Vídeo cinematográfico completo",
                  event.temReels && "Reels editados para redes sociais",
                  event.temFotoImpressa && "Foto impressa no local",
                ].filter(Boolean).map((item) => (
                  <div key={item as string} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, color: T.text2 }}>
                    <span style={{ width: 5, height: 5, background: T.accent, borderRadius: "50%", flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setStep("checkout")}
                style={{ width: "100%", background: T.accent, color: "#0c0c0c", border: "none", padding: 14, fontFamily: T.fontD, fontWeight: 900, fontSize: 15, letterSpacing: 2, textTransform: "uppercase", cursor: "pointer" }}
              >
                Desbloquear Arquivos
              </button>
              <p style={{ fontSize: 10, color: T.text3, textAlign: "center", marginTop: 10, letterSpacing: "0.5px" }}>
                Secure Payment · Instant Access · SSL
              </p>
            </div>
          )}

          {/* CHECKOUT */}
          {step === "checkout" && (
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}` }}>
              <div style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11, letterSpacing: 2, textTransform: "uppercase", color: T.text2 }}>Secure Checkout</span>
                <button onClick={() => setStep("paywall")} style={{ background: "none", border: "none", color: T.text3, fontSize: 11, cursor: "pointer", letterSpacing: 1, textTransform: "uppercase" }}>
                  Voltar
                </button>
              </div>
              <div style={{ padding: 20 }}>
                {/* Resumo */}
                <div style={{ background: T.bg, border: `1px solid ${T.border}`, padding: "12px 14px", marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 12, color: T.text3 }}>{event.title}</span>
                  <span style={{ fontFamily: T.fontD, fontSize: 18, fontWeight: 700, color: T.accent }}>
                    {formatCurrency(Number(event.priceBase))}
                  </span>
                </div>

                {error && (
                  <div style={{ background: "#1a0a0a", border: "1px solid #3a1a1a", padding: "10px 12px", marginBottom: 16 }}>
                    <p style={{ fontSize: 12, color: "#f87171", margin: 0 }}>{error}</p>
                  </div>
                )}

                {/* Campos */}
                {[
                  { k: "number", label: "Número do cartão", placeholder: "0000 0000 0000 0000", maxLength: 19 },
                  { k: "name", label: "Nome no cartão", placeholder: "Nome impresso" },
                ].map(({ k, label, placeholder, maxLength }) => (
                  <div key={k} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.text3, display: "block", marginBottom: 6 }}>{label}</label>
                    <input
                      value={cardData[k as keyof typeof cardData]}
                      onChange={set(k)}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      style={{ width: "100%", background: T.bg, border: `1px solid ${T.border2}`, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: T.fontB }}
                    />
                  </div>
                ))}

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
                  {[
                    { k: "month", label: "Mês", placeholder: "MM", max: 2 },
                    { k: "year", label: "Ano", placeholder: "AA", max: 2 },
                    { k: "cvv", label: "CVV", placeholder: "000", max: 4 },
                  ].map(({ k, label, placeholder, max }) => (
                    <div key={k}>
                      <label style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.text3, display: "block", marginBottom: 6 }}>{label}</label>
                      <input value={cardData[k as keyof typeof cardData]} onChange={set(k)} placeholder={placeholder} maxLength={max}
                        style={{ width: "100%", background: T.bg, border: `1px solid ${T.border2}`, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: T.fontB }} />
                    </div>
                  ))}
                </div>

                {[
                  { k: "email", label: "E-mail p/ recibo", placeholder: "seu@email.com" },
                  { k: "cpf", label: "CPF do titular", placeholder: "000.000.000-00" },
                ].map(({ k, label, placeholder }) => (
                  <div key={k} style={{ marginBottom: 14 }}>
                    <label style={{ fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", color: T.text3, display: "block", marginBottom: 6 }}>{label}</label>
                    <input value={cardData[k as keyof typeof cardData]} onChange={set(k)} placeholder={placeholder}
                      style={{ width: "100%", background: T.bg, border: `1px solid ${T.border2}`, padding: "10px 12px", fontSize: 13, color: T.text, fontFamily: T.fontB }} />
                  </div>
                ))}

                {!cardToken ? (
                  <button onClick={handleTokenize} disabled={tokenizing || !mpLoaded}
                    style={{ width: "100%", background: "transparent", border: `1px solid ${T.border2}`, padding: 11, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase", color: tokenizing ? T.text3 : T.text2, cursor: "pointer", fontFamily: T.fontB, marginBottom: 8 }}>
                    {tokenizing ? "Verificando..." : "Validar Cartão"}
                  </button>
                ) : (
                  <div style={{ padding: "10px 14px", background: "#0d1a0d", border: "1px solid #1e3a1e", marginBottom: 8, fontSize: 12, color: "#4ade80", letterSpacing: "0.5px" }}>
                    ✓ Cartão verificado
                  </div>
                )}

                <button onClick={handlePay} disabled={!cardToken}
                  style={{ width: "100%", background: cardToken ? T.accent : "#1a1a1a", color: cardToken ? "#0c0c0c" : T.text3, border: "none", padding: 13, fontFamily: T.fontD, fontWeight: 900, fontSize: 14, letterSpacing: 2, textTransform: "uppercase", cursor: cardToken ? "pointer" : "not-allowed" }}>
                  Finalizar · {formatCurrency(Number(event.priceBase))}
                </button>
              </div>
            </div>
          )}

          {/* PROCESSING */}
          {step === "processing" && (
            <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: "48px 24px", textAlign: "center" }}>
              <div style={{ width: 36, height: 36, border: `2px solid ${T.accent}`, borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 20px", animation: "spin .8s linear infinite" }} />
              <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 22, color: "#fff", textTransform: "uppercase", marginBottom: 8 }}>
                Processando
              </p>
              <p style={{ fontSize: 12, color: T.text3 }}>Confirmando seu pagamento...</p>
              <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            </div>
          )}

          {/* SUCCESS */}
          {step === "success" && (
            <div style={{ background: "#0d1a0d", border: "1px solid #1e3a1e", padding: 24, textAlign: "center" }}>
              <div style={{ width: 44, height: 44, border: "2px solid #4ade80", borderRadius: "50%", margin: "0 auto 16px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2.5">
                  <polyline points="20,6 9,17 4,12"/>
                </svg>
              </div>
              <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 22, color: "#fff", textTransform: "uppercase", marginBottom: 6 }}>
                Pagamento Confirmado
              </p>
              <p style={{ fontSize: 12, color: T.text3, marginBottom: 20 }}>
                Seus arquivos estão disponíveis ao lado.
              </p>
              {orderId && (
                <p style={{ fontSize: 10, color: T.text3, letterSpacing: "0.5px" }}>
                  Pedido: <span style={{ fontFamily: "monospace", color: "#555" }}>{orderId.slice(-8).toUpperCase()}</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {needsAccessChoice && orderId && event && (
        <AccessTypeModal
          orderId={orderId}
          eventTitle={event.title}
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

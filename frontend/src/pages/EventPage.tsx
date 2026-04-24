import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { T, BtnPrimary, BtnSecondary, FieldLabel, FieldInput } from "../lib/theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";

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

  const Item = ({ val, label }: { val: number, label: string }) => (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, color: T.text, lineHeight: 1 }}>{String(val).padStart(2, "0")}</div>
      <div style={{ fontSize: 8, letterSpacing: 1, textTransform: "uppercase", color: T.text3, marginTop: 4 }}>{label}</div>
    </div>
  );

  return (
    <div style={{ display: "flex", gap: 20, padding: "20px 0", borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}`, margin: "10px 0" }}>
      <Item val={timeLeft.d} label="Dias" />
      <Item val={timeLeft.h} label="Horas" />
      <Item val={timeLeft.m} label="Min" />
      <Item val={timeLeft.s} label="Seg" />
    </div>
  );
};

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
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
  expiresAt: string;
  eventTitle: string;
  accessType?: "PUBLIC" | "PRIVATE";
}

type Step = "paywall" | "auth" | "choice" | "checkout" | "processing" | "success";

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
        if (r.data.paywall && !r.data.paywall.active) {
          setStep("success");
          setAccess({ lightroomUrl: r.data.lightroomUrl, driveUrl: r.data.driveUrl, expiresAt: "", eventTitle: r.data.nomeNoivos });
        }
      })
      .catch(() => navigate("/404"))
      .finally(() => setLoading(false));
  }, [slug, navigate, user?.id]);

  useEffect(() => {
    const checkAccessStatus = async (oid: string) => {
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        if (data.status === "PENDING_CHOICE") {
          setStep("success");
          setNeedsAccessChoice(true);
        } else if (data.status === "ACTIVE") {
          setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
          setStep("success");
        }
      } catch { /* not paid */ }
    };
    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessStatus(oid); }
  }, [slug, searchParams, event?.nomeNoivos]);

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
          setOrderId(oid);
          setJustPaid(true);
          if (data.status === "PENDING_CHOICE") setNeedsAccessChoice(true);
          else setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
          setStep("success");
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

  const handleUnlockClick = () => { if (!user) setStep("auth"); else setStep("choice"); };
  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setCardData(p => ({ ...p, [k]: e.target.value }));

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

  return (
    <div style={{ height: "100vh", overflow: "hidden", background: T.bg, color: T.text, fontFamily: T.fontB, display: "flex", flexDirection: "column" }}>
      <Helmet><title>{event.nomeNoivos} — Foto Segundo</title></Helmet>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeUp { from { opacity:0; transform: translateY(12px); } to { opacity:1; transform: translateY(0); } }
        .ep-grid { display: grid; grid-template-columns: 1fr 340px; height: calc(100vh - 52px); overflow: hidden; }
        .ep-sidebar { overflow-y: auto; }
        @media (min-width: 901px) {
          .desktop-hide { display: none !important; }
        }
        @media (max-width: 900px) {
          .ep-grid { grid-template-columns: 1fr; grid-template-rows: auto; height: auto; overflow: auto; }
          .ep-cover { height: 75vh; min-height: 480px; }
          .mobile-hide { display: none !important; }
        }
      `}</style>

      <nav style={{ height: 52, padding: "0 20px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: T.bg, flexShrink: 0, zIndex: 10 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 10, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 6 }}>
          ← Voltar
        </button>
        <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 18, objectFit: "contain", cursor: "pointer" }} onClick={() => navigate("/")} />
        <ThemeToggle />
      </nav>

      <div className="ep-grid">
        <div className="ep-cover" style={{ position: "relative", overflow: "hidden", background: T.bgCard }}>
          {event.coverPhotoUrl ? (
            <img src={event.coverPhotoUrl} alt={event.nomeNoivos}
              style={{ width: "100%", height: "100%", objectFit: "cover", filter: paid ? "none" : "blur(6px) brightness(0.7)", transition: "filter 0.8s ease" }}
            />
          ) : (
            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(135deg, ${T.bgCard}, ${T.bg})` }}>
              <span style={{ fontFamily: T.fontD, fontSize: "clamp(28px,5vw,56px)", fontWeight: 900, color: T.text, opacity: 0.08, textTransform: "uppercase", textAlign: "center", padding: 40 }}>{event.nomeNoivos}</span>
            </div>
          )}

          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)", display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "32px 36px" }}>
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
                    Abrir Lightroom
                  </a>
                )}
                {access.driveUrl && (
                  <a href={access.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, flex: 1, justifyContent: "center", color: "#fff", borderColor: "rgba(255,255,255,0.4)", textDecoration: "none", fontSize: 11 }}>
                    Drive
                  </a>
                )}
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
                  <p style={{ fontSize: 9, letterSpacing: 3, color: T.brand, textTransform: "uppercase", margin: "0 0 8px", fontWeight: 700 }}>Exclusive Collection</p>
                  <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 40, color: T.text, margin: "0 0 2px", lineHeight: 1 }}>
                    R$ {Number(event.priceBase).toFixed(2).replace(".", ",")}
                  </p>
                  <p style={{ fontSize: 11, color: T.text3, margin: 0 }}>Acesso vitalício · Download imediato</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
                  {["Arquivos originais em 4K", "Sem marcas d'água", "Direito de uso comercial"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.text2 }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: T.brand, flexShrink: 0 }} /> {item}
                    </div>
                  ))}
                </div>

                <button onClick={handleUnlockClick} style={{ ...BtnPrimary, width: "100%", justifyContent: "center" }}>
                  Desbloquear Arquivos
                </button>
                <p style={{ fontSize: 9, color: T.text3, textAlign: "center", margin: 0 }}>Secure Payment · SSL · Instant Access</p>
              </div>
            )}

            {step === "checkout" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, animation: "fadeUp 0.3s ease" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Secure Checkout</span>
                  <button onClick={() => setStep("paywall")} style={{ background: "none", border: "none", color: T.brand, cursor: "pointer", fontSize: 10, textTransform: "uppercase" }}>Voltar</button>
                </div>

                <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, padding: 14, marginBottom: 4 }}>
                  <div style={{ fontSize: 10, color: T.text2 }}>{event.nomeNoivos}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: T.text }}>R$ {Number(event.priceBase).toFixed(2)}</div>
                </div>

                {(["number", "name"] as const).map(k => (
                  <div key={k}>
                    <label style={FieldLabel}>{k === "number" ? "Número do Cartão" : "Nome no Cartão"}</label>
                    <input style={FieldInput} value={cardData[k]} onChange={handleChange(k)} placeholder={k === "number" ? "0000 0000 0000 0000" : "JOÃO SILVA"} />
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

                {error && <div style={{ fontSize: 10, color: "#ef4444", background: "#ef444411", padding: 8, border: "1px solid #ef444433" }}>{error}</div>}

                {!cardToken ? (
                  <button onClick={handleTokenize} disabled={tokenizing || !cardData.number || !cardData.cvv}
                    style={{ ...BtnPrimary, width: "100%", justifyContent: "center", opacity: (tokenizing || !cardData.number) ? 0.5 : 1 }}>
                    {tokenizing ? "Validando..." : "Validar Cartão"}
                  </button>
                ) : (
                  <button onClick={handlePay} style={{ ...BtnPrimary, width: "100%", justifyContent: "center" }}>
                    Pagar R$ {Number(event.priceBase).toFixed(2).replace(".", ",")}
                  </button>
                )}
                <p style={{ fontSize: 9, color: T.text3, textAlign: "center", margin: 0 }}>SSL · Dados não armazenados</p>
              </div>
            )}

            {step === "processing" && (
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, padding: "40px 0", animation: "fadeUp 0.3s ease" }}>
                <Spinner />
                <div style={{ textAlign: "center" }}>
                  <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 18, textTransform: "uppercase", margin: "0 0 6px" }}>Processando</h3>
                  <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>Validando transação bancária...</p>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="mobile-hide" style={{ display: "flex", flexDirection: "column", gap: 16, animation: "fadeUp 0.3s ease" }}>
                {!access?.lightroomUrl && !access?.driveUrl ? (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: T.brand, margin: 0 }}>
                      Evento em breve
                    </p>
                    <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>
                      Sua compra foi confirmada! O contador abaixo mostra o tempo restante para o grande dia.
                    </p>
                    {event.dataEvento && <Countdown targetDate={event.dataEvento} />}
                    <button onClick={handleShare} style={{ ...BtnSecondary, width: "100%", justifyContent: "center", color: T.text }}>
                      {sharing ? "LINK COPIADO!" : "COMPARTILHAR LINK"}
                    </button>
                  </>
                ) : (
                  <>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, color: T.brand, margin: 0 }}>
                      {justPaid ? "Tudo pronto!" : "Acesso Liberado"}
                    </p>
                    <p style={{ fontSize: 12, color: T.text2, margin: 0 }}>Seus arquivos estão disponíveis na imagem ao lado.</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {access.lightroomUrl && <a href={access.lightroomUrl} target="_blank" rel="noreferrer" style={{ ...BtnPrimary, textDecoration: "none", justifyContent: "center" }}>Abrir Lightroom</a>}
                      {access.driveUrl && <a href={access.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, color: T.text, borderColor: T.brand, textDecoration: "none", justifyContent: "center" }}>Google Drive</a>}
                    </div>
                  </>
                )}
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

      {step === "auth" && <AuthModal onSuccess={() => setStep("choice")} onClose={() => setStep("paywall")} />}

      {step === "choice" && (
        <AccessTypeModal orderId="PRE-PAYMENT" eventTitle={event.nomeNoivos}
          onConfirmed={(type) => { setAccessType(type as "PUBLIC" | "PRIVATE"); setStep("checkout"); }}
        />
      )}

      {needsAccessChoice && orderId && event && (
        <AccessTypeModal orderId={orderId} eventTitle={event.nomeNoivos}
          onConfirmed={async () => {
            setNeedsAccessChoice(false);
            try {
              const { data } = await api.get(`/orders/${orderId}/access-status`);
              setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "" });
            } catch (err) { console.error("Erro ao atualizar links:", err); }
          }}
        />
      )}
    </div>
  );
}

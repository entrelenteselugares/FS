import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { T, BtnPrimary, BtnSecondary, Card, FieldLabel, FieldInput } from "../lib/theme";
import { ThemeToggle } from "../components/ThemeToggle";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";

// Campos retornados pelo EventController.getById
interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento?: string | null;   // backend envia "dataEvento", não "date"
  paywall: {
    active: boolean;
    message: string;
  };
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
  cartorio?: string | null;     // backend envia string (razaoSocial), não objeto
  isCrowdfund?: boolean;
  targetAmount?: number | null;
  collectedAmount?: number;
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
  expiresAt: string;
}

type Step = "paywall" | "auth" | "choice" | "checkout" | "processing" | "success";

// ─── Icons ────────────────────────────────────────────────────────────────────

const LockIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);

const CheckIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const Spinner = () => (
  <div style={{
    width: 36, height: 36,
    border: `2px solid ${T.brand}`,
    borderTopColor: "transparent",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite"
  }} />
);

// ─── Mercado Pago Helpers ───────────────────────────────────────────────────

function detectBrand(number: string): string {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n))               return "visa";
  if (/^5[1-5]|^2[2-7]/.test(n)) return "master";
  if (/^3[47]/.test(n))           return "amex";
  if (/^6(?:011|5)/.test(n))      return "elo";
  return "visa";
}

const mpErrors: Record<string, string> = {
  cc_rejected_insufficient_amount:     "Cartão sem limite suficiente.",
  cc_rejected_bad_filled_security_code:"CVV inválido.",
  cc_rejected_bad_filled_date:         "Data de validade incorreta.",
  cc_rejected_call_for_authorize:      "Pagamento não autorizado. Contate seu banco.",
  cc_rejected_card_disabled:           "Cartão desabilitado. Contate seu banco.",
  cc_rejected_duplicated_payment:      "Pagamento duplicado detectado.",
};

const MP_PUBLIC_KEY = (import.meta.env.VITE_MP_PUBLIC_KEY ?? "")
  .trim()
  .replace(/[\r\n\t]/g, "");

// Carrega o script do MP apenas quando necessário
const loadMP = () => {
  return new Promise((resolve) => {
    if ((window as any).MercadoPago) return resolve((window as any).MercadoPago);
    const script = document.createElement("script");
    script.src = "https://sdk.mercadopago.com/js/v2";
    script.onload = () => resolve((window as any).MercadoPago);
    document.body.appendChild(script);
  });
};


// ─── EventPage Component ──────────────────────────────────────────────────────

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("paywall");
  const [access, setAccess] = useState<AccessData | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [tokenizing, setTokenizing] = useState(false);
  const [cardToken, setCardToken] = useState<string | null>(null);
  const [cardData, setCardData] = useState({
    number: "", name: "", month: "", year: "", cvv: "", email: "", cpf: "",
  });

  const [needsAccessChoice, setNeedsAccessChoice] = useState(false);
  const [accessType, setAccessType] = useState<"PUBLIC" | "PRIVATE" | null>(null);
  const { user } = useAuth();


  useEffect(() => {
    if (!slug) return;
    const params = user?.id ? { userId: user.id } : {};
    api.get(`/public/events/${slug}`, { params })
      .then((r) => {
        setEvent(r.data);
        if (r.data.paywall && !r.data.paywall.active) {
          setStep("success");
          setAccess({
            lightroomUrl: r.data.lightroomUrl,
            driveUrl: r.data.driveUrl,
            expiresAt: "" // Vitalício se já pago
          });
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
          setAccess({ 
            lightroomUrl: data.lightroomUrl, 
            driveUrl: data.driveUrl,
            expiresAt: data.expiresAt || ""
          });
          setStep("success");
        }
      } catch { /* not paid yet */ }
    };

    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) {
      setOrderId(oid);
      checkAccessStatus(oid);
    }
  }, [slug, searchParams]);

  const handleTokenize = async () => {
    if (!MP_PUBLIC_KEY) {
      setError("Erro de configuração: Chave MP ausente.");
      return;
    }
    setTokenizing(true);
    setError("");
    try {
      const MP = (await loadMP()) as any;
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

      if (mpErr) {
        setError("Dados do cartão inválidos. Verifique os campos.");
        return;
      }
      setCardToken(token);
    } catch {
      setError("Erro ao validar cartão.");
    } finally {
      setTokenizing(false);
    }
  };

  const pollPaymentStatus = async (oid: string) => {
    let count = 0;
    const interval = setInterval(async () => {
      count++;
      if (count > 10) { // 30s total (3s * 10)
        clearInterval(interval);
        setError("O pagamento está demorando mais que o esperado. Verifique seu e-mail.");
        setStep("checkout");
        return;
      }

      try {
        const { data } = await api.get(`/orders/${oid}/access-status`);
        if (data.status === "PENDING_CHOICE" || data.status === "ACTIVE") {
          clearInterval(interval);
          setOrderId(oid);
          if (data.status === "PENDING_CHOICE") {
            setNeedsAccessChoice(true);
          } else {
            setAccess({ 
              lightroomUrl: data.lightroomUrl, 
              driveUrl: data.driveUrl,
              expiresAt: data.expiresAt || ""
            });
          }
          setStep("success");
        }
      } catch { /* keep polling */ }
    }, 3000);
  };

  const handlePay = async () => {
    if (!event || !cardToken) return;
    setStep("processing");
    setError("");
    try {
      const { data } = await api.post("/checkout/payment", {
        eventId: event.id,
        userId: user?.id,
        email: cardData.email,
        cpf: cardData.cpf,
        cardToken: cardToken,
        installments: 1,
        paymentMethodId: detectBrand(cardData.number),
        accessType: accessType
      });

      if (data.hasPaid) {
        setOrderId(data.orderId);
        setStep("success");
      } else {
        pollPaymentStatus(data.orderId);
      }
    } catch (err: unknown) {
      const axiosErr = err as any;
      const msg = axiosErr.response?.data?.code ? (mpErrors[axiosErr.response.data.code] || axiosErr.response.data.error) : "Erro no pagamento.";
      setError(msg);
      setStep("checkout");
      setCardToken(null);
    }
  };

  const handleUnlockClick = () => {
    if (!user) {
      setStep("auth");
    } else {
      setStep("choice");
    }
  };


  const handleChange = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setCardData((p) => ({ ...p, [k]: e.target.value }));

  if (loading) return (
    <div style={{ minHeight: "100vh", background: T.bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Spinner />
    </div>
  );

  if (!event) return null;

  const paid = step === "success";

  return (
    <div style={{ minHeight: "100vh", background: T.bg, color: T.text, fontFamily: T.fontB }}>
      <Helmet>
        <title>{event.nomeNoivos} — Foto Segundo</title>
      </Helmet>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* Desktop: grid 2 colunas */
        @media (min-width: 1024px) {
          .event-grid { display: grid; grid-template-columns: 1fr 360px; gap: 48px; }
          .event-aside { order: 0; }
        }

        /* Mobile: coluna única, aside vai para CIMA do conteúdo */
        @media (max-width: 1023px) {
          .event-grid { display: flex; flex-direction: column; gap: 24px; padding: 16px !important; }
          .event-aside { order: -1; } /* mostra o botão de compra primeiro */
          .event-aside > div { position: static !important; } /* remove sticky no mobile */
        }

        /* Checkout card grid: 3 colunas -> 1 linha com 3 col em telas grandes, compacto em pequenas */
        @media (max-width: 480px) {
          .card-expiry-grid { grid-template-columns: 1fr 1fr !important; }
          .card-cvv-col { grid-column: 1 / -1; }
        }
      `}</style>

      {/* Nav */}
      <nav style={{ padding: "12px 16px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: 'var(--theme-bg-nav)', backdropFilter: 'blur(10px)', position: 'sticky', top: 0, zIndex: 100 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 11, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 8 }}>
          ← <span className="desktop-only">Voltar</span>
        </button>
        <div style={{ cursor: "pointer", display: "flex", alignItems: "center" }} onClick={() => navigate("/")}>
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 20, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <ThemeToggle />
        </div>
      </nav>

      <main style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px" }} className="event-grid">
        
        {/* Coluna Esquerda */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          
          {/* Thumbnail 16:9 */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: T.bgCard, overflow: "hidden" }}>
            <img 
              src={event.coverPhotoUrl || ""} 
              style={{ 
                width: "100%", height: "100%", objectFit: "cover", 
                opacity: paid ? 1 : 0.6,
                filter: paid ? "none" : "blur(12px)",
                transition: "all 1s ease"
              }} 
              alt={event.nomeNoivos}
            />
            {!paid && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
                <div style={{ padding: 20, background: "rgba(0,0,0,0.6)", borderRadius: "50%", color: T.text }}>
                  <LockIcon />
                </div>
              </div>
            )}
          </div>

          {/* Registry Tag */}

          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 30, height: 2, background: T.brand }} />
            <span style={{ fontSize: 10, letterSpacing: 2, textTransform: "uppercase", color: T.brand, fontWeight: 700 }}>
              {typeof event.cartorio === "string" ? event.cartorio : (event.cartorio as any)?.razaoSocial || "Registro Editorial"}
            </span>
          </div>

          {/* Title */}
          <h1 style={{ 
            fontFamily: T.fontD, fontWeight: 900, 
            fontSize: "clamp(40px, 5vw, 56px)", 
            lineHeight: 1, color: T.text, 
            textTransform: "uppercase", margin: 0 
          }}>
            {event.nomeNoivos}
          </h1>

          {/* Meta */}
          <div style={{ fontSize: 13, color: T.text2, fontFamily: T.fontB, fontWeight: 400, marginTop: -12 }}>
          {event.dataEvento
            ? new Date(event.dataEvento).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })
            : ""} {event.city || event.location ? `· ${event.city || event.location}` : ""}
          </div>

          {/* Services Grid 2x2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginTop: 16 }}>
            {[
              { label: "Fotos em Alta", active: event.temFoto },
              { label: "Vídeo Cinema", active: event.temVideo },
              { label: "Reels / Stories", active: event.temReels },
              { label: "Foto Impressa", active: event.temFotoImpressa },
            ].map(s => (
              <div key={s.label} style={{ padding: "16px", border: `1px solid ${T.border}`, background: T.bgCard, opacity: s.active ? 1 : 0.3 }}>
                <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, color: s.active ? T.text : T.text3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Success Content (Links) */}
          {paid && access && (
            <div style={{ marginTop: 32, padding: 32, border: `1px solid ${T.brand}`, background: T.brandDark }}>
              <h2 style={{ fontFamily: T.fontD, fontSize: 24, fontWeight: 900, color: T.brand, textTransform: "uppercase", marginBottom: 20 }}>Acesso Liberado</h2>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
                {access.lightroomUrl && (
                  <a href={access.lightroomUrl} target="_blank" rel="noreferrer" style={{ ...BtnPrimary, textDecoration: "none" }}>Abrir Lightroom</a>
                )}
                {access.driveUrl && (
                  <a href={access.driveUrl} target="_blank" rel="noreferrer" style={{ ...BtnSecondary, color: T.text, borderColor: T.brand, textDecoration: "none" }}>Abrir Google Drive</a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita (Sidebar) */}
        <aside className="event-aside">
          <div style={{ position: "sticky", top: 100 }}>
            
            {/* STEP: PAYWALL */}
            {step === "paywall" && (
              <div style={{ ...Card, padding: 24 }}>
                <p style={{ fontSize: 10, letterSpacing: 2, color: T.brand, textTransform: "uppercase", margin: "0 0 12px" }}>Exclusive Collection</p>
                <p style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 44, color: T.text, margin: "0 0 4px" }}>
                  R$ {Number(event.priceBase).toFixed(2).replace(".", ",")}
                </p>
                <p style={{ fontSize: 12, color: T.text3, margin: "0 0 24px" }}>Acesso vitalício · Download imediato</p>
                
                <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32, borderTop: `1px solid ${T.border}`, paddingTop: 20 }}>
                  {["Arquivos originais em 4K", "Sem marcas d'água", "Direito de uso comercial"].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: T.text2 }}>
                      <div style={{ width: 4, height: 4, borderRadius: "50%", background: T.brand }} /> {item}
                    </div>
                  ))}
                </div>

                <button onClick={handleUnlockClick} style={{ ...BtnPrimary, width: "100%", justifyContent: "center" }}>
                  Desbloquear Arquivos
                </button>
                
                <p style={{ fontSize: 10, color: T.text3, textAlign: "center", marginTop: 16 }}>
                  Secure Payment · Instant Access · SSL
                </p>
              </div>
            )}

            {/* STEP: CHECKOUT */}
            {step === "checkout" && (
              <div style={{ ...Card, padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>Secure Checkout</span>
                  <button onClick={() => setStep("paywall")} style={{ background: "none", border: "none", color: T.brand, cursor: "pointer", fontSize: 10, textTransform: "uppercase" }}>Voltar</button>
                </div>

                  <div style={{ background: T.bgField, border: `1px solid ${T.border}`, padding: 16, marginBottom: 24 }}>
                  <div style={{ fontSize: 11, color: T.text2 }}>{event.nomeNoivos}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: T.text }}>R$ {Number(event.priceBase).toFixed(2)}</div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <div>
                    <label style={FieldLabel}>Número do Cartão</label>
                    <input style={FieldInput} value={cardData.number} onChange={handleChange("number")} placeholder="0000 0000 0000 0000" />
                  </div>
                  <div>
                    <label style={FieldLabel}>Nome no Cartão</label>
                    <input style={FieldInput} value={cardData.name} onChange={handleChange("name")} placeholder="JOÃO SILVA" />
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }} className="card-expiry-grid">
                    <div>
                      <label style={FieldLabel}>Mês</label>
                      <input style={FieldInput} value={cardData.month} onChange={handleChange("month")} placeholder="MM" />
                    </div>
                    <div>
                      <label style={FieldLabel}>Ano</label>
                      <input style={FieldInput} value={cardData.year} onChange={handleChange("year")} placeholder="AA" />
                    </div>
                    <div className="card-cvv-col">
                      <label style={FieldLabel}>CVV</label>
                      <input style={FieldInput} value={cardData.cvv} onChange={handleChange("cvv")} placeholder="000" />
                    </div>
                  </div>
                  <div>
                    <label style={FieldLabel}>CPF</label>
                    <input style={FieldInput} value={cardData.cpf} onChange={handleChange("cpf")} placeholder="000.000.000-00" />
                  </div>
                  <div>
                    <label style={FieldLabel}>E-mail p/ Recebimento</label>
                    <input style={FieldInput} value={cardData.email} onChange={handleChange("email")} placeholder="seu@email.com" />
                  </div>

                  {error && (
                    <div style={{ fontSize: 10, color: "#ef4444", background: "#ef444411", padding: 8, border: "1px solid #ef444433" }}>
                      {error}
                    </div>
                  )}

                  {!cardToken ? (
                    <button 
                      onClick={handleTokenize} 
                      disabled={tokenizing || !cardData.number || !cardData.cvv}
                      style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 8, opacity: (tokenizing || !cardData.number) ? 0.5 : 1 }}
                    >
                      {tokenizing ? "Validando..." : "Validar Cartão"}
                    </button>
                  ) : (
                    <button onClick={handlePay} style={{ ...BtnPrimary, width: "100%", justifyContent: "center", marginTop: 8, background: T.brand, color: T.brandText }}>
                      Pagar R$ {Number(event.priceBase).toFixed(2).replace(".", ",")}
                    </button>
                  )}
                </div>

                
                <p style={{ fontSize: 9, color: T.text3, textAlign: "center", marginTop: 16, lineHeight: 1.4 }}>
                  Secure Payment · SSL · Dados não armazenados
                </p>
              </div>
            )}

            {/* STEP: PROCESSING */}
            {step === "processing" && (
              <div style={{ ...Card, padding: "48px 24px", textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 24 }}><Spinner /></div>
                <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 22, color: T.text, textTransform: "uppercase", margin: "0 0 8px" }}>PROCESSANDO</h3>
                <p style={{ fontSize: 12, color: T.text3, margin: 0 }}>Validando transação com a rede bancária...</p>
              </div>
            )}

            {/* STEP: SUCCESS */}
            {step === "success" && (
              <div style={{ ...Card, padding: 32, textAlign: "center" }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: "50%", border: "2px solid #4ade80", 
                  display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" 
                }}>
                  <CheckIcon />
                </div>
                <h3 style={{ fontFamily: T.fontD, fontWeight: 900, fontSize: 22, color: T.text, textTransform: "uppercase", margin: "0 0 8px" }}>PAGAMENTO CONFIRMADO</h3>
                <p style={{ fontSize: 13, color: T.text2, margin: "0 0 24px" }}>Seus arquivos estão disponíveis ao lado.</p>
                <div style={{ fontSize: 11, fontFamily: "monospace", color: T.text3, background: T.bgField, padding: "8px", border: `1px solid ${T.border}` }}>
                  ID: {orderId ? orderId.slice(-12).toUpperCase() : "FS-CONFIRMED"}
                </div>
              </div>
            )}

          </div>
        </aside>
      </main>

      {step === "auth" && (
        <AuthModal 
          onSuccess={() => setStep("choice")} 
          onClose={() => setStep("paywall")} 
        />
      )}

      {step === "choice" && (
        <AccessTypeModal
          orderId="PRE-PAYMENT"
          eventTitle={event.nomeNoivos}
          onConfirmed={(type) => {
            setAccessType(type as "PUBLIC" | "PRIVATE");
            setStep("checkout");
          }}
        />
      )}

      {needsAccessChoice && orderId && event && (
        <AccessTypeModal
          orderId={orderId}
          eventTitle={event.nomeNoivos}
          onConfirmed={async () => {
            setNeedsAccessChoice(false);
            // Atualiza status para liberar links
            try {
              const { data } = await api.get(`/orders/${orderId}/access-status`);
              setAccess({ 
                lightroomUrl: data.lightroomUrl, 
                driveUrl: data.driveUrl,
                expiresAt: data.expiresAt || ""
              });
            } catch (err) {
              console.error("Erro ao atualizar links após escolha:", err);
            }
          }}
        />
      )}
    </div>
  );
}

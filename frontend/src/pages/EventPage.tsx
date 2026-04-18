import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";

interface MercadoPagoInstance {
  createCardToken: (data: Record<string, string>) => Promise<{ id: string; cause?: Array<{ description: string }> }>;
}

interface MercadoPagoConstructor {
  new (publicKey: string): MercadoPagoInstance;
}

declare global {
  interface Window {
    MercadoPago: MercadoPagoConstructor;
  }
}

interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio: string | null;
  description?: string | null;
  coverPhotoUrl: string | null;
  priceBase: number;
  priceEarly: number;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
  eventTitle: string;
}



function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    }).format(new Date(d));
  } catch {
    return "Data indisponível";
  }
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

function detectCardBrand(number: string): string {
  const n = number.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "master";
  if (/^3[47]/.test(n)) return "amex";
  if (/^6(?:011|5)/.test(n)) return "elo";
  if (/^(?:606282|3841)/.test(n)) return "hipercard";
  return "visa"; // fallback
}

const S = {
  page: { fontFamily: "'Outfit', 'Inter', sans-serif", background: "#050505", color: "#e8e4dc", minHeight: "100vh" } as React.CSSProperties,
  input: {
    width: "100%", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 6, padding: "12px 14px", fontSize: 13,
    color: "#fff", outline: "none", transition: "all 0.3s"
  } as React.CSSProperties,
  label: { fontSize: 9, color: "#666", display: "block", marginBottom: 5, letterSpacing: "1px", textTransform: "uppercase", fontWeight: 700 } as React.CSSProperties,
  btnGold: {
    width: "100%", background: "#c9a96e", color: "#050505",
    border: "none", borderRadius: 4, padding: "15px", fontSize: 11,
    fontWeight: 700, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px",
    transition: "all 0.3s",
  } as React.CSSProperties,
  btnOutline: {
    width: "100%", background: "transparent", color: "#888",
    border: "1px solid rgba(255,255,255,0.1)", borderRadius: 4, padding: "12px",
    fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px",
    transition: "all 0.3s",
  } as React.CSSProperties,
  card: {
    background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: 8, padding: "1.5rem",
  } as React.CSSProperties,
};

export const EventPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Paywall
  const [searchParams] = useSearchParams();
  const [hasPaid, setHasPaid] = useState(false);
  const [access, setAccess] = useState<AccessData | null>(null);
  const [, setOrderId] = useState<string | null>(null);

  const [step, setStep] = useState<"paywall" | "identify" | "checkout" | "processing" | "success">("paywall");
  const [checkoutError, setCheckoutError] = useState("");

  const [cardData, setCardData] = useState({
    number: "", name: "", month: "", year: "", cvv: "",
    email: user?.email || "", 
    cpf: "",
  });
  const [mpLoaded, setMpLoaded] = useState(false);
  const [cardToken, setCardToken] = useState("");
  const [tokenizing, setTokenizing] = useState(false);

  const checkAccess = useCallback(async (oid: string) => {
    try {
      const { data } = await API.get(`/public/events/${id}/access?orderId=${oid}`);
      setAccess(data);
      setHasPaid(true);
      setStep("success");
    } catch (err: unknown) { 
      const error = err as { response?: { status: number } };
      // ATENÇÃO: 403 significa "Aguardando Aprovação". NÃO limpar o orderId.
      if (error.response?.status === 401) {
        console.warn("[Access] Sessão expirada. Limpando...");
        localStorage.removeItem(`fs_order_${id}`);
        setOrderId(null);
      }
      // Repassar erro para quem chamou tratar (ex: polling)
      throw err;
    }
  }, [id, id]);

  useEffect(() => {
    if (!id) return;
    API.get(`/public/events/${id}`)
      .then((r) => setEvent(r.data))
      .catch((e) => {
        if (e.response?.status === 404) setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!id) return;

    // Prioridade 1: orderId na URL (?orderId=xxx)
    const _urlOrderId = searchParams.get("orderId");
    
    // Prioridade 2: orderId no localStorage
    const savedOrderId = localStorage.getItem(`fs_order_${id}`);
    
    const oid = _urlOrderId ?? savedOrderId;
    
    if (oid) {
      setOrderId(oid);
      // Salva no localStorage caso tenha vindo pela URL
      localStorage.setItem(`fs_order_${id}`, oid);
      checkAccess(oid);
    }
  }, [id, searchParams, checkAccess]);

  useEffect(() => {
    if (window.MercadoPago) { setMpLoaded(true); return; }
    const s = document.createElement("script");
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.onload = () => setMpLoaded(true);
    document.head.appendChild(s);
  }, []);

  const handleTokenize = async () => {
    if (!window.MercadoPago || !mpLoaded) return;
    setTokenizing(true);
    setCheckoutError("");
    try {
      const publicKey = (import.meta.env.VITE_MP_PUBLIC_KEY ?? "").trim();
      
      if (!publicKey) {
        setCheckoutError("Chave de pagamento não configurada.");
        setTokenizing(false);
        return;
      }

      const mp = new window.MercadoPago(publicKey);
      const result = await mp.createCardToken({
        cardNumber: cardData.number.replace(/\s/g, ""),
        cardholderName: cardData.name,
        cardExpirationMonth: cardData.month,
        cardExpirationYear: cardData.year.length === 2 ? `20${cardData.year}` : cardData.year,
        securityCode: cardData.cvv,
      });
      console.log("[MercadoPago] Tokenization result:", result);
      if (result.id) {
        setCardToken(result.id);
      } else {
        const errorMsg = result.cause?.[0]?.description || "Dados do cartão incorretos.";
        throw new Error(errorMsg);
      }
    } catch (err: unknown) {
      console.error("[MercadoPago Error]:", err);
      
      const error = err as Error;
      
      // Bypass para Localhost (SSL Restriction) ou modo desenvolvimento
      if (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") {
        console.warn("[MercadoPago] Ambiente local detectado. Usando mock-token para teste de fluxo.");
        setCardToken("mock-token-" + Date.now());
        return;
      }

      setCheckoutError(error.message || "Dados do cartão inválidos. Verifique e tente novamente.");
    } finally {
      setTokenizing(false);
    }
  };

  const handlePay = async () => {
    if (!event || !cardToken) return;
    setStep("processing");
    setCheckoutError("");
    try {
      const { data } = await API.post("/checkout/payment", {
        eventId: event.id,
        userId: user?.id,
        cardToken,
        email: cardData.email,
        cpf: cardData.cpf,
        installments: 1,
        paymentMethodId: detectCardBrand(cardData.number)
      });

      localStorage.setItem(`fs_order_${id}`, data.orderId);
      setOrderId(data.orderId);

      // Atualiza URL com orderId para persistir em refresh
      navigate(`/e/${id}?orderId=${data.orderId}`, { replace: true });

      if (data.status === "APROVADO" || data.status === "approved" || data.hasPaid) {
        await checkAccess(data.orderId);
      } else if (data.status === "rejected") {
        setCheckoutError("Pagamento recusado pelo cartão. Verifique os dados ou tente outro cartão.");
        setStep("checkout");
      } else {
        // Status: in_process, pending, etc.
        pollPaymentStatus(data.orderId);
      }
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setCheckoutError(error.response?.data?.error ?? "Erro ao processar pagamento.");
      setStep("checkout");
    }
  };

  const pollPaymentStatus = (oid: string) => {
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      try {
        await checkAccess(oid);
        clearInterval(interval);
      } catch {
        if (attempts >= 15) {
          clearInterval(interval);
          setCheckoutError("Pagamento em análise. Você receberá o acesso assim que aprovado.");
          setStep("checkout");
        }
      }
    }, 3000);
  };

  const handleDesbloquear = () => {
    if (!user) {
      // Salva intenção de compra
      localStorage.setItem("pending_purchase_event_id", id!);
      setStep("identify");
    } else {
      setStep("checkout");
    }
  };

  if (loading) return <LoadingScreen />;
  if (notFound || !event) return <NotFoundScreen onBack={() => navigate("/")} />;

  return (
    <div style={S.page}>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet" />
      
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#555", fontSize: 11, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2 }}>
          ← Vitrine
        </button>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff" }}>FOTO SEGUNDO.</div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          {user ? (
            <span style={{ fontSize: 9, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>{user.nome || user.email}</span>
          ) : (
            <button onClick={() => navigate("/login")} style={{ background: "none", border: "none", color: "#666", fontSize: 10, cursor: "pointer", textTransform: "uppercase" }}>Login</button>
          )}
        </div>
      </nav>

      <div className="event-grid" style={{ maxWidth: 1100, margin: "0 auto", padding: "3rem 1rem", display: "grid", gridTemplateColumns: "1fr 400px", gap: "3rem", alignItems: "start" }}>
        
        {/* Coluna Evento */}
        <div>
          <div style={{ width: "100%", aspectRatio: "16/9", background: "#0d0d0d", borderRadius: 0, overflow: "hidden", marginBottom: "2.5rem", position: "relative", border: "1px solid rgba(255,255,255,0.03)" }}>
            {event.coverPhotoUrl ? (
              <img 
                src={event.coverPhotoUrl} 
                alt={event.nomeNoivos} 
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).style.display = "none";
                  const ph = (e.currentTarget as HTMLImageElement).parentElement?.querySelector(".cover-placeholder") as HTMLElement;
                  if (ph) ph.style.display = "flex";
                }}
                style={{ width: "100%", height: "100%", objectFit: "cover", filter: hasPaid ? "none" : "blur(8px) brightness(0.7)" }} 
              />
            ) : null}
            <div className="cover-placeholder" style={{ 
              display: event.coverPhotoUrl ? "none" : "flex", 
              width: "100%", height: "100%", 
              alignItems: "center", justifyContent: "center",
              background: "linear-gradient(180deg, #050505 0%, #0a0a0a 100%)" 
            }}>
               <div style={{ textAlign: "center" }}>
                  <div style={{ width: 40, height: 40, border: "0.5px solid #222", transform: "rotate(45deg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <div style={{ width: 6, height: 6, background: "#c9a96e" }} />
                  </div>
                  <span style={{ fontSize: 10, color: "#333", letterSpacing: 3, textTransform: "uppercase" }}>Archive</span>
               </div>
            </div>
            {!hasPaid && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(2px)" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 24, marginBottom: 12, opacity: 0.8 }}>✧</div>
                  <p style={{ fontSize: 9, color: "#c9a96e", letterSpacing: 3, textTransform: "uppercase", fontWeight: 700 }}>Acesso Reservado</p>
                </div>
              </div>
            )}
          </div>

          <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#666", marginBottom: 10, fontWeight: 700 }}>
            <span style={{ color: "#c9a96e" }}>✧</span> {event.cartorio || "Digital Archive"}
          </p>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, fontWeight: 900, color: "#fff", marginBottom: "1rem", lineHeight: 1.1 }}>{event.nomeNoivos}</h1>
          <p style={{ fontSize: 12, color: "#666", marginBottom: "3rem", textTransform: "uppercase", letterSpacing: 2 }}>
            {formatDate(event.dataEvento)}
          </p>

          <div style={{ ...S.card, padding: "2rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "2.5rem" }}>
              <div style={{ width: 15, height: 1, background: "#c9a96e" }} />
              <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#c9a96e", margin: 0, fontWeight: 700 }}>Serviços Inclusos</p>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "2.5rem" }}>
              {[
                { active: event.temFoto, icon: "📸", label: "Galeria Digital", desc: "Fotos em alta resolução com tratamento editorial." },
                { active: event.temVideo, icon: "🎬", label: "Cinema & Filme", desc: "Registro cinematográfico dos momentos principais." },
                { active: event.temReels, icon: "📱", label: "Social Media", desc: "Vídeos otimizados para Reels, Stories e TikTok." },
                { active: event.temFotoImpressa, icon: "💎", label: "Foto Física", desc: "Impressão premium em papel fine art no local." },
              ].map((item) => item.active && (
                <div key={item.label} style={{ display: "flex", gap: 18, alignItems: "flex-start" }}>
                  <div style={{ 
                    minWidth: 42, height: 42, borderRadius: "50%", 
                    background: "rgba(201,169,110,0.05)", border: "1px solid rgba(201,169,110,0.1)",
                    display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18
                  }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 5, letterSpacing: "0.5px" }}>{item.label}</div>
                    <div style={{ fontSize: 11, color: "#666", lineHeight: 1.5, fontWeight: 300 }}>{item.desc}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Caso nenhum serviço esteja ativo (fallback visual) */}
            {!event.temFoto && !event.temVideo && !event.temReels && !event.temFotoImpressa && (
              <p style={{ fontSize: 12, color: "#333", fontStyle: "italic" }}>Consulte os serviços disponíveis para este evento com o cartório oficial.</p>
            )}
          </div>

          {hasPaid && access && (
            <div id="access-area" style={{ marginTop: "3rem", background: "rgba(201, 169, 110, 0.03)", border: "1px solid rgba(201, 169, 110, 0.1)", borderRadius: 12, padding: "2.5rem" }}>
              <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
                <span style={{ fontSize: 9, letterSpacing: 4, textTransform: "uppercase", color: "#c9a96e", fontWeight: 700 }}>Download Center</span>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fff", marginTop: 8 }}>Seus arquivos estão prontos</h3>
              </div>
              
              <div style={{ display: "grid", gap: "1.25rem" }}>
                {access.lightroomUrl && (
                  <a href={access.lightroomUrl} target="_blank" rel="noopener" style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    background: "#000", border: "1px solid rgba(255,255,255,0.05)", 
                    padding: "20px 25px", textDecoration: "none", borderRadius: 8,
                    transition: "all 0.3s"
                  }} className="access-btn">
                    <div>
                      <div style={{ fontSize: 10, color: "#c9a96e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Galeria Exclusiva</div>
                      <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>Adobe Portfolio Archive</div>
                    </div>
                    <span style={{ fontSize: 12, color: "#c9a96e" }}>Acessar Galeria →</span>
                  </a>
                )}
                {access.driveUrl && (
                  <a href={access.driveUrl} target="_blank" rel="noopener" style={{ 
                    display: "flex", alignItems: "center", justifyContent: "space-between", 
                    background: "#000", border: "1px solid rgba(255,255,255,0.05)", 
                    padding: "20px 25px", textDecoration: "none", borderRadius: 8,
                    transition: "all 0.3s"
                  }} className="access-btn">
                    <div>
                      <div style={{ fontSize: 10, color: "#c9a96e", fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Arquivos Brutos</div>
                      <div style={{ fontSize: 14, color: "#fff", fontWeight: 500 }}>Google Drive Storage</div>
                    </div>
                    <span style={{ fontSize: 12, color: "#c9a96e" }}>Baixar Arquivos →</span>
                  </a>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Coluna Centralizada de Checkout */}
        <div style={{ position: "sticky", top: "6.5rem" }}>
          <div className="checkout-step-container" style={{ position: "relative" }}>
            {step === "paywall" && <PaywallCard event={event} onCheckout={handleDesbloquear} />}
            {step === "identify" && <IdentifyCard onLogin={() => navigate("/login")} onRegister={() => navigate("/register?role=CLIENTE")} onBack={() => setStep("paywall")} />}
            {step === "checkout" && (
              <CheckoutCard
                event={event} cardData={cardData} setCardData={setCardData}
                cardToken={cardToken} tokenizing={tokenizing} mpLoaded={mpLoaded} error={checkoutError}
                onTokenize={handleTokenize} onPay={handlePay} onBack={() => setStep("paywall")}
              />
            )}
            {step === "processing" && <ProcessingCard />}
            {step === "success" && (
              <SuccessCard 
                onViewFiles={() => {
                  document.getElementById("access-area")?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              />
            )}
          </div>
        </div>
      </div>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
        .access-btn:hover {
          background: rgba(201, 169, 110, 0.05) !important;
          border-color: rgba(201, 169, 110, 0.3) !important;
          transform: translateY(-2px);
        }
        @media (max-width: 1024px) {
          .event-grid { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .event-grid > div { position: static !important; }
        }
      `}</style>
    </div>
  );
}

function PaywallCard({ event, onCheckout }: { event: EventData; onCheckout: () => void }) {
  return (
    <div style={{ ...S.card, border: "1px solid rgba(201, 169, 110, 0.15)", background: "rgba(201, 169, 110, 0.02)" }}>
      <p style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#666", marginBottom: "1rem", fontWeight: 700 }}>Exclusive Collection</p>
      <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 48, fontWeight: 900, color: "#fff", marginBottom: 5 }}>
        {formatCurrency(event.priceBase)}
      </div>
      <p style={{ fontSize: 12, color: "#555", marginBottom: "2.5rem", lineHeight: 1.5 }}>Acesso vitalício à galeria completa de fotos e vídeos em alta resolução.</p>
      <button style={S.btnGold} onClick={onCheckout}>Desbloquear Arquivos</button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: "1.5rem", opacity: 0.3 }}>
        <span style={{ fontSize: 9, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>Secure Payment</span>
        <div style={{ width: 1, height: 8, background: "#fff" }} />
        <span style={{ fontSize: 9, color: "#fff", letterSpacing: 1, textTransform: "uppercase" }}>Instant Access</span>
      </div>
    </div>
  );
}

function IdentifyCard({ onLogin, onRegister, onBack }: { onLogin: () => void; onRegister: () => void; onBack: () => void }) {
  return (
    <div style={S.card}>
      <button onClick={onBack} style={{ background: "none", border: "none", color: "#444", fontSize: 9, cursor: "pointer", textTransform: "uppercase", letterSpacing: 2, marginBottom: "1.5rem" }}>← Cancelar</button>
      <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
        <div style={{ fontSize: 24, marginBottom: 15, opacity: 0.5 }}>✧</div>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fff", marginBottom: 8 }}>Identifique-se</h3>
        <p style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>Para vincular suas memórias de forma segura, acesse sua conta ou cadastre-se no coletivo.</p>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <button style={S.btnGold} onClick={onLogin}>Já possuo conta</button>
        <button style={S.btnOutline} onClick={onRegister}>Criar novo registro</button>
      </div>
      <p style={{ fontSize: 9, color: "#333", textAlign: "center", marginTop: "1.5rem", textTransform: "uppercase", letterSpacing: 1 }}>Auth Protocol 2.0 · Private Access</p>
    </div>
  );
}

interface CardData {
  number: string;
  name: string;
  month: string;
  year: string;
  cvv: string;
  email: string;
  cpf: string;
}

function CheckoutCard({ event, cardData, setCardData, cardToken, tokenizing, mpLoaded, error, onTokenize, onPay, onBack }: {
  event: EventData; cardData: CardData; setCardData: React.Dispatch<React.SetStateAction<CardData>>; cardToken: string; tokenizing: boolean; mpLoaded: boolean; error: string; onTokenize: () => void; onPay: () => void; onBack: () => void;
}) {
  const set = (k: keyof CardData) => (e: React.ChangeEvent<HTMLInputElement>) => setCardData((p: CardData) => ({ ...p, [k]: e.target.value }));
  return (
    <div style={S.card}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: "#c9a96e", textTransform: "uppercase", letterSpacing: 2 }}>Secure Checkout</p>
        <button onClick={onBack} style={{ background: "none", border: "none", color: "#444", fontSize: 10, cursor: "pointer", textTransform: "uppercase", letterSpacing: 1 }}>Voltar</button>
      </div>
      {error && <div style={{ background: "rgba(248, 113, 113, 0.05)", border: "1px solid rgba(248, 113, 113, 0.2)", padding: 15, color: "#f87171", fontSize: 11, marginBottom: 20, borderRadius: 4 }}>{error}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
        <div><label style={S.label}>Número do Cartão</label><input style={S.input} value={cardData.number} placeholder="0000 0000 0000 0000" onChange={(e) => {
          const v = e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
          setCardData((p: any) => ({ ...p, number: v }));
        }} /></div>
        <div><label style={S.label}>Nome (como no cartão)</label><input style={S.input} value={cardData.name} placeholder="NOME IMPRESSO" onChange={set("name")} /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          <div><label style={S.label}>Mês</label><input style={S.input} maxLength={2} placeholder="MM" value={cardData.month} onChange={set("month")} /></div>
          <div><label style={S.label}>Ano</label><input style={S.input} maxLength={2} placeholder="AA" value={cardData.year} onChange={set("year")} /></div>
          <div><label style={S.label}>CVV</label><input style={S.input} maxLength={4} placeholder="000" value={cardData.cvv} onChange={set("cvv")} /></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 12 }}>
          <div><label style={S.label}>E-mail p/ recibo</label><input style={S.input} type="email" value={cardData.email} onChange={set("email")} disabled={!!cardData.email} /></div>
          <div><label style={S.label}>CPF do titular</label><input style={S.input} value={cardData.cpf} onChange={set("cpf")} /></div>
        </div>
      </div>
      <div style={{ marginTop: "2rem", display: "flex", flexDirection: "column", gap: 12 }}>
        {!cardToken ? (
          <button style={S.btnOutline} onClick={onTokenize} disabled={tokenizing || !mpLoaded}>{tokenizing ? "Criptografando..." : "Validar Cartão"}</button>
        ) : (
          <div style={{ padding: "12px", background: "rgba(74, 222, 128, 0.05)", border: "1px solid rgba(74, 222, 128, 0.1)", color: "#4ade80", fontSize: 10, textAlign: "center", textTransform: "uppercase", letterSpacing: 2, fontWeight: 700 }}>✓ Cartão Validado</div>
        )}
        <button style={{ ...S.btnGold, opacity: cardToken ? 1 : 0.3 }} onClick={onPay} disabled={!cardToken}>Finalizar de R$ {event.priceBase}</button>
      </div>
    </div>
  );
}

function ProcessingCard() {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: "5rem 2rem", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at center, rgba(201, 169, 110, 0.05) 0%, transparent 70%)", animation: "pulse-slow 3s infinite" }} />
      <div style={{ width: 40, height: 40, border: "1.5px solid #c9a96e", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto 30px", animation: "spin 1s linear infinite" }} />
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", marginBottom: 8, letterSpacing: 1 }}>Revelando Memórias</p>
      <p style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 3 }}>Processando seu acesso exclusivo...</p>
      <p style={{ fontSize: 9, color: "#222", marginTop: 20, fontStyle: "italic" }}>Aguarde. A segurança do coletivo está validando sua transação.</p>
    </div>
  );
}

function SuccessCard({ onViewFiles }: { onViewFiles: () => void }) {
  return (
    <div style={{ ...S.card, textAlign: "center", padding: "4rem 2rem", background: "rgba(74, 222, 128, 0.02)", border: "1px solid rgba(74, 222, 128, 0.1)" }}>
      <div style={{ width: 56, height: 56, border: "1px solid #4ade80", borderRadius: "50%", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80", fontSize: 24 }}>✓</div>
      <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#fff", marginBottom: 8 }}>Pagamento Aprovado</p>
      <p style={{ fontSize: 13, color: "#666", marginBottom: "2.5rem", lineHeight: 1.5 }}>Sua galeria exclusiva já está disponível para acesso e download.</p>
      <button style={S.btnGold} onClick={onViewFiles}>Ver Meus Arquivos</button>
    </div>
  );
}

function LoadingScreen() {
  return <div style={{ background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><div style={{ width: 32, height: 32, border: "1px solid #c9a96e", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} /></div>;
}

function NotFoundScreen({ onBack }: { onBack: () => void }) {
  return <div style={{ background: "#050505", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}><p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#fff" }}>Link Expirado ou Inválido</p><button onClick={onBack} style={{ background: "none", border: "none", color: "#c9a96e", cursor: "pointer", textTransform: "uppercase", fontSize: 10, letterSpacing: 2 }}>Voltar à Vitrine</button></div>;
}

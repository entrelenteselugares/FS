import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { T } from "../lib/theme";
import AccessTypeModal from "../components/AccessTypeModal";

interface Pedido {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  hasPaid: boolean;
  accessType?: string | null;
  accessExpiresAt?: string | null;
  event: {
    id: string;
    nomeNoivos: string;
    dataEvento: string;
    location: string;
    city: string | null;
    coverPhotoUrl: string | null;
    lightroomUrl?: string | null;
    driveUrl?: string | null;
    temFoto: boolean;
    temVideo: boolean;
    temReels: boolean;
    temFotoImpressa: boolean;
  };
}

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(v));
}

function formatDate(d: string | null | undefined) {
  if (!d) return "—";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(dt);
}

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "var(--theme-bg)", color: "var(--theme-text)", minHeight: "100vh" } as React.CSSProperties,
  card: { background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", borderRadius: 0 } as React.CSSProperties,
};

export default function ClienteArea() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const fetchPedidos = useCallback(async () => {
    try {
      const { data } = await API.get("/cliente/pedidos");
      setPedidos(data);
      return data;
    } catch (err) {
      console.error("Erro ao carregar pedidos:", err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSelect = useCallback(async (pedido: Pedido) => {
    setSelected(pedido);
    if (pedido.hasPaid && !pedido.event.lightroomUrl) {
      setLoadingDetalhe(true);
      try {
        const { data } = await API.get(`/cliente/pedidos/${pedido.id}`);
        setSelected(data);
      } catch {
        // mantém o que tem
      } finally {
        setLoadingDetalhe(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchPedidos().then(data => {
      const urlOrderId = searchParams.get("orderId");
      if (urlOrderId) {
        const found = data.find((p: Pedido) => p.id === urlOrderId);
        if (found) handleSelect(found);
      }
    });
  }, [searchParams, handleSelect, fetchPedidos]);

  const now = useMemo(() => Date.now(), []);

  const aprovados = pedidos.filter((p) => p.hasPaid);
  const pendentes = pedidos.filter((p) => !p.hasPaid);

  return (
    <div style={S.page}>
      <style>{`
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .mobile-hide { display: none !important; }
          .mobile-nav { padding: 1rem !important; }
          .mobile-detail-panel { width: 100% !important; border: none !important; margin-top: 2rem !important; position: relative !important; top: 0 !important; }
          .mobile-stack { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .mobile-title { font-size: 24px !important; }
        }
      `}</style>
      
      {/* NAV */}
      <nav className="mobile-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "0.5px solid #1a1a1a", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--theme-text-muted)", fontSize: 13, cursor: "pointer", transition: "color .2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--theme-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--theme-text-muted)")}>
          ← <span className="mobile-hide">Voltar para Galeria</span><span className="md:hidden">Voltar</span>
        </button>
        <div style={{ display: "flex", alignItems: "center" }}>
          <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 26, objectFit: "contain" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div className="mobile-hide" style={{ textAlign: "right" }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", margin: 0 }}>{user?.nome}</p>
          </div>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 11, cursor: "pointer", transition: "all .2s" }}>
            Sair
          </button>
        </div>
      </nav>
      {/* EXPIRING ALERT BANNER */}
      {(() => {
        const expiringOrders = aprovados.filter(p => {
          if (!p.accessExpiresAt) return false;
          const diff = new Date(p.accessExpiresAt).getTime() - Date.now();
          const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
          return days > 0 && days <= 7;
        });

        if (expiringOrders.length === 0) return null;

        return (
          <div style={{ background: "#f59e0b", color: "#000", padding: "12px 2rem", textAlign: "center", fontSize: 12, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1.5, display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
            <span style={{ fontSize: 18 }}>⚠️</span>
            ATENÇÃO: Você tem {expiringOrders.length} álbum(ns) que expiram em breve. Faça o download dos seus arquivos hoje mesmo!
          </div>
        );
      })()}

      <div className="mobile-grid-1" style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: "3rem", transition: "all 0.3s ease" }}>

        {/* LISTA */}
        <div>
          <div style={{ marginBottom: "2.5rem" }}>
            <h1 className="mobile-title" style={{ fontSize: 32, fontWeight: 800, color: "var(--theme-text)", marginBottom: 8, letterSpacing: -0.5 }}>
              Meus Arquivos
            </h1>
            <p style={{ fontSize: 14, color: "var(--theme-text-muted)" }}>
              Acesso vitalício às memórias que você adquiriu.
            </p>
          </div>


          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ ...S.card, padding: "1.5rem", display: "flex", gap: "1.5rem", animation: "pulse 2s infinite" }}>
                    <div style={{ width: 100, height: 100, background: "#111", borderRadius: 8, flexShrink: 0 }} />
                    <div style={{ flex: 1, paddingTop: 4 }}>
                        <div style={{ height: 18, background: "#111", borderRadius: 4, width: "70%", marginBottom: 12 }} />
                        <div style={{ height: 14, background: "#111", borderRadius: 4, width: "40%" }} />
                    </div>
                </div>
              ))}
              <style>{`@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }`}</style>
            </div>
          ) : pedidos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 0", background: "var(--theme-bg-muted)", borderRadius: 20, border: "1px dashed var(--theme-border)" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "var(--theme-text)", marginBottom: 10 }}>
                Sua galeria está vazia
              </p>
              <p style={{ fontSize: 15, color: "var(--theme-text-muted)", marginBottom: "2rem" }}>
                Você ainda não adquiriu fotos de nenhum evento.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{ background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", border: "none", borderRadius: 0, padding: "12px 28px", fontSize: 13, fontWeight: 900, cursor: "pointer", transition: "transform .2s", textTransform: "uppercase", letterSpacing: 2 }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Explorar Vitrine
              </button>
            </div>
          ) : (
            <div>
              {/* Liberados */}
              {aprovados.length > 0 && (
                <div style={{ marginBottom: "3.5rem" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#85B9AC", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: "#85B9AC", borderRadius: "50%" }} />
                    Acesso Liberado
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {aprovados.map((p) => (
                      <PedidoRow
                        key={p.id}
                        pedido={p}
                        now={now}
                        isSelected={selected?.id === p.id}
                        onClick={() => handleSelect(p)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Pendentes */}
              {pendentes.length > 0 && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#f59e0b", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: "#f59e0b", borderRadius: "50%" }} />
                    Aguardando Confirmação
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {pendentes.map((p) => (
                      <PedidoRow
                        key={p.id}
                        pedido={p}
                        now={now}
                        isSelected={selected?.id === p.id}
                        onClick={() => handleSelect(p)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* DETALHE (SIDEBAR) */}
        {selected && (
          <div className="mobile-detail-panel" style={{ position: "relative" }}>
             <PedidoDetalhe
                pedido={selected}
                loading={loadingDetalhe}
                onClose={() => setSelected(null)}
                onGoToEvent={() => navigate(`/e/${selected.event.id}`)}
                onChangePrivacy={() => setIsPrivacyModalOpen(true)}
            />
          </div>
        )}
      </div>

      {isPrivacyModalOpen && selected && (
        <AccessTypeModal
          orderId={selected.id}
          eventTitle={selected.event.nomeNoivos}
          onConfirmed={async () => {
            setIsPrivacyModalOpen(false);
            const data = await fetchPedidos();
            // Atualiza o selecionado para refletir a mudança
            const updated = data.find((p: any) => p.id === selected.id);
            if (updated) setSelected(updated);
            else setSelected(null);
          }}
        />
      )}
    </div>
  );
}

// ── Componentes Internos ─────────────────────────────────────────

function PedidoRow({ pedido, now, isSelected, onClick }: {
  pedido: Pedido;
  now: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const diff = pedido.accessExpiresAt ? new Date(pedido.accessExpiresAt).getTime() - now : null;
  const daysLeft = diff ? Math.ceil(diff / (1000 * 60 * 60 * 24)) : null;
  const isExpiringSoon = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;

  return (
    <div
      onClick={onClick}
      className="mobile-stack"
      style={{
        ...S.card,
        padding: "1.25rem 1.5rem",
        cursor: "pointer",
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        borderColor: isExpiringSoon ? "#f59e0b" : (isSelected ? "var(--brand-primary)" : "var(--theme-border)"),
        background: isSelected ? "var(--theme-highlight)" : "var(--theme-bg-muted)",
        boxShadow: isExpiringSoon ? "0 0 15px rgba(245, 158, 11, 0.1)" : "none",
        transition: "all .2s ease-out",
        transform: isSelected ? "translateY(-4px)" : "none",
      }}
      onMouseEnter={(e) => !isSelected && ((e.currentTarget as HTMLDivElement).style.borderColor = "var(--brand-primary)")}
      onMouseLeave={(e) => !isSelected && ((e.currentTarget as HTMLDivElement).style.borderColor = isExpiringSoon ? "#f59e0b" : "var(--theme-border)")}
    >
      {/* Thumbnail */}
      <div style={{ width: 84, height: 84, background: "#111", borderRadius: 10, flexShrink: 0, overflow: "hidden", position: "relative" }}>
        {pedido.event.coverPhotoUrl ? (
          <img src={pedido.event.coverPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: pedido.hasPaid ? "none" : "grayscale(80%) brightness(0.4)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
        )}
        {isExpiringSoon && (
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "#f59e0b", color: "#000", fontSize: 8, fontWeight: 900, textAlign: "center", padding: "4px 0", textTransform: "uppercase", letterSpacing: 0.5 }}>
            {daysLeft}d restantes
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "var(--theme-text)", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pedido.event.nomeNoivos}
        </p>
        <p style={{ fontSize: 12, color: "var(--theme-text-muted)", marginBottom: 10 }}>
          {formatDate(pedido.event.dataEvento)} · {pedido.event.city || pedido.event.location}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pedido.event.temFoto && <Tag label="Foto" />}
          {pedido.event.temVideo && <Tag label="Vídeo" />}
          {pedido.event.temReels && <Tag label="Reels" color="var(--brand-primary)" />}
        </div>
        
        {pedido.accessExpiresAt && pedido.hasPaid && (
          <div style={{ marginTop: 8 }}>
            {(() => {
              const expires = new Date(pedido.accessExpiresAt ?? "");
              if (isNaN(expires.getTime())) return null;
              const now = new Date();
              const dias = Math.ceil((expires.getTime() - now.getTime()) / 86400000);
              const urgente = dias <= 5;
              const expirado = dias <= 0;
              return (
                <span style={{
                  fontSize: 9, padding: "3px 8px", letterSpacing: 0.5,
                  textTransform: "uppercase", fontWeight: 700,
                  background: expirado ? "#1a0a0a" : urgente ? "#1a0d00" : "#0f130a",
                  border: `1px solid ${expirado ? "#3a1a1a" : urgente ? "#3a2000" : "#85B9AC"}`,
                  color: expirado ? "#f87171" : urgente ? "#f59e0b" : "#85B9AC",
                  borderRadius: 4
                }}>
                  {expirado
                    ? "Expirado"
                    : `${dias}d restantes — ${pedido.accessType === "PUBLIC" ? "Público" : "Privado"}`}
                </span>
              );
            })()}
          </div>
        )}
      </div>

      {/* Valor */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 18, color: "var(--theme-text)", fontWeight: 800 }}>
          {formatCurrency(pedido.amount)}
        </p>
        <p style={{ fontSize: 10, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
          ID: {pedido.id.slice(-6).toUpperCase()}
        </p>
      </div>
    </div>
  );
}

function Tag({ label, color = "#444" }: { label: string; color?: string }) {
  return (
    <span style={{ fontSize: 9, padding: "2px 8px", borderRadius: 4, border: `0.5px solid ${color}`, color: color, letterSpacing: 0.5, textTransform: "uppercase" }}>
      {label}
    </span>
  );
}

function PedidoDetalhe({ pedido, loading, onClose, onGoToEvent }: {
  pedido: Pedido;
  loading: boolean;
  onClose: () => void;
  onGoToEvent: () => void;
  onChangePrivacy: () => void;
}) {
  return (
    <div style={{ ...S.card, position: "sticky", top: "100px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "0.5px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: pedido.hasPaid ? "#85B9AC" : "#f59e0b", marginBottom: 6 }}>
            {pedido.hasPaid ? "Entrega Liberada" : "Pedido em Processamento"}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "var(--theme-text)", margin: 0 }}>
            {pedido.event.nomeNoivos}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--theme-text-muted)", fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }} onMouseEnter={(e) => (e.currentTarget.style.color = "var(--theme-text)")} onMouseLeave={(e) => (e.currentTarget.style.color = "var(--theme-text-muted)")}>
          ×
        </button>
      </div>

      {pedido.accessExpiresAt && pedido.hasPaid && (
        <div style={{ 
          margin: "0 1.5rem", 
          marginTop: "1.5rem", 
          padding: "10px 14px", 
          background: pedido.accessType === "PRIVATE" ? "#1a0a0a" : "#0f130a", 
          border: `1px solid ${pedido.accessType === "PRIVATE" ? "#3a1a1a" : "#85B9AC"}`,
          borderRadius: 4
        }}>
          <p style={{ fontSize: 11, color: pedido.accessType === "PRIVATE" ? "#f87171" : "#85B9AC", margin: 0, fontWeight: 600 }}>
            {pedido.accessType === "PRIVATE" ? "⚠️ ACESSO PRIVADO" : "📅 ÁLBUM PÚBLICO"}
          </p>
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", margin: 0, marginTop: 4 }}>
            Expira em: {new Date(pedido.accessExpiresAt).toLocaleDateString("pt-BR")}
          </p>
        </div>
      )}

      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Links */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ width: 30, height: 30, border: "2px solid var(--brand-primary)", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
          </div>
        ) : pedido.hasPaid ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 1 }}>Links de Acesso</p>
            
            {pedido.event.lightroomUrl ? (
              <a
                href={pedido.event.lightroomUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: "14px 18px", textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.background = T.bgCard; }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--theme-text)", marginBottom: 2 }}>📸 Álbum Digital</p>
                  <p style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>Curadoria em Alta Resolução</p>
                </div>
                <span style={{ color: "#c9a96e" }}>↗</span>
              </a>
            ) : (
                <div style={{ background: "var(--theme-bg-muted)", border: "0.5px solid var(--theme-border)", borderRadius: 10, padding: "14px 18px" }}>
                   <p style={{ fontSize: 13, color: "var(--theme-text-muted)", margin: 0 }}>📸 Fotos em edição — disponível em breve</p>
                </div>
            )}

            {pedido.event.driveUrl ? (
              <a
                href={pedido.event.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: "14px 18px", textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.background = T.bgCard; }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.background = T.bg; }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--theme-text)", marginBottom: 2 }}>🎬 Vídeos & Reels</p>
                  <p style={{ fontSize: 11, color: "var(--theme-text-muted)" }}>Download via Google Drive</p>
                </div>
                <span style={{ color: "#c9a96e" }}>↗</span>
              </a>
            ) : (pedido.event.temVideo || pedido.event.temReels) && (
                 <div style={{ background: "#050505", border: "0.5px solid #1a1a1a", borderRadius: 10, padding: "14px 18px" }}>
                    <p style={{ fontSize: 13, color: "#444", margin: 0 }}>🎬 Vídeos em edição — disponível em breve</p>
                 </div>
            )}
          </div>
        ) : (
          <div style={{ background: "rgba(245,158,11,0.05)", border: "0.5px solid rgba(245,158,11,0.2)", borderRadius: 10, padding: "1.25rem" }}>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#f59e0b", marginBottom: 6 }}>Pagamento Pendente</p>
            <p style={{ fontSize: 12, color: "var(--theme-text-muted)", lineHeight: 1.6, margin: 0 }}>
              O Mercado Pago está confirmando sua transação. Nossos servidores liberarão o acesso automaticamente assim que aprovado.
            </p>
          </div>
        )}

        {/* Info */}
        <div style={{ background: "var(--theme-bg-muted)", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--theme-text-muted)" }}>Data da Compra</span>
                <span style={{ color: "var(--theme-text)" }}>{formatDate(pedido.createdAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--theme-text-muted)" }}>Valor Total</span>
                <span style={{ color: "var(--brand-primary)", fontWeight: 700 }}>{formatCurrency(pedido.amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "var(--theme-text-muted)" }}>Status MP</span>
                <span style={{ color: pedido.hasPaid ? "#85B9AC" : "#f59e0b" }}>{pedido.status}</span>
            </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <button
            onClick={onGoToEvent}
            style={{ background: "transparent", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "14px", color: "var(--theme-text-muted)", fontSize: 10, fontWeight: 800, cursor: "pointer", transition: "all .2s", textTransform: "uppercase", letterSpacing: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--brand-primary)"; e.currentTarget.style.color = "var(--theme-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--theme-border)"; e.currentTarget.style.color = "var(--theme-text-muted)"; }}
          >
            Página do Evento
          </button>
          <button
            onClick={onChangePrivacy}
            style={{ background: "transparent", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "14px", color: "var(--theme-text-muted)", fontSize: 10, fontWeight: 800, cursor: "pointer", transition: "all .2s", textTransform: "uppercase", letterSpacing: 1 }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#f87171"; e.currentTarget.style.color = "var(--theme-text)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--theme-border)"; e.currentTarget.style.color = "var(--theme-text-muted)"; }}
          >
            Mudar Privacidade
          </button>
        </div>
      </div>
    </div>
  );
}

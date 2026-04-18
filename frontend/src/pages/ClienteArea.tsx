import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";

interface Pedido {
  id: string;
  status: string;
  amount: number;
  createdAt: string;
  hasPaid: boolean;
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

function formatDate(d: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit", month: "long", year: "numeric",
  }).format(new Date(d));
}

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "#050505", color: "#e8e4dc", minHeight: "100vh" } as React.CSSProperties,
  card: { background: "#0a0a0a", border: "0.5px solid #1a1a1a", borderRadius: 12 } as React.CSSProperties,
};

export default function ClienteArea() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [selected, setSelected] = useState<Pedido | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetalhe, setLoadingDetalhe] = useState(false);

  useEffect(() => {
    API.get("/cliente/pedidos")
      .then((r) => {
        setPedidos(r.data);
        const urlOrderId = searchParams.get("orderId");
        if (urlOrderId) {
          const found = r.data.find((p: Pedido) => p.id === urlOrderId);
          if (found) handleSelect(found);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSelect = async (pedido: Pedido) => {
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
  };

  const aprovados = pedidos.filter((p) => p.hasPaid);
  const pendentes = pedidos.filter((p) => !p.hasPaid);

  return (
    <div style={S.page}>
      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2rem", background: "rgba(10,10,10,0.8)", backdropFilter: "blur(10px)", borderBottom: "0.5px solid #1a1a1a", position: "sticky", top: 0, zIndex: 100 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#888", fontSize: 13, cursor: "pointer", transition: "color .2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#888")}>
          ← Voltar para Galeria
        </button>
        <div style={{ fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: 1, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 8, height: 8, background: "#c9a96e", borderRadius: "50%" }} />
          FOTO SEGUNDO
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div style={{ textAlign: "right" }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "#fff", margin: 0 }}>{user?.nome}</p>
            <p style={{ fontSize: 10, color: "#555", margin: 0 }}>Área do Cliente</p>
          </div>
          <button onClick={logout} style={{ background: "rgba(255,255,255,0.05)", border: "0.5px solid #222", borderRadius: 6, padding: "6px 14px", color: "#fff", fontSize: 12, cursor: "pointer", transition: "all .2s" }} onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#c9a96e")} onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#222")}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "3rem 2rem", display: "grid", gridTemplateColumns: selected ? "1fr 420px" : "1fr", gap: "3rem", transition: "all 0.3s ease" }}>

        {/* LISTA */}
        <div>
          <div style={{ marginBottom: "2.5rem" }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 8, letterSpacing: -0.5 }}>
              Meus Arquivos
            </h1>
            <p style={{ fontSize: 14, color: "#888" }}>
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
            <div style={{ textAlign: "center", padding: "6rem 0", background: "rgba(255,255,255,0.02)", borderRadius: 20, border: "1px dashed #222" }}>
              <p style={{ fontSize: 24, fontWeight: 700, color: "#333", marginBottom: 10 }}>
                Sua galeria está vazia
              </p>
              <p style={{ fontSize: 15, color: "#555", marginBottom: "2rem" }}>
                Você ainda não adquiriu fotos de nenhum evento.
              </p>
              <button
                onClick={() => navigate("/")}
                style={{ background: "#c9a96e", color: "#000", border: "none", borderRadius: 8, padding: "12px 28px", fontSize: 14, fontWeight: 700, cursor: "pointer", transition: "transform .2s" }}
                onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
              >
                Explorar Eventos
              </button>
            </div>
          ) : (
            <div>
              {/* Liberados */}
              {aprovados.length > 0 && (
                <div style={{ marginBottom: "3.5rem" }}>
                  <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "#4ade80", marginBottom: "1rem", display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, background: "#4ade80", borderRadius: "50%" }} />
                    Acesso Liberado
                  </p>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {aprovados.map((p) => (
                      <PedidoRow
                        key={p.id}
                        pedido={p}
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
          <div style={{ position: "relative" }}>
             <PedidoDetalhe
                pedido={selected}
                loading={loadingDetalhe}
                onClose={() => setSelected(null)}
                onGoToEvent={() => navigate(`/e/${selected.event.id}`)}
            />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Componentes Internos ─────────────────────────────────────────

function PedidoRow({ pedido, isSelected, onClick }: {
  pedido: Pedido;
  isSelected: boolean;
  onClick: () => void;
}) {
  return (
    <div
      onClick={onClick}
      style={{
        ...S.card,
        padding: "1.25rem 1.5rem",
        cursor: "pointer",
        display: "flex",
        gap: "1.5rem",
        alignItems: "center",
        borderColor: isSelected ? "#c9a96e" : "#1a1a1a",
        background: isSelected ? "rgba(201,169,110,0.03)" : "#0a0a0a",
        transition: "all .2s ease-out",
        transform: isSelected ? "translateX(10px)" : "none",
      }}
      onMouseEnter={(e) => !isSelected && ((e.currentTarget as HTMLDivElement).style.borderColor = "#333")}
      onMouseLeave={(e) => !isSelected && ((e.currentTarget as HTMLDivElement).style.borderColor = "#1a1a1a")}
    >
      {/* Thumbnail */}
      <div style={{ width: 84, height: 84, background: "#111", borderRadius: 10, flexShrink: 0, overflow: "hidden", position: "relative" }}>
        {pedido.event.coverPhotoUrl ? (
          <img src={pedido.event.coverPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", filter: pedido.hasPaid ? "none" : "grayscale(80%) brightness(0.4)" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>📦</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {pedido.event.nomeNoivos}
        </p>
        <p style={{ fontSize: 12, color: "#666", marginBottom: 10 }}>
          {formatDate(pedido.event.dataEvento)} · {pedido.event.city || pedido.event.location}
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {pedido.event.temFoto && <Tag label="Foto" />}
          {pedido.event.temVideo && <Tag label="Vídeo" />}
          {pedido.event.temReels && <Tag label="Reels" color="#c9a96e" />}
        </div>
      </div>

      {/* Valor */}
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <p style={{ fontSize: 18, color: "#fff", fontWeight: 800 }}>
          {formatCurrency(pedido.amount)}
        </p>
        <p style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 0.5 }}>
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
}) {
  return (
    <div style={{ ...S.card, position: "sticky", top: "100px", overflow: "hidden" }}>

      {/* Header */}
      <div style={{ padding: "1.5rem", borderBottom: "0.5px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", color: pedido.hasPaid ? "#4ade80" : "#f59e0b", marginBottom: 6 }}>
            {pedido.hasPaid ? "Entrega Liberada" : "Pedido em Processamento"}
          </p>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#fff", margin: 0 }}>
            {pedido.event.nomeNoivos}
          </h2>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", fontSize: 24, cursor: "pointer", padding: 0, lineHeight: 1 }} onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")} onMouseLeave={(e) => (e.currentTarget.style.color = "#444")}>
          ×
        </button>
      </div>

      <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>

        {/* Links */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "2rem 0" }}>
            <div style={{ width: 30, height: 30, border: "2px solid #c9a96e", borderTopColor: "transparent", borderRadius: "50%", margin: "0 auto", animation: "spin 1s linear infinite" }} />
          </div>
        ) : pedido.hasPaid ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#555", textTransform: "uppercase", letterSpacing: 1 }}>Links de Acesso</p>
            
            {pedido.event.lightroomUrl ? (
                
                href={pedido.event.lightroomUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: "14px 18px", textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a96e"; e.currentTarget.style.background = "#161616"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.background = "#111"; }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>📸 Álbum Digital</p>
                  <p style={{ fontSize: 11, color: "#666" }}>Curadoria em Alta Resolução</p>
                </div>
                <span style={{ color: "#c9a96e" }}>↗</span>
              </a>
            ) : (
                <div style={{ background: "#050505", border: "0.5px solid #1a1a1a", borderRadius: 10, padding: "14px 18px" }}>
                   <p style={{ fontSize: 13, color: "#444", margin: 0 }}>📸 Fotos em edição — disponível em breve</p>
                </div>
            )}

            {pedido.event.driveUrl ? (
                
                href={pedido.event.driveUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#111", border: "0.5px solid #222", borderRadius: 10, padding: "14px 18px", textDecoration: "none", transition: "all .2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a96e"; e.currentTarget.style.background = "#161616"; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.background = "#111"; }}
              >
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "#fff", marginBottom: 2 }}>🎬 Vídeos & Reels</p>
                  <p style={{ fontSize: 11, color: "#666" }}>Download via Google Drive</p>
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
            <p style={{ fontSize: 12, color: "#888", lineHeight: 1.6, margin: 0 }}>
              O Mercado Pago está confirmando sua transação. Nossos servidores liberarão o acesso automaticamente assim que aprovado.
            </p>
          </div>
        )}

        {/* Info */}
        <div style={{ background: "#050505", borderRadius: 10, padding: "1rem", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#555" }}>Data da Compra</span>
                <span style={{ color: "#eee" }}>{formatDate(pedido.createdAt)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#555" }}>Valor Total</span>
                <span style={{ color: "#c9a96e", fontWeight: 700 }}>{formatCurrency(pedido.amount)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                <span style={{ color: "#555" }}>Status MP</span>
                <span style={{ color: pedido.hasPaid ? "#4ade80" : "#f59e0b" }}>{pedido.status}</span>
            </div>
        </div>

        <button
          onClick={onGoToEvent}
          style={{ background: "transparent", border: "1px solid #222", borderRadius: 8, padding: "12px", color: "#888", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .2s" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#c9a96e"; e.currentTarget.style.color = "#fff"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#222"; e.currentTarget.style.color = "#888"; }}
        >
          Página do Evento
        </button>
      </div>
    </div>
  );
}

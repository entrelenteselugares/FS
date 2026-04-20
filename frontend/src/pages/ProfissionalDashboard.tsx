import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";

interface EventItem {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  createdAt: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
  temFoto: boolean;
  temVideo: boolean;
  temReels: boolean;
  temFotoImpressa: boolean;
  eventHours: number | null;
  _count: { pedidos: number };
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function formatDate(d: string) {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      day: "2-digit", month: "short", year: "numeric",
    }).format(new Date(d));
  } catch {
    return "Data inválida";
  }
}

// Componente de Cronômetro de Entrega
function DeadlineTimer({ event, type }: { event: EventItem; type: "FOTO" | "VIDEO" }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isDelivered = type === "FOTO" ? !!event.lightroomUrl : !!event.driveUrl;
  const targetMinutes = type === "FOTO" ? 30 : 48 * 60; // 30min ou 48h
  
  useEffect(() => {
    if (isDelivered) return;

    const timer = setInterval(() => {
      const start = new Date(event.dataEvento).getTime();
      const target = start + (targetMinutes * 60 * 1000);
      const now = new Date().getTime();
      setTimeLeft(target - now);
    }, 1000);

    return () => clearInterval(timer);
  }, [event.dataEvento, targetMinutes, isDelivered]);

  if (isDelivered) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 5, color: "#85B9AC", fontSize: 10, fontWeight: 700, textTransform: "uppercase" }}>
        <span style={{ fontSize: 14 }}>✓</span> {type === "FOTO" ? "Fotos OK" : "Vídeo OK"}
      </div>
    );
  }

  const isOverdue = timeLeft < 0;
  const absTime = Math.abs(timeLeft);
  const h = Math.floor(absTime / (1000 * 60 * 60));
  const m = Math.floor((absTime % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((absTime % (1000 * 60)) / 1000);

  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return (
    <div style={{ color: isOverdue ? "#ef4444" : "#eab308", fontSize: 10, fontWeight: 600 }}>
      {type === "FOTO" ? "📸 Foto: " : "🎬 Vídeo: "}
      {isOverdue ? `Atrasado ${timeStr}` : `Faltam ${timeStr}`}
    </div>
  );
}

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "var(--theme-bg)", color: "var(--theme-text)", minHeight: "100vh" } as React.CSSProperties,
  input: { width: "100%", background: "transparent", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "12px 14px", fontSize: 13, color: "var(--theme-text)", outline: "none", transition: "all 0.2s", fontFamily: "'Outfit', sans-serif" } as React.CSSProperties,
  label: { fontSize: 11, color: "var(--theme-text-muted)", display: "block", marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" as const, fontWeight: 900, fontFamily: "'Outfit', sans-serif" } as React.CSSProperties,
  card: { background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)", borderRadius: 0, overflow: "hidden" as const, transition: "transform 0.2s" } as React.CSSProperties,
};

export default function ProfissionalDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<EventItem | null>(null);

  useEffect(() => {
    API.get("/profissional/events")
      .then((r) => setEvents(r.data))
      .catch((err) => console.error("Erro ao buscar eventos:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleUpdated = useCallback((updated: Partial<EventItem>) => {
    setSelected((prev) => prev ? { ...prev, ...updated } : prev);
    setEvents((prev) =>
      prev.map((e) => (selected && e.id === selected.id ? { ...e, ...updated } : e))
    );
  }, [selected]);

  return (
    <div style={S.page}>
      <style>{`
        * { box-sizing: border-box; }
        input:focus { border-color: var(--brand-primary) !important; }
        .hover-row:hover { background: var(--theme-bg-muted) !important; transform: translateY(-2px); }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        
        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; gap: 2rem !important; }
          .mobile-stack { flex-direction: column !important; align-items: center !important; text-align: center !important; gap: 1rem !important; }
          .mobile-hide { display: none !important; }
          .mobile-nav { padding: 1rem !important; }
          .mobile-padding { padding: 2rem 1.5rem !important; }
          .mobile-detail-panel { width: 100% !important; margin-top: 2rem !important; position: relative !important; top: 0 !important; }
        }
      `}</style>

      {/* NAV */}
      <nav className="mobile-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2.5rem", borderBottom: "1px solid var(--theme-border)", background: "var(--theme-bg)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "var(--brand-primary)", fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, cursor: "pointer" }}>
            ← <span className="mobile-hide">Vitrine</span>
          </button>
          <div onClick={() => navigate("/")} style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
            <img 
              src="/logo-premium.png" 
              alt="Logo" 
              style={{ 
                height: 40, 
                objectFit: "contain",
                filter: "brightness(0) invert(1)"
              }} 
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 15 }}>
          <div className="mobile-hide" style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: "var(--theme-text)", fontWeight: 700, textTransform: "uppercase" }}>{user?.nome}</div>
          </div>
          <button onClick={logout} style={{ background: "none", border: "1px solid var(--theme-border)", borderRadius: 0, padding: "8px 14px", color: "var(--theme-text-muted)", fontSize: 10, fontWeight: 700, textTransform: "uppercase", cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </nav>

      <div className="mobile-grid-1 mobile-padding" style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "3rem 2.5rem",
        display: "grid",
        gridTemplateColumns: selected ? "1fr 440px" : "1fr",
        gap: "2.5rem",
      }}>
        {/* LISTA DE EVENTOS */}
        <div>
          <header className="mobile-stack" style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 48, fontWeight: 900, color: "var(--theme-text)", marginBottom: 4, textTransform: "uppercase", letterSpacing: -1 }}>
                Meus eventos
              </h1>
              <p style={{ fontSize: 12, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>
                {events.length} evento{events.length !== 1 ? "s" : ""} gerenciado{events.length !== 1 ? "s" : ""} por você
              </p>
            </div>
          </header>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ background: "var(--theme-bg-muted)", height: 100, borderRadius: 0, opacity: 0.5 }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 0", background: "var(--theme-bg-muted)", borderRadius: 0, border: "1px dashed var(--theme-border)" }}>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 24, color: "var(--brand-primary)", marginBottom: 12, fontWeight: 900, textTransform: "uppercase" }}>Nenhum evento no seu radar</p>
              <p style={{ fontSize: 12, color: "var(--theme-text-muted)", maxWidth: 350, margin: "0 auto", textTransform: "uppercase", letterSpacing: 1 }}>Assim que você for alocado em um novo evento, ele aparecerá aqui automaticamente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {events.map((event) => {
                const isNew = (new Date().getTime() - new Date(event.createdAt).getTime()) < 24 * 60 * 60 * 1000;
                
                return (
                  <div
                    key={event.id}
                    className="hover-row"
                    onClick={() => setSelected(selected?.id === event.id ? null : event)}
                    style={{
                      ...S.card,
                      background: selected?.id === event.id ? "var(--theme-highlight)" : "var(--theme-bg-muted)",
                      borderColor: selected?.id === event.id ? "var(--brand-primary)" : "var(--theme-border)",
                      padding: "1.25rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "1.5rem",
                      transition: "all .2s",
                      position: "relative"
                    }}
                  >
                    {isNew && (
                      <div style={{ position: "absolute", top: 0, left: 0, background: "var(--brand-primary)", color: "var(--theme-text-on-brand)", fontSize: 8, fontWeight: 900, padding: "4px 10px", borderRadius: 0, textTransform: "uppercase", letterSpacing: 1 }}>
                        Novo
                      </div>
                    )}

                    {/* Thumbnail */}
                    <div style={{ width: 80, height: 80, background: "var(--theme-bg)", borderRadius: 0, flexShrink: 0, overflow: "hidden", border: "1px solid var(--theme-border)" }}>
                      {event.coverPhotoUrl ? (
                        <img src={event.coverPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--theme-text-muted)" }}>
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21,15 16,10 5,21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "var(--theme-text)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textTransform: "uppercase" }}>{event.nomeNoivos}</div>
                      <div style={{ fontSize: 11, color: "var(--theme-text-muted)", marginBottom: 8, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1 }}>
                        {formatDate(event.dataEvento)} · {event.cartorio || "UNIDADE NÃO DEFINIDA"} · {event.eventHours ?? 2}H
                      </div>
                      
                      <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
                        {event.temFoto && <DeadlineTimer event={event} type="FOTO" />}
                        {event.temVideo && <DeadlineTimer event={event} type="VIDEO" />}
                      </div>
                    </div>

                    {/* Vendas (Prominent) */}
                    <div style={{ textAlign: "right", paddingLeft: 20, borderLeft: "1px solid var(--theme-border)", flexShrink: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "flex-end" }}>
                        {event._count.pedidos > 5 && <span style={{ fontSize: 12 }}>🔥</span>}
                        <div style={{ fontSize: 24, fontWeight: 900, color: event._count.pedidos > 0 ? "var(--brand-primary)" : "var(--theme-text-muted)", fontFamily: "'Outfit', sans-serif" }}>
                          {event._count.pedidos}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: "var(--theme-text-muted)", textTransform: "uppercase", letterSpacing: 2, fontWeight: 800 }}>Vendas</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* PAINEL DE EDIÇÃO */}
        {selected && (
          <EventEditPanel
            key={selected.id}
            event={selected}
            onUpdated={handleUpdated}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

// ── Painel de edição — extraído para componente separado ──────────────

function EventEditPanel({ event, onUpdated, onClose }: {
  event: EventItem;
  onUpdated: (u: Partial<EventItem>) => void;
  onClose: () => void;
}) {
  const [lrUrl, setLrUrl] = useState(event.lightroomUrl ?? "");
  const [drUrl, setDrUrl] = useState(event.driveUrl ?? "");
  const [linkStatus, setLinkStatus] = useState<SaveStatus>("idle");
  const [coverStatus, setCoverStatus] = useState<SaveStatus>("idle");
  const [coverPreview, setCoverPreview] = useState<string | null>(event.coverPhotoUrl);
  const fileRef = useRef<HTMLInputElement>(null);


  const saveLinks = async () => {
    setLinkStatus("saving");
    try {
      const { data } = await API.patch(`/profissional/events/${event.id}/links`, {
        lightroomUrl: lrUrl || null,
        driveUrl: drUrl || null,
      });
      onUpdated({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl });
      setLinkStatus("saved");
      setTimeout(() => setLinkStatus("idle"), 2000);
    } catch {
      setLinkStatus("error");
      setTimeout(() => setLinkStatus("idle"), 3000);
    }
  };

  const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview imediato via FileReader
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setCoverPreview(base64);

      // Inicia upload via base64 (Stateless / Vercel Ready)
      setCoverStatus("saving");
      try {
        const { data } = await API.patch(`/profissional/events/${event.id}/cover`, {
          imageBase64: base64,
          mimeType: file.type
        });
        onUpdated({ coverPhotoUrl: data.coverPhotoUrl });
        setCoverStatus("saved");
        setTimeout(() => setCoverStatus("idle"), 2500);
      } catch {
        setCoverStatus("error");
        setTimeout(() => setCoverStatus("idle"), 3000);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div style={{ ...S.card, position: "sticky", top: "6rem", height: "fit-content", padding: "2rem" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
        <div>
          <p style={{ fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: "var(--brand-primary)", marginBottom: 6, fontWeight: 900 }}>Gestão de Evento</p>
          <h2 style={{ fontFamily: "'Outfit', sans-serif", fontSize: 28, color: "var(--theme-text)", margin: 0, fontWeight: 900, textTransform: "uppercase", letterSpacing: -0.5 }}>{event.nomeNoivos}</h2>
          <p style={{ fontSize: 11, color: "var(--theme-text-muted)", marginTop: 4, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>{formatDate(event.dataEvento)}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--theme-text-muted)", fontSize: 28, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Upload de Capa */}
      <section style={{ marginBottom: "2.5rem" }}>
        <label style={S.label}>Foto de Capa</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: "100%", aspectRatio: "16/9", background: "var(--theme-bg)", borderRadius: 0, border: "1px dashed var(--theme-border)", cursor: "pointer", overflow: "hidden", position: "relative" }}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span style={{ fontSize: 12, color: "var(--theme-text-muted)" }}>Enviar Capa</span>
              <span style={{ fontSize: 10, color: "var(--theme-text-muted)", opacity: 0.5 }}>JPG, PNG, WebP · Máx. 10MB</span>
            </div>
          )}
          {coverStatus === "saving" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.8)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spin" style={{ width: 24, height: 24, border: "2px solid var(--brand-primary)", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          )}
          {coverStatus === "saved" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#85B9AC", fontSize: 13 }}>✓ Capa atualizada</span>
            </div>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleCoverChange} />
      </section>

      {/* Links de Entrega */}
      <section style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div>
          <label style={S.label}>📷 Adobe Portfolio (Galeria)</label>
          <input
            style={S.input}
            type="url"
            placeholder="https://fotosegundo.myportfolio.com/nome-casal"
            value={lrUrl}
            onChange={(e) => setLrUrl(e.target.value)}
          />
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 4 }}>Link da galeria do evento no Adobe Portfolio</p>
        </div>
        <div>
          <label style={S.label}>🎬 Google Drive (Vídeo / Brutos)</label>
          <input
            style={S.input}
            type="url"
            placeholder="https://drive.google.com/drive/folders/..."
            value={drUrl}
            onChange={(e) => setDrUrl(e.target.value)}
          />
          <p style={{ fontSize: 10, color: "var(--theme-text-muted)", marginTop: 4 }}>Link da pasta compartilhada no Google Drive</p>
        </div>

        <button
          onClick={saveLinks}
          disabled={linkStatus === "saving"}
          style={{
            width: "100%", padding: "18px", borderRadius: 0, border: "none", fontSize: 12, fontWeight: 800,
            cursor: linkStatus === "saving" ? "not-allowed" : "pointer", transition: "all .3s",
            background: linkStatus === "saved" ? "var(--brand-primary)" : linkStatus === "error" ? "#7f1d1d" : "var(--brand-primary)",
            color: "var(--theme-text-on-brand)",
            opacity: linkStatus === "saving" ? 0.7 : 1,
            textTransform: "uppercase", letterSpacing: 2
          }}
        >
          {linkStatus === "saving" ? "SINCRONIZANDO..." : linkStatus === "saved" ? "✓ SINCRONIZADO" : linkStatus === "error" ? "ERRO — REPETIR" : "SALVAR ALTERAÇÕES"}
        </button>
      </section>

      {/* Link público */}
      <div style={{ borderTop: "1px solid var(--theme-border)", marginTop: "1.5rem", paddingTop: "1rem" }}>
        <a
          href={`/e/${event.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 10, color: "var(--theme-text-muted)", textDecoration: "none", fontWeight: 800, textTransform: "uppercase", letterSpacing: 1 }}
        >
          <span>Ver página pública</span>
          <span style={{ color: "var(--brand-primary)" }}>↗</span>
        </a>
      </div>
    </div>
  );
}

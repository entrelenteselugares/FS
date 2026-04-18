import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { API } from "../lib/api";

interface EventItem {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio: string | null;
  coverPhotoUrl: string | null;
  lightroomUrl: string | null;
  driveUrl: string | null;
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

const S = {
  page: { fontFamily: "'Outfit', sans-serif", background: "#050505", color: "#e8e4dc", minHeight: "100vh" } as React.CSSProperties,
  input: { width: "100%", background: "#0d0d0d", border: "0.5px solid #2a2a2a", borderRadius: 6, padding: "12px 14px", fontSize: 13, color: "#e8e4dc", outline: "none", transition: "border-color .2s" } as React.CSSProperties,
  label: { fontSize: 11, color: "#888", display: "block", marginBottom: 6, letterSpacing: "1px", textTransform: "uppercase" as const } as React.CSSProperties,
  card: { background: "#0a0a0a", border: "0.5px solid #1a1a1a", borderRadius: 12, overflow: "hidden" as const } as React.CSSProperties,
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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Outfit:wght@300;400;500&display=swap');
        * { box-sizing: border-box; }
        input:focus { border-color: #c9a96e !important; }
        .hover-row:hover { background: #0f100a !important; }
        .spin { animation: spin 0.8s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {/* NAV */}
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "1.25rem 2.5rem", borderBottom: "1px solid #141414", background: "rgba(5,5,5,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: "#666", fontSize: 13, cursor: "pointer" }}>
            ← Vitrine
          </button>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, background: "#c9a96e", borderRadius: "2px", transform: "rotate(45deg)" }} />
            Foto Segundo
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 13, color: "#fff", fontWeight: 500 }}>{user?.nome}</div>
            <div style={{ fontSize: 10, color: "#c9a96e", letterSpacing: 1, textTransform: "uppercase" }}>{user?.role}</div>
          </div>
          <button onClick={logout} style={{ background: "none", border: "1px solid #222", borderRadius: 6, padding: "8px 16px", color: "#888", fontSize: 12, cursor: "pointer" }}>
            Sair
          </button>
        </div>
      </nav>

      <div style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "3rem 2.5rem",
        display: "grid",
        gridTemplateColumns: selected ? "1fr 440px" : "1fr",
        gap: "2.5rem",
      }}>
        {/* LISTA DE EVENTOS */}
        <div>
          <header style={{ marginBottom: "2rem" }}>
            <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, fontWeight: 700, color: "#fff", marginBottom: 8 }}>
              Meus eventos
            </h1>
            <p style={{ fontSize: 14, color: "#666" }}>
              {events.length} evento{events.length !== 1 ? "s" : ""} gerenciado{events.length !== 1 ? "s" : ""} por você
            </p>
          </header>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ background: "#0a0a0a", height: 100, borderRadius: 12, opacity: 0.5 }} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "6rem 0", background: "#0a0a0a", borderRadius: 16, border: "1px dashed #222" }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#c9a96e", marginBottom: 12 }}>Nenhum evento no seu radar</p>
              <p style={{ fontSize: 14, color: "#666", maxWidth: 300, margin: "0 auto" }}>Assim que você for alocado em um novo evento, ele aparecerá aqui automaticamente.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {events.map((event) => (
                <div
                  key={event.id}
                  className="hover-row"
                  onClick={() => setSelected(selected?.id === event.id ? null : event)}
                  style={{
                    ...S.card,
                    background: selected?.id === event.id ? "#0f100a" : "#0a0a0a",
                    borderColor: selected?.id === event.id ? "#c9a96e44" : "#1a1a1a",
                    padding: "1.25rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "1.5rem",
                    transition: "all .2s",
                  }}
                >
                  {/* Thumbnail */}
                  <div style={{ width: 80, height: 80, background: "#050505", borderRadius: 8, flexShrink: 0, overflow: "hidden", border: "1px solid #222" }}>
                    {event.coverPhotoUrl ? (
                      <img src={event.coverPhotoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#333" }}>
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
                    <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{event.nomeNoivos}</div>
                    <div style={{ fontSize: 13, color: "#666", marginBottom: 8 }}>
                      {formatDate(event.dataEvento)} · {event.cartorio || "Sem cartório"}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <StatusPill ok={!!event.coverPhotoUrl} label="Capa" />
                      <StatusPill ok={!!(event.lightroomUrl || event.driveUrl)} label="Links" />
                    </div>
                  </div>

                  {/* Pedidos */}
                  <div style={{ textAlign: "right", paddingLeft: 20, borderLeft: "1px solid #1a1a1a", flexShrink: 0 }}>
                    <div style={{ fontSize: 24, fontWeight: 700, color: event._count.pedidos > 0 ? "#c9a96e" : "#333", fontFamily: "'Playfair Display', serif" }}>
                      {event._count.pedidos}
                    </div>
                    <div style={{ fontSize: 10, color: "#444", textTransform: "uppercase", letterSpacing: 1 }}>pedidos</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* PAINEL DE EDIÇÃO */}
        {selected && (
          <EventEditPanel
            event={selected}
            onUpdated={handleUpdated}
            onClose={() => setSelected(null)}
          />
        )}
      </div>
    </div>
  );
}

function StatusPill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span style={{
      fontSize: 9, padding: "3px 10px", borderRadius: 4, letterSpacing: "1px",
      textTransform: "uppercase" as const,
      background: ok ? "#102010" : "#111",
      border: `1px solid ${ok ? "#1b3a1b" : "#222"}`,
      color: ok ? "#4ade80" : "#444",
      fontWeight: 500
    }}>
      {ok ? "✓" : "·"} {label}
    </span>
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
  const prevEventId = useRef(event.id);

  // Resetar estado SOMENTE quando o evento muda (evita cascata de setState)
  if (prevEventId.current !== event.id) {
    prevEventId.current = event.id;
    setLrUrl(event.lightroomUrl ?? "");
    setDrUrl(event.driveUrl ?? "");
    setCoverPreview(event.coverPhotoUrl);
    setLinkStatus("idle");
    setCoverStatus("idle");
  }

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
          <p style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: "#c9a96e", marginBottom: 4 }}>Editando</p>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, color: "#fff", margin: 0 }}>{event.nomeNoivos}</h2>
          <p style={{ fontSize: 12, color: "#666", marginTop: 4 }}>{formatDate(event.dataEvento)}</p>
        </div>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#444", fontSize: 28, cursor: "pointer", lineHeight: 1 }}>×</button>
      </div>

      {/* Upload de Capa */}
      <section style={{ marginBottom: "2.5rem" }}>
        <label style={S.label}>Foto de Capa</label>
        <div
          onClick={() => fileRef.current?.click()}
          style={{ width: "100%", aspectRatio: "16/9", background: "#050505", borderRadius: 8, border: "1px dashed #2a2a2a", cursor: "pointer", overflow: "hidden", position: "relative" }}
        >
          {coverPreview ? (
            <img src={coverPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
              </svg>
              <span style={{ fontSize: 12, color: "#444" }}>Upload de Capa</span>
              <span style={{ fontSize: 10, color: "#333" }}>JPG, PNG, WebP · Máx. 10MB</span>
            </div>
          )}
          {coverStatus === "saving" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="spin" style={{ width: 24, height: 24, border: "2px solid #c9a96e", borderTopColor: "transparent", borderRadius: "50%" }} />
            </div>
          )}
          {coverStatus === "saved" && (
            <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#4ade80", fontSize: 13 }}>✓ Capa atualizada</span>
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
          <p style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Link da galeria do evento no Adobe Portfolio</p>
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
          <p style={{ fontSize: 10, color: "#444", marginTop: 4 }}>Link da pasta compartilhada no Google Drive</p>
        </div>

        <button
          onClick={saveLinks}
          disabled={linkStatus === "saving"}
          style={{
            width: "100%", padding: "14px", borderRadius: 8, border: "none", fontSize: 14, fontWeight: 600,
            cursor: linkStatus === "saving" ? "not-allowed" : "pointer", transition: "all .3s",
            background: linkStatus === "saved" ? "#4ade80" : linkStatus === "error" ? "#7f1d1d" : "#c9a96e",
            color: linkStatus === "error" ? "#fca5a5" : "#000",
            opacity: linkStatus === "saving" ? 0.7 : 1,
          }}
        >
          {linkStatus === "saving" ? "Salvando..." : linkStatus === "saved" ? "✓ Salvo com sucesso" : linkStatus === "error" ? "Erro — tentar novamente" : "Salvar Alterações"}
        </button>
      </section>

      {/* Link público */}
      <div style={{ borderTop: "1px solid #1a1a1a", marginTop: "1.5rem", paddingTop: "1rem" }}>
        <a
          href={`/eventos/${event.id}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: 12, color: "#555", textDecoration: "none" }}
        >
          <span>Ver página pública do evento</span>
          <span style={{ color: "#c9a96e" }}>↗</span>
        </a>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth, API } from "../contexts/AuthContext";
import { DashboardLayout } from "../components/DashboardLayout";
import type { NavItem } from "../components/DashboardLayout";

// ── Icons ──────────────────────────────────────────────────────────────
const IconEventos = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);
const IconMP = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
    <line x1="1" y1="10" x2="23" y2="10" />
  </svg>
);

// ── Types ──────────────────────────────────────────────────────────────
interface Partner {
  id: string;
  nome: string;
  role: string;
  mpUserId?: string | null;
}

interface FSEvent {
  id: string;
  nomeNoivos: string;
  dataEvento: string;
  cartorio?: string;
  lightroomUrl?: string | null;
  driveUrl?: string | null;
  coverPhotoUrl?: string | null;
  fotografo?: Partner | null;
  editor?: Partner | null;
  cartorioUser?: Partner | null;
}

// ── Component ──────────────────────────────────────────────────────────
export const ProfessionalDashboard: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // ── State ──────────────────────────────────────────────────────────
  const [events, setEvents] = useState<FSEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // Editing existing event
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLightroom, setEditLightroom] = useState("");
  const [editDrive, setEditDrive] = useState("");
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreview, setEditPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Partners (for Admin only)
  const [photographers, setPhotographers] = useState<Partner[]>([]);
  const [editors, setEditors] = useState<Partner[]>([]);
  const [cartorios, setCartorios] = useState<Partner[]>([]);

  // New event form state
  const [nomeNoivos, setNomeNoivos] = useState("");
  const [dataEvento, setDataEvento] = useState("");
  const [cartorio, setCartorio] = useState("");
  const [lightroomUrl, setLightroomUrl] = useState("");
  const [driveUrl, setDriveUrl] = useState("");
  const [fotografoId, setFotografoId] = useState("");
  const [editorId, setEditorId] = useState("");
  const [cartorioUserId, setCartorioUserId] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);

  // ── Effects ────────────────────────────────────────────────────────
  useEffect(() => {
    if (searchParams.get("mp_connected")) {
      setSuccess("Mercado Pago conectado com sucesso! ✅");
    }
  }, [searchParams]);

  useEffect(() => {
    setLoadingEvents(true);
    API.get("/admin/events")
      .then((r: { data: FSEvent[] }) => setEvents(r.data))
      .catch(console.error)
      .finally(() => setLoadingEvents(false));

    if (user?.role === "ADMIN") {
      API.get("/admin/users?role=FOTOGRAFO").then((r: { data: Partner[] }) => setPhotographers(r.data)).catch(console.error);
      API.get("/admin/users?role=EDITOR").then((r: { data: Partner[] }) => setEditors(r.data)).catch(console.error);
      API.get("/admin/users?role=CARTORIO").then((r: { data: Partner[] }) => setCartorios(r.data)).catch(console.error);
    }
  }, [success, user?.role]);

  // ── Filter events by role ──────────────────────────────────────────
  const myEvents = user?.role === "PROFISSIONAL"
    ? events.filter((ev) => ev.fotografo?.id === user.id || ev.editor?.id === user.id)
    : events;

  // ── Handlers ──────────────────────────────────────────────────────
  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("nomeNoivos", nomeNoivos);
      fd.append("dataEvento", dataEvento);
      fd.append("cartorio", cartorio);
      fd.append("lightroomUrl", lightroomUrl);
      fd.append("driveUrl", driveUrl);
      if (fotografoId) fd.append("fotografoId", fotografoId);
      if (editorId) fd.append("editorId", editorId);
      if (cartorioUserId) fd.append("cartorioUserId", cartorioUserId);
      if (coverFile) fd.append("coverPhoto", coverFile);

      await API.post("/admin/events", fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess(`Evento "${nomeNoivos}" criado com sucesso!`);
      setShowForm(false);
      setNomeNoivos(""); setDataEvento(""); setCartorio("");
      setLightroomUrl(""); setDriveUrl(""); setCoverFile(null); setCoverPreview(null);
      setFotografoId(""); setEditorId(""); setCartorioUserId("");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Erro ao criar evento");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (ev: FSEvent) => {
    setEditingId(ev.id);
    setEditLightroom(ev.lightroomUrl ?? "");
    setEditDrive(ev.driveUrl ?? "");
    setEditFile(null);
    setEditPreview(ev.coverPhotoUrl ?? null);
  };

  const handleEditCover = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setEditFile(file);
    setEditPreview(URL.createObjectURL(file));
  };

  const handleSaveEdit = async (evId: string) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("lightroomUrl", editLightroom);
      fd.append("driveUrl", editDrive);
      if (editFile) fd.append("coverPhoto", editFile);

      await API.patch(`/admin/events/${evId}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      setSuccess("Evento atualizado com sucesso!");
      setEditingId(null);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr.response?.data?.error || "Erro ao atualizar evento");
    } finally {
      setSaving(false);
    }
  };

  // ── Nav ────────────────────────────────────────────────────────────
  const navItems: NavItem[] = [
    { label: "Eventos", to: "/profissional", exact: true, icon: <IconEventos /> },
    ...(user?.role !== "CLIENTE" ? [{ label: "Mercado Pago", to: "/profissional", icon: <IconMP /> }] : []),
  ];

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <DashboardLayout
      title={user?.role === "ADMIN" ? "Gestão de Eventos" : "Meu Painel"}
      navItems={navItems}
      variant="indigo"
    >
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        {/* Page header */}
        <div className="mb-8">
          <div className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-indigo mb-2">
            {user?.role === "ADMIN" ? "Administração" : "Área do Profissional"}
          </div>
          <h1 id="professional-dashboard-title" className="text-3xl font-black italic uppercase tracking-tighter">
            {user?.role === "ADMIN" ? "Gestão de Eventos" : "Meus Trabalhos"}
          </h1>
          <p className="text-zinc-500 text-sm mt-1.5">
            {user?.role === "ADMIN"
              ? "Crie e gerencie eventos, atribua fotógrafo, editor e cartório."
              : "Eventos em que você está alocado como fotógrafo ou editor."}
          </p>
        </div>

        {/* ── Mercado Pago Connection Banner ── */}
        {user?.role !== "CLIENTE" && user?.role !== "ADMIN" && (
          <div
            id="mp-connection-card"
            className={`glass rounded-2xl p-5 mb-8 flex items-center justify-between gap-4 border-l-4 ${
              user?.mpUserId ? "border-brand-emerald" : "border-red-500/60"
            }`}
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-black italic uppercase tracking-tight">Mercado Pago</span>
                <span className={`flex items-center gap-1.5 text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest border ${
                  user?.mpUserId
                    ? "bg-brand-emerald/10 text-brand-emerald border-brand-emerald/20 animate-fade-in"
                    : "bg-red-500/10 text-red-500 border-red-500/20"
                }`}>
                  {user?.mpUserId && (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  )}
                  {user?.mpUserId ? "Conta Verificada" : "Conexão Pendente"}
                </span>
              </div>
              <p className="text-xs text-zinc-400 max-w-md">
                {user?.mpUserId
                  ? "Conta vinculada. Você receberá pagamentos via split automaticamente."
                  : "Conecte sua conta para receber pagamentos automáticos dos eventos em que você participa."}
              </p>
            </div>
            {!user?.mpUserId && (
              <button
                id="btn-mp-connect"
                onClick={() => {
                  const base = import.meta.env.VITE_API_URL || "";
                  window.location.href = `${base}/api/mercadopago/connect`;
                }}
                className="flex-shrink-0 bg-white text-zinc-900 hover:bg-zinc-100 font-bold text-[10px] uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all whitespace-nowrap"
              >
                Conectar Conta
              </button>
            )}
          </div>
        )}

        {/* ── Success banner ── */}
        {success && (
          <div className="mb-6 p-4 bg-brand-emerald/10 border border-brand-emerald/20 rounded-2xl text-brand-emerald text-sm font-medium animate-fade-in flex items-center gap-2">
            <span>✅</span> {success}
            <button onClick={() => setSuccess("")} className="ml-auto text-brand-emerald/60 hover:text-brand-emerald">✕</button>
          </div>
        )}

        {/* ── New Event button (Admin only) ── */}
        {user?.role === "ADMIN" && (
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black italic uppercase tracking-tighter">
                {myEvents.length} Evento{myEvents.length !== 1 ? "s" : ""} Cadastrado{myEvents.length !== 1 ? "s" : ""}
              </h2>
            </div>
            <button
              id="btn-novo-evento"
              onClick={() => setShowForm(!showForm)}
              className={`font-black uppercase tracking-widest text-xs px-6 py-3 rounded-xl transition-all ${
                showForm
                  ? "bg-white/10 text-zinc-300 border border-white/10"
                  : "bg-brand-indigo hover:bg-brand-indigo/80 text-white"
              }`}
            >
              {showForm ? "✕ Cancelar" : "+ Novo Evento"}
            </button>
          </div>
        )}

        {/* ── New Event Form ── */}
        {showForm && user?.role === "ADMIN" && (
          <form
            id="form-novo-evento"
            onSubmit={handleSubmit}
            className="glass rounded-3xl p-8 mb-10 animate-slide-up"
          >
            <h3 className="text-lg font-black italic uppercase tracking-tighter mb-6">
              Cadastrar Novo Evento
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome dos Noivos */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Nome dos Noivos *
                </label>
                <input
                  id="input-noivos"
                  required
                  value={nomeNoivos}
                  onChange={(e) => setNomeNoivos(e.target.value)}
                  placeholder="Ana & João Silva"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Data do Evento *
                </label>
                <input
                  id="input-data"
                  required
                  type="date"
                  value={dataEvento}
                  onChange={(e) => setDataEvento(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Cartório
                </label>
                <input
                  id="input-cartorio"
                  value={cartorio}
                  onChange={(e) => setCartorio(e.target.value)}
                  placeholder="Cartório Central BH"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                />
              </div>

              {/* Cover Photo Upload */}
              <div className="md:col-span-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Foto de Capa
                </label>
                <div className="border-2 border-dashed border-white/10 hover:border-brand-indigo/40 rounded-2xl transition-colors overflow-hidden">
                  <label htmlFor="cover-upload" className="flex items-center gap-4 p-5 cursor-pointer">
                    {coverPreview ? (
                      <img src={coverPreview} alt="Preview" className="w-20 h-20 object-cover rounded-xl" />
                    ) : (
                      <div className="w-20 h-20 bg-white/5 rounded-xl flex items-center justify-center text-zinc-600">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-semibold text-white">
                        {coverFile ? coverFile.name : "Clique para selecionar"}
                      </div>
                      <div className="text-xs text-zinc-500 mt-1">JPG, PNG ou WebP — máx. 10MB</div>
                    </div>
                  </label>
                  <input id="cover-upload" type="file" accept="image/*" className="hidden" onChange={handleCoverChange} />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  URL Lightroom
                </label>
                <input
                  id="input-lightroom"
                  value={lightroomUrl}
                  onChange={(e) => setLightroomUrl(e.target.value)}
                  placeholder="https://lightroom.adobe.com/gallery/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  URL Google Drive
                </label>
                <input
                  id="input-drive"
                  value={driveUrl}
                  onChange={(e) => setDriveUrl(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                />
              </div>

              {/* Partner Assignment */}
              <div className="md:col-span-2 border-t border-white/5 pt-6 mt-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-indigo mb-4">
                  Atribuição de Parceiros (Split de Pagamento)
                </h4>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Fotógrafo
                </label>
                <select
                  value={fotografoId}
                  onChange={(e) => setFotografoId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
                >
                  <option value="">Não atribuído</option>
                  {photographers.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900">
                      {p.nome} {p.mpUserId ? "✅" : "❌"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Editor
                </label>
                <select
                  value={editorId}
                  onChange={(e) => setEditorId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
                >
                  <option value="">Não atribuído</option>
                  {editors.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900">
                      {p.nome} {p.mpUserId ? "✅" : "❌"}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2">
                  Cartório / Terceiro
                </label>
                <select
                  value={cartorioUserId}
                  onChange={(e) => setCartorioUserId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand-indigo/60 transition-colors"
                >
                  <option value="">Não atribuído</option>
                  {cartorios.map((p) => (
                    <option key={p.id} value={p.id} className="bg-zinc-900">
                      {p.nome} {p.mpUserId ? "✅" : "❌"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="bg-brand-indigo hover:bg-brand-indigo/80 text-white font-black uppercase tracking-widest text-xs px-8 py-4 rounded-xl transition-all disabled:opacity-50"
              >
                {submitting ? "Salvando..." : "Criar Evento"}
              </button>
            </div>
          </form>
        )}

        {/* ── Events List ── */}
        {loadingEvents ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-indigo border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {myEvents.length === 0 && (
              <div className="text-center py-16 text-zinc-600 text-sm">
                {user?.role === "PROFISSIONAL"
                  ? "Nenhum evento atribuído a você ainda."
                  : "Nenhum evento cadastrado ainda."}
              </div>
            )}

            {myEvents.map((ev) => {
              const isEditing = editingId === ev.id;
              return (
                <div key={ev.id} className="glass rounded-2xl overflow-hidden">
                  {/* Event row */}
                  <div className="p-5 flex items-center gap-5">
                    {/* Cover thumbnail */}
                    <div className="flex-shrink-0">
                      {ev.coverPhotoUrl ? (
                        <img
                          src={ev.coverPhotoUrl}
                          alt="Capa"
                          className="w-14 h-14 object-cover rounded-xl"
                        />
                      ) : (
                        <div className="w-14 h-14 bg-white/5 rounded-xl flex items-center justify-center text-zinc-600">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="m21 15-5-5L5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-black italic tracking-tight text-white truncate">{ev.nomeNoivos}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {new Date(ev.dataEvento).toLocaleDateString("pt-BR")}
                        {ev.cartorio && <span className="ml-2 text-zinc-700">· {ev.cartorio}</span>}
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {ev.fotografo?.nome && (
                          <span className="text-[9px] text-zinc-600">📷 {ev.fotografo.nome}</span>
                        )}
                        {ev.editor?.nome && (
                          <span className="text-[9px] text-zinc-600 ml-2">🎞️ {ev.editor.nome}</span>
                        )}
                      </div>
                    </div>

                    {/* Delivery badges + edit */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {ev.lightroomUrl && (
                        <a
                          href={ev.lightroomUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-brand-indigo/10 border border-brand-indigo/20 rounded-full text-brand-indigo text-[9px] font-bold uppercase tracking-widest hover:bg-brand-indigo/20 transition-colors"
                        >
                          LR
                        </a>
                      )}
                      {ev.driveUrl && (
                        <a
                          href={ev.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-brand-emerald/10 border border-brand-emerald/20 rounded-full text-brand-emerald text-[9px] font-bold uppercase tracking-widest hover:bg-brand-emerald/20 transition-colors"
                        >
                          Drive
                        </a>
                      )}
                      <button
                        id={`btn-manage-${ev.id}`}
                        onClick={() => isEditing ? setEditingId(null) : openEdit(ev)}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                          isEditing
                            ? "bg-white/10 text-zinc-300"
                            : "bg-brand-indigo/10 border border-brand-indigo/20 text-brand-indigo hover:bg-brand-indigo/20"
                        }`}
                      >
                        {isEditing ? "Fechar" : "Gerenciar"}
                      </button>
                    </div>
                  </div>

                  {/* ── Inline Edit Panel ── */}
                  {isEditing && (
                    <div className="border-t border-white/5 p-6 bg-white/[0.01] animate-slide-up">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-indigo mb-5">
                        Atualizar Entrega — {ev.nomeNoivos}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cover photo */}
                        <div>
                          <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                            Foto de Capa
                          </label>
                          <label
                            htmlFor={`edit-cover-${ev.id}`}
                            className="flex flex-col items-center gap-2 p-4 border-2 border-dashed border-white/10 hover:border-brand-indigo/40 rounded-xl cursor-pointer transition-colors"
                          >
                            {editPreview ? (
                              <img src={editPreview} alt="Preview" className="w-full h-24 object-cover rounded-lg" />
                            ) : (
                              <div className="w-full h-24 bg-white/5 rounded-lg flex items-center justify-center text-zinc-600">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                  <polyline points="17 8 12 3 7 8" />
                                  <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                              </div>
                            )}
                            <span className="text-[10px] text-zinc-600">
                              {editFile ? editFile.name : "Clique para alterar"}
                            </span>
                          </label>
                          <input
                            id={`edit-cover-${ev.id}`}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleEditCover}
                          />
                        </div>

                        {/* URLs */}
                        <div className="md:col-span-2 space-y-4">
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                              URL Adobe Lightroom
                            </label>
                            <input
                              id={`edit-lightroom-${ev.id}`}
                              value={editLightroom}
                              onChange={(e) => setEditLightroom(e.target.value)}
                              placeholder="https://lightroom.adobe.com/gallery/..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2">
                              URL Google Drive
                            </label>
                            <input
                              id={`edit-drive-${ev.id}`}
                              value={editDrive}
                              onChange={(e) => setEditDrive(e.target.value)}
                              placeholder="https://drive.google.com/drive/folders/..."
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white placeholder-zinc-700 focus:outline-none focus:border-brand-indigo/60 transition-colors"
                            />
                          </div>
                          <div className="flex justify-end pt-2">
                            <button
                              id={`btn-save-edit-${ev.id}`}
                              onClick={() => handleSaveEdit(ev.id)}
                              disabled={saving}
                              className="bg-brand-indigo hover:bg-brand-indigo/80 text-white font-black uppercase tracking-widest text-[10px] px-6 py-2.5 rounded-xl transition-all disabled:opacity-50"
                            >
                              {saving ? "Salvando..." : "Salvar Entrega"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

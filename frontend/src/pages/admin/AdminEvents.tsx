import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X } from "lucide-react";

interface User {
  id: string;
  nome: string;
  role: string;
}

interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  location: string;
  city?: string | null;
  description?: string | null;
  active: boolean;
  coverPhotoUrl?: string | null;
  lightroomUrl?: string | null;
  driveUrl?: string | null;
  priceBase?: number;
  priceEarly?: number;
  cartorioUser?: { nome: string; cartorio?: { razaoSocial: string } } | null;
  captacao?: { nome: string } | null;
  edicao?: { nome: string } | null;
  isPrivate: boolean;
  _count: { pedidos: number };
}

interface AdminEventsProps {
  initialEditEventId?: string | null;
}

export const AdminEvents: React.FC<AdminEventsProps> = ({ initialEditEventId }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<Event | null>(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  
  // Venda Direta State
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [saleEvent, setSaleEvent] = useState<Event | null>(null);
  const [saleFormData, setSaleFormData] = useState({
    customerName: "",
    customerEmail: "",
    amount: 0
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  interface EventFormData {
    title: string;
    slug: string;
    date: string;
    location: string;
    city: string;
    description: string;
    priceBase: number;
    priceEarly: number;
    cartorioId: string;
    captacaoId: string;
    edicaoId: string;
    temFoto: boolean;
    temVideo: boolean;
    temReels: boolean;
    temFotoImpressa: boolean;
    coverPhotoUrl: string;
    eventHours: number;
    isCrowdfund: boolean;
    targetAmount: number;
    lightroomUrl: string;
    driveUrl: string;
    previewPhotos: [string, string, string];
    isPrivate: boolean;
    isUnitSale: boolean;
    priceUnit: number;
  }

  // Form State
  const [formData, setFormData] = useState<EventFormData>({
    title: "", slug: "", date: "", location: "", city: "", description: "",
    priceBase: 200, priceEarly: 190,
    cartorioId: "", captacaoId: "", edicaoId: "",
    temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
    coverPhotoUrl: "",
    eventHours: 2,
    isCrowdfund: false,
    targetAmount: 0,
    lightroomUrl: "",
    driveUrl: "",
    previewPhotos: ["", "", ""],
    isPrivate: false,
    isUnitSale: false,
    priceUnit: 10,
  });

  const [activeTab, setActiveTab] = useState<'info' | 'equipe' | 'comercial' | 'entrega'>('info');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      let event;
      if (editingEvent) {
        const { data } = await API.patch(`/admin/events/${editingEvent.id}`, formData);
        event = data;
      } else {
        const { data } = await API.post("/admin/events", formData);
        event = data;
      }
      
      if (coverPreview && coverPreview.startsWith("data:image")) {
        await API.patch(`/admin/events/${event.id}/cover`, {
          imageBase64: coverPreview,
          mimeType: "image/jpeg" 
        });
      }

      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
      setIsModalOpen(false);
      setEditingEvent(null);
      setFormData({
        title: "", slug: "", date: "", location: "", city: "", description: "",
        priceBase: 200, priceEarly: 190,
        cartorioId: "", captacaoId: "", edicaoId: "",
        temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
        coverPhotoUrl: "", eventHours: 2,
        isCrowdfund: false,
        targetAmount: 0,
        lightroomUrl: "",
        driveUrl: "",
        previewPhotos: ["", "", ""],
        isPrivate: false,
        isUnitSale: false,
        priceUnit: 10,
      });
      setCoverPreview(null);
    } catch {
      showNotification("Erro ao processar evento.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditOpen = async (event: Event) => {
    try {
      const { data } = await API.get(`/admin/events/${event.id}`);
      setEditingEvent(data);
      setFormData({
        title: data.nomeNoivos,
        slug: data.slug || "",
        date: data.dataEvento.split("T")[0],
        location: data.location || "",
        city: data.city || "",
        description: data.description || "",
        priceBase: Number(data.priceBase),
        priceEarly: Number(data.priceEarly),
        cartorioId: data.cartorioUserId || "",
        captacaoId: data.captacaoId || "",
        edicaoId: data.edicaoId || "",
        temFoto: data.temFoto,
        temVideo: data.temVideo,
        temReels: data.temReels,
        temFotoImpressa: data.temFotoImpressa,
        coverPhotoUrl: data.coverPhotoUrl || "",
        eventHours: data.eventHours || 2,
        isCrowdfund: data.isCrowdfund || false,
        targetAmount: Number(data.targetAmount || 0),
        lightroomUrl: data.lightroomUrl || "",
        driveUrl: data.driveUrl || "",
        previewPhotos: (() => {
          try { const p = data.previewPhotos ? JSON.parse(data.previewPhotos) : []; return [p[0]||"", p[1]||"", p[2]||""] as [string,string,string]; } catch { return ["","",""] as [string,string,string]; }
        })(),
        isPrivate: data.isPrivate || false,
        isUnitSale: data.isUnitSale || false,
        priceUnit: Number(data.priceUnit || 10)
      });
      setCoverPreview(data.coverPhotoUrl);
      setActiveTab('info');
      setIsModalOpen(true);
    } catch {
      showNotification("Erro ao carregar detalhes do evento.", 'error');
    }
  };

  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleEvent) return;
    setIsUploading(true);
    try {
      await API.post("/admin/orders/manual", {
        eventId: saleEvent.id,
        ...saleFormData
      });
      showNotification("Venda registrada com sucesso!");
      setIsSaleModalOpen(false);
      // Refresh events to show updated sales count
      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showNotification(error.response?.data?.error || "Erro ao registrar venda.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [evRes, userRes] = await Promise.all([
          API.get("/admin/events"),
          API.get("/admin/users")
        ]);
        setEvents(evRes.data.events || []);
        setUsers(userRes.data || []);
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Efeito separado para abrir o evento inicial quando os eventos carregarem
  useEffect(() => {
    if (initialEditEventId && events.length > 0) {
      const found = events.find(e => e.id === initialEditEventId);
      if (found) handleEditOpen(found);
    }
  }, [initialEditEventId, events, handleEditOpen]);

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-8 gap-6">
        <div>
          <h2 className="text-2xl md:text-4xl font-heading text-theme-text tracking-tighter uppercase leading-none pt-2">Operação de Eventos</h2>
          <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-bold italic">Logística de Captação e Unidades Fixas</p>
        </div>
        <button 
          onClick={() => {
            setEditingEvent(null);
            setFormData({
              title: "", slug: "", date: "", location: "", city: "", description: "",
              priceBase: 200, priceEarly: 190,
              cartorioId: "", captacaoId: "", edicaoId: "",
              temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
              coverPhotoUrl: "", eventHours: 2,
              isCrowdfund: false,
              targetAmount: 0,
              lightroomUrl: "",
              driveUrl: "",
              previewPhotos: ["", "", ""],
              isPrivate: false,
              isUnitSale: false,
              priceUnit: 10,
            });
            setCoverPreview(null);
            setIsModalOpen(true);
          }}
          className="font-black uppercase tracking-[0.4em] px-8 py-4 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[9px] w-full md:w-auto"
          style={{ backgroundColor: 'var(--brand-tactical)', color: 'var(--theme-text-on-brand)' }}
        >
          NOVO EVENTO
        </button>
      </div>

      <style>{`
        .events-table { width: 100%; border-collapse: collapse; text-align: left; }
        .events-table thead { border-bottom: 1px solid ${T.border}; }
        .events-table th { padding: 10px 16px; fontSize: 9px; fontFamily: ${T.fontB}; fontWeight: 900; textTransform: uppercase; letterSpacing: 2px; color: ${T.text3}; }
        
        .event-card-mobile { display: none; }
        
        @media (max-width: 1024px) {
          .events-table { display: none; }
          .event-card-mobile { 
            display: flex; flex-direction: column; gap: 10px; padding: 12px; 
            background: ${T.bgCard}; border: 1px solid ${T.border}; margin-bottom: 8px;
          }
          .event-card-header { display: flex; justify-content: space-between; align-items: flex-start; }
          .event-card-stats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; border-top: 1px solid ${T.border}30; padding-top: 8px; }
          .event-card-actions { display: flex; gap: 6px; margin-top: 2px; }
        }
      `}</style>

      <div className="events-container">
        <table className="events-table">
          <thead>
            <tr>
              {["Evento", "Data", "Produção", "Vendas", "Membros", "Ações"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ padding: 60, textAlign: "center", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 3 }}>Indexando Eventos...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} style={{ padding: 60, textAlign: "center", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 3 }}>Nenhum registro encontrado.</td></tr>
            ) : events.map((event, idx) => (
              <tr 
                key={event.id} 
                style={{ 
                  background: idx % 2 === 0 ? T.bgField : "transparent",
                  borderBottom: `1px solid ${T.border}44`,
                  transition: "background 0.2s"
                }}
              >
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.3 }}>{event.title}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 2, textTransform: "uppercase", fontWeight: 700 }}>{event.location}</div>
                </td>
                <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: T.text2 }}>{new Date(event.date).toLocaleDateString("pt-BR")}</td>
                <td style={{ padding: "12px 16px" }}>
                   <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div title="Capa" style={{ width: 8, height: 8, borderRadius: "50%", background: event.coverPhotoUrl ? T.brand : T.border, border: `1px solid ${event.coverPhotoUrl ? T.brand : T.text3}` }} />
                      <div title="Links" style={{ width: 8, height: 8, borderRadius: "50%", background: (event.lightroomUrl || event.driveUrl) ? T.brand : T.border, border: `1px solid ${(event.lightroomUrl || event.driveUrl) ? T.brand : T.text3}` }} />
                   </div>
                </td>
                <td style={{ padding: "12px 16px" }}><div style={{ fontSize: 12, fontWeight: 900, color: event._count?.pedidos > 0 ? T.brand : T.text3 }}>{event._count?.pedidos || 0}</div></td>
                <td style={{ padding: "12px 16px" }}>
                   <div style={{ fontSize: 9, color: T.text, fontWeight: 900, textTransform: "uppercase" }}>{event.captacao?.nome || "—"}</div>
                   <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase" }}>{event.edicao?.nome || "—"}</div>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button onClick={() => { setQrModalEvent(event); setCopied(false); }} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text3, cursor: "pointer", padding: 6 }}><QrCode size={12} /></button>
                    <button onClick={() => { setSaleEvent(event); setSaleFormData({ customerName: "", customerEmail: "", amount: Number(event.priceBase || 0) }); setIsSaleModalOpen(true); }} style={{ background: T.brand, border: "none", color: "black", fontSize: 8, fontWeight: 900, textTransform: "uppercase", padding: "6px 12px" }}>VENDA</button>
                    <button onClick={() => handleEditOpen(event)} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text2, fontSize: 8, fontWeight: 900, textTransform: "uppercase", padding: "6px 10px" }}>Editar</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Mobile View */}
        <div className="mobile-only">
          {events.map(event => (
            <div key={event.id} className="event-card-mobile">
              <div className="event-card-header">
                <div>
                  <div style={{ fontSize: 14, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.5 }}>{event.title}</div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 4, textTransform: "uppercase" }}>{event.location} · {new Date(event.date).toLocaleDateString("pt-BR")}</div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: event.coverPhotoUrl ? T.brand : T.border }} />
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: (event.lightroomUrl || event.driveUrl) ? T.brand : T.border }} />
                </div>
              </div>
              
              <div className="event-card-stats">
                <div>
                  <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", fontWeight: 900, marginBottom: 2 }}>Membros</div>
                  <div style={{ fontSize: 10, color: T.text, fontWeight: 700 }}>{event.captacao?.nome || "REDE"} / {event.edicao?.nome || "REDE"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase", fontWeight: 900, marginBottom: 2 }}>Vendas</div>
                  <div style={{ fontSize: 14, color: T.brand, fontWeight: 900 }}>{event._count?.pedidos || 0}</div>
                </div>
              </div>

              <div className="event-card-actions">
                <button onClick={() => { setSaleEvent(event); setIsSaleModalOpen(true); }} style={{ flex: 2, background: T.brand, border: "none", color: "black", fontSize: 10, fontWeight: 900, textTransform: "uppercase", padding: "12px" }}>REGISTRAR VENDA</button>
                <button onClick={() => handleEditOpen(event)} style={{ flex: 1, background: "transparent", border: `1px solid ${T.border}`, color: T.text, fontSize: 10, fontWeight: 900, textTransform: "uppercase", padding: "12px" }}>EDITAR</button>
                <button onClick={() => { setQrModalEvent(event); setCopied(false); }} style={{ background: "transparent", border: `1px solid ${T.border}`, color: T.text3, padding: "12px" }}><QrCode size={16} /></button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-theme-bg/95 backdrop-blur-xl z-50 flex items-start justify-center p-4 overflow-y-auto pt-10">
          <div className="w-full max-w-4xl bg-theme-bg border border-theme-border p-8 relative animate-in zoom-in-95 duration-300 mb-10">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
             </button>

             <div className="mb-8">
               <h2 className="text-3xl font-heading text-theme-text tracking-tighter uppercase mb-2">
                 {editingEvent ? "Ajustar Operação" : "Novo Registro"}
               </h2>
               <div className="w-12 h-1 bg-brand-tactical" />
             </div>

              <div className="flex border-b border-theme-border mb-10 gap-8">
                {(['info', 'equipe', 'comercial', 'entrega'] as const).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setActiveTab(t)}
                    className={`pb-4 text-[10px] font-black uppercase tracking-[0.3em] transition-all relative ${activeTab === t ? 'text-brand-tactical' : 'text-theme-muted hover:text-white'}`}
                  >
                    {t === 'info' ? 'Essencial' : t === 'equipe' ? 'Operação' : t === 'comercial' ? 'Comercial' : 'Entrega'}
                    {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-tactical" />}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreate}>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12">
                    {activeTab === 'info' && (
                      <>
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Capa da Vitrine</label>
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="w-full aspect-video bg-theme-bg-muted border border-theme-border flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative rounded-none"
                            >
                              {coverPreview ? (
                                <img src={coverPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                              ) : (
                                <div className="text-center group-hover:text-brand-tactical transition-colors">
                                  <div className="text-2xl mb-2">📸</div>
                                  <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-bold">Enviar Capa</div>
                                </div>
                              )}
                              {isUploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px] text-white uppercase tracking-widest animate-pulse">Processando...</div>}
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Título do Evento</label>
                            <input 
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-zinc-300 focus:border-brand-tactical transition-colors outline-none font-bold"
                              value={formData.title}
                              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                              required
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Identificador URL (Slug)</label>
                            <input 
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-zinc-400 focus:border-brand-tactical transition-colors outline-none font-bold"
                              value={formData.slug}
                              onChange={(e) => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })}
                              placeholder="ex: taynan-e-felipe"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Data do Evento</label>
                              <input 
                                type="date" required
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Local</label>
                              <input 
                                type="text" required
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                                value={formData.location}
                                onChange={e => setFormData({...formData, location: e.target.value})}
                                placeholder="EX: CARTÓRIO X"
                              />
                            </div>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'equipe' && (
                      <>
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Unidade Fixa Responsável</label>
                            <select 
                              value={formData.cartorioId}
                              onChange={e => setFormData({...formData, cartorioId: e.target.value})}
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold appearance-none cursor-pointer"
                            >
                              <option value="">SELECIONE A UNIDADE FIXA</option>
                              {users.filter(u => u.role === "UNIDADE" || u.role === "CARTORIO").map(u => (
                                <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                              ))}
                            </select>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Cidade / UF</label>
                            <input 
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                              value={formData.city}
                              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                              placeholder="EX: SÃO PAULO - SP"
                            />
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Captação</label>
                              <select 
                                value={formData.captacaoId}
                                onChange={e => setFormData({...formData, captacaoId: e.target.value})}
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold appearance-none cursor-pointer"
                              >
                                <option value="">PROFISSIONAL DA REDE</option>
                                {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                                  <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Edição</label>
                              <select 
                                value={formData.edicaoId}
                                onChange={e => setFormData({...formData, edicaoId: e.target.value})}
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold appearance-none cursor-pointer"
                              >
                                <option value="">PROFISSIONAL DA REDE</option>
                                {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                                  <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Horas de Trabalho</label>
                            <input 
                              type="number"
                              required
                              value={formData.eventHours}
                              onChange={e => setFormData({...formData, eventHours: Number(e.target.value)})}
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold" 
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'comercial' && (
                      <>
                        <div className="space-y-8">
                          <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Preço Desbloqueio (R$)</label>
                              <input 
                                type="number"
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                                value={formData.priceBase}
                                onChange={(e) => setFormData({ ...formData, priceBase: Number(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Preço Antecipado (R$)</label>
                              <input 
                                type="number"
                                className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                                value={formData.priceEarly}
                                onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})}
                              />
                            </div>
                          </div>

                          <div className="space-y-4 pt-4">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Serviços Inclusos</label>
                            <div className="grid grid-cols-2 gap-4">
                              {(["temFoto", "temVideo", "temReels", "temFotoImpressa"] as const).map(serv => (
                                <label key={serv} className="flex items-center gap-3 cursor-pointer group">
                                  <input 
                                    type="checkbox"
                                    checked={formData[serv]}
                                    onChange={e => setFormData({...formData, [serv]: e.target.checked})}
                                    className="w-5 h-5 border-zinc-800 bg-transparent rounded-none checked:bg-brand-tactical focus:ring-0 appearance-none border transition-all"
                                  />
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold group-hover:text-white transition-all">
                                    {serv.replace("tem", "").replace(/([A-Z])/g, ' $1').trim()}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-4 pt-6 border-t border-theme-border">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Modelo Comercial Especial</label>
                            <div className="grid grid-cols-1 gap-6">
                              <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                  type="checkbox"
                                  checked={formData.isUnitSale}
                                  onChange={e => setFormData({...formData, isUnitSale: e.target.checked})}
                                  className="w-5 h-5 border-zinc-800 bg-transparent rounded-none checked:bg-brand-tactical focus:ring-0 appearance-none border transition-all"
                                />
                                <div>
                                  <span className="text-[10px] text-white uppercase tracking-[0.3em] font-bold block">Modo Venda por Unidade</span>
                                  <span className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1 block">Ideal para parques e eventos abertos</span>
                                </div>
                              </label>

                              {formData.isUnitSale && (
                                <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                  <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Preço por Foto (R$)</label>
                                  <input 
                                    type="number"
                                    className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold mt-2"
                                    value={formData.priceUnit}
                                    onChange={e => setFormData({...formData, priceUnit: Number(e.target.value)})}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-8">
                          <div className="bg-brand-tactical/5 p-6 border border-brand-tactical/20 space-y-6">
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <input 
                                type="checkbox"
                                checked={formData.isCrowdfund}
                                onChange={e => setFormData({...formData, isCrowdfund: e.target.checked})}
                                className="w-5 h-5 border-zinc-800 bg-transparent rounded-none checked:bg-brand-tactical focus:ring-0 appearance-none border transition-all"
                              />
                              <span className="text-[10px] text-brand-tactical uppercase tracking-[0.3em] font-bold">
                                MODO COMPRA COLETIVA (VAQUINHA)
                              </span>
                            </label>

                            {formData.isCrowdfund && (
                              <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                                <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">VALOR TOTAL DA META (R$)</label>
                                <input 
                                  type="number"
                                  className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                                  value={formData.targetAmount}
                                  onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})}
                                />
                              </div>
                            )}

                            <label className="flex items-center gap-3 cursor-pointer group pt-4 border-t border-brand-tactical/10">
                              <input 
                                type="checkbox"
                                checked={formData.isPrivate}
                                onChange={e => setFormData({...formData, isPrivate: e.target.checked})}
                                className="w-5 h-5 border-zinc-800 bg-transparent rounded-none checked:bg-brand-tactical focus:ring-0 appearance-none border transition-all"
                              />
                              <div className="flex flex-col">
                                <span className="text-[10px] text-zinc-300 uppercase tracking-[0.3em] font-bold">
                                  MODO OCULTO (PRIVACIDADE)
                                </span>
                                <span className="text-[8px] text-zinc-500 uppercase font-medium mt-1">
                                  O evento não aparecerá na vitrine pública da Home.
                                </span>
                              </div>
                            </label>
                          </div>
                        </div>
                      </>
                    )}

                    {activeTab === 'entrega' && (
                      <>
                        <div className="space-y-8">
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Link Google Drive</label>
                            <input 
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                              value={formData.driveUrl}
                              onChange={(e) => setFormData({ ...formData, driveUrl: e.target.value })}
                              placeholder="https://drive.google.com/..."
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Link Lightroom / Galeria</label>
                            <input 
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                              value={formData.lightroomUrl}
                              onChange={(e) => setFormData({ ...formData, lightroomUrl: e.target.value })}
                              placeholder="https://lightroom.adobe.com/..."
                            />
                          </div>
                        </div>

                        <div className="space-y-4">
                          <label className="text-[9px] font-bold text-brand-tactical uppercase tracking-[0.4em]">Fotos de Prévia (Até 3)</label>
                          {[0, 1, 2].map(idx => (
                            <input 
                              key={idx}
                              type="text"
                              className="w-full bg-theme-bg border border-theme-border p-3 text-[11px] text-theme-text focus:border-brand-tactical transition-colors outline-none"
                              value={formData.previewPhotos[idx]}
                              onChange={(e) => {
                                const newPreviews = [...formData.previewPhotos] as [string, string, string];
                                newPreviews[idx] = e.target.value;
                                setFormData({ ...formData, previewPhotos: newPreviews });
                              }}
                              placeholder={`URL da Foto ${idx + 1}`}
                            />
                          ))}
                        </div>
                      </>
                    )}
                 </div>

                 <div className="mt-12 pt-8 border-t border-theme-border flex justify-end gap-6">
                    {activeTab !== 'entrega' ? (
                      <button
                        type="button"
                        onClick={() => {
                          const tabs: Array<'info' | 'equipe' | 'comercial' | 'entrega'> = ['info', 'equipe', 'comercial', 'entrega'];
                          const nextIdx = tabs.indexOf(activeTab) + 1;
                          setActiveTab(tabs[nextIdx]);
                        }}
                        className="px-10 py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.3em] hover:bg-zinc-700 transition-all"
                      >
                        PRÓXIMO PASSO
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={isUploading}
                        className="px-12 py-4 bg-brand-tactical text-white text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all"
                      >
                        {isUploading ? "PROCESSANDO..." : (editingEvent ? "SALVAR ALTERAÇÕES" : "CADASTRAR EVENTO")}
                      </button>
                    )}
                 </div>
              </form>
          </div>
        </div>
      )}

      {/* MODAL VENDA DIRETA */}
      {isSaleModalOpen && saleEvent && (
        <div className="fixed inset-0 bg-theme-bg/95 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-theme-bg border border-theme-border p-10 relative animate-in zoom-in-95 duration-300">
             <button onClick={() => setIsSaleModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
             </button>

             <div className="mb-10">
               <h2 className="text-3xl font-heading text-theme-text tracking-tighter uppercase mb-2">Registrar Venda Direta</h2>
               <p className="text-[10px] text-brand-tactical uppercase tracking-[0.4em] font-bold">Evento: {saleEvent.title}</p>
               <div className="w-12 h-1 bg-brand-tactical mt-4" />
             </div>

             <form onSubmit={handleSaleSubmit} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Nome Completo do Cliente</label>
                  <input 
                    type="text" required
                    className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                    value={saleFormData.customerName}
                    onChange={e => setSaleFormData({...saleFormData, customerName: e.target.value})}
                    placeholder="EX: JOÃO DA SILVA"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">E-mail para Acesso (Álbum)</label>
                  <input 
                    type="email" required
                    className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                    value={saleFormData.customerEmail}
                    onChange={e => setSaleFormData({...saleFormData, customerEmail: e.target.value})}
                    placeholder="joao@email.com"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Valor da Venda (R$)</label>
                  <input 
                    type="number" required
                    className="w-full bg-theme-bg border border-theme-border p-4 text-[13px] text-theme-text focus:border-brand-tactical transition-colors outline-none font-bold"
                    value={saleFormData.amount}
                    onChange={e => setSaleFormData({...saleFormData, amount: Number(e.target.value)})}
                  />
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full font-black uppercase tracking-[0.3em] py-5 text-[10px] bg-brand-primary text-black hover:brightness-110 active:scale-[0.98] transition-all rounded-none"
                  >
                    {isUploading ? "PROCESSANDO..." : "CONFIRMAR E GERAR ACESSO"}
                  </button>
                  <p className="text-[8px] text-theme-muted text-center mt-4 uppercase tracking-widest leading-relaxed">
                    Ao confirmar, o sistema criará o usuário e o pedido marcado como pago,<br/>enviando as credenciais de acesso para o e-mail informado.
                  </p>
                </div>
             </form>
          </div>
        </div>
      )}
      {/* QR CODE MODAL */}
      {qrModalEvent && (
        <div className="fixed inset-0 bg-theme-bg/95 backdrop-blur-xl z-[60] flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-theme-bg border border-theme-border p-10 relative text-center animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setQrModalEvent(null)}
              className="absolute top-6 right-6 text-theme-muted/60 hover:text-white"
            >
              <X size={20} />
            </button>
            
            <div className="mb-8">
               <div className="w-12 h-12 bg-brand-primary/10 text-brand-primary rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-primary/20">
                 <QrCode size={24} />
               </div>
               <h3 className="text-2xl font-heading text-theme-text uppercase tracking-tighter">QR Code</h3>
               <p className="text-[10px] text-theme-muted uppercase tracking-[0.2em] mt-1">Acesso direto ao protocolo</p>
            </div>

            <div className="bg-white p-6 rounded-none inline-block mb-10 shadow-2xl">
              <QRCodeSVG 
                value={`${window.location.origin}/e/${qrModalEvent.slug}`}
                size={240}
                level="H"
                includeMargin={false}
              />
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/e/${qrModalEvent.slug}`;
                  const printWindow = window.open("", "_blank");
                  if (printWindow) {
                    printWindow.document.write(`
                      <html>
                        <head>
                          <title>Kit de Marketing - ${qrModalEvent.title}</title>
                          <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;900&display=swap" rel="stylesheet">
                          <style>
                            body { font-family: 'Outfit', sans-serif; background: white; color: black; display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; padding: 40px; }
                            .card { border: 15px solid #85B9AC; padding: 60px; max-width: 600px; position: relative; }
                            .logo { font-weight: 900; font-size: 24px; color: #85B9AC; margin-bottom: 60px; letter-spacing: -1px; }
                            .label { font-size: 14px; text-transform: uppercase; letter-spacing: 5px; color: #888; margin-bottom: 20px; font-weight: 700; }
                            h1 { font-size: 42px; font-weight: 900; text-transform: uppercase; margin: 0 0 40px 0; letter-spacing: -2px; line-height: 1; }
                            .qr-placeholder { background: white; padding: 20px; border: 1px solid #eee; display: inline-block; margin-bottom: 40px; }
                            .footer-text { font-size: 10px; text-transform: uppercase; letter-spacing: 3px; color: #bbb; font-weight: 700; }
                            @media print { .no-print { display: none; } }
                            button { margin-top: 40px; padding: 15px 40px; background: #000; color: #fff; border: none; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 2px; font-size: 12px; }
                          </style>
                        </head>
                        <body>
                          <div class="card">
                            <div class="logo">FOTO / SEGUNDO</div>
                            <div class="label">Nossas fotos estão aqui</div>
                            <h1>${qrModalEvent.title}</h1>
                            <div class="qr-placeholder" id="qrcode"></div>
                            <div class="footer-text">Escaneie para acessar a galeria</div>
                          </div>
                          <button class="no-print" onclick="window.print()">Imprimir Kit</button>
                          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
                          <script>
                            new QRCode(document.getElementById("qrcode"), {
                              text: "${url}",
                              width: 250,
                              height: 250
                            });
                          </script>
                        </body>
                      </html>
                    `);
                    printWindow.document.close();
                  }
                }}
                className="w-full bg-brand-primary text-black py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:brightness-110 transition-all"
              >
                Gerar Kit de Marketing (PDF)
              </button>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(`${window.location.origin}/e/${qrModalEvent.slug}`);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="w-full bg-theme-bg-muted border border-theme-border text-theme-text py-4 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-theme-border transition-all"
              >
                {copied ? "COPIADO!" : "COPIAR LINK DIRETO"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* NOTIFICATION (MIDNIGHT LUXURY) */}
      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] animate-in slide-in-from-right-10 duration-500">
           <div className={`p-6 border ${notification.type === 'success' ? 'border-brand-tactical bg-zinc-950 shadow-[0_0_30px_rgba(133,185,172,0.1)]' : 'border-red-900 bg-zinc-950'} min-w-[300px] relative overflow-hidden shadow-2xl`}>
              <div className="flex flex-col gap-1">
                 <span className={`text-[8px] font-black uppercase tracking-[0.4em] ${notification.type === 'success' ? 'text-brand-tactical' : 'text-red-500'}`}>
                    {notification.type === 'success' ? 'Operação Concluída' : 'Falha Crítica'}
                 </span>
                 <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
              </div>
              <div className={`absolute bottom-0 left-0 h-1 ${notification.type === 'success' ? 'bg-brand-tactical' : 'bg-red-900'} animate-out fade-out duration-[5000ms] w-full`} />
           </div>
        </div>
      )}
    </div>
  );
};

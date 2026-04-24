import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, Copy, Check, Download, X } from "lucide-react";

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
  _count: { pedidos: number };
}

export const AdminEvents: React.FC = () => {
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
    previewPhotos: ["", "", ""]
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
        previewPhotos: ["", "", ""]
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
        })()
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

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase">Operação de Eventos</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold italic">Logística de Captação e Unidades Fixas</p>
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
              previewPhotos: ["", "", ""]
            });
            setCoverPreview(null);
            setIsModalOpen(true);
          }}
          className="font-black uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[10px]"
          style={{ backgroundColor: 'var(--brand-tactical)', color: 'var(--theme-text-on-brand)' }}
        >
          NOVO EVENTO
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Evento", "Data", "Produção", "Vendas", "Membros", "Ações"].map((h) => (
                <th key={h} style={{ 
                  padding: "10px 16px", fontSize: 9, fontFamily: T.fontB, fontWeight: 900, 
                  textTransform: "uppercase", letterSpacing: 2, color: T.text3 
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: 60, textAlign: "center", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 3 }}>
                  Indexando Eventos...
                </td>
              </tr>
            ) : events.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: 60, textAlign: "center", fontSize: 10, color: T.text3, textTransform: "uppercase", letterSpacing: 3 }}>
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : events.map((event: Event, idx) => (
              <tr 
                key={event.id} 
                style={{ 
                  background: idx % 2 === 0 ? T.bgField : "transparent",
                  borderBottom: `1px solid ${T.border}44`,
                  transition: "background 0.2s"
                }}
                onMouseEnter={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = T.bgCard; }}
                onMouseLeave={(e: React.MouseEvent<HTMLElement>) => { (e.currentTarget as HTMLElement).style.background = idx % 2 === 0 ? T.bgField : "transparent"; }}
              >
                {/* Evento */}
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.text, textTransform: "uppercase", letterSpacing: -0.3 }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 10, color: T.text3, marginTop: 2, textTransform: "uppercase", fontWeight: 700 }}>
                    {event.location}
                  </div>
                </td>

                {/* Data */}
                <td style={{ padding: "12px 16px", fontSize: 11, fontWeight: 700, color: T.text2 }}>
                  {new Date(event.date).toLocaleDateString("pt-BR")}
                </td>

                {/* Produção */}
                <td style={{ padding: "12px 16px" }}>
                   <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                      <div title="Capa" style={{ 
                        width: 8, height: 8, borderRadius: "50%", 
                        background: event.coverPhotoUrl ? T.brand : T.border,
                        border: `1px solid ${event.coverPhotoUrl ? T.brand : T.text3}`
                      }} />
                      <div title="Links" style={{ 
                        width: 8, height: 8, borderRadius: "50%", 
                        background: (event.lightroomUrl || event.driveUrl) ? T.brand : T.border,
                        border: `1px solid ${(event.lightroomUrl || event.driveUrl) ? T.brand : T.text3}`
                      }} />
                      <span style={{ fontSize: 9, color: T.text3, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                        {(event.lightroomUrl || event.driveUrl) ? "CONCLUÍDO" : "EM PRODUÇÃO"}
                      </span>
                   </div>
                </td>

                {/* Vendas */}
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ 
                      fontSize: 12, fontWeight: 900, 
                      color: event._count?.pedidos > 0 ? T.brand : T.text3 
                    }}>
                      {event._count?.pedidos || 0}
                    </div>
                  </div>
                </td>

                {/* Membros */}
                <td style={{ padding: "12px 16px" }}>
                   <div style={{ fontSize: 9, color: T.text, fontWeight: 900, textTransform: "uppercase" }}>{event.captacao?.nome || "—"}</div>
                   <div style={{ fontSize: 8, color: T.text3, textTransform: "uppercase" }}>{event.edicao?.nome || "—"}</div>
                </td>

                {/* Ações */}
                <td style={{ padding: "12px 16px" }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <button 
                      onClick={() => { setQrModalEvent(event); setCopied(false); }}
                      style={{ 
                        background: "transparent", border: `1px solid ${T.border}`, color: T.text3, 
                        cursor: "pointer", display: "flex", alignItems: "center", padding: 6,
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = T.brand}
                      onMouseLeave={e => e.currentTarget.style.color = T.text3}
                      title="Gerar QR Code"
                    >
                      <QrCode size={12} />
                    </button>
                    <button 
                      onClick={() => {
                        setSaleEvent(event);
                        setSaleFormData({
                          customerName: "",
                          customerEmail: "",
                          amount: Number(event.priceBase || 0)
                        });
                        setIsSaleModalOpen(true);
                      }}
                      style={{ 
                        background: T.brand, border: "none", color: "black", 
                        fontSize: 8, fontWeight: 900, textTransform: "uppercase", 
                        letterSpacing: 1, cursor: "pointer", padding: "6px 12px",
                        transition: "all 0.2s"
                      }}
                    >
                      VENDA
                    </button>
                    <button 
                      onClick={() => handleEditOpen(event)}
                      style={{ 
                        background: "transparent", border: `1px solid ${T.border}`, color: T.text2, 
                        fontSize: 8, fontWeight: 900, textTransform: "uppercase", 
                        letterSpacing: 1, cursor: "pointer", padding: "6px 10px",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = T.brand; e.currentTarget.style.color = T.text; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.text2; }}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
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
                id="qr-code-svg-admin-rev"
                value={`${window.location.origin}/e/${qrModalEvent.slug || qrModalEvent.id}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/e/${qrModalEvent.slug || qrModalEvent.id}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="flex items-center justify-center gap-2 py-4 border border-theme-border text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white/5"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  {copied ? "Copiado" : "Link"}
                </button>
                
                <button 
                  onClick={() => {
                    const svg = document.getElementById("qr-code-svg-admin-rev");
                    if (!svg) return;
                    const svgData = new XMLSerializer().serializeToString(svg);
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d");
                    const img = new Image();
                    img.onload = () => {
                      canvas.height = img.height;
                      canvas.width = img.width;
                      ctx?.drawImage(img, 0, 0);
                      const pngFile = canvas.toDataURL("image/png");
                      const downloadLink = document.createElement("a");
                      downloadLink.download = `QRCode-${qrModalEvent.title.replace(/\s+/g, '-').toLowerCase()}.png`;
                      downloadLink.href = pngFile;
                      downloadLink.click();
                    };
                    img.src = "data:image/svg+xml;base64," + btoa(svgData);
                  }}
                  className="flex items-center justify-center gap-2 py-4 bg-brand-primary text-black text-[9px] font-black uppercase tracking-[0.2em]"
                >
                  <Download size={14} /> PNG
                </button>
              </div>
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

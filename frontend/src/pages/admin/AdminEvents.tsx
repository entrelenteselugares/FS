// Optimized Admin Dashboard - Foto Segundo
import React, { useState, useEffect, useCallback } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Trash2 } from "lucide-react";

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
  type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
  pricePerPhoto?: number;
  _count: { pedidos: number };
  collectedAmount?: number;
  targetAmount?: number;
}

interface AdminEventsProps {
  initialEditEventId?: string | null;
  onClose?: () => void;
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
  const [activeTab, setActiveTab] = useState<'info' | 'equipe' | 'comercial'>('info');
  const [confirmDelete, setConfirmDelete] = useState<Event | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };
  
  const [isExpressModalOpen, setIsExpressModalOpen] = useState(false);
  const [expressFormData, setExpressFormData] = useState({
    customerName: "",
    customerEmail: "",
    whatsapp: "",
    amount: 15,
    location: "Taquaral / Marketplace",
    paymentMethod: "MONEY" as "PIX" | "CARD" | "MONEY",
    services: [] as string[]
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
    type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
    pricePerPhoto: number;
  }

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
    type: 'ALBUM_FULL',
    pricePerPhoto: 15,
  });

  const [previewPreviews, setPreviewPreviews] = useState<string[]>(["", "", ""]);
  const previewInputRef = React.useRef<HTMLInputElement>(null);
  const [currentPreviewIdx, setCurrentPreviewIdx] = useState<number | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handlePreviewFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || currentPreviewIdx === null) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const newPreviews = [...previewPreviews];
      newPreviews[currentPreviewIdx] = ev.target?.result as string;
      setPreviewPreviews(newPreviews);
    };
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

      // Upload Previews
      for (let i = 0; i < previewPreviews.length; i++) {
        const p = previewPreviews[i];
        if (p && p.startsWith("data:image")) {
          await API.patch(`/admin/events/${event.id}/preview`, {
            imageBase64: p,
            mimeType: "image/jpeg",
            index: i
          });
        }
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
        type: 'ALBUM_FULL',
        pricePerPhoto: 15,
      });
      setCoverPreview(null);
      setPreviewPreviews(["", "", ""]);
    } catch {
      showNotification("Erro ao processar evento.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await API.delete(`/admin/events/${id}`);
      showNotification("Evento removido com sucesso!");
      setConfirmDelete(null);
      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
    } catch {
      showNotification("Erro ao excluir evento.", 'error');
    }
  };

  const handleEditOpen = useCallback(async (event: { id: string }) => {
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
          try { 
            const p = data.previewPhotos ? JSON.parse(data.previewPhotos) : []; 
            return [p[0]||"", p[1]||"", p[2]||""] as [string,string,string]; 
          } catch { 
            return ["","",""] as [string,string,string]; 
          }
        })(),
        isPrivate: data.isPrivate || false,
        isUnitSale: data.isUnitSale || false,
        priceUnit: Number(data.priceUnit || 10),
        type: data.type || 'ALBUM_FULL',
        pricePerPhoto: Number(data.pricePerPhoto || 15)
      });
      setCoverPreview(data.coverPhotoUrl);
      try {
        const p = data.previewPhotos ? JSON.parse(data.previewPhotos) : [];
        setPreviewPreviews([p[0]||"", p[1]||"", p[2]||""]);
      } catch {
        setPreviewPreviews(["", "", ""]);
      }
      setActiveTab('info');
      setIsModalOpen(true);
    } catch {
      showNotification("Erro ao carregar detalhes do evento.", 'error');
    }
  }, []);

  const handleExpressSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    try {
      const { data } = await API.post("marketplace/express-sale", {
        ...expressFormData,
        services: expressFormData.services.join(", ")
      });
      
      if (data.isDigital && data.checkoutUrl) {
        showNotification("Venda registrada! Abrindo link de pagamento...");
        setTimeout(() => {
          window.open(data.checkoutUrl, "_blank");
          setIsExpressModalOpen(false);
        }, 1500);
        return;
      }

      showNotification("Venda e Operação Marketplace registradas!");
      setIsExpressModalOpen(false);
      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      showNotification(error.response?.data?.error || "Erro na venda expressa.", 'error');
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
          <p className="text-[9px] text-theme-muted uppercase tracking-[0.4em] mt-2 font-bold italic">Logística de Captação e Unidades Fixas</p>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          <button 
            onClick={() => {
              setExpressFormData({ customerName: "", customerEmail: "", whatsapp: "", amount: 15, location: "Taquaral / Marketplace", paymentMethod: "MONEY", services: [] });
              setIsExpressModalOpen(true);
            }}
            className="font-black uppercase tracking-[0.4em] px-8 py-4 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[9px] w-full md:w-auto border border-brand-tactical text-brand-tactical bg-transparent"
          >
            VENDA RÁPIDA (MARKETPLACE)
          </button>
          <button 
            onClick={() => {
              setEditingEvent(null);
              setFormData({ title: "", slug: "", date: "", location: "", city: "", description: "", priceBase: 200, priceEarly: 190, cartorioId: "", captacaoId: "", edicaoId: "", temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false, coverPhotoUrl: "", eventHours: 2, isCrowdfund: false, targetAmount: 0, lightroomUrl: "", driveUrl: "", previewPhotos: ["", "", ""], isPrivate: false, isUnitSale: false, priceUnit: 10, type: 'ALBUM_FULL', pricePerPhoto: 15 });
              setCoverPreview(null);
              setPreviewPreviews(["", "", ""]);
              setIsModalOpen(true);
            }}
            className="font-black uppercase tracking-[0.4em] px-8 py-4 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[9px] w-full md:w-auto bg-brand-tactical text-zinc-950"
          >
            NOVO EVENTO
          </button>
        </div>
      </div>

      <style>{`
        .events-table { width: 100%; border-collapse: collapse; text-align: left; }
        .events-table thead { border-bottom: 1px solid ${T.border}; }
        .events-table th { padding: 10px 16px; fontSize: 9px; fontFamily: ${T.fontB}; fontWeight: 900; textTransform: uppercase; letterSpacing: 2px; color: ${T.text3}; }
        .event-card-mobile { display: none; }
        @media (max-width: 1024px) {
          .events-table { display: none; }
          .event-card-mobile { display: flex; flex-direction: column; gap: 10px; padding: 12px; background: ${T.bgCard}; border: 1px solid ${T.border}; margin-bottom: 8px; }
        }
      `}</style>

      <div className="events-container">
        {/* View Desktop */}
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
              <tr><td colSpan={6} className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Indexando Eventos...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={6} className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Nenhum registro encontrado.</td></tr>
            ) : events.map((event, idx) => (
              <tr key={event.id} className={`${idx % 2 === 0 ? 'bg-theme-bg-muted/50' : 'bg-transparent'} border-b border-theme-border/30`}>
                <td className="p-4">
                  <div className="text-[12px] font-black text-theme-text uppercase tracking-tight">{event.title}</div>
                  <div className="text-[10px] text-theme-muted font-bold uppercase">{event.location}</div>
                </td>
                <td className="p-4 text-[11px] font-bold text-theme-text/80">{new Date(event.date).toLocaleDateString("pt-BR")}</td>
                <td className="p-4">
                   <div className="flex gap-3">
                      <div className={`w-2 h-2 rounded-full ${event.coverPhotoUrl ? 'bg-brand-tactical' : 'bg-zinc-800'}`} />
                      <div className={`w-2 h-2 rounded-full ${(event.lightroomUrl || event.driveUrl) ? 'bg-brand-tactical' : 'bg-zinc-800'}`} />
                   </div>
                </td>
                <td className="p-4 font-black text-brand-tactical">{event._count?.pedidos || 0}</td>
                <td className="p-4">
                   <div className="text-[9px] font-black uppercase text-theme-text">{event.captacao?.nome || "—"}</div>
                   <div className="text-[8px] uppercase text-theme-muted">{event.edicao?.nome || "—"}</div>
                </td>
                <td className="p-4 flex gap-2">
                  <button onClick={() => { setQrModalEvent(event); setCopied(false); }} className="p-2 border border-theme-border text-theme-muted hover:text-white"><QrCode size={12} /></button>
                  <button onClick={() => handleEditOpen(event)} className="px-3 py-1.5 border border-theme-border text-[8px] font-black uppercase tracking-widest text-theme-text hover:bg-theme-border transition-all">Editar</button>
                  <button onClick={() => setConfirmDelete(event)} className="p-2 border border-theme-border text-red-500/40 hover:text-red-500 transition-all"><Trash2 size={12} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* View Mobile */}
        <div className="lg:hidden space-y-4">
          {loading ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Indexando Eventos...</div>
          ) : events.length === 0 ? (
            <div className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Nenhum registro encontrado.</div>
          ) : events.map((event) => (
            <div key={event.id} className="event-card-mobile">
              <div className="flex justify-between items-start border-b border-white/5 pb-3">
                <div>
                  <div className="text-[12px] font-black text-theme-text uppercase tracking-tight">{event.title}</div>
                  <div className="text-[9px] text-theme-muted font-bold uppercase">{event.location}</div>
                </div>
                <div className="text-[10px] font-bold text-theme-text/80">{new Date(event.date).toLocaleDateString("pt-BR")}</div>
              </div>
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-8">
                  <div>
                    <span className="text-[8px] font-black text-theme-muted uppercase block mb-1">Vendas</span>
                    <span className="text-sm font-black text-brand-tactical">{event._count?.pedidos || 0}</span>
                  </div>
                  <div>
                    <span className="text-[8px] font-black text-theme-muted uppercase block mb-1">Produção</span>
                    <div className="flex gap-2">
                      <div className={`w-2 h-2 rounded-full ${event.coverPhotoUrl ? 'bg-brand-tactical' : 'bg-zinc-800'}`} />
                      <div className={`w-2 h-2 rounded-full ${(event.lightroomUrl || event.driveUrl) ? 'bg-brand-tactical' : 'bg-zinc-800'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setQrModalEvent(event); setCopied(false); }} className="p-3 border border-theme-border text-theme-muted"><QrCode size={16} /></button>
                  <button onClick={() => handleEditOpen(event)} className="px-5 py-3 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-text">Editar</button>
                  <button onClick={() => setConfirmDelete(event)} className="p-3 border border-theme-border text-red-500/40"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl overflow-y-auto">
          <div className="w-full max-w-4xl bg-theme-bg border border-theme-border p-10 relative shadow-2xl my-10 flex flex-col min-h-[640px]">
              <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors">
                <X size={24} />
              </button>

              <div className="mb-8">
                <h2 className="text-2xl font-black text-theme-text uppercase tracking-tighter">{editingEvent ? "Ajustar Operação" : "Novo Registro"}</h2>
                <div className="w-12 h-1 bg-brand-tactical mt-1" />
              </div>

              <div className="flex border-b border-theme-border mb-8 gap-8">
                {(['info', 'equipe', 'comercial'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setActiveTab(t)} className={`pb-4 text-[10px] font-black uppercase tracking-[0.4em] relative ${activeTab === t ? 'text-brand-tactical' : 'text-theme-muted hover:text-white'}`}>
                    {t === 'info' ? 'Essencial' : t === 'equipe' ? 'Operação' : 'Comercial & Entrega'}
                    {activeTab === t && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-tactical" />}
                  </button>
                ))}
              </div>

              <form onSubmit={handleCreate} className="flex-1 flex flex-col">
                  <div className="flex-1">
                    {activeTab === 'info' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
                        <div className="space-y-12">
                          <div className="space-y-4">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Capa da Vitrine</label>
                            <div onClick={() => fileInputRef.current?.click()} className="w-full aspect-video bg-theme-bg-muted border border-theme-border flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative shadow-inner">
                              {coverPreview ? <img src={coverPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" /> : (
                                <div className="text-center group-hover:text-brand-tactical transition-colors">
                                  <div className="text-3xl mb-3">📸</div>
                                  <div className="text-[9px] uppercase tracking-[0.4em] text-zinc-600 font-black">Enviar Capa</div>
                                </div>
                              )}
                              {isUploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px] text-white uppercase tracking-widest animate-pulse font-black">Processando...</div>}
                            </div>
                            <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                          </div>
                        </div>
                        <div className="space-y-12">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Título do Evento</label>
                            <input type="text" required className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Identificador URL (Slug)</label>
                            <input type="text" className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-muted focus:border-brand-tactical outline-none font-black" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ex: taynan-e-felipe" />
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Data</label>
                              <input type="date" required className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                            </div>
                            <div className="space-y-3">
                              <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Local</label>
                              <input type="text" required className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="EX: CARTÓRIO X" />
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'equipe' && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 animate-in fade-in duration-500">
                        <div className="space-y-12">
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Unidade Fixa</label>
                            <select value={formData.cartorioId} onChange={e => setFormData({...formData, cartorioId: e.target.value})} className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black cursor-pointer appearance-none">
                              <option value="">SELECIONE A UNIDADE</option>
                              {users.filter(u => u.role === "UNIDADE" || u.role === "CARTORIO").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                            </select>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Cidade / UF</label>
                            <input type="text" className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="EX: SÃO PAULO - SP" />
                          </div>
                        </div>
                        <div className="space-y-12">
                          <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Captação</label>
                              <select value={formData.captacaoId} onChange={e => setFormData({...formData, captacaoId: e.target.value})} className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black cursor-pointer appearance-none">
                                <option value="">PROFISSIONAL</option>
                                {users.filter(u => u.role === "PROFISSIONAL").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                              </select>
                            </div>
                            <div className="space-y-3">
                              <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Edição</label>
                              <select value={formData.edicaoId} onChange={e => setFormData({...formData, edicaoId: e.target.value})} className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black cursor-pointer appearance-none">
                                <option value="">PROFISSIONAL</option>
                                {users.filter(u => u.role === "PROFISSIONAL").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                              </select>
                            </div>
                          </div>
                          <div className="space-y-3">
                            <label className="text-[9px] font-black text-theme-muted uppercase tracking-[0.4em]">Horas de Trabalho</label>
                            <input type="number" required value={formData.eventHours} onChange={e => setFormData({...formData, eventHours: Number(e.target.value)})} className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text focus:border-brand-tactical outline-none font-black" />
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === 'comercial' && (
                      <div className="animate-in fade-in duration-500 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-6">
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Preço Álbum (R$)</label>
                                <input type="number" className="w-full bg-white border border-zinc-300 p-2.5 text-[13px] text-zinc-950 outline-none font-black" value={formData.priceBase} onChange={e => setFormData({ ...formData, priceBase: Number(e.target.value) })} />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Antecipado (R$)</label>
                                <input type="number" className="w-full bg-white border border-zinc-300 p-2.5 text-[13px] text-zinc-950 outline-none font-black" value={formData.priceEarly} onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})} />
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Google Drive</label>
                              <input type="text" className="w-full bg-white border border-zinc-300 p-2.5 text-[11px] text-zinc-950 outline-none font-bold italic" value={formData.driveUrl} onChange={e => setFormData({ ...formData, driveUrl: e.target.value })} placeholder="https://..." />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Lightroom / Galeria</label>
                              <input type="text" className="w-full bg-white border border-zinc-300 p-2.5 text-[11px] text-zinc-950 outline-none font-bold italic" value={formData.lightroomUrl} onChange={e => setFormData({ ...formData, lightroomUrl: e.target.value })} placeholder="https://..." />
                            </div>
                          </div>
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Modelo e Serviços</label>
                              <div className="flex gap-4">
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'ALBUM_FULL' })} className={`flex-1 p-2.5 border text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'ALBUM_FULL' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-sm' : 'bg-zinc-50 border-zinc-300 text-zinc-500'}`}>Álbum Completo</button>
                                <button type="button" onClick={() => setFormData({ ...formData, type: 'PHOTO_MARKETPLACE' })} className={`flex-1 p-2.5 border text-[9px] font-black uppercase tracking-widest transition-all ${formData.type === 'PHOTO_MARKETPLACE' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-sm' : 'bg-zinc-50 border-zinc-300 text-zinc-500'}`}>Marketplace</button>
                              </div>
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3 pt-3 border-t border-zinc-100">
                                {["temFoto", "temVideo", "temReels", "temFotoImpressa", "isCrowdfund", "isPrivate"].map(f => (
                                  <label key={f} className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData[f as keyof EventFormData] as boolean} onChange={e => setFormData({...formData, [f]: e.target.checked})} className="w-3.5 h-3.5 border-zinc-300 appearance-none checked:bg-brand-tactical border transition-all" />
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${formData[f as keyof EventFormData] ? 'text-brand-tactical' : 'text-zinc-400'}`}>{f.replace("tem", "").replace("is", "").replace(/([A-Z])/g, ' $1').trim()}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                            {formData.isCrowdfund && (
                              <div className="p-3 bg-brand-tactical/5 border border-brand-tactical/20 flex justify-between items-center">
                                <div><label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest">Meta</label>
                                <input type="number" className="bg-transparent text-lg font-black text-zinc-950 outline-none w-24" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})} /></div>
                                <div className="text-right"><span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest block">Coletado</span><span className="text-md font-black text-brand-tactical">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingEvent?.collectedAmount || 0)}</span></div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="pt-4 border-t border-zinc-100">
                          <div className="flex justify-between items-center mb-3">
                            <label className="text-[9px] font-black text-zinc-800 uppercase tracking-[0.4em]">Fotos de Prévia (Vitrine - 3 slots)</label>
                            <span className="text-[8px] text-zinc-400 font-bold uppercase italic">Clique para enviar as fotos do slideshow</span>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            {[0, 1, 2].map(i => (
                              <div 
                                key={i}
                                onClick={() => { setCurrentPreviewIdx(i); previewInputRef.current?.click(); }}
                                className="aspect-video bg-zinc-50 border border-zinc-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group hover:border-brand-tactical transition-all"
                              >
                                {previewPreviews[i] ? (
                                  <img src={previewPreviews[i]} alt={`Preview ${i+1}`} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-center opacity-40 group-hover:opacity-100 transition-opacity">
                                    <div className="text-xl">📸</div>
                                    <div className="text-[7px] font-black uppercase">Foto {i+1}</div>
                                  </div>
                                )}
                                {previewPreviews[i] && (
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-[7px] text-white font-black uppercase">Trocar Foto</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                          <input type="file" ref={previewInputRef} hidden accept="image/*" onChange={handlePreviewFileChange} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-auto pt-10 border-t border-theme-border flex justify-end gap-6">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-[10px] font-black uppercase tracking-[0.4em] text-theme-muted hover:text-white transition-all">Cancelar</button>
                    {activeTab !== 'comercial' ? (
                      <button type="button" onClick={() => { const t: Array<'info' | 'equipe' | 'comercial'> = ['info','equipe','comercial']; setActiveTab(t[t.indexOf(activeTab)+1]); }} className="px-10 py-4 bg-zinc-800 text-white text-[10px] font-black uppercase tracking-[0.4em] hover:bg-zinc-700 transition-all">Próximo Passo</button>
                    ) : (
                      <button type="submit" disabled={isUploading} className="px-12 py-4 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-[0.4em] hover:brightness-110 shadow-lg">{isUploading ? "PROCESSANDO..." : (editingEvent ? "SALVAR ALTERAÇÕES" : "CADASTRAR EVENTO")}</button>
                    )}
                  </div>
              </form>
          </div>
        </div>
      )}

      {qrModalEvent && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl">
          <div className="w-full max-w-sm bg-theme-bg border border-theme-border p-10 relative text-center shadow-2xl">
            <button onClick={() => setQrModalEvent(null)} className="absolute top-6 right-6 text-theme-muted hover:text-white"><X size={20} /></button>
            <div className="mb-8">
               <h3 className="text-2xl font-black text-theme-text uppercase tracking-tighter">QR Code</h3>
               <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-1">Acesso Direto</p>
            </div>
            <div className="bg-white p-6 inline-block mb-10"><QRCodeSVG value={`${window.location.origin}/e/${qrModalEvent.slug}`} size={240} level="H" /></div>
            <div className="space-y-3">
              <button onClick={() => { const url = `${window.location.origin}/e/${qrModalEvent.slug}`; const w = window.open("", "_blank"); if(w){ w.document.write(`<html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;"><h1>${qrModalEvent.title}</h1><div id="q"></div><button onclick="window.print()" style="margin-top:20px;padding:10px 20px;">Imprimir</button><script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script><script>new QRCode(document.getElementById("q"), {text:"${url}",width:250,height:250});</script></body></html>`); w.document.close(); } }} className="w-full bg-brand-tactical text-zinc-950 py-4 text-[10px] font-black uppercase tracking-widest">Imprimir Kit</button>
              <button onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/e/${qrModalEvent.slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="w-full bg-theme-bg-muted border border-theme-border text-theme-text py-4 text-[10px] font-black uppercase tracking-widest">{copied ? "COPIADO!" : "COPIAR LINK"}</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] p-6 border border-brand-tactical bg-zinc-950 shadow-2xl min-w-[300px] animate-in slide-in-from-right-10 duration-500">
          <div className="flex flex-col gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-tactical">Notificação</span>
             <p className="text-[11px] font-bold text-white uppercase tracking-widest">{notification.message}</p>
          </div>
        </div>
      )}

      {isExpressModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-5xl bg-theme-bg border border-theme-border p-10 relative shadow-2xl">
             <button onClick={() => setIsExpressModalOpen(false)} className="absolute top-8 right-8 text-theme-muted hover:text-white"><X size={20} /></button>
             <div className="mb-10"><h2 className="text-2xl font-black text-theme-text uppercase tracking-tighter">Venda Rápida</h2></div>
             <form onSubmit={handleExpressSaleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em]">E-mail</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text outline-none font-bold" 
                      value={expressFormData.customerEmail} 
                      onChange={e => setExpressFormData({...expressFormData, customerEmail: e.target.value})} 
                      onBlur={async () => {
                        if (!expressFormData.customerEmail || !expressFormData.customerEmail.includes("@")) return;
                        try {
                          const { data } = await API.get(`/auth/check-email?email=${expressFormData.customerEmail}`);
                          if (data.exists) {
                            setExpressFormData(prev => ({
                              ...prev,
                              customerName: data.name || prev.customerName,
                              whatsapp: data.whatsapp || prev.whatsapp || ""
                            }));
                            showNotification(`Cliente ${data.name} identificado! Dados preenchidos.`);
                          }
                        } catch (err) {
                          console.error("Erro ao checar email:", err);
                        }
                      }}
                      placeholder="EMAIL" 
                    />
                  </div>
                  <div className="space-y-2"><label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em]">Cliente</label><input type="text" className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text outline-none font-bold" value={expressFormData.customerName} onChange={e => setExpressFormData({...expressFormData, customerName: e.target.value})} placeholder="NOME" /></div>
                  <div className="space-y-2"><label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em]">WhatsApp</label><input type="text" className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text outline-none font-bold" value={expressFormData.whatsapp} onChange={e => setExpressFormData({...expressFormData, whatsapp: e.target.value})} placeholder="(00) 00000-0000" /></div>
                  
                  <div className="pt-4 border-t border-theme-border/30">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em] mb-4 block">Serviços Selecionados</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["FOTO DIGITAL", "FOTO IMPRESSA", "VIDEO", "REELS"].map(s => (
                        <label key={s} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox" 
                            checked={expressFormData.services.includes(s)}
                            onChange={e => {
                              const newServices = e.target.checked 
                                ? [...expressFormData.services, s]
                                : expressFormData.services.filter(x => x !== s);
                              setExpressFormData({...expressFormData, services: newServices});
                            }}
                            className="w-4 h-4 border-theme-border appearance-none checked:bg-brand-tactical border transition-all"
                          />
                          <span className={`text-[9px] font-black uppercase tracking-widest ${expressFormData.services.includes(s) ? 'text-brand-tactical' : 'text-theme-muted'}`}>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2"><label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em]">Valor</label><input type="number" required className="w-full bg-theme-bg border border-theme-border p-4 text-[14px] text-brand-tactical outline-none font-black" value={expressFormData.amount} onChange={e => setExpressFormData({...expressFormData, amount: Number(e.target.value)})} /></div>
                    <div className="space-y-2"><label className="text-[8px] font-black text-theme-muted uppercase tracking-[0.4em]">Local</label><input type="text" required className="w-full bg-theme-bg border border-theme-border p-4 text-[12px] text-theme-text outline-none font-bold" value={expressFormData.location} onChange={e => setExpressFormData({...expressFormData, location: e.target.value})} /></div>
                  </div>
                  <div className="flex gap-4">
                    {(["MONEY", "PIX", "CARD"] as const).map(m => <button key={m} type="button" onClick={() => setExpressFormData({...expressFormData, paymentMethod: m})} className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest border transition-all ${expressFormData.paymentMethod === m ? 'bg-brand-tactical text-zinc-950 border-brand-tactical' : 'bg-theme-bg text-theme-muted border-theme-border'}`}>{m}</button>)}
                  </div>
                  <button type="submit" disabled={isUploading} className="w-full bg-brand-tactical text-zinc-950 font-black uppercase tracking-[0.5em] py-5 text-[11px] shadow-lg">{isUploading ? "PROCESSANDO..." : "FINALIZAR VENDA"}</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-theme-bg border border-theme-border p-10 max-w-md w-full space-y-8 shadow-2xl">
            <div className="space-y-2">
              <span className="text-[10px] font-black text-red-500 uppercase tracking-[0.5em]">Protocolo de Exclusão</span>
              <h3 className="text-xl font-black text-theme-text uppercase tracking-tight">Confirmar Remoção?</h3>
              <p className="text-[11px] text-theme-muted leading-relaxed uppercase tracking-widest font-bold opacity-60">
                Você está prestes a excluir o evento <span className="text-white">{confirmDelete.title}</span>. 
                Se houver pedidos aprovados, o evento será apenas desativado. Caso contrário, será removido permanentemente.
              </p>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 py-4 border border-theme-border text-[10px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-1 py-4 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-red-500 transition-colors"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

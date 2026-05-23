// Optimized Admin Dashboard - Foto Segundo
import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { QRCodeSVG } from "qrcode.react";
import { QrCode, X, Trash2, Radar, ArrowRight, RefreshCw, Image } from "lucide-react";
import AdminPhygitalQueue from "./AdminPhygitalQueue";
import { EventStatusDot } from "../../components/EventStatusDot";

interface User {
  id: string;
  nome: string;
  role: string;
  franchiseProfile?: {
    id: string;
    printCredits: number;
    active: boolean;
  };
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
  type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE' | 'SCHOOL' | 'SPORTS';
  preSaleEnabled?: boolean;
  postSaleEnabled?: boolean;
  pricePerPhoto?: number;
  _count: { pedidos: number };
  collectedAmount?: number;
  targetAmount?: number;
  clientName?: string | null;
  clientEmail?: string | null;
  retentionDays?: number;
}

interface EventMediaItem {
  id: string;
  url: string;
  shortId: string;
  metadata?: Record<string, string>;
}

interface AdminEventsProps {
  initialEditEventId?: string | null;
  onClose?: () => void;
}

export const AdminEvents: React.FC<AdminEventsProps> = ({ initialEditEventId }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [qrModalEvent, setQrModalEvent] = useState<Event | null>(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'equipe' | 'comercial' | 'galeria'>('info');
  const [eventMedia, setEventMedia] = useState<EventMediaItem[]>([]); // TODO: Definir interface Media
  const [confirmDelete, setConfirmDelete] = useState<Event | null>(null);
  const [phygitalQueueEvent, setPhygitalQueueEvent] = useState<Event | null>(null);

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
    location: "Taquaral / Live Print",
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
    type: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE' | 'SCHOOL' | 'SPORTS';
    preSaleEnabled: boolean;
    postSaleEnabled: boolean;
    pricePerPhoto: number;
    clientName: string;
    clientEmail: string;
    franchiseeId: string;
    retentionDays: number;
    verticalConfigs: Record<string, unknown>;
    coverPosition: string;
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
    isPrivate: true,
    isUnitSale: false,
    priceUnit: 10,
    type: 'ALBUM_FULL',
    pricePerPhoto: 15,
    clientName: "",
    clientEmail: "",
    franchiseeId: "",
    retentionDays: 15,
    preSaleEnabled: false,
    postSaleEnabled: true,
    verticalConfigs: {},
    coverPosition: "center",
  });


  const compressImageToBase64 = (file: File, maxWidth = 1200): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new window.Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject("Canvas context is null");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7)); // 0.7 quality to keep payload small
      };
      img.onerror = (err) => reject(err);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImageToBase64(file, 800);
      setCoverPreview(compressed);
    } catch (err) {
      console.error("Erro na compressão:", err);
      // Fallback
      const reader = new FileReader();
      reader.onload = (ev) => setCoverPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
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
        isPrivate: true,
        isUnitSale: false,
        priceUnit: 10,
        type: 'ALBUM_FULL',
        pricePerPhoto: 15,
        clientName: "",
        clientEmail: "",
        franchiseeId: "",
        retentionDays: 15,
        preSaleEnabled: false,
        postSaleEnabled: true,
        verticalConfigs: {},
        coverPosition: "center",
      });
      setCoverPreview(null);
    } catch {
      showNotification("Erro ao processar evento.", 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSyncDrive = async () => {
    if (!editingEvent) return;
    setIsSyncing(true);
    try {
      const { data } = await API.post(`/marketplace/events/${editingEvent.id}/sync-drive`);
      showNotification(data.message);
      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      console.error(error);
      showNotification(error.response?.data?.error || "Erro ao sincronizar Drive.", 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  const loadEventMedia = async (eventId: string) => {
    try {
      const { data } = await API.get(`/marketplace/events/${eventId}/media`);
      setEventMedia(data.media || []);
    } catch (err) {
      console.error("Erro ao carregar mídias:", err);
    }
  };

  const handleUpdateMediaMetadata = async (mediaId: string, metadata: Record<string, unknown>) => {
    try {
      await API.patch(`/marketplace/media/${mediaId}/metadata`, { metadata });
      showNotification("Metadados atualizados!");
    } catch (err) {
      console.error(err);
      showNotification("Erro ao atualizar metadados.", 'error');
    }
  };

  useEffect(() => {
    if (activeTab === 'galeria' && editingEvent) {
      loadEventMedia(editingEvent.id);
    }
  }, [activeTab, editingEvent]);

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
        date: (() => {
          const d = new Date(data.dataEvento);
          const offset = d.getTimezoneOffset() * 60000;
          return new Date(d.getTime() - offset).toISOString().slice(0, 16);
        })(),
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
        pricePerPhoto: Number(data.pricePerPhoto || 15),
        clientName: data.clientName || "",
        clientEmail: data.clientEmail || "",
        franchiseeId: data.franchiseeId || "",
        retentionDays: data.retentionDays || 15,
        preSaleEnabled: data.preSaleEnabled || false,
        postSaleEnabled: data.postSaleEnabled || false,
        verticalConfigs: data.verticalConfigs ? (typeof data.verticalConfigs === 'string' ? JSON.parse(data.verticalConfigs) : data.verticalConfigs) : {},
        coverPosition: data.coverPosition || "center",
      });
      setCoverPreview(data.coverPhotoUrl);
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
        showNotification("Venda registrada! Redirecionando para o checkout...");
        setIsExpressModalOpen(false);
        // BUG FIX: Navega internamente para o checkout padrão (MP Bricks)
        // em vez de abrir o Checkout Pro externo do MP
        setTimeout(() => {
          const path = data.checkoutUrl.replace(window.location.origin, '');
          navigate(path.startsWith('/') ? path : `/${path}`);
        }, 800);
        return;
      }

      showNotification("Venda e Operação Live Print registradas!");
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
      {/* Actions */}
      <div className="relative border-b border-theme-border/60 pb-4 space-y-4 md:space-y-6">
        <div className="flex flex-col xl:flex-row justify-end items-start xl:items-end gap-6 relative z-10">
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <button 
              onClick={() => {
                setExpressFormData({ customerName: "", customerEmail: "", whatsapp: "", amount: 15, location: "Taquaral / Marketplace", paymentMethod: "MONEY", services: [] });
                setIsExpressModalOpen(true);
              }}
              className="fs-btn border border-brand-tactical text-brand-tactical bg-transparent italic flex-1 md:flex-none whitespace-nowrap"
            >
              VENDA RÁPIDA (LIVE PRINT)
            </button>
            <button 
              onClick={() => {
                setEditingEvent(null);
                setFormData({ 
                  title: "", slug: "", date: "", location: "", city: "", description: "", 
                  priceBase: 200, priceEarly: 190, cartorioId: "", captacaoId: "", edicaoId: "", 
                  temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false, 
                  coverPhotoUrl: "", eventHours: 2, isCrowdfund: false, targetAmount: 0, 
                  lightroomUrl: "", driveUrl: "", previewPhotos: ["", "", ""], isPrivate: true, 
                  isUnitSale: false, priceUnit: 10, type: 'ALBUM_FULL', pricePerPhoto: 15, 
                  clientName: "", clientEmail: "", franchiseeId: "", retentionDays: 15,
                  preSaleEnabled: false, postSaleEnabled: true, verticalConfigs: {}, coverPosition: "center"
                });
                setCoverPreview(null);
                setIsModalOpen(true);
              }}
              className="fs-btn bg-brand-tactical text-zinc-950 italic flex-1 md:flex-none whitespace-nowrap"
            >
              NOVO EVENTO
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .events-table { width: 100%; border-collapse: collapse; text-align: left; }
        .events-table thead { border-bottom: 1px solid ${T.border}; }
        .events-table th { padding: 10px 16px; fontSize: 9px; fontFamily: ${T.fontB}; fontWeight: 900; textTransform: uppercase; letterSpacing: 1.5px; color: ${T.text3}; }
        .event-card-mobile { display: none; }
        @media (max-width: 1024px) {
          .events-table { display: none; }
          .event-card-mobile { display: flex; flex-direction: column; gap: 8px; padding: 10px; background: ${T.bgCard}; border: 1px solid ${T.border}; margin-bottom: 6px; }
        }
      `}</style>

      <div className="events-container">
        {/* View Desktop */}
        <table className="events-table">
          <thead>
            <tr>
              {["Código", "Evento", "Data e Hora", "Produção", "Vendas", "Membros", "Ações"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Indexando Eventos...</td></tr>
            ) : events.length === 0 ? (
              <tr><td colSpan={7} className="py-20 text-center text-[10px] text-theme-muted uppercase tracking-[0.3em]">Nenhum registro encontrado.</td></tr>
            ) : events.map((event, idx) => (
              <tr key={event.id} className={`${idx % 2 === 0 ? 'bg-theme-bg-muted/50' : 'bg-transparent'} border-b border-theme-border/30`}>
                <td className="p-2 md:p-3 text-[10px] font-mono text-brand-tactical uppercase">#{event.id.slice(-6).toUpperCase()}</td>
                <td className="p-2 md:p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <EventStatusDot eventDate={event.date} active={event.active} size="w-1.5 h-1.5" />
                  <div className="text-[11px] md:text-[12px] font-black text-theme-text uppercase tracking-tight">{event.title}</div>
                </div>
                <div className="text-[9px] text-theme-muted font-bold uppercase">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "—"}</div>
              </td>
                <td className="p-2 md:p-3">
                  <div className="text-[10px] md:text-[11px] font-bold text-theme-text/80">{new Date(event.date).toLocaleDateString("pt-BR")}</div>
                  <div className="text-[9px] text-theme-muted font-bold">{new Date(event.date).toLocaleTimeString("pt-BR", { hour: '2-digit', minute: '2-digit' })}</div>
                </td>
                <td className="p-2 md:p-3">
                   <div className="flex gap-2 md:gap-3">
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${event.coverPhotoUrl ? 'bg-brand-tactical' : 'bg-theme-border'}`} />
                      <div className={`w-1.5 h-1.5 md:w-2 md:h-2 rounded-full ${(event.lightroomUrl || event.driveUrl) ? 'bg-brand-tactical' : 'bg-theme-border'}`} />
                   </div>
                </td>
                <td className="p-2 md:p-3 font-black text-brand-tactical">{event._count?.pedidos || 0}</td>
                <td className="p-2 md:p-3">
                   <div className="text-[8px] md:text-[9px] font-black uppercase text-theme-text">{event.captacao?.nome || "—"}</div>
                   <div className="text-[7px] md:text-[8px] uppercase text-theme-muted">{event.edicao?.nome || "—"}</div>
                </td>
                <td className="p-2 md:p-3 flex gap-1.5 md:gap-2">
                  <button onClick={() => { setQrModalEvent(event); setCopied(false); }} className="p-2 border border-theme-border text-theme-muted hover:text-white" title="QR Codes"><QrCode size={12} /></button>
                  <button onClick={() => setPhygitalQueueEvent(event)} className="p-2 border border-theme-border text-brand-tactical hover:bg-brand-tactical/10" title="Radar Phygital"><Radar size={12} /></button>
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
              <div className="flex justify-between items-start border-b border-theme-border pb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <EventStatusDot eventDate={event.date} active={event.active} size="w-2 h-2" showLabel />
                  </div>
                  <div className="text-[12px] font-black text-theme-text uppercase tracking-tight">{event.title}</div>
                  <div className="text-[9px] text-theme-muted font-bold uppercase">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "—"}</div>
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
                      <div className={`w-2 h-2 rounded-full ${event.coverPhotoUrl ? 'bg-brand-tactical' : 'bg-theme-border'}`} />
                      <div className={`w-2 h-2 rounded-full ${(event.lightroomUrl || event.driveUrl) ? 'bg-brand-tactical' : 'bg-theme-border'}`} />
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setQrModalEvent(event); setCopied(false); }} className="p-3 border border-theme-border text-theme-muted"><QrCode size={16} /></button>
                  <button onClick={() => setPhygitalQueueEvent(event)} className="p-3 border border-theme-border text-brand-tactical"><Radar size={16} /></button>
                  <button onClick={() => handleEditOpen(event)} className="px-5 py-3 border border-theme-border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest text-theme-text">Editar</button>
                  <button onClick={() => setConfirmDelete(event)} className="p-3 border border-theme-border text-red-500/40"><Trash2 size={16} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[90vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Radar className="text-brand-tactical" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">{editingEvent ? "Ajustar Operação" : "Novo Registro"}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Protocolo de Inteligência de Eventos</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:flex items-center gap-4 md:gap-8 mr-0 md:mr-12">
                {(['info', 'equipe', 'comercial', 'galeria'] as const).map(t => (
                  <button key={t} type="button" onClick={() => setActiveTab(t)} className={`pb-2 text-[10px] font-black uppercase tracking-[0.2em] relative transition-all italic ${activeTab === t ? 'text-brand-tactical' : 'text-theme-muted hover:text-white'}`}>
                    {t === 'info' ? '1. Essencial' : t === 'equipe' ? '2. Operação' : t === 'comercial' ? '3. Comercial' : '4. Galeria'}
                    {activeTab === t && <div className="absolute -bottom-2 left-0 right-0 h-0.5 bg-brand-tactical" />}
                  </button>
                ))}
              </div>

              <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Scrollable Content */}
            <form onSubmit={handleCreate} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar bg-theme-card">
              {activeTab === 'info' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Capa da Vitrine</label>
                      <div onClick={() => fileInputRef.current?.click()} className="w-full h-64 bg-theme-bg-muted border border-theme-border/60 rounded-[30px] flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative shadow-inner">
                        {coverPreview ? (
                          <>
                            <img src={coverPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" style={{ objectPosition: formData.coverPosition || 'center' }} />
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 opacity-0 group-hover:opacity-100 transition-all z-10" onClick={(e) => e.stopPropagation()}>
                              {[
                                { id: 'top', label: 'Superior' },
                                { id: 'center', label: 'Centro' },
                                { id: 'bottom', label: 'Inferior' }
                              ].map(pos => (
                                <button
                                  key={pos.id}
                                  type="button"
                                  onClick={() => setFormData({ ...formData, coverPosition: pos.id })}
                                  className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest rounded-full transition-all ${formData.coverPosition === pos.id || (!formData.coverPosition && pos.id === 'center') ? "bg-brand-tactical text-black" : "text-white hover:bg-white/10"}`}
                                >
                                  {pos.label}
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center group-hover:text-brand-tactical transition-colors">
                            <div className="text-4xl mb-4">📸</div>
                            <div className="text-[9px] uppercase tracking-[0.4em] text-theme-muted font-black">Enviar Capa</div>
                          </div>
                        )}
                        {isUploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[10px] text-theme-text uppercase tracking-widest animate-pulse font-black">Processando...</div>}
                      </div>
                      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Título do Evento</label>
                      <input type="text" required className="fs-input font-black uppercase" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Identificador URL (Slug)</label>
                      <input type="text" className="fs-input font-black" value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value.toLowerCase().replace(/\s/g, "-") })} placeholder="ex: taynan-e-felipe" />
                    </div>

                    <div className="grid grid-cols-2 gap-6 p-6 bg-brand-tactical/5 border border-brand-tactical/10 rounded-[24px]">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-2 opacity-60 italic">Nome do Cliente</label>
                        <input type="text" className="w-full bg-theme-bg/50 border border-brand-tactical/20 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:text-brand-tactical/30" value={formData.clientName} onChange={e => setFormData({ ...formData, clientName: e.target.value })} placeholder="NOME DO CLIENTE" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-2 opacity-60 italic">E-mail de Acesso</label>
                        <input type="email" className="w-full bg-theme-bg/50 border border-brand-tactical/20 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl lowercase placeholder:text-brand-tactical/30" value={formData.clientEmail} onChange={e => setFormData({ ...formData, clientEmail: e.target.value })} placeholder="provisorio@gmail.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Data</label>
                        <input type="datetime-local" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Local</label>
                        <input type="text" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} placeholder="EX: CARTÓRIO X" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'equipe' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 animate-in fade-in duration-500">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Unidade Fixa</label>
                      <select value={formData.cartorioId} onChange={e => setFormData({...formData, cartorioId: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer">
                        <option value="">SELECIONE A UNIDADE</option>
                        {users.filter(u => u.role === "UNIDADE" || u.role === "CARTORIO").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-2 opacity-60 italic">Logística (Franqueado)</label>
                      <select value={formData.franchiseeId} onChange={e => setFormData({...formData, franchiseeId: e.target.value})} className="w-full bg-theme-bg-muted border border-brand-tactical/30 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer">
                        <option value="">FOTO SEGUNDO MATRIZ</option>
                        {users.filter(u => u.franchiseProfile).map(u => (
                          <option key={u.franchiseProfile!.id} value={u.franchiseProfile!.id}>
                            {u.nome.toUpperCase()} ({ u.franchiseProfile!.printCredits } CRÉDITOS)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Cidade / UF</label>
                      <input type="text" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase" value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })} placeholder="EX: SÃO PAULO - SP" />
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Captação</label>
                        <select value={formData.captacaoId} onChange={e => setFormData({...formData, captacaoId: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer">
                          <option value="">PROFISSIONAL</option>
                          {users.filter(u => u.role === "PROFISSIONAL").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Edição</label>
                        <select value={formData.edicaoId} onChange={e => setFormData({...formData, edicaoId: e.target.value})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl appearance-none cursor-pointer">
                          <option value="">PROFISSIONAL</option>
                          {users.filter(u => u.role === "PROFISSIONAL").map(u => <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Horas de Trabalho</label>
                      <input type="number" required value={formData.eventHours} onChange={e => setFormData({...formData, eventHours: Number(e.target.value)})} className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" />
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block mb-2 opacity-60 italic">Briefing / Observações (Briefing do Cliente)</label>
                    <textarea 
                      className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl h-32 resize-none" 
                      value={formData.description} 
                      onChange={e => setFormData({ ...formData, description: e.target.value })} 
                      placeholder="Sem observações adicionais..."
                    />
                  </div>
                </div>
              )}

              {activeTab === 'comercial' && (
                <div className="animate-in fade-in duration-500 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Preço Álbum (R$)</label>
                          <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={formData.priceBase} onChange={e => setFormData({ ...formData, priceBase: Number(e.target.value) })} />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Antecipado (R$)</label>
                          <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={formData.priceEarly} onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Google Drive</label>
                        <div className="flex gap-2">
                          <input type="text" className="flex-1 bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-mono outline-none focus:border-brand-tactical rounded-xl" value={formData.driveUrl} onChange={e => setFormData({ ...formData, driveUrl: e.target.value })} placeholder="https://drive.google.com/..." />
                          {editingEvent && (
                            <button 
                              type="button"
                              onClick={handleSyncDrive}
                              disabled={isSyncing || !formData.driveUrl}
                              className="px-6 bg-brand-tactical text-zinc-950 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest rounded-xl hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                              <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
                              {isSyncing ? "SYNC..." : "SINCRO DRIVE"}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Lightroom / Galeria</label>
                        <input type="text" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-mono outline-none focus:border-brand-tactical rounded-xl" value={formData.lightroomUrl} onChange={e => setFormData({ ...formData, lightroomUrl: e.target.value })} placeholder="https://gallery.lightroom.com/..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Retenção Galeria (Dias)</label>
                        <input type="number" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl" value={formData.retentionDays} onChange={e => setFormData({ ...formData, retentionDays: Number(e.target.value) })} />
                        <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Administração de Coberturas Fotográficas</p>
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-4">
                        <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Modelo e Serviços</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                          <button type="button" onClick={() => setFormData({ ...formData, type: 'ALBUM_FULL' })} className={`py-4 border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all rounded-xl italic ${formData.type === 'ALBUM_FULL' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-theme-text'}`}>Social</button>
                          <button type="button" onClick={() => setFormData({ ...formData, type: 'PHOTO_MARKETPLACE' })} className={`py-4 border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all rounded-xl italic ${formData.type === 'PHOTO_MARKETPLACE' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-theme-text'}`}>Marketplace</button>
                          <button type="button" onClick={() => setFormData({ ...formData, type: 'SCHOOL' })} className={`py-4 border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all rounded-xl italic ${formData.type === 'SCHOOL' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-theme-text'}`}>Escolar</button>
                          <button type="button" onClick={() => setFormData({ ...formData, type: 'SPORTS' })} className={`py-4 border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all rounded-xl italic ${formData.type === 'SPORTS' ? 'bg-brand-tactical border-brand-tactical text-zinc-950 shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border text-theme-muted hover:border-theme-text'}`}>Esportes</button>
                        </div>
                        {formData.type === 'SCHOOL' && (
                          <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 rounded-[20px] space-y-4">
                            <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block opacity-60 italic">Lista de Alunos (Nomes separados por vírgula ou linha)</label>
                            <textarea 
                              className="w-full bg-theme-bg-muted border border-brand-tactical/20 p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl h-24 resize-none placeholder:text-brand-tactical/30" 
                              value={(formData.verticalConfigs?.studentList as string) || ""}
                              onChange={e => setFormData({ ...formData, verticalConfigs: { ...formData.verticalConfigs, studentList: e.target.value }})}
                              placeholder="Ex: João Silva, Maria Souza, Pedro Santos..."
                            />
                          </div>
                        )}
                        {formData.type === 'SPORTS' && (
                          <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 rounded-[20px] space-y-4 flex items-center justify-between">
                            <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block opacity-60 italic">Habilitar Busca por Número de Peito (Bib)</label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData.verticalConfigs?.enableBibSearch !== false ? 'bg-brand-tactical border-brand-tactical' : 'bg-theme-bg-muted border-theme-border'}`}>
                                {formData.verticalConfigs?.enableBibSearch !== false && <div className="w-2.5 h-2.5 bg-black rounded-sm" />}
                              </div>
                              <input type="checkbox" hidden checked={formData.verticalConfigs?.enableBibSearch !== false} onChange={e => setFormData({ ...formData, verticalConfigs: { ...formData.verticalConfigs, enableBibSearch: e.target.checked }})} />
                            </label>
                          </div>
                        )}
                        <div className="grid grid-cols-2 gap-x-6 gap-y-4 pt-6 border-t border-theme-border/60">
                          {["temFoto", "temVideo", "temReels", "temFotoImpressa", "isCrowdfund", "isPrivate", "preSaleEnabled", "postSaleEnabled"].map(f => (
                            <label key={f} className="flex items-center gap-3 cursor-pointer group">
                              <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${formData[f as keyof EventFormData] ? 'bg-brand-tactical border-brand-tactical shadow-sm shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border group-hover:border-theme-text'}`}>
                                {formData[f as keyof EventFormData] && <div className="w-2.5 h-2.5 bg-black rounded-sm" />}
                              </div>
                              <input type="checkbox" hidden checked={formData[f as keyof EventFormData] as boolean} onChange={e => setFormData({...formData, [f]: e.target.checked})} />
                              <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest transition-all italic ${formData[f as keyof EventFormData] ? 'text-brand-tactical' : 'text-theme-muted'}`}>{f.replace("tem", "").replace("is", "").replace("Enabled", "").replace(/([A-Z])/g, ' $1').trim()}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      {formData.isCrowdfund && (
                        <div className="p-8 bg-brand-tactical/5 border border-brand-tactical/20 rounded-[30px] flex justify-between items-center shadow-inner">
                          <div className="space-y-2">
                            <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest block opacity-60 italic">Meta de Arrecadação</label>
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-black text-brand-tactical">R$</span>
                              <input type="number" className="bg-transparent text-3xl font-black text-theme-text outline-none w-32 italic tracking-tighter" value={formData.targetAmount} onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})} />
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60 italic">Status Atual</span>
                            <span className="text-xl font-black text-brand-tactical italic tracking-tighter">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingEvent?.collectedAmount || 0)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'galeria' && (
                <div className="animate-in fade-in duration-500 space-y-8">
                  <div className="flex items-center justify-between border-b border-theme-border pb-4">
                    <div className="flex items-center gap-6">
                      <h3 className="text-sm font-black uppercase tracking-widest text-theme-text italic">Fotos do Marketplace</h3>
                      {editingEvent && (
                        <button 
                          type="button"
                          onClick={handleSyncDrive}
                          disabled={isSyncing || !formData.driveUrl}
                          className="px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest rounded-lg hover:bg-brand-tactical hover:text-zinc-950 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                          <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                          {isSyncing ? "SYNC..." : "SINCRO DRIVE"}
                        </button>
                      )}
                    </div>
                    <p className="text-[10px] text-theme-muted font-bold uppercase">{eventMedia.length} Itens</p>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    {eventMedia.map((m) => (
                      <div key={m.id} className="bg-theme-bg-muted/50 border border-theme-border/60 rounded-2xl overflow-hidden flex flex-col group shadow-sm">
                        <div className="aspect-square relative overflow-hidden bg-black">
                          <img 
                            src={m.url.length > 50 ? m.url : `${API.defaults.baseURL}/vaults/media/proxy/${m.url}`} 
                            alt={m.shortId} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" 
                          />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-[8px] font-mono text-white border border-white/10 uppercase">{m.shortId}</div>
                        </div>
                        <div className="p-3 space-y-3 bg-theme-card">
                          <div className="space-y-1">
                            <label className="text-[7px] font-black text-theme-muted uppercase tracking-widest block opacity-60">ID Aluno / Bib</label>
                            <input 
                              type="text" 
                              className="w-full bg-theme-bg border border-theme-border/40 p-2 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-lg uppercase transition-all"
                              defaultValue={m.metadata?.studentId || m.metadata?.bibNumber || m.metadata?.identifier || ""}
                              onBlur={(e) => {
                                const val = e.target.value.trim();
                                if (val !== (m.metadata?.studentId || m.metadata?.bibNumber || m.metadata?.identifier)) {
                                  const newMeta = { ...m.metadata };
                                  if (formData.type === 'SCHOOL') newMeta.studentId = val;
                                  else if (formData.type === 'SPORTS') newMeta.bibNumber = val;
                                  else newMeta.identifier = val;
                                  handleUpdateMediaMetadata(m.id, newMeta);
                                }
                              }}
                              placeholder="EDITAR ID"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {eventMedia.length === 0 && (
                    <div className="py-20 text-center border-2 border-dashed border-theme-border/40 rounded-[30px] bg-theme-bg-muted/30">
                      <Image size={40} className="mx-auto text-theme-muted/30 mb-4" strokeWidth={1} />
                      <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Administração de Coberturas Fotográficas</p>
                      <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Administração de Coberturas Fotográficas</p>
                    </div>
                  )}
                </div>
              )}
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button type="button" onClick={() => setIsModalOpen(false)} className="fs-btn flex-1 border border-theme-border text-theme-muted hover:text-white transition-all italic">Cancelar</button>
              {activeTab !== 'comercial' ? (
                <button 
                  type="button" 
                  onClick={() => { 
                    const t: Array<'info' | 'equipe' | 'comercial' | 'galeria'> = ['info','equipe','comercial','galeria']; 
                    const currentIndex = t.indexOf(activeTab);
                    if (currentIndex < t.length - 1) setActiveTab(t[currentIndex + 1]);
                  }} 
                  className="fs-btn flex-[2] bg-theme-border text-theme-text hover:bg-zinc-700 transition-all italic flex items-center justify-center gap-4"
                >
                  Próximo Passo
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button 
                  type="submit" 
                  onClick={handleCreate}
                  disabled={isUploading} 
                  className="fs-btn flex-[2] bg-brand-tactical text-zinc-950 shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all italic flex items-center justify-center gap-4"
                >
                  {isUploading ? "PROCESSANDO..." : (editingEvent ? "SALVAR ALTERAÇÕES" : "CADASTRAR EVENTO")}
                  <ArrowRight size={14} />
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {qrModalEvent && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setQrModalEvent(null)} />
          
          <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <QrCode className="text-brand-tactical" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Protocolo de Captura</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Ativação Phygital Instantânea</p>
                </div>
              </div>
              <button onClick={() => setQrModalEvent(null)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 space-y-10">
              <div className="text-center space-y-2">
                <h3 className="text-xl font-black text-theme-text uppercase italic tracking-tight">{qrModalEvent.title}</h3>
                <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest italic opacity-40">Distribuição de Acesso Omnichannel</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {/* QR Code de Venda (Álbum) */}
                <div className="bg-theme-bg-muted/50 p-8 rounded-[30px] border border-theme-border/60 flex flex-col items-center gap-6 shadow-inner">
                  <div className="text-center">
                    <h4 className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Vitrine Online</h4>
                    <p className="text-[8px] text-theme-muted uppercase tracking-widest mt-1 italic opacity-60">Para Compra de Fotos</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl">
                    <QRCodeSVG value={`${window.location.origin}/e/${qrModalEvent.slug}`} size={160} level="H" />
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/e/${qrModalEvent.slug}`); setCopied(true); setTimeout(()=>setCopied(false),2000); }} 
                    className="w-full py-4 bg-theme-bg border border-theme-border text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest hover:border-theme-text transition-all rounded-xl italic"
                  >
                    {copied ? "COPIADO!" : "COPIAR LINK ÁLBUM"}
                  </button>
                </div>

                {/* QR Code Phygital (Captura) */}
                <div className="bg-brand-tactical/5 p-8 rounded-[30px] border border-brand-tactical/20 flex flex-col items-center gap-6 shadow-inner">
                  <div className="text-center">
                    <h4 className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Captura Phygital</h4>
                    <p className="text-[8px] text-brand-tactical/60 uppercase tracking-widest mt-1 italic opacity-60">Para Convidados</p>
                  </div>
                  <div className="bg-white p-4 rounded-2xl shadow-xl border-4 border-brand-tactical/20">
                    <QRCodeSVG value={`${window.location.origin}/captura?e=${qrModalEvent.id}`} size={160} level="H" />
                  </div>
                  <button 
                    onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/captura?e=${qrModalEvent.id}`); setNotification({ message: "Link de Captura Copiado!", type: 'success' }); }} 
                    className="w-full py-4 bg-brand-tactical text-zinc-950 text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest hover:brightness-110 transition-all shadow-lg rounded-xl italic"
                  >
                    COPIAR LINK CAPTURA
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border shrink-0 text-center rounded-2xl">
               <button 
                onClick={() => { 
                  const url = `${window.location.origin}/captura?e=${qrModalEvent.id}`; 
                  const w = window.open("", "_blank"); 
                  if(w){ 
                    w.document.write(`
                      <html>
                        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;background:#000;color:#fff;">
                          <div style="border: 2px solid #289a8e; padding: 40px; border-radius: 20px; text-align: center;">
                            <h1 style="text-transform:uppercase;letter-spacing:10px;font-size:24px;margin-bottom:10px;">FOTO SEGUNDO</h1>
                            <p style="text-transform:uppercase;letter-spacing:4px;font-size:10px;opacity:0.6;margin-bottom:30px;">Tire sua foto e receba impressa agora!</p>
                            <div id="q" style="background:#fff;padding:20px;display:inline-block;border-radius:10px;"></div>
                            <h2 style="margin-top:30px;font-size:18px;letter-spacing:2px;">${qrModalEvent.title}</h2>
                            <button onclick="window.print()" style="margin-top:40px;padding:15px 30px;background:#289a8e;border:none;color:#000;font-weight:900;text-transform:uppercase;letter-spacing:2px;cursor:pointer;">Imprimir QR Code</button>
                          </div>
                          <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
                          <script>new QRCode(document.getElementById("q"), {text:"${url}",width:250,height:250,colorDark:"#000000",colorLight:"#ffffff",correctLevel:QRCode.CorrectLevel.H});</script>
                        </body>
                      </html>
                    `); 
                    w.document.close(); 
                  } 
                }} 
                className="w-full py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.4em] text-theme-muted hover:text-white transition-all rounded-[20px] italic flex items-center justify-center gap-4 group"
               >
                 <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} />
                 Gerar Cartaz de Mesa (Print Kit)
                 <ArrowRight className="group-hover:translate-x-2 transition-transform" size={18} />
               </button>
            </div>
          </div>
        </div>
      )}

      {phygitalQueueEvent && (
        <AdminPhygitalQueue 
          eventId={phygitalQueueEvent.id} 
          eventTitle={phygitalQueueEvent.title} 
          onClose={() => setPhygitalQueueEvent(null)} 
        />
      )}

      {notification && (
        <div className="fixed bottom-10 right-10 z-[100] p-6 border border-brand-tactical bg-theme-bg shadow-2xl min-w-[300px] animate-in slide-in-from-right-10 duration-500">
          <div className="flex flex-col gap-1">
             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-brand-tactical">Notificação</span>
             <p className="text-[11px] font-bold text-theme-text uppercase tracking-widest">{notification.message}</p>
          </div>
        </div>
      )}

      {isExpressModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setIsExpressModalOpen(false)} />
          
          <div className="relative w-full max-w-5xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0 bg-theme-bg-muted/30 rounded-2xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Radar className="text-brand-tactical" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Venda Rápida</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Operação Live Print / Marketplace</p>
                </div>
              </div>
              <button onClick={() => setIsExpressModalOpen(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <form onSubmit={handleExpressSaleSubmit} className="flex-1 overflow-y-auto p-8 md:p-10 space-y-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Identificação do Cliente</label>
                    <input 
                      type="email" 
                      required 
                      className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl placeholder:opacity-20" 
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
                      placeholder="EMAIL DO CLIENTE" 
                    />
                    <input type="text" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl uppercase placeholder:opacity-20" value={expressFormData.customerName} onChange={e => setExpressFormData({...expressFormData, customerName: e.target.value})} placeholder="NOME COMPLETO" />
                    <input type="text" className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl placeholder:opacity-20" value={expressFormData.whatsapp} onChange={e => setExpressFormData({...expressFormData, whatsapp: e.target.value})} placeholder="WHATSAPP (00) 00000-0000" />
                  </div>
                  
                  <div className="pt-6 border-t border-theme-border/60">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-6 opacity-60 italic">Serviços Habilitados</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["FOTO DIGITAL", "FOTO IMPRESSA", "VIDEO", "REELS"].map(s => (
                        <label key={s} className="flex items-center gap-3 cursor-pointer group">
                          <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${expressFormData.services.includes(s) ? 'bg-brand-tactical border-brand-tactical shadow-sm shadow-brand-tactical/20' : 'bg-theme-bg-muted border-theme-border group-hover:border-theme-text'}`}>
                            {expressFormData.services.includes(s) && <div className="w-2.5 h-2.5 bg-black rounded-sm" />}
                          </div>
                          <input 
                            type="checkbox" 
                            hidden
                            checked={expressFormData.services.includes(s)}
                            onChange={e => {
                              const newServices = e.target.checked 
                                ? [...expressFormData.services, s]
                                : expressFormData.services.filter(x => x !== s);
                              setExpressFormData({...expressFormData, services: newServices});
                            }}
                          />
                          <span className={`text-[10px] font-black uppercase tracking-widest transition-all italic ${expressFormData.services.includes(s) ? 'text-brand-tactical' : 'text-theme-muted'}`}>{s}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60 italic">Valor Transação</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-tactical font-black italic">R$</span>
                        <input type="number" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 pl-12 text-xl text-theme-text outline-none font-black rounded-xl italic tracking-tighter" value={expressFormData.amount} onChange={e => setExpressFormData({...expressFormData, amount: Number(e.target.value)})} />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60 italic">Local Operação</label>
                      <input type="text" required className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[11px] text-theme-text outline-none font-black rounded-xl uppercase" value={expressFormData.location} onChange={e => setExpressFormData({...expressFormData, location: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60 italic">Método de Pagamento</label>
                    <div className="flex gap-4">
                      {(["MONEY", "PIX", "CARD"] as const).map(m => (
                        <button 
                          key={m} 
                          type="button" 
                          onClick={() => setExpressFormData({...expressFormData, paymentMethod: m})} 
                          className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest border transition-all rounded-xl italic ${expressFormData.paymentMethod === m ? 'bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg shadow-brand-tactical/20' : 'bg-theme-bg-muted text-theme-muted border-theme-border hover:border-theme-text'}`}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-brand-tactical/5 border border-brand-tactical/20 p-8 rounded-[30px] shadow-inner text-center">
                    <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">⚠ ESTA OPERAÇÃO É FINALIZADA EM TEMPO REAL. SE FOR DIGITAL (CARD/PIX), UM LINK DE CHECKOUT SERÁ GERADO AUTOMATICAMENTE.</p>
                  </div>
                </div>
              </div>
            </form>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button type="button" onClick={() => setIsExpressModalOpen(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                type="submit" 
                onClick={handleExpressSaleSubmit}
                disabled={isUploading} 
                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4 disabled:opacity-50"
              >
                {isUploading ? "PROCESSANDO..." : "FINALIZAR VENDA"}
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setConfirmDelete(null)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20">
                  <Trash2 className="text-red-500" size={24} strokeWidth={1.5} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Eliminar Evento</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40 text-red-500/60">Protocolo de Purga Permanente</p>
                </div>
              </div>
              <button onClick={() => setConfirmDelete(null)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="p-8 md:p-10 space-y-6">
              <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">VOCÊ ESTÁ PRESTES A EXCLUIR O EVENTO <span className="text-theme-text font-black underline decoration-red-500/50 decoration-4 underline-offset-4">{confirmDelete.title}</span>.</p>
              
              <div className="bg-red-500/5 border border-red-500/20 p-6 rounded-[24px]">
                <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">⚠ SE HOUVER PEDIDOS APROVADOS, O EVENTO SERÁ APENAS DESATIVADO PARA PRESERVAÇÃO DE DADOS. CASO CONTRÁRIO, SERÁ REMOVIDO PERMANENTEMENTE DO CORE.</p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0 rounded-2xl">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                onClick={() => handleDelete(confirmDelete.id)}
                className="flex-[2] py-5 bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-red-600/20 hover:bg-red-500 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                Confirmar Exclusão
                <Trash2 size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

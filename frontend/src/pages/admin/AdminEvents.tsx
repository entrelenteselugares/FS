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
  active: boolean;
  coverPhotoUrl?: string | null;
  lightroomUrl?: string | null;
  driveUrl?: string | null;
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
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  interface EventFormData {
    title: string;
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
  }

  // Form State
  const [formData, setFormData] = useState<EventFormData>({
    title: "", date: "", location: "", city: "", description: "",
    priceBase: 200, priceEarly: 190,
    cartorioId: "", captacaoId: "", edicaoId: "",
    temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
    coverPhotoUrl: "",
    eventHours: 2,
    isCrowdfund: false,
    targetAmount: 0
  });

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
        title: "", date: "", location: "", city: "", description: "",
        priceBase: 200, priceEarly: 190,
        cartorioId: "", captacaoId: "", edicaoId: "",
        temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
        coverPhotoUrl: "", eventHours: 2,
        isCrowdfund: false,
        targetAmount: 0
      });
      setCoverPreview(null);
    } catch {
      alert("Erro ao processar evento.");
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
        targetAmount: Number(data.targetAmount || 0)
      });
      setCoverPreview(data.coverPhotoUrl);
      setIsModalOpen(true);
    } catch {
      alert("Erro ao carregar detalhes do evento.");
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
              title: "", date: "", location: "", city: "", description: "",
              priceBase: 200, priceEarly: 190,
              cartorioId: "", captacaoId: "", edicaoId: "",
              temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
              coverPhotoUrl: "", eventHours: 2,
              isCrowdfund: false,
              targetAmount: 0
            });
            setCoverPreview(null);
            setIsModalOpen(true);
          }}
          className="font-black uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[10px]"
          style={{ backgroundColor: 'var(--brand-tactical)', color: 'var(--theme-text-on-brand)' }}
        >
          NOVO REGISTRO
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${T.border}` }}>
              {["Evento", "Data", "Produção", "Vendas", "Membros", "Ações"].map((h) => (
                <th key={h} style={{ 
                  padding: "16px 20px", fontSize: 10, fontFamily: T.fontB, fontWeight: 700, 
                  textTransform: "uppercase", letterSpacing: 1.5, color: T.text3 
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
            ) : events.map((event: any, idx) => (
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
                <td style={{ padding: "20px" }}>
                  <div style={{ fontSize: 13, fontFamily: T.fontB, fontWeight: 500, color: T.text }}>
                    {event.title}
                  </div>
                  <div style={{ fontSize: 11, fontFamily: T.fontB, color: T.text3, marginTop: 4 }}>
                    {event.location}
                  </div>
                </td>

                {/* Data */}
                <td style={{ padding: "20px", fontSize: 12, fontFamily: T.fontB, color: T.text2 }}>
                  {new Date(event.date).toLocaleDateString("pt-BR")}
                </td>

                {/* Produção */}
                <td style={{ padding: "20px" }}>
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
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ 
                      fontSize: 12, fontFamily: T.fontB, fontWeight: 700, 
                      color: event._count?.pedidos > 0 ? T.brand : T.text3 
                    }}>
                      {event._count?.pedidos || 0}
                    </div>
                    {event._count?.pedidos > 0 && (
                      <span style={{ fontSize: 8, color: T.brand, border: `1px solid ${T.brand}44`, padding: "2px 4px", fontWeight: 900 }}>HOT</span>
                    )}
                  </div>
                </td>

                {/* Membros */}
                <td style={{ padding: "20px" }}>
                   <div style={{ fontSize: 10, color: T.text, fontWeight: 600 }}>{event.captacao?.nome || "—"}</div>
                   <div style={{ fontSize: 9, color: T.text3 }}>{event.edicao?.nome || "—"}</div>
                </td>

                {/* Ações */}
                <td style={{ padding: "20px" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button 
                      onClick={() => { setQrModalEvent(event); setCopied(false); }}
                      style={{ 
                        background: "transparent", border: "none", color: T.text3, 
                        cursor: "pointer", display: "flex", alignItems: "center" 
                      }}
                      title="Gerar QR Code"
                    >
                      <QrCode size={14} />
                    </button>
                    <button 
                      onClick={() => handleEditOpen(event)}
                      style={{ 
                        background: "transparent", border: "none", color: T.brand, 
                        fontSize: 9, fontWeight: 900, textTransform: "uppercase", 
                        letterSpacing: 1, cursor: "pointer", borderBottom: `1px solid ${T.brand}`
                      }}
                    >
                      Configurar
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

             <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
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

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Nome do Evento (Noivos)</label>
                    <input 
                      required
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Data do Evento</label>
                      <input 
                        type="date" required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Local do Registro</label>
                      <input 
                        required
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Horas de Trabalho</label>
                    <input 
                      type="number"
                      required
                      value={formData.eventHours}
                      onChange={e => setFormData({...formData, eventHours: Number(e.target.value)})}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                  
                  <div className="space-y-4">
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
                  <div className="space-y-6 pt-10 border-t border-theme-border">
                    <label className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.4em]">Equipe Operacional</label>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Unidade Fixa Responsável</label>
                        <select 
                          value={formData.cartorioId}
                          onChange={e => setFormData({...formData, cartorioId: e.target.value})}
                          className="w-full bg-theme-bg-muted border-b border-theme-border py-4 px-4 text-xs text-theme-text focus:outline-none focus:border-brand-tactical appearance-none rounded-none cursor-pointer"
                        >
                          <option value="">SELECIONE A UNIDADE FIXA</option>
                          {users.filter(u => u.role === "UNIDADE" || u.role === "CARTORIO").map(u => (
                            <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                          ))}
                        </select>
                      </div>

                      <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Captação (Artista da Rede)</label>
                          <select 
                            value={formData.captacaoId}
                            onChange={e => setFormData({...formData, captacaoId: e.target.value})}
                            className="w-full bg-theme-bg-muted border-b border-theme-border py-4 px-4 text-xs text-theme-text focus:outline-none focus:border-brand-tactical appearance-none rounded-none cursor-pointer"
                          >
                            <option value="">ARTISTA DA REDE</option>
                            {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                              <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Edição (Artista da Rede)</label>
                          <select 
                            value={formData.edicaoId}
                            onChange={e => setFormData({...formData, edicaoId: e.target.value})}
                            className="w-full bg-theme-bg-muted border-b border-theme-border py-4 px-4 text-xs text-theme-text focus:outline-none focus:border-brand-tactical appearance-none rounded-none cursor-pointer"
                          >
                            <option value="">ARTISTA DA REDE</option>
                            {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                              <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Preço Regular (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceBase}
                        onChange={e => setFormData({...formData, priceBase: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">Preço Antecipado (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceEarly}
                        onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                  </div>

                  {/* Gift Quota / Compra Coletiva Section */}
                  <div className="bg-brand-tactical/5 p-6 border border-brand-tactical/20 space-y-6">
                    <label className="flex items-center gap-3 cursor-pointer group">
                      <input 
                        type="checkbox"
                        checked={formData.isCrowdfund}
                        onChange={e => setFormData({...formData, isCrowdfund: e.target.checked})}
                        className="w-5 h-5 border-zinc-800 bg-transparent rounded-none checked:bg-brand-tactical focus:ring-0 appearance-none border transition-all"
                      />
                      <span className="text-[10px] text-brand-tactical uppercase tracking-[0.3em] font-bold">
                        ATIVAR MODO COMPRA COLETIVA (VAQUINHA)
                      </span>
                    </label>

                    {formData.isCrowdfund && (
                      <div className="space-y-2 animate-in slide-in-from-top-1 duration-300">
                        <label className="text-[9px] font-bold text-theme-muted/60 uppercase tracking-[0.4em]">VALOR TOTAL DA META (R$)</label>
                        <input 
                          type="number"
                          value={formData.targetAmount}
                          onChange={e => setFormData({...formData, targetAmount: Number(e.target.value)})}
                          className="w-full bg-theme-bg-muted border-b border-theme-border py-2 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all"
                        />
                      </div>
                    )}
                  </div>

                  <div className="pt-10">
                    <button
                      type="submit"
                      disabled={isUploading}
                      className="w-full font-black uppercase tracking-[0.3em] py-4 text-[10px] hover:brightness-110 active:scale-[0.98] transition-all rounded-none"
                      style={{ backgroundColor: 'var(--brand-primary)', color: 'var(--theme-text-on-brand)' }}
                    >
                      {isUploading ? "PROCESSANDO..." : (editingEvent ? "SALVAR ALTERAÇÕES" : "SINCRONIZAR ARQUIVO")}
                    </button>
                  </div>
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
                value={`${window.location.origin}/e/${qrModalEvent.id}`}
                size={220}
                level="H"
                includeMargin={true}
              />
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/e/${qrModalEvent.id}`;
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
    </div>
  );
};

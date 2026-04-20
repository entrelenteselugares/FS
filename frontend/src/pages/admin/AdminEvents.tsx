import React, { useState, useEffect } from "react";
import { API } from "../../lib/api";

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
  _count: { orders: number };
}

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
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
      // Carregar evento completo (detalhes extras) para edição
      const { data } = await API.get(`/public/events/${event.id}`);
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
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase">Logística de Eventos</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-bold italic">Curadoria e Gestão de Operações</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="font-black uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none text-[10px]"
          style={{ backgroundColor: 'var(--brand-tactical)', color: 'var(--theme-text-on-brand)' }}
        >
          NOVO REGISTRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[10px] text-theme-muted uppercase tracking-widest animate-pulse bg-theme-bg-muted">Indexando Eventos...</div>
        ) : events.map(event => (
          <div key={event.id} className="group border border-theme-border bg-theme-bg-muted hover:bg-theme-bg transition-all relative overflow-hidden flex flex-col">
            {/* Visual Preview */}
            <div className="aspect-video w-full overflow-hidden bg-theme-bg border-b border-theme-border">
              {event.coverPhotoUrl ? (
                <img 
                  src={event.coverPhotoUrl} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center opacity-20">
                  <span className="text-[8px] tracking-[0.4em] uppercase text-theme-text">Sem Capa</span>
                </div>
              )}
            </div>

            <div className="p-8">
              <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <span className="text-[9px] text-theme-muted font-sans font-black">#{event.id.slice(-6).toUpperCase()}</span>
              </div>
              
              <div className="text-[9px] text-theme-muted uppercase tracking-[0.4em] font-black mb-3 italic opacity-60">
                {new Date(event.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
              </div>
              
              <h3 className="text-xl font-heading text-theme-text group-hover:text-brand-primary transition-colors mb-2 uppercase tracking-tighter font-black line-clamp-1">
                {event.title}
              </h3>
              
              <div className="text-[9px] text-theme-muted uppercase tracking-[0.2em] mb-6 border-b border-theme-border pb-4 font-black">
                {event.location}
              </div>
  
              <div className="flex items-center justify-between">
                <div className="text-[9px] text-theme-muted font-black uppercase tracking-[0.3em] italic">
                  {event._count.orders} ADQUIRIDOS
                </div>
                <button 
                  onClick={() => handleEditOpen(event)}
                  className="text-[9px] font-black text-theme-text uppercase tracking-[0.2em] border-b border-brand-primary pb-1 hover:border-brand-tactical transition-all"
                >
                  CONFIGURAR
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-theme-bg/95 backdrop-blur-xl z-50 flex items-start justify-center p-4 overflow-y-auto pt-10">
          <div className="w-full max-w-4xl bg-theme-bg border border-theme-border p-8 relative animate-in zoom-in-95 duration-300 mb-10">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white transition-colors">
               <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
             </button>

             <div className="mb-8">
               <h2 className="text-3xl font-heading text-white tracking-tighter uppercase mb-2">
                 {editingEvent ? "Ajustar Operação" : "Novo Registro"}
               </h2>
               <div className="w-12 h-1 bg-brand-tactical" />
             </div>

             <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Capa da Vitrine</label>
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
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Nome do Evento (Noivos)</label>
                    <input 
                      required
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Data do Evento</label>
                      <input 
                        type="date" required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Local do Registro</label>
                      <input 
                        required
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Horas de Trabalho</label>
                    <input 
                      type="number"
                      required
                      value={formData.eventHours}
                      onChange={e => setFormData({...formData, eventHours: Number(e.target.value)})}
                      className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Serviços Inclusos</label>
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
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Profissional (Captação)</label>
                    <select 
                      value={formData.captacaoId}
                      onChange={e => setFormData({...formData, captacaoId: e.target.value})}
                      className="w-full bg-theme-bg-muted border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical appearance-none rounded-none"
                    >
                      <option value="">NÃO ATRIBUÍDO</option>
                      {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                        <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Preço Regular (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceBase}
                        onChange={e => setFormData({...formData, priceBase: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-theme-border py-3 text-sm text-theme-text focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Preço Antecipado (R$)</label>
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
                        <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-[0.4em]">VALOR TOTAL DA META (R$)</label>
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
    </div>
  );
};

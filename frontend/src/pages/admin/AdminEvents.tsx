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
  _count: { orders: number };
}

export const AdminEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
  }

  // Form State
  const [formData, setFormData] = useState<EventFormData>({
    title: "", date: "", location: "", city: "", description: "",
    priceBase: 200, priceEarly: 190,
    cartorioId: "", captacaoId: "", edicaoId: "",
    temFoto: true, temVideo: false, temReels: false, temFotoImpressa: false,
    coverPhotoUrl: ""
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
      // 1. Cria o evento
      const { data: event } = await API.post("/admin/events", formData);
      
      // 2. Se houver imagem no preview, faz o upload separado
      if (coverPreview) {
        await API.patch(`/admin/events/${event.id}/cover`, {
          imageBase64: coverPreview,
          mimeType: "image/jpeg" 
        });
      }

      const updatedEvents = await API.get("/admin/events");
      setEvents(updatedEvents.data.events || []);
      setIsModalOpen(false);
      setCoverPreview(null);
    } catch {
      alert("Erro ao criar evento ou processar capa.");
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
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Logística de Eventos</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Curadoria e Gestão de Operações</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-tactical text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 text-white hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 rounded-none"
        >
          NOVO REGISTRO
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest animate-pulse bg-black">Indexando Eventos...</div>
        ) : events.map(event => (
          <div key={event.id} className="group border border-white/5 p-8 bg-white/[0.01] hover:bg-white/[0.02] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] text-zinc-700 font-mono">#{event.id.slice(-6).toUpperCase()}</span>
            </div>
            
            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.4em] font-bold mb-4 italic opacity-60">
              {new Date(event.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </div>
            
            <h3 className="text-2xl font-heading text-white group-hover:text-brand-tactical transition-colors mb-2 uppercase tracking-tighter font-bold">
              {event.title}
            </h3>
            
            <div className="text-[10px] text-zinc-600 uppercase tracking-[0.2em] mb-8 border-b border-white/5 pb-4 font-bold">
              {event.location}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-[0.3em] italic">
                {event._count.orders} ADQUIRIDOS
              </div>
              <button className="text-[10px] font-bold text-white uppercase tracking-[0.2em] border-b border-brand-tactical pb-1 hover:border-white transition-all">
                CONFIGURAR
              </button>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#080808] border border-white/5 p-12 relative animate-in zoom-in-95 duration-300">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l13 13"/></svg>
             </button>

             <div className="mb-12">
               <h2 className="text-4xl font-heading text-white tracking-tighter uppercase mb-2">Novo Arquivo</h2>
               <div className="w-16 h-1.5 bg-brand-tactical" />
             </div>

             <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Capa da Vitrine</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video bg-black border border-zinc-900 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative rounded-none"
                    >
                      {coverPreview ? (
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="text-center group-hover:text-brand-tactical transition-colors">
                          <div className="text-2xl mb-2">📸</div>
                          <div className="text-[9px] uppercase tracking-[0.3em] text-zinc-700 font-bold">Upload Capa</div>
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
                      className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Data do Evento</label>
                      <input 
                        type="date" required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all invert brightness-150 rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Local do Registro</label>
                      <input 
                        required
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
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
                      className="w-full bg-black border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical appearance-none rounded-none"
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
                        className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Preço Antecipado (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceEarly}
                        onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-zinc-900 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical transition-all rounded-none" 
                      />
                    </div>
                  </div>

                  <div className="pt-10">
                    <button type="submit" className="w-full bg-brand-tactical text-white font-bold uppercase tracking-[0.4em] py-6 text-[11px] hover:brightness-110 transition-all rounded-none shadow-[0_10px_30px_rgba(93,101,50,0.2)]">
                      SINCRONIZAR ARQUIVO
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

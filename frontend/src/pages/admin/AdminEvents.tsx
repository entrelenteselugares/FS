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
  
  // Form State
  const [formData, setFormData] = useState({
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
    } catch (err) {
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
          <h2 className="text-3xl font-serif text-white italic tracking-tight">Arquivos de Eventos</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.4em] mt-2 font-bold">Curadoria e Gestão de Ativos</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-olive text-[10px] font-bold uppercase tracking-[0.3em] px-8 py-4 text-white hover:bg-olive-700 transition-all shadow-xl shadow-brand-olive/10"
        >
          Novo Registro
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {loading ? (
          <div className="col-span-full py-20 text-center text-[10px] text-zinc-700 uppercase tracking-widest animate-pulse">Indexando Eventos...</div>
        ) : events.map(event => (
          <div key={event.id} className="group border border-white/5 p-8 bg-white/[0.01] hover:bg-white/[0.02] transition-all relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[9px] text-zinc-700 font-mono">#{event.id.slice(-6).toUpperCase()}</span>
            </div>
            
            <div className="text-[9px] text-zinc-500 uppercase tracking-[0.3em] font-bold mb-4">
              {new Date(event.date).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </div>
            
            <h3 className="text-xl font-serif text-white group-hover:text-brand-olive transition-colors mb-2 italic">
              {event.title}
            </h3>
            
            <div className="text-[10px] text-zinc-600 uppercase tracking-widest mb-8 border-b border-white/5 pb-4">
              {event.location}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest italic">
                {event._count.orders} Adquiridos
              </div>
              <button className="text-[10px] font-bold text-white uppercase tracking-[0.2em] border-b border-brand-olive pb-1 hover:border-white transition-all">
                Configurar
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Editorial */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-50 flex items-center justify-center p-6 overflow-y-auto">
          <div className="w-full max-w-4xl bg-[#080808] border border-white/5 p-12 relative animate-in zoom-in-95 duration-300">
             <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-500 hover:text-white">
               <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l13 13"/></svg>
             </button>

             <div className="mb-12">
               <h2 className="text-4xl font-serif text-white italic mb-2">Novo Arquivo</h2>
               <div className="w-12 h-1 bg-brand-olive" />
             </div>

             <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                <div className="space-y-8">
                  {/* Upload de Capa */}
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Capa da Vitrine</label>
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full aspect-video bg-black border border-white/5 flex flex-col items-center justify-center cursor-pointer overflow-hidden group relative"
                    >
                      {coverPreview ? (
                        <img src={coverPreview} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      ) : (
                        <div className="text-center group-hover:text-brand-olive transition-colors">
                          <div className="text-xl mb-2">📸</div>
                          <div className="text-[9px] uppercase tracking-widest text-zinc-700 font-bold">Upload Capa</div>
                        </div>
                      )}
                      {isUploading && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-[9px] text-white uppercase tracking-widest animate-pulse">Processando...</div>}
                    </div>
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Nome do Evento (Noivos)</label>
                    <input 
                      required
                      value={formData.title} 
                      onChange={e => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Data do Evento</label>
                      <input 
                        type="date" required
                        value={formData.date}
                        onChange={e => setFormData({...formData, date: e.target.value})}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all invert brightness-150" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Local do Registro</label>
                      <input 
                        required
                        value={formData.location}
                        onChange={e => setFormData({...formData, location: e.target.value})}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Serviços Inclusos</label>
                    <div className="grid grid-cols-2 gap-4">
                      {["temFoto", "temVideo", "temReels", "temFotoImpressa"].map(serv => (
                        <label key={serv} className="flex items-center gap-3 cursor-pointer group">
                          <input 
                            type="checkbox"
                            checked={(formData as any)[serv]}
                            onChange={e => setFormData({...formData, [serv]: e.target.checked})}
                            className="w-4 h-4 border-white/10 bg-transparent rounded-none checked:bg-brand-olive focus:ring-0 appearance-none border transition-all"
                          />
                          <span className="text-[10px] text-zinc-500 uppercase tracking-widest group-hover:text-white transition-all">
                            {serv.replace("tem", "").replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-2">
                    <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Profissional (Captação)</label>
                    <select 
                      value={formData.captacaoId}
                      onChange={e => setFormData({...formData, captacaoId: e.target.value})}
                      className="w-full bg-black border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive appearance-none"
                    >
                      <option value="">NÃO ATRIBUÍDO</option>
                      {users.filter(u => u.role === "PROFISSIONAL").map(u => (
                        <option key={u.id} value={u.id}>{u.nome.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Preço Regular (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceBase}
                        onChange={e => setFormData({...formData, priceBase: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em]">Preço Antecipado (R$)</label>
                      <input 
                        type="number"
                        value={formData.priceEarly}
                        onChange={e => setFormData({...formData, priceEarly: Number(e.target.value)})}
                        className="w-full bg-transparent border-b border-white/10 py-3 text-sm text-white focus:outline-none focus:border-brand-olive transition-all" 
                      />
                    </div>
                  </div>

                  <div className="pt-10">
                    <button type="submit" className="w-full bg-white text-black font-bold uppercase tracking-[0.3em] py-5 text-[11px] hover:bg-zinc-200 transition-all">
                      Sincronizar Arquivo
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

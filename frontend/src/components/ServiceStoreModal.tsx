import { useState, useEffect } from "react";
import { X, Video, Wand2, Loader2, Sparkles, Plus, Image as ImageIcon } from "lucide-react";
import { API as api } from "../lib/api";
import { useNavigate } from "react-router-dom";
import { T } from "../lib/theme";

interface ServiceStoreModalProps {
  vaultId: string;
  vaultName: string;
  onClose: () => void;
}

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
  estimatedMinutes: number;
}

export function ServiceStoreModal({ vaultId, vaultName, onClose }: ServiceStoreModalProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [internalNotes, setInternalNotes] = useState("");
  const [referenceUrl, setReferenceUrl] = useState("");
  const [soundtrackSuggestion, setSoundtrackSuggestion] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await api.get('/public/services/vault');
      setServices(res.data);
    } catch (error) {
      console.error("Erro ao buscar serviços:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBuy = async (service: Service) => {
    setBuying(service.id);
    try {
      const res = await api.post(`/vaults/${vaultId}/services/buy`, {
        serviceId: service.id,
        internalNotes: internalNotes || undefined,
        referenceFiles: referenceUrl ? [{ url: referenceUrl, name: "Referência do Cliente" }] : undefined,
        soundtrackSuggestion: soundtrackSuggestion || undefined
      });
      // Redirect to checkout with the created orderId
      if (res.data.orderId) {
        navigate(`/checkout?orderId=${res.data.orderId}`);
      }
    } catch (error: any) {
      console.error("Erro ao comprar serviço:", error);
      alert(error.response?.data?.error || "Erro ao processar compra do serviço.");
      setBuying(null);
    }
  };

  const getIcon = (category: string) => {
    const cat = category?.toUpperCase() || "";
    if (cat.includes("VIDEO") || cat.includes("REELS")) return <Video className="text-blue-500" size={24} />;
    if (cat.includes("RETOQUE") || cat.includes("TRATAMENTO") || cat.includes("EDIÇÃO")) return <Wand2 className="text-purple-400" size={24} />;
    return <Sparkles className="text-theme-brand" size={24} />;
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
          <div>
            <h2 className="text-2xl font-bold uppercase flex items-center gap-2" style={{ color: T.text }}>
              {selectedService ? (
                <button onClick={() => setSelectedService(null)} className="mr-2 hover:opacity-70 transition-opacity">
                  &larr; Voltar
                </button>
              ) : null}
              <Sparkles className="text-theme-brand" />
              {selectedService ? 'Detalhes do Serviço' : 'Serviços de Edição'}
            </h2>
            <p className="text-[11px] text-theme-muted uppercase tracking-widest mt-1">
              Para o cofre: <span className="text-theme-brand font-bold">{vaultName}</span>
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 bg-theme-bg-muted hover:bg-white/10 rounded-full transition-colors text-theme-text"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-theme-brand">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p className="text-[11px] font-bold uppercase tracking-widest">Carregando serviços...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-theme-bg-muted rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                <ImageIcon size={24} className="text-theme-muted" />
              </div>
              <h3 className="text-lg font-bold text-theme-text mb-2">Nenhum serviço disponível</h3>
              <p className="text-theme-muted text-sm">No momento não há serviços de pós-produção liberados para este cofre.</p>
            </div>
          ) : selectedService ? (
            <div className="space-y-6">
              <div className="bg-zinc-800/50 p-4 border border-white/10 rounded-xl mb-4">
                 <h3 className="text-lg font-bold text-theme-text leading-tight">{selectedService.name}</h3>
                 <p className="text-sm text-theme-muted mt-1">{selectedService.description}</p>
                 <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                    <span className="text-xs uppercase font-bold tracking-widest text-theme-muted">Total</span>
                    <span className="text-xl font-bold text-theme-brand">R$ {selectedService.basePrice.toFixed(2).replace('.', ',')}</span>
                 </div>
              </div>

              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-2">Link de Referência (Opcional)</label>
                <input type="text" placeholder="Ex: Link do Google Drive, YouTube, Pinterest..."
                  value={referenceUrl} onChange={e => setReferenceUrl(e.target.value)}
                  className="w-full bg-black border border-white/10 p-3 text-sm text-theme-text outline-none focus:border-emerald-500 transition-colors rounded-lg"
                />
                <p className="text-[10px] text-theme-muted mt-1">Insira um link para mostrar como deseja que o material fique.</p>
              </div>

              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-2">Sugestão de Trilha Sonora (Opcional)</label>
                <input type="text" placeholder="Ex: Nome da música, artista, link do Spotify..."
                  value={soundtrackSuggestion} onChange={e => setSoundtrackSuggestion(e.target.value)}
                  className="w-full bg-black border border-white/10 p-3 text-sm text-theme-text outline-none focus:border-emerald-500 transition-colors rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-bold mb-2">Observações e Orientações (Opcional)</label>
                <textarea placeholder="Escreva aqui detalhes importantes para a edição, como cores, cortes, estilos..."
                  value={internalNotes} onChange={e => setInternalNotes(e.target.value)}
                  className="w-full bg-black border border-white/10 p-3 text-sm text-theme-text outline-none focus:border-emerald-500 transition-colors rounded-lg min-h-[100px]"
                />
              </div>

              <div className="pt-4 border-t border-white/10 flex justify-end gap-3">
                 <button
                    onClick={() => setSelectedService(null)}
                    className="px-4 py-2 border border-white/10 rounded-lg text-xs font-bold uppercase tracking-widest hover:bg-theme-bg-muted transition-colors"
                 >
                    Cancelar
                 </button>
                 <button
                    onClick={() => handleBuy(selectedService)}
                    disabled={buying !== null}
                    className="bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-theme-text px-6 py-2 rounded-lg font-bold uppercase tracking-widest text-xs transition-all flex items-center gap-2 active:scale-95"
                 >
                    {buying === selectedService.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      "Confirmar e Pagar"
                    )}
                 </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {services.map((service) => (
                <div 
                  key={service.id}
                  className="bg-zinc-800/50 border border-white/10 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-zinc-800 transition-all group flex flex-col"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 bg-black/40 rounded-xl flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform">
                      {getIcon(service.category)}
                    </div>
                    <div className="px-2 py-1 bg-theme-bg-muted text-theme-subtle text-[9px] font-bold uppercase tracking-widest rounded">
                      {service.category || "Pós-Produção"}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-theme-text mb-1 leading-tight">{service.name}</h3>
                  <p className="text-xs text-theme-muted mb-4 flex-1 line-clamp-3">
                    {service.description || "Contrate este serviço para elevar a qualidade do seu material."}
                  </p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
                    <div>
                      <span className="text-[10px] text-theme-muted uppercase font-bold block">Investimento</span>
                      <span className="text-xl font-bold text-theme-brand">R$ {service.basePrice.toFixed(2).replace('.', ',')}</span>
                    </div>
                    
                    <button
                      onClick={() => setSelectedService(service)}
                      className="bg-emerald-500 hover:bg-emerald-400 text-theme-text px-4 py-2 rounded-lg font-bold uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 active:scale-95"
                    >
                      <Plus size={14} />
                      Contratar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

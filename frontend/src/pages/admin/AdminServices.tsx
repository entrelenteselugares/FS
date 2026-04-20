import React, { useState } from "react";
import { Briefcase, Plus, Trash2, Edit3, Save } from "lucide-react";

interface Service {
  id: string;
  name: string;
  description: string;
  basePrice: number;
  category: string;
}

export const AdminServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([
    { id: "1", name: "Foto Digital (Bruta)", description: "Transferência de arquivos brutos via WiFi/Link.", basePrice: 190, category: "FOTOGRAFIA" },
    { id: "2", name: "Foto Digital + 01 Impressa", description: "Fotos editadas + 1 print 10x15 incluso no local.", basePrice: 250, category: "FOTOGRAFIA" },
    { id: "3", name: "Vídeo Bruto (Clipes)", description: "Todos os clipes HD captados durante o evento.", basePrice: 190, category: "CINEMATOGRAFIA" },
    { id: "4", name: "Vídeo Editado (Full HD)", description: "Filme editado de aproximadamente 10 minutos.", basePrice: 650, category: "CINEMATOGRAFIA" },
    { id: "5", name: "Reels / Social Media", description: "Vídeo vertical editado para redes sociais.", basePrice: 120, category: "SOCIAL" },
    { id: "6", name: "Álbum Impresso (Completo)", description: "Álbum físico com curadoria de 36 fotos.", basePrice: 420, category: "PRODUTOS" },
  ]);

  const [isAdding, setIsAdding] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [newService, setNewService] = useState({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });

  const handleAdd = () => {
    if (!newService.name) return;
    if (editingService) {
      setServices(services.map(s => s.id === editingService.id ? { ...newService, id: editingService.id } : s));
    } else {
      setServices([...services, { ...newService, id: Date.now().toString() }]);
    }
    setIsAdding(false);
    setEditingService(null);
    setNewService({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });
  };

  const handleEditOpen = (service: Service) => {
    setEditingService(service);
    setNewService({
      name: service.name,
      description: service.description,
      basePrice: service.basePrice,
      category: service.category
    });
    setIsAdding(true);
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-theme-border pb-8">
        <div>
          <h2 className="text-4xl font-heading text-theme-text tracking-tighter uppercase font-black">Catálogo de Serviços</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-black italic">Configuração de Produtos e Tabelas de Preço</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all rounded-none flex items-center gap-2 shadow-xl shadow-brand-tactical/10"
        >
          <Plus size={14} /> ADICIONAR SERVIÇO
        </button>
      </div>

      {isAdding && (
        <div className="bg-white/[0.02] border border-brand-tactical/30 p-10 animate-in slide-in-from-top-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Nome do Serviço</label>
              <input 
                value={newService.name}
                onChange={e => setNewService({...newService, name: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical"
                placeholder="Ex: Foto Impressa Extra"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Descrição Curta</label>
              <input 
                value={newService.description}
                onChange={e => setNewService({...newService, description: e.target.value})}
                className="w-full bg-transparent border-b border-zinc-800 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical"
                placeholder="O que está incluso no pacote?"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.4em]">Preço Base (R$)</label>
              <input 
                type="number"
                value={newService.basePrice}
                onChange={e => setNewService({...newService, basePrice: Number(e.target.value)})}
                className="w-full bg-transparent border-b border-zinc-800 py-3 text-sm text-white focus:outline-none focus:border-brand-tactical"
              />
            </div>
          </div>
          <div className="mt-10 flex gap-4">
            <button onClick={handleAdd} className="bg-brand-tactical text-black text-[10px] font-bold uppercase tracking-widest px-8 py-3 rounded-none flex items-center gap-2">
              <Save size={14} /> {editingService ? "SALVAR ALTERAÇÕES" : "SALVAR NOVO SERVIÇO"}
            </button>
            <button onClick={() => { setIsAdding(false); setEditingService(null); setNewService({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" }); }} className="text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition-all">CANCELAR</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 px-10 py-4 text-[9px] font-black text-theme-muted uppercase tracking-[0.4em] border-b border-theme-border bg-theme-bg-muted/50">
          <div className="col-span-1">Categoria</div>
          <div className="col-span-4">Serviço / Descrição</div>
          <div className="col-span-3 text-right">Preço Sugerido</div>
          <div className="col-span-4 text-right">Ações Operacionais</div>
        </div>

        {services.map(s => (
          <div key={s.id} className="bg-theme-bg-muted hover:bg-theme-bg transition-all border border-theme-border group">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-6">
              <div className="col-span-1">
                <span className="text-[8px] font-black text-theme-muted border border-theme-border px-2 py-0.5 rounded-none">{s.category}</span>
              </div>
              <div className="col-span-4">
                <div className="text-sm font-black text-theme-text uppercase tracking-tighter">{s.name}</div>
                <div className="text-[10px] text-theme-muted font-bold uppercase tracking-wider truncate mt-0.5 opacity-60 leading-relaxed">{s.description}</div>
              </div>
              <div className="col-span-3 text-right">
                <div className="text-sm font-sans font-black text-brand-tactical tracking-widest">R$ {s.basePrice},00</div>
              </div>
              <div className="col-span-4 flex justify-end gap-6 opacity-30 group-hover:opacity-100 transition-all">
                <button 
                  onClick={() => handleEditOpen(s)}
                  className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] hover:text-theme-text flex items-center gap-2"
                >
                  <Edit3 size={11} /> Ajustar
                </button>
                <button onClick={() => removeService(s.id)} className="text-[9px] font-black text-red-500 uppercase tracking-[0.3em] hover:text-red-400 flex items-center gap-2">
                  <Trash2 size={11} /> Remover
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-20 p-10 border border-white/5 bg-white/[0.02] flex items-center gap-8">
        <Briefcase className="text-zinc-800" size={32} />
        <div>
          <h4 className="text-white text-[11px] font-bold uppercase tracking-widest mb-1 italic">Nota Fiscal e Taxas</h4>
          <p className="text-zinc-600 text-[9px] uppercase tracking-widest leading-relaxed">Os preços acima são apenas base para o gerador de orçamentos. Alterações aqui não afetam eventos que já possuem contratos ativos.</p>
        </div>
      </div>
    </div>
  );
};

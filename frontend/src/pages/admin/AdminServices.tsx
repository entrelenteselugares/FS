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
  const [newService, setNewService] = useState({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });

  const handleAdd = () => {
    if (!newService.name) return;
    setServices([...services, { ...newService, id: Date.now().toString() }]);
    setIsAdding(false);
    setNewService({ name: "", description: "", basePrice: 0, category: "FOTOGRAFIA" });
  };

  const removeService = (id: string) => {
    setServices(services.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center justify-between border-b border-white/5 pb-8">
        <div>
          <h2 className="text-4xl font-heading text-white tracking-tighter uppercase">Catálogo de Serviços</h2>
          <p className="text-[10px] text-zinc-600 uppercase tracking-[0.5em] mt-2 font-bold italic">Configuração de Produtos e Tabelas de Preço</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-brand-tactical text-white text-[10px] font-bold uppercase tracking-[0.4em] px-10 py-5 hover:brightness-110 transition-all rounded-none flex items-center gap-2"
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
            <button onClick={handleAdd} className="bg-brand-tactical text-white text-[10px] font-bold uppercase tracking-widest px-8 py-3 rounded-none flex items-center gap-2">
              <Save size={14} /> SALVAR NOVO SERVIÇO
            </button>
            <button onClick={() => setIsAdding(false)} className="text-[10px] text-zinc-600 uppercase tracking-widest hover:text-white transition-all">CANCELAR</button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <div className="grid grid-cols-12 gap-4 px-10 py-4 text-[9px] font-bold text-zinc-700 uppercase tracking-[0.4em] border-b border-white/5 bg-white/[0.02]">
          <div className="col-span-1">Categoria</div>
          <div className="col-span-4">Serviço / Descrição</div>
          <div className="col-span-3 text-right">Preço Sugerido</div>
          <div className="col-span-4 text-right">Ações Operacionais</div>
        </div>

        {services.map(s => (
          <div key={s.id} className="bg-black hover:bg-white/[0.02] border border-white/5 transition-all group">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center px-10 py-6">
              <div className="col-span-1">
                <span className="text-[8px] font-bold text-zinc-600 border border-zinc-800 px-2 py-0.5 rounded-none">{s.category}</span>
              </div>
              <div className="col-span-4">
                <div className="text-sm font-bold text-white uppercase tracking-tighter">{s.name}</div>
                <div className="text-[10px] text-zinc-700 font-bold uppercase tracking-wider truncate mt-0.5 opacity-60 leading-relaxed">{s.description}</div>
              </div>
              <div className="col-span-3 text-right">
                <div className="text-sm font-mono font-bold text-brand-tactical tracking-widest">R$ {s.basePrice},00</div>
              </div>
              <div className="col-span-4 flex justify-end gap-6 opacity-30 group-hover:opacity-100 transition-all">
                <button className="text-[9px] font-bold text-zinc-600 uppercase tracking-[0.3em] hover:text-white flex items-center gap-2">
                  <Edit3 size={11} /> Ajustar
                </button>
                <button onClick={() => removeService(s.id)} className="text-[9px] font-bold text-red-900/50 uppercase tracking-[0.3em] hover:text-red-500 flex items-center gap-2">
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

import { useState, useEffect, useMemo } from 'react';
import { API } from '../../lib/api';
import { 
  Package, 
  AlertCircle,
  Plus,
  ArrowRight,
  X,
  Target,
  Search
} from 'lucide-react';

interface StockMovement {
  id: string;
  quantity: number;
  type: 'PURCHASE' | 'SALE' | 'ADJUSTMENT';
  description: string;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  sku: string;
  stockLevel: number;
  category: string;
  stockType: 'PROPRIO' | 'FORNECEDOR' | 'AMBOS';
  externalLink?: string;
  supplierCost: number;
  supplier: string;
  stockMovements: StockMovement[];
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState<Product | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [adjustData, setAdjustData] = useState({ quantity: 1, type: 'PURCHASE', description: '' });
  
  const [newData, setNewData] = useState({
    name: '', sku: '', category: 'ALBUM', supplier: 'CK', 
    supplierCost: 0, stockType: 'PROPRIO', externalLink: ''
  });
  
  const [searchTerm, setSearchTerm] = useState('OSMO');
  const [filterCategory, setFilterCategory] = useState('ALL');

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category));
    return ['ALL', ...Array.from(cats)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = p.name.toUpperCase().includes(searchTerm.toUpperCase()) || 
                            p.sku.toUpperCase().includes(searchTerm.toUpperCase());
      const matchesCategory = filterCategory === 'ALL' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const fetchInventory = async () => {
    try {
      const { data } = await API.get('/admin/inventory');
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao buscar estoque:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleAdjust = async () => {
    if (!showAdjustModal) return;
    try {
      await API.post('/admin/inventory/adjust', {
        productId: showAdjustModal.id,
        ...adjustData
      });
      setShowAdjustModal(null);
      setAdjustData({ quantity: 1, type: 'PURCHASE', description: '' });
      fetchInventory();
    } catch {
      alert('Erro ao ajustar estoque');
    }
  };

  const handleCreate = async () => {
    try {
      await API.post('/admin/print-catalog', newData);
      setShowCreateModal(false);
      setNewData({
        name: '', sku: '', category: 'ALBUM', supplier: 'CK', 
        supplierCost: 0, stockType: 'PROPRIO', externalLink: ''
      });
      fetchInventory();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      alert(error.response?.data?.error || 'Erro ao cadastrar produto');
    }
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      {/* Header Padronizado */}
      <div className="relative pb-8 pt-4 md:pt-8 text-center animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-tactical/5 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center space-y-2">
          <h1 className="text-3xl md:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter leading-none">
            Estoque <span className="text-brand-tactical">Central</span>
          </h1>
          <p className="text-[12px] md:text-[14px] font-black text-brand-tactical uppercase tracking-[0.2em] italic">
            Matriz & Suprimentos da Rede
          </p>
          <div className="mt-4 flex justify-center w-full"><div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex-1 md:flex-none px-8 py-4 bg-brand-tactical text-zinc-950 text-[10px] font-black uppercase tracking-[0.3em] hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/10 flex items-center justify-center gap-3 italic whitespace-nowrap"
            >
              <Plus size={14} /> NOVO PRODUTO
            </button>
          </div></div>
        </div>
      </div>

      {/* Dynamic Filters */}
      <div className="flex flex-col md:flex-row gap-6 items-center">
         <div className="relative flex-1 group w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-theme-muted group-focus-within:text-brand-tactical transition-colors" size={16} />
            <input 
              type="text"
              placeholder="PROCURAR NO INVENTÁRIO (NOME OU SKU)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="fs-input pl-12 uppercase tracking-widest"
            />
         </div>
         <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`fs-btn border transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-theme-border border-zinc-700 text-theme-text shadow-lg' : 'bg-transparent border-theme-border text-theme-muted hover:border-zinc-700'}`}
              >
                {cat === 'ALL' ? 'TODOS' : cat}
              </button>
            ))}
         </div>
      </div>

      {/* Grid de Alertas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {filteredProducts.filter(p => p.stockLevel < 10 && p.stockType !== 'FORNECEDOR').map(p => (
          <div key={p.id} className="bg-red-500/5 border border-red-500/20 p-6 flex items-center gap-4 animate-pulse">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Crítico: {p.name}</p>
              <p className="text-xl font-black text-theme-text">{p.stockLevel} em estoque</p>
            </div>
          </div>
        ))}
        {filteredProducts.filter(p => p.stockLevel < 10 && p.stockType !== 'FORNECEDOR').length === 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 col-span-4 flex items-center gap-4">
            <Package className="text-emerald-500" size={20} />
            <div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status do Inventário</p>
              <p className="text-sm font-black text-theme-text uppercase italic tracking-widest">Níveis de estoque estáveis ou sob demanda.</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabela de Produtos */}
      <div className="border border-theme-border bg-theme-bg shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-theme-bg-muted">
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest">Produto / SKU</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Modelo</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Estoque</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-widest">Sincronizando Inventário...</td></tr>
            ) : filteredProducts.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-widest">Nenhum produto encontrado.</td></tr>
            ) : filteredProducts.map(p => (
              <tr key={p.id} className="hover:bg-theme-bg-muted/50 transition-all group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-theme-text uppercase italic tracking-tight">{p.name}</span>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-theme-muted font-bold font-mono tracking-widest">{p.sku}</span>
                      {p.externalLink && (
                        <a 
                          href={p.externalLink} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[9px] text-brand-tactical font-black border border-brand-tactical/30 px-2 py-0.5 rounded hover:bg-brand-tactical hover:text-zinc-950 transition-all uppercase"
                        >
                          Link Afiliado
                        </a>
                      )}
                    </div>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <span className={`text-[9px] font-black px-3 py-1 uppercase tracking-widest ${
                    p.stockType === 'PROPRIO' ? 'bg-theme-bg-muted text-theme-text border border-theme-border' :
                    p.stockType === 'FORNECEDOR' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                    'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                  }`}>
                    {p.stockType === 'PROPRIO' ? 'Próprio' : p.stockType === 'FORNECEDOR' ? 'Fornecedor (Drop)' : 'Híbrido (Ambos)'}
                  </span>
                </td>
                <td className="p-6 text-center">
                  {p.stockType === 'FORNECEDOR' ? (
                    <div className="text-sm font-black text-theme-muted uppercase italic">Sob Demanda</div>
                  ) : (
                    <>
                      <div className={`text-2xl font-black italic ${p.stockLevel < 10 ? 'text-red-500' : p.stockLevel < 30 ? 'text-amber-500' : 'text-theme-text'}`}>
                        {p.stockLevel}
                      </div>
                      <span className="text-[8px] text-theme-muted font-black uppercase">Unidades</span>
                    </>
                  )}
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setShowAdjustModal(p)}
                    className="p-3 border border-theme-border text-brand-tactical hover:bg-brand-tactical/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Ajustar Estoque"
                    disabled={p.stockType === 'FORNECEDOR'}
                  >
                    <Plus size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Cadastro de Novo Produto */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowCreateModal(false)} />
          
          <div className="relative w-full max-w-2xl bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Target className="text-brand-tactical" size={24} />
                </div>
                <div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-theme-text">Novo Ativo no Inventário</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Gestão de Suprimentos Matriz</p>
                </div>
              </div>
              <button onClick={() => setShowCreateModal(false)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-8 custom-scrollbar">
              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Nome do Produto</label>
                  <input 
                    type="text"
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text uppercase outline-none focus:border-brand-tactical rounded-xl"
                    placeholder="EX: ÁLBUM 20X20 PREMIUM"
                    value={newData.name}
                    onChange={e => setNewData({...newData, name: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">SKU (ID Único)</label>
                  <input 
                    type="text"
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text uppercase outline-none focus:border-brand-tactical rounded-xl"
                    placeholder="EX: ALB_20X20_PREM"
                    value={newData.sku}
                    onChange={e => setNewData({...newData, sku: e.target.value.toUpperCase()})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Categoria</label>
                  <select 
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text uppercase outline-none focus:border-brand-tactical cursor-pointer rounded-xl"
                    value={newData.category}
                    onChange={e => setNewData({...newData, category: e.target.value})}
                  >
                    <option value="ALBUM">Álbuns</option>
                    <option value="REVELACAO">Revelação</option>
                    <option value="QUADROS">Quadros</option>
                    <option value="ACESSORIOS">Acessórios</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Tipo de Gestão</label>
                  <select 
                    className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text uppercase outline-none focus:border-brand-tactical cursor-pointer rounded-xl"
                    value={newData.stockType}
                    onChange={e => setNewData({...newData, stockType: e.target.value})}
                  >
                    <option value="PROPRIO">Estoque Próprio</option>
                    <option value="FORNECEDOR">Fornecedor (Drop/Link)</option>
                    <option value="AMBOS">Híbrido (Ambos)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block mb-2 opacity-60 italic">Link de Afiliado / Dropshipping (Opcional)</label>
                <input 
                  type="text"
                  className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text outline-none focus:border-brand-tactical rounded-xl"
                  placeholder="https://produto.mercadolivre.com.br/..."
                  value={newData.externalLink}
                  onChange={e => setNewData({...newData, externalLink: e.target.value})}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-8 md:p-10 bg-theme-bg-muted/50 border-t border-theme-border flex gap-4 shrink-0">
              <button onClick={() => setShowCreateModal(false)} className="flex-1 py-5 border border-theme-border text-[11px] font-black uppercase tracking-[0.3em] text-theme-muted hover:text-white transition-all rounded-[20px] italic">Cancelar</button>
              <button 
                onClick={handleCreate} 
                className="flex-[2] py-5 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[20px] italic flex items-center justify-center gap-4"
              >
                Cadastrar Ativo
                <ArrowRight size={18} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Ajuste de Estoque */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300" onClick={() => setShowAdjustModal(null)} />
          
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border/60 rounded-[40px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 md:p-10 border-b border-theme-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
                  <Package className="text-brand-tactical" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-theme-text">{showAdjustModal.name}</h2>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Movimentação de Ativos</p>
                </div>
              </div>
              <button onClick={() => setShowAdjustModal(null)} className="p-3 hover:bg-white/5 rounded-full transition-all text-theme-muted"><X size={24} /></button>
            </div>

            <div className="p-8 md:p-10 space-y-8">
              <div className="grid grid-cols-2 gap-3">
                {(['PURCHASE', 'ADJUSTMENT'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setAdjustData({...adjustData, type: t})}
                    className={`py-4 text-[9px] font-black uppercase border transition-all rounded-xl ${adjustData.type === t ? 'bg-brand-tactical text-zinc-950 border-brand-tactical' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
                  >
                    {t === 'PURCHASE' ? 'Entrada (Compra)' : 'Ajuste Geral'}
                  </button>
                ))}
              </div>

              <div className="bg-theme-bg-muted p-8 border border-theme-border/60 text-center space-y-4 rounded-2xl">
                <div className="flex items-center justify-between max-w-[200px] mx-auto">
                  <button onClick={() => setAdjustData({...adjustData, quantity: Math.max(1, adjustData.quantity - 1)})} className="text-theme-text text-3xl font-black w-12 h-12 bg-white/5 rounded-full hover:bg-white/10 transition-colors">-</button>
                  <div className="text-4xl font-black text-theme-text italic">{adjustData.quantity}</div>
                  <button onClick={() => setAdjustData({...adjustData, quantity: adjustData.quantity + 1})} className="text-theme-text text-3xl font-black w-12 h-12 bg-white/5 rounded-full hover:bg-white/10 transition-colors">+</button>
                </div>
                <p className="text-[9px] text-theme-muted font-black uppercase tracking-widest">Unidades para movimentar</p>
              </div>

              <input 
                type="text" 
                placeholder="DESCRIÇÃO DO AJUSTE (OPCIONAL)"
                className="w-full bg-theme-bg-muted border border-theme-border/60 p-4 text-[10px] font-bold text-theme-text uppercase focus:border-brand-tactical outline-none rounded-xl"
                value={adjustData.description}
                onChange={e => setAdjustData({...adjustData, description: e.target.value.toUpperCase()})}
              />

              <div className="flex gap-4 pt-4">
                <button onClick={() => setShowAdjustModal(null)} className="flex-1 py-4 border border-theme-border text-[9px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-all rounded-2xl italic">Cancelar</button>
                <button onClick={handleAdjust} className="flex-1 py-4 bg-brand-tactical text-zinc-950 text-[9px] font-black uppercase tracking-[0.2em] shadow-xl hover:brightness-110 transition-all rounded-2xl italic flex items-center justify-center gap-2">
                  Confirmar Movimentação
                  <ArrowRight size={18} strokeWidth={1.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

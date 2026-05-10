import { useState, useEffect } from 'react';
import { API } from '../../lib/api';
import { 
  Package, 
  ArrowUpRight, 
  ArrowDownLeft, 
  AlertCircle,
  Plus
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
  stockMovements: StockMovement[];
}

export default function AdminInventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdjustModal, setShowAdjustModal] = useState<Product | null>(null);
  const [adjustData, setAdjustData] = useState({ quantity: 1, type: 'PURCHASE', description: '' });

  const fetchInventory = async () => {
    try {
      const { data } = await API.get('/admin/inventory');
      setProducts(data);
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

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-theme-border pb-10">
        <div>
          <h2 className="text-4xl font-black text-theme-text uppercase tracking-tighter italic">Estoque Central</h2>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.5em] mt-2 font-black italic text-brand-tactical">Matriz & Suprimentos da Rede</p>
        </div>
      </div>

      {/* Grid de Alertas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {products.filter(p => p.stockLevel < 10).map(p => (
          <div key={p.id} className="bg-red-500/5 border border-red-500/20 p-6 flex items-center gap-4 animate-pulse">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-[9px] font-black text-red-500 uppercase tracking-widest">Crítico: {p.name}</p>
              <p className="text-xl font-black text-theme-text">{p.stockLevel} em estoque</p>
            </div>
          </div>
        ))}
        {products.length > 0 && products.filter(p => p.stockLevel < 10).length === 0 && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 p-6 col-span-4 flex items-center gap-4">
            <Package className="text-emerald-500" size={20} />
            <div>
              <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Status do Inventário</p>
              <p className="text-sm font-black text-theme-text uppercase italic tracking-widest">Níveis de estoque estáveis em toda a matriz.</p>
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
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Nível de Estoque</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-center">Últimas Movimentações</th>
              <th className="p-6 text-[10px] font-black text-theme-muted uppercase tracking-widest text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border">
            {loading ? (
              <tr><td colSpan={4} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-widest">Sincronizando Inventário...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={4} className="p-20 text-center text-theme-muted text-[10px] font-black uppercase tracking-widest">Nenhum produto cadastrado.</td></tr>
            ) : products.map(p => (
              <tr key={p.id} className="hover:bg-theme-bg-muted/50 transition-all group">
                <td className="p-6">
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-theme-text uppercase italic tracking-tight">{p.name}</span>
                    <span className="text-[10px] text-theme-muted font-bold font-mono tracking-widest">{p.sku}</span>
                  </div>
                </td>
                <td className="p-6 text-center">
                  <div className={`text-2xl font-black italic ${p.stockLevel < 10 ? 'text-red-500' : p.stockLevel < 30 ? 'text-amber-500' : 'text-theme-text'}`}>
                    {p.stockLevel}
                  </div>
                  <span className="text-[8px] text-theme-muted font-black uppercase">Unidades Disponíveis</span>
                </td>
                <td className="p-6">
                  <div className="flex flex-col gap-1">
                    {(p.stockMovements || []).map(m => (
                      <div key={m.id} className="flex items-center gap-2 text-[9px] font-bold">
                        {m.quantity > 0 ? <ArrowUpRight size={10} className="text-emerald-500" /> : <ArrowDownLeft size={10} className="text-red-500" />}
                        <span className={m.quantity > 0 ? 'text-emerald-500' : 'text-red-500'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span>
                        <span className="text-theme-muted truncate max-w-[150px]">{m.description}</span>
                      </div>
                    ))}
                  </div>
                </td>
                <td className="p-6 text-right">
                  <button 
                    onClick={() => setShowAdjustModal(p)}
                    className="p-3 border border-theme-border text-brand-tactical hover:bg-brand-tactical/10 transition-all"
                    title="Ajustar Estoque"
                  >
                    <Plus size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal: Ajuste de Estoque */}
      {showAdjustModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-theme-bg/60 backdrop-blur-md">
          <div className="bg-theme-bg border border-theme-border p-10 max-w-sm w-full space-y-8 shadow-2xl">
            <div className="text-center space-y-2">
              <span className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Ajuste de Ativos</span>
              <h3 className="text-xl font-black text-theme-text uppercase">{showAdjustModal.name}</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-2">
                {(['PURCHASE', 'ADJUSTMENT'] as const).map(t => (
                  <button 
                    key={t}
                    onClick={() => setAdjustData({...adjustData, type: t})}
                    className={`py-3 text-[9px] font-black uppercase border transition-all ${adjustData.type === t ? 'bg-brand-tactical text-zinc-950 border-brand-tactical' : 'border-theme-border text-theme-muted hover:border-zinc-500'}`}
                  >
                    {t === 'PURCHASE' ? 'Entrada (Compra)' : 'Ajuste Geral'}
                  </button>
                ))}
              </div>

              <div className="bg-theme-bg-muted p-6 border border-theme-border text-center space-y-3">
                <div className="flex items-center justify-between">
                  <button onClick={() => setAdjustData({...adjustData, quantity: adjustData.quantity - 1})} className="text-theme-text text-2xl font-black w-10 h-10">-</button>
                  <div className="text-3xl font-black text-theme-text italic">{adjustData.quantity}</div>
                  <button onClick={() => setAdjustData({...adjustData, quantity: adjustData.quantity + 1})} className="text-theme-text text-2xl font-black w-10 h-10">+</button>
                </div>
                <p className="text-[8px] text-theme-muted font-black uppercase">Quantidade para movimentar</p>
              </div>

              <input 
                type="text" 
                placeholder="DESCRIÇÃO DO AJUSTE (OPCIONAL)"
                className="w-full bg-theme-bg-muted border border-theme-border p-4 text-[10px] font-bold text-theme-text uppercase focus:border-brand-tactical outline-none"
                value={adjustData.description}
                onChange={e => setAdjustData({...adjustData, description: e.target.value.toUpperCase()})}
              />

              <div className="flex gap-4">
                <button onClick={() => setShowAdjustModal(null)} className="flex-1 py-4 border border-theme-border text-theme-muted font-black uppercase text-[10px] tracking-widest">Cancelar</button>
                <button onClick={handleAdjust} className="flex-1 py-4 bg-brand-tactical text-zinc-950 font-black uppercase text-[10px] tracking-widest hover:brightness-110 shadow-lg shadow-brand-tactical/20">Confirmar</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

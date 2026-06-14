import React from 'react';
import { createPortal } from 'react-dom';
import { useCart } from '../contexts/CartContext';
import { T } from '../lib/theme';
import { Trash2, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const CartModal: React.FC<{ isOpen: boolean, onClose: () => void }> = ({ isOpen, onClose }) => {
  const { digitalPhotos, physicalItems, removeFromCart, removePhysicalItem, totalItems, totalPrice } = useCart();
  const navigate = useNavigate();

  // Bloqueio de Scroll da Janela Principal
  React.useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const savedPrice = localStorage.getItem('fs_current_event_price_unit');
  const eventPricePerPhoto = savedPrice ? Number(savedPrice) : 15;
  const currentTotal = totalPrice(eventPricePerPhoto);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop Imersivo - Ocupa tudo e bloqueia o fundo */}
      <div 
        className="fixed inset-0 bg-theme-bg/80 backdrop-blur-xl animate-in fade-in duration-300 dark:bg-black/95" 
        onClick={onClose} 
      />
      
      {/* Modal Centrado - Posição Absoluta e Z-Index Máximo */}
      <div 
        className="relative w-full max-w-2xl h-[80vh] flex flex-col border border-theme-border rounded-[40px] overflow-hidden shadow-2xl z-[10000] bg-theme-card" 
      >
        
        {/* Header - Fixo */}
        <div className="p-8 md:p-10 border-b flex items-center justify-between shrink-0" style={{ borderColor: T.border }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-brand-tactical/10 rounded-2xl flex items-center justify-center border border-brand-tactical/20">
              <ShoppingBag className="text-brand-tactical" size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-bold uppercase" style={{ color: T.text }}>Minha Seleção</h2>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">Resumo de Memórias</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-theme-bg-muted rounded-full transition-all active:scale-90" style={{ color: T.text2 }}>
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
          {totalItems === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center text-center space-y-6 opacity-30">
              <div className="w-24 h-24 bg-theme-bg-muted rounded-full flex items-center justify-center border border-white/10">
                <ShoppingBag size={48} strokeWidth={1} style={{ color: T.text }} />
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: T.text }}>Sua sacola está vazia</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Digital Section */}
              {digitalPhotos.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Fotos Digitais</h3>
                    <span className="px-2 py-0.5 bg-brand-tactical/10 text-brand-tactical text-[9px] font-bold rounded-full">{digitalPhotos.length}</span>
                  </div>
                  <div className="space-y-2">
                    {digitalPhotos.map((item) => (
                      <div key={item.shortId} className="group flex items-center justify-between p-3 bg-theme-bg-muted rounded-2xl border border-white/5 hover:border-brand-tactical/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-theme-bg-field rounded-xl flex items-center justify-center border border-theme-border group-hover:bg-brand-tactical/10 transition-colors overflow-hidden">
                            {item.url ? (
                              <img src={item.url} alt={item.shortId} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[10px] font-bold text-brand-tactical">PRO</span>
                            )}
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase" style={{ color: T.text }}>ID: {item.shortId}</p>
                            <p className="text-[10px] font-bold text-theme-muted uppercase">Download HD</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removeFromCart(item.eventId, item.shortId)} 
                          className="p-2 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Physical Section */}
              {physicalItems.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-theme-muted">Impressos</h3>
                    <span className="px-2 py-0.5 bg-emerald-500/10 text-theme-brand text-[9px] font-bold rounded-full">{physicalItems.length}</span>
                  </div>
                  <div className="space-y-2">
                    {physicalItems.map((item) => (
                      <div key={item.productId} className="group flex items-center justify-between p-3 bg-theme-bg-muted rounded-2xl border border-white/5 hover:border-emerald-500/30 transition-all">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-theme-bg-field rounded-xl flex items-center justify-center border border-theme-border">
                            <span className="text-lg">📦</span>
                          </div>
                          <div>
                            <p className="text-[10px] font-bold uppercase" style={{ color: T.text }}>{item.name}</p>
                            <p className="text-[10px] font-bold text-brand-tactical uppercase">
                              {item.quantity} un • R$ {item.price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => removePhysicalItem(item.productId)} 
                          className="p-2 text-theme-muted hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Fixo no Fundo */}
        {totalItems > 0 && (
          <div className="p-8 md:p-10 bg-theme-bg-muted border-t flex flex-col md:flex-row items-center justify-between gap-6 shrink-0" style={{ borderColor: T.border }}>
            <div className="text-center md:text-left">
              <span className="block text-[10px] font-bold uppercase tracking-widest text-theme-text-muted mb-1">Total da Seleção</span>
              <span className="text-4xl font-bold" style={{ color: T.text }}>R$ {currentTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                onClose();
                navigate("/checkout");
              }}
              className="w-full md:w-auto px-10 py-5 bg-brand-tactical text-theme-text text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-white hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 shadow-2xl shadow-brand-tactical/20"
            >
              Confirmar e Pagar
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

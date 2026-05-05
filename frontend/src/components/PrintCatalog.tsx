import { useState, useEffect } from "react";
import { API as api } from "../lib/api";
import { ShoppingCart, Check, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

interface Product {
  id: string;
  name: string;
  category: string;
  sellingPrice: number;
  description: string;
  maxPhotos?: number;
}

interface PrintCatalogProps {
  eventId: string;
  onAddToCart: (product: Product) => void;
  selectedProductId?: string | null;
}

export function PrintCatalog({ eventId, onAddToCart, selectedProductId }: PrintCatalogProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get(`/public/events/${eventId}/print-products`);
        setProducts(data || []);
      } catch (err) {
        console.error("Erro ao carregar catálogo:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-40">
        <Loader2 className="animate-spin text-brand-tactical" size={32} />
        <p className="text-[10px] font-display font-black uppercase tracking-widest italic">Sincronizando Catálogo Phygital...</p>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-4">
        <div className="h-px flex-1 bg-theme-border/40" />
        <h3 className="font-heading font-black text-2xl text-theme-text uppercase italic tracking-widest">Upgrade Phygital</h3>
        <div className="h-px flex-1 bg-theme-border/40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const isSelected = selectedProductId === product.id;
          
          return (
            <motion.div
              key={product.id}
              whileHover={{ y: -4 }}
              className={`group relative overflow-hidden rounded-[24px] bg-theme-bg-muted border transition-all duration-500 cursor-pointer ${
                isSelected ? "border-brand-tactical shadow-2xl shadow-brand-tactical/20" : "border-white/5 hover:border-white/20"
              }`}
              onClick={() => onAddToCart(product)}
            >
              {/* Product Visual Area */}
              <div className="aspect-[4/3] bg-zinc-900 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                <div className="absolute top-4 left-4 z-20">
                  <span className="px-3 py-1 bg-theme-bg/60 backdrop-blur-md border border-theme-border/40 rounded-full text-[9px] font-display font-black text-theme-text uppercase tracking-widest">
                    {product.category}
                  </span>
                </div>
                {/* Fallback image style icon */}
                <div className="absolute inset-0 flex items-center justify-center text-white/5 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <ShoppingCart size={120} />
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6 space-y-4">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <h4 className="font-heading font-black text-xl text-theme-text uppercase italic tracking-tight leading-none">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-theme-text-muted mt-2 font-medium leading-relaxed">
                      {product.description || "Transforme suas memórias digitais em uma peça física de alta qualidade."}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-heading font-black text-brand-tactical italic">
                      R$ {Number(product.sellingPrice).toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="w-6 h-6 rounded-full border-2 border-theme-bg-muted bg-theme-bg-muted" />
                      ))}
                    </div>
                    <span className="text-[9px] font-display font-black text-theme-text-muted uppercase tracking-widest">+12 vendidos</span>
                  </div>

                  <button 
                    className={`flex items-center gap-2 px-6 py-3 text-[9px] font-display font-black uppercase tracking-widest italic transition-all ${
                      isSelected 
                        ? "bg-brand-tactical text-black" 
                        : "bg-theme-bg border border-theme-border text-theme-text hover:border-brand-tactical"
                    }`}
                  >
                    {isSelected ? <Check size={14} /> : <ShoppingCart size={14} />}
                    {isSelected ? "Selecionado" : "Adicionar"}
                  </button>
                </div>
              </div>

              {/* Hover Glow Effect */}
              <div className="absolute inset-0 bg-brand-tactical/0 group-hover:bg-brand-tactical/5 transition-colors duration-500 pointer-events-none" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

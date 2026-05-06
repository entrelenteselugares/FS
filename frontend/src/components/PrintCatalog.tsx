import { useState } from "react";
import { motion } from "framer-motion";

// Tipagem rigorosa para os produtos do nosso catálogo híbrido
interface PrintProduct {
  id: string;
  name: string;
  description: string;
  sellingPrice: number;
  category: string;
  type: "INSTANT_PRINT" | "LAB_PREMIUM";
  badge?: string;
  imagePlaceholder: string;
}

const CATALOG_ITEMS: PrintProduct[] = [
  {
    id: "1",
    name: "Foto Instantânea 10x15",
    description: "Impressão térmica de alta durabilidade com retirada imediata no balcão.",
    sellingPrice: 15.00,
    category: "Retirada no Local",
    type: "INSTANT_PRINT",
    badge: "MAIS POPULAR",
    imagePlaceholder: "📸"
  },
  {
    id: "2",
    name: "Álbum Flat Premium",
    description: "Papel fotográfico 600g com abertura 180º. Qualidade de laboratório editorial.",
    sellingPrice: 450.00,
    category: "Entrega em Casa",
    type: "LAB_PREMIUM",
    badge: "EDITORIAL",
    imagePlaceholder: "📖"
  },
  {
    id: "3",
    name: "Quadro Canvas 40x60",
    description: "Sua foto favorita transformada em obra de arte em tela de algodão premium.",
    sellingPrice: 280.00,
    category: "Entrega em Casa",
    type: "LAB_PREMIUM",
    imagePlaceholder: "🖼️"
  }
];

interface PrintCatalogProps {
  eventId?: string;
  selectedProductId?: string | null;
  onAddToCart?: (product: PrintProduct) => void;
}

/**
 * PrintCatalog - Componente tático de Upgrade Phygital.
 * Midnight Luxury v3.2 Design System.
 */
export function PrintCatalog({ selectedProductId, onAddToCart }: PrintCatalogProps) {
  const [internalCart, setInternalCart] = useState<Record<string, number>>({});

  const handleAction = (item: PrintProduct) => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      setInternalCart((prev) => ({...prev, [item.id]: (prev[item.id] || 0) + 1 }));
    }
  };

  return (
    <section className="w-full bg-[#0a0a0a] text-white py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl font-bold tracking-tight text-gray-100 uppercase">
            Eternize no <span className="text-emerald-500">Papel</span>
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            Adicione produtos físicos de qualidade editorial ao seu pacote digital.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATALOG_ITEMS.map((item, index) => {
            const isSelected = selectedProductId === item.id;
            const quantity = internalCart[item.id] || 0;

            // Seleção de imagem baseada no tipo para visual mais imersivo
            const bgImage = item.id === "1" 
              ? "https://images.unsplash.com/photo-1520390138845-fd2d229dd553?q=80&w=600&auto=format&fit=crop" // Polaroid/Instant
              : item.id === "2"
              ? "https://images.unsplash.com/photo-1544377193-33dcf4d68fb5?q=80&w=600&auto=format&fit=crop" // Album/Book
              : "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600&auto=format&fit=crop"; // Canvas/Wall art

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`relative flex flex-col bg-zinc-900 border rounded-2xl overflow-hidden transition-all group ${
                  isSelected ? "border-emerald-500 shadow-[0_0_30px_rgba(16,185,129,0.15)] scale-[1.02]" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Imagem Imersiva do Produto */}
                <div className="relative h-56 w-full overflow-hidden">
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors z-10" />
                  <img 
                    src={bgImage} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  
                  {/* Badge Tático (Glassmorphism) */}
                  {item.badge && (
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-emerald-400 text-[9px] font-black px-3 py-1.5 rounded-full uppercase tracking-[0.2em] border border-emerald-500/30 z-20 shadow-xl">
                      {item.badge}
                    </div>
                  )}

                  {/* Etiqueta de Tipo de Logística */}
                  <div className="absolute bottom-4 left-4 z-20">
                    <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded text-[8px] font-bold text-zinc-300 uppercase tracking-widest border border-white/10 flex items-center gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full ${item.type === 'INSTANT_PRINT' ? 'bg-amber-400' : 'bg-emerald-500'}`} />
                      {item.type === 'INSTANT_PRINT' ? 'Retirada Local' : 'Entrega em Casa'}
                    </div>
                  </div>
                </div>

                <div className="flex-1 p-6 flex flex-col">
                  <h3 className="text-xl font-black text-white uppercase tracking-wider italic mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-6 flex-1">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black italic">Investimento</span>
                      <span className="text-2xl font-black text-white italic">
                        <span className="text-sm font-light text-zinc-400 mr-1">R$</span>
                        {Number(item.sellingPrice).toFixed(0)}
                        <span className="text-sm text-zinc-500">,00</span>
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleAction(item)}
                      className={`font-black text-[10px] uppercase tracking-widest px-6 py-3 transition-all active:scale-95 italic ${
                        isSelected 
                          ? "bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]" 
                          : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      }`}
                    >
                      {isSelected ? `No Carrinho (${quantity})` : "Adicionar"}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

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
    <section className="w-full bg-[var(--bg)] text-[var(--text)] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-3xl md:text-4xl font-black tracking-tighter text-[var(--text)] uppercase italic leading-none">
            ETERNIZE NO <span className="text-brand-tactical">PAPEL</span>
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
              ? "" // Polaroid/Instant
              : item.id === "2"
              ? "" // Album/Book
              : ""; // Canvas/Wall art

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`relative flex flex-col bg-[var(--bg-card)] border rounded-[32px] md:rounded-[40px] overflow-hidden transition-all duration-500 group ${
                  isSelected ? "border-brand-tactical shadow-[0_0_50px_rgba(133,185,172,0.15)] scale-[1.02]" : "border-[var(--border)] hover:border-brand-tactical/30"
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
                  <h3 className="text-xl font-black text-[var(--text)] uppercase tracking-wider italic mb-2">
                    {item.name}
                  </h3>
                  <p className="text-xs text-[var(--text-2)] leading-relaxed font-medium mb-6 flex-1">
                    {item.description}
                  </p>

                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-[var(--text-3)] uppercase tracking-widest font-black italic">Investimento</span>
                      <span className="text-2xl font-black text-white italic">
                        <span className="text-sm font-light text-[var(--text-2)] mr-1">R$</span>
                        {Number(item.sellingPrice).toFixed(0)}
                        <span className="text-sm text-[var(--text-3)]">,00</span>
                      </span>
                    </div>
                    
                    <button
                      onClick={() => handleAction(item)}
                      className={`font-black text-[10px] uppercase tracking-widest px-8 py-4 transition-all duration-300 active:scale-95 italic rounded-sm ${
                        isSelected 
                          ? "bg-[var(--text)] text-[var(--bg)] shadow-[0_0_30px_rgba(255,255,255,0.4)]" 
                          : "bg-brand-tactical hover:bg-white text-black shadow-[0_10px_30px_rgba(133,185,172,0.3)] hover:shadow-[0_15px_40px_rgba(255,255,255,0.4)]"
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

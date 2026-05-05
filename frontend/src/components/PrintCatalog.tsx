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

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className={`relative flex flex-col bg-[#141414] border rounded-2xl p-6 transition-all group overflow-hidden ${
                  isSelected ? "border-emerald-500/60 shadow-lg shadow-emerald-500/10" : "border-[#2a2a2a] hover:border-emerald-500/50"
                }`}
              >
                {/* Badge Tático */}
                {item.badge && (
                  <div className="absolute top-4 right-4 bg-emerald-500/10 text-emerald-500 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest backdrop-blur-md border border-emerald-500/20 z-10">
                    {item.badge}
                  </div>
                )}

                {/* Mock Visual do Produto */}
                <div className="h-40 w-full bg-gradient-to-tr from-[#1a1a1a] to-[#222] rounded-xl flex items-center justify-center text-5xl mb-6 shadow-inner group-hover:scale-[1.02] transition-transform duration-500">
                  {item.imagePlaceholder}
                </div>

                <div className="flex-1">
                  <div className="text-[10px] text-gray-500 tracking-widest uppercase mb-1">
                    {item.category}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-100 leading-tight">
                    {item.name}
                  </h3>
                  <p className="mt-2 text-sm text-gray-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between">
                  <span className="text-xl font-bold text-gray-100">
                    R$ {Number(item.sellingPrice).toFixed(2).replace(".", ",")}
                  </span>
                  <button
                    onClick={() => handleAction(item)}
                    className={`font-bold text-sm px-5 py-2.5 rounded-lg transition-transform active:scale-95 shadow-[0_0_15px_rgba(16,185,129,0.3)] ${
                      isSelected 
                        ? "bg-white text-[#0a0a0a]" 
                        : "bg-emerald-500 hover:bg-emerald-400 text-[#0a0a0a]"
                    }`}
                  >
                    {isSelected ? "Selecionado" : (quantity > 0 ? `No Carrinho (${quantity})` : "Adicionar")}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

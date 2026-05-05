import { useState, useEffect, useRef, useLayoutEffect } from "react";
import * as reactWindow from "react-window";
// @ts-ignore
const FixedSizeList = (reactWindow.FixedSizeList || reactWindow.default?.FixedSizeList || reactWindow.default) as any;
import { API } from "../lib/api";
import { T, BtnPrimary, BtnSecondary, ModalOverlay, ModalContent, FieldLabel, FieldInput, FieldSelect } from "../lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Package, 
  Truck, 
  MapPin, 
  Camera, 
  Trash2, 
  ShoppingCart, 
  ChevronLeft, 
  Plus, 
  Minus,
  Check,
  X,
  CreditCard,
  Phone,
  Image as ImageIcon
} from "lucide-react";

interface PrintProduct {
  id: string;
  category: string;
  name: string;
  description: string | null;
  finalPrice: number;
  unit: string;
  maxPhotos?: number | null;
}

const CATEGORY_LABELS: Record<string, string> = {
  ALBUM:       "Álbuns Encadernados",
  ALBUM_30X40: "Álbuns 30×40",
  QUADROS:     "Quadros & Telas",
  REVELACAO:   "Revelação Fine Art",
  ACESSORIOS:  "Acessórios & Mimos",
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  ALBUM:       <Package size={24} />,
  ALBUM_30X40: <Package size={24} />,
  QUADROS:     <ImageIcon size={24} />,
  REVELACAO:   <Camera size={24} />,
  ACESSORIOS:  <Plus size={24} />,
};

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
}

interface PrintStoreModalProps {
  eventId: string;
  eventTitle: string;
  medias?: EventMedia[];
  unlockedMediaIds?: string[];
  isMarketplace?: boolean;
  isOwner?: boolean;
  onClose: () => void;
}

// ── VIRTUALIZED GRID COMPONENT ───────────────────────────────────────────
function AlbumPhotoGrid({ medias, selectedAlbumPhotos, toggleAlbumPhoto }: { 
  medias: EventMedia[], 
  selectedAlbumPhotos: string[], 
  toggleAlbumPhoto: (url: string) => void 
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 350 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height || 350
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const columnCount = Math.max(2, Math.floor(dimensions.width / 110));
  const rowCount = Math.ceil(medias.length / columnCount);
  const itemSize = dimensions.width / columnCount;

  const Row = ({ index, style }: { index: number, style: React.CSSProperties }) => {
    const items = [];
    for (let i = 0; i < columnCount; i++) {
      const mediaIndex = index * columnCount + i;
      if (mediaIndex < medias.length) {
        const media = medias[mediaIndex];
        const isSelected = selectedAlbumPhotos.includes(media.url);
        items.push(
          <div 
            key={media.id} 
            onClick={() => toggleAlbumPhoto(media.url)}
            className={`relative cursor-pointer transition-all duration-300 border-2 ${isSelected ? "border-brand-tactical" : "border-transparent"}`}
            style={{ 
              width: itemSize - 8,
              height: itemSize - 8,
              margin: 4,
              flexShrink: 0
            }}
          >
            <img 
              src={media.url} 
              alt="" 
              className="w-full h-full object-cover"
            />
            {isSelected && (
              <div className="absolute top-2 right-2 bg-brand-tactical text-black w-5 h-5 flex items-center justify-center text-[10px] font-black">✓</div>
            )}
          </div>
        );
      }
    }

    return (
      <div style={{ ...style, display: "flex" }}>
        {items}
      </div>
    );
  };

  return (
    <div ref={containerRef} className="w-full h-full bg-theme-bg-muted/20">
      <FixedSizeList
        height={dimensions.height}
        itemCount={rowCount}
        itemSize={itemSize}
        width={dimensions.width}
        overscanCount={2}
      >
        {Row}
      </FixedSizeList>
    </div>
  );
}

const MOCK_PRODUCTS: PrintProduct[] = [
  { id: "mock-1", category: "ALBUM", name: "Álbum Fine Art Luxo", description: "Capa em couro legítimo, papel fotográfico premium 800g.", finalPrice: 450, unit: "unidade", maxPhotos: 40 },
  { id: "mock-2", category: "QUADROS", name: "Quadro Canvas 60x90", description: "Impressão em tela de pintura com moldura flutuante.", finalPrice: 280, unit: "unidade", maxPhotos: 1 },
  { id: "mock-3", category: "REVELACAO", name: "Pack 20 Fotos 10x15", description: "Papel fosco profissional com borda branca.", finalPrice: 60, unit: "pack", maxPhotos: 20 },
];

export function PrintStoreModal({ eventId, eventTitle, medias = [], unlockedMediaIds = [], isMarketplace = false, isOwner = false, onClose }: PrintStoreModalProps) {
  const [products, setProducts] = useState<PrintProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<PrintProduct | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState<"catalog" | "details" | "delivery" | "processing">("catalog");
  const [deliveryMethod, setDeliveryMethod] = useState<"LOCAL_PICKUP" | "SHIPPING">("LOCAL_PICKUP");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const availableMedias = isMarketplace && unlockedMediaIds && unlockedMediaIds.length > 0
    ? (medias || []).filter(m => unlockedMediaIds.includes(m.id) || unlockedMediaIds.includes(m.shortId))
    : (medias || []);

  const [photoSource, setPhotoSource] = useState<"upload" | "album">(
    (isOwner || availableMedias.length > 0) ? "album" : "upload"
  );
  const [selectedAlbumPhotos, setSelectedAlbumPhotos] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    API.get("/public/print-catalog")
      .then(r => {
        const dbItems = (r.data.products || r.data || []).filter((p: PrintProduct & { active?: boolean }) => p.active !== false);
        const items = dbItems.length > 0 ? dbItems : MOCK_PRODUCTS;
        setProducts(items);
        if (items.length > 0) setActiveCategory(items[0].category);
      })
      .catch(() => {
        setProducts(MOCK_PRODUCTS);
        setActiveCategory("ALBUM");
      })
      .finally(() => setLoading(false));
  }, []);

  const categories = [...new Set(products.map(p => p.category))];
  const filteredProducts = products.filter(p => !activeCategory || p.category === activeCategory);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (selectedProduct?.maxPhotos) {
      const currentTotal = selectedFiles.length + selectedAlbumPhotos.length;
      if (currentTotal + files.length > selectedProduct.maxPhotos) {
        setError(`Limite de fotos atingido. Este produto permite no máximo ${selectedProduct.maxPhotos} fotos.`);
        return;
      }
    }

    setSelectedFiles(prev => [...prev, ...files]);
    files.forEach(f => {
      const reader = new FileReader();
      reader.onload = ev => setFilePreviews(prev => [...prev, ev.target?.result as string]);
      reader.readAsDataURL(f);
    });
  };

  const removeFile = (idx: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== idx));
    setFilePreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const toggleAlbumPhoto = (url: string) => {
    const isSelected = selectedAlbumPhotos.includes(url);
    if (!isSelected && selectedProduct?.maxPhotos) {
      const currentTotal = selectedFiles.length + selectedAlbumPhotos.length;
      if (currentTotal >= selectedProduct.maxPhotos) {
        setError(`Limite de fotos atingido (${selectedProduct.maxPhotos}). Remova uma foto para adicionar outra.`);
        return;
      }
    }
    setSelectedAlbumPhotos(prev => isSelected ? prev.filter(u => u !== url) : [...prev, url]);
  };

  const totalPhotoCount = selectedFiles.length + selectedAlbumPhotos.length;
  const totalPrice = selectedProduct ? selectedProduct.finalPrice * quantity : 0;

  const handleCheckout = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    setError("");
    try {
      const { data } = await API.post("/orders/print", {
        eventId,
        productId: selectedProduct.id,
        quantity,
        notes,
        fileCount: totalPhotoCount,
        albumPhotos: selectedAlbumPhotos,
        deliveryMethod
      });
      window.location.href = `/checkout?orderId=${data.orderId}`;
    } catch {
      setError("Erro ao processar pedido. Tente novamente.");
      setSubmitting(false);
    }
  };

  const handleWhatsAppCheckout = () => {
    if (!selectedProduct) return;
    const msg = `Olá! Quero encomendar:\n\n*Produto:* ${selectedProduct.name}\n*Quantidade:* ${quantity}\n*Entrega:* ${deliveryMethod === 'LOCAL_PICKUP' ? 'Retirada no Ponto' : 'Envio para Endereço'}\n*Evento:* ${eventTitle}\n*Total:* R$ ${totalPrice.toFixed(2).replace(".", ",")}\n\n${notes ? `*Obs:* ${notes}` : ""}`;
    window.open(`https://wa.me/5519997843817?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-10"
      >
        <div onClick={onClose} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />

        <motion.div 
          initial={{ y: 50, scale: 0.95 }} animate={{ y: 0, scale: 1 }} exit={{ y: 50, scale: 0.95 }}
          className="relative w-full max-w-5xl h-[90vh] bg-theme-bg border border-theme-border flex flex-col lg:flex-row overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.8)]"
        >
          {/* Lado Esquerdo: Navegação/Status (Apenas Mobile/Tablet fixo ou Desktop lateral) */}
          <div className="w-full lg:w-[320px] bg-theme-bg-muted/40 border-r border-theme-border flex flex-col shrink-0">
             <div className="p-8 border-b border-theme-border">
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic mb-3">Eternize no Papel</p>
                <h2 className="text-3xl font-heading font-black text-theme-text uppercase tracking-tighter leading-none italic">Print Store</h2>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.2em] mb-6 italic">Protocolo de Seleção</p>
                
                {[
                  { id: 'catalog', label: 'Catálogo', icon: <ShoppingCart size={14} />, status: step === 'catalog' ? 'active' : (step !== 'catalog' ? 'completed' : 'pending') },
                  { id: 'details', label: 'Configuração', icon: <Plus size={14} />, status: step === 'details' ? 'active' : (step === 'delivery' ? 'completed' : 'pending') },
                  { id: 'delivery', label: 'Logística', icon: <Truck size={14} />, status: step === 'delivery' ? 'active' : 'pending' },
                ].map((s, idx) => (
                  <div key={s.id} className="flex items-center gap-4 group">
                     <div className={`w-8 h-8 flex items-center justify-center border transition-all ${s.status === 'active' ? 'border-brand-tactical bg-brand-tactical text-black shadow-[0_0_15px_rgba(20,184,166,0.4)]' : (s.status === 'completed' ? 'border-brand-tactical text-brand-tactical' : 'border-theme-border text-theme-text-muted')}`}>
                        {s.status === 'completed' ? <Check size={14} /> : s.icon}
                     </div>
                     <span className={`text-[11px] font-black uppercase tracking-widest italic ${s.status === 'active' ? 'text-theme-text' : 'text-theme-text-muted'}`}>{s.label}</span>
                     {idx < 2 && <div className="ml-auto w-px h-4 bg-theme-border" />}
                  </div>
                ))}

                {selectedProduct && (
                   <div className="pt-10 space-y-6">
                      <div className="h-px bg-theme-border/40" />
                      <div className="space-y-2">
                        <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Item Selecionado</p>
                        <p className="text-sm font-black text-theme-text uppercase italic leading-tight">{selectedProduct.name}</p>
                      </div>
                      <div className="flex items-end justify-between">
                         <div className="space-y-1">
                            <p className="text-[9px] font-black text-theme-text-muted uppercase tracking-widest italic">Total Estimado</p>
                            <p className="text-2xl font-black text-brand-tactical italic tracking-tighter">R$ {totalPrice.toFixed(0)}<span className="text-sm">,00</span></p>
                         </div>
                         <div className="text-[10px] font-black text-theme-text-muted uppercase italic">x{quantity}</div>
                      </div>
                   </div>
                )}
             </div>

             <div className="p-8 border-t border-theme-border bg-brand-tactical/5">
                <button onClick={onClose} className="w-full py-4 border border-theme-border text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:text-white hover:border-white transition-all italic">Fechar Loja</button>
             </div>
          </div>

          {/* Lado Direito: Conteúdo Dinâmico */}
          <div className="flex-1 flex flex-col bg-theme-bg overflow-hidden relative">
             <div className="flex-1 overflow-y-auto p-8 lg:p-14 scrollbar-hide">
                {step === 'catalog' && (
                  <div className="space-y-12 max-w-4xl mx-auto">
                    <div className="flex flex-wrap gap-4">
                      {categories.map(cat => (
                        <button
                          key={cat}
                          onClick={() => setActiveCategory(cat)}
                          className={`px-8 py-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all italic ${activeCategory === cat ? 'bg-brand-tactical text-black shadow-[0_10px_30px_rgba(20,184,166,0.3)]' : 'border border-theme-border text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical'}`}
                        >
                          {CATEGORY_LABELS[cat] || cat}
                        </button>
                      ))}
                    </div>

                    {loading ? (
                      <div className="py-20 flex flex-col items-center gap-4 opacity-40">
                         <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
                         <p className="text-[10px] font-black uppercase tracking-widest italic">Sincronizando Catálogo...</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {filteredProducts.map(product => (
                          <div 
                            key={product.id}
                            onClick={() => { setSelectedProduct(product); setStep("details"); }}
                            className="group relative bg-theme-bg-muted/30 border border-theme-border p-10 cursor-pointer hover:border-brand-tactical transition-all duration-500 overflow-hidden"
                          >
                             <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-20 transition-opacity">
                                {CATEGORY_ICONS[product.category]}
                             </div>
                             <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.3em] mb-4 italic">{product.category}</p>
                             <h3 className="text-2xl font-black text-theme-text uppercase tracking-tight italic mb-4 group-hover:text-brand-tactical transition-colors">{product.name}</h3>
                             <p className="text-xs text-theme-text-muted leading-relaxed mb-10 italic">{product.description || "Acabamento premium com durabilidade vitalícia."}</p>
                             <div className="flex items-end justify-between">
                                <div className="flex items-baseline gap-1">
                                   <span className="text-xs text-theme-text-muted font-black italic uppercase">R$</span>
                                   <span className="text-3xl font-black text-theme-text italic tracking-tighter">{product.finalPrice.toFixed(0)}</span>
                                   <span className="text-xs text-theme-text-muted font-black italic uppercase">,00</span>
                                </div>
                                <button className="p-4 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical group-hover:bg-brand-tactical group-hover:text-black transition-all">
                                   <Plus size={20} />
                                </button>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {step === 'details' && selectedProduct && (
                  <div className="space-y-16 max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <button onClick={() => setStep('catalog')} className="flex items-center gap-3 text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:text-brand-tactical transition-all italic">
                       <ChevronLeft size={16} /> Voltar ao Catálogo
                    </button>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-16">
                       <div className="space-y-10">
                          <div className="space-y-4">
                             <h2 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Configuração do Item</h2>
                             <div className="h-px w-20 bg-brand-tactical" />
                          </div>

                          <div className="space-y-6">
                             <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest italic">Quantidade</p>
                             <div className="flex items-center gap-10">
                                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="w-14 h-14 border border-theme-border flex items-center justify-center text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical transition-all"><Minus size={20} /></button>
                                <span className="text-5xl font-black text-theme-text italic tracking-tighter">{quantity}</span>
                                <button onClick={() => setQuantity(q => q + 1)} className="w-14 h-14 border border-theme-border flex items-center justify-center text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical transition-all"><Plus size={20} /></button>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest italic">Observações de Produção</p>
                             <textarea 
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                placeholder="Ex: Capa com foto do casal, nome e data..."
                                className="w-full bg-theme-bg-muted/40 border border-theme-border p-8 text-sm text-theme-text placeholder:text-zinc-700 outline-none focus:border-brand-tactical transition-all italic min-h-[120px]"
                             />
                          </div>
                       </div>

                       <div className="space-y-10">
                          <div className="flex items-center justify-between">
                            <h2 className="text-[10px] font-black text-theme-text uppercase tracking-[0.4em] italic">Mídias de Captura</h2>
                            {(isOwner || availableMedias.length > 0) && (
                              <div className="flex p-1 bg-theme-bg-muted border border-theme-border">
                                 <button onClick={() => setPhotoSource('album')} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest italic transition-all ${photoSource === 'album' ? 'bg-brand-tactical text-black' : 'text-theme-text-muted'}`}>ÁLBUM</button>
                                 <button onClick={() => setPhotoSource('upload')} className={`px-4 py-2 text-[8px] font-black uppercase tracking-widest italic transition-all ${photoSource === 'upload' ? 'bg-brand-tactical text-black' : 'text-theme-text-muted'}`}>UPLOAD</button>
                              </div>
                            )}
                          </div>

                          {photoSource === 'album' ? (
                            <div className="h-[400px] border border-theme-border relative overflow-hidden group">
                               <AlbumPhotoGrid 
                                 medias={availableMedias}
                                 selectedAlbumPhotos={selectedAlbumPhotos}
                                 toggleAlbumPhoto={toggleAlbumPhoto}
                               />
                               <div className="absolute bottom-0 left-0 right-0 p-4 bg-black/80 backdrop-blur-md text-[9px] font-black text-brand-tactical uppercase tracking-widest text-center italic">
                                  {selectedAlbumPhotos.length} / {selectedProduct.maxPhotos || "∞"} selecionadas
                               </div>
                            </div>
                          ) : (
                            <div className="space-y-6">
                               <button 
                                 onClick={() => fileInputRef.current?.click()}
                                 className="w-full aspect-video border-2 border-dashed border-theme-border flex flex-col items-center justify-center gap-4 text-theme-text-muted hover:border-brand-tactical hover:text-brand-tactical transition-all group"
                               >
                                  <div className="p-5 rounded-full bg-theme-bg-muted border border-theme-border group-hover:scale-110 transition-transform"><Camera size={32} /></div>
                                  <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Selecionar do Dispositivo</p>
                               </button>
                               <input ref={fileInputRef} type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                               
                               <div className="grid grid-cols-4 gap-2">
                                  {filePreviews.map((src, idx) => (
                                    <div key={idx} className="relative aspect-square border border-theme-border overflow-hidden">
                                       <img src={src} className="w-full h-full object-cover" />
                                       <button onClick={() => removeFile(idx)} className="absolute top-1 right-1 p-1 bg-black text-white"><X size={10} /></button>
                                    </div>
                                  ))}
                               </div>
                            </div>
                          )}
                       </div>
                    </div>
                    
                    <div className="pt-10 flex justify-end">
                       <button 
                        onClick={() => setStep('delivery')}
                        className="px-12 py-5 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.4em] italic shadow-[0_20px_50px_rgba(20,184,166,0.3)] hover:scale-105 transition-all"
                       >
                          Prosseguir para Entrega
                       </button>
                    </div>
                  </div>
                )}

                {step === 'delivery' && selectedProduct && (
                   <div className="space-y-16 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                      <button onClick={() => setStep('details')} className="flex items-center gap-3 text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:text-brand-tactical transition-all italic">
                         <ChevronLeft size={16} /> Voltar para Configuração
                      </button>

                      <div className="space-y-12">
                         <div className="space-y-4">
                            <h2 className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Método de Distribuição</h2>
                            <div className="h-px w-20 bg-brand-tactical" />
                         </div>

                         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                              onClick={() => setDeliveryMethod('LOCAL_PICKUP')}
                              className={`p-10 border text-left transition-all space-y-6 relative overflow-hidden group ${deliveryMethod === 'LOCAL_PICKUP' ? 'border-brand-tactical bg-brand-tactical/5' : 'border-theme-border hover:border-zinc-700'}`}
                            >
                               <div className={`w-12 h-12 flex items-center justify-center border transition-all ${deliveryMethod === 'LOCAL_PICKUP' ? 'bg-brand-tactical text-black' : 'text-theme-text-muted'}`}><MapPin size={24} /></div>
                               <div className="space-y-2">
                                  <p className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Retirada no Ponto</p>
                                  <p className="text-[9px] text-theme-text-muted uppercase italic">Sem custo adicional • Retirada no local do evento ou sede.</p>
                               </div>
                               {deliveryMethod === 'LOCAL_PICKUP' && <div className="absolute top-4 right-4 text-brand-tactical"><Check size={20} /></div>}
                            </button>

                            <button 
                              onClick={() => setDeliveryMethod('SHIPPING')}
                              className={`p-10 border text-left transition-all space-y-6 relative overflow-hidden group ${deliveryMethod === 'SHIPPING' ? 'border-brand-tactical bg-brand-tactical/5' : 'border-theme-border hover:border-zinc-700'}`}
                            >
                               <div className={`w-12 h-12 flex items-center justify-center border transition-all ${deliveryMethod === 'SHIPPING' ? 'bg-brand-tactical text-black' : 'text-theme-text-muted'}`}><Truck size={24} /></div>
                               <div className="space-y-2">
                                  <p className="text-[11px] font-black text-theme-text uppercase tracking-widest italic">Envio por Transportadora</p>
                                  <p className="text-[9px] text-theme-text-muted uppercase italic">Taxa tática calculada no checkout • Entrega em domicílio.</p>
                               </div>
                               {deliveryMethod === 'SHIPPING' && <div className="absolute top-4 right-4 text-brand-tactical"><Check size={20} /></div>}
                            </button>
                         </div>
                         
                         <div className="p-8 bg-zinc-900/50 border border-theme-border space-y-4">
                            <div className="flex items-center gap-3">
                               <Package size={16} className="text-brand-tactical" />
                               <p className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Protocolo de Produção</p>
                            </div>
                            <p className="text-[10px] text-theme-text-muted uppercase italic leading-relaxed">
                               Este item entra em produção imediatamente após a confirmação do pagamento. O prazo médio de finalização é de 7 a 12 dias úteis, seguindo o padrão de qualidade Foto Segundo.
                            </p>
                         </div>
                      </div>

                      <div className="pt-10 space-y-4">
                        <button 
                          onClick={handleCheckout}
                          disabled={submitting}
                          className="w-full py-6 bg-brand-tactical text-black text-[12px] font-black uppercase tracking-[0.5em] italic shadow-[0_30px_60px_rgba(20,184,166,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-4"
                        >
                           {submitting ? "Sincronizando Gateway..." : <><CreditCard size={20} /> FINALIZAR PEDIDO NO CHECKOUT</>}
                        </button>
                        <button 
                          onClick={handleWhatsAppCheckout}
                          className="w-full py-5 border border-theme-border text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:text-white hover:border-brand-tactical transition-all italic flex items-center justify-center gap-3"
                        >
                           <Phone size={16} /> Encomendar via Consultoria WhatsApp
                        </button>
                      </div>
                   </div>
                )}
             </div>

             {/* Progress bar fixed at bottom of content area */}
             <div className="h-1 bg-theme-border relative">
                <motion.div 
                  className="absolute top-0 left-0 h-full bg-brand-tactical shadow-[0_0_10px_rgba(20,184,166,0.8)]" 
                  initial={{ width: "0%" }}
                  animate={{ width: step === 'catalog' ? "33%" : (step === 'details' ? "66%" : "100%") }}
                />
             </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

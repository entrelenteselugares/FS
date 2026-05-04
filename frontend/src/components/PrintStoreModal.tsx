import { useState, useEffect, useRef, useLayoutEffect } from "react";
import * as reactWindow from "react-window";
// @ts-expect-error virtualized-grid-compatibility
const FixedSizeList = reactWindow.FixedSizeList || reactWindow.default?.FixedSizeList || reactWindow.default;
import { API } from "../lib/api";
import { T, BtnPrimary, BtnSecondary } from "../lib/theme";

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
  QUADROS:     "Quadros & Cadernos",
  REVELACAO:   "Revelação de Fotos",
  ACESSORIOS:  "Acessórios",
};

// Category representative images (illustration)
const CATEGORY_ICONS: Record<string, string> = {
  ALBUM:       "📚",
  ALBUM_30X40: "🖼️",
  QUADROS:     "🎨",
  REVELACAO:   "🖨️",
  ACESSORIOS:  "✨",
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

  const columnCount = Math.max(2, Math.floor(dimensions.width / 110)); // 100px + gap
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
            style={{ 
              width: itemSize - 8,
              height: itemSize - 8,
              margin: 4,
              position: "relative", 
              cursor: "pointer",
              border: `2px solid ${isSelected ? T.brand : "transparent"}`,
              transition: "all 0.15s ease",
              flexShrink: 0
            }}
          >
            <img 
              src={media.url} 
              alt="" 
              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
            />
            {isSelected && (
              <div style={{ position: "absolute", top: 4, right: 4, background: T.brand, color: "#000", borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 900 }}>✓</div>
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
    <div ref={containerRef} style={{ width: "100%", height: "100%" }}>
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
  const [step, setStep] = useState<"catalog" | "details" | "processing">("catalog");
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
    
    // Check limit
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

    setSelectedAlbumPhotos(prev => 
      isSelected ? prev.filter(u => u !== url) : [...prev, url]
    );
  };

  const totalPhotoCount = selectedFiles.length + selectedAlbumPhotos.length;

  const totalPrice = selectedProduct ? selectedProduct.finalPrice * quantity : 0;

  const handleCheckout = async () => {
    if (!selectedProduct) return;
    setSubmitting(true);
    setError("");
    try {
      // Cria um pedido de produto impresso via API
      const { data } = await API.post("/orders/print", {
        eventId,
        productId: selectedProduct.id,
        quantity,
        notes,
        fileCount: totalPhotoCount,
        albumPhotos: selectedAlbumPhotos,
      });
      // Redirect to checkout with the order
      window.location.href = `/checkout?orderId=${data.orderId}`;
    } catch {
      setError("Erro ao processar pedido. Tente novamente.");
      setSubmitting(false);
    }
  };

  const handleWhatsAppCheckout = () => {
    if (!selectedProduct) return;
    const msg = `Olá! Quero encomendar:\n\n*Produto:* ${selectedProduct.name}\n*Quantidade:* ${quantity}\n*Evento:* ${eventTitle}\n*Total:* R$ ${totalPrice.toFixed(2).replace(".", ",")}\n\n${notes ? `*Obs:* ${notes}` : ""}`;
    window.open(`https://wa.me/5519997843817?text=${encodeURIComponent(msg)}`, "_blank");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [activeCategory, step]);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      {/* Backdrop */}
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.92)", backdropFilter: "blur(12px)" }} />

      {/* Modal */}
      <div style={{
        position: "relative",
        width: "100%",
        maxWidth: 760,
        maxHeight: "90vh",
        overflowY: "auto",
        background: T.bg,
        border: `1px solid ${T.border}`,
        animation: "fadeUp 0.3s ease",
        display: "flex",
        flexDirection: "column",
      }}>
        {/* Header */}
        <div style={{ padding: "24px 28px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: 9, letterSpacing: 4, color: T.brand, textTransform: "uppercase", fontWeight: 900, margin: "0 0 4px" }}>Eternize no Papel</p>
            <h2 style={{ fontFamily: T.fontD, fontSize: 22, fontWeight: 900, color: T.text, textTransform: "uppercase", margin: 0, lineHeight: 1 }}>Loja de Impressões</h2>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: T.text3, cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 8 }}>✕</button>
        </div>

        <div style={{ padding: "24px 28px", flex: 1 }}>

          {/* ── STEP 1: CATALOG ── */}
          {step === "catalog" && (
            <>
              {loading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: T.text3, fontSize: 12 }}>
                  Carregando catálogo...
                </div>
              ) : error ? (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#ef4444", fontSize: 12 }}>{error}</div>
              ) : (
                <>
                  {/* Category tabs */}
                  <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                          padding: "8px 16px",
                          fontSize: 9,
                          fontWeight: 900,
                          textTransform: "uppercase",
                          letterSpacing: 2,
                          background: activeCategory === cat ? T.brand : "transparent",
                          color: activeCategory === cat ? "#000" : T.text3,
                          border: `1px solid ${activeCategory === cat ? T.brand : T.border}`,
                          cursor: "pointer",
                          transition: "all 0.15s ease",
                        }}
                      >
                        {CATEGORY_ICONS[cat]} {CATEGORY_LABELS[cat] || cat}
                      </button>
                    ))}
                  </div>

                  {/* Product grid */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
                    {filteredProducts.map(product => (
                      <div
                        key={product.id}
                        onClick={() => { setSelectedProduct(product); setStep("details"); }}
                        style={{
                          border: `1px solid ${T.border}`,
                          background: T.bgCard,
                          padding: 0,
                          cursor: "pointer",
                          transition: "border-color 0.15s ease, transform 0.15s ease",
                          overflow: "hidden",
                        }}
                        onMouseEnter={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = T.brand;
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={e => {
                          (e.currentTarget as HTMLDivElement).style.borderColor = T.border;
                          (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
                        }}
                      >
                        {/* Product visual */}
                        <div style={{
                          height: 120,
                          background: `linear-gradient(135deg, ${T.brand}15, ${T.brand}05)`,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 48,
                          borderBottom: `1px solid ${T.border}`,
                        }}>
                          {CATEGORY_ICONS[product.category]}
                        </div>
                        <div style={{ padding: 14 }}>
                          <p style={{ fontSize: 11, fontWeight: 900, color: T.text, margin: "0 0 4px", lineHeight: 1.3, textTransform: "uppercase" }}>
                            {product.name}
                          </p>
                          {product.description && (
                            <p style={{ fontSize: 9, color: T.text3, margin: "0 0 10px", lineHeight: 1.4 }}>{product.description}</p>
                          )}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <span style={{ fontFamily: T.fontD, fontSize: 18, fontWeight: 900, color: T.brand }}>
                              R$ {product.finalPrice.toFixed(2).replace(".", ",")}
                            </span>
                            <span style={{ fontSize: 8, color: T.text3, textTransform: "uppercase" }}>/{product.unit}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {filteredProducts.length === 0 && (
                    <div style={{ textAlign: "center", padding: "40px 0", color: T.text3, fontSize: 12 }}>
                      Nenhum produto disponível nesta categoria.
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* ── STEP 2: PRODUCT DETAILS ── */}
          {step === "details" && selectedProduct && (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* Back */}
              <button
                onClick={() => setStep("catalog")}
                style={{ background: "none", border: "none", color: T.brand, cursor: "pointer", fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, padding: 0, display: "flex", alignItems: "center", gap: 6, width: "fit-content" }}
              >
                ← Voltar ao Catálogo
              </button>

              {/* Product summary */}
              <div style={{ display: "flex", gap: 20, padding: 20, background: T.bgCard, border: `1px solid ${T.border}` }}>
                <div style={{ width: 80, height: 80, background: `${T.brand}15`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, flexShrink: 0 }}>
                  {CATEGORY_ICONS[selectedProduct.category]}
                </div>
                <div>
                  <p style={{ fontSize: 9, color: T.brand, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, margin: "0 0 4px" }}>
                    {CATEGORY_LABELS[selectedProduct.category]}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 900, color: T.text, textTransform: "uppercase", margin: "0 0 4px", lineHeight: 1.2 }}>
                    {selectedProduct.name}
                  </p>
                  {selectedProduct.description && (
                    <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>{selectedProduct.description}</p>
                  )}
                </div>
              </div>

              {/* Quantity */}
              <div>
                <p style={{ fontSize: 9, letterSpacing: 3, color: T.text3, textTransform: "uppercase", fontWeight: 900, margin: "0 0 12px" }}>Quantidade</p>
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <button
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    style={{ width: 40, height: 40, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >−</button>
                  <span style={{ fontFamily: T.fontD, fontSize: 28, fontWeight: 900, color: T.text, minWidth: 40, textAlign: "center" }}>{quantity}</span>
                  <button
                    onClick={() => setQuantity(q => q + 1)}
                    style={{ width: 40, height: 40, border: `1px solid ${T.border}`, background: T.bgCard, color: T.text, fontSize: 20, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                  >+</button>
                  <div style={{ marginLeft: "auto", textAlign: "right" }}>
                    <p style={{ fontSize: 9, color: T.text3, margin: "0 0 2px", textTransform: "uppercase" }}>Total</p>
                    <p style={{ fontFamily: T.fontD, fontSize: 28, fontWeight: 900, color: T.brand, margin: 0 }}>
                      R$ {totalPrice.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              </div>

              {/* File upload section */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <p style={{ fontSize: 9, letterSpacing: 3, color: T.text3, textTransform: "uppercase", fontWeight: 900, margin: 0 }}>
                    Selecione as Fotos ({totalPhotoCount} {selectedProduct.maxPhotos ? `de ${selectedProduct.maxPhotos}` : ""} selecionada{totalPhotoCount !== 1 ? "s" : ""})
                  </p>
                  
                  {(isOwner || availableMedias.length > 0) && (
                    <div style={{ display: "flex", gap: 4, background: T.bgCard, padding: 4, border: `1px solid ${T.border}` }}>
                      <button 
                        onClick={() => setPhotoSource("upload")}
                        style={{ padding: "4px 8px", fontSize: 8, fontWeight: 900, textTransform: "uppercase", background: photoSource === "upload" ? T.brand : "transparent", color: photoSource === "upload" ? "#000" : T.text3, border: "none", cursor: "pointer" }}
                      >UPLOAD</button>
                      <button 
                        onClick={() => setPhotoSource("album")}
                        style={{ padding: "4px 8px", fontSize: 8, fontWeight: 900, textTransform: "uppercase", background: photoSource === "album" ? T.brand : "transparent", color: photoSource === "album" ? "#000" : T.text3, border: "none", cursor: "pointer" }}
                      >DO ÁLBUM</button>
                    </div>
                  )}

                  {photoSource === "upload" && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={selectedProduct.maxPhotos ? totalPhotoCount >= selectedProduct.maxPhotos : false}
                      style={{ 
                        ...BtnSecondary, 
                        padding: "8px 16px", 
                        fontSize: 9, 
                        color: T.brand, 
                        borderColor: T.brand,
                        opacity: (selectedProduct.maxPhotos && totalPhotoCount >= selectedProduct.maxPhotos) ? 0.3 : 1
                      }}
                    >
                      + Adicionar Fotos
                    </button>
                  )}
                </div>

                {photoSource === "upload" ? (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileSelect}
                      style={{ display: "none" }}
                    />

                    {filePreviews.length > 0 ? (
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))", gap: 8 }}>
                        {filePreviews.map((src, idx) => (
                          <div key={idx} style={{ position: "relative", aspectRatio: "1/1" }}>
                            <img src={src} alt={`foto ${idx + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", border: `1px solid ${T.border}` }} />
                            <button
                              onClick={() => removeFile(idx)}
                              style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: "rgba(0,0,0,0.8)", border: "none", color: "#fff", cursor: "pointer", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center" }}
                            >✕</button>
                          </div>
                        ))}
                        <div
                          onClick={() => fileInputRef.current?.click()}
                          style={{ aspectRatio: "1/1", border: `2px dashed ${T.border}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: T.text3, fontSize: 24 }}
                        >+</div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRef.current?.click()}
                        style={{ border: `2px dashed ${T.border}`, padding: 32, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer", textAlign: "center" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = T.brand)}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
                      >
                        <span style={{ fontSize: 32 }}>🖼️</span>
                        <p style={{ fontSize: 11, color: T.text2, margin: 0 }}>Clique para selecionar as fotos que deseja imprimir</p>
                        <p style={{ fontSize: 9, color: T.text3, margin: 0, textTransform: "uppercase", letterSpacing: 1 }}>JPG, PNG, WEBP</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div 
                    ref={scrollRef}
                    style={{ 
                      height: 350, 
                      overflowY: "hidden", // Let react-window handle scroll
                      border: `1px solid ${T.border}`, 
                      background: T.bgCard,
                      position: "relative"
                    }}
                  >
                    <AlbumPhotoGrid 
                      medias={availableMedias}
                      selectedAlbumPhotos={selectedAlbumPhotos}
                      toggleAlbumPhoto={toggleAlbumPhoto}
                    />
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <p style={{ fontSize: 9, letterSpacing: 3, color: T.text3, textTransform: "uppercase", fontWeight: 900, margin: "0 0 8px" }}>Observações (opcional)</p>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Ex: Capa com foto do casal, nome e data. Lâminas em sequência..."
                  rows={3}
                  style={{ width: "100%", background: T.bgCard, border: `1px solid ${T.border}`, padding: 12, fontSize: 12, color: T.text, outline: "none", resize: "vertical", fontFamily: "inherit", boxSizing: "border-box" }}
                />
              </div>

              {error && <p style={{ fontSize: 11, color: "#ef4444", textAlign: "center" }}>{error}</p>}

              {/* CTA */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, paddingTop: 8 }}>
                <button
                  onClick={handleWhatsAppCheckout}
                  disabled={submitting}
                  style={{ ...BtnPrimary, width: "100%", justifyContent: "center", fontSize: 13, padding: "16px 20px", letterSpacing: 2 }}
                >
                  💬 ENCOMENDAR VIA WHATSAPP
                </button>
                <p style={{ fontSize: 9, color: T.text3, textAlign: "center", margin: 0 }}>
                  Você será redirecionado para o WhatsApp com o resumo do pedido. Nossa equipe confirmará os detalhes e enviará o link de pagamento.
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0" }}>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                  <span style={{ fontSize: 9, color: T.text3, textTransform: "uppercase", letterSpacing: 1 }}>ou</span>
                  <div style={{ flex: 1, height: 1, background: T.border }} />
                </div>
                <button
                  onClick={handleCheckout}
                  disabled={submitting}
                  style={{ ...BtnSecondary, width: "100%", justifyContent: "center", color: T.text }}
                >
                  {submitting ? "Processando..." : "PAGAR AGORA (CHECKOUT)"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div style={{ padding: "16px 28px", borderTop: `1px solid ${T.border}`, background: `${T.brand}06`, flexShrink: 0 }}>
          <p style={{ fontSize: 9, color: T.text3, margin: 0, textAlign: "center", letterSpacing: 1 }}>
            🔒 Pagamento seguro · Produção em até 7 dias úteis · Entrega em todo o Brasil
          </p>
        </div>
      </div>
    </div>
  );
}

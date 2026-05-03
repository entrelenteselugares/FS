import { useState, useEffect, useCallback } from "react";
import { Check, Video, Printer, QrCode, ShoppingCart, Share2, ChevronRight, Image as ImageIcon, Camera } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/Navbar";
import { PrintStoreModal } from "../components/PrintStoreModal";
import { motion, AnimatePresence } from "framer-motion";



interface EventData {
  id: string;
  nomeNoivos: string;
  dataEvento?: string | null;
  paywall: { active: boolean; message: string };
  lightroomUrl?: string | null;
  driveUrl?: string | null;
  slug?: string | null;
  location?: string | null;
  city?: string | null;
  description?: string | null;
  coverPhotoUrl: string | null;
  priceBase: number;
  temFoto?: boolean;
  temVideo?: boolean;
  temReels?: boolean;
  temFotoImpressa?: boolean;
  cartorio?: string | null;
  isCrowdfund?: boolean;
  targetAmount?: number | null;
  collectedAmount?: number;
  previewPhotos?: string[];
  isComingSoon?: boolean;
  priceUnit?: number;
  pendingOrderId?: string | null;
  type?: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE';
  pricePerPhoto?: number;
  isUnitSale?: boolean;
  recentOrders?: { id: string; contributorName: string; valor: number; createdAt: string }[];
  clientEmail?: string | null;
  isPrimaryClient?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  active?: boolean;
}

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
  price?: number | null;
}

interface AccessData {
  lightroomUrl: string | null;
  driveUrl: string | null;
  expiresAt: string;
  eventTitle: string;
  accessType?: "PUBLIC" | "PRIVATE";
  guestToken?: string;
  isGuestOrder?: boolean;
}



interface ServiceData {
  id: string;
  name: string;
  category: string;
  basePrice: number;
  description: string;
}

const Skeleton = ({ className }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded-sm ${className}`} />
);

const LuxuryBadge = ({ children }: { children: React.ReactNode }) => (
  <span className="text-[9px] font-black tracking-[0.2em] uppercase px-3 py-1.5 bg-white/5 border border-theme-border text-theme-muted backdrop-blur-md">
    {children}
  </span>
);

const SERVICES = [
  { key: "temFoto", label: "Fotos em Alta" },
  { key: "temVideo", label: "Vídeo Cinema" },
  { key: "temReels", label: "Reels Vertical" },
  { key: "temFotoImpressa", label: "Impressão" }
];



export default function EventPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<EventData | null>(null);
  const [medias, setMedias] = useState<EventMedia[]>([]);
  const [step, setStep] = useState<"paywall" | "auth" | "choice" | "upsell" | "checkout" | "processing" | "countdown" | "denied" | "success">("paywall");
  const [access, setAccess] = useState<AccessData | null>(null);
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [needsAccessChoice, setNeedsAccessChoice] = useState(false);
  
  const [cart, setCart] = useState<string[]>([]);
  const [cartTotal, setCartTotal] = useState(0);
  const [serviceCatalog, setServiceCatalog] = useState<ServiceData[]>([]);
  const [selectedServices] = useState<string[]>([]);
  const [includeLivePrint] = useState(false);

  const [showPrintStore, setShowPrintStore] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);


  // Carrega carrinho do localStorage
  useEffect(() => {
    if (event?.id) {
      const saved = localStorage.getItem(`fs_cart_${event.id}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setCart(parsed);
          setCartTotal(parsed.length * (event.pricePerPhoto || 15));
        } catch (e) {
          console.error("Erro ao carregar carrinho:", e);
        }
      }
    }
  }, [event?.id, event?.pricePerPhoto]);

  // Salva carrinho no localStorage sempre que mudar
  useEffect(() => {
    if (event?.id) {
      localStorage.setItem(`fs_cart_${event.id}`, JSON.stringify(cart));
    }
  }, [cart, event?.id]);

  // Print Catalog States

  const handleShare = async () => {
    if (access?.accessType === "PRIVATE") {
      alert("Este álbum está em modo PRIVADO. Para compartilhar com seus convidados, você precisa torná-lo PÚBLICO na sua área do cliente (Minha Conta).");
      navigate("/minha-conta");
      return;
    }

    const isMarketplace = event?.type === 'PHOTO_MARKETPLACE';
    const deliveryUrl = isMarketplace 
      ? `${window.location.origin}/e/${event?.slug || event?.id}`
      : `${window.location.origin}/delivery/${event?.id}`;

    const shareData = {
      title: `Álbum: ${event?.nomeNoivos}`,
      text: isMarketplace ? `Veja as fotos ao vivo de ${event?.nomeNoivos}!` : `Confira as fotos do evento ${event?.nomeNoivos} no Foto Segundo!`,
      url: deliveryUrl,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(deliveryUrl);
        alert("Link copiado com sucesso!");
      }
    } catch (err) {
      console.error("Erro ao compartilhar:", err);
    }
  };

  useEffect(() => {
    if (!slug) return;
    const token = searchParams.get("token");
    const params = {
      ...(user?.id ? { userId: user.id } : {}),
      ...(token ? { guestToken: token } : {})
    };
    api.get(`/public/events/${slug}`, { params })
      .then((r) => {
        const eventData = r.data;
        setEvent(eventData);

        const eventDate = eventData.dataEvento ? new Date(eventData.dataEvento) : null;
        
        const now = new Date();
        const isFuture = eventDate && (eventDate.getTime() + (12 * 60 * 60 * 1000)) > now.getTime();

        const intent = searchParams.get("intent");

        if (intent === "upgrade") {
          setStep("paywall");
        } else if (isFuture && !eventData.lightroomUrl && !eventData.driveUrl && (!eventData.previewPhotos || eventData.previewPhotos.length === 0)) {
          setStep("countdown");
        } else if ((!isFuture || eventData.active) && eventData.type === 'ALBUM_FULL') {
          // Apenas álbuns tradicionais (ALBUM_FULL) vão para a página de entrega Luxury
          navigate(`/delivery/${eventData.id}`);
        } else if (eventData.isPrivate && !eventData.isPrimaryClient && !eventData.isOwner) {
          setStep("denied");
        } else if ((eventData.paywall && !eventData.paywall.active) || eventData.isOwner || eventData.type === 'PHOTO_MARKETPLACE') {
          setStep("success"); 
        }

        if (eventData.type === 'PHOTO_MARKETPLACE') {
          api.get(`/marketplace/events/${eventData.id}/media`, { params })
            .then(res => setMedias(res.data))
            .catch(err => console.error("Erro ao carregar mídias:", err));
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) setStep("denied");
        else navigate("/404");
      })
      .finally(() => setLoading(false));


    api.get('/public/service-catalog').then(res => setServiceCatalog(res.data || [])).catch(err => console.error(err));

    const interval = setInterval(() => setCurrentBannerIndex(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, [slug, navigate, user?.id, searchParams]);

  const handleAutoConfirmChoice = useCallback(async (oid: string) => {
    try {
      await api.post(`/orders/${oid}/access-type`, { accessType: "PUBLIC" });
      const { data } = await api.get(`/orders/${oid}/access-status`);
      setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
    } catch (err) { console.error("Erro no auto-confirm:", err); }
  }, [event?.nomeNoivos]);

  useEffect(() => {
    const checkAccessStatus = async (oid: string) => {
      if (!event) return; 
      const token = searchParams.get("token");
      try {
        const { data } = await api.get(`/orders/${oid}/access-status`, { 
          params: token ? { guestToken: token } : {} 
        });
        if (data.status === "PENDING_CHOICE") {
          setStep("success");
          if (event?.isPrimaryClient) setNeedsAccessChoice(true);
          else handleAutoConfirmChoice(oid);
        } else if (data.status === "ACTIVE") {
          setStep("success");
          setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.nomeNoivos || "" });
        }
      } catch { /* not paid */ }
    };
    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessStatus(oid); }
  }, [slug, searchParams, event, handleAutoConfirmChoice]);


  const handleUnlockClick = async () => { 
    if (!event) return;
    
    // Se já é dono ou já pagou, não faz sentido "desbloquear"
    if (event.isOwner || paid) return;

    setLoading(true);
    try {
      // 1. Criar pedido pendente unificado
      const { data } = await api.post("/checkout/pending", {
        eventId: event.id,
        userId: user?.id,
        email: user?.email,
        selectedServices,
        includeLivePrint,
        includeShipping: false, // Vitrine não decide frete, o checkout sim
        cart: cart
      });

      // 2. Redirecionar para o Checkout Unificado v3.1
      navigate(`/checkout/${data.orderId}`);
    } catch (err) {
      console.error("[Unlock Click Error]:", err);
      alert("Não foi possível iniciar o processo de compra. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };


  if (loading && !event) return (
    <div className="h-screen bg-theme-bg flex flex-col overflow-hidden">
      <Navbar />
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_380px]">
        <div className="relative bg-theme-card">
          <Skeleton className="absolute inset-0" />
          <div className="absolute bottom-12 left-12 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-12 w-64" />
          </div>
        </div>
        <div className="bg-theme-bg p-12 space-y-12 border-l border-theme-border">
          <div className="space-y-4">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-48" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </div>
      </div>
    </div>
  );

  if (!event) return null;

  const paid = step === "success";
  const isMarketplace = event.type === 'PHOTO_MARKETPLACE';
  
  const activeServices = SERVICES.filter(s => {
    const val = event[s.key as keyof EventData];
    return val === true || val === "true";
  });

  const toggleCart = (shortId: string) => {
    setCart(prev => {
      const exists = prev.includes(shortId);
      const next = exists ? prev.filter(s => s !== shortId) : [...prev, shortId];
      const price = event.pricePerPhoto || 15;
      setCartTotal(next.length * price);
      return next;
    });
  };

  return (
    <div 
      className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-emerald-500/30 overflow-x-hidden" 
      onContextMenu={(e) => e.preventDefault()}
    >
      <Helmet><title>{`Álbum: ${event.nomeNoivos} | Foto Segundo`}</title></Helmet>

      <Navbar />

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_380px] min-h-[calc(100vh-64px)] overflow-hidden">
        {/* Lado Esquerdo: Capa e Galeria */}
        <section className="relative h-[60vh] lg:h-auto overflow-y-auto bg-theme-card scrollbar-hide">
          {/* Background / Banner Images */}
          <div className="absolute inset-0 z-0">
            {(() => {
              const bannerImages = [event.coverPhotoUrl, ...(event.previewPhotos || [])].filter(Boolean).slice(0, 3);
              return (
                <div className="w-full h-full relative">
                  <AnimatePresence mode="wait">
                    {bannerImages.length > 0 ? (
                      <motion.img 
                        key={currentBannerIndex % bannerImages.length}
                        src={bannerImages[currentBannerIndex % bannerImages.length] as string} 
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: paid ? "none" : "blur(12px) brightness(0.4)" }}
                        initial={{ opacity: 0, scale: 1.1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 2 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-theme-bg">
                        <div className="font-display text-[15vw] text-white/5 uppercase select-none tracking-tighter">{event.nomeNoivos}</div>
                      </div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })()}
            <div className="absolute inset-0 bg-gradient-to-t from-[#141414] via-[#141414]/40 to-transparent z-[1]" />
          </div>

          {/* MARKETPLACE LIVE FEED */}
          {isMarketplace && (
            <div className="absolute inset-0 z-10 flex flex-col bg-black/40 backdrop-blur-3xl">
               <header className="p-8 lg:p-12 pb-4 flex flex-col md:flex-row md:items-end justify-between gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                      <h2 className="font-display text-3xl lg:text-5xl font-black uppercase tracking-tighter">Live Stream</h2>
                    </div>
                    <p className="text-[10px] text-theme-muted uppercase tracking-[0.3em] font-black">Capturas em tempo real • Seleção Phygital</p>
                  </div>
                  
                  {event.isOwner && (
                    <button 
                      onClick={() => setShowQrModal(true)}
                      className="flex items-center gap-3 px-6 py-3 bg-white/5 border border-theme-border text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      <QrCode size={16} className="text-emerald-500" /> QR Code de Captura
                    </button>
                  )}
               </header>

               <div className="flex-1 overflow-y-auto px-8 lg:px-12 pb-32 lg:pb-12 scrollbar-hide">
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-6">
                    {event.previewPhotos?.map((url, idx) => {
                      const refCode = url.split('/').pop()?.split('.')[0] || `FOTO-${idx}`;
                      const isSelected = cart.includes(refCode);
                      return (
                        <motion.div 
                          key={idx} 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          onClick={() => toggleCart(refCode)}
                          className={`relative group aspect-[3/4] bg-black overflow-hidden cursor-pointer border-2 transition-all duration-500 ${isSelected ? "border-emerald-500" : "border-theme-border hover:border-theme-border-2"}`}
                        >
                            {/* Watermark Overlay */}
                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.03] pointer-events-none rotate-[-45deg] select-none">
                              <span className="text-theme-text font-display text-4xl font-black whitespace-nowrap tracking-[1em] uppercase">PROOF</span>
                            </div>

                            <img src={url} alt={refCode} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSelected ? "opacity-30 scale-95" : "opacity-100"}`} />
                            
                            {/* Selection Status Glass */}
                            <div className={`absolute bottom-0 left-0 right-0 p-4 lg:p-5 z-20 flex justify-between items-center backdrop-blur-md transition-all duration-500 ${isSelected ? "bg-emerald-500 text-white" : "bg-black/40 group-hover:bg-black/80"}`}>
                               <div className="flex flex-col">
                                 <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ref.</span>
                                 <span className="text-xl lg:text-2xl font-black tracking-tighter font-display leading-none">
                                   {refCode}
                                 </span>
                               </div>
                               <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isSelected ? "bg-black text-emerald-500" : "bg-white/10 group-hover:bg-emerald-500 group-hover:text-black"}`}>
                                 {isSelected ? <Check size={20} strokeWidth={4} /> : <ShoppingCart size={18} />}
                               </div>
                            </div>
                        </motion.div>
                      );
                    })}
                  </div>
               </div>
            </div>
          )}

          {/* Hero Overlay (quando não é marketplace) */}
          {!isMarketplace && (
            <div className="relative z-10 h-full flex flex-col justify-end p-8 lg:p-20">
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex flex-wrap gap-2 mb-8"
              >
                {activeServices.map(s => (
                  <LuxuryBadge key={s.key}>{s.label}</LuxuryBadge>
                ))}
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-display font-black text-5xl lg:text-8xl uppercase leading-[0.9] tracking-tighter mb-8 max-w-5xl"
              >
                {event.nomeNoivos}
              </motion.h1>
              <div className="flex items-center gap-6 text-theme-muted">
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-1">Data</span>
                  <span className="text-sm font-bold text-theme-text tracking-widest uppercase">{event.dataEvento ? new Date(event.dataEvento).toLocaleDateString() : "Em breve"}</span>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="flex flex-col">
                  <span className="text-[9px] font-black uppercase tracking-[0.3em] mb-1">Localização</span>
                  <span className="text-sm font-bold text-theme-text tracking-widest uppercase">{event.city || "Digital"}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Lado Direito: Sidebar de Controle */}
        <aside className="relative bg-theme-bg border-l border-theme-border flex flex-col shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.05),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 flex-1 overflow-y-auto p-8 lg:p-12 space-y-12 scrollbar-hide">
            {/* Header Sidebar */}
            <div className="flex items-center justify-between border-b border-theme-border pb-8">
              <div className="space-y-1">
                <p className="text-[10px] text-theme-muted uppercase font-black tracking-[0.3em]">Membro Exclusive</p>
                <div className="h-0.5 w-10 bg-emerald-500" />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Live Status</span>
              </div>
            </div>

            {/* Price & Primary CTA */}
            {step === "paywall" && (
              <div className="space-y-10">
                <div className="space-y-2">
                  <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em]">
                    {searchParams.get("intent") === "upgrade" ? "Expansão Premium" : (isMarketplace ? "Carrinho Phygital" : "Coleção Completa")}
                  </p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-light text-theme-subtle tracking-tighter">R$</span>
                    <h2 className="text-7xl lg:text-8xl font-black tracking-tighter font-display leading-none">
                      {(searchParams.get("intent") === "upgrade" 
                        ? (serviceCatalog.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.basePrice), 0) + (includeLivePrint ? 150 : 0))
                        : (isMarketplace ? cartTotal : event.priceBase)
                      ).toFixed(0)}
                    </h2>
                    <span className="text-2xl font-black text-theme-subtle">,00</span>
                  </div>
                  {isMarketplace && (
                    <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">
                      {cart.length} fotos selecionadas para eternizar
                    </p>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleUnlockClick} 
                    className="group relative w-full h-20 bg-white text-theme-text font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <div className="absolute inset-0 bg-emerald-500 translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500" />
                    <span className="relative z-10">{searchParams.get("intent") === "upgrade" ? "Confirmar Upgrade" : "Finalizar Compra"}</span>
                    <ChevronRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
                  
                  <button onClick={handleShare} className="w-full h-14 bg-white/5 border border-theme-border text-theme-muted font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                    <Share2 size={16} /> Compartilhar Galeria
                  </button>
                </div>
              </div>
            )}

            {/* Feature Cards Luxury */}
            {step === "paywall" && (
              <div className="space-y-4 pt-4">
                 <div className="p-6 bg-white/5 border border-theme-border hover:border-emerald-500/30 transition-colors group">
                   <div className="flex items-center gap-4 mb-3">
                     <div className="p-2 bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                       <ImageIcon size={20} />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest">Resolução Máxima</p>
                   </div>
                   <p className="text-[11px] text-theme-muted leading-relaxed font-medium">Arquivos originais em 300 DPI. Sem marcas d'água. Prontos para impressão de grandes formatos.</p>
                 </div>
                 
                 <div className="p-6 bg-white/5 border border-theme-border hover:border-emerald-500/30 transition-colors group">
                   <div className="flex items-center gap-4 mb-3">
                     <div className="p-2 bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-black transition-colors">
                       <Printer size={20} />
                     </div>
                     <p className="text-xs font-black uppercase tracking-widest">Papel de Algodão</p>
                   </div>
                   <p className="text-[11px] text-theme-muted leading-relaxed font-medium">Acesso à loja de álbuns exclusivos com acabamento em couro e papéis fine-art.</p>
                 </div>
              </div>
            )}

            {/* Paid / Success State */}
            {paid && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
                <div className="space-y-4">
                  {event.lightroomUrl && (
                    <a href={event.lightroomUrl} target="_blank" rel="noreferrer" className="w-full h-20 bg-emerald-500 text-white font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-4 shadow-[0_20px_40px_rgba(16,185,129,0.2)]">
                      <Camera size={20} /> Acessar Todas as Fotos
                    </a>
                  )}
                  {event.driveUrl && (
                    <a href={event.driveUrl} target="_blank" rel="noreferrer" className="w-full h-16 bg-white/5 border border-theme-border text-theme-text font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-white/10 transition-all">
                      <Video size={18} /> Galeria de Vídeos
                    </a>
                  )}
                </div>

                <div className="p-10 bg-emerald-500/5 border border-emerald-500/20 relative overflow-hidden group rounded-sm">
                  <div className="absolute -right-12 -bottom-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
                    <Printer size={160} className="text-emerald-500" />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <p className="text-[10px] text-emerald-500 font-black uppercase tracking-[0.4em]">Sessão de Impressão</p>
                      </div>
                      <h4 className="font-display text-3xl font-black uppercase leading-none tracking-tighter">Memórias táteis<br/>em alta gramatura</h4>
                    </div>
                    <button 
                      onClick={() => setShowPrintStore(true)} 
                      className="w-full py-5 bg-white text-theme-text font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 transition-colors shadow-2xl"
                    >
                      Eternizar no Papel
                    </button>
                    <p className="text-[9px] text-theme-subtle uppercase tracking-widest font-bold text-center">Entrega premium em todo o Brasil</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* STICKY MOBILE BUY BAR */}
      {isMarketplace && cart.length > 0 && !paid && (
        <motion.div 
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/80 backdrop-blur-2xl border-t border-emerald-500/30 p-6 pb-10 flex items-center justify-between shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
        >
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500">{cart.length} selecionadas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-light text-theme-muted">R$</span>
              <span className="text-3xl font-black tracking-tighter font-display">{cartTotal.toFixed(0)}</span>
              <span className="text-sm font-bold text-theme-subtle">,00</span>
            </div>
          </div>
          <button 
            onClick={handleUnlockClick}
            className="px-8 py-4 bg-emerald-500 text-white font-black uppercase tracking-widest text-[10px] shadow-[0_10px_25px_rgba(16,185,129,0.4)]"
          >
            Comprar
          </button>
        </motion.div>
      )}

      {/* MODALS */}
      <AuthModal onSuccess={() => setStep("paywall")} onClose={() => setStep("paywall")} />
      
      {showPrintStore && (
        <PrintStoreModal 
          eventId={event.id} 
          eventTitle={event.nomeNoivos} 
          medias={medias} 
          onClose={() => setShowPrintStore(false)} 
        />
      )}

      {needsAccessChoice && orderId && (
        <AccessTypeModal 
          orderId={orderId} 
          eventTitle={event.nomeNoivos} 
          isPrimaryClient={true} 
          onConfirmed={() => setNeedsAccessChoice(false)} 
          onClose={() => setNeedsAccessChoice(false)} 
        />
      )}

      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Captura Phygital">
          <div className="flex flex-col items-center gap-8 py-8">
             <div className="space-y-2 text-center">
               <p className="text-xs font-black uppercase tracking-widest text-emerald-500">Fluxo de Captura ao Vivo</p>
               <p className="text-sm text-theme-muted max-w-xs mx-auto">Peça para os convidados lerem este código para enviarem suas fotos diretamente para o telão e galeria.</p>
             </div>
             <div className="p-6 bg-white rounded-2xl shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
                <QRCodeCanvas 
                  value={`${window.location.origin}/phygital-capture?e=${event.id}`} 
                  size={240}
                  level="H"
                />
             </div>
             <div className="px-4 py-2 bg-white/5 border border-theme-border rounded-full">
               <code className="text-[10px] font-bold text-emerald-500 tracking-wider">
                 {window.location.origin}/phygital-capture?e={event.id}
               </code>
             </div>
          </div>
      </Modal>
    </div>
  );
}

// Sub-componente Modal adaptado para o novo padrão
const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/90 backdrop-blur-md"
        />
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg bg-theme-card border border-theme-border p-8 lg:p-12 shadow-2xl overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-6">
            <button onClick={onClose} className="text-theme-subtle hover:text-white transition-colors">
              <Check size={24} className="rotate-45" />
            </button>
          </div>
          <h3 className="font-display text-2xl font-black uppercase tracking-tighter mb-8">{title}</h3>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

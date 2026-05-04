import { useState, useEffect, useCallback } from "react";
import { Check, Video, Printer, QrCode, ShoppingCart, Share2, ChevronRight, Image as ImageIcon, Camera, MapPin, ListChecks } from "lucide-react";
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
import { CountdownTimer } from "../components/CountdownTimer";

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
  type?: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE' | 'FOTO_POINT';
  pricePerPhoto?: number;
  isUnitSale?: boolean;
  recentOrders?: { id: string; contributorName: string; valor: number; createdAt: string }[];
  clientEmail?: string | null;
  isPrimaryClient?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  active?: boolean;
  unlockedMediaIds?: string[];
  itinerary?: string | null;
  references?: string[];
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

  const handleShare = async () => {
    if (access?.accessType === "PRIVATE") {
      alert("Este álbum está em modo PRIVADO. Para compartilhar com seus convidados, você precisa torná-lo PÚBLICO na sua área do cliente (Minha Conta).");
      navigate("/minha-conta");
      return;
    }

    const isMarketplace = event?.type === 'PHOTO_MARKETPLACE' || event?.type === 'FOTO_POINT';
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
    const token = searchParams.get("token") || localStorage.getItem(`fs_token_${slug}`);
    const savedOid = localStorage.getItem(`fs_order_${slug}`);
    const params = {
      ...(user?.id ? { userId: user.id } : {}),
      ...(token ? { guestToken: token } : {}),
      ...(savedOid ? { orderId: savedOid } : {})
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
          navigate(`/delivery/${eventData.id}`);
        } else if (eventData.isPrivate && !eventData.isPrimaryClient && !eventData.isOwner) {
          setStep("denied");
        } else if ((eventData.paywall && !eventData.paywall.active) || eventData.isOwner || eventData.type === 'PHOTO_MARKETPLACE' || eventData.type === 'FOTO_POINT') {
          setStep("success"); 
        }

        if (eventData.type === 'PHOTO_MARKETPLACE' || eventData.type === 'FOTO_POINT') {
          const mOid = localStorage.getItem(`fs_order_${slug}`);
          const mParams = { ...params, ...(mOid ? { orderId: mOid } : {}) };
          api.get(`/marketplace/events/${eventData.id}/media`, { params: mParams })
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
    const isMarketplaceWithCart = (event.type === 'PHOTO_MARKETPLACE' || event.type === 'FOTO_POINT') && cart.length > 0;
    if (!isMarketplaceWithCart && (event.isOwner || paid)) return;

    setLoading(true);
    try {
      const { data } = await api.post("/checkout/pending", {
        eventId: event.id,
        userId: user?.id,
        email: user?.email,
        selectedServices,
        includeLivePrint,
        includeShipping: false,
        cart: cart
      });
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
  const isMarketplace = event.type === 'PHOTO_MARKETPLACE' || event.type === 'FOTO_POINT';
  
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
    <div className="min-h-screen bg-zinc-950 text-white font-sans selection:bg-brand-tactical/30 overflow-x-hidden selection:text-white" onContextMenu={(e) => e.preventDefault()}>
      <Helmet><title>{`${event.nomeNoivos} | Foto Segundo`}</title></Helmet>
      <Navbar />

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_420px] min-h-[calc(100vh-64px)]">
        {/* Lado Esquerdo: Conteúdo Principal */}
        <section className="relative flex flex-col bg-zinc-950 overflow-y-auto scrollbar-hide">
          
          {/* Header Visual Cinematográfico */}
          <div className="relative h-[45vh] lg:h-[55vh] shrink-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentBannerIndex}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2 }}
                className="absolute inset-0"
              >
                {event.coverPhotoUrl ? (
                  <img 
                    src={event.coverPhotoUrl.toString().trim().replace(/\s/g, '')} 
                    alt="" 
                    className="w-full h-full object-cover opacity-40 blur-sm scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-tactical/20 via-zinc-900 to-black" />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/60 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-8 lg:p-20 space-y-6">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
                <div className="h-0.5 w-12 bg-brand-tactical shadow-[0_0_15px_rgba(20,184,166,0.6)]" />
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.6em] italic">
                  {event.type === 'FOTO_POINT' ? 'Tactical Point Operation' : 'Exclusive Digital Gallery'}
                </p>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-5xl md:text-8xl lg:text-9xl font-heading font-black text-white uppercase tracking-tighter leading-[0.8] italic"
              >
                {event.nomeNoivos}
              </motion.h1>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex flex-wrap items-center gap-8 text-zinc-500">
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-brand-tactical" />
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300 italic">{formatDate(event.dataEvento)}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-brand-tactical" />
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-zinc-300 italic">{event.city || event.location || "Ponto Designado"}</span>
                 </div>
              </motion.div>
            </div>
          </div>

          <div className="flex-1 p-8 lg:p-20 space-y-24 pb-40">
            
            {/* Bloco de Informações / Roteiro (Prioridade) */}
            {(event.itinerary || event.type === 'FOTO_POINT') && (
              <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                <div className="space-y-10">
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-brand-tactical rotate-45" />
                      <h2 className="text-2xl font-heading font-black italic uppercase text-white tracking-tight">Protocolo da Sessão</h2>
                    </div>
                    <div className="h-1 w-20 bg-brand-tactical/30" />
                  </div>
                  
                  <div className="relative p-10 bg-zinc-900/40 border border-theme-border/60 group hover:border-brand-tactical/40 transition-all duration-700">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-tactical" />
                    <p className="text-lg md:text-xl text-zinc-300 leading-relaxed font-medium italic whitespace-pre-line">
                      {event.itinerary || "O fotógrafo definirá o roteiro estratégico para este ponto, otimizando luz e cenário."}
                    </p>
                    <ListChecks size={80} className="absolute -right-8 -bottom-8 text-brand-tactical/5 group-hover:text-brand-tactical/10 transition-colors" />
                  </div>

                  {event.references && event.references.length > 0 && (
                    <div className="space-y-6 pt-4">
                      <p className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Referências Técnicas</p>
                      <div className="flex flex-wrap gap-3">
                        {event.references.map((ref, i) => (
                          <div key={i} className="px-4 py-2 bg-zinc-900 border border-theme-border/40 text-[9px] font-black text-zinc-400 uppercase tracking-widest italic">
                            {ref}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-10">
                   <div className="space-y-4">
                    <h2 className="text-2xl font-heading font-black italic uppercase text-white tracking-tight">Previews</h2>
                    <div className="h-1 w-20 bg-zinc-800" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    {event.previewPhotos && event.previewPhotos.length > 0 ? (
                      event.previewPhotos.slice(0, 4).map((url, idx) => (
                        <div key={idx} className="aspect-[3/4] bg-zinc-900 border border-theme-border/40 overflow-hidden group shadow-2xl">
                          <img src={url} alt="" className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                        </div>
                      ))
                    ) : (
                      <div className="col-span-2 aspect-video bg-zinc-900/50 border border-dashed border-theme-border/40 flex flex-col items-center justify-center p-8 text-center gap-4">
                        <Camera size={32} className="text-zinc-800" />
                        <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em] italic">Aguardando capturas ao vivo...</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Galeria Principal (Marketplace / Live Stream) */}
            {isMarketplace && (
              <div className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-zinc-900 pb-12">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_15px_rgba(16,185,129,0.6)]" />
                      <h2 className="text-4xl lg:text-6xl font-heading font-black italic uppercase tracking-tighter text-white">Live Operations</h2>
                    </div>
                    <p className="text-[11px] text-zinc-500 uppercase tracking-[0.5em] font-black italic">Curadoria instantânea • Alta Performance Phygital</p>
                  </div>
                  
                  <div className="flex gap-4">
                    {event.isOwner && (
                      <button onClick={() => setShowQrModal(true)} className="flex items-center gap-3 px-8 py-5 bg-brand-tactical/10 border border-brand-tactical/40 text-[10px] font-black text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical/20 transition-all italic">
                        <QrCode size={18} /> PAINEL DE CAPTURA
                      </button>
                    )}
                  </div>
                </div>

                {medias.length === 0 ? (
                  <div className="py-40 text-center space-y-6">
                     <Camera size={48} className="mx-auto text-zinc-800 animate-bounce" />
                     <p className="text-[11px] font-black text-zinc-600 uppercase tracking-[0.5em] italic">Iniciando transmissão de dados...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                    {medias.map((m, idx) => {
                      const isSelected = cart.includes(m.shortId);
                      const isUnlocked = event.unlockedMediaIds?.includes(m.shortId) || event.isOwner;

                      return (
                        <motion.div 
                          key={m.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx % 20) * 0.05 }}
                          onClick={() => !isUnlocked && toggleCart(m.shortId)}
                          className={`relative group aspect-[3/4] bg-zinc-950 overflow-hidden border-2 transition-all duration-500 ${isUnlocked ? "border-brand-tactical shadow-[0_0_20px_rgba(20,184,166,0.15)]" : (isSelected ? "border-emerald-500" : "border-theme-border/40 hover:border-zinc-700")}`}
                        >
                          {!isUnlocked && (
                            <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.05] pointer-events-none rotate-[-45deg] select-none">
                              <span className="text-white font-display text-4xl font-black tracking-[1em] uppercase">PROOF</span>
                            </div>
                          )}
                          <img 
                            src={m.url} 
                            alt={m.shortId} 
                            className={`w-full h-full object-cover transition-transform duration-1000 ${!isUnlocked && "group-hover:scale-110 blur-[1px] group-hover:blur-0"} ${isSelected ? "opacity-30 scale-95" : "opacity-100"}`} 
                          />
                          
                          <div className={`absolute bottom-0 left-0 right-0 p-5 z-20 flex justify-between items-end transition-all duration-500 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isUnlocked ? "bg-brand-tactical text-black font-black" : (isSelected ? "bg-emerald-500 text-white" : "bg-black/80 backdrop-blur-md")}`}>
                            <div className="flex flex-col">
                              <span className="text-[8px] font-black uppercase tracking-widest opacity-60 italic">Ref.</span>
                              <span className="text-xl font-black tracking-tighter italic">#{m.shortId}</span>
                            </div>
                            {isUnlocked ? (
                              <button onClick={(e) => { e.stopPropagation(); window.open(m.url, '_blank'); }} className="p-2.5 bg-white text-black hover:bg-zinc-200 transition-colors">
                                <ImageIcon size={18} />
                              </button>
                            ) : (
                              <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isSelected ? "bg-black text-emerald-500" : "bg-white/10 group-hover:bg-emerald-500 group-hover:text-black"}`}>
                                {isSelected ? <Check size={24} strokeWidth={4} /> : <ShoppingCart size={22} />}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Lado Direito: Sidebar Tática */}
        <aside className="relative flex flex-col bg-zinc-900 border-l border-theme-border/60 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 flex-1 overflow-y-auto p-10 lg:p-14 space-y-14 scrollbar-hide">
            <div className="flex items-center justify-between border-b border-theme-border/20 pb-12">
              <div className="space-y-1">
                <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.5em] italic">Membro Exclusive</p>
                <div className="h-0.5 w-12 bg-brand-tactical" />
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-zinc-950 border border-zinc-800">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                <span className="text-[10px] font-black text-white uppercase tracking-widest italic">Live Status</span>
              </div>
            </div>

            {step === "paywall" || step === "success" ? (
              <div className="space-y-14 animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="space-y-4">
                  <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">Investimento</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-light text-zinc-600 tracking-tighter italic">R$</span>
                    <h2 className="text-8xl lg:text-9xl font-black tracking-tighter font-heading italic leading-none text-white">
                      {Number(searchParams.get("intent") === "upgrade" 
                        ? (serviceCatalog.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.basePrice), 0) + (includeLivePrint ? 150 : 0))
                        : (isMarketplace ? cartTotal : event.priceBase)
                      ).toFixed(0)}
                    </h2>
                    <span className="text-3xl font-black text-zinc-600 italic">,00</span>
                  </div>
                  {isMarketplace && (
                    <div className="p-4 bg-brand-tactical/5 border-l-2 border-brand-tactical">
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest italic">
                        {cart.length} {cart.length === 1 ? 'memória selecionada' : 'memórias selecionadas'}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleUnlockClick} 
                    className="group relative w-full h-28 bg-brand-tactical text-black font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-5 overflow-hidden transition-all hover:scale-[1.02] shadow-2xl shadow-brand-tactical/30 italic"
                  >
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 opacity-20" />
                    <span className="relative z-10">{searchParams.get("intent") === "upgrade" ? "Finalizar Upgrade" : "Desbloquear Agora"}</span>
                    <ChevronRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={handleShare} className="w-full h-16 border border-theme-border/40 text-zinc-500 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:bg-zinc-800 hover:text-white transition-all italic">
                    <Share2 size={18} /> Compartilhar Galeria
                  </button>
                </div>

                <div className="space-y-6 pt-10">
                  <TacticalBenefit 
                    icon={<ImageIcon size={22} />} 
                    title="Alta Resolução HD" 
                    desc="Arquivos originais 300 DPI otimizados para impressão." 
                  />
                  <TacticalBenefit 
                    icon={<ShieldCheck size={22} />} 
                    title="Acesso Blindado" 
                    desc="Suas memórias seguras em nosso cloud profissional." 
                  />
                  <TacticalBenefit 
                    icon={<Printer size={22} />} 
                    title="Print Catalog" 
                    desc="Acesso exclusivo à nossa loja de produtos físicos premium." 
                  />
                </div>
              </div>
            ) : step === "countdown" ? (
              <div className="space-y-14 animate-in fade-in slide-in-from-right-8 duration-1000">
                <div className="space-y-6">
                  <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">Antecipação</p>
                  <h3 className="text-4xl lg:text-5xl font-heading font-black uppercase tracking-tighter text-white italic leading-[1.1]">O grande dia está chegando</h3>
                  <p className="text-sm text-zinc-500 font-medium leading-relaxed italic">Sua galeria será liberada automaticamente assim que as capturas forem processadas pela nossa curadoria técnica.</p>
                </div>
                
                <div className="relative p-10 bg-zinc-950 border border-theme-border/40 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-tactical/5 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-tactical/10 text-brand-tactical">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="text-xs font-black text-white uppercase tracking-[0.2em] italic">Reserva Confirmada</p>
                    </div>
                    <p className="text-[11px] text-zinc-500 leading-relaxed font-bold uppercase tracking-widest">Equipe técnica em prontidão para o seu evento.</p>
                  </div>
                </div>

                <button onClick={handleShare} className="w-full h-20 border border-dashed border-theme-border/60 text-zinc-500 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:border-brand-tactical/40 hover:text-white transition-all italic">
                  <Share2 size={20} /> Convidar Amigos
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
      
      {/* Carrinho Mobile Elevado */}
      {isMarketplace && cart.length > 0 && (
        <motion.div initial={{ y: 120 }} animate={{ y: 0 }} className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-black/95 backdrop-blur-3xl border-t border-brand-tactical/40 p-8 pb-14 flex items-center justify-between shadow-[0_-30px_60px_rgba(0,0,0,0.9)]">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-tactical italic">{cart.length} selecionadas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-light text-zinc-600 italic">R$</span>
              <span className="text-4xl font-black tracking-tighter text-white italic">{cartTotal.toFixed(0)}</span>
              <span className="text-sm font-bold text-zinc-600 italic">,00</span>
            </div>
          </div>
          <button onClick={handleUnlockClick} className="px-12 py-5 bg-brand-tactical text-black font-black uppercase tracking-widest text-[11px] italic shadow-[0_15px_30px_rgba(20,184,166,0.3)]">DESBLOQUEAR</button>
        </motion.div>
      )}

      {/* Modais Customizados */}
      {step === "denied" && <AuthModal onSuccess={() => setStep("success")} onClose={() => setStep("paywall")} />}
      {showPrintStore && <PrintStoreModal eventId={event.id} eventTitle={event.nomeNoivos} medias={medias} unlockedMediaIds={event.unlockedMediaIds} isMarketplace={isMarketplace} isOwner={event.isOwner} onClose={() => setShowPrintStore(false)} />}
      {needsAccessChoice && orderId && <AccessTypeModal orderId={orderId} eventTitle={event.nomeNoivos} isPrimaryClient={true} isMarketplace={isMarketplace} onConfirmed={() => setNeedsAccessChoice(false)} onClose={() => setNeedsAccessChoice(false)} />}
      
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Protocolo de Captura Phygital">
        <div className="flex flex-col items-center gap-12 py-12">
          <div className="space-y-4 text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-brand-tactical italic">Captura Instantânea</p>
            <p className="text-sm text-zinc-400 max-w-xs mx-auto italic leading-relaxed">Escaneie para transmitir suas fotos em tempo real para a galeria exclusiva.</p>
          </div>
          <div className="p-10 bg-white rounded-3xl shadow-[0_40px_80px_rgba(20,184,166,0.2)]">
            <QRCodeCanvas value={`${window.location.origin}/phygital-capture?e=${event.id}`} size={260} level="H" />
          </div>
          <div className="px-8 py-4 bg-zinc-950 border border-zinc-800 rounded-full group">
            <code className="text-[10px] font-black text-brand-tactical tracking-widest group-hover:text-white transition-colors">{window.location.origin}/phygital-capture?e={event.id}</code>
          </div>
        </div>
      </Modal>
    </div>
  );

}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/90 backdrop-blur-md" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-theme-card border border-theme-border p-8 lg:p-12 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 p-6"><button onClick={onClose} className="text-theme-subtle hover:text-white transition-colors"><Check size={24} className="rotate-45" /></button></div>
          <h3 className="font-display text-2xl font-black uppercase tracking-tighter mb-8">{title}</h3>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

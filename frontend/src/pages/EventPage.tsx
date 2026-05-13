import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useEventStatus } from "../hooks/useEventStatus";
import { Check, Printer, QrCode, ShoppingCart, Share2, ChevronRight, ChevronLeft, Image as ImageIcon, Camera, MapPin, ListChecks, Clock, ShieldCheck, CheckCircle2, Lock, UserCircle } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import { Helmet } from "react-helmet-async";
import AccessTypeModal from "../components/AccessTypeModal";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { Navbar } from "../components/Navbar";
import { PrintStoreModal } from "../components/PrintStoreModal";
import { PrintCatalog } from "../components/PrintCatalog";
import { motion, AnimatePresence } from "framer-motion";
import { EventEditPanel } from "../components/profissional/EventEditPanel";
import type { EventItem } from "../components/profissional/types";

const formatDate = (date: string | null | undefined) => {
  if (!date) return "Em breve";
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

function TacticalBenefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 bg-white/5 border border-white/5 hover:border-brand-tactical/20 transition-colors group">
      <div className="p-2 h-fit bg-theme-bg-muted border border-white/5 text-brand-tactical group-hover:bg-brand-tactical group-hover:text-black transition-all">
        {icon}
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-black text-theme-text uppercase tracking-widest">{title}</p>
        <p className="text-[10px] text-theme-text-muted font-medium leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

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
  coverPosition?: string | null;
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
  type?: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE' | 'FOTO_POINT' | 'FLASH_EVENT';
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
  photographer?: { id: string; nome: string } | null;
  expirationDate?: string | null;
  isExpired?: boolean;
  retentionDays?: number;
}

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
  price?: number | null;
  isGuest?: boolean;
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

function CountdownTimer({ targetDate }: { targetDate: string }) {
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft(null);
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        d: Math.floor(diff / (1000 * 60 * 60 * 24)),
        h: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        m: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        s: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!timeLeft) return null;

  return (
    <div className="grid grid-cols-4 gap-4">
      {[
        { val: timeLeft.d, label: "DIAS" },
        { val: timeLeft.h, label: "HORAS" },
        { val: timeLeft.m, label: "MIN" },
        { val: timeLeft.s, label: "SEG" },
      ].map((item) => (
        <div key={item.label} className="flex flex-col items-center bg-theme-bg p-4 border border-theme-border/60">
          <span className="text-4xl font-heading font-black text-theme-text tracking-tighter italic">{String(item.val).padStart(2, '0')}</span>
          <span className="text-[8px] font-black text-brand-tactical uppercase tracking-[0.2em]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}





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
  
  const { digitalPhotos, physicalItems, addToCart, removeFromCart, addPhysicalItem, totalPrice } = useCart();
  const [serviceCatalog, setServiceCatalog] = useState<ServiceData[]>([]);
  const [selectedServices] = useState<string[]>([]);
  const [includeLivePrint] = useState(false);

  // Filtramos os itens do carrinho que pertencem a este evento
  const eventCart = digitalPhotos.filter(p => p.eventId === event?.id).map(p => p.shortId);
  const eventPhysicalItems = physicalItems.filter(p => p.eventId === event?.id);
  const cartTotal = totalPrice(Number(event?.pricePerPhoto || 15));

  const [selectedPrintProductId, setSelectedPrintProductId] = useState<string | null>(null);
  const [showPrintStore, setShowPrintStore] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showLiveOps, setShowLiveOps] = useState(true);
  const [showPhygital, setShowPhygital] = useState(true);
  const [filterMode, setFilterMode] = useState<"ALL" | "PRO" | "GUEST">("ALL");
  const [isEditingEvent, setIsEditingEvent] = useState(false);

  const eventStatus = useEventStatus(event?.dataEvento, null, 2, event?.isExpired, event?.active);

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
    
    // 1. Identificar o token (URL tem prioridade sobre LocalStorage)
    const urlToken = searchParams.get("token");
    const storedToken = localStorage.getItem(`fs_token_${slug}`);
    const token = urlToken || storedToken;

    // 2. Persistir o token se ele veio da URL (Magic Link Persistence - Phase 22)
    if (urlToken && urlToken !== storedToken) {
      localStorage.setItem(`fs_token_${slug}`, urlToken);
      console.log(`[Phase 22] Guest Token persistido para o evento: ${slug}`);
    }

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


        const now = new Date();
        const isFuture = eventData.dataEvento ? (() => {
          try {
            const datePart = String(eventData.dataEvento).split('T')[0];
            const [year, month, day] = datePart.split('-').map(Number);
            const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
            return startOfDay.getTime() > now.getTime();
          } catch { return false; }
        })() : false;
        
        const intent = searchParams.get("intent");
        const hasAccess = eventData.hasAccess || eventData.isOwner || (eventData.isPrimaryClient);

        if (intent === "upgrade") {
          setStep("paywall");
        } else if (isFuture) {
          setStep("countdown");
        } else if (eventData.isPrivate && !hasAccess) {
          setStep("denied");
        } else if ((eventData.paywall && !eventData.paywall.active) || hasAccess || eventData.type === 'PHOTO_MARKETPLACE' || eventData.type === 'FOTO_POINT' || eventData.type === 'FLASH_EVENT') {
          setStep("success"); 
        } else {
          setStep("paywall");
        }

        if (eventData.type === 'PHOTO_MARKETPLACE' || eventData.type === 'FOTO_POINT' || eventData.type === 'FLASH_EVENT' || eventData.type === 'ALBUM_FULL') {
          const mOid = localStorage.getItem(`fs_order_${slug}`);
          const mParams = { ...params, ...(mOid ? { orderId: mOid } : {}) };
          api.get(`/marketplace/events/${eventData.id}/media`, { params: mParams })
            .then(res => {
              const data = res.data;
              const mediaList = Array.isArray(data) ? data : (data.media || []);
              const mUnlocked = Array.isArray(data.unlockedMediaIds) ? data.unlockedMediaIds : (data.unlockedMediaIds || []);
              
              setMedias(mediaList);
              
              if (mUnlocked.length > 0) {
                setEvent(prev => prev ? { 
                  ...prev, 
                  unlockedMediaIds: Array.from(new Set([...(prev.unlockedMediaIds || []), ...mUnlocked])) 
                } : null);
              }

              if (mediaList.length > 0 && !isFuture) {
                setStep("success");
              }
            })
            .catch(err => console.error("Erro ao carregar mídias:", err));
        }
      })
      .catch((err) => {
        if (err.response?.status === 403) {
          if (user) setStep("denied"); // Mostrará mensagem de bloqueio para quem já está logado
          else setStep("denied"); // Abrirá o modal de login para quem está deslogado
        } else {
          navigate("/404");
        }
      })
      .finally(() => setLoading(false));

    api.get('/public/service-catalog').then(res => setServiceCatalog(res.data || [])).catch(err => console.error(err));

    const interval = setInterval(() => setCurrentBannerIndex(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, [slug, navigate, user, searchParams]);

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
    const isMarketplaceWithCart = isMarketplace && (eventCart.length > 0 || eventPhysicalItems.length > 0);
    
    if (!isMarketplaceWithCart && (event.isOwner || paid)) {
      const gallery = document.getElementById('gallery-section');
      if (gallery) {
        gallery.scrollIntoView({ behavior: 'smooth' });
      } else {
        // Fallback: scroll a bit down
        window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' });
      }
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post("/checkout/pending", {
        eventId: event.id,
        userId: user?.id,
        email: user?.email,
        selectedServices,
        includeLivePrint,
        includeShipping: eventPhysicalItems.length > 0,
        cart: eventCart,
        physicalItems: eventPhysicalItems.map(i => ({ 
          id: i.productId, 
          quantity: i.quantity,
          selectedPhotos: i.selectedPhotos
        }))
      });
      localStorage.setItem('fs_last_order_id', data.orderId);
      navigate(`/checkout/${data.orderId}`);
    } catch (err) {
      console.error("[Unlock Click Error]:", err);
      alert("Não foi possível iniciar o processo de compra. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const toggleCart = (shortId: string, url?: string) => {
    if (!event) return;
    const exists = eventCart.includes(shortId);
    if (exists) {
      removeFromCart(event.id, shortId);
    } else {
      addToCart(event.id, shortId, url);
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
  const isMarketplace = event.type === 'PHOTO_MARKETPLACE' || event.type === 'FOTO_POINT' || event.type === 'FLASH_EVENT';


  const isEventOver = event.dataEvento ? (() => {
    try {
      const datePart = String(event.dataEvento).split('T')[0];
      const [year, month, day] = datePart.split('-').map(Number);
      const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);
      // Give 12 hours grace period into the next day
      const endOfEvent = new Date(endOfDay.getTime() + (12 * 60 * 60 * 1000));
      return endOfEvent.getTime() < new Date().getTime();
    } catch {
      return false;
    }
  })() : false;

return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30 overflow-x-hidden selection:text-theme-text" onContextMenu={(e) => e.preventDefault()}>
      <Helmet><title>{`${event.nomeNoivos} | Foto Segundo`}</title></Helmet>
      <Navbar />

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_330px] min-h-[calc(100vh-64px)]">
        {/* Lado Esquerdo: Conteúdo Principal */}
        <section className="relative flex flex-col bg-theme-bg overflow-y-auto scrollbar-hide">
          <button 
             onClick={() => navigate(-1)} 
             className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-theme-bg/60 backdrop-blur-md border border-theme-border rounded-full text-theme-text hover:bg-brand-tactical hover:text-black transition-all shadow-xl"
          >
             <ChevronLeft size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
          </button>
          {/* Header Visual Cinematográfico (Sempre Visível para Consistência) */}
          <div className="relative h-[40vh] lg:h-[50vh] shrink-0 overflow-hidden">
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
                    style={{ objectPosition: event.coverPosition || 'center' }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-brand-tactical/20 via-theme-bg-muted to-theme-bg" />
                )}
              </motion.div>
            </AnimatePresence>
            <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/60 to-transparent" />
            
            <div className="absolute inset-0 flex flex-col justify-end p-6 pt-24 lg:p-12 lg:pt-32 space-y-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-4 mb-6">
                <div className="h-px w-12 bg-brand-tactical" />
                <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.5em] italic">
                  {step === 'countdown' ? "Contagem Regressiva" : (
                    event.type === 'FOTO_POINT' ? "Tactical Point Operation" : 
                    event.type === 'PHOTO_MARKETPLACE' ? "Live Print System" : 
                    "Premium Event Delivery"
                  )}
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl lg:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter leading-[0.85] italic max-w-2xl md:max-w-5xl"
              >
                {event.nomeNoivos}
              </motion.h1>

              <div className="flex flex-wrap items-center gap-8 text-theme-text-muted">
                 <div className="flex items-center gap-2">
                   <Clock size={16} className="text-brand-tactical" />
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-theme-text-muted italic">{formatDate(event.dataEvento)}</span>
                 </div>
                 <div className="flex items-center gap-2">
                   <MapPin size={16} className="text-brand-tactical" />
                   <span className="text-xs font-black uppercase tracking-[0.2em] text-theme-text-muted italic">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "Ponto Designado"}</span>
                 </div>
              </div>
            </div>
          </div>

          {/* ── QR CODE MODAL (Acessível a todos) ── */}
          <div className="fixed bottom-10 right-10 z-[200] flex flex-col items-end gap-4 print:hidden pointer-events-none">
            <AnimatePresence>
              {showQrModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-[var(--bg-card)] border border-brand-tactical/40 p-8 shadow-2xl mb-4 w-[320px] relative pointer-events-auto"
                >
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-brand-tactical" />
                    <div className="flex justify-between items-start mb-6">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Captura Phygital</p>
                        <h4 className="text-sm font-black text-white uppercase italic">Protocolo Ativo</h4>
                      </div>
                      <button onClick={() => setShowQrModal(false)} className="text-zinc-500 hover:text-white"><Check size={20} className="rotate-45" /></button>
                    </div>
                    <div className="bg-white p-4 rounded-xl mb-6">
                      <QRCodeCanvas value={`${window.location.origin}/phygital-capture?e=${event.id}`} size={240} level="H" />
                    </div>
                    <p className="text-[9px] text-zinc-500 uppercase font-bold text-center italic leading-relaxed">
                      Aponte a câmera para transmitir fotos em tempo real para este painel.
                    </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Professional Tactical Hub (Floating - Apenas PRO/ADMIN) ── */}
          {(user?.role === 'PROFISSIONAL' || user?.role === 'FRANCHISEE' || user?.role === 'ADMIN') && (
            <div className="fixed bottom-10 right-10 z-[150] flex flex-col items-end gap-4 print:hidden">
              <button 
                onClick={() => setShowQrModal(!showQrModal)}
                className={`w-20 h-20 rounded-full flex items-center justify-center shadow-2xl transition-all duration-500 group relative overflow-hidden ${showQrModal ? "bg-[var(--bg-card)] border border-brand-tactical text-brand-tactical" : "bg-brand-tactical text-black"}`}
              >
                {!showQrModal && (
                  <div className="absolute inset-0 bg-white/20 scale-0 group-hover:scale-100 transition-transform duration-700 rounded-full" />
                )}
                {showQrModal ? <Check size={32} className="rotate-45" /> : <QrCode size={32} />}
                
                {/* Badge de Alerta */}
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 border-2 border-zinc-950 rounded-full flex items-center justify-center">
                  <span className="text-[10px] font-black text-white italic">PRO</span>
                </div>
              </button>
            </div>
          )}

          {step === "countdown" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12 space-y-16 text-center relative">
              <div className="space-y-6 max-w-3xl">
                <p className="text-xl md:text-2xl text-theme-text-muted font-medium italic">
                  {event.type === 'ALBUM_FULL' 
                    ? "Sua galeria premium está sendo preparada com curadoria técnica. Falta pouco para reviver esses momentos."
                    : "A transmissão tática de capturas começará em breve. Sincronize seus dispositivos para acesso instantâneo."
                  }
                </p>
              </div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-4xl">
                <CountdownTimer targetDate={event.dataEvento || ""} />
              </motion.div>
              
              <div className="pt-8">
                <button onClick={handleShare} className="px-12 py-5 border border-brand-tactical/30 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] hover:bg-brand-tactical hover:text-black transition-all italic flex items-center gap-3">
                  <Share2 size={16} /> CONVIDAR AMIGOS
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 p-8 lg:p-12 space-y-16 pb-40">
              
              {/* Bloco de Informações / Roteiro (Prioridade) */}
              {(event.itinerary || event.type === 'FOTO_POINT') && (
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                  <div className="space-y-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-brand-tactical rotate-45" />
                        <h2 className="text-2xl font-heading font-black italic uppercase text-theme-text tracking-tight">Protocolo da Sessão</h2>
                      </div>
                      <div className="h-1 w-20 bg-brand-tactical/30" />
                    </div>
                    
                    <div className="relative p-10 bg-theme-bg-muted/40 border border-theme-border/60 group hover:border-brand-tactical/40 transition-all duration-700">
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-brand-tactical" />
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-brand-tactical/20 flex items-center justify-center text-brand-tactical border border-brand-tactical/30">
                            <Camera size={14} />
                          </div>
                          <div>
                            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.2em]">{event.type === 'FOTO_POINT' ? "Convite Editorial" : "Diretriz de Operação"}</p>
                            <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">{event.photographer?.nome || "Fotógrafo Designado"}</p>
                          </div>
                        </div>
                        
                        <p className="text-lg md:text-xl text-theme-text-muted leading-relaxed font-medium italic whitespace-pre-line">
                          {event.description || event.itinerary || (event.type === 'FOTO_POINT' ? "Participe deste ensaio aberto. Capture memórias profissionais em um cenário exclusivo." : "Aguardando definição do roteiro estratégico.")}
                        </p>

                        {event.type === 'FOTO_POINT' && (
                          <div className="pt-6 border-t border-theme-border/40 flex flex-wrap gap-6">
                             <div className="flex items-center gap-2">
                               <ShieldCheck size={14} className="text-brand-tactical" />
                               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Proteção de Conteúdo</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <Clock size={14} className="text-brand-tactical" />
                               <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Sync Canon</span>
                             </div>
                          </div>
                        )}
                      </div>
                      <ListChecks size={40} className="absolute bottom-6 right-6 text-brand-tactical/5 group-hover:text-brand-tactical/10 transition-colors" />
                    </div>

                    {event.references && event.references.length > 0 && (
                      <div className="space-y-6 pt-4">
                        <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.4em]">Referências Técnicas</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {event.references.map((ref, i) => (
                            <div key={i} data-shortid={ref} data-testid={`photo-${ref}`} className="aspect-video bg-theme-bg-muted border border-theme-border/40 overflow-hidden group">
                              {ref.startsWith('http') ? (
                                <img src={ref} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="Referência" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center p-4 text-center text-[9px] font-black text-theme-text-muted uppercase tracking-widest italic">
                                  {ref}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-10">
                     <div className="space-y-4">
                      <h2 className="text-2xl font-heading font-black italic uppercase text-theme-text tracking-tight">Previews</h2>
                      <div className="h-1 w-20 bg-theme-border/60" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      {event.previewPhotos && event.previewPhotos.length > 0 ? (
                        event.previewPhotos.slice(0, 4).map((url, idx) => (
                          <div key={idx} className="aspect-[3/4] bg-theme-bg-muted border border-theme-border/40 overflow-hidden group shadow-2xl">
                            <img src={url} alt="" className="w-full h-full object-cover grayscale brightness-75 group-hover:grayscale-0 group-hover:brightness-100 transition-all duration-700" />
                          </div>
                        ))
                      ) : (
                        <div className="col-span-2 aspect-video bg-theme-bg-muted/50 border border-dashed border-theme-border/40 flex flex-col items-center justify-center p-8 text-center gap-4">
                          <Camera size={32} className="text-zinc-800" />
                          <p className="text-[10px] text-theme-text-muted/60 font-black uppercase tracking-[0.3em] italic">Aguardando capturas ao vivo...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Galeria Principal (Marketplace / Live Stream / Guest Photos) ── */}
              {(isMarketplace || (event.type === 'ALBUM_FULL' && step === 'success')) && (
                <div id="gallery-section" className="space-y-16 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 scroll-mt-20">
                  <div className="pt-20">
                    <div className="flex items-center gap-4 mb-10 cursor-pointer group" onClick={() => setShowLiveOps(!showLiveOps)}>
                      <div className="h-px flex-1 bg-theme-border/20 group-hover:bg-brand-tactical/30 transition-colors" />
                      
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-2.5 h-2.5 rounded-full ${eventStatus.dotClass}`}
                          title={eventStatus.label}
                        />
                        
                        <h2 className="font-heading font-black text-2xl lg:text-4xl text-theme-text uppercase italic tracking-widest flex items-center gap-4 group-hover:text-brand-tactical transition-colors">
                          Live Operations
                          <motion.span animate={{ rotate: showLiveOps ? 90 : 0 }}>
                            <ChevronRight size={24} className="text-theme-text-muted group-hover:text-brand-tactical" />
                          </motion.span>
                        </h2>
                      </div>

                      <div className="h-px flex-1 bg-theme-border/20 group-hover:bg-brand-tactical/30 transition-colors" />
                    </div>
                    
                    <p className="text-[11px] text-center text-theme-text-muted uppercase tracking-[0.5em] font-black italic -mt-6 mb-12">
                      Curadoria instantânea • Alta Performance Phygital
                    </p>

                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                      <div className="flex bg-white/5 border border-white/10 rounded-xl overflow-hidden p-1">
                        <button 
                          onClick={() => setFilterMode("ALL")}
                          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${filterMode === "ALL" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          TODAS
                        </button>
                        <button 
                          onClick={() => setFilterMode("PRO")}
                          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${filterMode === "PRO" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          <Camera size={12} /> PRO
                        </button>
                        <button 
                          onClick={() => setFilterMode("GUEST")}
                          className={`px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${filterMode === "GUEST" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          <UserCircle size={12} /> CONVIDADOS
                        </button>
                      </div>

                      {event.isOwner && (
                        <button onClick={() => setShowQrModal(true)} className="flex items-center gap-3 px-8 py-5 bg-brand-tactical/10 border border-brand-tactical/40 text-[10px] font-black text-brand-tactical uppercase tracking-widest hover:bg-brand-tactical/20 transition-all italic">
                          <QrCode size={18} /> PAINEL DE CAPTURA
                        </button>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {showLiveOps && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: "auto", opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        {medias.length === 0 ? (
                          <div className="py-16 border border-dashed border-theme-border/40 bg-theme-bg/20 flex flex-col items-center justify-center text-center px-10 group relative overflow-hidden">
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(20,184,166,0.05),transparent_70%)] pointer-events-none" />
                            <div className="relative mb-6">
                              <div className="absolute inset-0 bg-brand-tactical/20 blur-3xl rounded-full scale-150 animate-pulse" />
                              <div className="relative w-24 h-24 rounded-full border border-brand-tactical/30 flex items-center justify-center bg-theme-bg shadow-2xl">
                                <Camera size={40} className="text-brand-tactical group-hover:scale-110 transition-transform duration-700" />
                              </div>
                            </div>
                            <p className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.6em] mb-4 italic">Transmissão Tática</p>
                            <h3 className="text-3xl font-heading font-black text-theme-text uppercase italic tracking-tighter mb-4">
                              {isEventOver ? "Operação Encerrada" : "Galeria em Formação"}
                            </h3>
                            <p className="max-w-md text-xs text-theme-text-muted uppercase tracking-widest leading-relaxed mb-6">
                              {isEventOver 
                                ? "O período de capturas ao vivo para este evento foi concluído. A galeria agora está em modo de exposição e venda."
                                : "Nossa equipe técnica está processando as capturas deste ponto em tempo real. As memórias aparecerão aqui instantaneamente."}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                              <button 
                                onClick={() => window.location.reload()}
                                className="px-8 py-4 border border-theme-border/60 text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:border-brand-tactical hover:text-theme-text hover:bg-brand-tactical/5 transition-all italic"
                              >
                                Sincronizar Galeria
                              </button>
                              {(isMarketplace && !isEventOver) && (
                                <button 
                                  onClick={() => setShowQrModal(true)}
                                  className="px-8 py-4 bg-brand-tactical text-black font-black uppercase tracking-widest text-[10px] italic shadow-[0_15px_30px_rgba(20,184,166,0.3)] flex items-center gap-3"
                                >
                                  <QrCode size={18} /> TRANSMITIR MINHAS FOTOS
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 lg:gap-8">
                            {medias.filter(m => filterMode === "ALL" || (filterMode === "GUEST" ? m.isGuest : !m.isGuest)).map((m, idx) => {
                              const isSelected = eventCart.includes(m.shortId);
                              const isUnlocked = event.unlockedMediaIds?.includes(m.shortId) || event.isOwner;

                              return (
                                  <motion.div 
                                    key={m.id} layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: (idx % 20) * 0.05 }}
                                    data-shortid={m.shortId}
                                    data-testid={`photo-${m.shortId}`}
                                    onClick={() => !isUnlocked && toggleCart(m.shortId, m.url)}
                                    className={`relative group aspect-[3/4] bg-theme-bg overflow-hidden border-2 transition-all duration-500 ${isUnlocked ? "border-brand-tactical shadow-[0_0_20px_rgba(20,184,166,0.15)]" : (isSelected ? "border-emerald-500 cursor-pointer" : "border-theme-border/40 hover:border-zinc-700 cursor-pointer")}`}
                                  >
                                  {!isUnlocked && (
                                    <div className="absolute inset-0 z-10 flex items-center justify-center opacity-[0.05] pointer-events-none rotate-[-45deg] select-none">
                                      <span className="text-theme-text font-display text-4xl font-black tracking-[1em] uppercase">PROOF</span>
                                    </div>
                                  )}
                                  <img 
                                    src={m.url} 
                                    alt={m.shortId} 
                                    className={`w-full h-full object-cover transition-transform duration-1000 fs-protected-media ${!isUnlocked && "group-hover:scale-110 blur-[1px] group-hover:blur-0"} ${isSelected ? "opacity-30 scale-95" : "opacity-100"}`} 
                                    onContextMenu={(e) => e.preventDefault()}
                                  />
                                  
                                  <div className={`absolute bottom-0 left-0 right-0 p-5 z-20 flex justify-between items-end transition-all duration-500 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 ${isUnlocked ? "bg-brand-tactical text-black font-black" : (isSelected ? "bg-emerald-500 text-theme-text" : "bg-theme-bg-muted/90 backdrop-blur-md")}`}>
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* ── Print Catalog (Phygital Shop) - SEGUNDO ── */}
              {event.id && (
                <div className="pt-20">
                  <div className="flex items-center gap-4 mb-10 cursor-pointer group" onClick={() => setShowPhygital(!showPhygital)}>
                    <div className="h-px flex-1 bg-theme-border/20 group-hover:bg-brand-tactical/30 transition-colors" />
                    <h3 className="font-heading font-black text-2xl lg:text-4xl text-theme-text uppercase italic tracking-widest flex items-center gap-4 group-hover:text-brand-tactical transition-colors">
                      Upgrade Phygital
                      <motion.span animate={{ rotate: showPhygital ? 90 : 0 }}>
                        <ChevronRight size={24} className="text-theme-text-muted group-hover:text-brand-tactical" />
                      </motion.span>
                    </h3>
                    <div className="h-px flex-1 bg-theme-border/20 group-hover:bg-brand-tactical/30 transition-colors" />
                  </div>

                  <AnimatePresence>
                    {showPhygital && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <PrintCatalog 
                          eventId={event.id} 
                          selectedProductId={selectedPrintProductId}
                          onAddToCart={(product) => {
                            setSelectedPrintProductId(product.id);
                            addPhysicalItem({
                              productId: product.id,
                              name: product.name,
                              price: Number(product.sellingPrice || 0),
                              quantity: 1,
                              selectedPhotos: [], // Usuário selecionará depois ou o catálogo cuida disso
                              eventId: event.id
                            });
                          }}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Lado Direito: Sidebar Tática */}
        <aside className="relative flex flex-col bg-theme-bg-muted border-l border-theme-border/60 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 flex-1 overflow-y-auto p-6 lg:p-8 space-y-14 scrollbar-hide">
            <div className="flex items-center justify-between border-b border-theme-border/20 pb-12">
              <div className="space-y-1">
                <p className="text-[10px] text-theme-text-muted uppercase font-black tracking-[0.5em] italic">Membro Exclusive</p>
                <div className="h-0.5 w-12 bg-brand-tactical" />
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-theme-bg border border-theme-border/60">
                <div
                  className={`w-2 h-2 rounded-full ${eventStatus.dotClass}`}
                  title={eventStatus.label}
                />
                <span className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">
                  {eventStatus.label}
                </span>
              </div>
            </div>

            {/* Hub de Gestão (Apenas Profissional/Admin) */}
            {(event.isOwner || user?.role === 'ADMIN') && (
              <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 space-y-4">
                 <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-brand-tactical" />
                    <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Gestão Tática do Evento</span>
                 </div>
                 <div className="grid grid-cols-1 gap-2">
                    <button 
                      onClick={() => !isEventOver && setShowQrModal(true)}
                      className={`w-full py-4 bg-[var(--bg-card)] border border-brand-tactical/30 text-brand-tactical text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center justify-center gap-3 ${isEventOver ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-brand-tactical hover:text-black'}`}
                      disabled={isEventOver}
                    >
                      <QrCode size={16} /> {isEventOver ? 'CAPTURAS ENCERRADAS' : 'QR CODE DE CAPTURA'}
                    </button>
                    {(user?.role === 'ADMIN' || user?.role === 'PROFISSIONAL' || user?.role === 'FRANCHISEE' || user?.role === 'CARTORIO' || user?.role === 'UNIDADE') && (
                      <button 
                        onClick={() => {
                          setIsEditingEvent(true);
                        }}
                        className="w-full py-4 border border-theme-border/60 text-theme-text-muted text-[10px] font-black uppercase tracking-widest hover:text-theme-text hover:border-theme-border hover:bg-theme-bg-muted transition-all italic flex items-center justify-center gap-3"
                      >
                        <Camera size={16} /> EDITAR CONFIGURAÇÕES
                      </button>
                    )}
                 </div>
              </div>
            )}

            {/* Hub de Participação (Para Convidados em Marketplace) */}
            {(!event.isOwner && isMarketplace) && (
              <div className="p-6 bg-theme-bg-muted border border-theme-border/40 space-y-4">
                 <div className="flex items-center gap-2">
                    <QrCode size={16} className={isEventOver ? "text-zinc-600" : "text-brand-tactical"} />
                    <span className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Galeria Live</span>
                 </div>
                 <p className="text-[9px] text-theme-text-muted leading-relaxed uppercase tracking-wider italic">
                   {isEventOver 
                     ? "O período de envio de fotos em tempo real para este evento foi encerrado." 
                     : "Envie suas fotos agora para o painel do evento e apareça na transmissão oficial!"}
                 </p>
                 {!isEventOver && (
                   <button 
                     onClick={() => setShowQrModal(true)}
                     className="w-full py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all italic flex items-center justify-center gap-3"
                   >
                     MOSTRAR QR CODE
                   </button>
                 )}
              </div>
            )}

            {step === "paywall" || step === "success" ? (
              <div className="space-y-14 animate-in fade-in slide-in-from-right-8 duration-1000">
                {isMarketplace && (
                  <div className="space-y-4">
                    <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">Investimento</p>
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-light text-theme-text-muted/60 tracking-tighter italic">R$</span>
                      <h2 className="text-6xl lg:text-7xl font-black tracking-tighter font-heading italic leading-none text-theme-text">
                        {Number(searchParams.get("intent") === "upgrade" 
                          ? (serviceCatalog.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.basePrice), 0) + (includeLivePrint ? 150 : 0))
                          : (isMarketplace ? cartTotal : event.priceBase)
                        ).toFixed(0)}
                      </h2>
                      <span className="text-3xl font-black text-theme-text-muted/60 italic">,00</span>
                    </div>
                    <div className="p-4 bg-brand-tactical/5 border-l-2 border-brand-tactical">
                      <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest italic">
                        {eventCart.length > 0 && `${eventCart.length} ${eventCart.length === 1 ? 'foto digital' : 'fotos digitais'}`}
                        {eventCart.length > 0 && eventPhysicalItems.length > 0 && ' + '}
                        {eventPhysicalItems.length > 0 && `${eventPhysicalItems.length} ${eventPhysicalItems.length === 1 ? 'produto físico' : 'produtos físicos'}`}
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-4">
                  <button 
                    onClick={handleUnlockClick} 
                    className="group relative w-full h-28 bg-brand-tactical text-black font-black uppercase tracking-[0.4em] text-xs flex items-center justify-center gap-5 overflow-hidden transition-all hover:scale-[1.02] shadow-2xl shadow-brand-tactical/30 italic"
                  >
                    <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 opacity-20" />
                    <span className="relative z-10">
                      {searchParams.get("intent") === "upgrade" ? "Finalizar Upgrade" : 
                        event.type === 'ALBUM_FULL' ? "Desbloquear Álbum" : 
                        "Finalizar Compra"}
                    </span>
                    <ChevronRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
                  <button onClick={handleShare} className="w-full h-16 border border-theme-border/40 text-theme-text-muted font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:bg-theme-border/60 hover:text-theme-text transition-all italic">
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
                    <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">
                      {event.type === 'ALBUM_FULL' ? "Antecipação" : "Galeria Ao Vivo"}
                    </p>
                    <h3 className="text-2xl lg:text-3xl font-heading font-black uppercase tracking-tighter text-theme-text italic leading-[1.1] text-left">
                      {event.type === 'ALBUM_FULL' ? "O grande dia está chegando" : 
                       event.type === 'PHOTO_MARKETPLACE' ? "Live Print em Processamento" : 
                       "Captura em Processamento"}
                    </h3>
                  </div>
                
                <div className="relative p-10 bg-theme-bg border border-theme-border/40 group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-tactical/5 blur-3xl rounded-full" />
                  <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-brand-tactical/10 text-brand-tactical">
                        <CheckCircle2 size={28} />
                      </div>
                      <p className="text-xs font-black text-theme-text uppercase tracking-[0.2em] italic text-left">Reserva Confirmada</p>
                    </div>
                    <p className="text-[11px] text-theme-text-muted leading-relaxed font-bold uppercase tracking-widest">Equipe técnica em prontidão para o seu evento.</p>
                  </div>
                </div>

                <button onClick={handleShare} className="w-full h-20 border border-dashed border-theme-border/60 text-theme-text-muted font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:border-brand-tactical/40 hover:text-theme-text transition-all italic">
                  <Share2 size={20} /> CONVIDAR AMIGOS
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
      
      {/* Carrinho Mobile Elevado */}
      {isMarketplace && eventCart.length > 0 && (
        <motion.div initial={{ y: 120 }} animate={{ y: 0 }} className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-theme-bg/90 backdrop-blur-3xl border-t border-brand-tactical/40 p-8 pb-14 flex items-center justify-between shadow-2xl dark:bg-black/95">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-tactical italic">{eventCart.length} selecionadas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-light text-theme-text-muted/60 italic">R$</span>
              <span className="text-4xl font-black tracking-tighter text-theme-text italic">{cartTotal.toFixed(0)}</span>
              <span className="text-sm font-bold text-theme-text-muted/60 italic">,00</span>
            </div>
          </div>
          <button onClick={handleUnlockClick} className="px-12 py-5 bg-brand-tactical text-black font-black uppercase tracking-widest text-[11px] italic shadow-[0_15px_30px_rgba(20,184,166,0.3)]">DESBLOQUEAR</button>
        </motion.div>
      )}

      {/* Modais Customizados */}
      {step === "denied" && (
        user ? (
          <Modal isOpen={true} onClose={() => setStep("paywall")} title="Álbum Privado">
            <div className="flex flex-col items-center gap-8 py-10 text-center">
              <div className="p-4 bg-red-500/10 text-red-500 rounded-full">
                <Lock size={32} />
              </div>
              <div className="space-y-4">
                <p className="text-sm text-theme-text-muted italic leading-relaxed">
                  Você está logado como <span className="text-theme-text font-bold">{user.email}</span>, mas esta galeria é restrita aos noivos e convidados autorizados.
                </p>
                <p className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Protocolo de Segurança Ativo</p>
              </div>
              <div className="flex flex-col w-full gap-4 pt-6">
                <a href="https://wa.me/5519997843817" target="_blank" rel="noreferrer" className="w-full py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest text-center italic shadow-lg shadow-brand-tactical/20">FALAR COM SUPORTE</a>
                <button onClick={() => setStep("paywall")} className="w-full py-4 border border-theme-border text-theme-text-muted text-[10px] font-black uppercase tracking-widest italic">VOLTAR</button>
              </div>
            </div>
          </Modal>
        ) : (
          <AuthModal onSuccess={() => setStep("success")} onClose={() => setStep("paywall")} />
        )
      )}
      {showPrintStore && <PrintStoreModal eventId={event.id} eventTitle={event.nomeNoivos} medias={medias} unlockedMediaIds={event.unlockedMediaIds} isMarketplace={isMarketplace} isOwner={event.isOwner} onClose={() => setShowPrintStore(false)} />}
      {needsAccessChoice && orderId && <AccessTypeModal orderId={orderId} eventTitle={event.nomeNoivos} isPrimaryClient={true} isMarketplace={isMarketplace} onConfirmed={() => setNeedsAccessChoice(false)} onClose={() => setNeedsAccessChoice(false)} />}
      
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Protocolo de Captura Phygital">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="space-y-1 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-tactical italic">Captura Instantânea</p>
            <p className="text-xs text-theme-text-muted max-w-[240px] mx-auto italic leading-relaxed">Escaneie para transmitir suas fotos em tempo real para a galeria exclusiva.</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.1)]">
            <QRCodeCanvas value={`${window.location.origin}/phygital-capture?e=${event.id}`} size={180} level="H" />
          </div>
          <div className="px-5 py-2.5 bg-theme-bg border border-theme-border/60 rounded-full group max-w-full overflow-hidden w-full text-center">
            <code className="text-[8px] font-black text-brand-tactical tracking-widest group-hover:text-theme-text transition-colors block truncate">{window.location.origin}/phygital-capture?e={event.id}</code>
          </div>
        </div>
      </Modal>
      {isEditingEvent && event && (
        <EventEditPanel 
          event={event as unknown as EventItem}
          onUpdated={(u) => setEvent(prev => prev ? { ...prev, ...u } as EventData : null)}
          onClose={() => setIsEditingEvent(false)}
          onNotify={(msg) => alert(msg)}
        />
      )}
    </div>
  );

}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => createPortal(
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md dark:bg-black/90" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-theme-card border border-theme-border p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
          <div className="absolute top-0 right-0 p-4"><button onClick={onClose} className="text-theme-subtle hover:text-white transition-colors"><Check size={20} className="rotate-45" /></button></div>
          <h3 className="font-display text-lg font-black uppercase tracking-tighter mb-2 pr-6 leading-tight">{title}</h3>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
);

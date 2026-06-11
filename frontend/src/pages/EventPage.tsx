import React, { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { createPortal } from "react-dom";
import { useEventStatus } from "../hooks/useEventStatus";
import { Check, Printer, QrCode, ShoppingCart, Share2, ChevronRight, ChevronLeft, Image as ImageIcon, Camera, MapPin, Clock, ShieldCheck, CheckCircle2, Lock, UserCircle, Search, X, ExternalLink, Download, Archive } from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { API as api } from "../lib/api";
import JSZip from "jszip";
import { saveAs } from "file-saver";

import AccessTypeModal from "../components/AccessTypeModal";
import { AuthModal } from "../components/AuthModal";
import { useAuth } from "../hooks/useAuth";
import { useCart } from "../hooks/useCart";
import { Navbar } from "../components/Navbar";
import SEO from "../components/SEO";
import { getProxyUrl } from "../lib/utils/media";
import LeadCapture from "../components/LeadCapture";
const PrintStoreModal = lazy(() => import("../components/PrintStoreModal").then(m => ({ default: m.PrintStoreModal })));
const PrintKitModal = lazy(() => import("../components/PrintKitModal").then(m => ({ default: m.PrintKitModal })));
import { motion, AnimatePresence } from "framer-motion";
const EventEditPanel = lazy(() => import("../components/profissional/EventEditPanel").then(m => ({ default: m.EventEditPanel })));
import type { EventItem } from "../components/profissional/types";
import { TouchSelectionGallery } from "../components/TouchSelectionGallery";
import { SchoolAuthenticationGate } from "../components/SchoolAuthenticationGate";

const formatDate = (date: string | null | undefined) => {
  if (!date) return "Em breve";
  return new Date(date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });
};

/**
 * ReferenceCard — suporta IMAGE (upload) e YOUTUBE (embed mudo em loop).
 */
interface RefItem {
  id?: string;
  type?: string;      // 'IMAGE' | 'YOUTUBE' — novo model
  url: string;
  thumbnailUrl?: string | null;
}

function ReferenceCard({ item }: { item: RefItem }) {
  const [open, setOpen] = useState(false);
  const [imgError, setImgError] = useState(false);

  const isYoutube = item.type === 'YOUTUBE';
  const thumb = item.thumbnailUrl || item.url;

  if (isYoutube) {
    return (
      <>
        <div
          className="aspect-square bg-theme-bg-muted border border-theme-border overflow-hidden rounded-xl relative cursor-pointer group"
          onClick={() => setOpen(true)}
        >
          <img src={thumb} alt="Referência YouTube" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
              <span className="text-white text-sm ml-0.5">▶</span>
            </div>
          </div>
        </div>
        {open && (
          <div
            className="fixed inset-0 z-[600] bg-black/90 flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            <div className="w-full max-w-3xl aspect-video rounded-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
              <iframe
                src={item.url}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Referência YouTube"
              />
            </div>
          </div>
        )}
      </>
    );
  }

  // IMAGE / LINK
  const driveMatch = item.url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);

  const displayUrl = (() => {
    if (/^data:image\//i.test(item.url)) return item.url;
    if (driveMatch) return `https://drive.google.com/thumbnail?id=${driveMatch[1]}&sz=w600`;
    // Use thumbnailUrl if explicitly provided (e.g. stored separately)
    if (thumb && thumb !== item.url) return thumb;
    // For external URLs (pexels, instagram, etc.) that block hotlinking,
    // proxy via microlink.io to extract the Open Graph image (free, fast)
    try {
      const u = new URL(item.url);
      const isExternal = !u.hostname.includes('supabase') 
        && !u.hostname.includes('googleusercontent') 
        && !u.hostname.includes('cloudinary')
        && !u.hostname.includes('googleapis');
      if (isExternal) {
        // embed=image.url → microlink extracts OG image and redirects to it directly
        return `https://api.microlink.io/?url=${encodeURIComponent(item.url)}&embed=image.url`;
      }
    } catch { /* ignore invalid URL */ }
    return item.url;
  })();

  if (!imgError) {
    return (
      <div className="aspect-square bg-theme-bg-muted border border-theme-border overflow-hidden rounded-xl relative">
        <img
          src={displayUrl}
          className="w-full h-full object-cover"
          alt="Referência"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  // Fallback
  let hostname = item.url;
  try { hostname = new URL(item.url).hostname.replace('www.', ''); } catch { /* ignore */ }
  return (
    <div className="aspect-square bg-theme-bg-muted border border-theme-border overflow-hidden rounded-xl flex flex-col items-center justify-center p-4">
      <ExternalLink size={24} className="mb-3 opacity-50" />
      <span className="text-[10px] font-black uppercase tracking-widest break-all line-clamp-3">{hostname}</span>
    </div>
  );
}

function TacticalBenefit({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="flex gap-4 p-4 bg-theme-bg-muted border border-white/5 hover:border-brand-tactical/20 transition-colors group">
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
  title: string;
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
  type?: 'ALBUM_FULL' | 'PHOTO_MARKETPLACE' | 'FOTO_POINT' | 'FLASH_EVENT' | 'SCHOOL' | 'SPORTS';
  category?: string;
  pricePerPhoto?: number;
  isUnitSale?: boolean;
  preSaleEnabled?: boolean;
  postSaleEnabled?: boolean;
  verticalConfigs?: Record<string, unknown>;
  recentOrders?: { id: string; contributorName: string; valor: number; createdAt: string }[];
  clientEmail?: string | null;
  isPrimaryClient?: boolean;
  isPrivate?: boolean;
  isOwner?: boolean;
  hasAccess?: boolean;
  active?: boolean;
  unlockedMediaIds?: string[];
  itinerary?: string | null;
  references?: string[];         // legacy JSON field
  eventReferences?: { id: string; type: string; url: string; thumbnailUrl?: string | null }[];
  photographer?: { id: string; nome: string } | null;
  expirationDate?: string | null;
  isExpired?: boolean;

  retentionDays?: number;
  tenantBrandColor?: string | null;
  tenantLogoUrl?: string | null;
  edicaoId?: string | null;
  eventDays?: number;
  eventHours?: number;
  allowFreeDownload?: boolean;
}

interface EventMedia {
  id: string;
  url: string;
  shortId: string;
  price?: number | null;
  isGuest?: boolean;
  metadata?: { studentId?: string; bibNumber?: string; [key: string]: unknown };
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
  <div className={`animate-pulse bg-theme-bg-muted rounded-sm ${className}`} />
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
        <div key={item.label} className="flex flex-col items-center bg-theme-bg p-4 border border-theme-border">
          <span className="text-2xl md:text-4xl font-heading font-black text-theme-text tracking-tighter italic">{String(item.val).padStart(2, '0')}</span>
          <span className="text-[8px] font-black text-brand-tactical uppercase tracking-[0.2em]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

function getFallbackByCategory(category?: string, id: string = "") {
  if (category === "ANIVERSARIO") return "https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=800";
  if (category === "SHOW_FESTIVAL") return "https://images.unsplash.com/photo-1540039155732-d6749b9325f0?auto=format&fit=crop&q=80&w=800";
  if (category === "CORPORATIVO") return "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800";
  if (category === "FORMATURA") return "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800";
  if (category === "ENSAIO") return "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800";
  const defaults = ["/defaults/cover1.png", "/defaults/cover2.png", "/defaults/cover3.png"];
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % defaults.length;
  return defaults[index];
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
  const [authenticatedStudent, setAuthenticatedStudent] = useState<string | null>(null);
  const { digitalPhotos, physicalItems, addToCart, removeFromCart, removePhysicalItem } = useCart();
  const [serviceCatalog, setServiceCatalog] = useState<ServiceData[]>([]);
  const [selectedServices] = useState<string[]>([]);
  const [includeLivePrint] = useState(false);

  const isAlbumInCart = digitalPhotos.some(p => p.eventId === event?.id && p.buyAlbum);

  // Filtramos os itens do carrinho que pertencem a este evento
  const eventCart = digitalPhotos.filter(p => p.eventId === event?.id && !p.buyAlbum).map(p => p.shortId);
  const eventPhysicalItems = physicalItems.filter(p => p.eventId === event?.id);
  const eventPricePerPhoto = event?.type === "FOTO_POINT" || event?.isUnitSale 
    ? Number(event?.priceUnit || 10) 
    : Number(event?.pricePerPhoto || 15);
  const cartTotal = (eventCart.length * eventPricePerPhoto) + eventPhysicalItems.reduce((acc, i) => acc + (Number(i.price) * i.quantity), 0);

  // Sincroniza o preço por foto do evento corrente para ser consumido no modal do carrinho global
  useEffect(() => {
    if (event) {
      localStorage.setItem('fs_current_event_price_unit', String(eventPricePerPhoto));
    }
  }, [event, eventPricePerPhoto]);

  const [showPrintStore, setShowPrintStore] = useState(false);
  const [showPrintKit, setShowPrintKit] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [filterMode, setFilterMode] = useState<"ALL" | "PRO" | "GUEST">("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMedias = medias.filter(m => {
    // 1. Filtro de Origem
    if (filterMode === "PRO" && m.isGuest) return false;
    if (filterMode === "GUEST" && !m.isGuest) return false;

    // 2. Filtro de Busca (Escolar/Esportivo)
    if (searchQuery) {
      const meta = m.metadata || {};
      const searchLower = searchQuery.toLowerCase();
      const matchStudent = meta.studentId?.toLowerCase().includes(searchLower);
      const matchBib = meta.bibNumber?.toLowerCase().includes(searchLower);
      const matchShortId = m.shortId?.toLowerCase().includes(searchLower) || false;
      return matchStudent || matchBib || matchShortId;
    }

    return true;
  });
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const durationHours = (event?.eventDays ? event.eventDays * 24 : 0) + (event?.eventHours || 2);
  const eventStatus = useEventStatus(event?.dataEvento, null, durationHours, event?.isExpired, event?.active);

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
      title: `Álbum: ${event?.title}`,
      text: isMarketplace ? `Veja as fotos ao vivo de ${event?.title}!` : `Confira as fotos do evento ${event?.title} no Foto Segundo!`,
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

  const handleDownload = async (mediaUrls: string[], zipName: string) => {
    if (!mediaUrls.length) { alert("Nenhuma mídia para baixar."); return; }
    setIsDownloading(true);
    setDownloadProgress(0);
    const zip = new JSZip();
    let count = 0;
    for (const url of mediaUrls) {
      try {
        const proxyUrl = url.startsWith('http') && !url.includes('/api/proxy') && !url.includes('/api/storage') ? `/api/proxy?url=${encodeURIComponent(url)}` : url;
        const res = await fetch(proxyUrl);
        const blob = await res.blob();
        const ext = url.split('?')[0].split('.').pop() || 'jpg';
        const filename = `foto_${String(count + 1).padStart(4,'0')}.${ext}`;
        zip.file(filename, blob);
        count++;
        setDownloadProgress(Math.round((count / mediaUrls.length) * 100));
      } catch { /* skip failed */ }
    }
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${zipName}.zip`);
    setIsDownloading(false);
  };

  const handleDownloadAll = () => {
    const urls = filteredMedias.map(m => m.metadata?.rawUrl || m.metadata?.printUrl || m.url).filter(Boolean) as string[];
    handleDownload(urls, `${event?.title || 'album'}-COMPLETO`);
  };

  const handleDownloadSelected = () => {
    const selected = filteredMedias.filter(m => eventCart.includes(m.shortId));
    const urls = selected.map(m => m.metadata?.rawUrl || m.metadata?.printUrl || m.url).filter(Boolean) as string[];
    handleDownload(urls, `${event?.title || 'album'}-SELECIONADAS`);
  };

  useEffect(() => {
    if (!slug) return;
    
    // 0. Persistir rastreamento de afiliado/embaixador (Fase 35)
    const ref = searchParams.get("ref");
    if (ref) {
      document.cookie = `fs_referral=${ref}; max-age=${30 * 24 * 60 * 60}; path=/;`;
      console.log("[Growth Engine] Afiliado rastreado:", ref);
    }

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

        // Buscar referências técnicas do banco
        api.get(`/events/${eventData.id}/references`)
          .then(refRes => {
            setEvent(prev => prev ? { ...prev, eventReferences: refRes.data || [] } : null);
          })
          .catch(() => { /* referências são opcionais */ });


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

    // Cycle banner index every 5s (only affects photo banners — YouTube iframe is rendered outside AnimatePresence so it never remounts)
    const interval = setInterval(() => setCurrentBannerIndex(prev => (prev + 1) % 3), 5000);
    return () => clearInterval(interval);
  }, [slug, navigate, user, searchParams]);

  const handleAutoConfirmChoice = useCallback(async (oid: string) => {
    try {
      await api.post(`/orders/${oid}/access-type`, { accessType: "PUBLIC" });
      const { data } = await api.get(`/orders/${oid}/access-status`);
      setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.title || "" });
    } catch (err) { console.error("Erro no auto-confirm:", err); }
  }, [event?.title]);

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
          setAccess({ lightroomUrl: data.lightroomUrl, driveUrl: data.driveUrl, expiresAt: data.expiresAt || "", eventTitle: event?.title || "" });
        }
      } catch { /* not paid */ }
    };
    const urlOrderId = searchParams.get("orderId");
    const savedOrderId = localStorage.getItem(`fs_order_${slug}`);
    const oid = urlOrderId ?? savedOrderId;
    if (oid) { setOrderId(oid); checkAccessStatus(oid); }
  }, [slug, searchParams, event, handleAutoConfirmChoice]);

  // Phase 40: Inject Tenant Branding CSS
  useEffect(() => {
    if (event?.tenantBrandColor) {
      document.documentElement.style.setProperty('--brand', event.tenantBrandColor);
    }
    return () => {
      document.documentElement.style.removeProperty('--brand');
    };
  }, [event?.tenantBrandColor]);

  // Handle URL actions
  useEffect(() => {
    if (searchParams.get("action") === "print" && step === "success") {
      const timer = setTimeout(() => setShowPrintStore(true), 500);
      return () => clearTimeout(timer);
    }
    if (searchParams.get("action") === "camera") {
      if (event?.id) {
        // Redirect directly to the camera capture route
        window.location.href = `/phygital-capture?e=${event.id}`;
      }
    }
    if (searchParams.get("action") === "qr") {
      setShowQrModal(true);
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [searchParams, step, event?.id]);

  const handleDeleteMedia = async (mediaId: string) => {
    try {
      await api.delete(`/marketplace/media/${mediaId}`);
      setMedias(prev => prev.filter(m => m.id !== mediaId));
    } catch (err) {
      console.error("Erro ao excluir foto:", err);
      alert("Erro ao excluir foto. Verifique as permissões ou tente novamente.");
    }
  };

  const handleUnlockClick = async () => { 
    if (!event) return;
    const hasItemsToBuy = isMarketplace || eventCart.length > 0 || eventPhysicalItems.length > 0;
    
    if (!hasItemsToBuy && (event.isOwner || paid)) {
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
          selectedPhotos: i.selectedPhotos,
          coverColor: i.coverColor,
          notes: i.notes
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
        <div className="bg-theme-bg p-3 md:p-6 md:p-12 space-y-12 border-l border-theme-border">
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

  const isEventOver = eventStatus.phase === 'ended' || eventStatus.phase === 'archived';
  const qrOpen = eventStatus.qrOpen;

  // Safely obtain YouTube reference, handling cases where eventReferences may not be an array
  const youtubeRef = Array.isArray(event.eventReferences)
    ? event.eventReferences.find(
        r => r.type === 'YOUTUBE' || r.url.includes('youtube.com') || r.url.includes('youtu.be')
      )
    : undefined;

  // Build a proper YouTube embed URL with autoplay + loop + mute
  const youtubeEmbedUrl = (() => {
    if (!youtubeRef) return null;
    const rawUrl = youtubeRef.url;
    let videoId = '';
    try {
      const u = new URL(rawUrl);
      if (u.hostname.includes('youtu.be')) {
        videoId = u.pathname.slice(1).split('?')[0];
      } else {
        videoId = u.searchParams.get('v') || u.pathname.split('/embed/').pop()?.split('?')[0] || '';
      }
    } catch { videoId = ''; }
    return videoId
      ? `https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&mute=1&modestbranding=1&rel=0`
      : rawUrl;
  })();

return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-sans selection:bg-brand-tactical/30 overflow-x-hidden selection:text-theme-text" onContextMenu={(e) => e.preventDefault()}>
      <SEO 
        title={event.title} 
        image={getProxyUrl(event.coverPhotoUrl)}
        description={`Confira as fotos de ${event.title} no Foto Segundo - Memórias Premium.`}
      />
      <Navbar tenantLogoUrl={event.tenantLogoUrl} />

      <main className="grid grid-cols-1 lg:grid-cols-[1fr_330px] min-h-[calc(100vh-64px)]">
        {/* Lado Esquerdo: Conteúdo Principal */}
        <section className="relative flex flex-col bg-theme-bg overflow-y-auto scrollbar-hide">
          <button 
             onClick={() => navigate(-1)} 
             className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-theme-bg/60 backdrop-blur-md border border-theme-border rounded-full text-theme-text hover:bg-brand-tactical hover:text-black transition-all shadow-xl"
          >
             <ChevronLeft size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Voltar</span>
          </button>

          <button 
             onClick={() => navigate(`/captura?eventId=${event.id}`)} 
             className="absolute top-6 right-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-brand-tactical text-black backdrop-blur-md border border-brand-tactical/50 rounded-full hover:brightness-110 transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
             <Camera size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest">Câmera</span>
          </button>
          {/* Header Visual Cinematográfico (Compacto) */}
          <div className="relative min-h-[35vh] lg:min-h-[45vh] shrink-0 overflow-hidden flex flex-col justify-end">
            {/* YouTube video — rendered OUTSIDE AnimatePresence so it never remounts/restarts */}
            {youtubeEmbedUrl && (
              <iframe
                src={youtubeEmbedUrl}
                className="absolute inset-0 w-full h-full pointer-events-none border-0 opacity-80 scale-125"
                allow="autoplay; encrypted-media"
                title="Capa Evento Video"
              />
            )}
            {/* Photo banner — only shown when there's no video */}
            {!youtubeEmbedUrl && (
            <AnimatePresence mode="wait">
              <motion.div 
                key={currentBannerIndex}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5 }}
                className="absolute inset-0"
              >
                {event.coverPhotoUrl ? (
                  <img 
                    src={getProxyUrl(event.coverPhotoUrl)} 
                    alt="" 
                    className="w-full h-full object-cover opacity-80"
                    fetchPriority="high"
                  />
                ) : (
                  <img 
                    src={getFallbackByCategory(event.category, event.id)} 
                    alt="" 
                    className="w-full h-full object-cover opacity-40 blur-sm scale-110"
                    style={{ objectPosition: event.coverPosition || 'center' }}
                    fetchPriority="high"
                  />
                )}
              </motion.div>
            </AnimatePresence>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/80 to-transparent" />
            
            <div className="relative z-10 w-full px-3 md:px-6 pt-20 pb-6 lg:px-10 lg:pt-32 lg:pb-8 space-y-4">
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 mb-2">
                <div className="h-px w-8 bg-brand-tactical" />
                <span className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">
                  {step === 'countdown' ? "Contagem Regressiva" : (
                    event.type === 'FOTO_POINT' ? "Tactical Point Operation" : 
                    event.type === 'PHOTO_MARKETPLACE' ? "Live Print System" : 
                    "Premium Event Delivery"
                  )}
                </span>
              </motion.div>
              
              <motion.h1 
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                className="text-3xl md:text-4xl lg:text-5xl font-heading font-black text-theme-text uppercase tracking-tighter leading-[0.9] italic max-w-2xl md:max-w-4xl"
              >
                {event.title}
              </motion.h1>

              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center gap-4 text-theme-text-muted">
                   <div className="flex items-center gap-1.5">
                     <Clock size={14} className="text-brand-tactical" />
                     <span className="text-[10px] font-black uppercase tracking-[0.1em] text-theme-text-muted italic">{formatDate(event.dataEvento)}</span>
                   </div>
                   <div className="flex items-center gap-1.5">
                     <MapPin size={14} className="text-brand-tactical" />
                     <span className="text-[10px] font-black uppercase tracking-[0.1em] text-theme-text-muted italic">{event.city || (event.location?.startsWith("CEP:") ? null : event.location) || "Ponto Designado"}</span>
                   </div>
                   {event.photographer && (
                     <div className="flex items-center gap-1.5">
                       <Camera size={14} className="text-brand-tactical" />
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] text-brand-tactical italic">Profissional: {event.photographer.nome}</span>
                     </div>
                   )}
                   {event.category && (
                     <div className="flex items-center gap-1.5">
                       <span className="text-[10px] font-black uppercase tracking-[0.1em] text-theme-text italic">{event.category}</span>
                     </div>
                   )}
                </div>
                {(() => {
                  let text = event.description || event.itinerary || "";
                  // If it contains budget or quote structures, ignore description entirely
                  if (text.includes('[BUDGET_BREAKDOWN]') || text.includes('Orçamento Disponível:')) {
                    text = event.itinerary || "";
                  } else {
                    // Extract only client description if this is an automated quote payload
                    const clientMatch = text.match(/Descrição do Cliente:\s*(.*)/is);
                    if (clientMatch && clientMatch[1]) {
                      text = clientMatch[1].trim();
                    } else {
                      // Fallback to strip known auto-generated fields if not explicitly matched
                      text = text
                        .replace(/Original:.*?\n/g, "")
                        .replace(/Convidados:.*?\n/g, "")
                        .replace(/Uso:.*?\n/g, "")
                        .replace(/Preferência:.*?\n/g, "")
                        .replace(/Orçamento Disponível:.*?\n/g, "")
                        .replace(/Serviços:.*?\n/g, "")
                        .replace(/Dias:.*?\n/g, "")
                        .replace(/Teste.*?observações/gi, "") // the user's specific test text
                        .trim();
                    }
                  }
                  
                  if (!text && event.type === 'FOTO_POINT') {
                    text = "Participe deste ensaio aberto. Capture memórias profissionais em um cenário exclusivo.";
                  }

                  if (!text) return null;

                  return (
                    <p className="text-base text-theme-text leading-relaxed font-medium italic whitespace-pre-line max-w-4xl mt-2 relative z-10">
                      {text}
                    </p>
                  );
                })()}
              </div>
            </div>
          </div>

          {/* ── QR CODE MODAL (Acessível a todos) ── */}
          <div className="fixed bottom-4 right-4 md:bottom-10 md:right-10 z-[200] flex flex-col items-end gap-4 print:hidden pointer-events-none">
            <AnimatePresence>
              {showQrModal && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }}
                  className="bg-[var(--bg-card)] border border-brand-tactical/40 p-3 md:p-6 md:p-8 shadow-2xl mb-4 w-[90vw] max-w-[320px] md:w-[320px] relative pointer-events-auto"
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

          {/* ── Professional Tactical Hub (Floating camera removed per request) ── */}

          {step === "countdown" ? (
            <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 lg:p-12 space-y-16 text-center relative">
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
              
              <div className="pt-8 flex items-center gap-4 flex-wrap">
                <button onClick={handleShare} className="px-3 md:px-6 py-5 border border-brand-tactical/30 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] hover:bg-brand-tactical hover:text-black transition-all italic flex items-center gap-3 hover-lift">
                  <Share2 size={16} /> CONVIDAR AMIGOS
                </button>
                <button onClick={() => setShowQrModal(true)} className="px-3 md:px-6 py-5 border border-brand-tactical/30 text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] hover:bg-brand-tactical hover:text-black transition-all italic flex items-center gap-3 hover-lift">
                  <QrCode size={16} /> QR CODE DE ACESSO
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 px-4 md:px-8 lg:px-12 pb-40 pt-2 space-y-8">
              
              {/* Bloco de Informações / Roteiro (Prioridade) */}
              {(event.itinerary || event.type === 'FOTO_POINT') && (
                <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000 space-y-8">

                  {/* Descrição movida para o header */}
                  <div className="space-y-3">
                    {event.type === 'FOTO_POINT' && (
                      <div className="flex flex-wrap gap-5 pt-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={13} className="text-brand-tactical" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Proteção de Conteúdo</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock size={13} className="text-brand-tactical" />
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Live Sync Canon</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Referências Técnicas — prioridade: DB (eventReferences) → legado (references) */}
                  {(() => {
                    // Usar eventReferences do banco se disponível, senão fallback para JSON legado
                    const dbRefs = event.eventReferences ?? [];
                    const legacyRefs: RefItem[] = (event.references ?? []).map(url => ({ type: 'IMAGE', url }));
                    const allRefs: RefItem[] = dbRefs.length > 0 ? dbRefs : legacyRefs;
                    const filteredRefs = allRefs.filter(r => r.type !== 'YOUTUBE' && !r.url.includes("youtube.com") && !r.url.includes("youtu.be"));
                    if (filteredRefs.length === 0) return null;
                    return (
                      <div className="space-y-4">
                        <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-[0.4em]">Referências Técnicas</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {filteredRefs.map((r, i) => (
                            <ReferenceCard key={r.id ?? i} item={r} />
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* ── Galeria Principal (Marketplace / Live Stream / Guest Photos) ── */}
              {(isMarketplace || (event.type === 'ALBUM_FULL' && step === 'success')) && (
                <div id="gallery-section" className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300 scroll-mt-20">
                  <div className="pt-4">                    
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-8">
                      <div className="flex bg-theme-bg-muted border border-white/10 rounded-xl overflow-hidden p-1">
                        <button 
                          onClick={() => setFilterMode("ALL")}
                          className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg ${filterMode === "ALL" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          TODAS
                        </button>
                        <button 
                          onClick={() => setFilterMode("PRO")}
                          className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${filterMode === "PRO" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          <Camera size={12} /> PRO
                        </button>
                        <button 
                          onClick={() => setFilterMode("GUEST")}
                          className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest transition-all rounded-lg flex items-center gap-2 ${filterMode === "GUEST" ? "bg-brand-tactical text-black" : "text-zinc-500 hover:text-white"}`}
                        >
                          <UserCircle size={12} /> CONVIDADOS
                        </button>
                      </div>

                      {(user?.role === 'PROFISSIONAL' || user?.role === 'FRANCHISEE' || user?.role === 'ADMIN') && qrOpen && (
                        <a 
                          href={`/phygital-capture?e=${event.id}&auto=1`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 md:px-8 py-5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all italic shadow-lg shadow-brand-tactical/20"
                        >
                          <Camera size={18} /> ABRIR CÂMERA
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="overflow-visible">
                        {medias.length === 0 ? (
                          <div className="py-16 border  border-theme-border bg-theme-bg/20 flex flex-col items-center justify-center text-center px-5 md:px-10 group relative overflow-hidden">
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
                                className="px-4 md:px-8 py-4 border border-theme-border text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:border-brand-tactical hover:text-theme-text hover:bg-brand-tactical/10 transition-all italic"
                              >
                                Sincronizar Galeria
                              </button>
                              {(isMarketplace && qrOpen) && (
                                <button 
                                  onClick={() => setShowQrModal(true)}
                                  className="px-4 md:px-8 py-4 bg-brand-tactical text-black font-black uppercase tracking-widest text-[10px] italic shadow-[0_15px_30px_rgba(20,184,166,0.3)] flex items-center gap-3"
                                >
                                  <QrCode size={18} /> TRANSMITIR MINHAS FOTOS
                                </button>
                              )}
                              {event.preSaleEnabled && !isAlbumInCart && (
                                <button 
                                  onClick={() => {
                                    if (event.id) {
                                      addToCart(event.id, "ALL", "", true);
                                      setStep("checkout");
                                    }
                                  }}
                                  className="px-4 md:px-8 py-4 bg-white text-black font-black uppercase tracking-widest text-[10px] italic flex items-center gap-3 hover:bg-brand-tactical transition-colors"
                                >
                                  <ShoppingCart size={18} /> COMPRAR PRÉ-VENDA (ALBUM COMPLETO)
                                </button>
                              )}
                            </div>
                          </div>
                        ) : event.type === 'SCHOOL' && !authenticatedStudent && !event.isOwner ? (
                          <SchoolAuthenticationGate 
                            studentListRaw={(event.verticalConfigs?.studentList as string | string[] | undefined) ?? ""}
                            eventTitle={event.title}
                            onAuthenticate={(name) => {
                              setAuthenticatedStudent(name);
                              setSearchQuery(name); // Enforce the filter
                            }}
                          />
                        ) : (
                          <div className="space-y-6">
                            {/* Barra de Busca Tática (Apenas Esportes ou Escolar para Admin) */}
                            {(event.type === 'SPORTS' || (event.type === 'SCHOOL' && event.isOwner)) && (
                              <div className="relative group max-w-xl mx-auto mb-10">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-theme-text-muted group-focus-within:text-brand-tactical transition-colors">
                                  <Search size={18} />
                                </div>
                                <input 
                                  type="text" 
                                  placeholder={event.type === 'SCHOOL' ? "BUSCAR POR RA OU ALUNO..." : "BUSCAR POR NÚMERO DE PEITO..."}
                                  value={searchQuery}
                                  onChange={(e) => setSearchQuery(e.target.value)}
                                  className="w-full bg-theme-bg-muted border border-theme-border py-5 pl-12 pr-4 text-[10px] font-black uppercase tracking-[0.2em] text-theme-text focus:outline-none focus:border-brand-tactical focus:ring-1 focus:ring-brand-tactical/20 transition-all placeholder:text-theme-text-muted/40 italic"
                                />
                                {searchQuery && (
                                  <button 
                                    onClick={() => setSearchQuery("")}
                                    className="absolute inset-y-0 right-4 flex items-center text-theme-text-muted hover:text-white transition-colors"
                                  >
                                    <X size={16} />
                                  </button>
                                )}
                              </div>
                            )}

                            {event.type === 'SCHOOL' && authenticatedStudent && (
                              <div className="flex justify-between items-center mb-6 bg-theme-bg-muted p-4 border border-theme-border rounded-xl">
                                <span className="text-[10px] text-theme-muted uppercase tracking-widest font-black italic">
                                  Visualizando álbum de: <span className="text-white">{authenticatedStudent}</span>
                                </span>
                                <button 
                                  onClick={() => {
                                    setAuthenticatedStudent(null);
                                    setSearchQuery("");
                                  }}
                                  className="text-[10px] text-brand-tactical uppercase tracking-widest font-black hover:text-white transition-colors"
                                >
                                  Trocar Aluno
                                </button>
                              </div>
                            )}

                            {/* Download Toolbar — visible only to owner/admin/editor or free download events */}
                            {(event.allowFreeDownload || event.isOwner || event.edicaoId === event.photographer?.id || user?.role === 'ADMIN') && (
                              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-4 border-b border-theme-border">
                                <div className="flex items-center gap-2">
                                  <Archive size={14} className="text-brand-tactical" />
                                  <span className="text-[9px] font-black uppercase tracking-widest text-theme-muted italic">Download de Material</span>
                                </div>
                                <div className="flex gap-2">
                                  {eventCart.length > 0 && (
                                    <button
                                      onClick={handleDownloadSelected}
                                      disabled={isDownloading}
                                      className="px-4 py-2.5 border border-brand-tactical/40 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical/10 transition-all flex items-center gap-2 rounded-xl disabled:opacity-40"
                                    >
                                      <Download size={13} /> {eventCart.length} SELECIONADAS
                                    </button>
                                  )}
                                  <button
                                    onClick={handleDownloadAll}
                                    disabled={isDownloading}
                                    className="px-4 py-2.5 bg-brand-tactical text-black text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 rounded-xl disabled:opacity-40"
                                  >
                                    <Archive size={13} /> ÁLBUM COMPLETO ({filteredMedias.length})
                                  </button>
                                </div>
                              </div>
                            )}
                            <TouchSelectionGallery
                              medias={filteredMedias}
                              selectedIds={eventCart}
                              unlockedIds={event.unlockedMediaIds || []}
                              onToggleCart={toggleCart}
                              isOwner={event.isOwner || user?.role === 'ADMIN'}
                              onDeleteMedia={handleDeleteMedia}
                              allowFreeDownload={event.allowFreeDownload}
                            />
                          </div>
                        )}
                  </div>
                </div>
              )}

              {/* Removido o PrintCatalog gigante do meio do álbum para despoluir a UI. Agora integrado no Sidebar de forma premium. */}
            </div>
          )}
        </section>

        {/* Lado Direito: Sidebar Tática */}
        <aside className="relative flex flex-col bg-theme-bg-muted border-l border-theme-border shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(20,184,166,0.08),transparent_70%)] pointer-events-none" />
          
          <div className="relative z-10 flex-1 overflow-y-auto p-4 lg:p-8 space-y-8 lg:space-y-14 scrollbar-hide">
            <div className="flex items-center justify-between border-b border-theme-border pb-6 lg:pb-12">
              <div className="space-y-1">
                <p className="text-[10px] text-theme-text-muted uppercase font-black tracking-[0.5em] italic">Membro Exclusive</p>
                <div className="h-0.5 w-12 bg-brand-tactical" />
              </div>
              <div className="flex items-center gap-3 px-4 py-2 bg-theme-bg border border-theme-border">
                <div
                  className={`w-2 h-2 rounded-full ${eventStatus.dotClass}`}
                  title={eventStatus.label}
                />
                <span className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">
                  {eventStatus.label}
                </span>
              </div>
            </div>

            {/* Hub de Gestão (Apenas Profissional/Admin/Contratante) */}
            {(event.isOwner || event.isPrimaryClient || user?.role === 'ADMIN') && (
              <div className="p-4 lg:p-6 bg-brand-tactical/10 border border-brand-tactical/20 space-y-4">
                 <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-brand-tactical" />
                    <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Gestão Tática do Evento</span>
                 </div>
                 <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={() => qrOpen && setShowQrModal(true)}
                      className={`w-full py-4 bg-[var(--bg-card)] border border-brand-tactical/30 text-brand-tactical text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all italic flex items-center justify-center gap-2 ${!qrOpen ? 'opacity-30 cursor-not-allowed grayscale' : 'hover:bg-brand-tactical hover:text-black'}`}
                      disabled={!qrOpen}
                    >
                      <QrCode size={16} /> {!qrOpen ? 'ENCERRADAS' : 'QR CODE'}
                    </button>
                    {(event.isOwner || event.isPrimaryClient || user?.role === 'ADMIN' || user?.role === 'PROFISSIONAL' || user?.role === 'FRANCHISEE' || user?.role === 'CARTORIO' || user?.role === 'UNIDADE') && (
                      <button 
                        onClick={() => {
                          setIsEditingEvent(true);
                        }}
                        className="w-full py-4 border border-theme-border text-theme-text-muted text-[9px] lg:text-[10px] font-black uppercase tracking-widest hover:text-theme-text hover:border-theme-border hover:bg-theme-bg-muted transition-all italic flex items-center justify-center gap-2"
                      >
                        <Camera size={16} /> CONFIGURAÇÕES
                      </button>
                    )}
                 </div>
              </div>
            )}

            {/* Hub de Participação (Para Convidados) */}
            {(!event.isOwner) && (
              <div className="p-3 md:p-6 bg-theme-bg-muted border border-theme-border space-y-4">
                 <div className="flex items-center gap-2">
                    <QrCode size={16} className={!qrOpen ? "text-zinc-600" : "text-brand-tactical"} />
                    <span className="text-[10px] font-black text-theme-text uppercase tracking-widest italic">Galeria Live</span>
                 </div>
                 <p className="text-[9px] text-theme-text-muted leading-relaxed uppercase tracking-wider italic">
                    {qrOpen 
                      ? "Envie suas fotos agora para o painel do evento e apareça na transmissão oficial!"
                      : (eventStatus.phase === "scheduled" || eventStatus.phase === "approaching")
                        ? "O período de envio de fotos em tempo real iniciará quando o evento começar."
                        : "O período de envio de fotos em tempo real para este evento foi encerrado."}
                 </p>
                 {qrOpen && (
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
                {event.type === 'ALBUM_FULL' && !event.isPrimaryClient && !event.isOwner && !event.hasAccess ? (
                  <div className="space-y-8 bg-zinc-950/80 border border-zinc-800/80 p-4 md:p-8 rounded-2xl relative overflow-hidden backdrop-blur-md shadow-2xl">
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-red-500 via-amber-500 to-red-500" />
                    <div className="flex items-center gap-3">
                      <Lock size={18} className="text-amber-500 animate-pulse" />
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest italic">Álbum Privado</span>
                    </div>
                    <div className="space-y-4">
                      <h4 className="text-md font-heading font-black text-white uppercase italic tracking-tight">Aguardando Liberação</h4>
                      <p className="text-[11px] text-zinc-400 uppercase font-bold tracking-widest leading-relaxed">
                        Esta galeria premium está aguardando o pagamento do saldo residual ou a liberação oficial de acesso pelo contratante.
                      </p>
                    </div>
                    <div className="pt-6 border-t border-zinc-800/80 space-y-6">
                      <p className="text-[9px] text-zinc-500 font-medium leading-relaxed">
                        Se você é o contratante oficial do evento, faça login com seu e-mail cadastrado ({event.clientEmail || 'e-mail do cliente'}) para quitar o saldo e liberar o acesso.
                      </p>
                      <button 
                        onClick={() => navigate("/login")}
                        className="w-full h-16 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest text-center italic hover:brightness-110 transition-all flex items-center justify-center gap-3"
                      >
                        FAZER LOGIN DO CONTRATANTE
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    {((isMarketplace || eventCart.length > 0 || eventPhysicalItems.length > 0) && !event.allowFreeDownload) && (
                      <div className="space-y-4">
                        <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">Investimento</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-light text-theme-text-muted/60 tracking-tighter italic">R$</span>
                          <h2 className="text-2xl md:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter font-heading italic leading-none text-theme-text">
                            {Number(searchParams.get("intent") === "upgrade" 
                              ? (serviceCatalog.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + Number(s.basePrice), 0) + (includeLivePrint ? 150 : 0))
                              : ((isMarketplace || eventCart.length > 0 || eventPhysicalItems.length > 0) ? cartTotal : event.priceBase)
                            ).toFixed(0)}
                          </h2>
                          <span className="text-3xl font-black text-theme-text-muted/60 italic">,00</span>
                        </div>
                        <div className="p-4 bg-brand-tactical/10 border-l-2 border-brand-tactical">
                          <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest italic">
                            {eventCart.length > 0 && `${eventCart.length} ${eventCart.length === 1 ? 'foto digital' : 'fotos digitais'}`}
                            {eventCart.length > 0 && eventPhysicalItems.length > 0 && ' + '}
                            {eventPhysicalItems.length > 0 && `${eventPhysicalItems.length} ${eventPhysicalItems.length === 1 ? 'produto físico' : 'produtos físicos'}`}
                          </p>
                        </div>
                      </div>
                    )}

                    {!isMarketplace && !event.hasAccess && !event.allowFreeDownload && (
                      <div className="space-y-4">
                        <p className="text-[10px] text-brand-tactical font-black uppercase tracking-[0.6em] italic">Investimento do Álbum</p>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-light text-theme-text-muted/60 tracking-tighter italic">R$</span>
                          <h2 className="text-2xl md:text-4xl md:text-6xl lg:text-7xl font-black tracking-tighter font-heading italic leading-none text-theme-text">
                            {Number(event.priceBase || 0).toFixed(0)}
                          </h2>
                          <span className="text-3xl font-black text-theme-text-muted/60 italic">,00</span>
                        </div>
                        <div className="p-4 bg-brand-tactical/10 border-l-2 border-brand-tactical">
                          <p className="text-[10px] text-theme-text-muted font-black uppercase tracking-widest italic">
                            Liberação de todo o conteúdo da galeria digital.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Order Bump - Upgrade Phygital */}
                    {(isMarketplace && eventCart.length > 0 && event.temFotoImpressa && !event.allowFreeDownload) && (
                      <div className="p-3 md:p-6 border border-brand-tactical/30 bg-brand-tactical/10 rounded-[24px] space-y-4 shadow-lg shadow-brand-tactical/5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Printer size={16} className="text-brand-tactical animate-pulse" />
                            <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Upgrade Phygital</span>
                          </div>
                          {!eventPhysicalItems.length ? (
                            <button 
                              onClick={() => setShowPrintStore(true)} 
                              className="text-[9px] font-black uppercase text-zinc-950 bg-brand-tactical px-3 py-1.5 hover:bg-white transition-all rounded-md"
                            >
                              Adicionar
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                eventPhysicalItems.forEach(item => removePhysicalItem(item.productId));
                              }} 
                              className="text-[9px] font-black uppercase text-red-500 hover:text-white transition-all"
                            >
                              Remover
                            </button>
                          )}
                        </div>
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-theme-text uppercase italic tracking-tight">
                            {!eventPhysicalItems.length ? "Fotos Reveladas Premium" : "Produto Físico Selecionado"}
                          </h4>
                          <p className="text-[9px] text-theme-text-muted leading-relaxed uppercase tracking-wider italic">
                            {!eventPhysicalItems.length 
                              ? "Eternize suas memórias! Receba suas fotos impressas em papel fotográfico profissional premium."
                              : `${eventPhysicalItems[0]?.name || "Produto Impresso"} (x${eventPhysicalItems[0]?.quantity || 1}) - R$ ${((eventPhysicalItems[0]?.price || 0) * (eventPhysicalItems[0]?.quantity || 1)).toFixed(0)}`}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4">
                      {((isMarketplace || (!event.hasAccess && (event.isPrimaryClient || event.isOwner)) || eventCart.length > 0 || eventPhysicalItems.length > 0) && !event.allowFreeDownload) && (
                        <button 
                          onClick={handleUnlockClick} 
                          className="group relative w-full h-16 lg:h-24 rounded-xl bg-brand-tactical text-black font-black uppercase tracking-[0.1em] lg:tracking-[0.4em] text-[9px] lg:text-xs flex items-center justify-center gap-2 lg:gap-5 overflow-hidden transition-all shadow-2xl shadow-brand-tactical/30 italic hover-lift"
                        >
                          <div className="absolute inset-0 bg-white translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-700 opacity-20" />
                          <span className="relative z-10 text-center px-2 leading-tight">
                            {searchParams.get("intent") === "upgrade" ? "Finalizar Upgrade" : 
                              (event.type === 'ALBUM_FULL' && eventCart.length === 0 && eventPhysicalItems.length === 0) ? "Desbloquear Álbum" : 
                              "Finalizar Compra"}
                          </span>
                          <ChevronRight size={16} className="relative z-10 group-hover:translate-x-2 transition-transform hidden lg:block" />
                        </button>
                      )}
                      
                      {(!isMarketplace && event.hasAccess && !event.allowFreeDownload && eventCart.length === 0 && eventPhysicalItems.length === 0) && (
                        <div className="w-full h-16 lg:h-24 mb-4 bg-brand-tactical/10 border border-brand-tactical/30 rounded-xl flex items-center justify-center gap-2">
                           <CheckCircle2 size={16} className="text-brand-tactical" />
                           <span className="text-[9px] lg:text-xs font-black text-brand-tactical uppercase tracking-widest italic text-center leading-tight">Álbum Desbloqueado</span>
                        </div>
                      )}

                      <button onClick={handleShare} className="w-full h-16 lg:h-24 border border-theme-border text-theme-text-muted font-black uppercase tracking-widest text-[9px] lg:text-[10px] flex items-center justify-center gap-2 hover:bg-theme-border/60 hover:text-theme-text transition-all italic rounded-xl px-2 text-center leading-tight">
                        <Share2 size={16} className="lg:w-[18px] lg:h-[18px]" /> Compartilhar Galeria
                      </button>
                    </div>
                  </>
                )}

                <div className="pt-2 lg:pt-6">
                  <LeadCapture eventId={event.id} />
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-1 gap-2 lg:gap-4 pt-6 lg:pt-10">
                  <TacticalBenefit 
                    icon={<ImageIcon size={16} className="lg:w-[20px] lg:h-[20px]" />} 
                    title="Alta Resolução" 
                    desc="Arquivos originais otimizados." 
                  />
                  <TacticalBenefit 
                    icon={<ShieldCheck size={16} className="lg:w-[20px] lg:h-[20px]" />} 
                    title="Acesso Blindado" 
                    desc="Memórias seguras na nuvem." 
                  />
                  <div className="col-span-2 lg:col-span-1">
                    <TacticalBenefit 
                      icon={<Printer size={16} className="lg:w-[20px] lg:h-[20px]" />} 
                      title="Print Catalog" 
                      desc="Acesso exclusivo à loja." 
                    />
                  </div>
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
                
                <div className="relative p-5 md:p-10 bg-theme-bg border border-theme-border group overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-brand-tactical/10 blur-3xl rounded-full" />
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

                <button onClick={handleShare} className="w-full h-20 border  border-theme-border text-theme-text-muted font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-4 hover:border-brand-tactical/40 hover:text-theme-text transition-all italic">
                  <Share2 size={20} /> CONVIDAR AMIGOS
                </button>
              </div>
            ) : null}
          </div>
        </aside>
      </main>
      
      {/* Carrinho Mobile Elevado */}
      {isMarketplace && eventCart.length > 0 && (
        <motion.div initial={{ y: 120 }} animate={{ y: 0 }} className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-theme-bg/90 backdrop-blur-3xl border-t border-brand-tactical/40 p-4 md:p-8 pb-14 flex items-center justify-between shadow-2xl dark:bg-black/95">
          <div className="space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-tactical italic">{eventCart.length} selecionadas</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-light text-theme-text-muted/60 italic">R$</span>
              <span className="text-2xl md:text-4xl font-black tracking-tighter text-theme-text italic">{cartTotal.toFixed(0)}</span>
              <span className="text-sm font-bold text-theme-text-muted/60 italic">,00</span>
            </div>
          </div>
          <button onClick={handleUnlockClick} className="px-3 md:px-6 md:px-12 py-5 bg-brand-tactical text-black font-black uppercase tracking-widest text-[11px] italic shadow-[0_15px_30px_rgba(20,184,166,0.3)]">DESBLOQUEAR</button>
        </motion.div>
      )}

      {/* Modais Customizados */}
      {step === "denied" && (
        user ? (
          <Modal isOpen={true} onClose={() => setStep("paywall")} title="Álbum Privado">
            <div className="flex flex-col items-center gap-4 md:gap-8 py-5 md:py-10 text-center">
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
                <a href="https://wa.me/5519981150440" target="_blank" rel="noreferrer" className="w-full py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest text-center italic shadow-lg shadow-brand-tactical/20">FALAR COM SUPORTE</a>
                <button onClick={() => setStep("paywall")} className="w-full py-4 border border-theme-border text-theme-text-muted text-[10px] font-black uppercase tracking-widest italic">VOLTAR</button>
              </div>
            </div>
          </Modal>
        ) : (
          <AuthModal onSuccess={() => setStep("success")} onClose={() => setStep("paywall")} />
        )
      )}
      {showPrintStore && (
        <Suspense fallback={<div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-theme-bg/80 backdrop-blur-xl"><div className="w-8 h-8 border-4 border-brand-tactical border-t-transparent rounded-full animate-spin"></div></div>}>
          <PrintStoreModal eventId={event.id} eventTitle={event.title} medias={medias} unlockedMediaIds={event.unlockedMediaIds} isMarketplace={isMarketplace} isOwner={event.isOwner} onClose={() => setShowPrintStore(false)} />
        </Suspense>
      )}
      {/* Print Kit Modal */}
      {showPrintKit && event && (
        <Suspense fallback={<div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-theme-bg/80 backdrop-blur-xl"><div className="w-8 h-8 border-4 border-brand-tactical border-t-transparent rounded-full animate-spin"></div></div>}>
          <PrintKitModal 
            eventId={event.id}
            eventSlug={event.slug || undefined}
            eventTitle={event.title}
            eventDate={event.dataEvento || undefined}
            tenantLogoUrl={event.tenantLogoUrl || undefined}
            onClose={() => setShowPrintKit(false)}
          />
        </Suspense>
      )}
      {needsAccessChoice && orderId && <AccessTypeModal orderId={orderId} eventTitle={event.title} isPrimaryClient={true} isMarketplace={isMarketplace} onConfirmed={() => setNeedsAccessChoice(false)} onClose={() => setNeedsAccessChoice(false)} />}
      
      <Modal isOpen={showQrModal} onClose={() => setShowQrModal(false)} title="Protocolo de Captura Phygital">
        <div className="flex flex-col items-center gap-4 pt-2">
          <div className="space-y-1 text-center">
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-brand-tactical italic">Captura Instantânea</p>
            <p className="text-xs text-theme-text-muted max-w-[240px] mx-auto italic leading-relaxed">Escaneie para transmitir suas fotos em tempo real para a galeria exclusiva.</p>
          </div>
          <div className="p-4 bg-white rounded-2xl shadow-[0_10px_30px_rgba(20,184,166,0.1)]">
            <QRCodeCanvas value={`${window.location.origin}/phygital-capture?e=${event.id}`} size={180} level="H" />
          </div>
          <div className="px-5 py-2.5 bg-theme-bg border border-theme-border rounded-full group max-w-full overflow-hidden w-full text-center">
            <code className="text-[8px] font-black text-brand-tactical tracking-widest group-hover:text-theme-text transition-colors block truncate">{window.location.origin}/phygital-capture?e={event.id}</code>
          </div>
        </div>
      </Modal>
      {isEditingEvent && event && (
        <Suspense fallback={<div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-theme-bg/80 backdrop-blur-xl"><div className="w-8 h-8 border-4 border-brand-tactical border-t-transparent rounded-full animate-spin"></div></div>}>
          <EventEditPanel 
            event={event as unknown as EventItem}
            onUpdated={(u) => setEvent(prev => prev ? { ...prev, ...u } as EventData : null)}
            onClose={() => setIsEditingEvent(false)}
            onNotify={(msg) => alert(msg)}
            onOpenPrintKit={() => setShowPrintKit(true)}
          />
        </Suspense>
      )}
      {/* Download Progress Overlay */}
      {isDownloading && createPortal(
        <div className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/90 backdrop-blur-xl">
          <div className="space-y-6 text-center max-w-sm w-full px-3 md:px-6">
            <div className="relative mx-auto w-20 h-20">
              <div className="absolute inset-0 rounded-full border-4 border-brand-tactical/20" />
              <div 
                className="absolute inset-0 rounded-full border-4 border-brand-tactical border-t-transparent animate-spin"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Archive size={28} className="text-brand-tactical" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-tactical italic">Preparando Download</p>
              <p className="text-2xl font-black text-white">{downloadProgress}%</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest">Compactando arquivos...</p>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
              <div 
                className="h-full bg-brand-tactical transition-all duration-300 rounded-full"
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );

}

const Modal = ({ isOpen, onClose, title, children }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode }) => createPortal(
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 md:p-6" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-theme-bg/80 backdrop-blur-md dark:bg-black/90" />
        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-sm bg-theme-card border border-theme-border p-3 md:p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
          <div className="absolute top-0 right-0 p-4"><button onClick={onClose} className="text-theme-subtle hover:text-white transition-colors"><Check size={20} className="rotate-45" /></button></div>
          <h3 className="font-display text-lg font-black uppercase tracking-tighter mb-2 pr-6 leading-tight">{title}</h3>
          {children}
        </motion.div>
      </div>
    )}
  </AnimatePresence>,
  document.body
);

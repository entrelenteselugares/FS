import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Upload, Heart, Share2, 
  ChevronLeft, Loader2, Camera,
  Printer, Zap, Star
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";

interface Media {
  id: string;
  thumbnailLink: string;
  webViewLink: string;
  fileId: string;
  uploadedBy: { nome: string };
  createdAt: string;
  _count: { votes: number };
  votedByMe?: boolean;
}

interface Vault {
  id: string;
  nome: string;
  goalPoses: number;
  status: string;
  subscriptionStatus: string;
  trialEndsAt: string | null;
  myRole: string;
  subscription?: {
    id: string;
    status: string;
    nextBillingDate?: string;
  };
}

export default function VaultDetailPage() {
  const { vaultId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [vault, setVault] = useState<Vault | null>(null);
  const [media, setMedia] = useState<Media[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [checkingOut, setCheckingOut] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<Media | null>(null);

  const fetchVaultDetails = useCallback(async () => {
    try {
      // Tentar buscar detalhes específicos do álbum
      let currentVault;
      try {
        const vRes = await api.get(`/vaults`);
        currentVault = vRes.data.find((v: Vault) => v.id === vaultId);
      } catch { console.error("Erro ao buscar álbum"); }

      const mediaRes = await api.get(`/vaults/${vaultId}/media`);
      
      if (currentVault) setVault(currentVault);
      setMedia(mediaRes.data || []);
    } catch (err) {
      console.error("[VaultDetail] Erro:", err);
    } finally {
      setLoading(false);
    }
  }, [vaultId]);

  const handleVote = async (mediaId: string) => {
    try {
      await api.post(`/vaults/media/${mediaId}/vote`);
      // Update local state for immediate feedback
      setMedia(prev => prev.map(m => {
        if (m.id === mediaId) {
          const isVoted = m.votedByMe;
          return {
            ...m,
            _count: { votes: isVoted ? m._count.votes - 1 : m._count.votes + 1 },
            votedByMe: !isVoted
          };
        }
        return m;
      }));
      fetchVaultDetails(); // Sync with server
    } catch (err) {
      console.error("[Vote] Erro:", err);
    }
  };

  const handleCheckout = async () => {
    if (!vault) return;
    setCheckingOut(true);
    try {
      const res = await api.post(`/vaults/${vaultId}/checkout`);
      if (res.data.orderId) {
        navigate(`/checkout?orderId=${res.data.orderId}`);
      } else if (res.data.init_point) {
        // Fallback
        window.location.href = res.data.init_point;
      } else {
        alert("Erro ao gerar link de pagamento.");
      }
    } catch (err: unknown) {
      console.error("[Checkout] Erro:", err);
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Erro ao processar materialização do álbum.";
      alert(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSubscribe = async () => {
    if (!vault) return;
    setCheckingOut(true);
    try {
      const res = await api.post(`/vaults/${vaultId}/subscribe`);
      if (res.data.initPoint) {
        window.location.href = res.data.initPoint;
      } else {
        alert("Erro ao gerar link de assinatura.");
      }
    } catch (err: unknown) {
      console.error("[Subscribe] Erro:", err);
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Erro ao processar assinatura do cofre.";
      alert(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleInvite = async () => {
    if (!vault) return;
    try {
      const { data } = await api.post(`/vaults/${vaultId}/invite`);
      const text = `Venha compartilhar memórias comigo no álbum "${vault.nome}"!\n\nLink de acesso:\n${data.url}`;
      
      if (navigator.share) {
        await navigator.share({ title: vault.nome, text, url: data.url });
      } else {
        await navigator.clipboard.writeText(text);
        alert("Link de convite copiado para a área de transferência!");
      }
    } catch {
      alert("Apenas o proprietário pode gerar convites.");
    }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchVaultDetails();
    
    // Check for success redirect from MP
    const params = new URLSearchParams(window.location.search);
    if (params.get("subscribed") === "true") {
      // In a real app, we'd use a toast component
      alert("Assinatura ativada com sucesso! Seu cofre está salvo.");
      // Remove query param to avoid repeated alerts
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [user, navigate, fetchVaultDetails]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const fileList = Array.from(files);
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < fileList.length; i++) {
      let file = fileList[i];
      const progressBase = (i / fileList.length) * 100;
      const progressStep = 100 / fileList.length;
      
      setUploadProgress(Math.round(progressBase));

      // 1. Client-side Compression
      if (file.type.startsWith("image/") && file.size > 1 * 1024 * 1024) {
        try {
          const compressedBlob = await new Promise<Blob>((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                const canvas = document.createElement("canvas");
                let width = img.width;
                let height = img.height;
                const MAX_SIDE = 1800; // Slightly smaller for faster batch
                if (width > height) {
                  if (width > MAX_SIDE) { height *= MAX_SIDE / width; width = MAX_SIDE; }
                } else {
                  if (height > MAX_SIDE) { width *= MAX_SIDE / height; height = MAX_SIDE; }
                }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0, width, height);
                canvas.toBlob((blob) => blob ? resolve(blob) : reject("Erro na compressão"), "image/jpeg", 0.75);
              };
              img.onerror = reject;
            };
            reader.onerror = reject;
          });
          file = new File([compressedBlob], file.name, { type: "image/jpeg" });
        } catch (err) {
          console.warn("[Upload] Compressão falhou para", file.name, err);
        }
      }

      // 2. Size Guard (Vercel)
      if (file.size > 4.5 * 1024 * 1024) {
        console.warn("[Upload] Arquivo muito grande:", file.name);
        failCount++;
        continue;
      }

      // 3. Sequential Upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post(`/vaults/${vaultId}/upload`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (pe) => {
            const subProgress = Math.round((pe.loaded * progressStep) / (pe.total || 1));
            setUploadProgress(Math.round(progressBase + subProgress));
          }
        });
        successCount++;
      } catch (err: unknown) {
        console.error("[Upload] Falha em", file.name, err);
        failCount++;
        const axiosError = err as { response?: { status?: number, data?: { error?: string } } };
        if (axiosError.response?.status === 400 && axiosError.response?.data?.error?.includes("cheio")) {
           alert("O álbum atingiu a meta! Algumas fotos não puderam ser enviadas.");
           break; 
        }
      }
    }

    setUploading(false);
    setUploadProgress(0);
    fetchVaultDetails();
    
    if (failCount > 0) {
      alert(`Upload concluído: ${successCount} enviadas, ${failCount} falhas.`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (!vault) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: T.bg, color: T.text }}>
        <Lock size={48} className="text-red-500/30 mb-4" />
        <h1 className="text-2xl font-black uppercase italic">Álbum não encontrado</h1>
        <button onClick={() => navigate("/meus-albuns")} className="mt-6 text-emerald-500 font-bold uppercase tracking-widest text-[11px]">
          Voltar para meus álbuns
        </button>
      </div>
    );
  }

  const now = new Date();
  const trialEnds = vault.trialEndsAt ? new Date(vault.trialEndsAt) : null;
  const daysLeft = trialEnds ? Math.ceil((trialEnds.getTime() - now.getTime()) / (1000 * 3600 * 24)) : null;
  const isBlocked = vault.subscriptionStatus === "BLOCKED" || vault.subscriptionStatus === "EXPIRED";

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: T.bg, color: T.text }}>
      <Helmet>
        <title>{vault.nome || "Álbum"} | Meus Álbuns</title>
      </Helmet>
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header Sticky / Hero Area */}
      <div className="sticky top-0 md:top-[64px] z-30 backdrop-blur-xl border-b" style={{ background: `color-mix(in srgb, ${T.bgCard} 80%, transparent)`, borderColor: T.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/meus-albuns")}
              className="p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-colors"
              style={{ color: T.text2 }}
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter leading-none" style={{ color: T.text }}>
              {vault.nome}
            </h1>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                  {media.length} / {vault.goalPoses} POSES
                </span>
                <div className="w-24 h-1 rounded-full overflow-hidden" style={{ background: T.border }}>
                  <div 
                    className="h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${Math.min(100, (media.length / vault.goalPoses) * 100)}%` }} 
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {vault.myRole === "OWNER" && (
              <button 
                onClick={handleCheckout}
                disabled={checkingOut}
                className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-lg ${
                  media.length >= vault.goalPoses 
                    ? "bg-emerald-500 text-black shadow-emerald-500/40 animate-pulse" 
                    : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                {checkingOut ? <Loader2 size={14} className="animate-spin" /> : <Printer size={14} />}
                Materializar
              </button>
            )}
            
            <button 
              onClick={handleInvite}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
            >
              <Share2 size={14} />
              Convidar
            </button>
            
            <label className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-lg ${
              media.length >= vault.goalPoses
                ? "bg-zinc-800 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 cursor-pointer"
            }`}>
              <Upload size={14} />
              {media.length >= vault.goalPoses ? "Meta Atingida" : "Enviar Foto"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" multiple />
            </label>
          </div>
        </div>

      </div>

      {/* Warning Banner se faltam poucos dias */}
      {!isBlocked && vault.subscriptionStatus === "TRIAL" && daysLeft !== null && daysLeft <= 5 && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-3 text-center">
          <p className="text-yellow-500 text-[11px] font-black uppercase tracking-widest">
            Atenção: O período gratuito deste cofre acaba em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}. <button onClick={handleSubscribe} className="underline ml-1">Assine agora</button> para não perder o acesso.
          </p>
        </div>
      )}

      {/* Blocked Screen */}
      {isBlocked ? (
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-24 h-24 bg-red-500/10 rounded-full flex items-center justify-center mb-6 border border-red-500/20">
            <Lock size={40} className="text-red-500" />
          </div>
          <h2 className="text-3xl font-black uppercase italic text-red-500 mb-4">Cofre Bloqueado</h2>
          <p className="text-zinc-400 max-w-md mx-auto mb-8 text-[14px]">
            O período gratuito de 30 dias para o cofre <strong>{vault.nome}</strong> expirou. Suas fotos estão seguras, mas o acesso está suspenso. Para reativar o cofre imediatamente, inicie uma assinatura.
          </p>
          <button 
            onClick={handleSubscribe}
            disabled={checkingOut}
            className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[13px] px-10 py-4 rounded-full transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
          >
            {checkingOut ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
            Reativar Cofre Agora
          </button>
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-1 py-1 md:px-4 md:py-6 pb-32 w-full">
          {/* Subscription / Membership Banner (Phase 13 Integration) */}
          {(!vault.subscription || vault.subscription.status !== 'ACTIVE') ? (
            vault.myRole === 'OWNER' && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <Zap className="text-black" size={24} fill="currentColor" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic tracking-tight">Meus Álbuns</h3>
                      <p className="text-[11px] text-zinc-400 uppercase tracking-widest leading-relaxed max-w-md">
                        Assine por apenas <span className="text-white font-bold">R$ 49,90/mês</span> e tenha 36 fotos impressas e entregues automaticamente todo mês baseadas nos votos da galera.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={handleSubscribe}
                    className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[11px] px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/20 active:scale-95"
                  >
                    Ativar Assinatura
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mb-8">
              <div className="bg-zinc-900/50 border border-emerald-500/10 rounded-2xl p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-500/10 rounded-full flex items-center justify-center">
                    <Star className="text-emerald-500" size={16} fill="currentColor" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-tight">Assinatura Ativa</span>
                      <span className="px-2 py-0.5 bg-emerald-500 text-black text-[8px] font-black rounded-full uppercase">Premium</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 uppercase tracking-widest">
                      Próximo ciclo: {vault.subscription.nextBillingDate ? new Date(vault.subscription.nextBillingDate).toLocaleDateString() : '—'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-emerald-500 uppercase">36 POSES / MÊS</span>
                </div>
              </div>
            </div>
          )}
          {uploading && (
          <div className="mb-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-4 animate-pulse">
            <Loader2 className="animate-spin text-emerald-500" size={18} />
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-1">
                <span>Enviando Memória para o Drive...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          </div>
        )}

        {media.length === 0 && !uploading ? (
          <div className="py-32 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 bg-emerald-500/5 rounded-full flex items-center justify-center mb-6 border border-emerald-500/10">
              <Camera size={32} className="text-emerald-500/20" />
            </div>
            <h2 className="text-xl font-black uppercase italic text-gray-500">O álbum está vazio</h2>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest mt-2 max-w-[280px]">
              Seja o primeiro a eternizar um momento neste álbum.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 md:gap-4">
            <AnimatePresence>
              {media.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedPhoto(item)}
                  className={`relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer transition-all duration-300 ${
                    item.votedByMe ? 'ring-4 ring-emerald-500 scale-95 rounded-xl' : 'hover:opacity-90 rounded-none'
                  }`}
                >
                  <img 
                    src={item.thumbnailLink || (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/vaults/media/proxy/${item.fileId}` : `/api/vaults/media/proxy/${item.fileId}`)} 
                    alt="Memory" 
                    className={`w-full h-full object-cover transition-transform duration-700 ${item.votedByMe ? 'scale-105' : 'group-hover:scale-110'}`}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      const proxyUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/vaults/media/proxy/${item.fileId}` : `/api/vaults/media/proxy/${item.fileId}`;
                      if (item.thumbnailLink && target.src !== proxyUrl) {
                        target.src = proxyUrl;
                      }
                    }}
                  />

                  {/* Absolute Selection Indicator */}
                  {item.votedByMe && (
                    <motion.div 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-2 right-2 md:top-3 md:right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center z-20 shadow-lg"
                    >
                      <Heart size={16} className="text-black" fill="currentColor" />
                    </motion.div>
                  )}
                  
                  {/* Bottom Action Bar */}
                  <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-3 flex items-center justify-between transition-opacity ${item.votedByMe ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                    <div className="flex items-center gap-2">
                      <div className={`flex items-center gap-1.5 transition-all ${ item.votedByMe ? 'text-emerald-500' : 'text-white/80'}`}>
                        <Heart size={16} fill={item.votedByMe ? "currentColor" : "none"} />
                        <span className="text-[12px] font-black">{item._count.votes}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
      )}

      {/* Immersive Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/meus-albuns")} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-500 transition-colors">
            <ChevronLeft size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Voltar</span>
          </button>
          
          <button 
            onClick={handleCheckout}
            disabled={checkingOut}
            className={`flex-1 max-w-[220px] mx-4 rounded-full py-3 px-4 flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
              media.filter(m => m.votedByMe).length > 0
                ? "bg-emerald-500 text-black shadow-emerald-500/40"
                : media.length >= vault.goalPoses
                  ? "bg-emerald-500/50 text-white"
                  : "bg-zinc-800 text-gray-400"
            }`}
          >
            {checkingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {media.some(m => m.votedByMe) ? (
                  <Heart size={18} fill="currentColor" className="text-black" />
                ) : (
                  <Printer size={18} />
                )}
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {media.filter(m => m.votedByMe).length > 0 
                    ? `${media.filter(m => m.votedByMe).length} Escolhida${media.filter(m => m.votedByMe).length > 1 ? 's' : ''}` 
                    : media.length >= vault.goalPoses 
                      ? "Materializar Agora" 
                      : "Imprimir em Breve"}
                </span>
              </>
            )}
          </button>

          <label className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-500 transition-colors cursor-pointer">
            <Upload size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Enviar</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" multiple />
          </label>
        </div>
      </div>
      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 p-4 md:p-10 backdrop-blur-sm"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-5xl w-full max-h-full flex flex-col items-center gap-6"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-12 right-0 text-white/60 hover:text-white transition-colors"
              >
                <Share2 size={24} className="rotate-45" /> {/* Close icon via Share2 rotation hack if X is missing */}
                <span className="text-[10px] font-black uppercase tracking-widest ml-2">Fechar</span>
              </button>

              <div className="relative group w-full flex items-center justify-center">
                <img 
                  src={selectedPhoto.webViewLink || selectedPhoto.thumbnailLink} 
                  alt="Full view" 
                  className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
                />
                
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-4">
                   <button 
                     onClick={() => { handleVote(selectedPhoto.id); setSelectedPhoto(prev => prev ? { ...prev, votedByMe: !prev.votedByMe, _count: { votes: prev.votedByMe ? prev._count.votes - 1 : prev._count.votes + 1 } } : null); }}
                     className={`flex items-center gap-3 px-8 py-4 rounded-full font-black uppercase tracking-widest text-[12px] transition-all ${
                       selectedPhoto.votedByMe ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white backdrop-blur-md'
                     }`}
                   >
                     <Heart size={20} fill={selectedPhoto.votedByMe ? "currentColor" : "none"} />
                     {selectedPhoto.votedByMe ? "Votado" : "Votar nesta Pose"}
                   </button>
                </div>
              </div>

              <div className="text-center">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Enviada por {selectedPhoto.uploadedBy.nome}</p>
                <p className="text-white/20 text-[9px] uppercase mt-1">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

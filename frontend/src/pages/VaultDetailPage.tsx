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
  const [doubleTapId, setDoubleTapId] = useState<string | null>(null);

  const fetchVaultDetails = useCallback(async () => {
    try {
      // Tentar buscar detalhes específicos do cofre
      let currentVault;
      try {
        const vRes = await api.get(`/vaults`);
        currentVault = vRes.data.find((v: Vault) => v.id === vaultId);
      } catch { console.error("Erro ao buscar cofre"); }

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

  const handleDoubleTap = (mediaId: string) => {
    setDoubleTapId(mediaId);
    handleVote(mediaId);
    setTimeout(() => setDoubleTapId(null), 1000);
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
      const msg = (err as { response?: { data?: { error?: string } } }).response?.data?.error || "Erro ao processar materialização do cofre.";
      alert(msg);
    } finally {
      setCheckingOut(false);
    }
  };

  const handleSubscribe = () => {
    navigate(`/clube?vaultId=${vaultId}`);
  };

  const handleInvite = async () => {
    if (!vault) return;
    try {
      const { data } = await api.post(`/vaults/${vaultId}/invite`);
      const text = `Venha compartilhar memórias comigo no cofre "${vault.nome}"!\n\nLink de acesso:\n${data.url}`;
      
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
           alert("O cofre atingiu a meta! Algumas fotos não puderam ser enviadas.");
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
        <h1 className="text-2xl font-black uppercase italic">Cofre não encontrado</h1>
        <button onClick={() => navigate("/cofres")} className="mt-6 text-emerald-500 font-bold uppercase tracking-widest text-[11px]">
          Voltar para meus cofres
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans flex flex-col" style={{ background: T.bg, color: T.text }}>
      <Helmet>
        <title>{vault.nome || "Cofre"} | Cofre de Memórias</title>
      </Helmet>
      <div className="hidden md:block">
        <Navbar />
      </div>

      {/* Header Sticky / Hero Area */}
      <div className="sticky top-[64px] z-30 backdrop-blur-xl border-b" style={{ background: `color-mix(in srgb, ${T.bgCard} 80%, transparent)`, borderColor: T.border }}>
        <div className="max-w-7xl mx-auto px-4 py-4 md:py-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/cofres")}
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

        {/* Subscription / Membership Banner (Phase 13 Integration) */}
        {(!vault.subscription || vault.subscription.status !== 'ACTIVE') ? (
          vault.myRole === 'OWNER' && (
            <div className="max-w-7xl mx-auto px-4 mt-4">
              <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-6 backdrop-blur-md">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                    <Zap className="text-black" size={24} fill="currentColor" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black uppercase italic tracking-tight">Clube de Memórias</h3>
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
          <div className="max-w-7xl mx-auto px-4 mt-4">
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
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-1 py-1 md:px-4 md:py-6 pb-32">
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
            <h2 className="text-xl font-black uppercase italic text-gray-500">O cofre está vazio</h2>
            <p className="text-[11px] text-gray-600 uppercase tracking-widest mt-2 max-w-[280px]">
              Seja o primeiro a eternizar um momento neste álbum.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-0.5 md:gap-2">
            <AnimatePresence>
              {media.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer"
                >
                  <img 
                    src={item.thumbnailLink || `${import.meta.env.VITE_API_URL || '/api'}/vaults/media/proxy/${item.fileId}`} 
                    alt="Memory" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    onDoubleClick={(evt) => { evt.stopPropagation(); handleDoubleTap(item.id); }}
                    onError={(e) => {
                      // Se a miniatura falhar (ex: link expirado), tenta o proxy como última alternativa
                      const target = e.target as HTMLImageElement;
                      if (item.thumbnailLink && !target.src.includes('/proxy/')) {
                        target.src = `${import.meta.env.VITE_API_URL || '/api'}/vaults/media/proxy/${item.fileId}`;
                      }
                    }}
                  />

                  {/* Double Tap Heart Animation */}
                  <AnimatePresence>
                    {doubleTapId === item.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5, y: 0 }}
                        animate={{ opacity: 1, scale: 1.5, y: -20 }}
                        exit={{ opacity: 0, scale: 2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-10"
                      >
                        <Heart size={64} className="text-emerald-500" fill="currentColor" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Bottom Action Bar (Permanent on mobile, hover on desktop) */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-2 flex items-center justify-between transition-opacity">
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(evt) => { evt.stopPropagation(); handleVote(item.id); }}
                        className={`flex items-center gap-1.5 transition-all active:scale-125 ${ item.votedByMe ? 'text-brand-tactical' : 'text-white/60'}`}
                      >
                        <Heart size={14} fill={item.votedByMe ? "currentColor" : "none"} />
                        <span className="text-[10px] font-black">{item._count.votes}</span>
                      </button>
                    </div>
                    
                    <button 
                      onClick={(evt) => { 
                        evt.stopPropagation();
                        // Shortcut: if physical items are allowed, maybe add to cart?
                        // For now, let's just make it a visual indicator or a direct print action
                      }}
                      className="p-1.5 bg-white/10 rounded-md text-white/60 hover:bg-brand-tactical hover:text-black transition-all"
                    >
                      <Printer size={12} />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Immersive Mobile Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-zinc-950/80 backdrop-blur-xl border-t border-white/10 pb-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={() => navigate("/cofres")} className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-500 transition-colors">
            <ChevronLeft size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Voltar</span>
          </button>
          
          <button 
            onClick={handleCheckout}
            disabled={checkingOut}
            className={`flex-1 max-w-[200px] mx-4 rounded-full py-3 px-4 flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
              media.length >= vault.goalPoses
                ? "bg-emerald-500 text-black shadow-emerald-500/40"
                : "bg-zinc-800 text-gray-400"
            }`}
          >
            {checkingOut ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                <Printer size={18} />
                <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">
                  {media.length >= vault.goalPoses ? "Materializar Agora" : "Imprimir em Breve"}
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
    </div>
  );
}

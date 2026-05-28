import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Lock, Upload, Heart, Share2, 
  ChevronLeft, ChevronRight, Loader2, Camera,
  Printer, Zap, Star, Settings, Video, PlayCircle, Download,
  RotateCcw, RotateCw
} from "lucide-react";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";
import { VaultSettingsModal } from "../components/VaultSettingsModal";
import { PrintStoreModal } from "../components/PrintStoreModal";
import { ServiceStoreModal } from "../components/ServiceStoreModal";

interface Media {
  id: string;
  thumbnailLink: string;
  webViewLink: string;
  fileId: string;
  uploadedBy: { nome: string };
  createdAt: string;
  _count: { votes: number };
  votedByMe?: boolean;
  fileSize?: number;
  width?: number;
  height?: number;
  originalDate?: string;
  status?: string; // PENDING | APPROVED | REJECTED
  type?: string; // PHOTO | VIDEO
  rotation?: number; // 0, 90, 180, 270
}

interface Vault {
  id: string;
  nome: string;
  goalPoses: number;
  status: string;
  subscriptionStatus: string;
  externalVideoLink?: string | null;
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
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState("UPLOAD_DESC");
  const [isPrintStoreOpen, setIsPrintStoreOpen] = useState(false);
  const [isServiceStoreOpen, setIsServiceStoreOpen] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadingSingle, setDownloadingSingle] = useState(false);

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

  const handleDeleteMedia = async (mediaId: string) => {
    if (!vault || !window.confirm("Tem certeza? Esta foto será excluída permanentemente.")) return;
    try {
      await api.delete(`/vaults/${vaultId}/media/${mediaId}`);
      setMedia(prev => prev.filter(m => m.id !== mediaId));
      setSelectedPhoto(null);
    } catch (err) {
      console.error("[Delete Media] Erro:", err);
      alert("Erro ao excluir a foto.");
    }
  };

  const handleRotateMedia = async (mediaId: string, direction: 'LEFT' | 'RIGHT') => {
    try {
      const { data } = await api.patch(`/vaults/${vaultId}/media/${mediaId}/rotate`, { direction });
      setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, rotation: data.rotation } : m));
      setSelectedPhoto(prev => prev && prev.id === mediaId ? { ...prev, rotation: data.rotation } : prev);
    } catch (err: any) {
      alert(err.response?.data?.error || "Erro ao rotacionar foto.");
    }
  };

  const handleApproveMedia = async (mediaId: string, currentStatus: string) => {
    const newStatus = currentStatus === "APPROVED" ? "PENDING" : "APPROVED";
    try {
      await api.patch(`/vaults/${vaultId}/media/${mediaId}/status`, { status: newStatus });
      setMedia(prev => prev.map(m => m.id === mediaId ? { ...m, status: newStatus } : m));
      setSelectedPhoto(prev => prev?.id === mediaId ? { ...prev, status: newStatus } : prev);
    } catch (err) {
      console.error("[Approve Media] Erro:", err);
      alert("Erro ao alterar status da foto.");
    }
  };

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



  const handleSubscribe = async () => {
    if (!vault) return;
    setCheckingOut(true);
    try {
      const res = await api.post(`/vaults/${vaultId}/subscribe`);
      if (res.data.subscriptionId) {
        // Redireciona para o checkout transparente padrão do sistema
        navigate(`/checkout?orderId=${res.data.subscriptionId}`);
      } else if (res.data.initPoint) {
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

  const handleDownloadAll = async () => {
    if (!vault) return;
    setDownloadingAll(true);
    try {
      const response = await api.get(`/vaults/${vaultId}/download-all`, {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${vault.nome}-fotos.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("[Download All] Erro:", err);
      alert("Erro ao baixar as fotos.");
    } finally {
      setDownloadingAll(false);
    }
  };

  const handleDownloadSingle = async () => {
    if (!selectedPhoto) return;
    setDownloadingSingle(true);
    try {
      const proxyUrl = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/vaults/media/proxy/${selectedPhoto.fileId}` : `/api/vaults/media/proxy/${selectedPhoto.fileId}`;
      const response = await fetch(proxyUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${selectedPhoto.fileId}.${selectedPhoto.type === 'VIDEO' ? 'mp4' : 'jpg'}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
    } catch (err) {
      console.error("[Download Single] Erro:", err);
      alert("Erro ao baixar o arquivo.");
    } finally {
      setDownloadingSingle(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchVaultDetails();
    
    // Check for success redirect from MP or URL actions
    const params = new URLSearchParams(window.location.search);
    
    if (params.get("subscribed") === "true") {
      // In a real app, we'd use a toast component
      alert("Assinatura ativada com sucesso! Seu cofre está salvo.");
      // Remove query param to avoid repeated alerts
      params.delete("subscribed");
      const newQuery = params.toString();
      window.history.replaceState({}, document.title, `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`);
    }

    if (params.get("action") === "print") {
      setIsPrintStoreOpen(true);
      params.delete("action");
      const newQuery = params.toString();
      window.history.replaceState({}, document.title, `${window.location.pathname}${newQuery ? `?${newQuery}` : ''}`);
    }
  }, [user, navigate, fetchVaultDetails]);

  const sortedMedia = useMemo(() => {
    return [...media].sort((a, b) => {
      switch (sortConfig) {
        case "UPLOAD_ASC": return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "EXIF_ASC": {
          const da = a.originalDate ? new Date(a.originalDate).getTime() : new Date(a.createdAt).getTime();
          const db = b.originalDate ? new Date(b.originalDate).getTime() : new Date(b.createdAt).getTime();
          return da - db;
        }
        case "SIZE_DESC": return (b.fileSize || 0) - (a.fileSize || 0);
        case "ORIENTATION_HORZ": {
          const isAHorz = (a.width || 0) > (a.height || 0);
          const isBHorz = (b.width || 0) > (b.height || 0);
          return isAHorz === isBHorz ? 0 : isAHorz ? -1 : 1;
        }
        case "UPLOAD_DESC":
        default: return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [media, sortConfig]);

  const handleNavigateMedia = useCallback((direction: 'prev' | 'next', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!selectedPhoto) return;
    const currentIndex = sortedMedia.findIndex(m => m.id === selectedPhoto.id);
    if (currentIndex === -1) return;
    
    if (direction === 'prev') {
      const prevIndex = currentIndex > 0 ? currentIndex - 1 : sortedMedia.length - 1;
      setSelectedPhoto(sortedMedia[prevIndex]);
    } else {
      const nextIndex = currentIndex < sortedMedia.length - 1 ? currentIndex + 1 : 0;
      setSelectedPhoto(sortedMedia[nextIndex]);
    }
  }, [selectedPhoto, sortedMedia]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedPhoto) return;
      if (e.key === 'ArrowLeft') handleNavigateMedia('prev');
      if (e.key === 'ArrowRight') handleNavigateMedia('next');
      if (e.key === 'Escape') setSelectedPhoto(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedPhoto, handleNavigateMedia]);

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

      // 2. Size Guard
      const isVideo = file.type.startsWith("video/");
      const maxSize = isVideo ? 100 * 1024 * 1024 : 4.5 * 1024 * 1024;
      if (file.size > maxSize) {
        console.warn("[Upload] Arquivo muito grande:", file.name);
        alert(`O arquivo ${file.name} excede o limite de ${isVideo ? '100MB' : '4.5MB'}.`);
        failCount++;
        continue;
      }

      // 3. Sequential Upload
      const formData = new FormData();
      formData.append("file", file);

      try {
        await api.post(`/vaults/${vaultId}/upload`, formData, {
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
                  {media.filter(m => m.status !== 'REJECTED').length} / {vault.goalPoses} POSES
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
                onClick={() => setIsSettingsOpen(true)}
                className="hidden md:flex p-2 text-zinc-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                title="Configurações do Álbum"
              >
                <Settings size={20} />
              </button>
            )}
            {vault.myRole === "OWNER" && (
              <button 
                onClick={() => setIsPrintStoreOpen(true)}
                className={`flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-lg ${
                  media.length >= vault.goalPoses 
                    ? "bg-emerald-500 text-black shadow-emerald-500/40 animate-pulse" 
                    : "bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10"
                }`}
              >
                <Printer size={14} />
                Materializar
              </button>
            )}

            {vault.subscriptionStatus === "ACTIVE" && vault.externalVideoLink && (
              <a 
                href={vault.externalVideoLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-400 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-blue-500/20"
              >
                <Video size={14} />
                Acessar Vídeos Brutos
              </a>
            )}
            
            <button 
              onClick={() => setIsServiceStoreOpen(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-purple-500 hover:bg-purple-400 text-black text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              <Video size={14} />
              Serviços
            </button>

            <button 
              onClick={handleDownloadAll}
              disabled={downloadingAll}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
            >
              {downloadingAll ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Baixar Tudo
            </button>

            <button 
              onClick={handleInvite}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-white/5 border border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-lg transition-all"
            >
              <Share2 size={14} />
              Convidar
            </button>
            
            <label className={`flex-1 md:flex-none flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest px-5 py-2.5 rounded-lg transition-all shadow-lg ${
              media.length >= vault.goalPoses * 2
                ? "bg-zinc-800 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20 cursor-pointer"
            }`}>
              <Upload size={14} />
              {media.length >= vault.goalPoses * 2 ? "Limite Atingido" : "Enviar Mídia"}
                <input type="file" className="hidden" onChange={handleFileUpload} accept={vault.subscriptionStatus === "ACTIVE" ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*"} multiple />
            </label>
          </div>
        </div>

      </div>

      {/* Warning Banner se faltam poucos dias */}
      {!isBlocked && vault.subscriptionStatus === "TRIAL" && daysLeft !== null && daysLeft <= 5 && (
        <div className="bg-yellow-500/20 border-b border-yellow-500/30 px-4 py-3 text-center">
          <p className="text-yellow-500 text-[11px] font-black uppercase tracking-widest">
            Atenção: O período gratuito deste cofre acaba em {daysLeft} dia{daysLeft !== 1 ? 's' : ''}.{' '}
            {vault.myRole === 'OWNER' ? (
              <button onClick={handleSubscribe} className="underline ml-1">Assine agora</button>
            ) : (
              <span className="ml-1">Fale com o proprietário para ativar a assinatura.</span>
            )}
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
            O período gratuito de 30 dias para o cofre <strong>{vault.nome}</strong> expirou. Suas fotos estão seguras, mas o acesso está suspenso. {vault.myRole === 'OWNER' ? 'Para reativar o cofre imediatamente, inicie uma assinatura.' : 'Fale com o proprietário do cofre para reativar o acesso.'}
          </p>
          {vault.myRole === 'OWNER' ? (
            <button 
              onClick={handleSubscribe}
              disabled={checkingOut}
              className="bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[13px] px-10 py-4 rounded-full transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center gap-2"
            >
              {checkingOut ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
              Reativar Cofre Agora
            </button>
          ) : (
            <div className="px-6 py-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[11px] font-black uppercase tracking-widest">
              Apenas o proprietário pode reativar o cofre.
            </div>
          )}
        </main>
      ) : (
        <main className="max-w-7xl mx-auto px-1 py-1 md:px-4 md:py-6 pb-32 w-full">
          {/* Materialization Banner (Replaces immediate subscription upsell) */}
          {(!vault.subscription || vault.subscription.status !== 'ACTIVE') ? (
            vault.myRole === 'OWNER' && (
              <div className="mb-8">
                <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border border-emerald-500/30 rounded-2xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 backdrop-blur-md">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                      <Printer className="text-black" size={24} />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase italic tracking-tight">Imprimir Álbum</h3>
                      <p className="text-[11px] text-zinc-400 uppercase tracking-widest leading-relaxed max-w-md">
                        Materialize este álbum com as <span className="text-white font-bold">{vault.goalPoses} poses</span> selecionadas. Garanta a impressão em alta qualidade.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setIsPrintStoreOpen(true)}
                    className="w-full md:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-widest text-[11px] px-8 py-3.5 rounded-full transition-all shadow-xl shadow-emerald-500/20 active:scale-95 flex items-center justify-center gap-2"
                  >
                    <Printer size={16} />
                    Materializar Álbum
                  </button>
                </div>
              </div>
            )
          ) : (
            <div className="mb-8">
              <div className="bg-zinc-900/50 border border-emerald-500/10 rounded-2xl p-6 flex items-center justify-between gap-6">
                <div className="flex items-center gap-4">
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
          <div className="mb-6 p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center gap-6 animate-pulse">
            <Loader2 className="animate-spin text-emerald-500" size={24} />
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
              {sortedMedia.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.02 }}
                  onClick={() => setSelectedPhoto(item)}
                  className={`relative aspect-square bg-zinc-900 overflow-hidden group cursor-pointer transition-all duration-300 ${
                    item.votedByMe ? 'ring-4 ring-emerald-500 scale-95 rounded-xl' : 'hover:opacity-90 rounded-none'
                  } ${
                    item.status === 'PENDING' ? 'opacity-60' : ''
                  }`}
                >
                  <img 
                    src={item.thumbnailLink || `${import.meta.env.VITE_API_URL?.replace(/\/$/, '') || window.location.origin}/vaults/media/proxy/${item.fileId}`}
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

                  {/* Pending badge (visible only to owner) */}
                  {item.status === 'PENDING' && vault.myRole === 'OWNER' && (
                    <div className="absolute top-2 left-2 z-20 px-2 py-0.5 bg-yellow-500 text-black text-[8px] font-black uppercase tracking-widest rounded-full">
                      Pendente
                    </div>
                  )}

                  {/* Video Indicator */}
                  {item.type === 'VIDEO' && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <PlayCircle size={32} className="text-white/70 drop-shadow-lg" />
                    </div>
                  )}

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
            onClick={() => setIsServiceStoreOpen(true)}
            className="flex flex-col items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors ml-2"
          >
            <Video size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest text-center">Serviços</span>
          </button>
          
          <button 
            onClick={() => setIsPrintStoreOpen(true)}
            className={`flex-1 max-w-[220px] mx-4 rounded-full py-3 px-4 flex items-center justify-center gap-2 shadow-xl transition-all active:scale-95 disabled:opacity-50 ${
              media.filter(m => m.votedByMe).length > 0
                ? "bg-emerald-500 text-black shadow-emerald-500/40"
                : media.length >= vault.goalPoses
                  ? "bg-emerald-500/50 text-white"
                  : "bg-zinc-800 text-gray-400"
            }`}
          >
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
                  : "Imprimir Em Breve"}
            </span>
          </button>

          {vault.subscriptionStatus === "ACTIVE" && vault.externalVideoLink && (
            <a 
              href={vault.externalVideoLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors mr-4"
            >
              <Video size={20} />
              <span className="text-[9px] font-black uppercase tracking-widest text-center">Vídeos<br/>Brutos</span>
            </a>
          )}

          <label className="flex flex-col items-center gap-1 text-zinc-400 hover:text-emerald-500 transition-colors cursor-pointer">
            <Upload size={20} />
            <span className="text-[9px] font-black uppercase tracking-widest">Enviar</span>
            <input type="file" className="hidden" onChange={handleFileUpload} accept={vault.subscriptionStatus === "ACTIVE" ? "image/*,video/mp4,video/quicktime,video/webm" : "image/*"} multiple />
          </label>
        </div>
      </div>
      
      <VaultSettingsModal 
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        vault={vault as unknown as React.ComponentProps<typeof VaultSettingsModal>["vault"]}
        onUpdate={() => { fetchVaultDetails(); setIsSettingsOpen(false); }}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
      />

      {isPrintStoreOpen && (
        <PrintStoreModal
          eventId={vault.id}
          eventTitle={vault.nome}
          medias={media.map(m => ({ id: m.id, url: m.thumbnailLink || m.webViewLink, shortId: m.fileId }))}
          isOwner={vault.myRole === "OWNER"}
          isMarketplace={false}
          initialSelectedPhotos={media.filter(m => m.votedByMe).map(m => m.thumbnailLink || m.webViewLink)}
          onClose={() => setIsPrintStoreOpen(false)}
        />
      )}

      {isServiceStoreOpen && (
        <ServiceStoreModal
          vaultId={vault.id}
          vaultName={vault.nome}
          onClose={() => setIsServiceStoreOpen(false)}
        />
      )}

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
            {/* Prev Button */}
            <button
              onClick={(e) => handleNavigateMedia('prev', e)}
              className="absolute left-2 md:left-10 z-[210] p-2 md:p-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 text-white rounded-full backdrop-blur-md transition-all shadow-xl"
            >
              <ChevronLeft size={32} />
            </button>
            
            {/* Next Button */}
            <button
              onClick={(e) => handleNavigateMedia('next', e)}
              className="absolute right-2 md:right-10 z-[210] p-2 md:p-4 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/50 text-white rounded-full backdrop-blur-md transition-all shadow-xl"
            >
              <ChevronRight size={32} />
            </button>

            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="relative max-w-4xl w-full flex flex-col z-[205] max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* ── Header: download + close ── */}
              <div className="flex justify-end gap-4 pb-3 shrink-0">
                <button 
                  onClick={handleDownloadSingle}
                  disabled={downloadingSingle}
                  className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  {downloadingSingle ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Baixar</span>
                </button>
                <button 
                  onClick={() => setSelectedPhoto(null)}
                  className="text-white/60 hover:text-white transition-colors flex items-center gap-2"
                >
                  <Share2 size={20} className="rotate-45" />
                  <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">Fechar</span>
                </button>
              </div>

              {/* ── Image area: ocupa o espaço disponível ── */}
              <div className="relative flex-1 min-h-0 flex items-center justify-center overflow-hidden rounded-lg">
                {selectedPhoto.type === 'VIDEO' ? (
                  <video 
                    src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/vaults/media/proxy/${selectedPhoto.fileId}` : `/api/vaults/media/proxy/${selectedPhoto.fileId}`}
                    controls
                    autoPlay
                    className="max-w-full max-h-[60vh] md:max-h-[70vh] rounded-lg shadow-2xl"
                  />
                ) : (
                  <img 
                    src={import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/vaults/media/proxy/${selectedPhoto.fileId}` : `/api/vaults/media/proxy/${selectedPhoto.fileId}`} 
                    alt="Full view" 
                    className="max-w-full max-h-[60vh] md:max-h-[70vh] object-contain rounded-lg shadow-2xl transition-transform duration-300"
                    style={{ transform: `rotate(${selectedPhoto.rotation || 0}deg)` }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== selectedPhoto.thumbnailLink) {
                        target.src = selectedPhoto.thumbnailLink;
                      }
                    }}
                  />
                )}


                {/* Botões de rotação: overlay no canto superior direito da imagem */}
                {vault?.myRole === 'OWNER' && selectedPhoto.type !== 'VIDEO' && (
                  <div className="absolute top-3 right-3 flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRotateMedia(selectedPhoto.id, 'LEFT'); }}
                      className="p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all"
                      title="Rotacionar para a esquerda"
                    >
                      <RotateCcw size={16} />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRotateMedia(selectedPhoto.id, 'RIGHT'); }}
                      className="p-2 bg-black/60 hover:bg-black text-white rounded-full transition-all"
                      title="Rotacionar para a direita"
                    >
                      <RotateCw size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* ── Botões de ação: abaixo da foto, não sobrepostos ── */}
              <div className="shrink-0 flex items-center justify-center gap-2 pt-3 px-2 flex-wrap">
                <button 
                  onClick={() => { handleVote(selectedPhoto.id); setSelectedPhoto(prev => prev ? { ...prev, votedByMe: !prev.votedByMe, _count: { votes: prev.votedByMe ? prev._count.votes - 1 : prev._count.votes + 1 } } : null); }}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black uppercase tracking-wider text-[11px] transition-all whitespace-nowrap ${
                    selectedPhoto.votedByMe ? 'bg-emerald-500 text-black' : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  <Heart size={15} fill={selectedPhoto.votedByMe ? "currentColor" : "none"} />
                  {selectedPhoto.votedByMe ? "Votado" : "Votar nesta Pose"}
                </button>

                {vault?.myRole === 'OWNER' && (
                  <>
                    <button
                      onClick={() => handleApproveMedia(selectedPhoto.id, selectedPhoto.status || 'PENDING')}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-black uppercase tracking-wider text-[11px] transition-all whitespace-nowrap ${
                        selectedPhoto.status === 'APPROVED'
                          ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                          : 'bg-yellow-500 text-black hover:bg-yellow-400'
                      }`}
                    >
                      {selectedPhoto.status === 'APPROVED' ? '✓ Aprovada' : '✓ Aprovar'}
                    </button>
                    <button
                      onClick={() => handleDeleteMedia(selectedPhoto.id)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-full font-black uppercase tracking-wider text-[11px] bg-red-500/80 hover:bg-red-500 text-white transition-all whitespace-nowrap"
                    >
                      🗑 Excluir
                    </button>
                  </>
                )}
              </div>

              {/* ── Info: enviada por ── */}
              <div className="text-center shrink-0 pt-2 pb-1">
                <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.2em]">Enviada por {selectedPhoto.uploadedBy.nome}</p>
                <p className="text-white/20 text-[9px] uppercase mt-0.5">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

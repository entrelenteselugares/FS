import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { API as api } from "../../lib/api";
import { ChevronLeft, Camera, Utensils, Users, Share2, X, Heart, MessageSquare } from "lucide-react";
import { toast } from "sonner";
import { ShareCollage } from "../../components/worldcup/ShareCollage";
import { TacticalPitch } from "../../components/worldcup/TacticalPitch";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../../hooks/useAuth";

// Componente para a moldura estilo figurinha colecionável
export const StickerFrame = ({ 
  imageUrl, 
  missionType, 
  likesCount = 0, 
  commentsCount = 0, 
  caption = "" 
}: { 
  imageUrl: string; 
  missionType: string; 
  likesCount?: number; 
  commentsCount?: number; 
  caption?: string; 
}) => {
  const power = 50 + (likesCount * 10) + Math.min(commentsCount, 5) * 20;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: "12px",
        border: "3px solid #fbbf24", // Borda dourada
        background: "linear-gradient(135deg, #064e3b 0%, #022c22 100%)",
        padding: "6px",
        boxShadow: "0 10px 20px rgba(0, 0, 0, 0.5), inset 0 0 10px rgba(251, 191, 36, 0.2)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Brilho Holográfico */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 50%, rgba(255,255,255,0.1) 100%)",
          pointerEvents: "none",
          zIndex: 5,
        }}
      />

      {/* Info superior */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px", zIndex: 6 }}>
        <span style={{ fontSize: "8px", fontWeight: 900, color: "#fbbf24", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          {missionType}
        </span>
        <span style={{ fontSize: "8px", fontWeight: 900, color: "black", background: "#fbbf24", padding: "1px 4px", borderRadius: "3px" }}>
          {power} PTS
        </span>
      </div>

      {/* Imagem */}
      <div style={{ flex: 1, borderRadius: "6px", overflow: "hidden", position: "relative", border: "1px solid rgba(255,255,255,0.1)" }}>
        <img src={imageUrl} alt="Figurinha" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Legenda inferior */}
      <div 
        style={{ 
          marginTop: "6px", 
          padding: "4px 2px", 
          background: "rgba(0,0,0,0.5)", 
          borderRadius: "4px", 
          textAlign: "center",
          border: "1px solid rgba(251, 191, 36, 0.2)"
        }}
      >
        <div style={{ fontSize: "9px", fontWeight: 900, color: "white", textTransform: "uppercase", letterSpacing: "0.05em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {caption || "Torcedor Oficial"}
        </div>
      </div>
    </div>
  );
};

export const MatchFolhaPage = () => {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [folha, setFolha] = useState<{ id: string; slots: { id: string; slotIndex: number; missionType: string; imageUrl?: string; metadata?: any }[]; completed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCollage, setShowCollage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");
  
  // Likes e Comentários do Slot ativo no modal
  const [likes, setLikes] = useState<string[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const { data } = await api.get(`/worldcup/album/${matchId}`);
        setFolha(data.folha);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao carregar folha.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [matchId]);

  useEffect(() => {
    if (selectedPreviewSlot) {
      const meta = selectedPreviewSlot.metadata || {};
      setLikes(Array.isArray(meta.likes) ? meta.likes : []);
      setComments(Array.isArray(meta.comments) ? meta.comments : []);
    } else {
      setLikes([]);
      setComments([]);
    }
  }, [selectedPreviewSlot]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length || activeSlot === null || !folha) return;
    const file = e.target.files[0];
    
    // Fake upload for MVP (in reality, upload to S3/Supabase Storage)
    const fakeUrl = URL.createObjectURL(file);
    
    const toastId = toast.loading("Enviando foto...");
    try {
      const { data } = await api.post(`/worldcup/album/${matchId}/slot`, {
        slotIndex: activeSlot,
        imageUrl: fakeUrl
      });
      
      const newSlots = folha.slots.map((s: { slotIndex: number }) => 
        s.slotIndex === activeSlot ? data.slot : s
      );
      setFolha({
        id: folha.id,
        completed: folha.completed,
        slots: newSlots
      });
      toast.success("Foto adicionada!", { id: toastId });

      if (data.badgesAwarded?.length) {
        data.badgesAwarded.forEach((badge: string) => {
          toast.success(`🎉 Você desbloqueou o selo: ${badge}!`, { duration: 5000 });
        });
      }
    } catch {
      toast.error("Erro ao enviar foto", { id: toastId });
    }
  };

  const handleLike = async () => {
    if (!selectedPreviewSlot) return;
    try {
      const { data } = await api.post(`/worldcup/album/${matchId}/slot/${selectedPreviewSlot.slotIndex}/like`);
      if (data.success) {
        setLikes(data.slot.metadata.likes || []);
        
        // Atualiza a folha no estado principal
        if (folha) {
          const newSlots = folha.slots.map((s: any) => 
            s.slotIndex === selectedPreviewSlot.slotIndex ? data.slot : s
          );
          setFolha({ ...folha, slots: newSlots });
        }
        toast.success(data.slot.metadata.likes.includes(user?.id) ? "Curtido!" : "Curtida removida");
      }
    } catch {
      toast.error("Erro ao processar curtida.");
    }
  };

  const handleAddComment = async () => {
    if (!selectedPreviewSlot || !newCommentText.trim()) return;
    try {
      const { data } = await api.post(`/worldcup/album/${matchId}/slot/${selectedPreviewSlot.slotIndex}/comment`, {
        commentText: newCommentText
      });
      if (data.success) {
        setComments(data.slot.metadata.comments || []);
        setNewCommentText("");

        // Atualiza a folha no estado principal
        if (folha) {
          const newSlots = folha.slots.map((s: any) => 
            s.slotIndex === selectedPreviewSlot.slotIndex ? data.slot : s
          );
          setFolha({ ...folha, slots: newSlots });
        }
        toast.success("Comentário adicionado!");
      }
    } catch {
      toast.error("Erro ao enviar comentário.");
    }
  };

  const getSlotIcon = (missionType: string) => {
    switch (missionType) {
      case "COMIDA": return <Utensils size={32} />;
      case "ESCALACAO": return <Users size={32} />;
      case "SELFIE": return <Camera size={32} />;
      default: return <Camera size={32} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!folha) {
    return (
      <div className="min-h-screen bg-theme-bg flex items-center justify-center text-white p-4">
        <div className="text-center">
          <p className="text-lg font-bold text-red-500">Erro ao carregar folha do jogo.</p>
          <Link to="/album-torcida" className="mt-4 inline-block px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-sm">
            Voltar para o Álbum
          </Link>
        </div>
      </div>
    );
  }

  const filledCount = folha.slots.filter((s: { imageUrl?: string }) => !!s.imageUrl).length;

  return (
    <div className="min-h-screen bg-theme-bg text-white pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-theme-bg/90 backdrop-blur-md border-b border-theme-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/album-torcida" className="p-2 hover:bg-theme-surface rounded-full">
            <ChevronLeft />
          </Link>
          <div className="text-center">
            <h1 className="font-bold">Match Day</h1>
            <div className="text-sm text-emerald-400 font-bold">{filledCount} / 12 Fotos</div>
          </div>
          <button 
            onClick={() => setShowCollage(true)}
            disabled={filledCount < 1}
            className="p-2 hover:bg-theme-surface rounded-full disabled:opacity-50"
          >
            <Share2 />
          </button>
        </div>
        
        {/* Progress Bar */}
        <div className="max-w-4xl mx-auto mt-4 h-2 bg-theme-surface rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${(filledCount / 12) * 100}%` }}
          />
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4 mt-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => {
            const slot = folha.slots.find((s: { slotIndex: number }) => s.slotIndex === i) || { slotIndex: i, missionType: "LIVRE", imageUrl: undefined, metadata: undefined };
            const likesCount = slot.metadata?.likes?.length || 0;
            const commentsCount = slot.metadata?.comments?.length || 0;
            const caption = slot.metadata?.comment || "";

            return (
              <div 
                key={i}
                onClick={() => {
                  if (slot.imageUrl) {
                    setSelectedPreviewSlot(slot);
                    setCommentText(slot.metadata?.comment || "");
                  } else {
                    setActiveSlot(i);
                    fileInputRef.current?.click();
                  }
                }}
                className={`aspect-[3/4] rounded-xl overflow-hidden relative cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${
                  slot.imageUrl 
                    ? '' 
                    : 'border-2 border-dashed border-theme-border hover:border-emerald-500/50 bg-theme-surface flex items-center justify-center text-gray-500'
                }`}
              >
                {slot.imageUrl ? (
                  <StickerFrame
                    imageUrl={slot.imageUrl}
                    missionType={slot.missionType}
                    likesCount={likesCount}
                    commentsCount={commentsCount}
                    caption={caption}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    {getSlotIcon(slot.missionType)}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{slot.missionType}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <input 
        type="file" 
        accept="image/*" 
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden" 
        capture="environment"
      />

      <AnimatePresence>
        {activeSlot === 8 && (
           <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
              <div className="w-full relative">
                <button onClick={() => setActiveSlot(null)} className="absolute -top-12 right-0 p-2 text-white"><X size={24}/></button>
                <TacticalPitch />
              </div>
           </div>
        )}
        {showCollage && (
          <ShareCollage 
            slots={folha.slots} 
            onClose={() => setShowCollage(false)} 
          />
        )}
        {selectedPreviewSlot && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md overflow-y-auto">
            <div className="bg-theme-bg border border-theme-border w-full max-w-lg rounded-2xl overflow-hidden relative p-6 flex flex-col gap-4 my-8">
              <button 
                onClick={() => { setSelectedPreviewSlot(null); setCommentText(""); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-theme-surface"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <h3 className="font-bold text-lg text-white">Visualizar Figurinha</h3>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Missão: {selectedPreviewSlot.missionType}
                </span>
              </div>

              {/* Renders StickerFrame preview inside modal */}
              <div className="w-64 aspect-[3/4] mx-auto">
                <StickerFrame
                  imageUrl={selectedPreviewSlot.imageUrl}
                  missionType={selectedPreviewSlot.missionType}
                  likesCount={likes.length}
                  commentsCount={comments.length}
                  caption={commentText}
                />
              </div>

              {/* Likes & Comments Interactive Area */}
              <div className="border-t border-theme-border pt-4 flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  {/* Like Button */}
                  <button
                    onClick={handleLike}
                    className="flex items-center gap-2 px-4 py-2 bg-theme-surface rounded-xl hover:bg-theme-surface/80 transition-colors"
                  >
                    <Heart 
                      size={18} 
                      fill={likes.includes(user?.id || "") ? "#ef4444" : "none"} 
                      color={likes.includes(user?.id || "") ? "#ef4444" : "white"} 
                    />
                    <span className="text-xs font-bold">{likes.length} Curtidas</span>
                  </button>
                  <span className="text-xs text-gray-400">Score do Card: {50 + (likes.length * 10) + Math.min(comments.length, 5) * 20} PTS</span>
                </div>

                {/* Edit Caption (Only for slot owner or simple placeholder) */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                    Alterar Legenda da Figurinha:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder="Escreva algo sobre este momento marcante..."
                      className="flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                    />
                    <button
                      onClick={async () => {
                        const toastId = toast.loading("Salvando legenda...");
                        try {
                          const { data } = await api.post(`/worldcup/album/${matchId}/slot`, {
                            slotIndex: selectedPreviewSlot.slotIndex,
                            imageUrl: selectedPreviewSlot.imageUrl,
                            metadata: { ...selectedPreviewSlot.metadata, comment: commentText }
                          });
                          if (!folha) return;
                          const newSlots = folha.slots.map((s: any) => 
                            s.slotIndex === selectedPreviewSlot.slotIndex ? data.slot : s
                          );
                          setFolha({ ...folha, slots: newSlots });
                          toast.success("Legenda salva!", { id: toastId });
                        } catch {
                          toast.error("Erro ao salvar legenda.", { id: toastId });
                        }
                      }}
                      className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-xs hover:bg-emerald-400 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                </div>

                {/* Comments List */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wide flex items-center gap-1">
                    <MessageSquare size={12} /> Comentários ({comments.length})
                  </label>
                  <div className="max-h-32 overflow-y-auto flex flex-col gap-2 bg-theme-surface/30 p-2 rounded-xl border border-theme-border">
                    {comments.length === 0 ? (
                      <p className="text-xs text-gray-500 italic p-2">Nenhum comentário ainda. Seja o primeiro!</p>
                    ) : (
                      comments.map((c: any) => (
                        <div key={c.id} className="text-xs bg-theme-surface/55 p-2 rounded-lg">
                          <strong className="text-emerald-400 mr-2">{c.userName}:</strong>
                          <span className="text-gray-300">{c.commentText}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Add new Comment */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="Adicione um comentário..."
                    className="flex-1 bg-theme-surface border border-theme-border rounded-xl px-3 py-2 text-sm text-white focus:border-emerald-500 outline-none"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-colors"
                  >
                    Enviar
                  </button>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex gap-3 mt-4 border-t border-theme-border pt-4">
                <button
                  onClick={() => {
                    const idx = selectedPreviewSlot.slotIndex;
                    setSelectedPreviewSlot(null);
                    setCommentText("");
                    setActiveSlot(idx);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="w-full py-3 bg-theme-surface text-white font-bold rounded-xl text-sm border border-theme-border hover:bg-theme-surface/80 transition-colors uppercase tracking-wider"
                >
                  Substituir Foto
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

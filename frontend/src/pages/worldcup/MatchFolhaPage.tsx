import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { API as api } from "../../lib/api";
import { ChevronLeft, Camera, Utensils, Users, CheckCircle, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { ShareCollage } from "../../components/worldcup/ShareCollage";
import { TacticalPitch } from "../../components/worldcup/TacticalPitch";
import { motion, AnimatePresence } from "framer-motion";

export const MatchFolhaPage = () => {
  const { matchId } = useParams();
  const [folha, setFolha] = useState<{ id: string; slots: { id: string; slotIndex: number; missionType: string; imageUrl?: string; metadata?: any }[]; completed: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCollage, setShowCollage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSlot, setActiveSlot] = useState<number | null>(null);
  const [selectedPreviewSlot, setSelectedPreviewSlot] = useState<any | null>(null);
  const [commentText, setCommentText] = useState("");

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

  const getSlotIcon = (missionType: string) => {
    switch (missionType) {
      case "COMIDA": return <Utensils size={32} />;
      case "ESCALACAO": return <Users size={32} />;
      case "SELFIE": return <Camera size={32} />;
      default: return <Camera size={32} />;
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-theme-bg flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
    </div>;
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
        <div className="grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
          {Array.from({ length: 12 }).map((_, i) => {
            const slot = folha.slots.find((s: { slotIndex: number }) => s.slotIndex === i) || { slotIndex: i, missionType: "LIVRE", imageUrl: undefined, metadata: undefined };
            
            return (
              <div 
                key={i}
                onClick={() => {
                  if (slot.imageUrl) {
                    setSelectedPreviewSlot(slot);
                    setCommentText(slot.metadata?.comment || "");
                  } else {
                    if (slot.missionType === "ESCALACAO") {
                      // Tratar a lógica de arrastar e soltar (Tactical Pitch) aqui, por simplicidade estamos abrindo câmera tbm
                    }
                    setActiveSlot(i);
                    fileInputRef.current?.click();
                  }
                }}
                className={`aspect-square rounded-xl overflow-hidden relative cursor-pointer transition-transform hover:scale-[1.02] active:scale-95 ${
                  slot.imageUrl 
                    ? 'border-2 border-emerald-500/50' 
                    : 'border-2 border-dashed border-theme-border hover:border-emerald-500/50 bg-theme-surface flex items-center justify-center text-gray-500'
                }`}
              >
                {slot.imageUrl ? (
                  <>
                    <img src={slot.imageUrl} alt={`Slot ${i}`} className="w-full h-full object-cover" />
                    <div className="absolute top-2 right-2 bg-emerald-500 rounded-full p-1 text-white">
                      <CheckCircle size={14} />
                    </div>
                  </>
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
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
            <div className="bg-theme-bg border border-theme-border w-full max-w-lg rounded-2xl overflow-hidden relative p-6 flex flex-col gap-4">
              <button 
                onClick={() => { setSelectedPreviewSlot(null); setCommentText(""); }}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-full hover:bg-theme-surface"
              >
                <X size={20} />
              </button>

              <div className="text-center">
                <h3 className="font-bold text-lg text-white">Visualizar Foto</h3>
                <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">
                  Missão: {selectedPreviewSlot.missionType}
                </span>
              </div>

              <div className="aspect-square w-full rounded-xl overflow-hidden border border-theme-border bg-theme-surface">
                <img 
                  src={selectedPreviewSlot.imageUrl} 
                  alt="Preview" 
                  className="w-full h-full object-cover" 
                />
              </div>

              {/* Comment / Caption */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">
                  Legenda / Comentário da Foto:
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escreva algo sobre este momento marcante..."
                  className="w-full bg-theme-surface border border-theme-border rounded-xl p-3 text-sm text-white focus:border-emerald-500 outline-none resize-none h-20"
                />
              </div>

              <div className="flex gap-3 mt-2">
                <button
                  onClick={async () => {
                    const toastId = toast.loading("Salvando legenda...");
                    try {
                      const { data } = await api.post(`/worldcup/album/${matchId}/slot`, {
                        slotIndex: selectedPreviewSlot.slotIndex,
                        imageUrl: selectedPreviewSlot.imageUrl,
                        metadata: { comment: commentText }
                      });
                      if (!folha) return;
                      const newSlots = folha.slots.map((s: any) => 
                        s.slotIndex === selectedPreviewSlot.slotIndex ? data.slot : s
                      );
                      setFolha({
                        id: folha.id,
                        completed: folha.completed,
                        slots: newSlots
                      });
                      toast.success("Legenda salva com sucesso!", { id: toastId });
                      setSelectedPreviewSlot(null);
                      setCommentText("");
                    } catch {
                      toast.error("Erro ao salvar legenda.", { id: toastId });
                    }
                  }}
                  className="flex-1 py-3 bg-emerald-500 text-black font-bold rounded-xl text-sm hover:bg-emerald-400 transition-colors uppercase tracking-wider"
                >
                  Salvar Legenda
                </button>
                <button
                  onClick={() => {
                    const idx = selectedPreviewSlot.slotIndex;
                    setSelectedPreviewSlot(null);
                    setCommentText("");
                    setActiveSlot(idx);
                    setTimeout(() => fileInputRef.current?.click(), 100);
                  }}
                  className="px-4 py-3 bg-theme-surface text-white font-bold rounded-xl text-sm border border-theme-border hover:bg-theme-surface/80 transition-colors uppercase tracking-wider"
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

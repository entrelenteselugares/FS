import { motion } from "framer-motion";
import { X, Share2, Download } from "lucide-react";

interface Props {
  slots: { slotIndex: number; imageUrl?: string }[];
  onClose: () => void;
}

export const ShareCollage = ({ slots, onClose }: Props) => {
  const handleShare = async () => {
    // In a real app, we would use html2canvas here to capture a DOM node,
    // convert it to a blob, and use navigator.share() if supported.
    // For MVP, we simulate success.
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Meu Álbum da Torcida',
          text: 'Completei a folha de hoje no Foto Segundo! #CopaDoMundo',
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      alert("Seu navegador não suporta a função de compartilhar nativa.");
    }
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-theme-surface rounded-full text-white">
        <X />
      </button>

      <div className="w-full max-w-sm aspect-[9/16] bg-theme-surface rounded-2xl overflow-hidden shadow-2xl border border-emerald-500 flex flex-col relative">
        <div className="bg-emerald-600 p-4 text-center">
          <h2 className="text-xl font-bold text-white uppercase tracking-wider">Álbum da Torcida</h2>
          <p className="text-emerald-100 text-xs">Brasil vs Sérvia</p>
        </div>
        
        <div className="flex-1 p-2 grid grid-cols-3 gap-1 bg-theme-bg">
          {Array.from({ length: 12 }).map((_, i) => {
            const slot = slots.find(s => s.slotIndex === i);
            return (
              <div key={i} className="bg-gray-800 rounded aspect-square overflow-hidden border border-gray-700">
                {slot?.imageUrl ? (
                  <img src={slot.imageUrl} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-gray-600 font-bold opacity-50">
                    {i + 1}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 text-center bg-theme-surface">
          <p className="text-xs text-gray-400 mb-2">Gerado no app Foto Segundo</p>
          <div className="text-yellow-400 font-bold flex items-center justify-center gap-2">
            <span>🏆</span> 12/12 Completado! <span>🏆</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button onClick={handleShare} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-colors">
          <Share2 size={20} /> Compartilhar
        </button>
        <button className="bg-theme-surface hover:bg-theme-surface/80 border border-theme-border text-white font-bold py-3 px-6 rounded-full flex items-center gap-2 transition-colors">
          <Download size={20} /> Salvar
        </button>
      </div>
    </motion.div>
  );
};

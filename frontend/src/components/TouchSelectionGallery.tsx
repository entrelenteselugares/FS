import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { getProxyUrl } from "../lib/utils/media";

interface Media {
  id: string;
  url: string;
  shortId: string;
  isGuest?: boolean;
}

interface TouchSelectionGalleryProps {
  medias: Media[];
  selectedIds: string[];
  unlockedIds: string[];
  isOwner: boolean;
  onToggleCart: (shortId: string, url: string) => void;
}

export const TouchSelectionGallery: React.FC<TouchSelectionGalleryProps> = ({
  medias,
  selectedIds,
  unlockedIds,
  isOwner,
  onToggleCart,
}) => {
  const [fullscreenIndex, setFullscreenIndex] = useState<number | null>(null);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (fullscreenIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setFullscreenIndex(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [fullscreenIndex]);

  const handleTouchStart = (shortId: string, url: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      onToggleCart(shortId, url);
      if ("vibrate" in navigator) navigator.vibrate(50);
    }, 600);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  };

  const handlePhotoClick = (index: number, m: Media) => {
    if (isSelectMode) {
      onToggleCart(m.shortId, m.url);
    } else {
      setFullscreenIndex(index);
    }
  };

  const nextPhoto = () => {
    if (fullscreenIndex !== null && fullscreenIndex < medias.length - 1) {
      setFullscreenIndex(fullscreenIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (fullscreenIndex !== null && fullscreenIndex > 0) {
      setFullscreenIndex(fullscreenIndex - 1);
    }
  };

  return (
    <div className="space-y-8">
      {/* Select Mode Indicator */}
      <AnimatePresence>
        {isSelectMode && (
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="flex items-center justify-between bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-xl"
          >
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest italic">Modo Seleção Ativo</span>
            </div>
            <button 
              onClick={() => setIsSelectMode(false)}
              className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest hover:text-white transition-colors"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
        {medias.map((m, idx) => {
          const isSelected = selectedIds.includes(m.shortId);
          const isUnlocked = unlockedIds.includes(m.shortId) || isOwner;

          return (
            <motion.div
              key={m.id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: (idx % 20) * 0.03 }}
              className={`relative aspect-[3/4] overflow-hidden border-2 transition-all duration-300 active:scale-95 touch-none ${
                isUnlocked ? "border-brand-tactical shadow-lg shadow-brand-tactical/10" : 
                isSelected ? "border-emerald-500 scale-95 shadow-xl shadow-emerald-500/20" : 
                "border-theme-border/40"
              }`}
              onTouchStart={() => !isUnlocked && handleTouchStart(m.shortId, m.url)}
              onTouchEnd={handleTouchEnd}
              onClick={() => handlePhotoClick(idx, m)}
            >
              <img
                src={getProxyUrl(m.url)}
                alt={m.shortId}
                className={`w-full h-full object-cover transition-all duration-700 ${
                  isSelected ? "opacity-40" : "opacity-100"
                } ${!isUnlocked && "blur-[0.5px]"}`}
                loading="lazy"
              />

              {/* Botão de Seleção Rápida (Shortcut Selection Button) */}
              {!isUnlocked && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleCart(m.shortId, m.url);
                  }}
                  className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 z-20 ${
                    isSelected
                      ? "bg-emerald-500 border-emerald-400 text-black shadow-lg shadow-emerald-500/30"
                      : "bg-black/40 border-white/30 text-white/70 hover:bg-white hover:text-black hover:border-white"
                  }`}
                >
                  <Check size={14} strokeWidth={isSelected ? 4 : 2} className={isSelected ? "opacity-100" : "opacity-100"} />
                </button>
              )}

              {/* Selection Badge */}
              {isSelected && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-black shadow-2xl">
                    <Check size={24} strokeWidth={4} />
                  </div>
                </div>
              )}

              {/* Status Info */}
              <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent">
                <span className="text-[10px] font-black text-white italic opacity-80">#{m.shortId}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Fullscreen Modal with Swipe */}
      {createPortal(
        <AnimatePresence>
          {fullscreenIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99999] bg-black/95 flex flex-col"
            >
            {/* Header */}
            <div className="p-6 flex items-center justify-between relative z-10">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">Visualização Tactical</span>
                <span className="text-xl font-black text-white italic tracking-tighter">#{medias[fullscreenIndex]?.shortId}</span>
              </div>
              <button 
                onClick={() => setFullscreenIndex(null)}
                className="w-12 h-12 flex items-center justify-center bg-white/5 rounded-full text-white"
                aria-label="Fechar visualização"
              >
                <X size={24} />
              </button>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <motion.img
                key={medias[fullscreenIndex]?.id}
                src={getProxyUrl(medias[fullscreenIndex]?.url || '')}
                initial={{ x: 300, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -300, opacity: 0 }}
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x < -100) nextPhoto();
                  if (info.offset.x > 100) prevPhoto();
                  if (info.offset.y > 100) setFullscreenIndex(null); // Swipe down to close
                }}
                className="max-w-full max-h-full object-contain touch-none"
              />

              {/* Navigation Arrows (Desktop Only or Visual Guide) */}
              <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-8 pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  disabled={fullscreenIndex === 0}
                  className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white pointer-events-auto transition-all ${fullscreenIndex === 0 ? "opacity-20" : "hover:bg-brand-tactical hover:text-black"}`}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  disabled={fullscreenIndex === medias.length - 1}
                  className={`w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white pointer-events-auto transition-all ${fullscreenIndex === medias.length - 1 ? "opacity-20" : "hover:bg-brand-tactical hover:text-black"}`}
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-8 border-t border-white/10 bg-zinc-950/50 backdrop-blur-xl">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-widest italic">Memória Premium</p>
                  <p className="text-xs text-white font-medium">Fotos entregues em alta resolução 300DPI.</p>
                </div>
                <button
                  onClick={() => {
                    const m = medias[fullscreenIndex];
                    if (m) onToggleCart(m.shortId, m.url);
                  }}
                  className={`px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] italic transition-all ${
                    medias[fullscreenIndex] && selectedIds.includes(medias[fullscreenIndex].shortId)
                      ? "bg-emerald-500 text-black"
                      : "bg-white text-black hover:bg-brand-tactical"
                  }`}
                >
                  {medias[fullscreenIndex] && selectedIds.includes(medias[fullscreenIndex].shortId) ? "Selecionada" : "Selecionar"}
                </button>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};

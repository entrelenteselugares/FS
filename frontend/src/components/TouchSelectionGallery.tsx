import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { getProxyUrl } from "../lib/utils/media";
import { OptimizedImage } from "./OptimizedImage";

interface Media {
  id: string;
  url: string;
  shortId: string;
  isGuest?: boolean;
  type?: string;
  metadata?: { rawUrl?: string; printUrl?: string; [key: string]: unknown };
}

interface TouchSelectionGalleryProps {
  medias: Media[];
  selectedIds: string[];
  unlockedIds: string[];
  onToggleCart: (shortId: string, url: string) => void;
  isOwner?: boolean;
  onDeleteMedia?: (mediaId: string) => void;
  allowFreeDownload?: boolean;
}

interface GalleryItemProps {
  m: Media;
  idx: number;
  isSelected: boolean;
  isUnlocked: boolean;
  isOwner?: boolean;
  allowFreeDownload?: boolean;
  onToggleCart: (shortId: string, url: string) => void;
  onDeleteMedia?: (mediaId: string) => void;
  handleTouchStart: (shortId: string, url: string) => void;
  handleTouchEnd: () => void;
  handlePhotoClick: (index: number, m: Media) => void;
}

const GalleryItem = React.memo(({ 
  m, idx, isSelected, isUnlocked, isOwner, allowFreeDownload, 
  onToggleCart, onDeleteMedia, handleTouchStart, handleTouchEnd, handlePhotoClick 
}: GalleryItemProps) => {
  const displayUrl = m.url;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: (idx % 20) * 0.03 }}
      className={`relative aspect-[3/4] overflow-hidden border-2 transition-all duration-300 active:scale-95 select-none ${
        isUnlocked ? "border-brand-tactical shadow-lg shadow-brand-tactical/10" : 
        isSelected ? "border-emerald-500 scale-95 shadow-xl shadow-emerald-500/20" : 
        "border-theme-border"
      }`}
      onTouchStart={() => !isUnlocked && handleTouchStart(m.shortId, m.url)}
      onTouchEnd={handleTouchEnd}
      onTouchMove={handleTouchEnd}
      onClick={() => handlePhotoClick(idx, m)}
    >
      {m.shortId.startsWith('V') || m.type === 'VIDEO' ? (
        <video
          src={getProxyUrl(displayUrl)}
          className={`w-full h-full object-cover transition-all duration-700 ${
            isSelected ? "opacity-40" : "opacity-100"
          } ${!isUnlocked && "blur-[0.5px]"}`}
          preload="metadata"
          muted
          playsInline
          autoPlay
          loop
        />
      ) : (
        <OptimizedImage
          src={getProxyUrl(displayUrl)}
          alt={m.shortId}
          className={`w-full h-full transition-all duration-700 ${
            isSelected ? "opacity-40" : "opacity-100"
          } ${!isUnlocked && "blur-[0.5px]"}`}
          objectFit="cover"
        />
      )}

      {/* Watermark Overlay for locked images */}
      {!isUnlocked && (
        <div 
          className="absolute inset-0 pointer-events-none z-10 opacity-30" 
          style={{ 
            backgroundImage: "url('/logo.png')", 
            backgroundRepeat: "repeat", 
            backgroundSize: "100px auto",
            filter: "var(--logo-filter) drop-shadow(0px 2px 3px rgba(0,0,0,0.3))"
          }} 
        />
      )}

      {/* Botão de Seleção Rápida (Shortcut Selection Button) */}
      {!isUnlocked && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleCart(m.shortId, m.url);
          }}
          className={`absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center border backdrop-blur-md transition-all active:scale-90 z-20 ${
            isSelected
              ? "bg-emerald-500 border-emerald-400 text-theme-text shadow-lg shadow-emerald-500/30"
              : "bg-black/40 border-white/30 text-theme-text/70 hover:bg-white hover:text-theme-text hover:border-white"
          }`}
        >
          <Check size={14} strokeWidth={isSelected ? 4 : 2} className={isSelected ? "opacity-100" : "opacity-100"} />
        </button>
      )}

      {/* Botão de Excluir Foto (Apenas Owner) */}
      {isOwner && onDeleteMedia && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (window.confirm(`Tem certeza que deseja excluir a foto #${m.shortId}?`)) {
              onDeleteMedia(m.id);
            }
          }}
          className="absolute top-3 left-3 w-7 h-7 rounded-full flex items-center justify-center border border-red-500/50 bg-black/60 text-red-400 hover:bg-red-500 hover:text-theme-text hover:border-red-500 backdrop-blur-md transition-all active:scale-90 z-20"
          title="Excluir foto"
        >
          <Trash2 size={12} />
        </button>
      )}

      {/* Selection Badge */}
      {isSelected && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-theme-text shadow-2xl">
            <Check size={24} strokeWidth={4} />
          </div>
        </div>
      )}

      {/* Status Info */}
      <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent flex items-center justify-between">
        <span className="text-[10px] font-bold text-theme-text opacity-80">#{m.shortId}</span>
        {allowFreeDownload && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const dlUrl = m.url;
              const a = document.createElement('a');
              a.href = getProxyUrl(dlUrl);
              a.download = `foto-${m.shortId}.jpg`;
              a.click();
            }}
            className="w-7 h-7 bg-brand-tactical/90 rounded-full flex items-center justify-center text-theme-text hover:bg-brand-tactical transition-all z-20"
            title="Baixar Foto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
          </button>
        )}
      </div>
    </motion.div>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.isSelected === nextProps.isSelected &&
    prevProps.isUnlocked === nextProps.isUnlocked &&
    prevProps.isOwner === nextProps.isOwner &&
    prevProps.allowFreeDownload === nextProps.allowFreeDownload &&
    prevProps.m.id === nextProps.m.id &&
    prevProps.idx === nextProps.idx
  );
});
GalleryItem.displayName = "GalleryItem";

export const TouchSelectionGallery: React.FC<TouchSelectionGalleryProps> = ({
  medias,
  selectedIds,
  unlockedIds,
  onToggleCart,
  isOwner,
  onDeleteMedia,
  allowFreeDownload,
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

  const latestProps = useRef({ isSelectMode, onToggleCart });
  useEffect(() => {
    latestProps.current = { isSelectMode, onToggleCart };
  }, [isSelectMode, onToggleCart]);

  const handleTouchStart = useCallback((shortId: string, url: string) => {
    longPressTimer.current = setTimeout(() => {
      setIsSelectMode(true);
      latestProps.current.onToggleCart(shortId, url);
      if ("vibrate" in navigator) navigator.vibrate(50);
    }, 600);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
  }, []);

  const handlePhotoClick = useCallback((index: number, m: Media) => {
    if (latestProps.current.isSelectMode) {
      if ("vibrate" in navigator) navigator.vibrate(20);
      latestProps.current.onToggleCart(m.shortId, m.url);
    } else {
      setFullscreenIndex(index);
    }
  }, []);

  const nextPhoto = useCallback(() => {
    setFullscreenIndex((prev) => (prev !== null && prev < medias.length - 1 ? prev + 1 : prev));
  }, [medias.length]);

  const prevPhoto = useCallback(() => {
    setFullscreenIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev));
  }, []);

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
              <span className="text-[10px] font-bold text-theme-brand uppercase tracking-widest">Modo Seleção Ativo</span>
            </div>
            <button 
              onClick={() => setIsSelectMode(false)}
              className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest hover:text-theme-text transition-colors"
            >
              Cancelar
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 md:gap-6">
        {medias.map((m, idx) => {
          const isSelected = selectedIds.includes(m.shortId);
          const isUnlocked = allowFreeDownload || unlockedIds.includes(m.shortId) || unlockedIds.includes(m.id);
          
          return (
            <GalleryItem 
              key={m.id}
              m={m}
              idx={idx}
              isSelected={isSelected}
              isUnlocked={isUnlocked}
              isOwner={isOwner}
              allowFreeDownload={allowFreeDownload}
              onToggleCart={onToggleCart}
              onDeleteMedia={onDeleteMedia}
              handleTouchStart={handleTouchStart}
              handleTouchEnd={handleTouchEnd}
              handlePhotoClick={handlePhotoClick}
            />
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
                <span className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest">Visualização Tactical</span>
                <span className="text-xl font-bold text-theme-text">#{medias[fullscreenIndex]?.shortId}</span>
              </div>
              <div className="flex items-center gap-4">
                {allowFreeDownload && (
                  <button 
                    onClick={() => {
                      const m = medias[fullscreenIndex];
                      if (m) {
                        const dlUrl = m.url;
                        const a = document.createElement('a');
                        a.href = getProxyUrl(dlUrl);
                        a.download = `foto-${m.shortId}.jpg`;
                        a.click();
                      }
                    }}
                    className="w-12 h-12 flex items-center justify-center bg-brand-tactical rounded-full text-theme-text hover:brightness-110"
                    title="Baixar Foto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </button>
                )}
                <button 
                  onClick={() => setFullscreenIndex(null)}
                  className="w-12 h-12 flex items-center justify-center bg-theme-bg-muted rounded-full text-theme-text"
                  aria-label="Fechar visualização"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Image Viewer */}
            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              {(() => {
                const fm = medias[fullscreenIndex];
                const fmIsUnlocked = allowFreeDownload || (fm && (unlockedIds.includes(fm.shortId) || unlockedIds.includes(fm.id)));
                const fmDisplayUrl = fm?.url || '';
                return (
                  <div className="relative inline-flex max-w-full max-h-full">
                  {fm?.shortId.startsWith('V') || fm?.type === 'VIDEO' ? (
                    <motion.video
                      key={fm?.id}
                      src={getProxyUrl(fmDisplayUrl)}
                      initial={{ x: 300, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      exit={{ x: -300, opacity: 0 }}
                      drag
                      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                      onDragEnd={(_, info) => {
                        if (info.offset.x < -100) nextPhoto();
                        if (info.offset.x > 100) prevPhoto();
                        if (info.offset.y > 100) setFullscreenIndex(null);
                      }}
                      className="max-w-full max-h-full object-contain touch-none"
                      controls
                      autoPlay
                      playsInline
                    />
                  ) : (
                    <motion.img
                      key={fm?.id}
                      src={getProxyUrl(fmDisplayUrl)}
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
                  )}
                  {!fmIsUnlocked && (
                    <div 
                      className="absolute inset-0 pointer-events-none z-10 opacity-30" 
                      style={{ 
                        backgroundImage: "url('/logo.png')", 
                        backgroundRepeat: "repeat",
                        backgroundSize: "150px auto",
                        filter: "var(--logo-filter) drop-shadow(0px 4px 6px rgba(0,0,0,0.4))"
                      }} 
                    />
                  )}
                  </div>
                );
              })()}

              {/* Navigation Arrows (Desktop Only or Visual Guide) */}
              <div className="hidden md:flex absolute inset-x-0 top-1/2 -translate-y-1/2 justify-between px-8 pointer-events-none">
                <button 
                  onClick={(e) => { e.stopPropagation(); prevPhoto(); }}
                  disabled={fullscreenIndex === 0}
                  className={`w-14 h-14 rounded-full bg-theme-bg-muted border border-white/10 flex items-center justify-center text-theme-text pointer-events-auto transition-all ${fullscreenIndex === 0 ? "opacity-20" : "hover:bg-brand-tactical hover:text-theme-text"}`}
                >
                  <ChevronLeft size={32} />
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); nextPhoto(); }}
                  disabled={fullscreenIndex === medias.length - 1}
                  className={`w-14 h-14 rounded-full bg-theme-bg-muted border border-white/10 flex items-center justify-center text-theme-text pointer-events-auto transition-all ${fullscreenIndex === medias.length - 1 ? "opacity-20" : "hover:bg-brand-tactical hover:text-theme-text"}`}
                >
                  <ChevronRight size={32} />
                </button>
              </div>
            </div>

            {/* Footer Action */}
            <div className="p-8 border-t border-white/10 bg-zinc-950/50 backdrop-blur-xl">
              <div className="flex items-center justify-between max-w-lg mx-auto">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-theme-text uppercase tracking-widest">Memória Premium</p>
                  <p className="text-xs text-theme-text font-medium">Fotos entregues em alta resolução 300DPI.</p>
                </div>
                {allowFreeDownload ? (
                  <button
                    onClick={() => {
                      const m = medias[fullscreenIndex];
                      if (m) {
                        const dlUrl = m.url;
                        const a = document.createElement('a');
                        a.href = getProxyUrl(dlUrl);
                        a.download = `foto-${m.shortId}.jpg`;
                        a.click();
                      }
                    }}
                    className="fs-btn fs-btn-primary flex items-center gap-2 text-[10px] tracking-widest uppercase font-bold"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    BAIXAR FOTO
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      const m = medias[fullscreenIndex];
                      if (m) onToggleCart(m.shortId, m.url);
                    }}
                    className={`fs-btn text-[10px] tracking-widest uppercase font-black italic transition-all ${
                      medias[fullscreenIndex] && selectedIds.includes(medias[fullscreenIndex].shortId)
                        ? "bg-emerald-500 text-theme-text"
                        : "fs-btn-primary"
                    }`}
                  >
                    {medias[fullscreenIndex] && selectedIds.includes(medias[fullscreenIndex].shortId) ? "Selecionada" : "Selecionar"}
                  </button>
                )}
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

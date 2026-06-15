import { useRef, useState, useEffect, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface PortfolioPhoto {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
}

interface PortfolioCarouselProps {
  photos: PortfolioPhoto[];
  photographerName?: string;
  photographerProfileUrl?: string;
}

export function PortfolioCarousel({ photos, photographerName, photographerProfileUrl }: PortfolioCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});

  const checkScroll = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 8);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    el.addEventListener('scroll', checkScroll, { passive: true });
    checkScroll();
    return () => el.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  const prevPhoto = useCallback(() => setLightboxIdx(i => (i !== null ? Math.max(0, i - 1) : 0)), []);
  const nextPhoto = useCallback(() => setLightboxIdx(i => (i !== null ? Math.min((photos?.length ?? 1) - 1, i + 1) : 0)), [photos]);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'Escape') setLightboxIdx(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxIdx, prevPhoto, nextPhoto]);

  // Guard após hooks — seguro para React
  if (!photos || photos.length === 0) return null;

  const scroll = (dir: 'left' | 'right') => {
    const el = trackRef.current;
    if (!el) return;
    el.scrollBy({ left: dir === 'left' ? -320 : 320, behavior: 'smooth' });
  };

  const openLightbox = (idx: number) => setLightboxIdx(idx);
  const closeLightbox = () => setLightboxIdx(null);

  return (
    <>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-[0.4em]">
            Portfólio{photographerName ? ` · ${photographerName}` : ''}
          </p>
          <div className="flex items-center gap-2">
            {photographerProfileUrl && (
              <a
                href={photographerProfileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest text-brand-tactical hover:brightness-110 transition-all"
              >
                Ver perfil <ExternalLink size={9} />
              </a>
            )}
            <div className="flex gap-1">
              <button
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="w-7 h-7 flex items-center justify-center border border-theme-border text-theme-muted hover:border-brand-tactical hover:text-brand-tactical transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded-lg"
                aria-label="Anterior"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="w-7 h-7 flex items-center justify-center border border-theme-border text-theme-muted hover:border-brand-tactical hover:text-brand-tactical transition-all disabled:opacity-20 disabled:cursor-not-allowed rounded-lg"
                aria-label="Próximo"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Track */}
        <div
          ref={trackRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide scroll-smooth pb-1"
          style={{ scrollSnapType: 'x mandatory' }}
        >
          {photos.map((photo, idx) => {
            const thumb = photo.thumbnailUrl || photo.url;
            const isLoaded = loaded[photo.id];
            return (
              <button
                key={photo.id}
                onClick={() => openLightbox(idx)}
                className="flex-shrink-0 w-40 h-40 md:w-48 md:h-48 rounded-xl overflow-hidden relative bg-theme-bg-muted border border-theme-border group hover:border-brand-tactical transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-brand-tactical"
                style={{ scrollSnapAlign: 'start' }}
                aria-label={`Foto do portfólio ${idx + 1}`}
              >
                {/* Skeleton shimmer */}
                {!isLoaded && (
                  <div className="absolute inset-0 bg-gradient-to-r from-theme-bg-muted via-white/5 to-theme-bg-muted animate-pulse" />
                )}
                <img
                  src={thumb}
                  alt={`Portfólio ${idx + 1}`}
                  className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:scale-105 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
                  onLoad={() => setLoaded(p => ({ ...p, [photo.id]: true }))}
                  onError={() => setLoaded(p => ({ ...p, [photo.id]: true }))}
                />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-300 flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center">
                    <ExternalLink size={14} className="text-white" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[700] bg-black/95 backdrop-blur-xl flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Nav buttons */}
          <button
            onClick={e => { e.stopPropagation(); prevPhoto(); }}
            disabled={lightboxIdx === 0}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-20 z-10"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={e => { e.stopPropagation(); nextPhoto(); }}
            disabled={lightboxIdx === photos.length - 1}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-white hover:bg-white/20 transition-all disabled:opacity-20 z-10"
          >
            <ChevronRight size={20} />
          </button>

          {/* Counter */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 text-[10px] font-bold text-white/50 uppercase tracking-widest">
            {lightboxIdx + 1} / {photos.length}
          </div>

          {/* Image */}
          <div className="max-w-4xl max-h-[85vh] w-full px-20" onClick={e => e.stopPropagation()}>
            <img
              src={photos[lightboxIdx].url}
              alt={`Portfólio ${lightboxIdx + 1}`}
              className="w-full h-full object-contain max-h-[85vh] rounded-xl shadow-2xl"
            />
          </div>

          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={e => { e.stopPropagation(); setLightboxIdx(i); }}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === lightboxIdx ? 'bg-brand-tactical w-4' : 'bg-white/30 hover:bg-white/60'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

import { useState, useEffect, useRef } from "react";
import { API } from "../lib/api";

export interface PhotoItem {
  id: string;
  url: string | null;
  title: string;
}

export const FALLBACK_PHOTOS = Array.from({ length: 18 }, (_, i) => ({
  id: `fallback-${i}`,
  url: null,
  title: "",
}));

// Animated photo column with infinite scroll
export function PhotoColumn({ photos, speed, offset = 0 }: { photos: PhotoItem[]; speed: number; offset?: number }) {
  const colRef = useRef<HTMLDivElement>(null);
  const posRef = useRef(offset);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const col = colRef.current;
    if (!col) return;

    const animate = () => {
      posRef.current -= speed;
      const half = col.scrollHeight / 2;
      if (Math.abs(posRef.current) >= half) {
        posRef.current = 0;
      }
      col.style.transform = `translateY(${posRef.current}px)`;
      rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [speed, photos]);

  // Duplicate photos for seamless loop
  const doubled = [...photos, ...photos];

  return (
    <div className="flex-1 overflow-hidden relative h-full">
      <div ref={colRef} className="flex flex-col gap-2">
        {doubled.map((photo, idx) => (
          <div
            key={`${photo.id}-${idx}`}
            className="relative rounded-2xl overflow-hidden flex-shrink-0 group"
            style={{ height: idx % 3 === 0 ? "260px" : idx % 3 === 1 ? "200px" : "180px" }}
          >
            {photo.url ? (
              <img
                src={photo.url}
                alt={photo.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800/60 animate-pulse" />
            )}
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Hook para buscar as fotos
export function useEventPhotos() {
  const [photos, setPhotos] = useState<PhotoItem[]>(FALLBACK_PHOTOS);

  useEffect(() => {
    API.get("/public/events", { params: { limit: 30, page: 1 } })
      .then(({ data }) => {
        const events = Array.isArray(data) ? data : (data.events ?? data.data ?? []);
        const withCovers = events
          .filter((e: { coverPhotoUrl?: string | null }) => e.coverPhotoUrl)
          .map((e: { id: string; coverPhotoUrl: string; title?: string }) => ({ id: e.id, url: e.coverPhotoUrl, title: e.title ?? "" }));

        if (withCovers.length > 0) {
          let repeated = [...withCovers];
          while (repeated.length < 18) {
            repeated = [...repeated, ...withCovers];
          }
          setPhotos(repeated.slice(0, 18));
        } else {
          const fallbacks = [
            "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1530103862676-de8892bc952f?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1540039155732-d6749b9325f0?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&q=80&w=800",
            "https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&q=80&w=800"
          ];
          let repeatedFallbacks = fallbacks.map((url, i) => ({ id: `fb-${i}`, url, title: "Foto Segundo" }));
          while (repeatedFallbacks.length < 18) {
            repeatedFallbacks = [...repeatedFallbacks, ...repeatedFallbacks];
          }
          setPhotos(repeatedFallbacks.slice(0, 18));
        }
      })
      .catch(() => {/* silently keep fallback */});
  }, []);

  return photos;
}

export function PhotoMosaic({ opacity = 1 }: { opacity?: number }) {
  const photos = useEventPhotos();
  const col1 = photos.filter((_, i) => i % 3 === 0);
  const col2 = photos.filter((_, i) => i % 3 === 1);
  const col3 = photos.filter((_, i) => i % 3 === 2);

  return (
    <div className="flex gap-2 p-2 w-full h-full overflow-hidden absolute inset-0 pointer-events-none" style={{ opacity }}>
      <PhotoColumn photos={col1.length >= 2 ? col1 : FALLBACK_PHOTOS.slice(0, 6)} speed={0.4} offset={-80} />
      <PhotoColumn photos={col2.length >= 2 ? col2 : FALLBACK_PHOTOS.slice(6, 12)} speed={0.28} offset={-200} />
      <PhotoColumn photos={col3.length >= 2 ? col3 : FALLBACK_PHOTOS.slice(12, 18)} speed={0.5} offset={-40} />
    </div>
  );
}

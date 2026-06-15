import { useState, useEffect, useRef } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  blurHash?: string; // Optional low-res base64 or blurhash if we ever implement it
  objectFit?: 'cover' | 'contain' | 'fill';
  priority?: boolean;
}

/**
 * OptimizedImage
 * - Uses IntersectionObserver to trigger loading when near the viewport.
 * - `decoding="async"` to prevent main thread blockage.
 * - Skeleton state while loading.
 */
export function OptimizedImage({ 
  src, 
  alt, 
  className = '', 
  blurHash,
  objectFit = 'cover',
  priority = false,
  ...props 
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [isVisible, setIsVisible] = useState(priority);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Reseta estado se o src mudar
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
    if (priority) setIsVisible(true);
  }, [src, priority]);

  // IntersectionObserver para lazy loading
  useEffect(() => {
    if (priority || isVisible) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [priority, isVisible]);

  return (
    <div ref={containerRef} className={`relative overflow-hidden ${className}`}>
      {/* Placeholder / Skeleton: Fica visível enquanto carrega ou se der erro */}
      {(!isLoaded || error) && (
        <div 
          className="absolute inset-0 w-full h-full bg-zinc-900/50 animate-pulse flex items-center justify-center"
          aria-hidden="true"
        >
          {blurHash && !error && (
            <img 
              src={blurHash} 
              alt="placeholder" 
              className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-50"
            />
          )}
        </div>
      )}

      {/* Imagem Real */}
      {isVisible && !error && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setError(true);
            setIsLoaded(true);
            if (props.onError) props.onError(e);
          }}
          className={`w-full h-full transition-opacity duration-500 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          {...props}
          style={{ objectFit, ...props.style }}
        />
      )}
    </div>
  );
}

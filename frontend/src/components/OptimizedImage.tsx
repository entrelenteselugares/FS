import { useState, useEffect } from 'react';

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
 * - Usos nativos `loading="lazy"` para evitar downloads invisíveis na tela.
 * - `decoding="async"` para não travar a thread principal (evita congelamentos de scroll).
 * - Componente com estado de esqueleto (blur) até a imagem terminar de carregar.
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

  // Reseta estado se o src mudar
  useEffect(() => {
    setIsLoaded(false);
    setError(false);
  }, [src]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
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
      {!error && (
        <img
          src={src}
          alt={alt}
          loading={priority ? undefined : "lazy"}
          decoding="async"
          onLoad={() => setIsLoaded(true)}
          onError={(e) => {
            setError(true);
            setIsLoaded(true);
            if (props.onError) props.onError(e);
          }}
          className={`w-full h-full transition-opacity duration-500 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ objectFit }}
          {...props}
        />
      )}
    </div>
  );
}

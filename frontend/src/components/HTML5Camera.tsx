import { useEffect, useRef, useState } from 'react';
import { X, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';

interface HTML5CameraProps {
  onCapture: (file: File) => void;
  onClose: () => void;
}

export default function HTML5Camera({ onCapture, onClose }: HTML5CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isReady, setIsReady] = useState(false);

  const startCamera = async (mode: 'environment' | 'user') => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: mode,
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        // Mute video to prevent feedback and allow autoplay without restrictions
        videoRef.current.muted = true;
        // playsInline is required for iOS Safari
        videoRef.current.setAttribute('playsinline', 'true');
        
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().then(() => {
            setIsReady(true);
          }).catch(err => {
            console.error("Auto-play prevented", err);
            toast.error("Erro ao reproduzir a câmera. Verifique permissões.");
          });
        };
      }
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Não foi possível acessar a câmera do dispositivo.");
      onClose();
    }
  };

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCamera = () => {
    setIsReady(false);
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
  };

  const handleCapture = () => {
    if (!videoRef.current || !canvasRef.current || !isReady) return;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    
    // Set canvas dimensions to match actual video resolution
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Draw current frame
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          toast.error("Erro ao capturar a foto.");
          return;
        }
        
        // Visual feedback flash
        const flash = document.createElement('div');
        flash.className = 'absolute inset-0 bg-white z-50 transition-opacity duration-300';
        document.body.appendChild(flash);
        setTimeout(() => {
          flash.style.opacity = '0';
          setTimeout(() => document.body.removeChild(flash), 300);
        }, 50);

        const file = new File([blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' });
        onCapture(file);
        // Do NOT close camera. Stay open for more photos!
      },
      'image/jpeg',
      0.9
    );
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black flex flex-col items-center justify-between touch-none overflow-hidden">
      {/* Header controls */}
      <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center z-20 bg-gradient-to-b from-black/70 to-transparent pt-safe">
        <button onClick={onClose} className="p-3 bg-black/40 rounded-full text-white active:scale-95">
          <X size={24} />
        </button>
        <button onClick={toggleCamera} className="p-3 bg-black/40 rounded-full text-white active:scale-95">
          <RefreshCcw size={24} />
        </button>
      </div>

      {/* Video feed */}
      <div className="flex-1 w-full relative flex items-center justify-center bg-black">
        <video 
          ref={videoRef}
          autoPlay 
          playsInline 
          muted
          className={`w-full h-full object-cover transition-opacity duration-300 ${isReady ? 'opacity-100' : 'opacity-0'}`}
        />
        <canvas ref={canvasRef} className="hidden" />
        
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white text-sm font-bold uppercase tracking-widest animate-pulse">Iniciando Lente...</span>
          </div>
        )}
      </div>

      {/* Footer controls */}
      <div className="absolute bottom-0 left-0 right-0 p-8 pb-safe flex flex-col items-center z-20 bg-gradient-to-t from-black/80 to-transparent">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/80 mb-4">
          Toque para Capturar
        </span>
        <button 
          onClick={handleCapture}
          disabled={!isReady}
          className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-transform bg-white/20 disabled:opacity-50"
        >
          <div className="w-16 h-16 bg-white rounded-full"></div>
        </button>
      </div>
    </div>
  );
}

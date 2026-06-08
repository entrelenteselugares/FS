import { useEffect, useRef, useState, useCallback } from 'react';
import { X, RefreshCw, Image as ImageIcon, ZapOff, Aperture } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type CaptureMode = 'photo' | 'video';
type FacingMode = 'environment' | 'user';

interface CapturedMedia {
  url: string;
  blob: Blob;
  type: 'image' | 'video';
}

interface InAppCameraProps {
  onCapture: (files: File[]) => void;
  onClose: () => void;
  onGalleryOpen: () => void;
  maxFiles?: number;
  currentCount?: number;
}

// ─── Circular Progress Ring (for video timer) ─────────────────────────────────
function ProgressRing({ progress }: { progress: number }) {
  const r = 34;
  const circ = 2 * Math.PI * r;
  const offset = circ - (progress / 100) * circ;
  return (
    <svg width="84" height="84" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
      <circle cx="42" cy="42" r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
      <circle
        cx="42" cy="42" r={r}
        fill="none"
        stroke="#ef4444"
        strokeWidth="4"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.1s linear' }}
      />
    </svg>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function InAppCamera({ onCapture, onClose, onGalleryOpen, maxFiles = 12, currentCount = 0 }: InAppCameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const holdTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<CaptureMode>('photo');
  const [facing, setFacing] = useState<FacingMode>('environment');
  const [isRecording, setIsRecording] = useState(false);
  const [recordProgress, setRecordProgress] = useState(0); // 0-100
  const [captured, setCaptured] = useState<CapturedMedia | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);

  // ── Start camera stream ──────────────────────────────────────────────────
  const startStream = useCallback(async (facingMode: FacingMode, deviceId?: string) => {
    setCameraReady(false);
    setError(null);

    // Stop previous stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { facingMode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraReady(true);

      // Fetch available cameras after permission is granted
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter(d => d.kind === 'videoinput');
      setVideoDevices(videoInputs);
    } catch {
      setError('Não foi possível acessar a câmera. Verifique as permissões do navegador.');
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => startStream(facing), 0);
    return () => {
      clearTimeout(timer);
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const flipCamera = async () => {
    setIsFlipping(true);
    const next: FacingMode = facing === 'environment' ? 'user' : 'environment';
    setFacing(next);
    setActiveDeviceId(null); // Clear specific lens selection when flipping
    await startStream(next);
    setTimeout(() => setIsFlipping(false), 300);
  };

  const backDevices = videoDevices.filter(d => !d.label.toLowerCase().includes('front') && !d.label.toLowerCase().includes('user'));

  const switchLens = async () => {
    if (backDevices.length <= 1) return;
    setIsFlipping(true);
    const currentIdx = activeDeviceId ? backDevices.findIndex(d => d.deviceId === activeDeviceId) : 0;
    const nextIdx = (currentIdx + 1) % backDevices.length;
    const nextDevice = backDevices[nextIdx];
    
    if (nextDevice) {
      setActiveDeviceId(nextDevice.deviceId);
      await startStream('environment', nextDevice.deviceId);
    }
    setTimeout(() => setIsFlipping(false), 300);
  };

  // ── Photo capture ────────────────────────────────────────────────────────
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || !cameraReady) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror for front camera
    if (facing === 'user') {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    canvas.toBlob(blob => {
      if (!blob) return;
      setCaptured({ url: URL.createObjectURL(blob), blob, type: 'image' });
    }, 'image/jpeg', 0.88);
  };

  // ── Video recording (hold to record) ────────────────────────────────────
  const startRecording = () => {
    if (!streamRef.current || !cameraReady) return;
    recordedChunksRef.current = [];
    const mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4'
      : MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9'
      : 'video/webm';

    const recorder = new MediaRecorder(streamRef.current, { mimeType });
    mediaRecorderRef.current = recorder;
    recorder.ondataavailable = e => {
      if (e.data.size > 0) recordedChunksRef.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(recordedChunksRef.current, { type: mimeType });
      setCaptured({ url: URL.createObjectURL(blob), blob, type: 'video' });
      setIsRecording(false);
      setRecordProgress(0);
    };
    recorder.start(100);
    setIsRecording(true);

    // Progress tick (15s max)
    let elapsed = 0;
    holdTimerRef.current = setInterval(() => {
      elapsed += 100;
      setRecordProgress(Math.min((elapsed / 15000) * 100, 100));
    }, 100);

    // Auto-stop at 15s
    autoStopTimerRef.current = setTimeout(stopRecording, 15000);
  };

  const stopRecording = () => {
    if (holdTimerRef.current) { clearInterval(holdTimerRef.current); holdTimerRef.current = null; }
    if (autoStopTimerRef.current) { clearTimeout(autoStopTimerRef.current); autoStopTimerRef.current = null; }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };

  // ── Shutter handlers ─────────────────────────────────────────────────────
  const handleShutterDown = () => {
    if (mode === 'photo') capturePhoto();
    else startRecording();
  };

  const handleShutterUp = () => {
    if (mode === 'video' && isRecording) stopRecording();
  };

  // ── Confirm / Redo ───────────────────────────────────────────────────────
  const confirmCapture = () => {
    if (!captured) return;
    const ext = captured.type === 'image' ? 'jpg' : 'mp4';
    const file = new File([captured.blob], `capture_${Date.now()}.${ext}`, { type: captured.blob.type });
    onCapture([file]);
    URL.revokeObjectURL(captured.url);
    setCaptured(null);
  };

  const redoCapture = () => {
    if (captured) URL.revokeObjectURL(captured.url);
    setCaptured(null);
  };

  const remaining = maxFiles - currentCount;

  // ── Error fallback ───────────────────────────────────────────────────────
  if (error) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 999, background: '#000',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        gap: 20, padding: 32, textAlign: 'center'
      }}>
        <ZapOff size={48} color="#6b7280" />
        <p style={{ color: 'white', fontSize: 16, fontWeight: 700, maxWidth: 300 }}>{error}</p>
        <p style={{ color: '#6b7280', fontSize: 12 }}>Abra as configurações do navegador e permita o acesso à câmera.</p>
        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
          <button
            onClick={() => startStream(facing)}
            style={{ background: '#10b981', color: 'black', border: 'none', padding: '12px 20px', fontWeight: 900, fontSize: 12, borderRadius: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Tentar Novamente
          </button>
          <button
            onClick={onGalleryOpen}
            style={{ background: 'rgba(255,255,255,0.1)', color: 'white', border: '1px solid rgba(255,255,255,0.2)', padding: '12px 20px', fontWeight: 900, fontSize: 12, borderRadius: 12, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Abrir Galeria
          </button>
        </div>
        <button onClick={onClose} style={{ position: 'absolute', top: 20, right: 20, background: 'none', border: 'none', cursor: 'pointer', color: 'white' }}>
          <X size={24} />
        </button>
      </div>
    );
  }

  // ── Post-capture preview ─────────────────────────────────────────────────
    if (captured) {
      return (
        <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#000' }}>
          {captured.type === 'image' ? (
          <img src={captured.url} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        ) : (
          <video src={captured.url} autoPlay loop muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        )}

        {/* Confirm / Redo */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: '24px 32px 40px',
          background: 'linear-gradient(0deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
          display: 'flex', gap: 16
        }}>
          <button
            onClick={redoCapture}
            style={{
              flex: 1, padding: '16px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 16, color: 'white', fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.1em', cursor: 'pointer'
            }}
          >
            Refazer
          </button>
          <button
            onClick={confirmCapture}
            style={{
              flex: 2, padding: '16px', background: '#10b981', border: 'none',
              borderRadius: 16, color: 'black', fontSize: 13, fontWeight: 900, textTransform: 'uppercase',
              letterSpacing: '0.1em', cursor: 'pointer'
            }}
          >
            Confirmar ✓
          </button>
        </div>
      </div>
    );
  }

  // ── Live viewfinder ──────────────────────────────────────────────────────
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 999, background: '#000', overflow: 'hidden' }}>

      {/* Canvas (offscreen photo capture) */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Video feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        style={{
          width: '100%', height: '100%', objectFit: 'cover',
          transform: facing === 'user' ? 'scaleX(-1)' : 'none',
          transition: 'opacity 0.2s',
          opacity: isFlipping ? 0 : 1
        }}
      />

      {/* Top bar: Close + remaining count */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        padding: '16px 20px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, transparent 100%)'
      }}>
        <button
          onClick={onClose}
          style={{ background: 'rgba(0,0,0,0.4)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'white' }}
        >
          <X size={20} />
        </button>

        {currentCount > 0 && (
          <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 20, padding: '6px 14px', color: 'white', fontSize: 11, fontWeight: 900, letterSpacing: '0.1em' }}>
            {currentCount}/{maxFiles} FOTOS
          </div>
        )}

        {isRecording && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.9)', borderRadius: 20, padding: '6px 14px' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'white', animation: 'pulse 1s infinite' }} />
            <span style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>REC {Math.round(recordProgress / 100 * 15)}s</span>
          </div>
        )}
      </div>

      {/* Bottom floating controls */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        paddingBottom: 'env(safe-area-inset-bottom, 24px)',
        padding: '0 0 32px',
      }}>
        {/* FOTO / VÍDEO pill toggle */}
        <div style={{
          display: 'flex', justifyContent: 'center', marginBottom: 24
        }}>
          <div style={{
            display: 'flex', gap: 0,
            background: 'rgba(0,0,0,0.5)',
            borderRadius: 24, padding: '4px',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            {(['photo', 'video'] as CaptureMode[]).map(m => (
              <button
                key={m}
                onClick={() => !isRecording && setMode(m)}
                style={{
                  padding: '8px 20px', borderRadius: 20, border: 'none',
                  background: mode === m ? 'white' : 'transparent',
                  color: mode === m ? 'black' : 'rgba(255,255,255,0.6)',
                  fontSize: 11, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.12em',
                  cursor: isRecording ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {m === 'photo' ? 'Foto' : 'Vídeo'}
              </button>
            ))}
          </div>
        </div>

        {/* Main controls row: Gallery | Shutter | Flip */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-around', paddingInline: 32 }}>

          {/* Gallery */}
          <button
            onClick={() => remaining > 0 && onGalleryOpen()}
            disabled={remaining === 0}
            style={{
              width: 52, height: 52, borderRadius: 14,
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 2, cursor: remaining === 0 ? 'not-allowed' : 'pointer',
              opacity: remaining === 0 ? 0.4 : 1,
              backdropFilter: 'blur(8px)'
            }}
          >
            <ImageIcon size={20} color="white" />
            <span style={{ fontSize: 8, color: 'white', fontWeight: 900, opacity: 0.7 }}>GALERIA</span>
          </button>

          {/* Shutter */}
          <div style={{ position: 'relative', width: 84, height: 84 }}>
            {mode === 'video' && isRecording && <ProgressRing progress={recordProgress} />}
            <button
              onPointerDown={handleShutterDown}
              onPointerUp={handleShutterUp}
              onPointerLeave={handleShutterUp}
              disabled={!cameraReady || remaining === 0}
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 68, height: 68, borderRadius: '50%',
                background: mode === 'video'
                  ? (isRecording ? '#ef4444' : 'white')
                  : 'white',
                border: mode === 'video' ? '3px solid rgba(239,68,68,0.5)' : '3px solid rgba(255,255,255,0.4)',
                boxShadow: isRecording ? '0 0 0 6px rgba(239,68,68,0.3)' : '0 4px 20px rgba(0,0,0,0.4)',
                cursor: (!cameraReady || remaining === 0) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                userSelect: 'none',
                WebkitUserSelect: 'none',
                touchAction: 'none'
              }}
            >
              {mode === 'video' && isRecording && (
                <div style={{ width: 22, height: 22, borderRadius: 4, background: 'white' }} />
              )}
            </button>
          </div>

          {/* Right Controls: Lens & Flip */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {facing === 'environment' && backDevices.length > 1 && (
              <button
                onClick={switchLens}
                disabled={isRecording}
                style={{
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  gap: 2, cursor: isRecording ? 'not-allowed' : 'pointer',
                  opacity: isRecording ? 0.4 : 1,
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Aperture size={20} color="white" />
                <span style={{ fontSize: 8, color: 'white', fontWeight: 900, opacity: 0.7 }}>LENTE</span>
              </button>
            )}

            <button
              onClick={flipCamera}
              disabled={isRecording}
              style={{
                width: 52, height: 52, borderRadius: '50%',
                background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.2)',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: 2, cursor: isRecording ? 'not-allowed' : 'pointer',
                opacity: isRecording ? 0.4 : 1,
                backdropFilter: 'blur(8px)'
              }}
            >
              <RefreshCw size={20} color="white" />
              <span style={{ fontSize: 8, color: 'white', fontWeight: 900, opacity: 0.7 }}>GIRAR</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hidden gallery input */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={e => {
          const files = Array.from(e.target.files || []);
          if (files.length) onCapture(files);
        }}
        style={{ display: 'none' }}
      />
    </div>
  );
}

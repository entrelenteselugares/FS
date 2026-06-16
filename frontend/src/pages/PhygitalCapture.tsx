import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Loader2, Image as ImageIcon, Video, Camera, LogOut, User as UserIcon, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { useUploadQueue } from '../contexts/UploadQueueContext';

// ─── HELPERS ────────────────────────────────────────────────────────────────

/**
 * Verifica se o arquivo de vídeo está dentro do limite de 15 segundos.
 * Imagens sempre passam diretamente.
 */
const checkVideoDuration = (file: File): Promise<boolean> => {
  return new Promise((resolve) => {
    if (!file.type.startsWith('video/')) return resolve(true);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.onloadedmetadata = () => {
      window.URL.revokeObjectURL(video.src);
      resolve(video.duration <= 15.5);
    };
    video.onerror = () => resolve(false);
    video.src = URL.createObjectURL(file);
  });
};

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export default function PhygitalCapture() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const eventId = searchParams.get('eventId') || searchParams.get('e') || 'EVENT_TESTE';

  const { user } = useAuth();

  // ── Native File Inputs (3 separated for precise OS behavior)
  // photoInputRef  → sem `capture` → iOS/Android abre galeria + opção câmera  
  // videoInputRef  → com `capture="environment"` → abre câmera traseira direto (vídeo)
  // galleryInputRef → sem `capture`, `multiple` → galeria múltipla
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  // ── Upload Queue (Global)
  const { uploadItems, addToQueue, retryUpload } = useUploadQueue();

  // ── Identification
  const [isIdentified, setIsIdentified] = useState(false);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
  });

  // ── Long-press gesture state (toque = foto, segurar = vídeo)
  const touchStartRef = useRef<number>(0);
  const touchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  // ── Initialize from auth or localStorage
  useEffect(() => {
    if (user) {
      setFormData({
        customerName: user.nome || '',
        customerPhone: user.whatsapp || '',
        customerEmail: user.email || '',
      });
      setIsIdentified(true);
    } else {
      const savedGuest = localStorage.getItem('phygitalGuestData');
      if (savedGuest) {
        try {
          const parsed = JSON.parse(savedGuest);
          setFormData(parsed);
          setIsIdentified(true);
        } catch (e) {
          // ignore corrupt data
        }
      }
    }
  }, [user]);

  const handleIdentifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerEmail) {
      toast.error('Preencha nome e e-mail!');
      return;
    }
    localStorage.setItem('phygitalGuestData', JSON.stringify(formData));
    setIsIdentified(true);
    toast.success('Tudo pronto! Pode começar a fotografar.');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const changeIdentification = () => {
    if (!user) {
      setIsIdentified(false);
      localStorage.removeItem('phygitalGuestData');
    } else {
      // Apenas limpa identificação local, não faz logout da conta
      setIsIdentified(false);
    }
  };

  const processAndUploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      // Validate video durations
      const validations = await Promise.all(selectedFiles.map(checkVideoDuration));
      if (validations.includes(false)) {
        toast.error('Gravações de vídeo devem ter no máximo 15 segundos.');
        return;
      }

      await addToQueue(selectedFiles, {
        eventId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        userId: user?.id,
      });
    },
    [addToQueue, eventId, formData, user]
  );

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    processAndUploadFiles(Array.from(e.target.files || []));
    e.target.value = ''; // Reset so same file can be selected again
  };

  // ─── LONG-PRESS GESTURE ──────────────────────────────────────────────────
  // Toque curto (<450ms) → abre câmera para FOTO
  // Segurar (≥450ms)   → abre câmera para VÍDEO

  const handleStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    touchStartRef.current = Date.now();
    setIsLongPressing(false);
    if (touchTimeoutRef.current) clearTimeout(touchTimeoutRef.current);

    touchTimeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 450);
  };

  const handleEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }

    const duration = Date.now() - touchStartRef.current;
    if (duration >= 450 || isLongPressing) {
      // Longa pressão → vídeo com câmera traseira direta
      videoInputRef.current?.click();
    } else {
      // Toque rápido → foto (abre câmera nativa no iOS/Android)
      photoInputRef.current?.click();
    }
    setIsLongPressing(false);
  };

  const handleCancel = (e: React.TouchEvent | React.MouseEvent) => {
    if (e.cancelable) e.preventDefault();
    const duration = Date.now() - touchStartRef.current;
    if (duration >= 450 || isLongPressing) {
      videoInputRef.current?.click();
    }
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  };

  // ─── RENDER ──────────────────────────────────────────────────────────────

  return (
    <div
      data-theme="dark"
      className="min-h-screen flex flex-col items-center py-4 px-3 md:px-6 relative overflow-x-hidden bg-[var(--bg,#0a0a0a)]"
    >
      {/* ── Hidden Native File Inputs ─────────────────────────────────────── */}
      {/* 
        CRITICAL: `capture="environment"` tells the browser to open the rear
        camera directly instead of showing the file picker / OS menu.
        Without this attribute, iOS Safari and Android Chrome always show
        a "Camera or Files?" picker — which is NOT the behavior we want.
      */}
      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleNativeChange}
        className="hidden"
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        capture="environment"
        onChange={handleNativeChange}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        multiple
        onChange={handleNativeChange}
        className="hidden"
      />

      <div className="w-full max-w-md space-y-6">

        {/* ── Header Navigation ───────────────────────────────────────────── */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? navigate(-1) : window.close())}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity text-theme-text"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          {isIdentified && (
            <button
              onClick={changeIdentification}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
            >
              <UserIcon size={10} className="text-theme-brand" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-theme-subtle">
                {formData.customerName.split(' ')[0] || 'Convidado'}
              </span>
              <LogOut size={10} className="text-theme-muted hover:text-brand-danger ml-1" />
            </button>
          )}
        </div>

        {/* ── Branding ────────────────────────────────────────────────────── */}
        <div className="text-center pt-2">
          <div className="text-[18px] font-bold uppercase tracking-[0.8em] mb-1 text-theme-text">
            FOTO SEGUNDO
          </div>
          <div className="h-px w-10 bg-brand-tactical mx-auto mb-2" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 text-theme-text">
            Álbum do Evento
          </p>
        </div>

        {/* ── Dynamic Views ───────────────────────────────────────────────── */}
        {!isIdentified ? (
          /* STEP 1: Identification Form */
          <form
            onSubmit={handleIdentifySubmit}
            className="space-y-5 bg-white/[0.02] p-5 rounded-3xl border border-white/5 mt-8"
          >
            <div className="text-center mb-6">
              <Camera size={32} className="mx-auto text-theme-brand mb-3 opacity-80" />
              <h2 className="text-sm font-bold text-theme-text uppercase tracking-widest">
                Quem é você?
              </h2>
              <p className="text-[10px] text-theme-muted mt-1 uppercase tracking-wider">
                Assim a gente sabe qual foto é a sua.
              </p>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-theme-muted mb-1 block">
                Nome Completo
              </label>
              <input
                required
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 outline-none text-zinc-100 transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-theme-muted mb-1 block">
                E-mail
              </label>
              <input
                required
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 outline-none text-zinc-100 transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-theme-muted mb-1 block">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 outline-none text-zinc-100 transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>

            <div className="flex items-start gap-3 bg-black/20 p-3 rounded-lg border border-brand-warning/30">
              <input 
                type="checkbox" 
                required 
                id="consentCheckbox"
                className="mt-0.5 shrink-0 accent-brand-tactical w-4 h-4"
              />
              <label htmlFor="consentCheckbox" className="text-[9px] leading-relaxed text-zinc-300 font-medium">
                Autorizo o uso e veiculação desta foto na galeria do evento e concordo com a <a href="/privacidade" target="_blank" className="text-brand-tactical underline">Política de Privacidade</a>.
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-brand-tactical text-zinc-950 font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-brand-tactical"
            >
              <Camera size={16} />
              Tirar minha foto agora
            </button>
          </form>
        ) : (
          /* STEP 2: Main Camera / Upload Flow */
          <div className="space-y-8 mt-6">

            {/* ── Shutter Mechanism ─────────────────────────────────────── */}
            <div className="flex flex-col items-center justify-center space-y-5 bg-white/[0.01] p-6 rounded-[2rem] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-theme-brand/80">
                {isLongPressing ? 'Gravando vídeo...' : 'Toque para foto • Segure para vídeo'}
              </span>

              {/* Shutter button with long-press */}
              <div className="relative flex items-center justify-center">
                <button
                  type="button"
                  onTouchStart={handleStart}
                  onTouchEnd={handleEnd}
                  onTouchCancel={handleCancel}
                  onMouseDown={handleStart}
                  onMouseUp={handleEnd}
                  onMouseLeave={handleCancel}
                  onContextMenu={e => e.preventDefault()}
                  className="w-28 h-28 rounded-full border-4 border-brand-tactical/35 bg-zinc-900/40 flex items-center justify-center hover:border-brand-tactical/60 shadow-lg shadow-emerald-500/5 transition-all select-none active:scale-95 touch-none"
                  aria-label="Capturar foto (pressionar) ou vídeo (segurar)"
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isLongPressing
                        ? 'bg-brand-danger scale-110 shadow-lg shadow-red-500/20'
                        : 'bg-brand-tactical scale-100 hover:scale-[1.03] shadow-md shadow-emerald-500/25'
                    }`}
                  >
                    {isLongPressing ? (
                      <Video size={32} className="text-theme-text animate-pulse" strokeWidth={2.5} />
                    ) : (
                      <Camera size={32} className="text-zinc-950" strokeWidth={2.5} />
                    )}
                  </div>
                </button>
              </div>

              {/* Gallery button */}
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-3 py-3 border border-dashed border-white/10 hover:border-brand-tactical/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all active:scale-[0.99] text-theme-muted"
              >
                <ImageIcon size={16} />
                <span className="text-[9px] font-bold uppercase tracking-widest">
                  Enviar da Galeria (Múltiplo)
                </span>
              </button>
            </div>

            {/* ── Upload Feed ───────────────────────────────────────────── */}
            {uploadItems.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-white/10">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-theme-muted">
                    Fotos enviadas ({uploadItems.filter(i => i.status === 'success').length})
                  </label>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-theme-brand">
                    Aparece na galeria na hora
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {uploadItems.map(item => (
                    <div
                      key={item.id}
                      className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center"
                    >
                      {item.file.type.startsWith('video/') ? (
                        <Video
                          size={24}
                          className={item.status === 'success' ? 'text-theme-brand' : 'text-theme-muted'}
                        />
                      ) : (
                        <img 
                          src={URL.createObjectURL(item.file)}
                          className="w-full h-full object-cover"
                          alt="miniatura"
                        />
                      )}

                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        {item.status === 'uploading' && (
                          <Loader2 size={24} className="text-theme-brand animate-spin" />
                        )}
                        {item.status === 'success' && (
                          <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 size={24} className="text-theme-brand" />
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider">Enviada!</span>
                          </div>
                        )}
                        {item.status === 'error' && (
                          <div className="flex flex-col items-center gap-1">
                            <button
                              onClick={() => {
                                retryUpload(item.id);
                              }}
                              className="bg-brand-danger/90 text-white p-2 rounded-full hover:bg-brand-danger active:scale-95 shadow-xl border border-brand-danger"
                              title="Tentar novamente"
                            >
                              <RefreshCcw size={16} />
                            </button>
                            <span className="text-[8px] font-bold text-white uppercase tracking-wider text-center leading-tight px-1">Não enviou — toque</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Removed Fullscreen Upload Overlay to allow "Stories" mode ── */}
      </div>
    </div>
  );
}

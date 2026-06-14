import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API } from '../lib/api';
import { CheckCircle2, Loader2, Image as ImageIcon, Video, Camera, LogOut, User as UserIcon, ArrowLeft, RefreshCcw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

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

interface UploadItem {
  id: string;
  file: File;
  status: 'uploading' | 'success' | 'error';
  code?: string;
  errorMessage?: string;
}

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

  // ── Upload Queue
  const [uploadItems, setUploadItems] = useState<UploadItem[]>([]);
  const [isUploadingGlobal, setIsUploadingGlobal] = useState(false);

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

  // ─── UPLOAD LOGIC ────────────────────────────────────────────────────────

  /**
   * uploadSingleItem — envia um arquivo para o backend.
   * Campos de texto ANTES do arquivo (requisito do multer).
   */
  const uploadSingleItem = useCallback(async (item: UploadItem) => {
    try {
      const formDataPayload = new FormData();
      const resolvedType =
        item.file.type ||
        (item.file.name.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg');

      // Text fields FIRST (multer requirement)
      formDataPayload.append('eventId', eventId);
      formDataPayload.append('customerName', formData.customerName);
      formDataPayload.append('customerPhone', formData.customerPhone);
      formDataPayload.append('customerEmail', formData.customerEmail);
      formDataPayload.append('mimetype', resolvedType);
      if (user) formDataPayload.append('userId', user.id);

      // File LAST
      formDataPayload.append('photo', item.file, item.file.name);

      const res = await API.post('/public/phygital/upload', formDataPayload);

      if (res.data && res.data.success) {
        setUploadItems(prev =>
          prev.map(ui =>
            ui.id === item.id ? { ...ui, status: 'success', code: res.data.referenceCode } : ui
          )
        );
      } else {
        throw new Error(res.data?.error || 'Erro no envio');
      }
    } catch (err: any) {
      setUploadItems(prev =>
        prev.map(ui =>
          ui.id === item.id
            ? { ...ui, status: 'error', errorMessage: err.message || 'Falha na conexão' }
            : ui
        )
      );
    }
  }, [eventId, formData, user]);

  const processAndUploadFiles = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;

      // Validate video durations
      const validations = await Promise.all(selectedFiles.map(checkVideoDuration));
      if (validations.includes(false)) {
        toast.error('Gravações de vídeo devem ter no máximo 15 segundos.');
        return;
      }

      setIsUploadingGlobal(true);

      const newItems: UploadItem[] = selectedFiles.map(file => ({
        id: Date.now() + Math.random().toString(36).substring(2),
        file,
        status: 'uploading',
      }));

      setUploadItems(prev => [...newItems, ...prev]);

      // Upload sequencialmente (evita OOM em mobile com múltiplos uploads paralelos)
      for (const item of newItems) {
        await uploadSingleItem(item);
      }

      setIsUploadingGlobal(false);
    },
    [uploadSingleItem]
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
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity text-white"
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          {isIdentified && (
            <button
              onClick={changeIdentification}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/5 border border-white/10 rounded-full hover:bg-white/10 transition-colors"
            >
              <UserIcon size={10} className="text-emerald-400" />
              <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-300">
                {formData.customerName.split(' ')[0] || 'Convidado'}
              </span>
              <LogOut size={10} className="text-zinc-500 hover:text-red-400 ml-1" />
            </button>
          )}
        </div>

        {/* ── Branding ────────────────────────────────────────────────────── */}
        <div className="text-center pt-2">
          <div className="text-[18px] font-bold uppercase tracking-[0.8em] mb-1 text-white">
            FOTO SEGUNDO
          </div>
          <div className="h-px w-10 bg-emerald-400 mx-auto mb-2" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30 text-white">
            Phygital Capture
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
              <Camera size={32} className="mx-auto text-emerald-400 mb-3 opacity-80" />
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">
                Identificação
              </h2>
              <p className="text-[10px] text-zinc-500 mt-1 uppercase tracking-wider">
                Para encontrar suas fotos depois no álbum.
              </p>
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                Nome Completo
              </label>
              <input
                required
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-emerald-500/50 outline-none text-white transition-colors"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                E-mail
              </label>
              <input
                required
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-emerald-500/50 outline-none text-white transition-colors"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                WhatsApp (opcional)
              </label>
              <input
                type="tel"
                name="customerPhone"
                value={formData.customerPhone}
                onChange={handleInputChange}
                className="w-full bg-black/40 border border-zinc-800 p-3 rounded-xl text-xs focus:border-emerald-500/50 outline-none text-white transition-colors"
                placeholder="(00) 00000-0000"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-500 text-zinc-950 font-bold uppercase tracking-widest text-[11px] py-4 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform hover:bg-emerald-400"
            >
              <Camera size={16} />
              Começar a Fotografar
            </button>
          </form>
        ) : (
          /* STEP 2: Main Camera / Upload Flow */
          <div className="space-y-8 mt-6">

            {/* ── Shutter Mechanism ─────────────────────────────────────── */}
            <div className="flex flex-col items-center justify-center space-y-5 bg-white/[0.01] p-6 rounded-[2rem] border border-white/5">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">
                {isLongPressing ? 'Gravando Vídeo...' : 'Toque: Foto  •  Segure: Vídeo'}
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
                  className="w-28 h-28 rounded-full border-4 border-emerald-500/35 bg-zinc-900/40 flex items-center justify-center hover:border-emerald-500/60 shadow-lg shadow-emerald-500/5 transition-all select-none active:scale-95 touch-none"
                  aria-label="Capturar foto (pressionar) ou vídeo (segurar)"
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isLongPressing
                        ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/20'
                        : 'bg-emerald-500 scale-100 hover:scale-[1.03] shadow-md shadow-emerald-500/25'
                    }`}
                  >
                    {isLongPressing ? (
                      <Video size={32} className="text-white animate-pulse" strokeWidth={2.5} />
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
                className="w-full flex items-center justify-center gap-3 py-3 border border-dashed border-white/10 hover:border-emerald-500/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all active:scale-[0.99] text-zinc-400"
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
                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                    Fotos Enviadas ({uploadItems.filter(i => i.status === 'success').length})
                  </label>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-400">
                    Upload Direto Ativo
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {uploadItems.map(item => (
                    <div
                      key={item.id}
                      className="relative w-full aspect-square rounded-xl overflow-hidden border border-zinc-800 bg-zinc-900 flex flex-col items-center justify-center"
                    >
                      <Camera
                        size={24}
                        className={item.status === 'success' ? 'text-green-500' : 'text-zinc-600'}
                      />

                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px]">
                        {item.status === 'uploading' && (
                          <Loader2 size={24} className="text-emerald-400 animate-spin" />
                        )}
                        {item.status === 'success' && (
                          <CheckCircle2 size={24} className="text-green-400" />
                        )}
                        {item.status === 'error' && (
                          <button
                            onClick={() => {
                              setUploadItems(prev =>
                                prev.map(ui =>
                                  ui.id === item.id ? { ...ui, status: 'uploading' } : ui
                                )
                              );
                              uploadSingleItem(item);
                            }}
                            className="bg-red-500/90 text-white p-2 rounded-full hover:bg-red-500 active:scale-95 shadow-xl border border-red-400 flex flex-col items-center gap-1"
                            title="Tentar novamente"
                          >
                            <RefreshCcw size={16} />
                            <span className="text-[7px] font-bold uppercase tracking-wider">
                              Tentar
                            </span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Fullscreen Upload Overlay ────────────────────────────────────── */}
        {isUploadingGlobal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/90 backdrop-blur-md">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative flex items-center justify-center">
                <div className="w-24 h-24 border-4 border-emerald-500/30 rounded-full animate-spin" />
                <div className="absolute w-24 h-24 border-4 border-transparent border-t-emerald-500 rounded-full animate-spin" />
                <Camera size={32} className="absolute text-emerald-400 animate-pulse" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-lg font-bold text-white tracking-widest uppercase">
                  Enviando Foto
                </h2>
                <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">
                  Não feche o aplicativo
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

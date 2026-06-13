import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API } from '../lib/api';
import { T } from '../lib/theme';
import { CheckCircle2, Loader2, Image as ImageIcon, Trash2, Video, Camera, LogOut, User as UserIcon, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { Capacitor } from '@capacitor/core';

// Utilitário para comprimir a imagem antes do envio (evita erro 413 Payload Too Large no Vercel)
const compressImage = async (file: File): Promise<Blob | File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(file);

      const MAX_WIDTH = 1920;
      const MAX_HEIGHT = 1920;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_WIDTH) {
          height *= MAX_WIDTH / width;
          width = MAX_WIDTH;
        }
      } else {
        if (height > MAX_HEIGHT) {
          width *= MAX_HEIGHT / height;
          height = MAX_HEIGHT;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          resolve(blob);
        },
        'image/jpeg',
        0.8 // quality
      );
    };
    img.onerror = (error) => {
      URL.revokeObjectURL(objectUrl);
      reject(error);
    };
  });
};

export default function PhygitalCapture() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || searchParams.get('e') || 'EVENT_TESTE';

  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const touchStartRef = useRef<number>(0);
  const touchTimeoutRef = useRef<any>(null);
  const [isLongPressing, setIsLongPressing] = useState(false);

  const handlePointerDown = () => {
    if (files.length >= 12) return;
    touchStartRef.current = Date.now();
    setIsLongPressing(false);
    
    touchTimeoutRef.current = setTimeout(() => {
      setIsLongPressing(true);
    }, 450);
  };

  const handlePointerUp = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    
    if (files.length >= 12) {
      setIsLongPressing(false);
      return;
    }

    const duration = Date.now() - touchStartRef.current;
    if (duration >= 450) {
      if (videoInputRef.current) {
        videoInputRef.current.click();
      }
    } else {
      if (photoInputRef.current) {
        photoInputRef.current.click();
      }
    }
    setIsLongPressing(false);
  };

  const handlePointerCancel = () => {
    if (touchTimeoutRef.current) {
      clearTimeout(touchTimeoutRef.current);
      touchTimeoutRef.current = null;
    }
    setIsLongPressing(false);
  };
  
  interface RecentUpload {
    id: string;
    url: string;
    name: string;
    code: string;
    timestamp: number;
  }
  const [recentUploads, setRecentUploads] = useState<RecentUpload[]>([]);
  const [successPopupData, setSuccessPopupData] = useState<{
    codes: string[];
    fileCount: number;
  } | null>(null);

  // Auto-dismiss logic for success popup (2 seconds)
  useEffect(() => {
    if (!successPopupData) return;
    const timer = setTimeout(() => {
      setSuccessPopupData(null);
    }, 2000);
    return () => clearTimeout(timer);
  }, [successPopupData]);

  // Auto-trigger native camera (Photo mode) on mount if Capacitor native
  useEffect(() => {
    const timer = setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        photoInputRef.current?.click();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  const { user, logout } = useAuth();

  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; type: string; name: string }[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: ''
  });
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  // Sync user data if logged in
  useEffect(() => {
    if (user) {
      setFormData({
        customerName: user.nome || '',
        customerPhone: user.whatsapp || '',
        customerEmail: user.email || ''
      });
      setIsNewUser(false);
    }
  }, [user]);

  const { registerExpress, login: authLogin } = useAuth();

  // Debounced email check
  useEffect(() => {
    if (user || !formData.customerEmail || !formData.customerEmail.includes('@') || formData.customerEmail.length < 5) {
      if (!user) setIsNewUser(false);
      return;
    }
    
    const timeout = setTimeout(async () => {
      setCheckingEmail(true);
      try {
        const res = await API.get(`/public/auth/check?email=${formData.customerEmail}`);
        setIsNewUser(!res.data.exists);
      } catch (err) {
        console.error("Erro ao checar email:", err);
      } finally {
        setCheckingEmail(false);
      }
    }, 800);

    return () => clearTimeout(timeout);
  }, [formData.customerEmail, user]);

  const checkVideoDuration = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!file.type.startsWith('video/')) return resolve(true);
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        resolve(video.duration <= 15.5); // 15 seconds limit
      };
      video.onerror = () => {
        resolve(false);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  const processFiles = async (selectedFiles: File[]) => {
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > 12) {
      setError("Você pode acumular no máximo 12 mídias no seu combo.");
      toast.error("Limite de 12 arquivos excedido.");
      return;
    }

    setError('');

    // Valida duração de vídeos
    const validations = await Promise.all(selectedFiles.map(checkVideoDuration));
    if (validations.includes(false)) {
      setError("Gravações de vídeo devem ter no máximo 15 segundos.");
      toast.error("Um ou mais vídeos excedem o limite de 15 segundos.");
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    const newPreviews = selectedFiles.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type || (f.name.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg'),
      name: f.name
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  useEffect(() => {
    const pending = (window as any).fsPendingCaptureFiles;
    if (pending && pending.length > 0) {
      processFiles(pending);
      (window as any).fsPendingCaptureFiles = undefined;
    }
  }, []);

  const handleNativePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleNativeVideoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await processFiles(Array.from(e.target.files || []));
    e.target.value = '';
  };

  const startUploadFlow = async (filesToUpload: File[], activeFormData: typeof formData) => {
    setIsUploading(true);
    setError('');

    // Clone data and clean UI immediately for background processing
    setFiles([]);
    setPreviews([]);
    
    toast.success("Enviando mídias em segundo plano...", { duration: 2000 });

    try {
      const codes: string[] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];

        const data = new FormData();
        const resolvedType = file.type || (file.name.match(/\.(mp4|webm|mov)$/i) ? 'video/mp4' : 'image/jpeg');
        const isVideo = resolvedType.startsWith('video/');

        if (!isVideo) {
          const compressedBlob = await compressImage(file);
          data.append('photo', compressedBlob, file.name);
        } else {
          data.append('photo', file, file.name);
        }
        data.append('mimetype', resolvedType);
        data.append('customerName', activeFormData.customerName);
        data.append('customerPhone', activeFormData.customerPhone);
        data.append('customerEmail', activeFormData.customerEmail);
        data.append('eventId', eventId);

        const res = await API.post('/public/phygital/upload', data);
        if (res.data && res.data.success) {
          const code = res.data.referenceCode;
          codes.push(code);

          // Add to recent uploads session list
          const previewUrl = URL.createObjectURL(file);
          setRecentUploads(prev => [
            {
              id: `${Date.now()}-${i}-${Math.random()}`,
              url: previewUrl,
              name: file.name,
              code,
              timestamp: Date.now()
            },
            ...prev
          ]);
        } else {
          throw new Error(res.data?.error || `Falha no processamento de ${file.name}`);
        }
      }

      // Trigger 2s success alert
      setSuccessPopupData({
        codes,
        fileCount: filesToUpload.length
      });
    } catch (err: unknown) {
      console.error(err);
      const errMsg = err instanceof Error ? err.message : 'Erro ao processar envio dos arquivos.';
      toast.error(`Falha no envio em segundo plano: ${errMsg}`);
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = (index: number) => {
    const fileToRemove = files[index];
    if (fileToRemove) {
      URL.revokeObjectURL(previews[index].url);
    }
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleComboSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Por favor, capture ou selecione pelo menos uma foto ou vídeo.');
      return;
    }

    let activeFormData = { ...formData };

    if (!user) {
      if (!formData.customerName || !formData.customerEmail || !formData.customerPhone) {
        setError('Por favor, preencha os dados de identificação para impressão.');
        return;
      }
      if (!password) {
        setError('Por favor, defina uma senha para proteger sua galeria.');
        return;
      }
      
      try {
        let loggedInUser;
        if (isNewUser) {
          loggedInUser = await registerExpress(formData.customerEmail, password, formData.customerName, formData.customerPhone);
        } else {
          try {
            loggedInUser = await authLogin(formData.customerEmail, password);
          } catch {
            setError('Senha incorreta para este e-mail. Tente novamente.');
            return;
          }
        }
        if (loggedInUser) {
          activeFormData = {
            customerName: loggedInUser.nome || formData.customerName,
            customerPhone: loggedInUser.whatsapp || formData.customerPhone,
            customerEmail: loggedInUser.email || formData.customerEmail
          };
        }
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erro na autenticação.');
        return;
      }
    }

    await startUploadFlow(files, activeFormData);
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-4 px-3 md:px-6 relative overflow-x-hidden" style={{ background: T.bg }}>
      
      {/* Hidden inputs to trigger native system camera apps */}
      <input 
        ref={photoInputRef}
        type="file" 
        accept="image/*" 
        capture="environment" 
        onChange={handleNativePhotoChange} 
        className="hidden" 
      />
      <input 
        ref={videoInputRef}
        type="file" 
        accept="video/*" 
        capture="environment" 
        onChange={handleNativeVideoChange} 
        className="hidden" 
      />
      <input 
        ref={galleryInputRef}
        type="file" 
        accept="image/*,video/*" 
        multiple
        onChange={handleFileChange} 
        className="hidden" 
      />

      <div className="w-full max-w-md space-y-6">
        
        {/* Navigation / User Profile Header */}
        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => window.history.length > 1 ? window.history.back() : window.close()}
            className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
            style={{ color: T.text }}
          >
            <ArrowLeft size={16} /> Voltar
          </button>

          {user ? (
            <div className="flex items-center gap-3 px-3 py-1.5 bg-brand-tactical/10 border border-brand-tactical/20 rounded-full">
              <div className="w-5 h-5 rounded-full bg-brand-tactical flex items-center justify-center">
                <UserIcon size={10} className="text-zinc-950" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-brand-tactical">Olá, {user.nome.split(' ')[0]}</span>
              <button onClick={logout} className="text-theme-text-muted hover:text-red-500 transition-colors">
                <LogOut size={12} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-theme-bg-muted border border-white/10 rounded-full">
               <UserIcon size={10} className="opacity-40" />
               <span className="text-[9px] font-bold uppercase tracking-widest opacity-40">Visitante</span>
            </div>
          )}
        </div>

        {/* Branding Header */}
        <div className="text-center pt-2">
          <div className="text-[18px] font-bold uppercase tracking-[0.8em] mb-1" style={{ color: T.text }}>FOTO SEGUNDO</div>
          <div className="h-px w-10 bg-brand-tactical mx-auto mb-2" />
          <p className="text-[10px] uppercase tracking-[0.3em] font-bold opacity-30">Câmera Nativa Phygital</p>
        </div>

        {/* Dynamic Background Upload Spinner */}
        {isUploading && (
          <div className="flex items-center justify-center gap-3 p-3 bg-brand-tactical/15 border border-brand-tactical/35 rounded-2xl animate-pulse">
            <Loader2 className="animate-spin text-brand-tactical" size={16} />
            <span className="text-[9px] font-bold uppercase tracking-widest text-brand-tactical">
              Transmitindo combo em segundo plano...
            </span>
          </div>
        )}

        {/* Native Action Trigger (Unified Shutter Button) */}
        <div className="flex flex-col items-center justify-center py-2 space-y-4">
          <div className="text-center">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-tactical/80">
              {isLongPressing ? 'Gravando Vídeo...' : 'Toque para Foto • Segure para Vídeo'}
            </span>
          </div>

          <div className="relative flex items-center justify-center">
            <button
              type="button"
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerCancel}
              onContextMenu={(e) => e.preventDefault()}
              disabled={files.length >= 12}
              className={`w-28 h-28 rounded-full border-4 flex items-center justify-center transition-all select-none active:scale-95 touch-none relative ${
                files.length >= 12
                  ? 'border-zinc-800 bg-zinc-900/20 text-zinc-600 cursor-not-allowed'
                  : 'border-brand-tactical/35 bg-zinc-900/40 hover:border-brand-tactical/60 shadow-lg shadow-brand-tactical/5'
              }`}
            >
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 ${
                  files.length >= 12
                    ? 'bg-zinc-800'
                    : isLongPressing
                    ? 'bg-red-500 scale-110 shadow-lg shadow-red-500/20'
                    : 'bg-brand-tactical scale-100 hover:scale-[1.03] shadow-md shadow-brand-tactical/25'
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
        </div>

        {/* Gallery Shortcut Button */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          disabled={files.length >= 12}
          className="w-full flex items-center justify-center gap-3 py-3 border border-dashed border-white/10 hover:border-brand-tactical/30 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] transition-all active:scale-[0.99] text-zinc-400 disabled:opacity-40"
        >
          <ImageIcon size={16} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Escolher da Galeria (Até 12)</span>
        </button>

        {/* Previews / Combo Queue Grid Section */}
        <div className="space-y-3 pt-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40">
              Mídias no seu Combo ({files.length}/12)
            </label>
            {files.length > 0 && (
              <button 
                type="button"
                onClick={() => { setFiles([]); setPreviews([]); }}
                className="text-[9px] font-bold uppercase tracking-widest text-red-500 hover:text-red-400"
              >
                Limpar Combo
              </button>
            )}
          </div>

          {files.length === 0 ? (
            <div className="text-center py-12 bg-white/[0.01] border border-white/5 rounded-2xl border-dashed text-zinc-600 space-y-2">
              <Camera className="mx-auto opacity-20" size={32} />
              <p className="text-[9px] font-bold uppercase tracking-wider">Seu combo está vazio</p>
              <p className="text-[8px]">Tire fotos ou grave vídeos com a câmera do seu celular</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3 p-3 bg-white/[0.02] border border-theme-border rounded-2xl">
              {previews.map((prev, idx) => (
                <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center group animate-reveal">
                  {prev.type.startsWith('video/') ? (
                    <div className="flex flex-col items-center gap-1 text-[9px] text-zinc-500 font-bold">
                      <Video size={18} className="text-brand-tactical" />
                      <span className="truncate max-w-[55px] text-[7px]">{prev.name}</span>
                    </div>
                  ) : (
                    <img src={prev.url} alt="Preview" className="w-full h-full object-cover animate-reveal" />
                  )}
                  
                  <button 
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="absolute inset-0 bg-red-600/85 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Combo Submission Form */}
        {files.length > 0 && (
          <form onSubmit={handleComboSubmit} className="space-y-6 pt-2 animate-reveal">
            {!user && (
              <div className="space-y-4 border-t border-white/5 pt-4 text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-brand-tactical mb-2">Identificação do Convidado</p>
                
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">Nome Completo</label>
                  <input 
                    required 
                    type="text" 
                    name="customerName" 
                    value={formData.customerName} 
                    onChange={handleInputChange} 
                    className="w-full bg-white/[0.03] border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 transition-all outline-none text-white"
                    placeholder="Ex: João Silva"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="relative">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">E-mail</label>
                    <input 
                      required 
                      type="email" 
                      name="customerEmail" 
                      value={formData.customerEmail} 
                      onChange={handleInputChange} 
                      className="w-full bg-white/[0.03] border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 transition-all outline-none text-white"
                      placeholder="seu@email.com"
                    />
                    {checkingEmail && (
                      <div className="absolute right-3 top-[32px]">
                        <Loader2 size={12} className="animate-spin opacity-45" />
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">WhatsApp</label>
                    <input 
                      required 
                      type="tel" 
                      name="customerPhone" 
                      value={formData.customerPhone} 
                      onChange={handleInputChange} 
                      className="w-full bg-white/[0.03] border border-zinc-800 p-3 rounded-xl text-xs focus:border-brand-tactical/50 transition-all outline-none text-white"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>

                {(formData.customerEmail.includes('@') && formData.customerEmail.length > 5) && (
                  <div className="animate-reveal">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-zinc-500 mb-1 block">
                      {isNewUser ? "Defina sua Senha (Novo Cadastro)" : "Senha de Acesso"}
                    </label>
                    <input 
                      required 
                      type="password" 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-brand-tactical/10 border border-brand-tactical/20 p-3 rounded-xl text-xs focus:border-brand-tactical transition-all outline-none text-white"
                      placeholder="********"
                    />
                    {isNewUser && (
                      <p className="text-[8px] text-brand-tactical font-bold uppercase tracking-widest mt-1">
                        ✨ Conta nova! Será criada automaticamente.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-[10px] font-bold uppercase tracking-widest text-left">
                <span>{error}</span>
              </div>
            )}

            <button 
              type="submit" 
              disabled={isUploading}
              className="w-full py-4.5 rounded-2xl font-black uppercase tracking-[0.4em] text-[10px] bg-brand-tactical text-zinc-950 hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-tactical/10"
            >
              Enviar para Impressão
            </button>
          </form>
        )}

        {/* Histórico Recentes Nesta Sessão */}
        {recentUploads.length > 0 && (
          <div className="mt-8 space-y-3 border-t border-white/5 pt-4 animate-reveal">
            <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 block">
              Enviados nesta sessão ({recentUploads.length})
            </label>
            <div className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 custom-scrollbar">
              {recentUploads.map((item) => (
                <div 
                  key={item.id} 
                  className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border border-brand-tactical/30 bg-zinc-950 flex items-center justify-center shadow-lg"
                >
                  <img src={item.url} alt={item.name} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full bg-brand-tactical flex items-center justify-center text-zinc-950 shadow">
                    <CheckCircle2 size={9} strokeWidth={3} />
                  </div>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[8px] font-mono font-black text-brand-tactical bg-zinc-950/90 px-1 py-0.5 rounded border border-brand-tactical/20 shadow-sm whitespace-nowrap">
                    {item.code}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[9px] uppercase tracking-[0.4em] opacity-15 pt-8 pb-4 font-bold">
          Powered by Foto Segundo Phygital
        </p>
      </div>

      {/* ── Success Popup overlay (auto-dismissing in 2s) ───────────────── */}
      {successPopupData && (
        <div className="fixed inset-0 z-[1002] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-zinc-950 border border-brand-tactical/30 rounded-2xl p-6 relative overflow-hidden shadow-2xl text-center">
            {/* Animated progress bar at the top */}
            <div className="absolute top-0 left-0 h-1 bg-brand-tactical animate-shrink-width" />
            
            <div className="w-16 h-16 bg-brand-tactical/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-tactical/20">
              <CheckCircle2 size={32} className="text-brand-tactical" />
            </div>
            
            <h3 className="text-lg font-bold uppercase tracking-widest text-white mb-2">Enviado com Sucesso!</h3>
            <p className="text-[11px] text-zinc-400 uppercase tracking-wider mb-6">
              {successPopupData.fileCount} {successPopupData.fileCount === 1 ? 'lembrança enviada' : 'lembranças enviadas'} para impressão.
            </p>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-left">
              <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 mb-2 text-center">Códigos de Impressão</p>
              <div className="max-h-24 overflow-y-auto space-y-1 custom-scrollbar text-center">
                {successPopupData.codes.map((code, idx) => (
                  <span key={idx} className="inline-block bg-brand-tactical/10 border border-brand-tactical/25 text-brand-tactical font-mono text-xs font-bold px-2 py-0.5 rounded m-0.5 animate-reveal">
                    {code}
                  </span>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSuccessPopupData(null)}
              className="mt-6 text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white"
            >
              Fechar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}

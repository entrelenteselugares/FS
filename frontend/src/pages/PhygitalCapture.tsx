import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API } from '../lib/api';
import { T } from '../lib/theme';
import { Camera, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, User as UserIcon, LogOut, ArrowLeft, Trash2, Video } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

// Utilitário para comprimir a imagem antes do envio (evita erro 413 Payload Too Large no Vercel - Limite 4.5MB)
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
  const autoCamera = searchParams.get('auto') === '1';

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showCaptureMenu, setShowCaptureMenu] = useState(false);

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
  const [loading, setLoading] = useState(false);
  
  type UploadStatus = 'pending' | 'uploading' | 'done' | 'failed';
  const [_uploadProgress, setUploadProgress] = useState<Record<string, UploadStatus>>({});
  const [currentUploadIndex, setCurrentUploadIndex] = useState<number | null>(null);
  const [referenceCodes, setReferenceCodes] = useState<string[]>([]);
  const [error, setError] = useState('');

  // Sincroniza dados se estiver logado
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

  // Auto-abre câmera se vier do botão flutuante (?auto=1)
  useEffect(() => {
    if (!autoCamera) return;
    const timer = setTimeout(() => {
      cameraInputRef.current?.click();
    }, 300);
    return () => clearTimeout(timer);
  }, [autoCamera]);

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (selectedFiles.length === 0) return;

    if (files.length + selectedFiles.length > 12) {
      setError("Você pode enviar no máximo 12 fotos/vídeos por vez.");
      toast.error("Limite de 12 arquivos excedido.");
      return;
    }

    setLoading(true);
    setError('');

    // Valida duração de vídeos
    const validations = await Promise.all(selectedFiles.map(checkVideoDuration));
    if (validations.includes(false)) {
      setError("Gravações de vídeo devem ter no máximo 15 segundos.");
      toast.error("Um ou mais vídeos excedem o limite de 15 segundos.");
      setLoading(false);
      return;
    }

    const newFiles = [...files, ...selectedFiles];
    setFiles(newFiles);

    const newPreviews = selectedFiles.map(f => ({
      url: URL.createObjectURL(f),
      type: f.type,
      name: f.name
    }));
    setPreviews(prev => [...prev, ...newPreviews]);
    setLoading(false);

    // Se já estiver logado, inicia o upload imediato dos novos arquivos
    if (user) {
      const activeFormData = {
        customerName: user.nome || '',
        customerPhone: user.whatsapp || '',
        customerEmail: user.email || ''
      };
      await startUploadFlow(newFiles, activeFormData);
    }
  };

  const startUploadFlow = async (filesToUpload: File[], activeFormData: typeof formData) => {
    setLoading(true);
    setError('');
    const codes: string[] = [];
    const initialProgress: Record<string, UploadStatus> = {};
    filesToUpload.forEach(f => {
      initialProgress[f.name] = 'pending';
    });
    setUploadProgress(initialProgress);

    try {
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setCurrentUploadIndex(i);
        setUploadProgress(prev => ({ ...prev, [file.name]: 'uploading' }));

        const data = new FormData();
        if (file.type.startsWith('image/')) {
          const compressedBlob = await compressImage(file);
          data.append('photo', compressedBlob, file.name);
        } else {
          // Upload direto para vídeos (sem compressão cliente)
          data.append('photo', file, file.name);
        }
        data.append('customerName', activeFormData.customerName);
        data.append('customerPhone', activeFormData.customerPhone);
        data.append('customerEmail', activeFormData.customerEmail);
        data.append('eventId', eventId);

        const res = await API.post('/public/phygital/upload', data);
        if (res.data && res.data.success) {
          codes.push(res.data.referenceCode);
          setUploadProgress(prev => ({ ...prev, [file.name]: 'done' }));
        } else {
          setUploadProgress(prev => ({ ...prev, [file.name]: 'failed' }));
          throw new Error(res.data?.error || `Falha no processamento de ${file.name}`);
        }
      }
      setReferenceCodes(codes);
      toast.success("Envio concluído com sucesso!");
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Erro ao processar envio dos arquivos.');
    } finally {
      setLoading(false);
      setCurrentUploadIndex(null);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length === 0) {
      setError('Por favor, capture ou selecione pelo menos uma foto ou vídeo.');
      return;
    }

    let activeFormData = { ...formData };

    if (!user) {
      if (!password) {
        setError('Por favor, defina uma senha para proteger sua galeria.');
        return;
      }
      
      setLoading(true);
      try {
        let loggedInUser;
        if (isNewUser) {
          loggedInUser = await registerExpress(formData.customerEmail, password, formData.customerName, formData.customerPhone);
        } else {
          try {
            loggedInUser = await authLogin(formData.customerEmail, password);
          } catch {
            setError('Senha incorreta para este e-mail. Tente novamente.');
            setLoading(false);
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
        setLoading(false);
        return;
      }
    }

    await startUploadFlow(files, activeFormData);
  };

  if (referenceCodes.length > 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-reveal" style={{ background: T.bg }}>
        <button
          onClick={() => window.close()}
          className="fixed top-6 left-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity"
          style={{ color: T.text }}
        >
          <ArrowLeft size={16} /> Fechar
        </button>

        <div className="w-20 h-20 bg-brand-tactical/20 rounded-full flex items-center justify-center mb-8 border border-brand-tactical/30">
          <CheckCircle2 size={40} className="text-brand-tactical" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2" style={{ color: T.text }}>Arquivos Recebidos</h1>
        <p className="text-[11px] uppercase tracking-widest opacity-50 mb-10">Sua lembrança já está na fila de impressão</p>
        
        <div className="w-full max-w-sm p-8 rounded-2xl border border-theme-border bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-tactical" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4">Códigos de Referência</p>
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar">
            {referenceCodes.map((code, idx) => (
              <div key={idx} className="flex justify-between border-b border-white/5 pb-2 text-left">
                <span className="text-[9px] text-theme-text-muted font-bold truncate max-w-[180px]">{files[idx]?.name || `Item ${idx + 1}`}</span>
                <span className="text-xl font-black text-brand-tactical font-mono tracking-tight">{code}</span>
              </div>
            ))}
          </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] py-4 px-8 border border-theme-border hover:bg-theme-bg-muted transition-all"
          style={{ color: T.text }}
        >
          Enviar Mais Arquivos
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6" style={{ background: T.bg }}>
      <div className="w-full max-w-md">

        {/* Botão Voltar */}
        <button
          type="button"
          onClick={() => window.history.length > 1 ? window.history.back() : window.close()}
          className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-100 transition-opacity mb-8"
          style={{ color: T.text }}
        >
          <ArrowLeft size={16} /> Voltar
        </button>

        {/* Status de Login */}
        <div className="flex justify-center mb-8">
          {user ? (
            <div className="flex items-center gap-3 px-4 py-2 bg-brand-tactical/10 border border-brand-tactical/20 rounded-full">
              <div className="w-6 h-6 rounded-full bg-brand-tactical flex items-center justify-center">
                <UserIcon size={12} className="text-zinc-950" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-tactical">Olá, {user.nome.split(' ')[0]}</span>
              <button onClick={logout} className="text-theme-text-muted hover:text-red-500 transition-colors">
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 px-4 py-2 bg-theme-bg-muted border border-white/10 rounded-full">
               <UserIcon size={12} className="opacity-40" />
               <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Modo Identificação Pendente</span>
            </div>
          )}
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[18px] font-black uppercase tracking-[0.8em] italic mb-2" style={{ color: T.text }}>FOTO SEGUNDO</div>
          <div className="h-px w-12 bg-brand-tactical mx-auto mb-4" />
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold opacity-40">Experiência Phygital</p>
        </div>

        {/* Progress bar de upload */}
        {currentUploadIndex !== null && (
          <div className="space-y-4 text-center py-6 bg-white/[0.02] border border-theme-border rounded-2xl p-6 mb-8 animate-reveal">
            <Loader2 className="animate-spin text-brand-tactical mx-auto" size={32} />
            <h3 className="text-[11px] font-black uppercase tracking-widest text-white">Transmitindo capturas...</h3>
            <p className="text-[9px] text-theme-text-muted uppercase tracking-wider">
              Enviando {currentUploadIndex + 1} de {files.length} ({files[currentUploadIndex].name})
            </p>
            <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div 
                className="bg-brand-tactical h-full transition-all duration-300"
                style={{ width: `${((currentUploadIndex) / files.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Choice Area */}
          <div className="space-y-4">
            {previews.length > 0 ? (
              <div className="space-y-4">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 block">Arquivos Selecionados ({files.length}/12)</label>
                <div className="grid grid-cols-3 gap-3 p-4 bg-white/[0.02] border border-theme-border rounded-2xl">
                  {previews.map((prev, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-white/10 bg-black flex items-center justify-center group">
                      {prev.type.startsWith('video/') ? (
                        <div className="flex flex-col items-center gap-1 text-[9px] text-theme-text-muted font-bold">
                          <Video size={20} className="text-brand-tactical" />
                          <span className="truncate max-w-[60px] text-[8px]">{prev.name}</span>
                        </div>
                      ) : (
                        <img src={prev.url} alt="Preview" className="w-full h-full object-cover" />
                      )}
                      
                      {/* Only allow removing if not currently uploading */}
                      {currentUploadIndex === null && (
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute inset-0 bg-red-600/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                  {files.length < 12 && currentUploadIndex === null && (
                    <button
                      type="button"
                      onClick={() => galleryInputRef.current?.click()}
                      className="aspect-square rounded-xl border border-dashed border-white/20 hover:border-brand-tactical/50 transition-colors flex flex-col items-center justify-center gap-1 text-[8px] text-theme-text-muted font-black uppercase tracking-wider"
                    >
                      <ImageIcon size={18} className="opacity-40" />
                      Adicionar
                    </button>
                  )}
                </div>
                {currentUploadIndex === null && (
                  <button 
                    type="button"
                    onClick={() => { setFiles([]); setPreviews([]); }}
                    className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:text-red-400 block ml-1"
                  >
                    Remover Todos
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {/* Camera button opens sub-menu on mobile */}
                <button
                  type="button"
                  onClick={() => setShowCaptureMenu(true)}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-brand-tactical rounded-2xl text-zinc-950 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20 active:scale-[0.98]"
                >
                  <Camera size={32} strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Tirar Foto / Gravar Vídeo</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.03] border border-theme-border rounded-2xl hover:bg-white/[0.06] transition-all active:scale-[0.98]"
                  style={{ color: T.text }}
                >
                  <ImageIcon size={32} className="opacity-40" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Escolher da Galeria (Até 12)</span>
                </button>
              </div>
            )}

            {/* Hidden Inputs — separate per type for reliable camera activation */}
            {/* Photo capture: accept=image/* + capture=environment opens rear camera directly */}
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*"
              capture="environment"
              onChange={handleFileChange} 
              className="hidden" 
            />
            {/* Video capture: separate input required so capture attribute works for video too */}
            <input 
              ref={videoInputRef}
              type="file" 
              accept="video/*"
              capture="environment"
              onChange={handleFileChange} 
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
          </div>

          {/* Form Fields: Hidden completely if logged in to avoid checks */}
          {!user && (
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">Nome Completo</label>
                <input 
                  required 
                  type="text" 
                  name="customerName" 
                  value={formData.customerName} 
                  onChange={handleInputChange} 
                  className="w-full bg-white/[0.03] border border-theme-border p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                  placeholder="Ex: João Silva"
                  style={{ color: T.text }}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">E-mail Cadastrado</label>
                  <input 
                    required 
                    type="email" 
                    name="customerEmail" 
                    value={formData.customerEmail} 
                    onChange={handleInputChange} 
                    className="w-full bg-white/[0.03] border border-theme-border p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                    placeholder="seu@email.com"
                    style={{ color: T.text }}
                  />
                  {checkingEmail && (
                    <div className="absolute right-4 top-[38px]">
                      <Loader2 size={14} className="animate-spin opacity-40" />
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">WhatsApp</label>
                  <input 
                    required 
                    type="tel" 
                    name="customerPhone" 
                    value={formData.customerPhone} 
                    onChange={handleInputChange} 
                    className="w-full bg-white/[0.03] border border-theme-border p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                    placeholder="(00) 00000-0000"
                    style={{ color: T.text }}
                  />
                </div>
              </div>

              {/* Inline Password Field for Guest/New User */}
              {(formData.customerEmail.includes('@') && formData.customerEmail.length > 5) && (
                <div className="animate-reveal">
                  <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">
                    {isNewUser ? "Defina sua Senha (Novo Cadastro)" : "Senha de Acesso"}
                  </label>
                  <input 
                    required 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-brand-tactical/10 border border-brand-tactical/20 p-4 rounded-xl text-sm focus:border-brand-tactical transition-all outline-none"
                    placeholder="********"
                    style={{ color: T.text }}
                  />
                  {isNewUser && (
                    <p className="text-[9px] text-brand-tactical font-black uppercase tracking-widest mt-2 ml-1">
                      ✨ Identificamos que você é novo! Sua conta será criada automaticamente.
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-[11px] font-bold uppercase tracking-widest text-left">
              <AlertCircle size={18} className="shrink-0" />
              <span>{typeof error === 'string' ? error : (error as Error).message || JSON.stringify(error)}</span>
            </div>
          )}

          {/* Submit button shown only if not logged in (since logged in users auto-upload immediately on select) */}
          {!user && (
            <button 
              type="submit" 
              disabled={loading}
              className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.4em] text-[11px] transition-all flex items-center justify-center gap-3 ${loading ? 'bg-white/10 opacity-50 cursor-not-allowed' : 'bg-brand-tactical text-brand-text hover:scale-[1.02] active:scale-[0.98]'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  Processando...
                </>
              ) : (
                'Enviar para Impressão'
              )}
            </button>
          )}
          
          <p className="text-center text-[9px] uppercase tracking-[0.4em] opacity-20 font-bold">Powered by Foto Segundo Phygital</p>
        </form>
      </div>

      {/* ── Capture Sub-menu Modal ──────────────────────────────────────────── */}
      {showCaptureMenu && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCaptureMenu(false)}
        >
          <div
            className="w-full max-w-md mb-0 animate-reveal"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{ background: '#0a1a10', border: '1px solid rgba(16,185,129,0.25)', borderBottom: 'none', borderRadius: '24px 24px 0 0' }}
              className="p-6 flex flex-col gap-3"
            >
              <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-40 text-center mb-2">
                Escolha o tipo de captura
              </p>

              {/* Tirar Foto */}
              <button
                type="button"
                onClick={() => {
                  setShowCaptureMenu(false);
                  // Small delay so modal closes before browser prompts
                  setTimeout(() => cameraInputRef.current?.click(), 80);
                }}
                className="flex items-center gap-4 w-full p-5 bg-brand-tactical rounded-2xl text-zinc-950 hover:brightness-110 transition-all active:scale-[0.97] font-black text-sm uppercase tracking-[0.15em]"
              >
                <Camera size={24} strokeWidth={2.5} />
                Tirar Foto
              </button>

              {/* Gravar Vídeo */}
              <button
                type="button"
                onClick={() => {
                  setShowCaptureMenu(false);
                  setTimeout(() => videoInputRef.current?.click(), 80);
                }}
                className="flex items-center gap-4 w-full p-5 bg-white/[0.05] border border-white/10 rounded-2xl hover:bg-white/[0.1] transition-all active:scale-[0.97] font-black text-sm uppercase tracking-[0.15em]"
                style={{ color: 'white' }}
              >
                <Video size={24} strokeWidth={2} />
                Gravar Vídeo (até 15 seg)
              </button>

              {/* Cancel */}
              <button
                type="button"
                onClick={() => setShowCaptureMenu(false)}
                className="text-[10px] font-black uppercase tracking-widest opacity-40 hover:opacity-80 transition-opacity py-3 text-center"
                style={{ color: 'white' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

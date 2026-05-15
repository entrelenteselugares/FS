import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { API } from '../lib/api';
import { T } from '../lib/theme';
import { Camera, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, User as UserIcon, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function PhygitalCapture() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('eventId') || searchParams.get('e') || 'EVENT_TESTE';
  
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const { user, logout } = useAuth();

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: ''
  });
  const [password, setPassword] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ referenceCode: string } | null>(null);
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Por favor, capture ou selecione uma foto.');
      return;
    }

    // Se não estiver logado, realiza cadastro ou login inline
    if (!user) {
      if (!password) {
        setError('Por favor, defina uma senha para proteger sua galeria.');
        return;
      }
      
      setLoading(true);
      try {
        if (isNewUser) {
          await registerExpress(formData.customerEmail, password, formData.customerName, formData.customerPhone);
        } else {
          try {
            await authLogin(formData.customerEmail, password);
          } catch (loginErr) {
            setError('Senha incorreta para este e-mail. Tente novamente.');
            setLoading(false);
            return;
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Erro na autenticação.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('photo', file);
    data.append('customerName', formData.customerName);
    data.append('customerPhone', formData.customerPhone);
    data.append('customerEmail', formData.customerEmail);
    data.append('eventId', eventId);

    try {
      const res = await API.post('/public/phygital/upload', data, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data && res.data.success) {
        setResult(res.data);
      } else {
        setError(res.data?.error || 'Falha no processamento.');
      }
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr.response?.data?.error || 'Erro ao processar imagem.');
      } else {
        setError(err instanceof Error ? err.message : 'Erro de conexão. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center animate-reveal" style={{ background: T.bg }}>
        <div className="w-20 h-20 bg-brand-tactical/20 rounded-full flex items-center justify-center mb-8 border border-brand-tactical/30">
          <CheckCircle2 size={40} className="text-brand-tactical" />
        </div>
        <h1 className="text-3xl font-black uppercase tracking-[0.2em] mb-2" style={{ color: T.text }}>Foto Recebida</h1>
        <p className="text-[11px] uppercase tracking-widest opacity-50 mb-10">Sua lembrança já está na fila de impressão</p>
        
        <div className="w-full max-w-sm p-8 rounded-2xl border border-theme-border bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-tactical" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4">Código de Referência</p>
          <p className="text-5xl font-black tracking-tighter text-brand-tactical font-mono">{result.referenceCode}</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] py-4 px-8 border border-theme-border hover:bg-white/5 transition-all"
          style={{ color: T.text }}
        >
          Enviar Outra Foto
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-6" style={{ background: T.bg }}>
      <div className="w-full max-w-md">
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
            <div className="flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
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

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Choice Area */}
          <div className="space-y-4">
            {preview ? (
              <div className="relative aspect-[4/3] rounded-2xl border border-brand-tactical/30 overflow-hidden shadow-2xl bg-black">
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button 
                  type="button"
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-theme-text p-2 rounded-full border border-theme-border-2"
                >
                  Trocar Foto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-brand-tactical rounded-2xl text-zinc-950 hover:brightness-110 transition-all shadow-xl shadow-brand-tactical/20"
                >
                  <Camera size={32} strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-[0.2em]">Tirar Foto Agora</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-white/[0.03] border border-theme-border rounded-2xl hover:bg-white/[0.06] transition-all"
                  style={{ color: T.text }}
                >
                  <ImageIcon size={32} className="opacity-40" />
                  <span className="text-xs font-black uppercase tracking-[0.2em] opacity-60">Escolher da Galeria</span>
                </button>
              </div>
            )}

            {/* Hidden Inputs */}
            <input 
              ref={cameraInputRef}
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange} 
              className="hidden" 
            />
            <input 
              ref={galleryInputRef}
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="hidden" 
            />
          </div>

          {/* Form Fields */}
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
                  disabled={!!user}
                  className="w-full bg-white/[0.03] border border-theme-border p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none disabled:opacity-50"
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
            {!user && (formData.customerEmail.includes('@') && formData.customerEmail.length > 5) && (
              <div className="animate-reveal">
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">
                  {isNewUser ? "Defina sua Senha (Novo Cadastro)" : "Senha de Acesso"}
                </label>
                <input 
                  required 
                  type="password" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-brand-tactical/5 border border-brand-tactical/20 p-4 rounded-xl text-sm focus:border-brand-tactical transition-all outline-none"
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

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-500 text-[11px] font-bold uppercase tracking-widest">
              <AlertCircle size={18} />
              {error}
            </div>
          )}

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
          
          <p className="text-center text-[9px] uppercase tracking-[0.4em] opacity-20 font-bold">Powered by Foto Segundo Phygital</p>
        </form>
      </div>
    </div>
  );
}

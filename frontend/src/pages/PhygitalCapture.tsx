import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { API } from '../lib/api';
import { T } from '../lib/theme';
import { Camera, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export default function PhygitalCapture() {
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('e') || 'EVENT_TESTE';

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerCep: ''
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ referenceCode: string } | null>(null);
  const [error, setError] = useState('');

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

    setLoading(true);
    setError('');

    const data = new FormData();
    data.append('photo', file);
    data.append('customerName', formData.customerName);
    data.append('customerPhone', formData.customerPhone);
    data.append('customerCep', formData.customerCep);
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
        
        <div className="w-full max-w-sm p-8 rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-brand-tactical" />
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 mb-4">Código de Referência</p>
          <p className="text-5xl font-black tracking-tighter text-brand-tactical font-mono">{result.referenceCode}</p>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="mt-12 text-[10px] font-black uppercase tracking-[0.3em] py-4 px-8 border border-white/10 hover:bg-white/5 transition-all"
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
        {/* Header */}
        <div className="text-center mb-12">
          <div className="text-[18px] font-black uppercase tracking-[0.8em] italic mb-2" style={{ color: T.text }}>FOTO SEGUNDO</div>
          <div className="h-px w-12 bg-brand-tactical mx-auto mb-4" />
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold opacity-40">Experiência Phygital</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Upload Area */}
          <div className="relative group">
            <div 
              className={`aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden ${preview ? 'border-brand-tactical/50' : 'border-white/10 hover:border-brand-tactical/30 bg-white/[0.02]'}`}
            >
              {preview ? (
                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-8">
                  <Camera size={48} className="mx-auto mb-4 opacity-20" style={{ color: T.text }} />
                  <p className="text-[11px] font-bold uppercase tracking-widest opacity-40">Tire uma foto para imprimir</p>
                </div>
              )}
            </div>
            <input 
              type="file" 
              accept="image/*" 
              capture="environment"
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                placeholder="Ex: João Silva"
                style={{ color: T.text }}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">WhatsApp</label>
                <input 
                  required 
                  type="tel" 
                  name="customerPhone" 
                  value={formData.customerPhone} 
                  onChange={handleInputChange} 
                  className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                  placeholder="(00) 00000-0000"
                  style={{ color: T.text }}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-40 ml-1 mb-2 block">CEP</label>
                <input 
                  required 
                  type="text" 
                  name="customerCep" 
                  value={formData.customerCep} 
                  onChange={handleInputChange} 
                  className="w-full bg-white/[0.03] border border-white/5 p-4 rounded-xl text-sm focus:border-brand-tactical/50 transition-all outline-none"
                  placeholder="00000-000"
                  style={{ color: T.text }}
                />
              </div>
            </div>
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

import React, { useState, useCallback, useRef } from "react";
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, ShieldCheck } from "lucide-react";
import { API } from "../../lib/api";
import { motion, AnimatePresence } from "framer-motion";

interface FileWithStatus {
  id: string;
  file: File;
  preview: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  watermark?: boolean;
}

interface BulkUploadProps {
  eventId: string;
  onComplete?: () => void;
  onCancel?: () => void;
}

export const BulkUpload: React.FC<BulkUploadProps> = ({ eventId, onComplete, onCancel }) => {
  const [files, setFiles] = useState<FileWithStatus[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const addFiles = (newFiles: File[]) => {
    const mapped = newFiles.map(f => ({
      id: Math.random().toString(36).substring(2, 9),
      file: f,
      preview: URL.createObjectURL(f),
      status: 'pending' as const,
      progress: 0,
      watermark: true
    }));
    setFiles(prev => [...prev, ...mapped]);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    addFiles(droppedFiles);
  }, []);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const filtered = prev.filter(f => f.id !== id);
      const removed = prev.find(f => f.id === id);
      if (removed) URL.revokeObjectURL(removed.preview);
      return filtered;
    });
  };

  const startUpload = async () => {
    if (files.length === 0 || isUploading) return;
    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      if (f.status === 'success') continue;

      setFiles(prev => prev.map(item => item.id === f.id ? { ...item, status: 'uploading' } : item));

      const formData = new FormData();
      formData.append('file', f.file);
      formData.append('eventId', eventId);
      formData.append('watermark', String(f.watermark));

      try {
        await API.post(`/phygital/upload-bulk`, formData, {
          onUploadProgress: (progressEvent) => {
            const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
            setFiles(prev => prev.map(item => item.id === f.id ? { ...item, progress: percent } : item));
          }
        });
        setFiles(prev => prev.map(item => item.id === f.id ? { ...item, status: 'success', progress: 100 } : item));
      } catch (err: any) {
        setFiles(prev => prev.map(item => item.id === f.id ? { ...item, status: 'error', error: err.response?.data?.error || 'Erro no upload' } : item));
      }
    }

    setIsUploading(false);
    if (onComplete) onComplete();
  };

  return (
    <div className="flex flex-col h-full bg-theme-bg">
      {/* Upload Area */}
      <div 
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative flex-1 flex flex-col items-center justify-center border-2 border-dashed transition-all cursor-pointer p-10 m-6 rounded-3xl ${isDragging ? 'border-brand-tactical bg-brand-tactical/10' : 'border-theme-border/40 hover:border-brand-tactical/60 hover:bg-brand-tactical/5'}`}
      >
        <input 
          type="file" 
          ref={inputRef} 
          className="hidden" 
          multiple 
          accept="image/*" 
          onChange={(e) => addFiles(Array.from(e.target.files || []))}
        />
        <div className="w-16 h-16 bg-brand-tactical/10 rounded-2xl flex items-center justify-center mb-6">
          <Upload className="text-brand-tactical" size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic tracking-tighter text-theme-text mb-2">Upload em Lote</h3>
        <p className="text-[10px] font-black text-theme-muted uppercase tracking-widest text-center max-w-xs leading-relaxed italic opacity-60">
          Arraste suas fotos aqui ou clique para selecionar. 
          <br/>Proteção automática ativada.
        </p>
      </div>

      {/* Files List */}
      {files.length > 0 && (
        <div className="px-6 pb-6">
          <div className="flex items-center justify-between mb-4 px-2">
            <span className="text-[10px] font-black text-brand-tactical uppercase tracking-widest italic">{files.length} arquivos selecionados</span>
            <button onClick={() => setFiles([])} className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline italic">Limpar tudo</button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {files.map(f => (
                <motion.div 
                  key={f.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative group aspect-square bg-theme-bg-muted border border-theme-border/60 overflow-hidden rounded-xl"
                >
                  <img src={f.preview} alt="preview" className="w-full h-full object-cover" />
                  
                  {/* Status Overlay */}
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    {f.status === 'pending' && (
                      <button onClick={(e) => { e.stopPropagation(); removeFile(f.id); }} className="p-2 bg-red-500 text-white rounded-full">
                        <X size={16} />
                      </button>
                    )}
                  </div>

                  {f.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-2">
                      <Loader2 className="text-brand-tactical animate-spin mb-2" size={20} />
                      <div className="w-full bg-white/20 h-1 rounded-full overflow-hidden">
                        <div className="bg-brand-tactical h-full transition-all duration-300" style={{ width: `${f.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {f.status === 'success' && (
                    <div className="absolute top-2 right-2 p-1 bg-emerald-500 text-white rounded-full shadow-lg animate-in zoom-in">
                      <CheckCircle2 size={12} />
                    </div>
                  )}

                  {f.status === 'error' && (
                    <div className="absolute inset-0 bg-red-500/80 flex flex-col items-center justify-center p-2 text-center">
                      <AlertCircle className="text-white mb-1" size={20} />
                      <span className="text-[8px] font-black text-white uppercase">{f.error}</span>
                    </div>
                  )}

                  {/* Watermark Tag */}
                  <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-md rounded-md flex items-center gap-1 border border-white/10">
                    <ShieldCheck size={10} className="text-brand-tactical" />
                    <span className="text-[8px] font-black text-white uppercase italic">Shield</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={onCancel}
              disabled={isUploading}
              className="flex-1 py-4 border border-theme-border text-theme-text-muted text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all italic rounded-2xl"
            >
              Cancelar
            </button>
            <button 
              onClick={startUpload}
              disabled={isUploading || files.every(f => f.status === 'success')}
              className="flex-[2] py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-[0.3em] shadow-lg shadow-brand-tactical/20 hover:brightness-110 active:scale-[0.98] transition-all italic rounded-2xl disabled:opacity-40"
            >
              {isUploading ? 'ENVIANDO...' : 'INICIAR UPLOAD'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

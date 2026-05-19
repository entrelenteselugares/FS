import { useState, useEffect, useCallback } from 'react';
import { API } from '../../lib/api';
import { X, RefreshCw, Printer, CheckCircle, Clock } from 'lucide-react';

interface PrintJob {
  id: string;
  referenceCode: string;
  imageUrl: string;
  customerName: string;
  customerPhone: string;
  status: 'PENDING_PRINT' | 'PRINTED' | 'FAILED';
  createdAt: string;
}

interface Props {
  eventId: string;
  eventTitle: string;
  onClose: () => void;
}

export default function AdminPhygitalQueue({ eventId, eventTitle, onClose }: Props) {
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchJobs = useCallback(async () => {
    try {
      const { data } = await API.get(`/admin/phygital/all?eventId=${eventId}`);
      if (data.success) {
        setJobs(data.prints);
      }
    } catch (error) {
      console.error('Erro ao buscar fila:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchJobs();
    let interval: ReturnType<typeof setInterval> | null = null;
    if (autoRefresh) {
      interval = setInterval(fetchJobs, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchJobs, autoRefresh]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-end bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl h-screen bg-theme-bg border-l border-theme-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-500">
        {/* Header */}
        <div className="p-8 border-b border-theme-border flex items-center justify-between">
          <div>
            <h2 className="text-xl font-black text-theme-text uppercase tracking-tighter">Radar Phygital</h2>
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1 italic">{eventTitle}</p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg border transition-all ${autoRefresh ? 'bg-brand-tactical/10 border-brand-tactical text-brand-tactical' : 'border-theme-border text-zinc-500'}`}
              title="Atualização Automática"
            >
              <RefreshCw size={18} className={autoRefresh ? 'animate-spin' : ''} style={{ animationDuration: '3s' }} />
            </button>
            <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6">
          {loading && jobs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-4">
              <RefreshCw className="animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando Fila...</p>
            </div>
          ) : jobs.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-zinc-500 gap-4 border-2 border-dashed border-theme-border rounded-2xl">
              <Printer size={40} className="opacity-20" />
              <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Nenhuma foto enviada ainda.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {jobs.map((job) => (
                <div key={job.id} className="bg-white/[0.02] border border-theme-border rounded-2xl overflow-hidden flex gap-6 p-4 hover:border-brand-tactical/30 transition-all group">
                  {/* Miniatura */}
                  <div className="w-24 h-24 bg-theme-card rounded-xl overflow-hidden flex-shrink-0 border border-theme-border relative">
                    <img src={job.imageUrl} alt="Print" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    <div className="absolute top-1 right-1 bg-black/80 px-2 py-0.5 rounded text-[8px] font-black text-brand-tactical uppercase">
                      {job.referenceCode}
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[12px] font-black text-theme-text uppercase tracking-tight">{job.customerName}</span>
                      {job.status === 'PRINTED' ? (
                        <div className="flex items-center gap-1.5 text-brand-tactical">
                          <CheckCircle size={12} />
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest">Impresso</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-amber-500">
                          <Clock size={12} className="animate-pulse" />
                          <span className="text-[8px] md:text-[9px] font-black uppercase tracking-wider md:tracking-widest">Na Fila</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] text-zinc-500 font-bold mb-3">{job.customerPhone}</p>
                    
                    <div className="flex items-center gap-4">
                       <span className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">
                        {new Date(job.createdAt).toLocaleTimeString('pt-BR')}
                       </span>
                       <a 
                        href={job.imageUrl} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-[9px] font-black text-brand-tactical uppercase tracking-widest hover:underline"
                       >
                        Ver Original
                       </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-8 border-t border-theme-border bg-zinc-900/30">
          <div className="flex justify-between items-center">
            <div className="text-center">
              <span className="text-[24px] font-black text-theme-text">{jobs.length}</span>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block">Total Enviado</span>
            </div>
            <div className="text-center" style={{ minWidth: '80px' }}>
              <span className="text-[24px] font-black text-brand-tactical">{jobs.filter(j => j.status === 'PRINTED').length}</span>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block">Impressas</span>
            </div>
            <div className="text-center">
              <span className="text-[24px] font-black text-amber-500">{jobs.filter(j => j.status === 'PENDING_PRINT').length}</span>
              <span className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] block">Pendente</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle, CheckCircle2, Package, Truck, Printer } from 'lucide-react';
import { API as api } from '../lib/api';

interface Batch {
  id: string;
  month: string;
  photos: string[];
  status: 'DRAFT' | 'SUBMITTED' | 'IN_PRODUCTION' | 'PRINTED' | 'SHIPPED';
  createdAt: string;
  user: {
    nome: string;
    email: string;
    address?: string;
  };
}

export const SanfonaPrintQueue: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const res = await api.get('/franchise/sanfona-queue');
      setBatches(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBatches();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await api.patch(`/franchise/sanfona-queue/${id}`, { status: newStatus });
      setBatches(prev => prev.map(b => b.id === id ? { ...b, status: newStatus as any } : b));
    } catch (err) {
      console.error(err);
      alert("Erro ao atualizar status.");
    }
  };

  const handleDownloadZip = (batch: Batch) => {
    // Download occurs via browser navigation to the authenticated endpoint
    // To handle auth cleanly without exposing token in URL, we could fetch as Blob
    // Let's use standard link approach if token is stored in cookies, 
    // or fetch as Blob if token is in headers. The API uses bearer token.
    api.get(`/franchise/sanfona-queue/${batch.id}/download`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `album_sanfona_${batch.user.nome}_${batch.month}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        // Assume production
        handleUpdateStatus(batch.id, 'IN_PRODUCTION');
      })
      .catch((err) => {
        console.error(err);
        alert("Erro ao baixar ZIP.");
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="animate-spin text-brand-tactical" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-heading font-bold uppercase tracking-widest text-theme-text flex items-center gap-2">
            <Package size={20} className="text-brand-tactical" /> Fila do Álbum Sanfona
          </h2>
          <p className="text-[10px] text-theme-muted font-bold uppercase tracking-[0.2em] mt-1">
            Gestão de Lotes Mensais
          </p>
        </div>
        <button onClick={fetchBatches} className="p-2 border border-theme-border rounded hover:bg-theme-bg-muted transition-colors text-theme-muted hover:text-theme-text">
          <RefreshCw size={16} />
        </button>
      </div>

      {batches.length === 0 ? (
        <div className="bg-theme-bg-muted border border-theme-border p-8 rounded-2xl flex flex-col items-center justify-center text-center space-y-4">
          <AlertCircle size={32} className="text-theme-muted opacity-50" />
          <p className="text-xs font-bold text-theme-muted uppercase tracking-widest">Nenhum lote pendente</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {batches.map(batch => (
            <div key={batch.id} className="bg-theme-bg border border-theme-border p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-6 md:items-center justify-between group hover:border-brand-tactical/30 transition-all shadow-sm hover:shadow-md">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase text-theme-text bg-theme-bg-muted px-2 py-1 rounded">
                    LOTE {batch.month}
                  </span>
                  <span className={`text-[9px] font-bold px-2 py-1 uppercase tracking-widest rounded ${
                    batch.status === 'SUBMITTED' ? 'bg-brand-warning/10 text-brand-warning' :
                    batch.status === 'IN_PRODUCTION' ? 'bg-brand-info/10 text-brand-info' :
                    batch.status === 'PRINTED' ? 'bg-purple-500/10 text-purple-500' :
                    'bg-brand-tactical/10 text-brand-tactical'
                  }`}>
                    {batch.status}
                  </span>
                </div>
                <h3 className="font-bold text-sm text-theme-text uppercase">{batch.user.nome}</h3>
                <p className="text-[10px] text-theme-muted uppercase tracking-widest">{batch.user.email}</p>
                <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-2 bg-theme-bg-muted p-2 border border-theme-border/50 rounded inline-block">
                  <span className="opacity-50">ENTREGA:</span> {batch.user.address || 'Retirada na Loja'}
                </p>
              </div>

              <div className="flex flex-col gap-2 min-w-[200px]">
                {batch.status === 'SUBMITTED' && (
                  <button onClick={() => handleDownloadZip(batch)} className="flex items-center justify-center gap-2 bg-brand-tactical text-zinc-950 font-bold text-[10px] uppercase tracking-widest py-3 px-4 rounded-lg hover:scale-105 transition-all w-full">
                    <Download size={14} /> Baixar ZIP e Assumir
                  </button>
                )}
                {batch.status === 'IN_PRODUCTION' && (
                  <button onClick={() => handleUpdateStatus(batch.id, 'PRINTED')} className="flex items-center justify-center gap-2 bg-brand-info text-white font-bold text-[10px] uppercase tracking-widest py-3 px-4 rounded-lg hover:bg-brand-info transition-all w-full">
                    <Printer size={14} /> Marcar como Impresso
                  </button>
                )}
                {batch.status === 'PRINTED' && (
                  <button onClick={() => handleUpdateStatus(batch.id, 'SHIPPED')} className="flex items-center justify-center gap-2 bg-purple-500 text-white font-bold text-[10px] uppercase tracking-widest py-3 px-4 rounded-lg hover:bg-purple-600 transition-all w-full">
                    <Truck size={14} /> Marcar como Enviado
                  </button>
                )}
                {batch.status === 'SHIPPED' && (
                  <div className="flex items-center justify-center gap-2 text-brand-tactical font-bold text-[10px] uppercase tracking-widest py-3 px-4 bg-brand-tactical/10 rounded-lg w-full">
                    <CheckCircle2 size={14} /> Concluído
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

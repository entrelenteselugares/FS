import { useState } from "react";
import { Upload, X, ArrowRight, MapPin, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { API } from "../lib/api";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export function AlbumSanfonaFlow() {
  const { user } = useAuth();
  const [files, setFiles] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      if (files.length + selected.length > 10) {
        alert("O limite é de 10 fotos por mês.");
        return;
      }
      setFiles(prev => [...prev, ...selected]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (files.length !== 10) {
      toast.error("Por favor, selecione exatamente 10 fotos para o seu álbum sanfona.");
      return;
    }
    setIsSubmitting(true);
    
    try {
      const uploadedUrls: string[] = [];
      const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

      // 1. Faz upload das fotos pro Supabase Storage
      for (const file of files) {
        const fileExt = file.name.split(".").pop();
        const fileName = `${user?.id}/${currentMonth}/${Math.random().toString(36).substring(2)}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from("sanfona-uploads")
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from("sanfona-uploads")
          .getPublicUrl(fileName);

        uploadedUrls.push(publicUrl);
      }

      // 2. Envia as URLs pro Backend
      await API.post("/sanfona/submit-batch", { photos: uploadedUrls });
      
      toast.success("Fotos enviadas com sucesso! Seu álbum já está na fila de impressão.");
      setSuccess(true);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.error || "Erro ao enviar fotos. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-6 bg-theme-bg/60 border border-white/5 rounded-2xl">
        <div className="p-4 bg-brand-tactical/20 rounded-full">
          <CheckCircle2 size={48} className="text-brand-tactical" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-heading font-black uppercase text-theme-text">Álbum em Produção!</h2>
          <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest">
            Suas fotos foram recebidas. O álbum será impresso e enviado para sua casa em breve.
          </p>
        </div>
        <button 
          onClick={() => { setSuccess(false); setFiles([]); }}
          className="px-6 py-3 border border-theme-border text-gray-800 text-[10px] font-bold uppercase tracking-widest hover:bg-white/5 transition-all"
        >
          Voltar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <h2 className="text-2xl font-heading font-black uppercase text-theme-text">Envio do Álbum Sanfona</h2>
        <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest">
          Selecione as 10 fotos que farão parte do seu álbum deste mês.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-4">
          <div className="border-2 border-dashed border-theme-border rounded-2xl p-8 flex flex-col items-center justify-center text-center space-y-4 bg-theme-bg/30 hover:border-brand-tactical/50 transition-colors">
            <div className="p-4 bg-theme-bg rounded-xl shadow-lg border border-white/5">
              <Upload size={24} className="text-brand-tactical" />
            </div>
            <div>
              <p className="text-sm font-bold text-theme-text uppercase tracking-widest">
                Clique para selecionar fotos
              </p>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-1">
                {files.length} de 10 fotos selecionadas
              </p>
            </div>
            <input 
              type="file" 
              multiple 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 pointer-events-none cursor-pointer"
            />
          </div>

          {files.length > 0 && (
            <div className="grid grid-cols-5 gap-4">
              {files.map((file, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden group bg-theme-bg-muted border border-white/5">
                  <img 
                    src={URL.createObjectURL(file)} 
                    alt={`Preview ${i}`} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                  />
                  <button 
                    onClick={() => removeFile(i)}
                    className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg text-white hover:bg-brand-danger transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-theme-bg border border-white/5 rounded-2xl space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-white/5">
              <MapPin size={16} className="text-brand-tactical" />
              <h3 className="text-[11px] font-bold text-theme-text uppercase tracking-widest">Endereço de Entrega</h3>
            </div>
            <div className="space-y-1">
              <p className="text-xs text-theme-muted">{user?.endereco}, {user?.numero}</p>
              {user?.complemento && <p className="text-xs text-theme-muted">{user?.complemento}</p>}
              <p className="text-xs text-theme-muted">{user?.bairro} - {user?.cidade}/{user?.estado}</p>
              <p className="text-xs text-theme-muted">CEP: {user?.cep}</p>
            </div>
          </div>

          <button 
            onClick={handleSubmit}
            disabled={files.length !== 10 || isSubmitting}
            className={`w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-[11px] font-bold uppercase tracking-[0.2em] transition-all duration-300 ${
              files.length === 10 && !isSubmitting
                ? "bg-brand-tactical text-brand-text hover:brightness-110 shadow-[0_0_20px_rgba(133,185,172,0.2)]" 
                : "bg-theme-bg-muted text-theme-muted cursor-not-allowed"
            }`}
          >
            {isSubmitting ? <><Loader2 className="animate-spin" size={16} /> Enviando...</> : <>Confirmar Envio <ArrowRight size={14} /></>}
          </button>
        </div>
      </div>
    </div>
  );
}

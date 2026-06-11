import React, { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Check, X } from "lucide-react";
import Cropper from "react-easy-crop";
import { API } from "../lib/api";
import { toast } from "sonner";
import getCroppedImg from "../utils/cropImage";
interface ProfilePhotoUploadProps {
  currentProfileUrl?: string | null;
  currentNome?: string | null;
  onProfileUpdated: (newUrl: string) => void;
}

export const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ currentProfileUrl, currentNome, onProfileUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentProfileUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 20MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setImageToCrop(reader.result as string);
    };
    reader.readAsDataURL(file);
    
    // Clear input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const onCropComplete = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCropSave = async () => {
    if (!imageToCrop || !croppedAreaPixels) return;

    setUploading(true);
    try {
      const croppedBase64 = await getCroppedImg(imageToCrop, croppedAreaPixels);
      if (!croppedBase64) throw new Error("Erro ao gerar recorte");

      setPreview(croppedBase64); // Show optimistic preview
      setImageToCrop(null); // Close modal

      const { data } = await API.post("/auth/profile-photo", {
        imageBase64: croppedBase64,
        mimeType: "image/jpeg"
      });
      
      onProfileUpdated(data.profileImageUrl);
      toast.success("Foto de perfil atualizada!");
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      toast.error("Erro ao enviar foto: " + (axiosErr.response?.data?.error || (err instanceof Error ? err.message : "Erro desconhecido")));
    } finally {
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <div className="flex flex-col md:flex-row items-center gap-6 w-full">
        <div className="relative group shrink-0">
          <div 
            onClick={triggerUpload}
            className="w-24 h-24 rounded-full border-2 border-brand-tactical overflow-hidden bg-theme-bg flex items-center justify-center text-3xl font-bold text-theme-text cursor-pointer relative"
          >
            {preview ? (
              <img src={preview} alt="Foto de Perfil" className="w-full h-full object-cover" />
            ) : (
              currentNome ? currentNome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2) : "FS"
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Upload className="w-6 h-6 text-white" />
            </div>
          </div>
          {uploading && (
            <div className="absolute inset-0 bg-theme-bg/85 rounded-full flex items-center justify-center pointer-events-none">
              <div className="w-6 h-6 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
        
        <div className="space-y-2 text-center md:text-left">
          <h4 className="text-[12px] font-bold text-theme-text uppercase tracking-wider ">Foto de Identificação (Avatar)</h4>
          <p className="text-[9px] text-theme-muted uppercase font-bold tracking-widest leading-relaxed">
            Aparecerá nos cards menores e comentários.
          </p>
          <button
            onClick={triggerUpload}
            disabled={uploading}
            className="inline-block mt-2 fs-btn bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[9px] font-bold uppercase tracking-widest hover:bg-brand-tactical hover:text-brand-text transition-all cursor-pointer py-2 px-4 rounded"
          >
            {uploading ? "ENVIANDO..." : "CARREGAR FOTO"}
          </button>
        </div>
      </div>

      {/* Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-md bg-theme-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-theme-border">
              <h3 className="font-heading font-bold text-theme-text uppercase">Ajustar Foto</h3>
              <button onClick={() => setImageToCrop(null)} className="text-theme-text/50 hover:text-theme-text">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative w-full h-[400px] bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            
            <div className="p-4 bg-theme-surface border-t border-theme-border flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <span className="text-xs text-theme-text/60 font-bold uppercase">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.01}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(parseFloat(e.target.value))}
                  className="w-full accent-brand-tactical"
                />
              </div>
              
              <div className="flex gap-3 mt-2">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="flex-1 py-2 rounded-lg font-bold text-sm bg-theme-bg text-theme-text border border-theme-border uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploading}
                  className="flex-1 py-2 rounded-lg font-bold text-sm bg-brand-tactical text-black uppercase flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

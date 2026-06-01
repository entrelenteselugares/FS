import React, { useState, useRef, useCallback } from "react";
import { Upload, Loader2, Check, X, Image as ImageIcon } from "lucide-react";
import Cropper from "react-easy-crop";
import { API } from "../lib/api";
import { toast } from "sonner";
import getCroppedImg from "../utils/cropImage";

interface CoverPhotoUploadProps {
  currentCoverUrl?: string | null;
  onCoverUpdated: (newUrl: string) => void;
}

export const CoverPhotoUpload: React.FC<CoverPhotoUploadProps> = ({ currentCoverUrl, onCoverUpdated }) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentCoverUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop states
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB");
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

      const { data } = await API.post("/auth/cover-photo", {
        imageBase64: croppedBase64,
        mimeType: "image/jpeg"
      });
      
      onCoverUpdated(data.coverImageUrl);
      toast.success("Foto de capa atualizada!");
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
      <div className="flex flex-col items-start gap-4 w-full">
        <div className="relative group w-full h-40 bg-theme-bg-muted rounded-2xl overflow-hidden border border-theme-border/20 cursor-pointer" onClick={triggerUpload}>
          {preview ? (
            <img src={preview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-theme-muted gap-2">
              <ImageIcon className="w-8 h-8 opacity-50" />
              <span className="text-[10px] font-black uppercase tracking-widest italic">Adicionar Capa (Panorâmica)</span>
            </div>
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-2">
            <Upload className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Alterar Foto de Capa</span>
          </div>
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </div>

      {/* Crop Modal */}
      {imageToCrop && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-3xl bg-theme-surface rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="flex justify-between items-center p-4 border-b border-theme-border">
              <h3 className="font-heading font-black italic text-theme-text uppercase">Ajustar Foto de Capa</h3>
              <button onClick={() => setImageToCrop(null)} className="text-theme-text/50 hover:text-theme-text">
                <X size={20} />
              </button>
            </div>
            
            <div className="relative w-full h-[50vh] min-h-[300px] bg-black">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                aspect={3 / 1} // Panorâmica
                cropShape="rect"
                showGrid={true}
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
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-brand-tactical"
                />
              </div>
              
              <div className="flex gap-3 mt-2 justify-end">
                <button
                  onClick={() => setImageToCrop(null)}
                  className="px-6 py-2 rounded-lg font-bold text-sm bg-theme-bg text-theme-text border border-theme-border uppercase"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCropSave}
                  disabled={uploading}
                  className="px-8 py-2 rounded-lg font-bold text-sm bg-brand-tactical text-black uppercase flex items-center justify-center gap-2"
                >
                  {uploading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  Salvar Capa
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

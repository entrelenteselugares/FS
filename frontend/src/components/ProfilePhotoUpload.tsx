import React, { useState, useRef } from "react";
import { Camera, Upload, Check, Loader2, X } from "lucide-react";
import { API } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { toast } from "sonner";

export const ProfilePhotoUpload: React.FC = () => {
  const { user, updateMe } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(user?.profileImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A foto deve ter no máximo 5MB");
      return;
    }

    // Preview local
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload real
    setUploading(true);
    try {
      const base64Reader = new FileReader();
      base64Reader.readAsDataURL(file);
      base64Reader.onloadend = async () => {
        const base64Data = base64Reader.result as string;
        
        try {
          const { data } = await API.post("/auth/profile-photo", {
            imageBase64: base64Data,
            mimeType: file.type
          });
          
          await updateMe({ profileImageUrl: data.profileImageUrl });
          toast.success("Foto de perfil atualizada!");
        } catch (err: any) {
          toast.error("Erro ao enviar foto: " + (err.response?.data?.error || err.message));
        } finally {
          setUploading(false);
        }
      };
    } catch (err) {
      console.error(err);
      setUploading(false);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative group">
        <div 
          onClick={triggerUpload}
          className="w-24 h-24 rounded-full border-4 border-primary/20 overflow-hidden cursor-pointer hover:border-primary transition-all relative bg-muted flex items-center justify-center"
        >
          {preview ? (
            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <Camera className="w-8 h-8 text-muted-foreground" />
          )}
          
          {uploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-white animate-spin" />
            </div>
          )}
          
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
          </div>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleFileChange} 
          accept="image/*" 
          className="hidden" 
        />
      </div>
      
      <p className="text-xs text-muted-foreground">
        Clique para alterar sua foto de perfil
      </p>
    </div>
  );
};

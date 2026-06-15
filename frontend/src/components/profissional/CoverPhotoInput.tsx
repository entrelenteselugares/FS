import { useState, useRef } from "react";
import { ImageIcon, Link as LinkIcon, Upload, X, Loader2 } from "lucide-react";
import { API } from "../../lib/api";

interface CoverPhotoInputProps {
  /** URL atual da capa (para preview inicial no modo edição) */
  currentUrl?: string | null;
  /** Posição atual da capa (object-position) */
  currentPosition?: string | null;
  /** Chamado quando a URL da capa muda (URL resolvida ou null para remover) */
  onChange: (url: string | null) => void;
  /** Chamado quando a posição muda */
  onPositionChange?: (pos: string) => void;
  /** ID do evento para upload direto (opcional — se ausente, retorna base64 via onChange) */
  eventId?: string;
}

type Mode = "idle" | "url" | "upload";

export function CoverPhotoInput({ currentUrl, currentPosition, onChange, onPositionChange, eventId }: CoverPhotoInputProps) {
  const [mode, setMode] = useState<Mode>("idle");
  const [urlInput, setUrlInput] = useState("");
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Converte link de compartilhamento do Google Drive para thumbnail direto
  const normalizeDriveUrl = (url: string): string => {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match) return `https://drive.google.com/thumbnail?id=${match[1]}&sz=w1200`;
    return url;
  };

  const handleUrlConfirm = () => {
    if (!urlInput.trim()) return;
    const resolved = normalizeDriveUrl(urlInput.trim());
    setPreview(resolved);
    onChange(resolved);
    setMode("idle");
    setUrlInput("");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Compress the image before creating Base64 to avoid 413 Payload Too Large
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    
    img.onload = async () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      
      const MAX_SIZE = 1200;
      if (width > height) {
        if (width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
      setPreview(compressedBase64);

      if (eventId) {
        // Upload direto para o Supabase via backend
        setUploading(true);
        try {
          const { data } = await API.patch(`/profissional/events/${eventId}/cover`, {
            imageBase64: compressedBase64,
            mimeType: 'image/jpeg',
          });
          setPreview(data.coverPhotoUrl);
          onChange(data.coverPhotoUrl);
        } catch (err) {
          console.error("Erro no upload de capa:", err);
          onChange(compressedBase64);
        } finally {
          setUploading(false);
        }
      } else {
        // Sem eventId: passa o base64 para o pai cuidar (criação)
        onChange(compressedBase64);
      }
    };
    
    img.onerror = () => URL.revokeObjectURL(objectUrl);
    img.src = objectUrl;
    
    setMode("idle");
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-4">
      <label className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.4em] flex items-center gap-2 opacity-60">
        <ImageIcon size={14} /> Capa do Evento (Marketplace)
      </label>

      {/* Preview da capa atual */}
      {preview && (
        <div className="relative group rounded-3xl overflow-hidden shadow-2xl border border-brand-tactical/20">
          <img
            src={preview}
            alt="Capa"
            className="w-full h-48 object-cover transition-transform duration-1000 group-hover:scale-105"
            style={{ objectPosition: currentPosition || "center" }}
            onError={() => setPreview(null)}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
              <Loader2 size={32} className="text-brand-tactical animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-zinc-100 p-2 rounded-full opacity-0 pointer-events-none group-hover:opacity-100 transition-all hover:text-brand-danger shadow-xl"
          >
            <X size={18} />
          </button>

          {/* Seletor de Posição flutuante */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/60 backdrop-blur-md p-2 rounded-full border border-white/10 opacity-0 pointer-events-none group-hover:opacity-100 transition-all">
            {[
              { id: 'top', label: 'Superior' },
              { id: 'center', label: 'Centro' },
              { id: 'bottom', label: 'Inferior' }
            ].map(pos => (
              <button
                key={pos.id}
                type="button"
                onClick={() => onPositionChange?.(pos.id)}
                className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full transition-all ${currentPosition === pos.id || (!currentPosition && pos.id === 'center') ? "bg-brand-tactical text-brand-text" : "text-brand-text hover:bg-white/10"}`}
              >
                {pos.label}
              </button>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Botões de modo */}
      {!preview && mode === "idle" && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="flex-1 h-20 border border-theme-border text-theme-muted hover:border-brand-tactical/50 hover:text-brand-tactical transition-all flex flex-col items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-theme-bg-muted rounded-[30px]"
          >
            <LinkIcon size={18} /> Link / Drive
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 h-20 border border-theme-border text-theme-muted hover:border-brand-tactical/50 hover:text-brand-tactical transition-all flex flex-col items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest bg-theme-bg-muted rounded-[30px]"
          >
            <Upload size={18} /> Upload
          </button>
        </div>
      )}

      {/* Modo URL */}
      {mode === "url" && (
        <div className="flex gap-2">
          <input
            autoFocus
            type="url"
            placeholder="https://drive.google.com/... ou URL direta"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleUrlConfirm()}
            className="flex-1 bg-theme-bg-muted border border-brand-tactical/40 p-5 text-theme-text text-[11px] font-bold uppercase outline-none focus:border-brand-tactical rounded-2xl"
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="px-8 bg-brand-tactical text-zinc-950 text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all rounded-2xl"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="px-4 border border-theme-border text-theme-muted hover:text-theme-text transition-all rounded-2xl"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Botão de trocar capa quando já tem preview */}
      {preview && !uploading && (
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="flex-1 py-4 border border-theme-border text-theme-muted hover:border-brand-tactical/50 hover:text-brand-tactical transition-all text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl"
          >
            <LinkIcon size={14} /> TROCAR LINK
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-4 border border-theme-border text-theme-muted hover:border-brand-tactical/50 hover:text-brand-tactical transition-all text-[9px] font-bold uppercase tracking-widest flex items-center justify-center gap-2 rounded-xl"
          >
            <Upload size={14} /> TROCAR ARQUIVO
          </button>
        </div>
      )}

      {/* Input de arquivo oculto */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <p className="text-[10px] text-theme-muted uppercase font-bold tracking-[0.2em] opacity-40 text-center leading-relaxed">
        ACEITA LINK DO GOOGLE DRIVE, DROPBOX OU IMAGEM DIRETA · JPG, PNG, WEBP
      </p>
    </div>
  );
}

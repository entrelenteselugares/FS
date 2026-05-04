import { useState, useRef } from "react";
import { ImageIcon, Link as LinkIcon, Upload, X, Loader2 } from "lucide-react";
import { API } from "../../lib/api";

interface CoverPhotoInputProps {
  /** URL atual da capa (para preview inicial no modo edição) */
  currentUrl?: string | null;
  /** Chamado quando a URL da capa muda (URL resolvida ou null para remover) */
  onChange: (url: string | null) => void;
  /** ID do evento para upload direto (opcional — se ausente, retorna base64 via onChange) */
  eventId?: string;
}

type Mode = "idle" | "url" | "upload";

export function CoverPhotoInput({ currentUrl, onChange, eventId }: CoverPhotoInputProps) {
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

    // Preview local imediato
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);

      if (eventId) {
        // Upload direto para o Supabase via backend
        setUploading(true);
        try {
          const { data } = await API.patch(`/profissional/events/${eventId}/cover`, {
            imageBase64: base64,
            mimeType: file.type,
          });
          setPreview(data.coverPhotoUrl);
          onChange(data.coverPhotoUrl);
        } catch (err) {
          console.error("Erro no upload de capa:", err);
          // Mantém o preview local mesmo se falhar o upload
          onChange(base64);
        } finally {
          setUploading(false);
        }
      } else {
        // Sem eventId: passa o base64 para o pai cuidar (criação)
        onChange(base64);
      }
    };
    reader.readAsDataURL(file);
    setMode("idle");
  };

  const handleRemove = () => {
    setPreview(null);
    onChange(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic flex items-center gap-2">
        <ImageIcon size={12} /> Capa do Evento (Marketplace)
      </label>

      {/* Preview da capa atual */}
      {preview && (
        <div className="relative group">
          <img
            src={preview}
            alt="Capa"
            className="w-full h-40 object-cover border border-cyan-400/30"
            onError={() => setPreview(null)}
          />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/60">
              <Loader2 size={24} className="text-cyan-400 animate-spin" />
            </div>
          )}
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-black/70 text-white p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
          >
            <X size={14} />
          </button>
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
        </div>
      )}

      {/* Botões de modo */}
      {!preview && mode === "idle" && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="flex-1 h-14 border border-dashed border-theme-border text-theme-muted hover:border-cyan-400/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <LinkIcon size={14} /> Link / Drive
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 h-14 border border-dashed border-theme-border text-theme-muted hover:border-cyan-400/50 hover:text-cyan-400 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
          >
            <Upload size={14} /> Upload
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
            className="flex-1 bg-theme-bg-muted border border-cyan-400/40 p-3 text-theme-text text-xs outline-none focus:border-cyan-400/70 transition-all"
          />
          <button
            type="button"
            onClick={handleUrlConfirm}
            className="px-4 bg-cyan-400 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
          >
            OK
          </button>
          <button
            type="button"
            onClick={() => setMode("idle")}
            className="px-3 border border-theme-border text-theme-muted hover:text-theme-text transition-all"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* Botão de trocar capa quando já tem preview */}
      {preview && !uploading && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setMode("url")}
            className="flex-1 py-2 border border-theme-border text-theme-muted hover:border-cyan-400/50 hover:text-cyan-400 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
          >
            <LinkIcon size={10} /> Trocar Link
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex-1 py-2 border border-theme-border text-theme-muted hover:border-cyan-400/50 hover:text-cyan-400 transition-all text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
          >
            <Upload size={10} /> Trocar Arquivo
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

      <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest opacity-60">
        Aceita link do Google Drive, Dropbox ou imagem direta · JPG, PNG, WebP
      </p>
    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import {
  Camera, Plus, Image as ImageIcon, Trash2, EyeOff, Eye, ChevronDown, ChevronRight, X, Loader2, AlertTriangle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

interface AlbumImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  watermarkedUrl?: string | null;
  isHidden: boolean;
}

interface Album {
  id: string;
  title: string;
  description?: string | null;
  category?: string | null;
  coverUrl?: string | null;
  images?: AlbumImage[];
}

interface PortfolioManageProps {
  isTab?: boolean;
}

// ── Confirmation modal ─────────────────────────────────────────────────
function ConfirmModal({
  message, onConfirm, onCancel
}: { message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-sm bg-theme-surface border border-red-500/20 rounded-2xl p-4 md:p-8 space-y-6"
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center text-red-500">
            <AlertTriangle size={24} />
          </div>
          <p className="text-sm text-theme-text font-bold">{message}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 border border-theme-border rounded-xl text-[10px] font-bold uppercase tracking-widest text-theme-muted hover:text-theme-text transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 rounded-xl text-[10px] font-bold uppercase tracking-widest text-white hover:bg-red-600 transition-all"
          >
            Confirmar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function PortfolioManage({ isTab = false }: PortfolioManageProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", category: "" });
  const [uploading, setUploading] = useState<string | null>(null);
  const [expandedAlbum, setExpandedAlbum] = useState<string | null>(null);
  const [processingImage, setProcessingImage] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);
  const uploadRef = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const { data: profile } = await API.get("profissional/me");
      const { data } = await API.get(`portfolio/${profile.id}/albums`);
      // Fetch full images for all albums
      const withImages = await Promise.all(
        data.map(async (album: Album) => {
          const { data: images } = await API.get(`portfolio/albums/${album.id}/images`);
          return { ...album, images };
        })
      );
      setAlbums(withImages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAlbum = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await API.post("portfolio/albums", newAlbum);
      setNewAlbum({ title: "", description: "", category: "" });
      setIsCreating(false);
      fetchAlbums();
      toast.success("Álbum criado!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao criar álbum.");
    }
  };

  const handleUpload = async (albumId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setUploading(albumId);
    const formData = new FormData();
    Array.from(e.target.files).forEach((file) => formData.append("files", file));
    try {
      await API.post(`portfolio/albums/${albumId}/upload`, formData);
      fetchAlbums();
      toast.success("Fotos enviadas com sucesso!");
    } catch (err) {
      console.error(err);
      toast.error("Erro ao enviar fotos.");
    } finally {
      setUploading(null);
    }
  };

  const handleToggleHide = async (imageId: string, currentlyHidden: boolean) => {
    setProcessingImage(imageId);
    try {
      await API.patch(`portfolio/images/${imageId}/hide`);
      setAlbums(prev => prev.map(album => ({
        ...album,
        images: album.images?.map(img =>
          img.id === imageId ? { ...img, isHidden: !currentlyHidden } : img
        ),
      })));
      toast.success(currentlyHidden ? "Foto visível na vitrine." : "Foto ocultada da vitrine.");
    } catch {
      toast.error("Erro ao alterar visibilidade.");
    } finally {
      setProcessingImage(null);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setConfirm({
      message: "Excluir esta foto permanentemente? Esta ação não pode ser desfeita.",
      onConfirm: async () => {
        setConfirm(null);
        setProcessingImage(imageId);
        try {
          await API.delete(`portfolio/images/${imageId}`);
          setAlbums(prev => prev.map(album => ({
            ...album,
            images: album.images?.filter(img => img.id !== imageId),
          })));
          toast.success("Foto excluída.");
        } catch {
          toast.error("Erro ao excluir foto.");
        } finally {
          setProcessingImage(null);
        }
      },
    });
  };

  const handleDeleteAlbum = (albumId: string, albumTitle: string) => {
    setConfirm({
      message: `Excluir o álbum "${albumTitle}" e todas as suas fotos? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirm(null);
        try {
          await API.delete(`portfolio/albums/${albumId}`);
          setAlbums(prev => prev.filter(a => a.id !== albumId));
          if (expandedAlbum === albumId) setExpandedAlbum(null);
          toast.success("Álbum excluído.");
        } catch {
          toast.error("Erro ao excluir álbum.");
        }
      },
    });
  };

  if (loading) return <div className="p-5 md:p-10 text-theme-muted">Carregando...</div>;

  return (
    <div className={isTab ? "pb-20" : "min-h-screen pb-20"} style={isTab ? {} : { background: T.bg }}>
      {confirm && (
        <ConfirmModal
          message={confirm.message}
          onConfirm={confirm.onConfirm}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Header */}
      {!isTab ? (
        <header className="pt-20 pb-10 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-tactical/10 blur-3xl rounded-full -m-64 opacity-30" />
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6">
            <div>
              <div className="w-12 h-1 bg-brand-tactical mb-6" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-theme-text uppercase whitespace-normal md:whitespace-nowrap pr-6">
                Gerenciar Portfólio
              </h1>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-4 font-bold">
                Organize seus melhores trabalhos
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="self-start px-4 md:px-6 py-2 md:py-3 bg-brand-tactical text-black text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <Plus size={14} /> Novo Álbum
            </button>
          </div>
        </header>
      ) : (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 md:gap-6 mb-8 border-b border-theme-border pb-6">
          <div>
            <h2 className="text-2xl font-heading font-bold text-theme-text uppercase tracking-widest leading-none">
              Gerenciar <span className="text-brand-tactical">Portfólio</span>
            </h2>
            <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] sm:tracking-[0.4em] mt-2">
              Organize seus melhores trabalhos para a vitrine pública
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="self-start px-4 md:px-6 py-2 md:py-3 bg-brand-tactical text-black text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all rounded-xl"
          >
            <Plus size={14} /> Novo Álbum
          </button>
        </div>
      )}

      <main className={isTab ? "py-3 md:py-6" : "max-w-[1600px] mx-auto px-4 md:px-6 py-3 md:py-6 md:py-12"}>
        {/* Create album form */}
        <AnimatePresence>
          {isCreating && (
            <motion.form
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateAlbum}
              className="bg-theme-bg border border-theme-border rounded-2xl p-3 md:p-6 mb-8 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-white uppercase tracking-widest">Criar Álbum</h2>
                <button type="button" onClick={() => setIsCreating(false)} className="text-theme-muted hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  required
                  type="text"
                  placeholder="Título do Álbum"
                  value={newAlbum.title}
                  onChange={e => setNewAlbum({ ...newAlbum, title: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-tactical"
                />
                <input
                  type="text"
                  placeholder="Categoria (Ex: Casamento, Formatura)"
                  value={newAlbum.category}
                  onChange={e => setNewAlbum({ ...newAlbum, category: e.target.value })}
                  className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white outline-none focus:border-brand-tactical"
                />
              </div>
              <textarea
                placeholder="Descrição"
                value={newAlbum.description}
                onChange={e => setNewAlbum({ ...newAlbum, description: e.target.value })}
                className="w-full bg-black border border-white/10 rounded-xl p-3 text-xs text-white h-24 outline-none focus:border-brand-tactical"
              />
              <div className="flex gap-4">
                <button type="submit" className="px-3 md:px-6 py-2 bg-brand-tactical text-black text-xs font-bold uppercase tracking-widest rounded-xl">
                  Salvar
                </button>
                <button type="button" onClick={() => setIsCreating(false)} className="px-3 md:px-6 py-2 border border-white/10 text-white text-xs font-bold uppercase tracking-widest rounded-xl">
                  Cancelar
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Albums list */}
        <div className="space-y-4">
          {albums.map((album) => {
            const isExpanded = expandedAlbum === album.id;
            const visibleCount = album.images?.filter(i => !i.isHidden).length || 0;
            const hiddenCount = album.images?.filter(i => i.isHidden).length || 0;

            return (
              <div key={album.id} className="bg-theme-card border border-theme-border rounded-2xl overflow-hidden">
                {/* Album header row */}
                <div className="flex items-center gap-4 p-4">
                  {/* Thumb */}
                  <div className="w-16 h-16 rounded-xl bg-black/50 flex-shrink-0 overflow-hidden">
                    {album.coverUrl ? (
                      <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/20">
                        <ImageIcon size={24} />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white uppercase truncate">{album.title}</h3>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      <span className="text-[9px] text-theme-muted uppercase tracking-widest">
                        {album.category || "Sem categoria"}
                      </span>
                      <span className="text-[9px] text-brand-tactical font-bold uppercase">{visibleCount} visíveis</span>
                      {hiddenCount > 0 && (
                        <span className="text-[9px] text-amber-500 font-bold uppercase">{hiddenCount} ocultas</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Upload button */}
                    <label className="cursor-pointer px-3 py-2 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[9px] font-bold uppercase tracking-widest rounded-lg flex items-center gap-1.5 hover:bg-brand-tactical hover:text-black transition-all">
                      {uploading === album.id ? (
                        <Loader2 size={12} className="animate-spin" />
                      ) : (
                        <Camera size={12} />
                      )}
                      <span className="hidden sm:inline">{uploading === album.id ? "Enviando..." : "Adicionar"}</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        disabled={!!uploading}
                        onChange={(e) => handleUpload(album.id, e)}
                        ref={el => { uploadRef.current[album.id] = el; }}
                      />
                    </label>

                    {/* Delete album */}
                    <button
                      onClick={() => handleDeleteAlbum(album.id, album.title)}
                      className="p-2 rounded-lg text-red-500/40 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      title="Excluir álbum"
                    >
                      <Trash2 size={14} />
                    </button>

                    {/* Expand toggle */}
                    <button
                      onClick={() => setExpandedAlbum(isExpanded ? null : album.id)}
                      className="p-2 rounded-lg text-theme-muted hover:text-theme-text hover:bg-theme-border/30 transition-all"
                    >
                      {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded image grid */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-theme-border p-4">
                        {(!album.images || album.images.length === 0) ? (
                          <div className="py-3 md:py-6 md:py-12 text-center text-[10px] text-theme-muted uppercase tracking-widest border  border-theme-border rounded-xl">
                            Nenhuma foto neste álbum. Clique em &quot;Adicionar&quot; para enviar.
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                            {album.images.map((img) => (
                              <div key={img.id} className={`relative group rounded-xl overflow-hidden aspect-square ${img.isHidden ? "opacity-40" : ""}`}>
                                <img
                                  src={img.thumbnailUrl || img.url}
                                  alt="Foto"
                                  className="w-full h-full object-cover"
                                />

                                {/* Hidden badge */}
                                {img.isHidden && (
                                  <div className="absolute top-1.5 left-1.5 bg-amber-500/90 text-black text-[9px] font-bold uppercase px-1.5 py-0.5 rounded tracking-widest flex items-center gap-1">
                                    <EyeOff size={8} /> Oculta
                                  </div>
                                )}

                                {/* Hover overlay */}
                                <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  {processingImage === img.id ? (
                                    <Loader2 size={20} className="text-white animate-spin" />
                                  ) : (
                                    <>
                                      {/* Toggle hide */}
                                      <button
                                        onClick={() => handleToggleHide(img.id, img.isHidden)}
                                        title={img.isHidden ? "Tornar visível" : "Ocultar da vitrine"}
                                        className="p-2 rounded-lg bg-white/10 hover:bg-amber-500/30 text-white hover:text-amber-400 transition-all"
                                      >
                                        {img.isHidden ? <Eye size={16} /> : <EyeOff size={16} />}
                                      </button>

                                      {/* Delete */}
                                      <button
                                        onClick={() => handleDeleteImage(img.id)}
                                        title="Excluir permanentemente"
                                        className="p-2 rounded-lg bg-white/10 hover:bg-red-500/30 text-white hover:text-red-400 transition-all"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}

          {albums.length === 0 && !isCreating && (
            <div className="py-20 text-center border border-white/10 rounded-2xl text-theme-muted text-xs font-bold uppercase tracking-widest">
              Nenhum álbum criado. Adicione seu primeiro trabalho ao portfólio.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

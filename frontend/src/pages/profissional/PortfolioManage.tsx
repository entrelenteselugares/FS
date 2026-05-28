import { useState, useEffect } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { Camera, Plus, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

interface AlbumImage {
  id: string;
  url: string;
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

export default function PortfolioManage({ isTab = false }: PortfolioManageProps) {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newAlbum, setNewAlbum] = useState({ title: "", description: "", category: "" });
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    fetchAlbums();
  }, []);

  const fetchAlbums = async () => {
    try {
      const { data: profile } = await API.get("profissional/me");
      const { data } = await API.get(`portfolio/${profile.id}/albums`);
      setAlbums(data);
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
    } catch (err) {
      console.error(err);
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
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(null);
    }
  };

  if (loading) return <div className="p-10 text-theme-muted">Carregando...</div>;

  return (
    <div className={isTab ? "pb-20" : "min-h-screen pb-20"} style={isTab ? {} : { background: T.bg }}>
      {!isTab ? (
        <header className="pt-20 pb-10 border-b border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-tactical/5 blur-3xl rounded-full -m-64 opacity-30" />
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="w-12 h-1 bg-brand-tactical mb-6" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-theme-text uppercase tracking-tighter whitespace-normal md:whitespace-nowrap italic pr-6">
                Gerenciar Portfólio
              </h1>
              <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-4 font-black">
                Organize seus melhores trabalhos
              </p>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="px-6 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all"
            >
              <Plus size={14} /> Novo Álbum
            </button>
          </div>
        </header>
      ) : (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-theme-border/20 pb-6">
          <div>
            <h2 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic leading-none">
              Gerenciar <span className="text-brand-tactical">Portfólio</span>
            </h2>
            <p className="text-[9px] text-theme-muted uppercase tracking-[0.2em] sm:tracking-[0.4em] italic mt-2">
              Organize seus melhores trabalhos para a vitrine pública
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            className="px-6 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110 transition-all rounded-xl"
          >
            <Plus size={14} /> Novo Álbum
          </button>
        </div>
      )}

      <main className={isTab ? "py-6" : "max-w-[1600px] mx-auto px-4 md:px-6 py-12"}>
        {isCreating && (
          <form onSubmit={handleCreateAlbum} className="bg-theme-bg border border-theme-border p-6 mb-12 space-y-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Criar Álbum</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                required
                type="text"
                placeholder="Título do Álbum"
                value={newAlbum.title}
                onChange={e => setNewAlbum({...newAlbum, title: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical"
              />
              <input
                type="text"
                placeholder="Categoria (Ex: Casamento, Formatura)"
                value={newAlbum.category}
                onChange={e => setNewAlbum({...newAlbum, category: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical"
              />
            </div>
            <textarea
              placeholder="Descrição"
              value={newAlbum.description}
              onChange={e => setNewAlbum({...newAlbum, description: e.target.value})}
              className="w-full bg-black border border-white/10 p-3 text-xs text-white h-24 outline-none focus:border-brand-tactical"
            />
            <div className="flex gap-4">
              <button type="submit" className="px-6 py-2 bg-brand-tactical text-black text-xs font-black uppercase tracking-widest">
                Salvar
              </button>
              <button type="button" onClick={() => setIsCreating(false)} className="px-6 py-2 border border-white/10 text-white text-xs font-black uppercase tracking-widest">
                Cancelar
              </button>
            </div>
          </form>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {albums.map((album) => (
            <motion.div key={album.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-theme-card border border-theme-border flex flex-col">
              <div className="aspect-video bg-black/50 relative overflow-hidden group">
                {album.coverUrl ? (
                  <img src={album.coverUrl} alt={album.title} className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-white/20">
                    <ImageIcon size={48} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                  <label className="cursor-pointer px-6 py-3 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:brightness-110">
                    <Camera size={14} /> {uploading === album.id ? "Enviando..." : "Adicionar Fotos"}
                    <input type="file" multiple accept="image/*" className="hidden" disabled={uploading === album.id} onChange={(e) => handleUpload(album.id, e)} />
                  </label>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-black text-white uppercase italic tracking-tight">{album.title}</h3>
                <p className="text-[10px] text-theme-muted uppercase tracking-widest mt-1">{album.category || "Sem categoria"} • {album.images?.length || 0} fotos</p>
                <p className="text-xs text-theme-muted mt-4 line-clamp-2">{album.description}</p>
              </div>
            </motion.div>
          ))}
          {albums.length === 0 && !isCreating && (
            <div className="col-span-full py-20 text-center border border-dashed border-white/10 text-theme-muted text-xs font-black uppercase tracking-widest">
              Nenhum álbum criado. Adicione seu primeiro trabalho para o portfólio.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

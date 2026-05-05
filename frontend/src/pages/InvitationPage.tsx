import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { Navbar } from "../components/Navbar";
import { Lock, ArrowRight, Loader2, Shield } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { T } from "../lib/theme";

interface InvitationData {
  album: {
    name: string;
    _count: {
      members: number;
      media: number;
    };
  };
}

export default function InvitationPage() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchInvite = async () => {
      try {
        const { data } = await api.get(`/vaults/invitation/${code}`);
        setInvitation(data);
      } catch (err: unknown) {
        const axiosErr = err as { response?: { data?: { error?: string } } };
        setError(axiosErr?.response?.data?.error || "Este convite é inválido ou já expirou.");
      } finally {
        setLoading(false);
      }
    };
    fetchInvite();
  }, [code]);

  const handleAccept = async () => {
    if (!user) {
      navigate(`/login?next=/invitation/${code}`);
      return;
    }

    setAccepting(true);
    try {
      const { data } = await api.post(`/vaults/invitation/${code}/accept`);
      navigate(`/cofres/${data.albumId}`);
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { error?: string } } };
      alert(axiosErr?.response?.data?.error || "Erro ao aceitar convite.");
    } finally {
      setAccepting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: T.bg }}>
        <Loader2 className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ background: T.bg, color: T.text }}>
        <Shield size={48} className="text-red-500/30 mb-4" />
        <h1 className="text-2xl font-black uppercase italic tracking-tighter">Ops! {error}</h1>
        <button onClick={() => navigate("/")} className="mt-8 text-emerald-500 font-black uppercase tracking-widest text-[11px] border border-emerald-500/20 px-6 py-3 rounded-full hover:bg-emerald-500/5 transition-all">
          Voltar para Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen font-sans" style={{ background: T.bg, color: T.text }}>
      <Helmet>
        <title>Convite para {invitation?.album?.name} | Foto Segundo</title>
      </Helmet>
      <Navbar />

      <main className="max-w-xl mx-auto px-6 py-20 flex flex-col items-center text-center">
        <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(16,185,129,0.1)]">
          <Lock size={40} className="text-emerald-500" />
        </div>

        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-4">Você foi convidado</p>
        
        <h1 className="text-4xl md:text-5xl font-black uppercase italic tracking-tighter leading-none mb-6">
          {invitation?.album?.name}
        </h1>

        <div className="flex items-center gap-6 mb-12 py-4 px-8 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex flex-col items-center">
             <span className="text-lg font-black text-white">{invitation?.album?._count?.media || 0}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Fotos</span>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="flex flex-col items-center">
             <span className="text-lg font-black text-white">{invitation?.album?._count?.members || 0}</span>
             <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Membros</span>
          </div>
        </div>

        <p className="text-sm text-gray-400 leading-relaxed mb-12 max-w-sm">
          Este é um cofre de memórias privado. Ao aceitar, você poderá visualizar, votar e compartilhar fotos neste álbum.
        </p>

        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 group"
        >
          {accepting ? <Loader2 className="animate-spin" size={20} /> : (
            <>
              ACEITAR CONVITE <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </>
          )}
        </button>

        {!user && (
          <p className="mt-6 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
            Será necessário fazer login ou criar uma conta.
          </p>
        )}
      </main>
    </div>
  );
}

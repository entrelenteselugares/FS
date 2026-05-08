import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { Lock, Plus, Images, Users, ChevronRight, Loader2, Image, ShoppingBag } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "../components/DashboardLayout";

interface Vault {
  id: string;
  nome: string;
  status: string;
  goalPoses: number;
  cycleEndDay: number | null;
  myRole: string;
  _count: { media: number; members: number };
}

function VaultCard({ vault, onClick }: { vault: Vault; onClick: () => void }) {
  const progress = Math.min(100, Math.round((vault._count.media / vault.goalPoses) * 100));
  const isOwner = vault.myRole === "OWNER";

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative flex flex-col bg-[#141414] border border-[#2a2a2a] hover:border-emerald-500/40 rounded-2xl p-6 cursor-pointer transition-all duration-500 overflow-hidden"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/[0.03] transition-colors duration-500 pointer-events-none rounded-2xl" />

      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
          <Lock size={20} className="text-emerald-500" />
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOwner && (
            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
              Proprietário
            </span>
          )}
          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
            vault.status === "OPEN"
              ? "text-emerald-400 bg-emerald-500/10 border border-emerald-500/20"
              : "text-gray-500 bg-white/5 border border-white/10"
          }`}>
            {vault.status === "OPEN" ? "Ativo" : "Fechado"}
          </span>
        </div>
      </div>

      {/* Name */}
      <h3 className="text-xl font-black text-white uppercase italic tracking-tight leading-tight mb-1">
        {vault.nome}
      </h3>

      {/* Stats */}
      <div className="flex items-center gap-4 mt-3 mb-5">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Images size={13} className="text-emerald-500/70" />
          <span className="text-[11px] font-bold">{vault._count.media} fotos</span>
        </div>
        <div className="flex items-center gap-1.5 text-gray-400">
          <Users size={13} className="text-emerald-500/70" />
          <span className="text-[11px] font-bold">{vault._count.members} membros</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-auto">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Meta do Ciclo</span>
          <span className="text-[10px] font-black text-emerald-500">{vault._count.media}/{vault.goalPoses}</span>
        </div>
        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <ChevronRight
        size={16}
        className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300"
      />
    </motion.div>
  );
}

function NewVaultModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [goalPoses, setGoalPoses] = useState(36);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Dê um nome ao seu cofre."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/vaults", { nome: name.trim(), goalPoses });
      onCreated();
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string; details?: string } } };
      setError(axiosErr?.response?.data?.details || axiosErr?.response?.data?.error || "Erro ao criar cofre.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full max-w-md bg-[#141414] border border-[#2a2a2a] rounded-2xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <Lock size={18} className="text-emerald-500" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white uppercase italic tracking-tight">Novo Cofre</h2>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest">Memórias privadas compartilhadas</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">Nome do Cofre</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleCreate()}
              placeholder="Ex: Casamento Ana & Pedro"
              className="w-full bg-[#0a0a0a] border border-[#2a2a2a] focus:border-emerald-500/50 rounded-xl px-4 py-3 text-white text-sm outline-none transition-colors placeholder:text-gray-600"
            />
          </div>

          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              Meta de fotos do ciclo: <span className="text-emerald-500">{goalPoses}</span>
            </label>
            <input
              type="range" min={12} max={120} step={4}
              value={goalPoses}
              onChange={e => setGoalPoses(Number(e.target.value))}
              className="w-full accent-emerald-500"
            />
            <div className="flex justify-between text-[9px] text-gray-600 mt-1">
              <span>12</span><span>120</span>
            </div>
          </div>

          {error && <p className="text-red-400 text-[11px] font-bold">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 py-3 border border-[#2a2a2a] text-gray-400 text-[11px] font-black uppercase tracking-widest rounded-xl hover:border-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black text-[11px] font-black uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar Cofre
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function VaultsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchVaults = async () => {
    try {
      const { data } = await api.get("/vaults");
      setVaults(data || []);
    } catch (err) {
      console.error("[VaultsPage] Erro ao carregar cofres:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) { navigate("/login"); return; }
    fetchVaults();
  }, [user, navigate]);

  const NAV_ITEMS = [
    { label: "Minhas Memórias", onClick: () => navigate("/minha-conta?s=fotos"), isActive: false, icon: <Image size={18} /> },
    { label: "Cofres de Memórias", onClick: () => {}, isActive: true, icon: <Lock size={18} /> },
    { label: "Carrinho", onClick: () => navigate("/minha-conta?s=wallet"), isActive: false, icon: <ShoppingBag size={18} /> },
    ...(user?.franchiseProfile ? [
      { label: "Franquia Print", onClick: () => navigate("/minha-conta?s=franquia"), isActive: false, icon: <Lock size={18} /> }
    ] : []),
    { label: "Meus Dados", onClick: () => navigate("/minha-conta?s=menu"), isActive: false, icon: <Lock size={18} /> },
  ];

  return (
    <DashboardLayout title="Cofres de Memórias" navItems={NAV_ITEMS}>
      <Helmet>
        <title>Cofres de Memórias | Foto Segundo</title>
        <meta name="description" content="Álbuns privados compartilhados para preservar e materializar suas memórias." />
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-2 md:px-6 py-6 md:py-10 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Page header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-theme-border/60 pb-8 md:pb-12">
          <div className="space-y-1 relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-0.5 w-12 bg-emerald-500" />
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.5em] italic">Fase 11</p>
            </div>
            <h1 className="text-4xl md:text-7xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-[0.9]">
              Cofres de<br /><span className="text-emerald-500">Memórias</span>
            </h1>
            <p className="mt-3 text-[11px] text-gray-500 uppercase tracking-widest max-w-sm leading-relaxed font-bold">
              Álbuns privados compartilhados. Colecione, vote e materialize suas fotos mensalmente.
            </p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-black uppercase tracking-widest px-6 py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-500/20 italic"
          >
            <Plus size={16} />
            NOVO COFRE
          </button>
        </div>

        {/* Vaults grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4 opacity-30">
            <Loader2 size={32} className="animate-spin text-emerald-500" />
            <span className="text-[10px] font-black uppercase tracking-widest italic">Carregando cofres...</span>
          </div>
        ) : vaults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-5 text-center bg-[#141414] border border-[#2a2a2a] rounded-2xl"
          >
            <div className="p-6 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
              <Lock size={48} className="text-emerald-500/40" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-black uppercase italic text-gray-400">NENHUM COFRE AINDA</p>
              <p className="text-[10px] text-gray-600 uppercase tracking-widest max-w-xs mx-auto font-bold">
                Crie seu primeiro álbum privado e convide pessoas para compartilhar memórias.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 border border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10 text-[10px] font-black uppercase tracking-widest px-8 py-4 rounded-xl transition-all italic"
            >
              <Plus size={14} />
              CRIAR PRIMEIRO COFRE
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {vaults.map((vault, i) => (
              <motion.div key={vault.id} transition={{ delay: i * 0.05 }}>
                <VaultCard vault={vault} onClick={() => navigate(`/cofres/${vault.id}`)} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <NewVaultModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setLoading(true); fetchVaults(); }}
        />
      )}
    </DashboardLayout>
  );
}

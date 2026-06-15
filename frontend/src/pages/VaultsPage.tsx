import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { API as api } from "../lib/api";
import { useAuth } from "../hooks/useAuth";
import { motion } from "framer-motion";
import { Lock, Plus, Images, Users, Loader2, Image as ImageIcon, ShoppingBag, User, Play, Briefcase, DollarSign, Calendar, Printer, Settings, LayoutDashboard, Wallet, Building2, MapPin, BookImage } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { DashboardLayout } from "../components/DashboardLayout";
import type { NavItem } from "../components/DashboardLayout";

interface Vault {
  id: string;
  nome: string;
  status: string;
  subscriptionStatus: string;
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
      whileHover={{ scale: 1.02 }}
      onClick={onClick}
      className="group relative flex flex-col items-start bg-theme-bg border border-theme-border rounded-xl md:rounded-2xl p-3 md:p-6 cursor-pointer transition-all duration-300 overflow-hidden gap-3 md:gap-5 shadow-sm hover:shadow-md hover:border-brand-tactical/60 h-full"
    >
      <div className="flex w-full justify-between items-start gap-1">
        <div className="w-8 h-8 md:w-12 md:h-12 shrink-0 bg-brand-tactical/10 border border-brand-tactical/20 rounded-lg md:rounded-xl flex items-center justify-center">
          <Lock size={16} className="text-brand-tactical md:w-[18px] md:h-[18px]" />
        </div>
        <span className={`text-[6px] md:text-[10px] font-black uppercase tracking-widest px-1.5 md:px-2 py-0.5 md:py-1 rounded md:rounded-md mt-1 shrink-0 ${
          vault.subscriptionStatus === "ACTIVE"
            ? "text-theme-brand bg-brand-tactical/10 border border-brand-tactical/20"
            : vault.subscriptionStatus === "TRIAL"
            ? "text-brand-warning bg-brand-warning/10 border border-brand-warning/20"
            : "text-brand-danger bg-brand-danger/10 border border-brand-danger/20"
        }`}>
          {vault.subscriptionStatus === "ACTIVE" ? "Premium" : vault.subscriptionStatus === "TRIAL" ? "Grátis" : "Bloqueado"}
        </span>
      </div>

      {/* Info Area */}
      <div className="w-full space-y-1.5 md:space-y-2 flex-1 flex flex-col">
        <h3 className="text-[11px] md:text-lg font-bold text-theme-text uppercase line-clamp-2 leading-tight">
          {vault.nome}
        </h3>
        
        <div className="h-4 md:h-6 flex items-center">
          {isOwner && (
            <span className="inline-block text-[6px] md:text-[10px] font-bold text-brand-tactical uppercase tracking-widest bg-brand-tactical/10 border border-brand-tactical/20 px-1.5 md:px-2 py-0.5 rounded-full">
              Proprietário
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-4 text-theme-muted pt-1">
          <div className="flex items-center gap-1 md:gap-1.5">
            <Images size={10} className="text-brand-tactical/70 md:w-3 md:h-3 shrink-0" />
            <span className="text-[10px] md:text-[10px] font-bold">{vault._count.media} fotos</span>
          </div>
          <div className="flex items-center gap-1 md:gap-1.5">
            <Users size={10} className="text-brand-tactical/70 md:w-3 md:h-3 shrink-0" />
            <span className="text-[10px] md:text-[10px] font-bold">{vault._count.members} membros</span>
          </div>
        </div>
      </div>

      {/* Progress Area */}
      <div className="w-full flex flex-col justify-center mt-auto pt-2 md:pt-4 border-t border-theme-border/50">
        <div className="flex justify-between items-center mb-1 md:mb-2 px-0 md:px-1">
          <span className="text-[6px] md:text-[9px] text-theme-muted uppercase tracking-widest font-bold max-w-[60%] truncate">Progresso da Meta</span>
          <span className="text-[10px] md:text-[10px] font-bold text-brand-tactical shrink-0">{vault._count.media} / {vault.goalPoses}</span>
        </div>
        <div className="w-full h-1 md:h-1.5 bg-theme-bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-brand-tactical rounded-full transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </motion.div>
  );
}

function NewVaultModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [goalPoses, setGoalPoses] = useState(36);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!name.trim()) { setError("Dê um nome ao seu álbum."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/vaults", { nome: name.trim(), goalPoses });
      onCreated();
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { error?: string; details?: string } } };
      setError(axiosErr?.response?.data?.details || axiosErr?.response?.data?.error || "Erro ao criar álbum.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-theme-bg/80 backdrop-blur-md p-0 sm:p-4" onClick={onClose}>
      <motion.div
        onClick={e => e.stopPropagation()}
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        className="w-full h-full sm:h-auto sm:max-h-[90vh] max-w-md bg-theme-card border-none sm:border border-theme-border rounded-none sm:rounded-2xl p-3 md:p-6 sm:p-8 flex flex-col overflow-y-auto custom-scrollbar"
      >
        <div className="flex items-center gap-3 mb-6 shrink-0">
          <div className="p-2.5 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl">
            <Lock size={18} className="text-brand-tactical" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-theme-text uppercase">Novo Álbum</h2>
            <p className="text-[10px] text-theme-muted uppercase tracking-widest">Memórias privadas compartilhadas</p>
          </div>
        </div>

        <form onSubmit={e => { e.preventDefault(); handleCreate(); }} className="space-y-6 flex-1">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">Nome do Álbum</label>
            <input
              id="input-nome-album"
              required
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Casamento Ana & Pedro"
              className="w-full bg-theme-bg-field border border-theme-border focus:border-brand-tactical/50 rounded-xl px-4 py-3 text-theme-text text-sm outline-none transition-colors placeholder:text-theme-text-muted/40"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-theme-muted mb-2">
              Meta de fotos do ciclo: <span className="text-brand-tactical">{goalPoses}</span>
            </label>
            <input
              id="range-meta-poses"
              type="range" min={12} max={120} step={4}
              value={goalPoses}
              onChange={e => setGoalPoses(Number(e.target.value))}
              className="w-full accent-brand-tactical"
            />
            <div className="flex justify-between text-[9px] text-theme-muted mt-1">
              <span>12</span><span>120</span>
            </div>
          </div>

          {error && <p className="text-brand-danger text-[11px] font-bold">{error}</p>}

          <div className="flex gap-3 pt-4 border-t border-theme-border mt-auto shrink-0">
            <button
              id="btn-cancelar-criar-album"
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-[#2a2a2a] text-theme-muted text-[11px] font-bold uppercase tracking-widest rounded-xl hover:border-gray-600 transition-colors"
            >
              Cancelar
            </button>
            <button
              id="btn-confirmar-criar-album"
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-brand-tactical hover:bg-brand-tactical/90 disabled:opacity-50 text-brand-text text-[11px] font-bold uppercase tracking-widest rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              Criar Álbum
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function VaultsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const fetchVaults = async () => {
    try {
      const { data } = await api.get("/vaults");
      setVaults(data || []);
    } catch (err) {
      console.error("[VaultsPage] Erro ao carregar álbuns:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Wait for auth context to finish loading before deciding to redirect.
    // Without this guard, user=null during the brief auth initialization
    // causes a premature redirect to /login (the intermittent blank-screen bug).
    if (authLoading) return;
    if (!user) { navigate("/login", { replace: true }); return; }
    fetchVaults();
  }, [authLoading, user, navigate]);

  const NAV_ITEMS = useMemo(() => {
    const items: NavItem[] = [
      { label: "Histórico de Compras", onClick: () => navigate("/minha-conta?tab=files"), isActive: false, icon: <ShoppingBag size={18} /> },
      { label: "Meus Álbuns", onClick: () => {}, isActive: true, icon: <Lock size={18} /> },
      { 
        label: "Álbum Sanfona", 
        onClick: () => navigate("/minha-conta?tab=album-sanfona"), 
        isActive: false, 
        icon: <BookImage size={18} />, 
        locked: !user?.isSanfonaSubscriber 
      },
      { label: "Minha Carteira", onClick: () => navigate("/minha-conta?tab=wallet"), isActive: false, icon: <Wallet size={18} /> },
      { label: "Indique e Ganhe", onClick: () => navigate("/minha-conta?tab=affiliate"), isActive: false, icon: <Users size={18} /> },
      { label: "Meus Dados", onClick: () => navigate("/minha-conta?tab=profile"), isActive: false, icon: <User size={18} /> },
    ];

    const isProOrFranchise = (user?.role === "PROFISSIONAL" || user?.role === "FRANCHISEE");
    const isVerified = (user?.verificationStatus === "APPROVED" || user?.isVerified || !!user?.franchiseProfile);

    if (isProOrFranchise && isVerified) {
      const proSubItems = [
        { label: "Minha Agenda", onClick: () => navigate("/minha-conta?tab=agenda"), isActive: false, icon: <Play size={18} /> },
        { label: "Meu Portfólio", onClick: () => navigate("/minha-conta?tab=portfolio"), isActive: false, icon: <ImageIcon size={18} /> },
        { label: "Serviços & Preços", onClick: () => navigate("/minha-conta?tab=servicos"), isActive: false, icon: <Briefcase size={18} /> },
        { label: "Ficha Técnica & Pix", onClick: () => navigate("/minha-conta?tab=perfil"), isActive: false, icon: <Settings size={18} /> },
        { label: "Vendas & Ganhos", onClick: () => navigate("/minha-conta?tab=financeiro"), isActive: false, icon: <DollarSign size={18} /> }
      ];

      items.push({
        label: "Painel Profissional",
        icon: <Briefcase size={18} />,
        subItems: proSubItems
      });

      if (user?.role === "FRANCHISEE" || user?.franchiseProfile) {
        const franchiseSubItems = [];
        if (user?.role === "FRANCHISEE") {
          franchiseSubItems.push(
            { label: "Gestão de Franquia", onClick: () => navigate("/franquia"), isActive: false, icon: <LayoutDashboard size={18} /> }
          );
        }
        franchiseSubItems.push(
          { label: "Rede Técnica", onClick: () => navigate("/minha-conta?tab=equipe"), isActive: false, icon: <Users size={18} /> },
          { label: "Franquia Print", onClick: () => navigate("/minha-conta?tab=franquia"), isActive: false, icon: <Printer size={18} /> }
        );
        
        items.push({
          label: "Gestão de Franquia",
          icon: <Building2 size={18} />,
          subItems: franchiseSubItems
        });
      }
    }

    if ((user?.role === "CARTORIO" || user?.role === "UNIDADE") && user?.verificationStatus === "APPROVED") {
      const unitSubItems = [
        { label: "Agenda Unidade", onClick: () => navigate("/minha-conta?tab=agenda"), isActive: false, icon: <Play size={18} /> },
        { label: "Fluxo Financeiro", onClick: () => navigate("/minha-conta?tab=financeiro"), isActive: false, icon: <DollarSign size={18} /> },
        { label: "Rede Técnica", onClick: () => navigate("/minha-conta?tab=equipe"), isActive: false, icon: <Users size={18} /> },
        { label: "Google Calendar", onClick: () => navigate("/minha-conta?tab=calendar"), isActive: false, icon: <Calendar size={18} /> },
        { label: "Configuração Pública", onClick: () => navigate("/minha-conta?tab=configuracoes"), isActive: false, icon: <Settings size={18} /> }
      ];

      if (user?.franchiseProfile) {
        unitSubItems.push(
          { label: "Franquia Print", onClick: () => navigate("/minha-conta?tab=franquia"), isActive: false, icon: <Printer size={18} /> },
          { label: "Monitor de Fila", onClick: () => navigate("/minha-conta?tab=monitor"), isActive: false, icon: <Settings size={18} /> }
        );
      }

      items.push({
        label: "Gestão da Unidade",
        icon: <MapPin size={18} />,
        subItems: unitSubItems
      });
    }

    return items;
  }, [user, navigate]);

  // Show spinner while auth context is initializing to avoid blank-screen flash
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-brand-tactical" />
      </div>
    );
  }

  return (
    <DashboardLayout title="Meus Álbuns" navItems={NAV_ITEMS}>
      <Helmet>
        <title>Meus Álbuns | Foto Segundo</title>
        <meta name="description" content="Álbuns privados compartilhados para preservar e materializar suas memórias." />
      </Helmet>

      <div className="max-w-[1400px] mx-auto px-2 md:px-6 py-3 md:py-6 md:py-10 space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Page actions */}
        <div className="flex items-center justify-end gap-4 border-b border-theme-border pb-3 md:pb-4">

          <button
            id="btn-novo-album"
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-brand-tactical hover:bg-brand-tactical/90 text-brand-text text-[11px] font-bold uppercase tracking-widest px-4 md:px-6 py-2.5 md:py-4 rounded-xl transition-all active:scale-95 shadow-lg shadow-brand-tactical/20"
          >
            <Plus size={14} />
            NOVO ÁLBUM
          </button>
        </div>

        {/* Vaults grid */}
        {loading ? (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-theme-card border border-theme-border rounded-xl md:rounded-2xl p-3 md:p-6 h-[160px] md:h-[200px] animate-pulse flex flex-col justify-between">
                <div className="flex justify-between items-start">
                  <div className="w-8 h-8 md:w-12 md:h-12 bg-theme-bg-muted rounded-lg md:rounded-xl border border-white/10" />
                  <div className="w-10 h-4 md:w-16 md:h-6 bg-theme-bg-muted rounded-full border border-white/10" />
                </div>
                <div className="space-y-2 md:space-y-3 mt-4">
                  <div className="w-3/4 h-4 md:h-6 bg-theme-bg-muted rounded border border-white/10" />
                  <div className="w-1/2 h-3 md:h-4 bg-theme-bg-muted rounded border border-white/10" />
                </div>
                <div className="w-full h-1 bg-theme-bg-muted rounded-full mt-auto" />
              </div>
            ))}
          </div>
        ) : vaults.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-32 gap-5 text-center bg-theme-card border border-theme-border rounded-2xl"
          >
            <div className="p-3 md:p-6 bg-brand-tactical/10 border border-brand-tactical/10 rounded-2xl">
              <Lock size={48} className="text-brand-tactical/40" />
            </div>
            <div className="space-y-2">
              <p className="text-2xl font-bold uppercase text-theme-muted">NENHUM ÁLBUM AINDA</p>
              <p className="text-[10px] text-theme-muted uppercase tracking-widest max-w-xs mx-auto font-bold">
                Crie seu primeiro álbum privado e convide pessoas para compartilhar memórias.
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 flex items-center gap-2 border border-brand-tactical/30 text-brand-tactical hover:bg-brand-tactical/10 text-[10px] font-bold uppercase tracking-widest px-3 md:px-6 md:px-8 py-2.5 md:py-4 rounded-xl transition-all"
            >
              <Plus size={14} />
              CRIAR PRIMEIRO ÁLBUM
            </button>
          </motion.div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 items-stretch">
            {vaults.map((vault, i) => (
              <motion.div key={vault.id} transition={{ delay: i * 0.05 }} className="flex flex-col">
                <VaultCard vault={vault} onClick={() => navigate(`/meus-albuns/${vault.id}`)} />
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

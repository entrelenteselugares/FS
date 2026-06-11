import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Settings, Trash2, Info, Loader2 } from "lucide-react";
import { API as api } from "../lib/api";

export interface VaultSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  vault: {
    id: string;
    nome: string;
    goalPoses: number;
    externalVideoLink?: string | null;
    members?: { id: string; userId: string; role: string; user: { nome: string; email: string } }[];
  };
  onUpdate: () => void;
  sortConfig: string;
  setSortConfig: (s: string) => void;
}

export function VaultSettingsModal({ isOpen, onClose, vault, onUpdate, sortConfig, setSortConfig }: VaultSettingsModalProps) {
  const [activeTab, setActiveTab] = useState<"Geral" | "Organização" | "Acesso">("Geral");
  const [nome, setNome] = useState(vault.nome);
  const [goalPoses, setGoalPoses] = useState(vault.goalPoses);
  const [externalVideoLink, setExternalVideoLink] = useState(vault.externalVideoLink || "");
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState(vault.members || []);

  const POSE_PRESETS = [
    { qty: 12, price: 44.90, label: "12 fotos" },
    { qty: 24, price: 64.90, label: "24 fotos" },
    { qty: 36, price: 84.90, label: "36 fotos" },
    { qty: 48, price: 104.90, label: "48 fotos" },
  ];

  useEffect(() => {
    setNome(vault.nome);
    setGoalPoses(vault.goalPoses);
    setExternalVideoLink(vault.externalVideoLink || "");
    // Fetch members if not passed from parent
    if (!vault.members || vault.members.length === 0) {
      api.get(`/vaults/${vault.id}`).then((res) => {
        if (res.data.members) setMembers(res.data.members);
      }).catch(console.error);
    } else {
      setMembers(vault.members);
    }
  }, [vault, isOpen]);

  const hasChanges = nome !== vault.nome || goalPoses !== vault.goalPoses || externalVideoLink !== (vault.externalVideoLink || "");

  const handleSave = async () => {
    if (!hasChanges) return;
    setLoading(true);
    try {
      const payload: { nome?: string; goalPoses?: number; externalVideoLink?: string | null } = {};
      if (nome.trim() && nome !== vault.nome) payload.nome = nome.trim();
      if (goalPoses !== vault.goalPoses) payload.goalPoses = goalPoses;
      if (externalVideoLink !== (vault.externalVideoLink || "")) payload.externalVideoLink = externalVideoLink.trim() || null;
      await api.patch(`/vaults/${vault.id}`, payload);
      onUpdate();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }, message?: string };
      alert("Erro ao salvar configurações: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este membro? Ele perderá acesso ao cofre.")) return;
    setLoading(true);
    try {
      await api.delete(`/vaults/${vault.id}/members/${userId}`);
      setMembers(members.filter(m => m.userId !== userId));
      onUpdate();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: string } }, message?: string };
      alert("Erro ao remover membro: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const selectedPreset = POSE_PRESETS.find(p => p.qty === goalPoses);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Settings size={16} className="text-emerald-500" />
                </div>
                <div>
                  <h2 className="text-sm font-bold uppercase tracking-widest text-white">Configurações</h2>
                  <p className="text-[10px] text-zinc-500 font-medium">{vault.nome}</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white bg-theme-bg-muted rounded-full transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/5">
              {(["Geral", "Organização", "Acesso"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                    activeTab === tab ? "text-emerald-500 border-b-2 border-emerald-500 bg-emerald-500/5" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {activeTab === "Geral" && (
                <div className="space-y-6">
                  {/* Nome */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Nome do Cofre</label>
                    <input 
                      type="text" 
                      value={nome}
                      onChange={e => setNome(e.target.value)}
                      className="w-full h-12 bg-black/50 border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="Ex: Férias 2024"
                    />
                  </div>

                  {/* External Video Link */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-2">Link da Pasta de Vídeos (Drive/Dropbox)</label>
                    <input 
                      type="url" 
                      value={externalVideoLink}
                      onChange={e => setExternalVideoLink(e.target.value)}
                      className="w-full h-12 bg-black/50 border border-white/10 rounded-lg px-4 text-sm text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      placeholder="https://drive.google.com/drive/folders/..."
                    />
                    <p className="text-[9px] text-zinc-500 mt-2 leading-relaxed">
                      Se preenchido, os membros verão um botão &quot;🎬 Acessar Vídeos Brutos&quot; para acessar arquivos massivos.
                    </p>
                  </div>

                  {/* Quantidade de Fotos */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                      Quantidade de Fotos para Impressão
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {POSE_PRESETS.map(preset => (
                        <button
                          key={preset.qty}
                          onClick={() => setGoalPoses(preset.qty)}
                          className={`flex flex-col items-start p-4 rounded-xl border transition-all text-left ${
                            goalPoses === preset.qty
                              ? "bg-emerald-500/10 border-emerald-500/60 ring-1 ring-emerald-500/40"
                              : "bg-black/30 border-white/5 hover:bg-theme-bg-muted hover:border-white/15"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                              goalPoses === preset.qty ? "border-emerald-500" : "border-zinc-600"
                            }`}>
                              {goalPoses === preset.qty && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                            </div>
                            <span className={`text-[13px] font-black ${goalPoses === preset.qty ? "text-emerald-400" : "text-white"}`}>
                              {preset.label}
                            </span>
                          </div>
                          <span className={`text-[11px] font-bold ${goalPoses === preset.qty ? "text-emerald-500" : "text-zinc-500"}`}>
                            R$ {preset.price.toFixed(2).replace(".", ",")}
                          </span>
                        </button>
                      ))}
                    </div>

                    {/* Pricing summary */}
                    {selectedPreset && (
                      <div className="mt-3 p-3 bg-zinc-900/60 rounded-lg border border-white/5 flex items-center justify-between">
                        <span className="text-[10px] text-zinc-400 uppercase tracking-widest">Total estimado</span>
                        <span className="text-[13px] font-bold text-emerald-400">
                          R$ {selectedPreset.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                    )}

                    {/* Custom qty warning if current goalPoses doesn't match a preset */}
                    {!selectedPreset && (
                      <div className="mt-3 p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                        <p className="text-[10px] text-yellow-400 font-bold">
                          Meta atual: {goalPoses} fotos (personalizada). Selecione um pacote acima para alterar.
                        </p>
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={handleSave}
                    disabled={loading || !hasChanges || !nome.trim()}
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-400 text-black text-[11px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : "Salvar Alterações"}
                  </button>
                </div>
              )}

              {activeTab === "Organização" && (
                <div className="space-y-4">
                  <p className="text-[11px] text-zinc-400 leading-relaxed mb-2">
                    Escolha como deseja visualizar a galeria deste cofre.
                  </p>
                  
                  <div className="space-y-2">
                    {[
                      { id: "UPLOAD_DESC", label: "Data de Upload (Mais recentes)" },
                      { id: "UPLOAD_ASC", label: "Data de Upload (Mais antigas)" },
                      { id: "EXIF_ASC", label: "Data da Câmera (Cronológico)" },
                      { id: "SIZE_DESC", label: "Tamanho (Maiores primeiro)" },
                      { id: "ORIENTATION_HORZ", label: "Orientação (Horizontais primeiro)" }
                    ].map(opt => (
                      <label key={opt.id} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                        sortConfig === opt.id ? "bg-emerald-500/10 border-emerald-500/50" : "bg-black/20 border-white/5 hover:bg-theme-bg-muted"
                      }`}>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          sortConfig === opt.id ? "border-emerald-500" : "border-zinc-600"
                        }`}>
                          {sortConfig === opt.id && <div className="w-2 h-2 rounded-full bg-emerald-500" />}
                        </div>
                        <span className={`text-[12px] font-bold ${sortConfig === opt.id ? "text-emerald-500" : "text-zinc-300"}`}>
                          {opt.label}
                        </span>
                        <input type="radio" className="hidden" checked={sortConfig === opt.id} onChange={() => setSortConfig(opt.id)} />
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === "Acesso" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-blue-500/10 p-3 rounded-lg border border-blue-500/20 mb-4">
                    <div className="flex items-center gap-3">
                      <Info size={16} className="text-blue-500" />
                      <p className="text-[10px] text-blue-200">Apenas o proprietário pode remover membros convidados.</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {members.map(member => (
                      <div key={member.id} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 rounded-xl">
                        <div>
                          <p className="text-[13px] font-bold text-white">{member.user?.nome || "Usuário"}</p>
                          <p className="text-[10px] text-zinc-500">{member.role}</p>
                        </div>
                        
                        {member.role !== "OWNER" && (
                          <button 
                            onClick={() => handleRemoveMember(member.userId)}
                            className="p-2 text-red-500/70 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {member.role === "OWNER" && (
                          <div className="px-3 py-1 bg-emerald-500/20 text-emerald-500 text-[9px] font-bold uppercase tracking-widest rounded-full">
                            Dono
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

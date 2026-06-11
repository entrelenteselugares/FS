import { useState } from "react";
import { Users, UserPlus, Globe, Search, Check, ShieldCheck, X } from "lucide-react";
import type { Partner } from "./types";

interface TeamSelectorProps {
  label: string;
  onSelect: (userId: string | null, isPublic: boolean) => void;
  network: Partner[];
}

export function TeamSelector({ label, onSelect, network }: TeamSelectorProps) {
  const [mode, setMode] = useState<"me" | "direct" | "public" | "none">("me");
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filteredNetwork = network.filter(p => 
    p.nome.toLowerCase().includes(search.toLowerCase()) || 
    p.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleModeChange = (newMode: "me" | "direct" | "public" | "none") => {
    setMode(newMode);
    if (newMode === "me") {
      onSelect(null, false);
      setSelectedPartnerId(null);
    } else if (newMode === "public") {
      onSelect(null, true);
      setSelectedPartnerId(null);
    } else if (newMode === "none") {
      onSelect("NONE", false); // Special flag for no capture
      setSelectedPartnerId(null);
    } else if (newMode === "direct" && selectedPartnerId) {
      onSelect(selectedPartnerId, false);
    }
  };

  const handlePartnerSelect = (id: string) => {
    setSelectedPartnerId(id);
    onSelect(id, false);
  };

  return (
    <div className="space-y-4">
      <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest flex items-center gap-2">
        <Users size={12} /> {label}
      </label>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("me")}
          className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-1 ${mode === "me" ? "border-brand-tactical bg-brand-tactical/10 text-brand-tactical shadow-[0_0_15px_rgba(133,185,172,0.1)]" : "border-theme-border bg-theme-bg-muted text-theme-muted"}`}
        >
          <Check size={14} />
          <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Eu Mesmo</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("direct")}
          className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-1 ${mode === "direct" ? "border-cyan-400 bg-cyan-400/10 text-cyan-400" : "border-theme-border bg-theme-bg-muted text-theme-muted"}`}
        >
          <UserPlus size={14} />
          <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Minha Rede</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("public")}
          className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-1 ${mode === "public" ? "border-yellow-400 bg-yellow-400/10 text-yellow-400" : "border-theme-border bg-theme-bg-muted text-theme-muted"}`}
        >
          <Globe size={14} />
          <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Solicitar</span>
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("none")}
          className={`p-3 border text-center transition-all flex flex-col items-center justify-center gap-1 ${mode === "none" ? "border-red-500 bg-red-500/10 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]" : "border-theme-border bg-theme-bg-muted text-theme-muted"}`}
        >
          <X size={14} />
          <span className="text-[8px] font-bold uppercase tracking-widest leading-none">Nenhum</span>
        </button>
      </div>

      {mode === "direct" && (
        <div className="space-y-3 animate-in slide-in-from-top-2 duration-300">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-muted" />
            <input
              type="text"
              placeholder="Buscar em minha rede..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-theme-bg-muted border border-theme-border p-3 pl-10 text-[10px] font-bold text-theme-text outline-none focus:border-cyan-400/50"
            />
          </div>
          <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto no-scrollbar">
            {filteredNetwork.length > 0 ? (
              filteredNetwork.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePartnerSelect(p.id)}
                  className={`flex items-center justify-between p-3 border transition-all ${selectedPartnerId === p.id ? "border-cyan-400 bg-cyan-400/5" : "border-theme-border hover:border-cyan-400/30"}`}
                >
                  <div className="text-left">
                    <p className="text-[10px] font-bold text-theme-text uppercase ">{p.nome}</p>
                    <p className="text-[8px] text-theme-muted uppercase font-bold tracking-widest">{p.email}</p>
                  </div>
                  {selectedPartnerId === p.id && <ShieldCheck size={14} className="text-cyan-400" />}
                </button>
              ))
            ) : (
              <p className="text-[9px] text-center text-theme-muted py-4 uppercase">Nenhum parceiro favorito encontrado.</p>
            )}
          </div>
        </div>
      )}

      {mode === "public" && (
        <div className="p-4 bg-yellow-400/5 border border-yellow-400/20 space-y-2 animate-in slide-in-from-top-2 duration-300">
          <p className="text-[9px] font-bold text-yellow-400 uppercase tracking-widest flex items-center gap-2">
             <Globe size={12} /> Chamada Aberta na Plataforma
          </p>
          <p className="text-[8px] text-theme-muted uppercase font-bold leading-relaxed">
            Sua solicitação será enviada para todos os profissionais qualificados da região. O primeiro que aceitar assumirá a captação deste evento.
          </p>
        </div>
      )}
    </div>
  );
}

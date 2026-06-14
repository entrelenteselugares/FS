import { Search, Users, MessageCircle, X } from "lucide-react";
import type { Partner, ResidentUnit } from "./types";

interface NetworkTabProps {
  network: Partner[];
  networkSearch: string;
  searchResults: Partner[];
  residentUnits: ResidentUnit[];
  onSearch: (q: string) => void;
  onToggleFavorite: (partnerId: string) => void;
}

export function NetworkTab({ network, networkSearch, searchResults, residentUnits, onSearch, onToggleFavorite }: NetworkTabProps) {
  return (
    <div className="space-y-12">
      <div className="bg-theme-bg border border-theme-border rounded-xl p-3 md:p-5 space-y-4 md:space-y-6">
        <div className="space-y-4">
          <h3 className="text-2xl sm:text-3xl font-heading font-bold text-theme-text uppercase leading-none">
            Minha Rede e <span className="text-brand-tactical">Alianças</span>
          </h3>
          <p className="text-[9px] sm:text-[10px] text-theme-muted uppercase tracking-[0.15em] sm:tracking-[0.4em] font-bold leading-relaxed">
            Gestão de parcerias oficiais com unidades e conexões com outros profissionais
          </p>
        </div>

        {/* --- NOVO: SEÇÃO DE UNIDADES RESIDENTES --- */}
        {residentUnits.length > 0 && (
          <div className="space-y-6 animate-in slide-in-from-left-4 duration-500">
            <div className="flex items-center gap-4">
              <div className="h-1 w-12 bg-cyan-400" />
              <h4 className="text-sm font-bold text-theme-text uppercase tracking-widest ">Unidades que Sou Residente</h4>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {residentUnits.map((u) => (
                <div key={u.id} className="bg-theme-bg-muted border border-cyan-400/20 rounded-xl p-3 md:p-5 relative group hover:border-cyan-400/50 transition-all">
                  <div className="absolute top-0 left-0 w-full h-[1px] bg-cyan-400/30" />
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="px-3 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-xl text-[10px] font-bold text-cyan-400 uppercase tracking-widest ">
                        Parceria Ativa
                      </div>
                      <div className="text-cyan-400/20 group-hover:text-cyan-400/50 transition-colors">
                        <Users size={20} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-base font-heading font-bold text-theme-text uppercase leading-tight ">
                        {u.cartorio.razaoSocial}
                      </h5>
                      <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">
                        {u.cartorio.endereco}
                      </p>
                    </div>
                    <div className="pt-4 border-t border-theme-border">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                        <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block">Sincronizado com Vitrine Oficial</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="h-px bg-theme-border/20" />

        {/* Search */}
        <div className="relative">
          <div className="absolute left-6 top-1/2 -translate-y-1/2 text-brand-tactical">
            <Search size={20} />
          </div>
          <input
            type="text"
            placeholder="BUSCAR PROFISSIONAL PELO NOME OU E-MAIL..."
            className="w-full bg-theme-bg-muted border border-theme-border rounded-xl p-5 pl-14 text-[11px] font-bold uppercase tracking-[0.2em] text-theme-text outline-none focus:border-brand-tactical transition-all"
            value={networkSearch}
            onChange={(e) => onSearch(e.target.value)}
          />
        </div>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-top-4 duration-300">
            <p className="text-[9px] font-bold text-brand-tactical uppercase tracking-widest mb-2">
              Resultados da Busca
            </p>
            {searchResults.map((p) => (
              <div key={p.id} className="flex justify-between items-center rounded-xl p-4 bg-brand-tactical/10 border border-brand-tactical/20">
                <div className="space-y-1">
                  <p className="text-sm font-bold text-theme-text uppercase ">{p.nome}</p>
                  <p className="text-[9px] text-theme-muted uppercase font-bold">{p.email}</p>
                </div>
                <button
                  onClick={() => onToggleFavorite(p.id)}
                  className="px-6 py-3 bg-brand-tactical text-zinc-950 text-[9px] font-bold uppercase tracking-widest rounded-xl hover:brightness-110 transition-all"
                >
                  ADICIONAR À REDE
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Favorites */}
        <div className="space-y-6 pt-8 border-t border-theme-border">
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <h4 className="text-lg sm:text-xl font-heading font-bold text-theme-text uppercase ">
              Meus Parceiros Favoritos
            </h4>
          </div>

          {network.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {network.map((p) => (
                <div
                  key={p.id}
                  className="group relative rounded-xl p-3 md:p-5 bg-theme-bg-muted border border-theme-border hover:border-brand-tactical/40 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-tactical/10 text-brand-tactical rounded-xl">
                          <Users size={16} />
                        </div>
                        <p className="text-base font-bold text-theme-text uppercase ">{p.nome}</p>
                      </div>
                      <p className="text-[10px] text-theme-muted uppercase font-bold tracking-widest">{p.email}</p>
                      {p.whatsapp && (
                        <p className="text-[10px] text-brand-tactical font-bold uppercase tracking-widest flex items-center gap-2 mt-2">
                          <MessageCircle size={12} /> {p.whatsapp}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => onToggleFavorite(p.id)}
                      className="p-3 text-red-500/40 hover:text-red-500 transition-colors"
                      title="Remover da Rede"
                    >
                      <X size={20} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-16 text-center space-y-6 bg-theme-bg border border-theme-border rounded-xl">
              <div className="flex justify-center text-theme-muted opacity-10">
                <Users size={64} />
              </div>
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-theme-muted uppercase tracking-[0.4em] ">Sua rede está vazia</p>
                <p className="text-[9px] text-theme-muted/60 uppercase font-bold tracking-widest">
                  Busque profissionais acima para começar sua rede tática de conexões
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


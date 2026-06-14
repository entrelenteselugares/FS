import { motion } from "framer-motion";
import { Shield } from "lucide-react";

export const TacticalPitch = () => {
  return (
    <div className="w-full max-w-md mx-auto aspect-[2/3] bg-emerald-800 rounded-xl relative overflow-hidden border-4 border-white/20 shadow-inner">
      {/* Pitch Lines */}
      <div className="absolute inset-4 border-2 border-white/30 rounded" />
      <div className="absolute top-1/2 left-4 right-4 border-t-2 border-white/30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 border-2 border-white/30 rounded-full" />
      
      {/* Penalty areas */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 w-40 h-24 border-2 border-white/30 border-t-0" />
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 w-40 h-24 border-2 border-white/30 border-b-0" />

      {/* Example Players */}
      <div className="absolute inset-0 p-8 flex flex-col justify-between">
        <div className="flex justify-center">
          <PlayerNode name="O Otimista" role="Goleiro" />
        </div>
        
        <div className="flex justify-between px-4">
          <PlayerNode name="O Zagueiro" role="Defesa" />
          <PlayerNode name="A Paredão" role="Defesa" />
        </div>
        
        <div className="flex justify-center mt-4">
          <PlayerNode name="O Maestro" role="Meio" />
        </div>

        <div className="flex justify-between px-8">
          <PlayerNode name="O Velocista" role="Ataque" />
          <PlayerNode name="O Artilheiro" role="Ataque" />
        </div>
      </div>

      <div className="absolute inset-0 bg-black/50 flex items-center justify-center backdrop-blur-sm opacity-0 hover:opacity-100 transition-opacity cursor-pointer group">
        <div className="bg-theme-surface text-emerald-400 font-bold px-6 py-3 rounded-full flex items-center gap-2 group-hover:scale-105 transition-transform">
          <Shield size={20} /> Editar Escalação (Em Breve)
        </div>
      </div>
    </div>
  );
};

const PlayerNode = ({ name, role }: { name: string, role: string }) => (
  <motion.div 
    drag
    dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
    dragElastic={0.2}
    className="flex flex-col items-center cursor-grab active:cursor-grabbing"
  >
    <div className="w-12 h-12 rounded-full bg-theme-surface border-2 border-white shadow-lg flex items-center justify-center text-xl overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-emerald-700 opacity-20" />
      👤
    </div>
    <div className="mt-1 bg-black/60 px-2 py-0.5 rounded text-[10px] font-bold text-white text-center shadow">
      {name}
    </div>
    <div className="text-[10px] text-emerald-300 font-bold uppercase tracking-widest mt-0.5 drop-shadow">
      {role}
    </div>
  </motion.div>
);

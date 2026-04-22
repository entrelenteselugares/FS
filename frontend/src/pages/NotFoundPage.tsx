import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Search } from "lucide-react";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-md w-full space-y-12"
      >
        <div className="relative">
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.6, 0.3]
            }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute inset-0 bg-brand-primary/20 blur-[100px] rounded-full"
          />
          <h1 className="text-[120px] font-black tracking-tighter leading-none opacity-10">404</h1>
          <div className="absolute inset-0 flex items-center justify-center">
             <Search size={48} className="text-brand-primary" strokeWidth={1} />
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight uppercase">Protocolo Não Encontrado</h2>
          <p className="text-white/40 text-[11px] font-bold uppercase tracking-[0.3em] leading-relaxed">
            O registro solicitado não existe em nossa rede ou foi movido para um diretório privado.
          </p>
        </div>

        <div className="pt-8">
          <button
            onClick={() => navigate("/")}
            className="group flex items-center gap-4 mx-auto text-[10px] font-bold uppercase tracking-[0.4em] text-brand-primary border-b border-brand-primary/20 pb-2 hover:border-brand-primary transition-all"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
            Retornar à Vitrine
          </button>
        </div>
      </motion.div>

      <div className="fixed bottom-12 left-0 right-0 flex justify-center opacity-10">
        <img src="/logo-fs.png" alt="Foto Segundo" style={{ height: 20, objectFit: "contain", filter: "grayscale(1) brightness(2)" }} />
      </div>
    </div>
  );
}

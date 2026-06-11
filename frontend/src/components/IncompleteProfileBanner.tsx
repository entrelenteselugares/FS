import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'framer-motion';

export const IncompleteProfileBanner: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user || user.profileComplete) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="bg-brand-tactical text-zinc-950 px-4 py-2 flex items-center justify-center gap-4 relative overflow-hidden"
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">
            Seu perfil está incompleto! Complete agora e ganhe um cupom de FRETE GRÁTIS.
          </span>
        </div>
        
        <button 
          onClick={() => navigate('/minha-conta?s=menu')}
          className="bg-zinc-950 text-brand-tactical px-3 py-1 rounded-full text-[9px] font-bold uppercase flex items-center gap-1 hover:scale-105 transition-transform"
        >
          COMPLETAR <ArrowRight size={12} />
        </button>

        {/* Subtle animated background pulse */}
        <motion.div 
          animate={{ x: ['-100%', '100%'] }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none"
        />
      </motion.div>
    </AnimatePresence>
  );
};

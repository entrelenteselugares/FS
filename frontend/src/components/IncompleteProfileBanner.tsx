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
        className="bg-blue-500 text-white px-4 py-2 flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 relative overflow-hidden shadow-lg z-50"
      >
        <div className="flex items-center gap-2">
          <AlertCircle size={16} className="shrink-0" />
          <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">
            Seu perfil está incompleto! Complete agora e ganhe um cupom de FRETE GRÁTIS.
          </span>
        </div>
        
        <button 
          onClick={() => navigate('/minha-conta?s=menu')}
          className="bg-white text-blue-500 px-3 py-1.5 rounded-full text-[9px] font-black uppercase flex items-center gap-1 hover:scale-105 transition-transform"
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

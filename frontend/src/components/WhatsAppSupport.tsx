import React from 'react';
import { motion } from 'framer-motion';
import { MessageCircle } from 'lucide-react';

interface WhatsAppSupportProps {
  phoneNumber?: string;
  message?: string;
}

const WhatsAppSupport: React.FC<WhatsAppSupportProps> = ({ 
  phoneNumber = "5511999999999", // Placeholder, deve vir de config futuramente
  message = "Olá! Estou no checkout do Foto Segundo e tenho uma dúvida sobre meu pedido..."
}) => {
  const handleClick = () => {
    const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-24 right-6 z-[200] md:bottom-10 md:right-10"
    >
      <button
        onClick={handleClick}
        className="flex items-center gap-3 bg-[#25D366] text-white px-6 py-4 rounded-full shadow-[0_10px_30px_rgba(37,211,102,0.4)] hover:brightness-110 transition-all group"
      >
        <MessageCircle size={24} fill="white" />
        <span className="text-[10px] font-black uppercase tracking-widest hidden md:inline">
          Dúvidas no Pagamento?
        </span>
        
        {/* Tooltip Mobile */}
        <div className="absolute -top-12 right-0 bg-white text-black text-[9px] font-bold px-3 py-1.5 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap md:hidden">
          Falar com Suporte
        </div>
      </button>
    </motion.div>
  );
};

export default WhatsAppSupport;

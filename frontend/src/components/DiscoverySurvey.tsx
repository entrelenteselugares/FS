import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../hooks/useAuth";

export const DiscoverySurvey: React.FC = () => {
  const { user, loading: authLoading, updateMe } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Aguarda o carregamento da autenticação antes de decidir se exibe o modal.
  // Sem isso, o modal abre toda vez que o usuário faz login porque `user`
  // ainda é null no momento da montagem e o useState inicial fica travado em true.
  useEffect(() => {
    if (authLoading) return;

    if (user && user.referredById && !user.discoverySource) {
      // Se veio por indicação/convite, já sabemos o canal e atualizamos em background
      updateMe({ discoverySource: "referral" }).catch(console.error);
      setIsOpen(false);
      return;
    }

    setIsOpen(!!user && !user.discoverySource);
  }, [authLoading, user, updateMe]);

  const options = [
    { id: "instagram", label: "📸 Instagram", desc: "Vi um post ou anúncio" },
    { id: "google", label: "🔍 Google", desc: "Pesquisei e encontrei" },
    { id: "referral", label: "🤝 Indicação", desc: "Um amigo me recomendou" },
    { id: "event", label: "🎪 Evento", desc: "Conheci em uma cobertura" },
    { id: "other", label: "✨ Outros", desc: "Outro canal de descoberta" },
  ];

  const handleSelect = async (source: string) => {
    setSubmitting(true);
    try {
      await updateMe({ discoverySource: source });
      setIsOpen(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[6000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9, y: 40 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="w-full max-w-xl bg-zinc-950 border border-brand-tactical/20 p-10 space-y-10 relative overflow-hidden"
        >
          {/* Background Elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-tactical/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="space-y-3 relative z-10">
            <p className="text-[10px] font-bold text-brand-tactical uppercase tracking-[0.4em] ">Missão Reconhecimento</p>
            <h2 className="text-4xl font-heading font-bold text-white uppercase leading-none">Como você chegou na Foto Segundo?</h2>
            <p className="text-xs text-zinc-500 font-medium leading-relaxed max-w-md ">Sua resposta nos ajuda a fortalecer a rede e levar mais oportunidades para fotógrafos de todo o Brasil.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {options.map((opt) => (
              <button
                key={opt.id}
                onClick={() => handleSelect(opt.id)}
                disabled={submitting}
                className="p-6 border border-zinc-800 bg-zinc-900/50 text-left hover:border-brand-tactical transition-all group flex flex-col gap-2 disabled:opacity-50"
              >
                <p className="text-[11px] font-bold text-white uppercase tracking-widest group-hover:text-brand-tactical transition-colors ">{opt.label}</p>
                <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-widest">{opt.desc}</p>
              </button>
            ))}
          </div>

          <p className="text-[8px] text-zinc-700 font-bold uppercase tracking-widest text-center ">© Foto Segundo · Inteligência de Rede</p>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

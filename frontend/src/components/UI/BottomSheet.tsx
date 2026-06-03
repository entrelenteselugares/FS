import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({ isOpen, onClose, title, children }) => {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[101] bg-theme-bg-card border-t border-theme-border rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.3)] md:hidden max-h-[90dvh] flex flex-col"
          >
            {/* Handle & Header */}
            <div className="shrink-0 flex flex-col items-center pt-3 pb-4 border-b border-theme-border relative">
              <div className="w-12 h-1.5 bg-theme-border/50 rounded-full mb-4" />
              {title && (
                <h3 className="text-sm font-black uppercase tracking-widest text-theme-text italic">
                  {title}
                </h3>
              )}
              <button 
                onClick={onClose} 
                className="absolute right-4 top-4 p-2 text-theme-muted hover:bg-theme-bg-muted rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 pb-24 custom-scrollbar overscroll-contain">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

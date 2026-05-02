import React, { useEffect } from "react";
import { ModalOverlay, ModalContent, T, BtnGhost } from "../../lib/theme";
import { X } from "lucide-react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

/**
 * Componente de Modal Unificado (Design System v2.0)
 * Implementa Glassmorphism, fechamento via ESC/Click-outside e estética minimalista.
 */
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth
}) => {
  // Bloquear scroll do body quando aberto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  // Fechar no ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div 
      style={ModalOverlay} 
      onClick={(e) => e.target === e.currentTarget && onClose()}
      id="modal-overlay"
    >
      <div className="mobile-w-full" style={{ 
        ...ModalContent, 
        maxWidth: maxWidth || ModalContent.maxWidth,
        padding: window.innerWidth < 768 ? "1.5rem" : ModalContent.padding,
        margin: window.innerWidth < 768 ? "10px" : "0"
      }}>
        {/* Header */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "1.25rem",
          borderBottom: `1px solid ${T.border}`,
          paddingBottom: "0.75rem"
        }}>
          {title && (
            <h3 style={{ 
              fontFamily: T.fontD, 
              fontSize: "18px", 
              fontWeight: 900, 
              textTransform: "uppercase",
              letterSpacing: "1px",
              margin: 0
            }}>
              {title}
            </h3>
          )}
          <button 
            onClick={onClose}
            style={{ 
              ...BtnGhost, 
              padding: "4px", 
              border: "none", 
              color: T.text2,
              display: "flex",
              alignItems: "center"
            }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div id="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};

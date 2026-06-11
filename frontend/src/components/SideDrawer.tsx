import React, { useEffect } from "react";
import { X } from "lucide-react";
import { T } from "../lib/theme";

interface SideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  width?: string;
}

export const SideDrawer: React.FC<SideDrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = "max-w-xl",
}) => {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className={`absolute inset-y-0 right-0 flex ${width} w-full shadow-2xl`}>
        <div 
          className="relative flex w-full flex-col bg-theme-bg border-l border-theme-border animate-in slide-in-from-right duration-500 ease-in-out"
          style={{ background: T.bg }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-theme-border">
            {title && (
              <h2 className="text-xl font-heading font-bold uppercase text-theme-text">
                {title}
              </h2>
            )}
            <button
              onClick={onClose}
              className="p-2 text-theme-muted hover:text-theme-text transition-colors rounded-full hover:bg-theme-border/20"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

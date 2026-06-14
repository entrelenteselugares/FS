import React, { useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Unlock, Camera, Download, UserPlus } from "lucide-react";

const FlashUnlockPage: React.FC = () => {
  const { shortId } = useParams<{ shortId: string }>();
  const navigate = useNavigate();
  const [pin, setPin] = useState<string[]>(new Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [mediaData, setMediaData] = useState<any>(null);
  
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handlePinChange = (index: number, value: string) => {
    if (isNaN(Number(value))) return;
    
    const newPin = [...pin];
    newPin[index] = value.substring(value.length - 1);
    setPin(newPin);

    // Auto focus next
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto submit if complete
    if (newPin.every(digit => digit !== "") && index === 5) {
      submitPin(newPin.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const submitPin = async (fullPin: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await API.post("/flash/unlock", {
        shortId,
        pin: fullPin
      });
      
      const { token, media } = response.data;
      localStorage.setItem("flash_token", token);
      setMediaData(media);
      setUnlocked(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "PIN inválido. Tente novamente.");
      setPin(new Array(6).fill(""));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-theme-text flex flex-col items-center justify-center p-3 md:p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px]" />

      <AnimatePresence mode="wait">
        {!unlocked ? (
          <motion.div 
            key="lock-screen"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md text-center z-10"
          >
            <div className="mb-8 flex justify-center">
              <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                <Lock className="w-10 h-10 text-theme-brand" />
              </div>
            </div>

            <h1 className="text-3xl font-bold mb-2 uppercase">
              Sua foto está segura
            </h1>
            <p className="text-theme-muted mb-8 px-4">
              Digite o PIN de 6 dígitos que está no seu cartão para visualizar o momento.
            </p>

            <div className="flex justify-between gap-2 mb-6">
              {pin.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el: HTMLInputElement | null): void => { inputRefs.current[idx] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handlePinChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  className="w-12 h-16 bg-[#1a1a1a] border border-white/10 rounded-xl text-center text-2xl font-bold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all outline-none"
                />
              ))}
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-400 mb-4 font-medium"
              >
                {error}
              </motion.p>
            )}

            {loading && (
              <div className="flex justify-center mb-4">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            <div className="mt-12 text-theme-muted text-sm flex items-center justify-center gap-2">
              <Camera className="w-4 h-4" />
              Powered by Foto Segundo
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content-screen"
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl z-10 flex flex-col items-center"
          >
            <div className="mb-6 flex items-center gap-3 bg-emerald-500/10 px-4 py-2 rounded-full border border-emerald-500/20">
              <Unlock className="w-5 h-5 text-theme-brand" />
              <span className="text-theme-brand font-bold tracking-widest text-sm">DESBLOQUEADO</span>
            </div>

            {mediaData ? (
              <div className="relative group w-full aspect-[3/4] max-h-[70vh] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                <img 
                  src={mediaData.url} 
                  alt="Sua foto" 
                  className="w-full h-full object-cover"
                />
                {/* Watermark Placeholder Overlay */}
                <div className="absolute inset-0 bg-black/20 pointer-events-none flex items-center justify-center overflow-hidden">
                   <div className="rotate-[-30deg] opacity-20 text-2xl md:text-4xl md:text-6xl font-bold whitespace-nowrap select-none">
                      FOTO SEGUNDO • FOTO SEGUNDO • FOTO SEGUNDO
                   </div>
                </div>
              </div>
            ) : (
              <div className="w-full aspect-video bg-[#1a1a1a] rounded-2xl flex flex-col items-center justify-center text-center p-4 md:p-8 border border-white/10">
                <Camera className="w-16 h-16 text-theme-muted mb-4" />
                <h2 className="text-xl font-bold mb-2">Quase lá!</h2>
                <p className="text-theme-muted">O fotógrafo está processando sua foto. Atualize esta página em alguns instantes.</p>
              </div>
            )}

            {/* CTAs */}
            <div className="w-full mt-8 space-y-4">
              <button 
                onClick={() => navigate("/register?claim=" + shortId)}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-theme-text font-bold rounded-xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(133,185,172,0.3)]"
              >
                <Download className="w-6 h-6" />
                REMOVER MARCA D&apos;ÁGUA E SALVAR
              </button>
              
              <button 
                onClick={() => navigate("/login")}
                className="w-full py-4 bg-theme-bg-muted hover:bg-white/10 text-theme-text font-bold rounded-xl transition-all flex items-center justify-center gap-3"
              >
                <UserPlus className="w-5 h-5" />
                JÁ TENHO CONTA
              </button>
            </div>

            <p className="mt-8 text-theme-muted text-xs text-center max-w-xs">
              Ao salvar, esta foto será transferida permanentemente para sua galeria privada.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FlashUnlockPage;

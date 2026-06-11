import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface CountdownTimerProps {
  targetDate: string;
  onComplete?: () => void;
}

export const CountdownTimer = ({ targetDate, onComplete }: CountdownTimerProps) => {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
    isComplete: false
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(targetDate) - +new Date();
      
      if (difference <= 0) {
        setTimeLeft(prev => ({ ...prev, isComplete: true }));
        onComplete?.();
        return;
      }

      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
        isComplete: false
      });
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Inicial

    return () => clearInterval(timer);
  }, [targetDate, onComplete]);

  if (timeLeft.isComplete) return null;

  const showDays = timeLeft.days > 0;
  const showHours = timeLeft.hours > 0 || showDays; // Mostrar horas se houver dias ou se houver horas

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center justify-center gap-2 lg:gap-4 bg-theme-bg-muted border border-theme-border backdrop-blur-xl px-4 py-4 lg:px-8 lg:py-6 rounded-sm w-full max-w-fit mx-auto"
      >
        {showDays && (
          <>
            <TimeUnit value={timeLeft.days} label="Dias" />
            <div className="h-8 w-px bg-white/10" />
          </>
        )}
        
        {showHours && (
          <>
            <TimeUnit value={timeLeft.hours} label="Horas" />
            <div className="h-8 w-px bg-white/10" />
          </>
        )}
        
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <div className="h-8 w-px bg-white/10" />
        <TimeUnit value={timeLeft.seconds} label="Seg" />
      </motion.div>
    </AnimatePresence>
  );
};

const TimeUnit = ({ value, label }: { value: number; label: string }) => (
  <div className="flex flex-col items-center flex-1 min-w-[60px]">
    <motion.div 
      key={value}
      initial={{ y: 10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="text-2xl lg:text-4xl font-bold font-display "
    >
      {value.toString().padStart(2, '0')}
    </motion.div>
    <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-theme-muted mt-1">{label}</span>
  </div>
);

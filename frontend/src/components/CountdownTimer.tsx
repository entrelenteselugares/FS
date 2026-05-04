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

  const TimeUnit = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <motion.div 
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="text-2xl lg:text-4xl font-black font-display tracking-tighter"
      >
        {value.toString().padStart(2, '0')}
      </motion.div>
      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-theme-muted mt-1">{label}</span>
    </div>
  );

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex items-center gap-4 lg:gap-8 bg-white/5 border border-theme-border backdrop-blur-xl px-6 py-4 lg:px-10 lg:py-6 rounded-sm"
      >
        <TimeUnit value={timeLeft.days} label="Dias" />
        <div className="h-8 w-px bg-white/10" />
        <TimeUnit value={timeLeft.hours} label="Horas" />
        <div className="h-8 w-px bg-white/10" />
        <TimeUnit value={timeLeft.minutes} label="Min" />
        <div className="h-8 w-px bg-white/10" />
        <TimeUnit value={timeLeft.seconds} label="Seg" />
      </motion.div>
    </AnimatePresence>
  );
};

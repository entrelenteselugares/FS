import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { T } from "../lib/theme";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, QrCode, Ticket, Star, ChevronRight, ChevronLeft, Trophy } from "lucide-react";

const FALLBACK_SLIDES = [
  {
    id: "copa2026",
    title: "COPA 2026",
    subtitle: "Álbum da Torcida",
    desc: "Colecione figurinhas exclusivas das suas fotos nos jogos do mundial e acompanhe o chaveamento em tempo real!",
    primaryBtn: "ACESSAR ÁLBUM",
    primaryAction: "/album-torcida",
    icon: "trophy",
    bgImage: "/copa_stadium_banner.png",
  },
  {
    id: "institucional",
    title: "MOMENTOS",
    subtitle: "Inesquecíveis",
    desc: "A melhor experiência fotográfica para o seu evento. Qualidade impecável e entrega ultrarrápida.",
    primaryBtn: "EXPLORAR VITRINE",
    primaryAction: "/vitrine",
    icon: "camera",
    bgImage: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "servicos",
    title: "COBERTURAS",
    subtitle: "Profissionais",
    desc: "Casamentos, corporativos, aniversários e ensaios. Contrate os melhores fotógrafos da região sob medida.",
    primaryBtn: "SOLICITAR ORÇAMENTO",
    primaryAction: "/cotacao",
    icon: "camera",
    bgImage: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "qrcode",
    title: "RECONHECIMENTO",
    subtitle: "Instantâneo",
    desc: "Suas fotos entregues no seu celular durante o evento através de Inteligência Artificial e QR Code Inteligente.",
    primaryBtn: "COMO FUNCIONA",
    primaryAction: "/sobre",
    icon: "qrcode",
    bgImage: "https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "comissoes",
    title: "INGRESSOS &",
    subtitle: "Comissões",
    desc: "Organize seu evento, adicione seu link de ingressos e cupom promocional. Ganhe comissões exclusivas sobre a venda de fotos!",
    primaryBtn: "SEJA UM PARCEIRO",
    primaryAction: "/cotacao",
    icon: "ticket",
    bgImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=1600",
  },
  {
    id: "feedback",
    title: "COMUNIDADE",
    subtitle: "Foto Segundo",
    desc: "\"A experiência mais incrível que já tive! Fotos com altíssima qualidade entregues na hora. Simplesmente mágico!\" - Marina S.",
    primaryBtn: "VER AVALIAÇÕES",
    primaryAction: "/sobre",
    icon: "star",
    bgImage: "https://images.unsplash.com/photo-1531058020387-3be344556be6?auto=format&fit=crop&q=80&w=1600",
  }
];



interface Slide {
  id: string;
  title: string;
  subtitle: string;
  desc: string;
  description?: string;
  primaryBtn: string;
  primaryAction: string;
  icon: string;
  bgImage: string;
}

export function HeroCarousel() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(FALLBACK_SLIDES);

  useEffect(() => {
    fetch("https://foto-segundo.vercel.app/api/public/banners")
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (data.banners && data.banners.length > 0) {
          setSlides(data.banners);
        }
      })
      .catch(() => {
        // fetch relative path locally
        fetch("/api/public/banners")
          .then(res => {
            if (!res.ok) throw new Error('Network response was not ok');
            return res.json();
          })
          .then(data => {
             if (data.banners && data.banners.length > 0) {
               setSlides(data.banners);
             }
          })
          .catch(e => console.error("[HeroCarousel] Fallback to default slides.", e.message));
      });
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 8000); // 8 seconds per slide
    return () => clearInterval(timer);
  }, [slides.length]);

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % slides.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div className="relative w-full bg-zinc-950 group min-h-[260px] md:min-h-[400px] lg:min-h-[450px] h-[260px] md:h-[400px] lg:h-[450px]">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${currentSlide.bgImage})` }}
          />
          {/* Dark Gradients for Text Legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent opacity-80" />
          
          {/* Content Layer */}
          <div className="absolute inset-0 flex flex-col justify-center items-center md:items-start text-center md:text-left px-6 md:px-16 w-full md:w-2/3 pr-6 md:pr-16 py-4 md:py-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-col items-center md:items-start w-full"
            >
              <div className="text-emerald-500 mb-2 md:mb-4">
                {currentSlide.icon === "trophy" && <Trophy className="w-8 h-8 md:w-10 md:h-10" />}
                {currentSlide.icon === "qrcode" && <QrCode className="w-8 h-8 md:w-10 md:h-10" />}
                {currentSlide.icon === "ticket" && <Ticket className="w-8 h-8 md:w-10 md:h-10" />}
                {currentSlide.icon === "star" && <Star className="w-8 h-8 md:w-10 md:h-10" />}
                {currentSlide.icon !== "trophy" && currentSlide.icon !== "qrcode" && currentSlide.icon !== "ticket" && currentSlide.icon !== "star" && <Camera className="w-8 h-8 md:w-10 md:h-10" />}
              </div>
              
              <h1 className="text-2xl md:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight mb-1 md:mb-2 text-center md:text-left w-full">
                <span className="block">{currentSlide.title}</span>
                <span className="text-emerald-400 italic bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-teal-300 block mt-1">
                  {currentSlide.subtitle}
                </span>
              </h1>
              
              <p className="text-zinc-300 text-xs md:text-base font-medium max-w-md md:max-w-lg mx-auto md:mx-0 mt-3 md:mt-6 text-center md:text-left" style={{ fontFamily: T.fontD, textWrap: "balance" }}>
                {currentSlide.description || currentSlide.desc}
              </p>

              <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 md:mt-8 w-full">
                <button 
                  onClick={() => navigate(currentSlide.primaryAction)}
                  className="px-6 py-2.5 md:px-8 md:py-4 bg-emerald-500 text-black text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] hover:bg-emerald-400 transition-colors rounded-full shadow-[0_0_20px_rgba(16,185,129,0.3)]"
                >
                  {currentSlide.primaryBtn}
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows (Visible on Desktop Hover) */}
      <button 
        onClick={handlePrev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-emerald-500/80 hover:text-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:flex"
      >
        <ChevronLeft size={24} />
      </button>
      <button 
        onClick={handleNext}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-black/40 hover:bg-emerald-500/80 hover:text-black text-white rounded-full flex items-center justify-center backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 z-20 hidden md:flex"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrentIndex(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/30 hover:bg-white/50'}`}
            aria-label={`Ir para o slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

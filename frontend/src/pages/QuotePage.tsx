import { useState, useEffect } from "react";
import { useQuoteFlow } from "../hooks/useQuoteFlow";
import { QuoteDesktopView } from "../components/quote/QuoteDesktopView";
import { QuoteMobileView } from "../components/quote/QuoteMobileView";

export const QuotePage = () => {
  const quoteState = useQuoteFlow();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (quoteState.loading) {
    return (
      <div className="min-h-screen bg-theme-bg flex flex-col items-center justify-center gap-6">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
        <div className="relative z-10 flex flex-col items-center gap-8">
          <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
          <div className="text-[18px] font-display font-black uppercase tracking-[0.8em] italic text-theme-text">FOTO SEGUNDO</div>
          <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Configurando Motor Tático</div>
          <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
        </div>
      </div>
    );
  }

  return isMobile ? <QuoteMobileView {...quoteState} /> : <QuoteDesktopView {...quoteState} />;
}

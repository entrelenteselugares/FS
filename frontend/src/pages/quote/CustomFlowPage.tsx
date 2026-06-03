import { useState, useEffect } from "react";
import { useCustomFlow } from "../../hooks/useCustomFlow";
import { QuoteDesktopView } from "../../components/quote/QuoteDesktopView";
import { QuoteMobileView } from "../../components/quote/QuoteMobileView";

export const CustomFlowPage = () => {
  const quoteState = useCustomFlow();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <QuoteMobileView {...quoteState} /> : <QuoteDesktopView {...quoteState} />;
};

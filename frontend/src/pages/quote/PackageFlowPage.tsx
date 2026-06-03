import { useState, useEffect } from "react";
import { usePackageFlow } from "../../hooks/usePackageFlow";
import { QuoteDesktopView } from "../../components/quote/QuoteDesktopView";
import { PackageMobileView } from "../../components/quote/PackageMobileView";

export const PackageFlowPage = () => {
  const quoteState = usePackageFlow();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return isMobile ? <PackageMobileView {...quoteState} /> : <QuoteDesktopView {...quoteState} />;
};


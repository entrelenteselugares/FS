import { useQuoteFlow } from "./useQuoteFlow";
import { useEffect } from "react";

export const usePartnerFlow = () => {
  const quoteState = useQuoteFlow();

  // Force PARTNER flow on mount
  useEffect(() => {
    quoteState.selectFlow("PARTNER");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...quoteState,
    flowType: "PARTNER"
  };
};

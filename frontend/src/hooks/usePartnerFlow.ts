import { useQuoteFlow } from "./useQuoteFlow";
import { useEffect } from "react";

export const usePartnerFlow = () => {
  const quoteState = useQuoteFlow();

  // Force PARTNER flow on mount
  useEffect(() => {
    // 
    if (quoteState.setFlowType) quoteState.setFlowType("PARTNER");
    // 
    if (quoteState.step === 0 && quoteState.setStep) quoteState.setStep(1);
    // 
    if (quoteState.setLocationType) quoteState.setLocationType("PARTNER");
  }, [quoteState]);

  return {
    ...quoteState,
    flowType: "PARTNER"
  };
};

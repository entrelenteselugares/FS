import { useQuoteFlow } from "./useQuoteFlow";
import { useEffect } from "react";

export const useCustomFlow = () => {
  const quoteState = useQuoteFlow();

  // Force CUSTOM flow on mount
  useEffect(() => {
    // 
    if (quoteState.setFlowType) quoteState.setFlowType("CUSTOM");
    // 
    if (quoteState.step === 0 && quoteState.setStep) quoteState.setStep(1);
    // 
    if (quoteState.setLocationType) quoteState.setLocationType("OTHER");
  }, [quoteState]);

  return {
    ...quoteState,
    flowType: "CUSTOM"
  };
};

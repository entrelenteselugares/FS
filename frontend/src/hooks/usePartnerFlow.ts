import { useQuoteFlow } from "./useQuoteFlow";
import { useEffect } from "react";

export const usePartnerFlow = () => {
  const quoteState = useQuoteFlow();

  // Force PARTNER flow on mount
  useEffect(() => {
    // @ts-ignore
    if (quoteState.setFlowType) quoteState.setFlowType("PARTNER");
    // @ts-ignore
    if (quoteState.step === 0 && quoteState.setStep) quoteState.setStep(1);
    // @ts-ignore
    if (quoteState.setLocationType) quoteState.setLocationType("PARTNER");
  }, [quoteState]);

  return {
    ...quoteState,
    flowType: "PARTNER"
  };
};

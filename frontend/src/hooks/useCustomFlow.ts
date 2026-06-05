import { useQuoteFlow } from "./useQuoteFlow";
import { useEffect } from "react";

export const useCustomFlow = () => {
  const quoteState = useQuoteFlow();

  // Force CUSTOM flow on mount
  useEffect(() => {
    quoteState.selectFlow("CUSTOM");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    ...quoteState,
    flowType: "CUSTOM"
  };
};

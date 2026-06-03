import { useNavigate } from "react-router-dom";
import { QuoteLandingView } from "../components/quote/QuoteLandingView";

export const QuotePage = () => {
  const navigate = useNavigate();

  const handleSelectFlow = (type: "PACKAGE" | "PARTNER" | "CUSTOM") => {
    if (type === "PACKAGE") navigate("/cotacao/pacotes");
    else if (type === "PARTNER") navigate("/cotacao/unidades");
    else if (type === "CUSTOM") navigate("/cotacao/customizado");
  };

  return <QuoteLandingView selectFlow={handleSelectFlow} />;
}

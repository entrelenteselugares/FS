import { useState, useEffect } from "react";
import { API } from "../lib/api";
import { useAuth } from "./useAuth";

export const MOCK_PACKAGES = [
  { id: "pocket", name: "Pacote Pocket", price: 900, hours: 4, services: ["foto"], desc: "4h Cobertura • 1 Fotógrafo • 100 Fotos Tratadas" },
  { id: "essencial", name: "Pacote Essencial", price: 1900, hours: 6, services: ["foto", "video", "reels"], desc: "6h Cobertura • 1 Foto + 1 Video • Aftermovie" },
  { id: "premium", name: "Pacote Premium", price: 2800, hours: 8, services: ["foto", "video", "reels", "impresso"], desc: "8h Cobertura • 2 Foto + 1 Video • Álbum" }
];

export const usePackageFlow = () => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [selectedPackageId, setSelectedPackageId] = useState("essencial");
  const [customCep, setCustomCep] = useState("");
  const [addressData, setAddressData] = useState({ logradouro: "", bairro: "", cidade: "", uf: "" });
  const [addressNumber, setAddressNumber] = useState("");
  const [isCepLoading, setIsCepLoading] = useState(false);
  
  const [eventDate, setEventDate] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [description, setDescription] = useState("");
  const [ticketUrl, setTicketUrl] = useState("");
  const [fotoSegundoPromoCode, setFotoSegundoPromoCode] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);

  // Auto-fill user data when logged in
  useEffect(() => {
    if (user) {
      if (user.nome && !name) setName(user.nome);
      if (user.email && !email) setEmail(user.email);
      if ((user as any).whatsapp && !whatsapp) setWhatsapp((user as any).whatsapp);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const selectedPackage = MOCK_PACKAGES.find(p => p.id === selectedPackageId) || MOCK_PACKAGES[1];

  const handleCepChange = async (val: string) => {
    let raw = val.replace(/\D/g, "");
    if (raw.length > 5) raw = raw.replace(/^(\d{5})(\d)/, "$1-$2");
    setCustomCep(raw);

    if (raw.length === 9) {
      setIsCepLoading(true);
      try {
        const res = await fetch(`https://viacep.com.br/ws/${raw.replace("-", "")}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setAddressData({
            logradouro: data.logradouro,
            bairro: data.bairro,
            cidade: data.localidade,
            uf: data.uf
          });
        }
      } catch (err) {
        console.error("Erro viaCep:", err);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!customCep || !addressData.logradouro || !eventDate) {
        alert("Por favor, preencha o CEP e a Data do Evento.");
        return;
      }
      setStep(3); // QuoteDesktopView and MobileView expect step 3 for "Seus Dados"
      window.scrollTo(0,0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(1);
      window.scrollTo(0,0);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const fullAddress = `${addressData.logradouro}, ${addressNumber} - ${addressData.bairro}, ${addressData.cidade}/${addressData.uf} (CEP: ${customCep})`;

    const payload = {
      title: name, 
      email, 
      whatsapp, 
      attendees: 100, // Fixed for Package Essencial
      locationType: "OTHER", 
      usageType: "PESSOAL", 
      selectedPartnerId: null, 
      category: "CASAMENTO", // Default or you could add a selector if needed
      customCep, 
      location: fullAddress,
      eventDate, 
      eventHours: selectedPackage.hours, 
      eventDays: 1, 
      description, 
      selectedServices: selectedPackage.services, 
      totalPrice: selectedPackage.price, 
      flowType: "PACKAGE", // Critical for backend to know it requires checkout
      status: "PENDING",
      ticketUrl,
      fotoSegundoPromoCode
    };

    try {
      const { data } = await API.post("/public/quotes", payload);
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCreatedQuoteId(data.eventId);
        setStep(3); // Success Screen
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || err.response?.data?.error || "Erro ao processar orçamento.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
    step, setStep, nextStep, prevStep,
    customCep, handleCepChange, isCepLoading, addressData, addressNumber, setAddressNumber,
    eventDate, setEventDate,
    name, setName, email, setEmail, whatsapp, setWhatsapp, description, setDescription,
    ticketUrl, setTicketUrl, fotoSegundoPromoCode, setFotoSegundoPromoCode,
    submitting, submitError, createdQuoteId, handleSubmit,
    flowType: "PACKAGE", locationType: "OTHER", partners: [], pros: [], totalPrice: selectedPackage.price,
    showPrices: false, getServicePrice: () => 0, selectedServices: selectedPackage.services,
    availableServices: [], attendees: "100",
    availablePackages: MOCK_PACKAGES, selectedPackageId, setSelectedPackageId
  };
};

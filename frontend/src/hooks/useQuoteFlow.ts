import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useAuth } from "./useAuth";
import { useViaCep } from "./useViaCep";

interface Partner {
  id: string;
  name: string;
  city: string;
  disabledServices?: string[];
  eventTypes?: string[];
  prices?: Record<string, number>;
  fixedDuration?: number;
  workingHours?: any;
}

interface Professional {
  id: string;
  nome?: string;
}

interface Service {
  id: string;
  name: string;
  basePrice: number;
  category?: string;
  description?: string;
  eventTypes?: string[];
}

const P = {
  COST_SENIOR: 160,
  COST_AUX: 60,
  FEE_TOLL: 25,
  BASE_FREIGHT: 15,
  KM_RATE: 2.50,
  SERVICES: [
    { id: "foto", label: "FOTOGRAFIA DIGITAL", price: 190, required: true, category: "Geral", description: "Cobertura fotográfica profissional." },
    { id: "video", label: "VÍDEO BRUTO", price: 190, category: "Geral", description: "Captação de vídeo sem edição." },
    { id: "reels", label: "REELS / MOBILE", price: 120, category: "Geral", description: "Vídeos curtos otimizados para redes sociais." },
    { id: "impresso", label: "ÁLBUM / IMPRESSA", price: 120, category: "Phygital", description: "Impressão de fotos durante o evento." },
  ]
};

export function useQuoteFlow() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pros, setPros] = useState<Professional[]>([]);
  const [preferredProfessionalId, setPreferredProfessionalId] = useState("");
  
  // Mobile specific state handled inside components now, but we keep step control
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(true);

  // Form State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Service[]>([]);

  // Carregar dados iniciais
  useEffect(() => {
    Promise.all([
      API.get("/public/configs/services"),
      API.get("/public/unidades-fixas"),
      API.get("/marketplace/profissionais")
    ])
      .then(([catalogRes, partnersRes, prosRes]) => {
        if (catalogRes.data?.services?.length > 0) {
          setCatalog(catalogRes.data.services);
        }
        
        // Filter out partners that have no event types or services registered
        const activePartners = (partnersRes.data || []).filter((p: any) => {
          const hasEvents = p.eventTypes && p.eventTypes.length > 0;
          return hasEvents;
        });
        
        setPartners(activePartners);
        setPros(prosRes.data?.profissionais || []);

        const profId = searchParams.get("profId");
        if (profId) setPreferredProfessionalId(profId);
      })
      .catch(err => console.error("Erro ao carregar dados:", err))
      .finally(() => setLoading(false));
  }, [searchParams]);

  const [attendees, setAttendees] = useState<string>("0");
  const [locationType, setLocationType] = useState<"PARTNER" | "OTHER">("PARTNER");
  const [usageType, setUsageType] = useState<"PESSOAL" | "EMPRESARIAL">("PESSOAL");
  const [workflowPref, setWorkflowPref] = useState<string>("TRADICIONAL");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [category, setCategory] = useState("CASAMENTO");
  const currentPartner = useMemo(() => partners.find(p => p.id === selectedPartnerId), [partners, selectedPartnerId]);

  const availableServices = useMemo(() => {
    const raw: any[] = catalog.length > 0 
      ? catalog.map(s => ({ ...s, basePrice: Number(s.basePrice) }))
      : P.SERVICES.map(s => ({ id: s.id, name: s.label, basePrice: Number(s.price), category: s.category, description: s.description, eventTypes: [] }));
    
    let filtered = raw;
    if (locationType === "PARTNER" && currentPartner) {
      const disabled = currentPartner.disabledServices || [];
      filtered = filtered.filter(s => !disabled.includes(s.id));
    }
    
    filtered = filtered.filter(s => {
      if (!s.eventTypes || s.eventTypes.length === 0) return true;
      return s.eventTypes.includes(category);
    });

    return filtered;
  }, [catalog, locationType, currentPartner, category]);
  
  const [customCep, setCustomCep] = useState("");
  const [addressData, setAddressData] = useState({ logradouro: "", bairro: "", cidade: "", uf: "" });
  const [addressNumber, setAddressNumber] = useState("");
  const { fetchAddress, loading: isCepLoading } = useViaCep();

  const [eventDate, setEventDate] = useState("");
  const [eventHours, setEventHours] = useState(2);
  const [eventDays, setEventDays] = useState(1);
  const [description, setDescription] = useState("");
  const [availableBudget, setAvailableBudget] = useState<string>("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  
  const { user } = useAuth();
  const authUser = user as any;

  useEffect(() => {
    if (authUser) {
      if (!name) setName(authUser.nome || "");
      if (!email) setEmail(authUser.email || "");
      if (!whatsapp && authUser.whatsapp) setWhatsapp(authUser.whatsapp);
    }
  }, [authUser, name, email, whatsapp]);

  useEffect(() => {
    if (locationType === "PARTNER") {
      setEventDays(1);
      const p = partners.find(p => p.id === selectedPartnerId);
      if (p?.fixedDuration) {
        setEventHours(p.fixedDuration);
      }
    }
  }, [selectedPartnerId, locationType, partners]);

  useEffect(() => {
    if (locationType === "PARTNER") {
      const partnerTypes = currentPartner?.eventTypes || [];
      if (partnerTypes.length > 0) {
        if (!partnerTypes.includes(category)) {
          setCategory(partnerTypes[0]);
        }
      } else {
        setCategory("");
      }
    }
  }, [currentPartner, locationType, category]);


  const handleCepChange = async (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 8);
    setCustomCep(clean);
    
    if (clean.length === 8) {
      const data = await fetchAddress(clean);
      if (data) {
        setAddressData({
          logradouro: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          uf: data.uf
        });
      }
    }
  };

  const calculateTeam = () => {
    let senior = 1;
    let aux = 0;
    let extraGuestsCost = 0;

    const guestCount = Number(attendees) || 0;
    if (guestCount > 60 && guestCount <= 95) {
      aux = 1;
      extraGuestsCost += 80;
    } else if (guestCount > 95) {
      senior = Math.ceil(guestCount / 60);
      extraGuestsCost += (senior - 1) * 150;
    }

    let teamCount = senior + aux;
    if (selectedServices.includes("video")) teamCount += 1;
    if (selectedServices.includes("reels")) teamCount += 1;

    return { senior, aux, teamCount, extraGuestsCost };
  };

  const team = calculateTeam();
  const showPrices = (locationType === "PARTNER" && !!selectedPartnerId);

  const PARTNER_PRICE_KEYS: Record<string, string[]> = {
    foto:      ["foto", "foto-bruta", "fotografia", "foto-digital", "foto_bruta", "fotografia-digital"],
    video:     ["video", "video-bruto", "video-cinema", "video_bruto", "video-editado", "video_editado"],
    reels:     ["reels", "reels-stories", "social-media", "reels_stories", "reels-social-media"],
    impresso:  ["impresso", "foto-impressa", "album", "album-impresso", "foto_impressa", "album_impresso"],
  };

  const resolvePartnerPrice = (serviceId: string, prices: Record<string, number | null | undefined>): number | undefined => {
    if (prices[serviceId] !== undefined && prices[serviceId] !== null) return Number(prices[serviceId]);
    for (const [canonicalKey, aliases] of Object.entries(PARTNER_PRICE_KEYS)) {
      if (aliases.includes(serviceId.toLowerCase())) {
        if (prices[canonicalKey] !== undefined && prices[canonicalKey] !== null) {
          return Number(prices[canonicalKey]);
        }
      }
    }
    return undefined;
  };

  const getServicePrice = (id: string, defaultPrice: number) => {
    const dPrice = Number(defaultPrice);
    const hourMultiplier = 1 + ((eventHours - 1) * 0.4);
    if (locationType === "PARTNER" && selectedPartnerId) {
      const partnerPrice = resolvePartnerPrice(id, currentPartner?.prices || {});
      return partnerPrice !== undefined ? Number(partnerPrice) : dPrice;
    }
    if (locationType === "OTHER" && usageType === "PESSOAL") {
      return Math.round(dPrice * hourMultiplier);
    }
    return dPrice;
  };

  const servicesPrice = availableServices.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => {
    return acc + getServicePrice(s.id, s.basePrice);
  }, 0);

  const isOutsideCampinas = locationType === "OTHER" && customCep !== ""; 
  const freight = isOutsideCampinas ? P.BASE_FREIGHT + (20 * P.KM_RATE) + P.FEE_TOLL : 0; 
  const totalPrice = (servicesPrice + team.extraGuestsCost + freight) * eventDays;

  const [submitting, setSubmitting] = useState(false);
  const [createdQuoteId, setCreatedQuoteId] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    if (e) e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");

    const fullAddress = locationType === "PARTNER" 
      ? `Unidade: ${currentPartner?.name || 'Ponto Fixo'} - ${currentPartner?.city || ''}`
      : `${addressData.logradouro}, ${addressNumber} - ${addressData.bairro}, ${addressData.cidade}/${addressData.uf} (CEP: ${customCep})`;

    const payload = {
      title: name, email, whatsapp, attendees: Number(attendees), locationType, usageType, selectedPartnerId, 
      category, customCep, 
      location: fullAddress,
      eventDate, eventHours, eventDays, description, selectedServices, totalPrice, 
      availableBudget,
      preferredProfessionalId,
      workflowPref,
      status: "PENDING"
    };

    try {
      const { data } = await API.post("/public/quotes", payload);
      
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        setCreatedQuoteId(data.eventId);
        setStep(4); 
        window.scrollTo(0, 0);
      }
    } catch (err: unknown) {
      const error = err as any;
      const msg = error.response?.data?.message || error.response?.data?.error || "Erro ao processar orçamento. Tente novamente.";
      setSubmitError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const nextStep = () => {
    const isLocalOk = locationType === "PARTNER" ? !!selectedPartnerId : (!!customCep && !!addressData.logradouro);
    if (step === 1) {
      if (isLocalOk && eventDate) {
        setStep(2);
        setIsMobileSheetOpen(true);
        window.scrollTo(0,0);
      } else {
        if (locationType === "OTHER" && (!addressData.logradouro || !customCep)) {
          alert("Por favor, digite um CEP válido para encontrarmos o endereço.");
        } else {
          alert("Por favor, selecione o local e a data do evento.");
        }
      }
    } else if (step === 2) {
      setStep(3);
      setIsMobileSheetOpen(true);
      window.scrollTo(0,0);
    }
  };

  const prevStep = () => {
    if (step > 1) {
      setStep(step - 1);
      window.scrollTo(0,0);
    } else {
      navigate(-1);
    }
  };

  return {
    step, setStep, nextStep, prevStep,
    loading, partners, pros,
    preferredProfessionalId, setPreferredProfessionalId,
    isMobileSheetOpen, setIsMobileSheetOpen,
    selectedServices, setSelectedServices,
    catalog, availableServices,
    attendees, setAttendees,
    locationType, setLocationType,
    usageType, setUsageType,
    workflowPref, setWorkflowPref,
    selectedPartnerId, setSelectedPartnerId,
    category, setCategory,
    currentPartner,
    customCep, setCustomCep, handleCepChange, isCepLoading,
    addressData, setAddressData,
    addressNumber, setAddressNumber,
    eventDate, setEventDate,
    eventHours, setEventHours,
    eventDays, setEventDays,
    description, setDescription,
    availableBudget, setAvailableBudget,
    name, setName,
    email, setEmail,
    whatsapp, setWhatsapp,
    team, showPrices, getServicePrice, servicesPrice, freight, totalPrice,
    submitting, createdQuoteId, submitError, handleSubmit
  };
}

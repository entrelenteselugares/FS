import { useState, useEffect, useRef, useMemo } from "react";
import { Users, Calendar, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Clock, Home, Zap, Camera, Video, Printer, Smartphone, Building2, GraduationCap, Utensils } from "lucide-react";
import { API } from "../lib/api";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useViaCep } from "../hooks/useViaCep";

// ── Configurações de Precificação (Tactical Engine) 🛡️⚙️ ───────────
const P = {
  COST_SENIOR: 160, // Custo interno de referência
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

const THEME = {
  bg: "var(--bg)",
  bgCard: "var(--bg-card)",
  border: "var(--border)",
  accent: "var(--brand)",
  text: "var(--text)",
  text2: "var(--text-2)",
  fontD: "var(--font-d)",
  fontB: "var(--font-b)",
};

// ── DateTimePicker Customizado (Tactical Theme) 📅🛡️ ─────────────────
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface DayConfig {
  open: string;
  close: string;
  closed: boolean;
}

type WorkingHours = Record<string, DayConfig>;

interface Partner {
  id: string;
  name: string;
  city: string;
  prices?: Record<string, number>;
  fixedDuration?: number;
  fixedTime?: boolean;
  hideDuration?: boolean;
  workingHours?: WorkingHours;
  disabledServices?: string[];
}

interface UserProfile {
  nome?: string;
  email?: string;
  whatsapp?: string;
}

interface Service {
  id: string;
  name: string;
  basePrice: number;
  category?: string;
  description?: string;
}

function DateTimePicker({ value, onChange, workingHours }: { value: string; onChange: (v: string) => void; workingHours?: WorkingHours | null }) {
  const [open, setOpen] = useState(false);
  const [viewDate, setViewDate] = useState(() => value ? new Date(value) : new Date());
  const [hour, setHour] = useState(() => value?.split("T")[1]?.substring(0,2) || "09");
  const [minute, setMinute] = useState(() => value?.split("T")[1]?.substring(3,5) || "00");
  const ref = useRef<HTMLDivElement>(null);
  const selectedDate = value ? value.split("T")[0] : "";
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const buildCalendar = () => {
    const y = viewDate.getFullYear(), m = viewDate.getMonth();
    const firstDay = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (number | null)[] = Array(firstDay).fill(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  };

  const selectDay = (day: number) => {
    const y = viewDate.getFullYear();
    const m = String(viewDate.getMonth() + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    onChange(`${y}-${m}-${d}T${hour}:${minute}`);
  };

  const updateTime = (h: string, min: string) => {
    setHour(h); setMinute(min);
    if (selectedDate) onChange(`${selectedDate}T${h}:${min}`);
  };

  const displayValue = value
    ? new Intl.DateTimeFormat("pt-BR", { day:"2-digit", month:"long", year:"numeric" })
        .format(new Date(value.split("T")[0] + "T12:00")) + " às " + hour + ":" + minute + "h"
    : "";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Trigger */}
      <div onClick={() => setOpen(o => !o)} className="relative flex items-center cursor-pointer group">
        <Calendar size={18} className="absolute left-6 text-emerald-500 z-10 group-hover:scale-110 transition-transform" />
        <div
          className="fs-input w-full !pl-16 text-[11px] font-black uppercase tracking-widest min-h-[64px] flex items-center border border-theme-border bg-theme-bg-muted hover:border-emerald-500/40 transition-colors"
          style={{
            color: displayValue ? "var(--text)" : "var(--text-3)"
          }}
        >
          {displayValue || "SELECIONE A DATA E HORÁRIO"}
        </div>
      </div>

      {/* Popover */}
        {open && (
          <div
            key="picker"
            style={{
              position: "absolute", 
              bottom: "calc(100% + 15px)", 
              left: "50%", 
              transform: "translateX(-50%)", 
              zIndex: 9999,
              background: "var(--bg-card)", 
              border: "1px solid var(--border)",
              width: "min(340px, 92vw)", 
              padding: "24px", 
              boxShadow: "0 30px 90px rgba(0,0,0,0.4)",
              borderRadius: "0",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)"
            }}
          >
            {/* Month Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, padding: "0 4px" }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
                }}
                style={{ 
                  background: "var(--brand-dark)", border: "1px solid var(--brand-border)", 
                  color: "var(--brand)", cursor: "pointer", padding: 8, borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
                title="Mês Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text, textTransform: "uppercase", letterSpacing: 2 }}>
                  {MONTHS_PT[viewDate.getMonth()] || "Mês"}
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: THEME.accent, opacity: 0.8, letterSpacing: 1 }}>
                  {viewDate.getFullYear()}
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
                }}
                style={{ 
                  background: "var(--brand-dark)", border: "1px solid var(--brand-border)", 
                  color: "var(--brand)", cursor: "pointer", padding: 8, borderRadius: 4,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s"
                }}
                title="Próximo Mês"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Day Labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 6 }}>
              {DAYS_PT.map(d => (
                <div key={d} style={{ textAlign: "center", fontSize: 9, fontWeight: 800, color: THEME.text2, textTransform: "uppercase", letterSpacing: 1, padding: "4px 0" }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Calendar Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
              {buildCalendar().map((day, i) => {
                const y = viewDate.getFullYear();
                const m = String(viewDate.getMonth() + 1).padStart(2, "0");
                const dayStr = day ? `${y}-${m}-${String(day).padStart(2,"0")}` : "";
                const isPast = dayStr && dayStr < today;
                
                // Lógica de dia fechado 🛡️
                let isClosed = false;
                if (day && workingHours) {
                  const dateObj = new Date(y, Number(m) - 1, day);
                  const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                  const dayKey = weekDays[dateObj.getDay()];
                  if (workingHours[dayKey]?.closed) isClosed = true;
                }

                const isSelected = dayStr === selectedDate;
                const isToday = dayStr === today;
                const isDisabled = !day || isPast || isClosed;

                return (
                  <button key={i} disabled={isDisabled}
                    onClick={() => day && !isDisabled && selectDay(day)}
                    style={{
                      height: 34, width: "100%", border: "none", borderRadius: 0,
                      fontSize: 12, fontWeight: isSelected ? 900 : 500,
                      cursor: !isDisabled ? "pointer" : "default",
                      background: isSelected ? "var(--brand)" : isToday ? "var(--brand-dark)" : "transparent",
                      color: isSelected ? "var(--brand-text)" : (isPast || isClosed) ? "var(--text-3)" : !day ? "transparent" : "var(--text)",
                      opacity: isClosed ? 0.3 : 1,
                      outline: isToday && !isSelected ? "1px solid var(--brand)" : "none",
                      transition: "background 0.15s",
                    }}
                  >
                    {day || ""}
                    {isClosed && <div style={{ fontSize: 6, position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)" }}>✖</div>}
                  </button>
                );
              })}
            </div>

            {/* Time Selector */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Clock size={13} color={THEME.accent} />
                <span style={{ fontSize: 10, fontWeight: 800, color: THEME.text2, textTransform: "uppercase", letterSpacing: 2 }}>Horário do Evento</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={hour} onChange={e => updateTime(e.target.value, minute)}
                  style={{ flex: 1, background: "var(--theme-bg-muted)", border: `1px solid ${THEME.border}`, color: THEME.text, padding: "10px 8px", fontSize: 18, fontWeight: 900, textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2,"0")).map(h => {
                     // Oculta horas fora do expediente se parceiro selecionado 🛡️
                     let isWorkingHour = true;
                     if (selectedDate && workingHours) {
                       const dateObj = new Date(selectedDate + "T12:00");
                       const weekDays = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
                       const dayKey = weekDays[dateObj.getDay()];
                       const config = workingHours[dayKey];
                       if (config && !config.closed) {
                         if (h < config.open.split(":")[0] || h > config.close.split(":")[0]) isWorkingHour = false;
                       }
                     }
                     if (!isWorkingHour) return null;
                     return <option key={h} value={h}>{h}h</option>;
                  })}
                </select>
                <span style={{ color: THEME.accent, fontSize: 22, fontWeight: 900 }}>:</span>
                <select value={minute} onChange={e => updateTime(hour, e.target.value)}
                  style={{ flex: 1, background: "var(--theme-bg-muted)", border: `1px solid ${THEME.border}`, color: THEME.text, padding: "10px 8px", fontSize: 18, fontWeight: 900, textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  {["00","15","30","45"].map(m => (
                    <option key={m} value={m}>{m}min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Button */}
            {selectedDate && (
              <button onClick={() => setOpen(false)}
                style={{ width: "100%", marginTop: 16, background: THEME.accent, color: "var(--theme-text-on-brand)", border: "none", padding: "12px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3, cursor: "pointer" }}>
                CONFIRMAR DATA E HORÁRIO
              </button>
            )}
          </div>
        )}
    </div>
  );
}

export const QuotePage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [pros, setPros] = useState<any[]>([]);
  const [preferredProfessionalId, setPreferredProfessionalId] = useState("");
  
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
        setPartners(partnersRes.data || []);
        setPros(prosRes.data?.profissionais || []);

        // Pre-fill from query param
        const profId = searchParams.get("profId");
        if (profId) setPreferredProfessionalId(profId);
      })
      .catch(err => console.error("Erro ao carregar dados:", err))
      .finally(() => setLoading(false));
  }, []);

  const [attendees, setAttendees] = useState<string>("0");
  const [locationType, setLocationType] = useState<"PARTNER" | "OTHER">("PARTNER");
  const [usageType, setUsageType] = useState<"PESSOAL" | "EMPRESARIAL">("PESSOAL");
  const [workflowPref, setWorkflowPref] = useState<string[]>(["TRADICIONAL"]);
  const toggleWorkflow = (pref: string) => {
    setWorkflowPref(prev => {
      if (prev.includes(pref)) {
        if (prev.length === 1) return prev; // Mantém pelo menos um selecionado
        return prev.filter(p => p !== pref);
      }
      return [...prev, pref];
    });
  };
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const currentPartner = useMemo(() => partners.find(p => p.id === selectedPartnerId), [partners, selectedPartnerId]);

  const availableServices = useMemo(() => {
    const raw: Service[] = catalog.length > 0 
      ? catalog.map(s => ({ ...s, basePrice: Number(s.basePrice) }))
      : P.SERVICES.map(s => ({ id: s.id, name: s.label, basePrice: Number(s.price), category: s.category, description: s.description }));
    
    if (locationType === "PARTNER" && currentPartner) {
      const disabled = currentPartner.disabledServices || [];
      return raw.filter(s => !disabled.includes(s.id));
    }
    return raw;
  }, [catalog, locationType, currentPartner]);
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
  const authUser = user as UserProfile | null;

  useEffect(() => {
    if (authUser) {
      if (!name) setName(authUser.nome || "");
      if (!email) setEmail(authUser.email || "");
      if (!whatsapp && authUser.whatsapp) setWhatsapp(authUser.whatsapp);
    }
  }, [authUser, name, email, whatsapp]);

  // Removido useEffect duplicado de busca de parceiros

  // Sincronizar horas e dias se parceiro selecionado
  useEffect(() => {
    if (locationType === "PARTNER") {
      setEventDays(1);
      const p = partners.find(p => p.id === selectedPartnerId);
      if (p?.fixedDuration) {
        setEventHours(p.fixedDuration);
      }
    }
  }, [selectedPartnerId, locationType, partners]);

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

  // Lógica de Equipe 🛡️👥
  const calculateTeam = () => {
    let senior = 1;
    let aux = 0;
    let extraGuestsCost = 0;

    // Escalonamento por convidados (Capacidade de Operação)
    // 0-60: 1 Senior (Base)
    // 61-95: 1 Senior + 1 Auxiliar
    // > 95: 2 Seniors ou mais
    const guestCount = Number(attendees) || 0;
    if (guestCount > 60 && guestCount <= 95) {
      aux = 1;
      extraGuestsCost += 80;
    } else if (guestCount > 95) {
      senior = Math.ceil(guestCount / 60);
      extraGuestsCost += (senior - 1) * 150;
    }

    // Contagem de equipe total (Apenas Informativo no UI)
    let teamCount = senior + aux;
    if (selectedServices.includes("video")) teamCount += 1;
    if (selectedServices.includes("reels")) teamCount += 1;

    return { senior, aux, teamCount, extraGuestsCost };
  };

  // Cálculo de Preço Final 💰 (Preços Customizados por Ponto Fixo) 🛡️⚡
  const team = calculateTeam();
  

  // Lógica de exibição de preços:
  // - Unidade Fixa com parceiro selecionado: mostra preço fixo do parceiro
  // - Outro Local + Pessoal: mostra preço estimado (simulado por hora)
  // - Outro Local + Empresarial: não mostra preços (negociação direta)
  const showPrices = (locationType === "PARTNER" && !!selectedPartnerId);

  // Mapeamento de IDs do catálogo para chaves de preço dos parceiros
  const PARTNER_PRICE_KEYS: Record<string, string[]> = {
    foto:      ["foto", "foto-bruta", "fotografia", "foto-digital", "foto_bruta", "fotografia-digital"],
    video:     ["video", "video-bruto", "video-cinema", "video_bruto", "video-editado", "video_editado"],
    reels:     ["reels", "reels-stories", "social-media", "reels_stories", "reels-social-media"],
    impresso:  ["impresso", "foto-impressa", "album", "album-impresso", "foto_impressa", "album_impresso"],
  };

  const resolvePartnerPrice = (serviceId: string, prices: Record<string, number | null | undefined>): number | undefined => {
    // 1. Tentativa direta
    if (prices[serviceId] !== undefined && prices[serviceId] !== null) return Number(prices[serviceId]);
    // 2. Busca por mapeamento reverso
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
      // Preço fixo do parceiro — sem multiplicador de horas (valor tabelado)
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
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    const fullAddress = locationType === "PARTNER" 
      ? `Unidade: ${currentPartner?.name || 'Ponto Fixo'} - ${currentPartner?.city || ''}`
      : `${addressData.logradouro}, ${addressNumber} - ${addressData.bairro}, ${addressData.cidade}/${addressData.uf} (CEP: ${customCep})`;

    const payload = {
      name, email, whatsapp, attendees: Number(attendees), locationType, usageType, selectedPartnerId, 
      customCep, 
      location: fullAddress,
      eventDate, eventHours, eventDays, description, selectedServices, totalPrice, 
      availableBudget,
      preferredProfessionalId,
      workflowPref: workflowPref.join(" + "),
      status: "PENDING"
    };

    try {
      const { data } = await API.post("/public/quotes", payload);
      
      if (data.checkoutUrl) {
        // Normaliza para caminho relativo para evitar conflitos de porta em dev
        const url = new URL(data.checkoutUrl, window.location.origin);
        navigate(url.pathname);
      } else {
        // Se for orçamento sob consulta, mostra sucesso
        setCreatedQuoteId(data.eventId);
        setStep(4); 
        window.scrollTo(0, 0);
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || err.response?.data?.error || "Erro ao processar orçamento. Tente novamente.";
      alert(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-b selection:bg-emerald-500 selection:text-black py-10 md:py-20 px-4">
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-theme-bg">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
            <div className="text-[18px] font-display font-black uppercase tracking-[0.8em] italic text-theme-text">FOTO SEGUNDO</div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Configurando Motor Tático</div>
            <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
          </div>
        </div>
      )}
      <style>{`
        input[type=range] { -webkit-appearance: none; background: var(--theme-border); height: 4px; border-radius: 0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; background: #85B9AC; border-radius: 0; cursor: pointer; box-shadow: 0 0 15px rgba(133,185,172,0.4); }

        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 15px !important; }
          .mobile-padding { padding: 25px !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 15 }}>
            <Link to="/">
              <img 
                src="/logo.png" 
                alt="Foto Segundo" 
                style={{ 
                  height: 32, 
                  objectFit: "contain",
                  filter: "var(--logo-filter)"
                }} 
              />
            </Link>
          </div>
          <div 
            className="text-[10px] font-black text-emerald-500 mb-4 uppercase tracking-[0.5em] italic" 
            style={{ opacity: 0.8 }}
          >Solicitação de Orçamento</div>
          <h1 className="text-4xl md:text-6xl font-display font-black uppercase tracking-tighter leading-none text-theme-text">
            ETERNIZE SEU <span className="text-theme-subtle italic">EVENTO</span>
          </h1>
        </header>

        {step === 1 && (
          <div 
            style={{ opacity: 1, transform: "none" }}
            className="lux-card mobile-padding editorial-shadow"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.accent, letterSpacing: 2 }}>Passo 1: Onde e Quando</label>
              
              {/* 1. Onde será o registro? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>01. Local do Registro</label>
                <div className="mobile-stack" style={{ display: "flex", gap: 8 }}>
                  <button 
                    type="button"
                    onClick={() => setLocationType("PARTNER")}
                    style={{ flex: 1, padding: 12, border: `1px solid ${locationType === "PARTNER" ? THEME.accent : THEME.border}`, background: locationType === "PARTNER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: locationType === "PARTNER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >UNIDADE FIXA</button>
                  <button 
                    type="button"
                    onClick={() => setLocationType("OTHER")}
                    style={{ flex: 1, padding: 12, border: `1px solid ${locationType === "OTHER" ? THEME.accent : THEME.border}`, background: locationType === "OTHER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: locationType === "OTHER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >ORÇAMENTO</button>
                </div>

                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                   {locationType === "PARTNER" ? (
                    <select required value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} className="fs-input" style={{ width: "100%" }}>
                      <option value="">SELECIONE A UNIDADE FIXA...</option>
                      {partners && partners.length > 0 && partners.map(p => (
                        <option key={p.id} value={p.id}>
                          {((p.name || 'Unidade').toUpperCase())} - {((p.city || 'Campinas').toUpperCase())}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <div style={{ position: "relative" }}>
                        <input 
                          required 
                          value={customCep} 
                          onChange={e => handleCepChange(e.target.value)} 
                          placeholder="CEP DO LOCAL" 
                          className="fs-input font-mono" 
                          style={{ width: "100%", padding: "15px" }} 
                        />
                        {isCepLoading && (
                          <div style={{ position: "absolute", right: 15, top: "50%", transform: "translateY(-50%)" }}>
                             <div className="w-4 h-4 border-t-2 border-brand-tactical rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      {addressData.logradouro && (
                        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                          <div className="mobile-stack" style={{ display: "flex", gap: 10 }}>
                             <div style={{ flex: 3, position: "relative" }}>
                               <Home size={14} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", opacity: 0.5 }} />
                               <input 
                                 readOnly 
                                 value={addressData.logradouro} 
                                 className="fs-input" 
                                 style={{ width: "100%", padding: "12px 12px 12px 35px", background: "var(--theme-bg-muted)", fontSize: 11 }} 
                               />
                             </div>
                             <input 
                               required 
                               placeholder="Nº" 
                               value={addressNumber} 
                               onChange={e => setAddressNumber(e.target.value)} 
                               className="fs-input" 
                               style={{ flex: 1, padding: "12px", textAlign: "center", fontSize: 11 }} 
                             />
                          </div>
                          <div className="mobile-stack" style={{ display: "flex", gap: 10 }}>
                             <input 
                               readOnly 
                               value={addressData.bairro} 
                               className="fs-input" 
                               style={{ flex: 2, padding: "12px", background: "var(--theme-bg-muted)", fontSize: 11 }} 
                             />
                             <input 
                               readOnly 
                               value={`${addressData.cidade}/${addressData.uf}`} 
                               className="fs-input" 
                               style={{ flex: 2, padding: "12px", background: "var(--theme-bg-muted)", fontSize: 11 }} 
                             />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Data e Horário */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>02. Data e Horário do Evento</label>
                <DateTimePicker 
                  value={eventDate} 
                  onChange={setEventDate} 
                  workingHours={locationType === "PARTNER" ? currentPartner?.workingHours : null}
                />
              </div>

              {/* Botões de Ação Passo 1 */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  style={{ border: `1px solid ${THEME.border}`, color: THEME.text, padding: "15px 30px", fontWeight: 800, fontSize: 11, textTransform: "uppercase", background: "none", cursor: "pointer" }}
                >
                  VOLTAR
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const isLocalOk = locationType === "PARTNER" ? !!selectedPartnerId : !!customCep;
                    if (isLocalOk && eventDate) {
                      setStep(2);
                      window.scrollTo(0,0);
                    } else {
                      alert("Por favor, selecione o local e a data do evento.");
                    }
                  }}
                  style={{ background: THEME.accent, color: "black", padding: "15px 30px", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer" }}
                >
                  PRÓXIMO: CONFIGURAÇÃO <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div 
            style={{ opacity: 1, transform: "none" }}
            className="lux-card mobile-padding editorial-shadow"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.accent, letterSpacing: 2 }}>Passo 2: Configuração e Serviços</label>

              {/* Duração do Evento */}
              {(locationType === "OTHER" || (locationType === "PARTNER" && !currentPartner?.hideDuration)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: THEME.text2, letterSpacing: 1 }}>Duração do Registro</label>
                    <span style={{ fontSize: 11, fontWeight: 900, color: THEME.accent }}>{eventHours} HORAS</span>
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", opacity: (locationType === "PARTNER" && currentPartner?.fixedTime) ? 0.6 : 1 }}>
                    <input 
                      type="range"
                      min={1} max={12} step={1}
                      value={eventHours}
                      disabled={locationType === "PARTNER" && currentPartner?.fixedTime}
                      onChange={e => setEventHours(Number(e.target.value))}
                      style={{ 
                        width: "100%", 
                        accentColor: THEME.accent, 
                        height: 6, 
                        background: THEME.border,
                        cursor: (locationType === "PARTNER" && currentPartner?.fixedTime) ? "not-allowed" : "pointer" 
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: THEME.text2, fontWeight: 600 }}>
                    <span>1H</span><span>3H</span><span>6H</span><span>9H</span><span>12H</span>
                  </div>
                  {locationType === "PARTNER" && currentPartner?.fixedTime && (
                    <span style={{ fontSize: 7, color: THEME.accent, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>Duração Fixa da Unidade</span>
                  )}
                </div>
              )}

              {/* Quantidade de Dias */}
              {(locationType === "OTHER" || (locationType === "PARTNER" && !currentPartner?.hideDuration)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", color: THEME.text2, letterSpacing: 1 }}>Quantidade de Dias</label>
                    <span style={{ fontSize: 11, fontWeight: 900, color: THEME.accent }}>{eventDays} {eventDays === 1 ? 'DIA' : 'DIAS'}</span>
                  </div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", opacity: (locationType === "PARTNER") ? 0.6 : 1 }}>
                    <input 
                      type="range"
                      min={1} max={7} step={1}
                      value={eventDays}
                      disabled={locationType === "PARTNER"}
                      onChange={e => setEventDays(Number(e.target.value))}
                      style={{ 
                        width: "100%", 
                        accentColor: THEME.accent, 
                        height: 6, 
                        background: THEME.border,
                        cursor: locationType === "PARTNER" ? "not-allowed" : "pointer" 
                      }}
                    />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 8, color: THEME.text2, fontWeight: 600 }}>
                    <span>1 DIA</span><span>3 DIAS</span><span>5 DIAS</span><span>7 DIAS</span>
                  </div>
                </div>
              )}

              {/* Convidados, Tipo de Uso e Preferência de Equipamento */}
              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: locationType === "OTHER" ? "repeat(4, 1fr)" : "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Número de Convidados</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Users size={16} style={{ position: "absolute", left: 18, color: THEME.accent, pointerEvents: "none", zIndex: 1 }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={attendees}
                      onChange={e => setAttendees(e.target.value.replace(/\D/g, ""))}
                      className="fs-input"
                      style={{ width: "100%", paddingLeft: 52, minHeight: 52 }}
                    />
                  </div>
                </div>

                <div>
                   <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Equipamento Preferencial</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button 
                        type="button" 
                        onClick={() => toggleWorkflow("MOBILE")} 
                        style={{ 
                          flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, 
                          border: `1px solid ${workflowPref.includes("MOBILE") ? THEME.accent : THEME.border}`, 
                          background: workflowPref.includes("MOBILE") ? `${THEME.accent}10` : "transparent", 
                          color: workflowPref.includes("MOBILE") ? THEME.accent : THEME.text2, 
                          cursor: "pointer", transition: "all 0.3s ease" 
                        }}
                      >MOBILE MAKER</button>
                      <button 
                        type="button" 
                        onClick={() => toggleWorkflow("TRADICIONAL")} 
                        style={{ 
                          flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, 
                          border: `1px solid ${workflowPref.includes("TRADICIONAL") ? THEME.accent : THEME.border}`, 
                          background: workflowPref.includes("TRADICIONAL") ? `${THEME.accent}10` : "transparent", 
                          color: workflowPref.includes("TRADICIONAL") ? THEME.accent : THEME.text2, 
                          cursor: "pointer", transition: "all 0.3s ease" 
                        }}
                      >TRADICIONAL</button>
                    </div>
                </div>

                {locationType === "OTHER" && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Tipo de Finalidade</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" onClick={() => setUsageType("PESSOAL")} style={{ flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, border: `1px solid ${usageType === "PESSOAL" ? THEME.accent : THEME.border}`, background: usageType === "PESSOAL" ? `${THEME.accent}10` : "transparent", color: usageType === "PESSOAL" ? THEME.accent : THEME.text2, cursor: "pointer", transition: "all 0.3s ease" }}>PESSOAL</button>
                      <button type="button" onClick={() => setUsageType("EMPRESARIAL")} style={{ flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, border: `1px solid ${usageType === "EMPRESARIAL" ? THEME.accent : THEME.border}`, background: usageType === "EMPRESARIAL" ? `${THEME.accent}10` : "transparent", color: usageType === "EMPRESARIAL" ? THEME.accent : THEME.text2, cursor: "pointer", transition: "all 0.3s ease" }}>BUSINESS</button>
                    </div>
                  </div>
                )}
                {locationType === "OTHER" && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Budget Disponível</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: 18, color: THEME.accent, fontWeight: 900, fontSize: 12 }}>R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={availableBudget}
                        placeholder="VALOR DISPONÍVEL"
                        onChange={e => setAvailableBudget(e.target.value.replace(/\D/g, ""))}
                        className="fs-input"
                        style={{ width: "100%", paddingLeft: 42, minHeight: 52 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Serviços Categorizados */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, display: "block", color: THEME.text, letterSpacing: 2 }}>Selecione os Serviços</label>
                
                {(() => {
                  const categories = Array.from(new Set(availableServices.map(s => s.category || "Geral")));
                  
                  return categories.map(cat => (
                    <div key={cat} style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: THEME.accent, letterSpacing: 3, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 1, background: THEME.accent }} /> {cat}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                        {availableServices.filter(s => (s.category || "Geral") === cat).map(s => {
                          const isSelected = selectedServices.includes(s.id);
                          const cleanName = s.name.replace(/\(UPGRADE\)/gi, "").trim();
                          
                          // Mapeamento de Ícones
                          const getIcon = (_id: string, name: string) => {
                            const n = name.toLowerCase();
                            if (n.includes("phygital") || n.includes("impressa")) return <Printer size={18} />;
                            if (n.includes("video") || n.includes("cinema")) return <Video size={18} />;
                            if (n.includes("reels") || n.includes("smartphone")) return <Smartphone size={18} />;
                            if (n.includes("corporativo") || n.includes("linkedin")) return <Building2 size={18} />;
                            if (n.includes("gastronômico")) return <Utensils size={18} />;
                            if (n.includes("escolar")) return <GraduationCap size={18} />;
                            if (n.includes("casamento")) return <Zap size={18} />;
                            return <Camera size={18} />;
                          };

                          return (
                            <div 
                              key={s.id} 
                              onClick={() => {
                                if (isSelected) setSelectedServices(prev => prev.filter(x => x !== s.id));
                                else setSelectedServices(prev => [...prev, s.id]);
                              }} 
                              style={{
                                padding: "20px", 
                                border: `1px solid ${isSelected ? THEME.accent : THEME.border}`,
                                cursor: "pointer", 
                                background: isSelected ? `${THEME.accent}05` : "var(--theme-bg-muted)", 
                                transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                                position: "relative",
                                overflow: "hidden",
                                display: "flex",
                                flexDirection: "column",
                                gap: 12
                              }}
                            >
                              {/* Checkbox Visual */}
                              <div style={{ 
                                position: "absolute", top: 12, right: 12, 
                                width: 16, height: 16, 
                                border: `1.5px solid ${isSelected ? THEME.accent : THEME.border}`,
                                display: "flex", alignItems: "center", justifyContent: "center",
                                background: isSelected ? THEME.accent : "transparent"
                              }}>
                                {isSelected && <ShieldCheck size={10} color="black" strokeWidth={3} />}
                              </div>

                              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                <div style={{ color: isSelected ? THEME.accent : THEME.text2, transition: "color 0.3s" }}>
                                  {getIcon(s.id, s.name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 0.5, color: isSelected ? THEME.accent : THEME.text }}>
                                    {cleanName}
                                  </div>
                                </div>
                              </div>

                              {s.description && (
                                <p style={{ fontSize: 9, color: THEME.text2, margin: 0, lineHeight: 1.5, opacity: 0.7 }}>
                                  {s.description}
                                </p>
                              )}

                              <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                                {showPrices ? (
                                  <div style={{ fontSize: 14, fontWeight: 900, color: THEME.accent }}>
                                    {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(getServicePrice(s.id, s.basePrice))}
                                  </div>
                                ) : (
                                  <div style={{ fontSize: 8, color: THEME.text2, fontStyle: "italic", textTransform: "uppercase", letterSpacing: 1 }}>sob consulta</div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ));
                })()}
              </div>

              {/* Rodapé Dinâmico de Preço */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2, letterSpacing: 2 }}>Total Estimado</div>
                  <div className="font-display font-black text-emerald-500 italic" style={{ fontSize: 32 }}>
                    {showPrices ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice) : "SOB CONSULTA"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setStep(1)} className="px-8 py-4 border border-theme-border text-theme-muted font-display font-black text-[10px] uppercase tracking-widest hover:text-theme-text transition-all">VOLTAR</button>
                  <button 
                    onClick={() => {
                      if (selectedServices.length > 0) {
                        setStep(3);
                        window.scrollTo(0,0);
                      } else {
                        alert("Por favor, selecione pelo menos um serviço.");
                      }
                    }}
                    className="px-8 py-4 bg-emerald-500 text-white font-display font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all shadow-xl shadow-emerald-500/10"
                  >CONTINUAR &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mobile-padding" style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: "clamp(20px, 5vw, 40px)" }}>
             <button onClick={() => setStep(2)} style={{ color: THEME.text2, fontSize: 10, fontWeight: 800, marginBottom: 30, background: "none", border: "none", cursor: "pointer" }}>&larr; VOLTAR PARA CONFIGURAÇÃO</button>
             
             <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <label style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 2, color: THEME.accent, marginBottom: 10 }}>Passo 3: Seus Dados</label>
                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Seu Nome</label>
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="NOME DO CONTRATANTE" className="fs-input" style={{ width: "100%", padding: "15px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>E-mail para Contato</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="EX: CONTATO@DOMINIO.COM" className="fs-input" style={{ width: "100%", padding: "15px" }} />
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>WhatsApp (com DDD)</label>
                  <input required value={whatsapp} onChange={e => setWhatsapp(e.target.value.replace(/\D/g, ""))} placeholder="11999999999" className="fs-input" style={{ width: "100%", padding: "15px" }} />
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Profissional Preferencial (Opcional)</label>
                  <select 
                    value={preferredProfessionalId} 
                    onChange={e => setPreferredProfessionalId(e.target.value)} 
                    className="fs-input" 
                    style={{ width: "100%", padding: "15px" }}
                  >
                    <option value="">NENHUM (DEIXAR PARA CURADORIA)</option>
                    {pros.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.user.nome.toUpperCase()} - {p.user.address?.toUpperCase() || "GLOBAL"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-white/20 italic">Selecione um profissional específico para priorizar seu atendimento.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Observações do Evento</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="CONTE-NOS MAIS DETALHES..." className="fs-input" />
                </div>

                <button 
                  type="submit"
                  disabled={submitting}
                  style={{ 
                    background: submitting ? "#333" : THEME.accent, 
                    color: submitting ? "#666" : "black", 
                    padding: "20px", 
                    fontWeight: 900, 
                    fontSize: 14, 
                    textTransform: "uppercase", 
                    letterSpacing: 4, 
                    cursor: submitting ? "not-allowed" : "pointer", 
                    border: "none",
                    width: "100%",
                    opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting ? "PROCESSANDO..." : "RESERVAR E FINALIZAR AGORA"}
                </button>
             </form>
          </div>
        )}

        {step === 4 && (
          <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)" }} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full opacity-30" />
            
            <div className="relative z-10">
              <div style={{ width: 80, height: 80, background: "var(--theme-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px", border: "1px solid var(--theme-border)" }}>
                <ShieldCheck size={40} className="text-emerald-500" />
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-black text-theme-text uppercase italic tracking-tighter mb-8 leading-none">Solicitação Enviada</h2>
              
              {createdQuoteId && (
                <div style={{ background: "var(--theme-bg)", border: "1px solid var(--theme-border)", padding: "20px 40px", marginBottom: 40, display: "inline-block" }}>
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] block mb-2">Protocolo de Segurança</span>
                  <span className="text-2xl font-display font-black text-emerald-500 tracking-[0.15em] italic">ORC-{createdQuoteId.slice(-6).toUpperCase()}</span>
                </div>
              )}

              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest max-w-md mx-auto leading-relaxed mb-12">
                Recebemos seu briefing técnico. Nossa curadoria analisará a viabilidade e entrará em contato através de <span className="text-theme-text">{email}</span> para os próximos passos.
              </p>
              
              <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <button 
                  onClick={() => window.open('https://wa.me/5519997843817', '_blank')}
                  className="w-full py-6 bg-emerald-500 text-white font-display font-black text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl shadow-emerald-500/20"
                >
                  FALAR COM ESPECIALISTA
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="w-full py-4 text-theme-subtle font-display font-black text-[10px] uppercase tracking-[0.5em] hover:text-white transition-colors"
                >
                  VOLTAR PARA VITRINE
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { Users, Calendar, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Clock, Home } from "lucide-react";
import { API } from "../lib/api";
import { useNavigate } from "react-router-dom";
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
    { id: "foto", label: "FOTOGRAFIA DIGITAL", price: 190, required: true },
    { id: "video", label: "VÍDEO BRUTO", price: 190 },
    { id: "reels", label: "REELS / MOBILE", price: 120 },
    { id: "impresso", label: "ÁLBUM / IMPRESSA", price: 120 },
  ]
};

const THEME = {
  bg: "var(--theme-bg)",
  bgCard: "var(--theme-bg-muted)",
  border: "var(--theme-border)",
  accent: "var(--brand-primary)",
  text: "var(--theme-text)",
  text2: "var(--theme-text-muted)",
  fontD: "'Outfit', sans-serif",
  fontB: "'Outfit', sans-serif",
};

// ── DateTimePicker Customizado (Tactical Theme) 📅🛡️ ─────────────────
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

function DateTimePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
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
      <div onClick={() => setOpen(o => !o)} style={{ position: "relative", display: "flex", alignItems: "center", cursor: "pointer" }}>
        <Calendar size={18} style={{ position: "absolute", left: 15, color: THEME.accent, pointerEvents: "none", zIndex: 1 }} />
        <div
          className="fs-input"
          style={{
            width: "100%", padding: "15px 15px 15px 48px", fontSize: 13,
            userSelect: "none", minHeight: 52, display: "flex", alignItems: "center",
            color: displayValue ? THEME.text : "#555",
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
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 999,
              background: "var(--theme-bg)", border: `1px solid var(--theme-border)`,
              width: "min(320px, 90vw)", padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
              transition: "all 0.18s"
            }}
          >
            {/* Month Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                style={{ background: "none", border: "none", color: THEME.text2, cursor: "pointer", padding: 6, display: "flex" }}
              ><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 11, fontWeight: 900, color: THEME.text, textTransform: "uppercase", letterSpacing: 3 }}>
                {MONTHS_PT[viewDate.getMonth()]} {viewDate.getFullYear()}
              </span>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1))}
                style={{ background: "none", border: "none", color: THEME.text2, cursor: "pointer", padding: 6, display: "flex" }}
              ><ChevronRight size={16} /></button>
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
                const isSelected = dayStr === selectedDate;
                const isToday = dayStr === today;
                return (
                  <button key={i} disabled={!day || !!isPast}
                    onClick={() => day && !isPast && selectDay(day)}
                    style={{
                      height: 34, width: "100%", border: "none", borderRadius: 0,
                      fontSize: 12, fontWeight: isSelected ? 900 : 500,
                      cursor: day && !isPast ? "pointer" : "default",
                      background: isSelected ? THEME.accent : isToday ? `${THEME.accent}20` : "transparent",
                      color: isSelected ? "var(--theme-text-on-brand)" : isPast ? "var(--theme-text-muted)" : !day ? "transparent" : THEME.text,
                      outline: isToday && !isSelected ? `1px solid ${THEME.accent}50` : "none",
                      transition: "background 0.15s",
                    }}
                  >{day || ""}</button>
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
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2,"0")).map(h => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
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

interface Service {
  id: string;
  name: string;
  basePrice: number;
}

interface Partner {
  id: string;
  name: string;
  city: string;
  prices?: Record<string, number>;
  fixedDuration?: number;
  fixedTime?: boolean;
  hideDuration?: boolean;
}

export const QuotePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [partners, setPartners] = useState<Partner[]>([]);
  
  // Form State
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [catalog, setCatalog] = useState<Service[]>([]);

  // Carregar catálogo global
  useEffect(() => {
    API.get("/public/configs/services")
      .then(res => {
        if (res.data?.services?.length > 0) {
          setCatalog(res.data.services);
        }
      })
      .catch(err => console.error("Erro ao carregar serviços:", err));
  }, []);

  const availableServices = catalog.length > 0 
    ? catalog 
    : P.SERVICES.map(s => ({ id: s.id, name: s.label, basePrice: s.price }));
  const [attendees, setAttendees] = useState<string>("0");
  const [locationType, setLocationType] = useState<"PARTNER" | "OTHER">("PARTNER");
  const [usageType, setUsageType] = useState<"PESSOAL" | "EMPRESARIAL">("PESSOAL");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [customCep, setCustomCep] = useState("");
  const [addressData, setAddressData] = useState({ logradouro: "", bairro: "", cidade: "", uf: "" });
  const [addressNumber, setAddressNumber] = useState("");
  const { fetchAddress, loading: isCepLoading } = useViaCep();
  const [eventDate, setEventDate] = useState("");
  const [eventHours, setEventHours] = useState(2);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (user && !name) setName(user.nome);
    if (user && !email) setEmail(user.email);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  useEffect(() => {
    // Busca parceiros cadastrados (Unidades Fixas)
    API.get("/public/unidades-fixas").then(res => setPartners(res.data)).catch(() => {});
  }, []);

  // Sincronizar horas fixas se parceiro selecionado
  useEffect(() => {
    const p = partners.find(p => p.id === selectedPartnerId);
    if (locationType === "PARTNER" && p?.fixedDuration) {
      setEventHours(p.fixedDuration);
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
  
  const currentPartner = partners.find(p => p.id === selectedPartnerId);
  const selectedPartner = partners.find(p => p.id === selectedPartnerId);

  // Lógica de exibição de preços:
  // - Unidade Fixa com parceiro selecionado: mostra preço fixo do parceiro
  // - Outro Local + Pessoal: mostra preço estimado (simulado por hora)
  // - Outro Local + Empresarial: não mostra preços (negociação direta)
  const showPrices =
    (locationType === "PARTNER" && !!selectedPartnerId) ||
    (locationType === "OTHER" && usageType === "PESSOAL");

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
    const hourMultiplier = 1 + ((eventHours - 1) * 0.4);
    if (locationType === "PARTNER" && selectedPartnerId) {
      // Preço fixo do parceiro — sem multiplicador de horas (valor tabelado)
      const partnerPrice = resolvePartnerPrice(id, currentPartner?.prices || {});
      return partnerPrice !== undefined ? partnerPrice : defaultPrice;
    }
    if (locationType === "OTHER" && usageType === "PESSOAL") {
      return Math.round(defaultPrice * hourMultiplier);
    }
    return defaultPrice;
  };

  const servicesPrice = availableServices.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => {
    return acc + getServicePrice(s.id, s.basePrice);
  }, 0);

  const isOutsideCampinas = locationType === "OTHER" && customCep !== ""; 
  const freight = isOutsideCampinas ? P.BASE_FREIGHT + (20 * P.KM_RATE) + P.FEE_TOLL : 0; 
  
  const totalPrice = servicesPrice + team.extraGuestsCost + freight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fullAddress = locationType === "PARTNER" 
      ? "Ponto Fixo" 
      : `${addressData.logradouro}, ${addressNumber} - ${addressData.bairro}, ${addressData.cidade}/${addressData.uf} (CEP: ${customCep})`;

    const payload = {
      name, email, attendees: Number(attendees), locationType, usageType, selectedPartnerId, 
      customCep, 
      location: fullAddress,
      eventDate, eventHours, description, selectedServices, totalPrice, 
      status: "PENDING"
    };

    try {
      await API.post("/public/quotes", payload);
      setStep(3); 
    } catch {
      alert("Erro ao processar orçamento. Tente novamente.");
    }
  };

  return (
    <div style={{ 
      background: THEME.bg, 
      color: THEME.text, 
      minHeight: "100vh", 
      fontFamily: THEME.fontB, 
      padding: "80px 20px" /* Aumento no padding superior para ar editorial */
    }}>
      <style>{`
        .fs-input { background: var(--theme-bg-muted) !important; border: 1px solid var(--theme-border) !important; color: var(--theme-text) !important; border-radius: 0 !important; box-sizing: border-box; font-family: 'Outfit', sans-serif !important; }
        .fs-input:focus { border-color: var(--brand-primary) !important; outline: none !important; }
        select.fs-input, textarea.fs-input { padding: 15px !important; }
        
        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 20px !important; }
          .mobile-padding { padding: 1.5rem !important; }
          .mobile-text-center { text-align: center !important; }
          .mobile-full { width: 100% !important; }
          .mobile-hide { display: none !important; }
        }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 30 }}>
            <img 
              src="/logo-fs.png" 
              alt="Logo" 
              style={{ 
                height: 40, 
                objectFit: "contain"
              }} 
            />
          </div>
          <div 
            className="text-proportional text-brand-primary mb-8" 
            style={{ 
              letterSpacing: 10, 
              opacity: 0.8,
              fontSize: 11
            }}
          >Solicitação de Orçamento</div>
          <h1 className="heading-luxury">
            ETERNIZE SEU <span className="text-theme-text-muted">GRANDE DIA</span>
          </h1>
        </header>

        {step === 1 && (
          <div 
            style={{ opacity: 1, transform: "none" }}
            className="lux-card mobile-padding editorial-shadow"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>

              {/* 1. Onde será o registro? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>1. Onde será o registro?</label>
                <div className="mobile-stack" style={{ display: "flex", gap: 10 }}>
                  <button 
                    type="button"
                    onClick={() => setLocationType("PARTNER")}
                    style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "PARTNER" ? THEME.accent : THEME.border}`, background: locationType === "PARTNER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: locationType === "PARTNER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >UNIDADE FIXA</button>
                  <button 
                    type="button"
                    onClick={() => setLocationType("OTHER")}
                    style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "OTHER" ? THEME.accent : THEME.border}`, background: locationType === "OTHER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: locationType === "OTHER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >ORÇAMENTO</button>
                </div>

                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
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
                             <div className="w-4 h-4 border-t-2 border-brand-primary rounded-full animate-spin" />
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
                                 style={{ width: "100%", padding: "12px 12px 12px 35px", background: "rgba(255,255,255,0.03)", fontSize: 11 }} 
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
                               style={{ flex: 2, padding: "12px", background: "rgba(255,255,255,0.03)", fontSize: 11 }} 
                             />
                             <input 
                               readOnly 
                               value={`${addressData.cidade}/${addressData.uf}`} 
                               className="fs-input" 
                               style={{ flex: 2, padding: "12px", background: "rgba(255,255,255,0.03)", fontSize: 11 }} 
                             />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {!selectedPartner?.hideDuration && (
                    <div style={{ position: "relative", display: "flex", alignItems: "center", opacity: (locationType === "PARTNER" && selectedPartner?.fixedTime) ? 0.6 : 1 }}>
                      <Clock size={16} style={{ position: "absolute", left: 12, color: THEME.accent, pointerEvents: "none" }} />
                      <input 
                        type="number" 
                        min={1} max={24} 
                        value={eventHours} 
                        readOnly={locationType === "PARTNER" && selectedPartner?.fixedTime}
                        onChange={e => setEventHours(Number(e.target.value))} 
                        className="fs-input" 
                        style={{ width: "100%", padding: "15px 10px 15px 35px", cursor: (locationType === "PARTNER" && selectedPartner?.fixedTime) ? "not-allowed" : "text" }} 
                      />
                      <span style={{ position: "absolute", right: 10, fontSize: 9, color: THEME.text2, pointerEvents: "none" }}>H</span>
                    </div>
                  )}
                </div>

                {locationType === "OTHER" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                     <button type="button" onClick={() => setUsageType("PESSOAL")} style={{ padding: 12, fontSize: 9, fontWeight: 800, border: `1px solid ${usageType === "PESSOAL" ? THEME.accent : THEME.border}`, background: usageType === "PESSOAL" ? `${THEME.accent}10` : "transparent", color: usageType === "PESSOAL" ? THEME.accent : THEME.text2, cursor: "pointer" }}>USO PESSOAL</button>
                     <button type="button" onClick={() => setUsageType("EMPRESARIAL")} style={{ padding: 12, fontSize: 9, fontWeight: 800, border: `1px solid ${usageType === "EMPRESARIAL" ? THEME.accent : THEME.border}`, background: usageType === "EMPRESARIAL" ? `${THEME.accent}10` : "transparent", color: usageType === "EMPRESARIAL" ? THEME.accent : THEME.text2, cursor: "pointer" }}>USO EMPRESARIAL</button>
                  </div>
                )}
              </div>

              {/* Seção de Serviços */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text }}>2. Selecione os Serviços</label>
                

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 15, marginTop: 0 }}>
                  {availableServices.map(s => (
                    <div key={s.id} onClick={() => {
                      if (selectedServices.includes(s.id)) setSelectedServices(prev => prev.filter(x => x !== s.id));
                      else setSelectedServices(prev => [...prev, s.id]);
                    }} style={{
                      padding: 20, border: `1px solid ${selectedServices.includes(s.id) ? THEME.accent : THEME.border}`,
                      cursor: "pointer", background: "var(--theme-bg-muted)", transition: "all 0.2s",
                      position: "relative", overflow: "hidden"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: 1 }}>{s.name}</div>
                        {selectedServices.includes(s.id) && <div style={{ width: 8, height: 8, background: THEME.accent }} />}
                      </div>
                      {showPrices ? (
                        <div style={{ fontSize: 14, fontWeight: 900, color: THEME.accent }}>
                          {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(getServicePrice(s.id, s.basePrice))}
                          <span style={{ fontSize: 9, marginLeft: 5, opacity: 0.6 }}>({eventHours}H)</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: 10, color: THEME.text2, fontStyle: "italic" }}>sob consulta</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text }}>3. Número de Convidados</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Users size={18} style={{ position: "absolute", left: 15, color: THEME.accent, pointerEvents: "none", zIndex: 1 }} />
                    <input
                      type="text"
                      inputMode="numeric"
                      value={attendees}
                      onChange={e => {
                         const val = e.target.value.replace(/\D/g, "");
                         setAttendees(val);
                      }}
                      className="fs-input"
                      style={{ width: "100%", padding: "15px 15px 15px 48px" }}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text }}>4. Data e Horário do Evento</label>
                  <DateTimePicker value={eventDate} onChange={setEventDate} />
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 30, marginTop: 20 }}>
                 <div className="mobile-stack" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div className="mobile-text-center">
                      <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2, marginBottom: 5 }}>Investimento Estimado</div>
                      {showPrices ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <div className="heading-luxury !text-brand-primary" style={{ fontSize: 32 }}>
                            {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice)}
                          </div>
                          <div style={{ display: "flex", gap: 10, fontSize: 9, fontWeight: 700, color: THEME.text2, textTransform: "uppercase", opacity: 0.8 }}>
                            <span>Serviços: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(servicesPrice)}</span>
                            {freight > 0 && <span>· Deslocamento: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(freight)}</span>}
                            {team.extraGuestsCost > 0 && <span>· Equipe Extra: {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(team.extraGuestsCost)}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className="heading-luxury !text-brand-primary" style={{ fontSize: 24 }}>SOB CONSULTA</div>
                      )}
                    </div>

                    <div className="mobile-stack" style={{ display: "flex", gap: 15 }}>
                      <button 
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ border: `1px solid ${THEME.border}`, color: THEME.text, padding: "15px 30px", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, background: "none", cursor: "pointer" }}
                      >
                        VOLTAR
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          const isLocalOk = locationType === "PARTNER" ? !!selectedPartnerId : !!customCep;
                          const isServiceOk = selectedServices.length > 0;
                          const isDateOk = !!eventDate;
                          const isGuestsOk = Number(attendees) >= 0;

                          if (isLocalOk && isServiceOk && isDateOk && isGuestsOk) {
                            setStep(2);
                            window.scrollTo(0,0);
                          } else {
                            alert("Por favor, preencha todos os campos do Passo 1 antes de continuar.");
                          }
                        }}
                        style={{ background: THEME.accent, color: "black", padding: "15px 30px", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 10, justifyContent: "center", border: "none", cursor: "pointer" }}
                      >
                        PRÓXIMO PASSO <ArrowRight size={16} />
                      </button>
                    </div>
                 </div>
              </div>

            </div>
          </div>

        )}

        {step === 2 && (
          <div className="mobile-padding" style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: 40 }}>
             <button onClick={() => setStep(1)} style={{ color: THEME.text2, fontSize: 10, fontWeight: 800, marginBottom: 30, background: "none", border: "none", cursor: "pointer" }}>&larr; VOLTAR</button>
             
             <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
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
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Descreva seu evento com suas palavras</label>
                  <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    rows={4}
                    placeholder="CONTE-NOS MAIS DETALHES, OBJETIVOS E EXPECTATIVAS..."
                    className="fs-input"
                  />
                </div>

                <button 
                  type="submit"
                  style={{ background: THEME.accent, color: "black", padding: "20px", fontWeight: 900, fontSize: 14, textTransform: "uppercase", letterSpacing: 4, marginTop: 20 }}
                >
                  SOLICITAR ANÁLISE DE RESERVA
                </button>
             </form>
          </div>
        )}

        {step === 3 && (
          <div style={{ textAlign: "center", padding: 60, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${THEME.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
              <ShieldCheck size={40} color={THEME.accent} />
            </div>
            <h2 style={{ fontFamily: THEME.fontD, fontSize: 42, fontWeight: 900, textTransform: "uppercase", marginBottom: 20 }}>Recebemos sua Solicitação</h2>
            <p style={{ color: THEME.text2, fontSize: 13, maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.7, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              Sua solicitação foi enviada com sucesso. Nossa equipe técnica analisará o briefing e os detalhes do local para liberar o seu link de reserva e orçamento final em até 30 minutos.
            </p>
            <button 
              onClick={() => navigate("/")}
              style={{ border: `1px solid ${THEME.border}`, padding: "15px 40px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, background: "none", color: THEME.text, cursor: "pointer" }}
            >
              VOLTAR PARA A VITRINE
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

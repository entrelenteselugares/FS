// @ts-nocheck
﻿import { useState, useEffect, useRef, useMemo } from "react";
import { Users, Calendar, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Clock, Home, Zap, Camera, Video, Printer, Smartphone, Building2, GraduationCap, Utensils } from "lucide-react";
import { API } from "../../lib/api";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useViaCep } from "../../hooks/useViaCep";

interface Professional {
  id: string;
  nome?: string;
  address?: string;
  user?: {
    nome: string;
    address?: string;
  };
}

// ÔöÇÔöÇ Configura├º├Áes de Precifica├º├úo (Tactical Engine) ­ƒøí´©ÅÔÜÖ´©Å ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const P = {
  COST_SENIOR: 160, // Custo interno de refer├¬ncia
  COST_AUX: 60,
  FEE_TOLL: 25,
  BASE_FREIGHT: 15,
  KM_RATE: 2.50,
  SERVICES: [
    { id: "foto", label: "FOTOGRAFIA DIGITAL", price: 190, required: true, category: "Geral", description: "Cobertura fotogr├ífica profissional." },
    { id: "video", label: "V├ìDEO BRUTO", price: 190, category: "Geral", description: "Capta├º├úo de v├¡deo sem edi├º├úo." },
    { id: "reels", label: "REELS / MOBILE", price: 120, category: "Geral", description: "V├¡deos curtos otimizados para redes sociais." },
    { id: "impresso", label: "├üLBUM / IMPRESSA", price: 120, category: "Phygital", description: "Impress├úo de fotos durante o evento." },
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

// ÔöÇÔöÇ DateTimePicker Customizado (Tactical Theme) ­ƒôà­ƒøí´©Å ÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇÔöÇ
const MONTHS_PT = ["Janeiro","Fevereiro","Mar├ºo","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","S├íb"];

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
  eventTypes?: string[];
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
        .format(new Date(value.split("T")[0] + "T12:00")) + " ├ás " + hour + ":" + minute + "h"
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
          {displayValue || "SELECIONE A DATA E HOR├üRIO"}
        </div>
      </div>

      {/* Popover */}
        {open && (
          <div
            key="picker"
            className="calendar-popover"
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
                title="M├¬s Anterior"
              >
                <ChevronLeft size={18} />
              </button>
              
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: THEME.text, textTransform: "uppercase", letterSpacing: 2 }}>
                  {MONTHS_PT[viewDate.getMonth()] || "M├¬s"}
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
                title="Pr├│ximo M├¬s"
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
                
                // L├│gica de dia fechado ­ƒøí´©Å
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
                    {isClosed && <div style={{ fontSize: 6, position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)" }}>Ô£û</div>}
                  </button>
                );
              })}
            </div>

            {/* Time Selector */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${THEME.border}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <Clock size={13} color={THEME.accent} />
                <span style={{ fontSize: 10, fontWeight: 800, color: THEME.text2, textTransform: "uppercase", letterSpacing: 2 }}>Hor├írio do Evento</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <select value={hour} onChange={e => updateTime(e.target.value, minute)}
                  style={{ flex: 1, background: "var(--theme-bg-muted)", border: `1px solid ${THEME.border}`, color: THEME.text, padding: "10px 8px", fontSize: 18, fontWeight: 900, textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2,"0")).map(h => {
                     // Oculta horas fora do expediente se parceiro selecionado ­ƒøí´©Å
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
                CONFIRMAR DATA E HOR├üRIO
              </button>
            )}
          </div>
        )}
    </div>
  );
}

export const QuoteDesktopView = (props: any) => {
  const { step, setStep, nextStep, prevStep, loading, partners, pros, preferredProfessionalId, setPreferredProfessionalId, isMobileSheetOpen, setIsMobileSheetOpen, selectedServices, setSelectedServices, catalog, availableServices, attendees, setAttendees, locationType, setLocationType, usageType, setUsageType, workflowPref, setWorkflowPref, selectedPartnerId, setSelectedPartnerId, category, setCategory, currentPartner, customCep, setCustomCep, handleCepChange, isCepLoading, addressData, setAddressData, addressNumber, setAddressNumber, eventDate, setEventDate, eventHours, setEventHours, eventDays, setEventDays, description, setDescription, availableBudget, setAvailableBudget, name, setName, email, setEmail, whatsapp, setWhatsapp, team, showPrices, getServicePrice, servicesPrice, freight, totalPrice, submitting, createdQuoteId, submitError, handleSubmit } = props;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-b selection:bg-emerald-500 selection:text-black py-10 md:py-20 px-4">
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-theme-bg">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
            <div className="text-[18px] font-display font-black uppercase tracking-[0.8em] italic text-theme-text">FOTO SEGUNDO</div>
            <div className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-500 animate-pulse">Configurando Motor T├ítico</div>
            <div className="w-px h-16 bg-gradient-to-t from-transparent via-emerald-500 to-transparent" />
          </div>
        </div>
      )}
      <style>{`
        input[type=range] { -webkit-appearance: none; background: var(--theme-border); height: 4px; border-radius: 0; }
        input[type=range]::-webkit-slider-thumb { -webkit-appearance: none; height: 20px; width: 20px; background: #85B9AC; border-radius: 0; cursor: pointer; box-shadow: 0 0 15px rgba(133,185,172,0.4); }

        .calendar-popover {
          position: absolute;
          bottom: calc(100% + 15px);
          left: 50%;
          transform: translateX(-50%);
          z-index: 9999;
          background: var(--bg-card);
          border: 1px solid var(--border);
          width: min(340px, 92vw);
          padding: 24px;
          box-shadow: 0 30px 90px rgba(0,0,0,0.4);
          border-radius: 0;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @media (max-width: 768px) {
          .mobile-grid-1 { grid-template-columns: 1fr !important; }
          .mobile-stack { flex-direction: column !important; align-items: stretch !important; gap: 15px !important; }
          .mobile-padding { padding: 25px !important; }
          .calendar-popover {
            position: fixed;
            top: 50%;
            left: 50%;
            bottom: auto;
            transform: translate(-50%, -50%);
          }
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
                  height: 54, 
                  objectFit: "contain",
                  filter: "var(--logo-filter)"
                }} 
              />
            </Link>
          </div>
          <div 
            className="text-[10px] font-black text-emerald-500 mb-4 uppercase tracking-[0.5em] italic" 
            style={{ opacity: 0.8 }}
          >Solicita├º├úo de Or├ºamento</div>
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
              
              {/* 1. Onde ser├í o registro? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>01. Local do Registro</label>
                <div className="mobile-stack" style={{ display: "flex", gap: 8 }}>
                  <button 
                    type="button"
                    onClick={() => setLocationType("PARTNER")}
                    style={{ flex: 1, padding: 12, border: locationType === "PARTNER" ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: locationType === "PARTNER" ? `${THEME.accent}15` : "var(--theme-bg-muted)", boxShadow: locationType === "PARTNER" ? "0 0 15px rgba(133,185,172,0.2)" : "none", fontSize: 10, fontWeight: 900, color: locationType === "PARTNER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >UNIDADE FIXA</button>
                  <button 
                    type="button"
                    onClick={() => setLocationType("OTHER")}
                    style={{ flex: 1, padding: 12, border: locationType === "OTHER" ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: locationType === "OTHER" ? `${THEME.accent}15` : "var(--theme-bg-muted)", boxShadow: locationType === "OTHER" ? "0 0 15px rgba(133,185,172,0.2)" : "none", fontSize: 10, fontWeight: 900, color: locationType === "OTHER" ? THEME.accent : THEME.text2, cursor: "pointer" }}
                  >OR├çAMENTO</button>
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
                               placeholder="N┬║" 
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

              {/* Tipo de Evento */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>02. Tipo de Evento</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="fs-input" style={{ width: "100%", paddingLeft: 46 }}>
                  {(() => {
                    const EVENT_TYPE_LABELS: Record<string, string> = {
                      CASAMENTO: "CASAMENTO",
                      ANIVERSARIO: "ANIVERS├üRIO",
                      SHOW_FESTIVAL: "SHOW / FESTIVAL",
                      CORPORATIVO: "EVENTO CORPORATIVO",
                      FORMATURA: "FORMATURA",
                      ENSAIO: "ENSAIO FOTOGR├üFICO",
                      BAILE_FESTA: "BAILE / FESTA",
                      CONFRATERNIZACAO: "CONFRATERNIZA├ç├âO",
                      CHURRASCO_BUFFET: "CHURRASCO / BUFFET",
                      OUTROS: "OUTROS",
                    };
                    const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);
                    const types = (locationType === "PARTNER" && currentPartner?.eventTypes?.length)
                      ? currentPartner.eventTypes
                      : ALL_EVENT_TYPES;
                    return types.map(type => (
                      <option key={type} value={type}>{EVENT_TYPE_LABELS[type] || type}</option>
                    ));
                  })()}
                </select>
              </div>


              {/* Data e Hor├írio */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>03. Data e Hor├írio do Evento</label>
                <DateTimePicker 
                  value={eventDate} 
                  onChange={setEventDate} 
                  workingHours={locationType === "PARTNER" ? currentPartner?.workingHours : null}
                />
              </div>

              {/* Bot├Áes de A├º├úo Passo 1 */}
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
                    const isLocalOk = locationType === "PARTNER" ? !!selectedPartnerId : (!!customCep && !!addressData.logradouro);
                    if (isLocalOk && eventDate) {
                      setStep(2);
                      window.scrollTo(0,0);
                    } else {
                      if (locationType === "OTHER" && (!addressData.logradouro || !customCep)) {
                        alert("Por favor, digite um CEP v├ílido para encontrarmos o endere├ºo.");
                      } else {
                        alert("Por favor, selecione o local e a data do evento.");
                      }
                    }
                  }}
                  style={{ background: THEME.accent, color: "black", padding: "15px 30px", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer" }}
                >
                  PR├ôXIMO: CONFIGURA├ç├âO <ArrowRight size={16} />
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
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.accent, letterSpacing: 2 }}>Passo 2: Configura├º├úo e Servi├ºos</label>

              {/* Dura├º├úo do Evento */}
              {(locationType === "OTHER" || (locationType === "PARTNER" && !currentPartner?.hideDuration)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: THEME.text2, letterSpacing: 1 }}>Dura├º├úo do Registro</label>
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
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: THEME.text2, fontWeight: 600 }}>
                    <span>1H</span><span>3H</span><span>6H</span><span>9H</span><span>12H</span>
                  </div>
                  {locationType === "PARTNER" && currentPartner?.fixedTime && (
                    <span style={{ fontSize: 7, color: THEME.accent, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>Dura├º├úo Fixa da Unidade</span>
                  )}
                </div>
              )}

              {/* Quantidade de Dias */}
              {(locationType === "OTHER" || (locationType === "PARTNER" && !currentPartner?.hideDuration)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: THEME.text2, letterSpacing: 1 }}>Quantidade de Dias</label>
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
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: THEME.text2, fontWeight: 600 }}>
                    <span>1 DIA</span><span>3 DIAS</span><span>5 DIAS</span><span>7 DIAS</span>
                  </div>
                </div>
              )}

              {/* Convidados, Tipo de Uso e Prefer├¬ncia de Equipamento */}
              <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: locationType === "OTHER" ? "repeat(4, 1fr)" : "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>N├║mero de Convidados</label>
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
                        onClick={() => setWorkflowPref("MOBILE")} 
                        style={{ 
                          flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, 
                          border: `1px solid ${workflowPref === "MOBILE" ? THEME.accent : THEME.border}`, 
                          background: workflowPref === "MOBILE" ? `${THEME.accent}10` : "transparent", 
                          color: workflowPref === "MOBILE" ? THEME.accent : THEME.text2, 
                          cursor: "pointer", transition: "all 0.3s ease" 
                        }}
                      >MOBILE MAKER</button>
                      <button 
                        type="button" 
                        onClick={() => setWorkflowPref("TRADICIONAL")} 
                        style={{ 
                          flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, 
                          border: `1px solid ${workflowPref === "TRADICIONAL" ? THEME.accent : THEME.border}`, 
                          background: workflowPref === "TRADICIONAL" ? `${THEME.accent}10` : "transparent", 
                          color: workflowPref === "TRADICIONAL" ? THEME.accent : THEME.text2, 
                          cursor: "pointer", transition: "all 0.3s ease" 
                        }}
                      >TRADICIONAL</button>
                    </div>
                </div>

                {locationType === "OTHER" && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Tipo de Finalidade</label>
                    <div style={{ display: "flex", gap: 10 }}>
                      <button type="button" onClick={() => setUsageType("PESSOAL")} style={{ flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, border: usageType === "PESSOAL" ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: usageType === "PESSOAL" ? `${THEME.accent}15` : "var(--theme-bg-muted)", boxShadow: usageType === "PESSOAL" ? "0 0 15px rgba(133,185,172,0.2)" : "none", color: usageType === "PESSOAL" ? THEME.accent : THEME.text2, cursor: "pointer", transition: "all 0.3s ease" }}>PESSOAL</button>
                      <button type="button" onClick={() => setUsageType("EMPRESARIAL")} style={{ flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, border: usageType === "EMPRESARIAL" ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: usageType === "EMPRESARIAL" ? `${THEME.accent}15` : "var(--theme-bg-muted)", boxShadow: usageType === "EMPRESARIAL" ? "0 0 15px rgba(133,185,172,0.2)" : "none", color: usageType === "EMPRESARIAL" ? THEME.accent : THEME.text2, cursor: "pointer", transition: "all 0.3s ease" }}>BUSINESS</button>
                    </div>
                  </div>
                )}
                {locationType === "OTHER" && (
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 10, display: "block", color: THEME.text }}>Budget Dispon├¡vel</label>
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <span style={{ position: "absolute", left: 18, color: THEME.accent, fontWeight: 900, fontSize: 12 }}>R$</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={availableBudget}
                        placeholder="VALOR DISPON├ìVEL"
                        onChange={e => setAvailableBudget(e.target.value.replace(/\D/g, ""))}
                        className="fs-input"
                        style={{ width: "100%", paddingLeft: 42, minHeight: 52 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Servi├ºos Categorizados */}
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 16, display: "block", color: THEME.text, letterSpacing: 2 }}>Selecione os Servi├ºos</label>
                
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
                          
                          // Mapeamento de ├ìcones
                          const getIcon = (_id: string, name: string) => {
                            const n = name.toLowerCase();
                            if (n.includes("phygital") || n.includes("impressa")) return <Printer size={18} />;
                            if (n.includes("video") || n.includes("cinema")) return <Video size={18} />;
                            if (n.includes("reels") || n.includes("smartphone")) return <Smartphone size={18} />;
                            if (n.includes("corporativo") || n.includes("linkedin")) return <Building2 size={18} />;
                            if (n.includes("gastron├┤mico")) return <Utensils size={18} />;
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

              {/* Rodap├® Din├ómico de Pre├ºo */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2, letterSpacing: 2 }}>Total Estimado</div>
                  <div className="font-display font-black text-emerald-500 italic" style={{ fontSize: 32 }}>
                    {showPrices ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice) : "SOB CONSULTA"}
                  </div>
                </div>
                <div className="mobile-stack" style={{ display: "flex", gap: 10, width: "100%" }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1 }} className="px-8 py-4 border-2 border-theme-border bg-theme-bg-muted text-theme-text font-display font-black text-[10px] uppercase tracking-widest hover:border-brand-tactical/50 transition-all rounded-lg">VOLTAR</button>
                  <button 
                    onClick={() => {
                      if (selectedServices.length > 0) {
                        setStep(3);
                        window.scrollTo(0,0);
                      } else {
                        alert("Por favor, selecione pelo menos um servi├ºo.");
                      }
                    }}
                    style={{ flex: 1 }}
                    className="px-8 py-4 bg-brand-tactical text-black font-display font-black text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(133,185,172,0.4)] rounded-lg"
                  >CONTINUAR &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mobile-padding" style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: "clamp(20px, 5vw, 40px)" }}>
             <button onClick={() => setStep(2)} style={{ color: THEME.text2, fontSize: 10, fontWeight: 800, marginBottom: 30, background: "none", border: "none", cursor: "pointer" }}>&larr; VOLTAR PARA CONFIGURA├ç├âO</button>
             
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
                        {p.nome?.toUpperCase() || "PROFISSIONAL"} - {p.address?.toUpperCase() || "GLOBAL"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-white/20 italic">Selecione um profissional espec├¡fico para priorizar seu atendimento.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Observa├º├Áes do Evento</label>
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

                {submitError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center gap-3 mt-4 text-xs font-bold uppercase tracking-widest text-center">
                    <ShieldCheck size={16} />
                    <span>{submitError}</span>
                  </div>
                )}
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
              <h2 className="text-4xl md:text-6xl font-display font-black text-theme-text uppercase italic tracking-tighter mb-8 leading-none">Solicita├º├úo Enviada</h2>
              
              {createdQuoteId && (
                <div style={{ background: "var(--theme-bg)", border: "1px solid var(--theme-border)", padding: "20px 40px", marginBottom: 40, display: "inline-block" }}>
                  <span className="text-[9px] font-black text-theme-muted uppercase tracking-[0.3em] block mb-2">Protocolo de Seguran├ºa</span>
                  <span className="text-2xl font-display font-black text-emerald-500 tracking-[0.15em] italic">ORC-{createdQuoteId.slice(-6).toUpperCase()}</span>
                </div>
              )}

              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest max-w-md mx-auto leading-relaxed mb-12">
                Recebemos seu briefing t├®cnico. Nossa curadoria analisar├í a viabilidade e entrar├í em contato atrav├®s de <span className="text-theme-text">{email}</span> para os pr├│ximos passos.
              </p>
              
              <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <button 
                  onClick={() => window.open('https://wa.me/5519981150440', '_blank')}
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

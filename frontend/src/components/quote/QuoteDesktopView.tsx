import { useState, useEffect, useRef } from "react";
import { Users, Calendar, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Clock, Home, Zap, Camera, Video, Printer, Smartphone, Building2, GraduationCap, Utensils } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";



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

const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DAYS_PT = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];

interface DayConfig {
  open: string;
  close: string;
  closed: boolean;
}

type WorkingHours = Record<string, DayConfig>;


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
    setOpen(false); // Fecha automaticamente ao selecionar o dia
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
        <Calendar size={18} className="absolute left-6 text-theme-brand z-10 group-hover:scale-110 transition-transform" />
        <div
          className="fs-input w-full !pl-16 text-[11px] font-bold uppercase tracking-widest min-h-[64px] flex items-center border border-theme-border bg-theme-bg-muted hover:border-emerald-500/40 transition-colors"
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
                    {isClosed && <div style={{ fontSize: 6, position: "absolute", bottom: 2, left: "50%", transform: "translateX(-50%)" }}>✗</div>}
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
                style={{ width: "100%", marginTop: 16, background: THEME.accent, color: "var(--theme-text-on-brand)", border: "none", padding: "12px", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, cursor: "pointer", borderRadius: 4 }}>
                OK
              </button>
            )}
          </div>
        )}
    </div>
  );
}

export const QuoteDesktopView = (props: any) => {
  const { step, setStep, nextStep, loading, partners, pros, preferredProfessionalId, setPreferredProfessionalId, flowType, selectedServices, setSelectedServices, availableServices, attendees, setAttendees, locationType, usageType, setUsageType, workflowPref, setWorkflowPref, selectedPartnerId, setSelectedPartnerId, category, setCategory, currentPartner, customCep, handleCepChange, isCepLoading, addressData, addressNumber, setAddressNumber, eventDate, setEventDate, eventHours, setEventHours, eventDays, setEventDays, description, setDescription, availableBudget, setAvailableBudget, name, setName, email, setEmail, whatsapp, setWhatsapp, ticketUrl, setTicketUrl, fotoSegundoPromoCode, setFotoSegundoPromoCode, showPrices, getServicePrice, totalPrice, submitting, createdQuoteId, submitError, handleSubmit } = props as any;

  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text font-b selection:bg-emerald-500 selection:text-theme-text py-10 md:py-20 px-4">
      {loading && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-theme-bg">
          <div className="absolute inset-0 bg-emerald-500/5 blur-[120px] rounded-full -m-64 opacity-20" />
          <div className="relative z-10 flex flex-col items-center gap-8">
            <div className="w-px h-16 bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
            <div className="text-[18px] font-display font-bold uppercase tracking-[0.8em] text-theme-text">FOTO SEGUNDO</div>
            <div className="text-[9px] font-bold uppercase tracking-[0.4em] text-theme-brand animate-pulse">Configurando Motor Tático</div>
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
            className="text-[10px] font-bold text-theme-brand mb-4 uppercase tracking-[0.5em]" 
            style={{ opacity: 0.8 }}
          >Solicitação de Orçamento</div>
          <h1 className="text-4xl md:text-6xl font-display font-bold uppercase leading-none text-theme-text">
            ETERNIZE SEU <span className="text-theme-subtle">EVENTO</span>
          </h1>
        </header>

        {flowType && flowType !== "PACKAGE" && (
          <div className="mb-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <span className="text-theme-brand">⭐</span>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-theme-brand">Jornada Selecionada</div>
                <div className="text-sm font-bold text-theme-text">
                  {flowType === "PARTNER" && "Unidade Fixa (Casas Parceiras)"}
                  {flowType === "CUSTOM" && "Orçamento Sob Medida"}
                </div>
              </div>
            </div>
            <button onClick={() => window.location.href = '/cotacao'} className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-colors border-b border-theme-border pb-1">
              Trocar
            </button>
          </div>
        )}

        {flowType === "PACKAGE" && props.availablePackages && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <label className="text-[10px] font-bold uppercase tracking-widest text-theme-brand">Escolha o seu Pacote</label>
              <button onClick={() => window.location.href = '/cotacao'} className="text-[10px] font-bold uppercase tracking-widest text-theme-text-muted hover:text-theme-text transition-colors border-b border-theme-border pb-1">
                Voltar à Vitrine
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {props.availablePackages.map((pkg: any) => (
                <div 
                  key={pkg.id}
                  onClick={() => props.setSelectedPackageId(pkg.id)}
                  className={`p-5 rounded-xl border cursor-pointer transition-all ${
                    props.selectedPackageId === pkg.id 
                      ? "bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(133,185,172,0.15)] scale-[1.02]" 
                      : "bg-theme-bg-muted border-theme-border hover:border-emerald-500/50 hover:bg-theme-bg"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-bold uppercase tracking-widest text-theme-text">{pkg.name}</h4>
                    {props.selectedPackageId === pkg.id && <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
                  </div>
                  <div className="text-[10px] text-theme-text-muted mb-4 uppercase tracking-widest leading-relaxed">
                    {pkg.desc}
                  </div>
                  <div className="text-lg font-bold text-theme-brand">
                    R$ {pkg.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── PASSO 1: Onde e Quando ─── */}
        {step === 1 && (
          <div 
            style={{ opacity: 1, transform: "none" }}
            className="lux-card mobile-padding editorial-shadow"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.accent, letterSpacing: 2 }}>Passo 1: Onde e Quando</label>
              
              {/* 01. Local do Registro */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: THEME.text }}>
                  {locationType === "PARTNER" ? "01. Selecione a Unidade Fixa" : "01. Endereço do Evento"}
                </label>

                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr", gap: 8 }}>
                   {locationType === "PARTNER" ? (
                    <select required value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} className="fs-input" style={{ width: "100%" }}>
                      <option value="">SELECIONE A UNIDADE FIXA...</option>
                      {partners && partners.length > 0 && partners.map((p: any) => (
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
                          className="fs-input" 
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

              {/* 02. Data e Horário */}
              <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", color: THEME.text }}>02. Data e Horário do Evento</label>
                <DateTimePicker 
                  value={eventDate} 
                  onChange={setEventDate} 
                  workingHours={locationType === "PARTNER" ? currentPartner?.workingHours : null}
                />
              </div>

              {/* Botões Passo 1 */}
              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 30, marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button 
                  type="button"
                  onClick={() => navigate(-1)}
                  className="fs-btn hover-lift"
                  style={{ background: "transparent", color: THEME.text, border: `1px solid ${THEME.border}` }}
                >
                  VOLTAR
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    const isLocalOk = locationType === "PARTNER" ? !!selectedPartnerId : (!!customCep && !!addressData.logradouro);
                    if (isLocalOk && eventDate) {
                      nextStep();
                    } else {
                      if (locationType === "OTHER" && (!addressData.logradouro || !customCep)) {
                        alert("Por favor, digite um CEP válido para encontrarmos o endereço.");
                      } else {
                        alert("Por favor, selecione o local e a data do evento.");
                      }
                    }
                  }}
                  className="fs-btn hover-lift"
                  style={{ background: THEME.accent, color: "black", padding: "15px 30px", border: "none" }}
                >
                  {flowType === "PACKAGE" ? "PRÓXIMO: SEUS DADOS" : "PRÓXIMO: CONFIGURAÇÃO"} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASSO 2: Configuração e Serviços ─── */}
        {step === 2 && (
          <div 
            style={{ opacity: 1, transform: "none" }}
            className="lux-card mobile-padding editorial-shadow"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.accent, letterSpacing: 2 }}>Passo 2: Configuração e Serviços</label>

              {/* 01. Tipo de Evento — movido para o passo 2 */}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text }}>01. Tipo de Evento</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="fs-input" style={{ width: "100%", paddingLeft: 46 }}>
                  {(() => {
                    const EVENT_TYPE_LABELS: Record<string, string> = {
                      CASAMENTO: "CASAMENTO",
                      ANIVERSARIO: "ANIVERSÁRIO",
                      SHOW_FESTIVAL: "SHOW / FESTIVAL",
                      CORPORATIVO: "EVENTO CORPORATIVO",
                      FORMATURA: "FORMATURA",
                      ENSAIO: "ENSAIO FOTOGRÁFICO",
                      BAILE_FESTA: "BAILE / FESTA",
                      CONFRATERNIZACAO: "CONFRATERNIZAÇÃO",
                      CHURRASCO_BUFFET: "CHURRASCO / BUFFET",
                      OUTROS: "OUTROS",
                    };
                    const ALL_EVENT_TYPES = Object.keys(EVENT_TYPE_LABELS);
                    const types = (locationType === "PARTNER" && currentPartner?.eventTypes?.length)
                      ? currentPartner.eventTypes
                      : ALL_EVENT_TYPES;
                    return types.map((type: any) => (
                      <option key={type} value={type}>{EVENT_TYPE_LABELS[type] || type}</option>
                    ));
                  })()}
                </select>
              </div>

              {/* Duração do Evento */}
              {(locationType === "OTHER" || (locationType === "PARTNER" && !currentPartner?.hideDuration)) && (
                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label style={{ fontSize: 10, fontWeight: 900, textTransform: "uppercase", color: THEME.text2, letterSpacing: 1 }}>Duração do Registro</label>
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
                    <span style={{ fontSize: 7, color: THEME.accent, fontWeight: 800, textTransform: "uppercase", marginTop: 4 }}>Duração Fixa da Unidade</span>
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

              {/* Convidados, Equipamento e Finalidade */}
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
                      <button type="button" onClick={() => setUsageType("EMPRESARIAL")} style={{ flex: 1, minHeight: 52, padding: "0 12px", fontSize: 10, fontWeight: 800, border: usageType === "EMPRESARIAL" ? `2px solid ${THEME.accent}` : `1px solid ${THEME.border}`, background: usageType === "EMPRESARIAL" ? `${THEME.accent}15` : "var(--theme-bg-muted)", boxShadow: usageType === "EMPRESARIAL" ? "0 0 15px rgba(133,185,172,0.2)" : "none", color: usageType === "EMPRESARIAL" ? THEME.accent : THEME.text2, cursor: "pointer", transition: "all 0.3s ease" }}>CORPORATIVO</button>
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
                  const categories = Array.from(new Set(availableServices.map((s: any) => s.category || "Geral")));
                  
                  return categories.map((cat: any) => (
                    <div key={cat} style={{ marginBottom: 32 }}>
                      <h4 style={{ fontSize: 9, fontWeight: 900, textTransform: "uppercase", color: THEME.accent, letterSpacing: 3, marginBottom: 12, display: "flex", alignItems: "center", gap: 10 }}>
                        <div style={{ width: 12, height: 1, background: THEME.accent }} /> {cat}
                      </h4>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 12 }}>
                        {availableServices.filter((s: any) => (s.category || "Geral") === cat).map((s: any) => {
                          const isSelected = selectedServices.includes(s.id);
                          const cleanName = s.name.replace(/\(UPGRADE\)/gi, "").trim();
                          
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
                                if (isSelected) setSelectedServices((prev: any[]) => prev.filter((x: any) => x !== s.id));
                                else setSelectedServices((prev: any[]) => [...prev, s.id]);
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
                  <div className="font-display font-bold text-theme-brand" style={{ fontSize: 32 }}>
                    {showPrices ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(totalPrice) : "SOB CONSULTA"}
                  </div>
                </div>
                <div className="mobile-stack" style={{ display: "flex", gap: 10, width: "100%" }}>
                  <button onClick={() => setStep(1)} style={{ flex: 1 }} className="px-8 py-4 border-2 border-theme-border bg-theme-bg-muted text-theme-text font-display font-bold text-[10px] uppercase tracking-widest hover:border-brand-tactical/50 transition-all rounded-lg">VOLTAR</button>
                  <button 
                    onClick={() => {
                      if (selectedServices.length > 0) {
                        setStep(3);
                        window.scrollTo(0,0);
                      } else {
                        alert("Por favor, selecione pelo menos um serviço.");
                      }
                    }}
                    style={{ flex: 1 }}
                    className="px-8 py-4 bg-brand-tactical text-theme-text font-display font-bold text-[11px] uppercase tracking-widest hover:bg-white transition-all shadow-[0_0_20px_rgba(133,185,172,0.4)] rounded-lg"
                  >CONTINUAR &rarr;</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── PASSO 3: Seus Dados ─── */}
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
                    {pros.map((p: any) => (
                      <option key={p.id} value={p.userId}>
                        {p.nome?.toUpperCase() || "PROFISSIONAL"} - {p.address?.toUpperCase() || "GLOBAL"}
                      </option>
                    ))}
                  </select>
                  <p className="text-[9px] text-theme-text/20">Selecione um profissional específico para priorizar seu atendimento.</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Observações do Evento</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4} placeholder="CONTE-NOS MAIS DETALHES..." className="fs-input" />
                </div>

                <div className="mobile-grid-1" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Link de Venda de Ingressos (Opcional)</label>
                    <input value={ticketUrl || ''} onChange={e => setTicketUrl(e.target.value)} placeholder="HTTPS://SYMPLA.COM/..." className="fs-input" style={{ width: "100%", padding: "15px" }} />
                    <p className="text-[9px] text-theme-text/40">Ganhe mais visibilidade divulgando seus ingressos na nossa vitrine.</p>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Seu Cupom Promocional (Opcional)</label>
                    <input value={fotoSegundoPromoCode || ''} onChange={e => setFotoSegundoPromoCode(e.target.value.toUpperCase())} placeholder="EX: FOTOSEGUNDO10" className="fs-input" style={{ width: "100%", padding: "15px" }} />
                    <p className="text-[9px] text-theme-text/40">Ofereça um desconto exclusivo para clientes Foto Segundo e gere comissionamento.</p>
                  </div>
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

        {/* ─── PASSO 4: Confirmação ─── */}
        {step === 4 && (
          <div style={{ textAlign: "center", padding: "80px 40px", background: "var(--theme-bg-muted)", border: "1px solid var(--theme-border)" }} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] rounded-full opacity-30" />
            
            <div className="relative z-10">
              <div style={{ width: 80, height: 80, background: "var(--theme-bg)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px", border: "1px solid var(--theme-border)" }}>
                <ShieldCheck size={40} className="text-theme-brand" />
              </div>
              <h2 className="text-4xl md:text-6xl font-display font-bold text-theme-text uppercase mb-8 leading-none">Solicitação Enviada</h2>
              
              {createdQuoteId && (
                <div style={{ background: "var(--theme-bg)", border: "1px solid var(--theme-border)", padding: "20px 40px", marginBottom: 40, display: "inline-block" }}>
                  <span className="text-[9px] font-bold text-theme-muted uppercase tracking-[0.3em] block mb-2">Protocolo de Segurança</span>
                  <span className="text-2xl font-display font-bold text-theme-brand tracking-[0.15em]">ORC-{createdQuoteId.slice(-6).toUpperCase()}</span>
                </div>
              )}

              <p className="text-xs font-bold text-theme-muted uppercase tracking-widest max-w-md mx-auto leading-relaxed mb-12">
                Recebemos seu briefing técnico. Nossa curadoria analisará a viabilidade e entrará em contato através de <span className="text-theme-text">{email}</span> para os próximos passos.
              </p>
              
              <div className="flex flex-col gap-4 max-w-sm mx-auto">
                <button 
                  onClick={() => window.open('https://wa.me/5519981150440', '_blank')}
                  className="w-full py-6 bg-emerald-500 text-theme-text font-display font-bold text-xs uppercase tracking-[0.3em] hover:bg-white transition-all shadow-2xl shadow-emerald-500/20"
                >
                  FALAR COM ESPECIALISTA
                </button>
                <button 
                  onClick={() => navigate("/")}
                  className="w-full py-4 text-theme-subtle font-display font-bold text-[10px] uppercase tracking-[0.5em] hover:text-theme-text transition-colors"
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

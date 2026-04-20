import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Calendar, ArrowRight, ShieldCheck, ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { API } from "../lib/api";
import { useNavigate } from "react-router-dom";

// ── Configurações de Precificação (Tactical Engine) 🛡️⚙️ ───────────
const P = {
  COST_SENIOR: 160,
  COST_AUX: 58.62,
  FEE_TOLL: 25,
  BASE_FREIGHT: 15,
  KM_RATE: 2.50,
  SERVICES: [
    { id: "foto", label: "FOTOGRAFIA", price: 0, required: true },
    { id: "video", label: "VÍDEO", price: 150 },
    { id: "reels", label: "REELS / MOBILE", price: 80 },
    { id: "impresso", label: "FOTO IMPRESSA", price: 120 },
  ]
};

const THEME = {
  bg: "#0c0c0c",
  bgCard: "#111",
  border: "#1c1c1c",
  accent: "#8a9a5b",
  text: "#f0ede8",
  text2: "#888",
  fontD: "'Barlow Condensed', sans-serif",
  fontB: "'Inter', sans-serif",
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
      <AnimatePresence>
        {open && (
          <motion.div
            key="picker"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.18 }}
            style={{
              position: "absolute", top: "calc(100% + 8px)", left: 0, zIndex: 999,
              background: "#0d0d0d", border: `1px solid ${THEME.accent}40`,
              width: 320, padding: 20, boxShadow: "0 24px 60px rgba(0,0,0,0.9)"
            }}
          >
            {/* Month Navigation */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <button
                onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1))}
                style={{ background: "none", border: "none", color: THEME.text2, cursor: "pointer", padding: 6, display: "flex" }}
              ><ChevronLeft size={16} /></button>
              <span style={{ fontSize: 11, fontWeight: 800, color: THEME.text, textTransform: "uppercase", letterSpacing: 3 }}>
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
                      fontSize: 12, fontWeight: isSelected ? 800 : 400,
                      cursor: day && !isPast ? "pointer" : "default",
                      background: isSelected ? THEME.accent : isToday ? `${THEME.accent}20` : "transparent",
                      color: isSelected ? "#000" : isPast ? "#2a2a2a" : !day ? "transparent" : THEME.text,
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
                  style={{ flex: 1, background: "#111", border: `1px solid ${THEME.border}`, color: THEME.text, padding: "10px 8px", fontSize: 18, fontWeight: 700, textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  {Array.from({length: 24}, (_, i) => String(i).padStart(2,"0")).map(h => (
                    <option key={h} value={h}>{h}h</option>
                  ))}
                </select>
                <span style={{ color: THEME.accent, fontSize: 22, fontWeight: 900 }}>:</span>
                <select value={minute} onChange={e => updateTime(hour, e.target.value)}
                  style={{ flex: 1, background: "#111", border: `1px solid ${THEME.border}`, color: THEME.text, padding: "10px 8px", fontSize: 18, fontWeight: 700, textAlign: "center", borderRadius: 0, cursor: "pointer" }}>
                  {["00","15","30","45"].map(m => (
                    <option key={m} value={m}>{m}min</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Confirm Button */}
            {selectedDate && (
              <button onClick={() => setOpen(false)}
                style={{ width: "100%", marginTop: 16, background: THEME.accent, color: "#000", border: "none", padding: "12px", fontSize: 10, fontWeight: 900, textTransform: "uppercase", letterSpacing: 3, cursor: "pointer" }}>
                CONFIRMAR DATA E HORÁRIO
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export const QuotePage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [partners, setPartners] = useState<{id: string, name: string, city: string}[]>([]);
  
  // Form State
  const [selectedServices, setSelectedServices] = useState<string[]>(["foto"]);
  const [attendees, setAttendees] = useState(50);
  const [locationType, setLocationType] = useState<"PARTNER" | "OTHER">("PARTNER");
  const [selectedPartnerId, setSelectedPartnerId] = useState("");
  const [customCep, setCustomCep] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventHours, setEventHours] = useState(2);
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Busca parceiros cadastrados
    API.get("/public/partners").then(res => setPartners(res.data)).catch(() => {});
  }, []);

  // Lógica de Equipe 🛡️👥
  const calculateTeam = () => {
    let senior = 1;
    let aux = 0;

    // Escalonamento por convidados (Foco em Fotografia)
    if (attendees > 50 && attendees <= 65) {
      aux = 1;
    } else if (attendees > 65) {
      senior = Math.ceil(attendees / 50);
    }

    // Adicional por serviços de captação extra
    if (selectedServices.includes("video")) senior += 1;
    if (selectedServices.includes("reels")) senior += 1;

    // Fator multiplicador por horas (Para locais não cadastrados)
    const hoursFactor = locationType === "OTHER" ? eventHours : 1;

    const cost = ((senior * P.COST_SENIOR) + (aux * P.COST_AUX)) * hoursFactor;
    return { senior, aux, cost };
  };

  // Cálculo de Preço Final 💰
  const team = calculateTeam();
  const servicesPrice = P.SERVICES.filter(s => selectedServices.includes(s.id)).reduce((acc, s) => acc + s.price, 0);
  const isOutsideCampinas = locationType === "OTHER" && customCep !== ""; 
  const freight = isOutsideCampinas ? P.BASE_FREIGHT + (20 * P.KM_RATE) + P.FEE_TOLL : 0; 
  
  const totalPrice = team.cost + servicesPrice + freight;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name, email, attendees, locationType, selectedPartnerId, customCep, 
      eventDate, eventHours, description, selectedServices, totalPrice, 
      status: locationType === "PARTNER" ? "APROVADO" : "PENDENTE"
    };

    try {
      const { data } = await API.post("/public/quotes", payload);
      if (locationType === "PARTNER") {
        alert("Orçamento Aprovado! Redirecionando para reserva...");
        window.location.href = data.checkoutUrl;
      } else {
        setStep(3); 
      }
    } catch {
      alert("Erro ao processar orçamento. Tente novamente.");
    }
  };

  return (
    <div style={{ background: THEME.bg, color: THEME.text, minHeight: "100vh", fontFamily: THEME.fontB, padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;700&display=swap');
        .fs-input { background: #000 !important; border: 1px solid #1c1c1c !important; color: white !important; border-radius: 0 !important; box-sizing: border-box; }
        .fs-input:focus { border-color: ${THEME.accent} !important; outline: none !important; }
        select.fs-input, textarea.fs-input { padding: 15px !important; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 6, color: THEME.accent, marginBottom: 20 }}>Solicitação de Orçamento</div>
          <h1 style={{ fontFamily: THEME.fontD, fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.9 }}>
            Reserve seu <span style={{ color: THEME.text2 }}>Grande Dia</span>
          </h1>
        </header>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: 40 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 30 }}>

              {/* 1. Onde será o registro? */}
              <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>1. Onde será o registro?</label>
                <div style={{ display: "flex", gap: 10 }}>
                  <button 
                    type="button"
                    onClick={() => setLocationType("PARTNER")}
                    style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "PARTNER" ? THEME.accent : THEME.border}`, background: locationType === "PARTNER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: "white", cursor: "pointer" }}
                  >PONTO PARCEIRO</button>
                  <button 
                    type="button"
                    onClick={() => setLocationType("OTHER")}
                    style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "OTHER" ? THEME.accent : THEME.border}`, background: locationType === "OTHER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: "white", cursor: "pointer" }}
                  >OUTRO LOCAL</button>
                </div>

                {locationType === "PARTNER" ? (
                  <select required value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} className="fs-input" style={{ width: "100%" }}>
                    <option value="">SELECIONE O PONTO PARCEIRO...</option>
                    {partners.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} - {p.city || 'CAMPINAS'}</option>)}
                  </select>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 120px", gap: 10 }}>
                    <input required value={customCep} onChange={e => setCustomCep(e.target.value)} placeholder="CEP DO LOCAL" className="fs-input" style={{ width: "100%", padding: "15px" }} />
                    <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                      <Clock size={16} style={{ position: "absolute", left: 12, color: THEME.accent, pointerEvents: "none" }} />
                      <input type="number" value={eventHours} onChange={e => setEventHours(Number(e.target.value))} className="fs-input" style={{ width: "100%", padding: "15px 10px 15px 35px" }} />
                      <span style={{ position: "absolute", right: 10, fontSize: 9, color: THEME.text2, pointerEvents: "none" }}>H</span>
                    </div>
                  </div>
                )}
                {locationType === "OTHER" && (
                  <p style={{ fontSize: 9, color: "#f59e0b", margin: 0, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>
                    ⚠️ Importante: Para locais não cadastrados, o orçamento é uma estimativa e poderá sofrer variações após análise técnica.
                  </p>
                )}
              </div>

              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>2. Selecione os Serviços</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 15 }}>
                  {P.SERVICES.map(s => (
                    <div 
                      key={s.id}
                      onClick={() => !s.required && setSelectedServices(prev => prev.includes(s.id) ? prev.filter(x => x !== s.id) : [...prev, s.id])}
                      style={{ 
                        padding: 20, border: `1px solid ${selectedServices.includes(s.id) ? THEME.accent : THEME.border}`, 
                        cursor: s.required ? "default" : "pointer", background: selectedServices.includes(s.id) ? `${THEME.accent}10` : "transparent",
                        transition: "all 0.3s"
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 900, marginBottom: 5 }}>{s.label}</div>
                      <div style={{ fontSize: 10, color: THEME.text2 }}>{s.price === 0 ? "INCLUSO" : `+ R$ ${s.price}`}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>3. Número de Convidados</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Users size={18} style={{ position: "absolute", left: 15, color: THEME.accent, pointerEvents: "none", zIndex: 1 }} />
                    <input
                      type="number"
                      value={attendees}
                      onChange={e => setAttendees(Number(e.target.value))}
                      className="fs-input"
                      style={{ width: "100%", padding: "15px 15px 15px 48px" }}
                    />
                  </div>
                  <div style={{ fontSize: 9, marginTop: 10, color: THEME.accent, fontWeight: 700, textTransform: "uppercase" }}>
                    Equipe Recomendada: {team.senior} Sênior {team.aux > 0 && `+ ${team.aux} Auxiliar`}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>4. Data e Horário do Evento</label>
                  <DateTimePicker value={eventDate} onChange={setEventDate} />
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 30, marginTop: 20 }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: THEME.text2, textTransform: "uppercase", marginBottom: 5 }}>Investimento Estimado</div>
                      <div style={{ fontFamily: THEME.fontD, fontSize: 44, fontWeight: 900, color: THEME.accent }}>R$ {totalPrice.toFixed(2)}</div>
                    </div>
                    <div style={{ display: "flex", gap: 15 }}>
                      <button 
                        type="button"
                        onClick={() => navigate(-1)}
                        style={{ border: `1px solid ${THEME.border}`, color: "white", padding: "15px 30px", fontWeight: 800, fontSize: 11, textTransform: "uppercase", letterSpacing: 2, background: "none", cursor: "pointer" }}
                      >
                        VOLTAR
                      </button>
                      <button 
                        onClick={() => setStep(2)}
                        style={{ background: THEME.accent, color: "black", padding: "15px 30px", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 10 }}
                      >
                        PRÓXIMO PASSO <ArrowRight size={16} />
                      </button>
                    </div>
                 </div>
              </div>

            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: 40 }}>
             <button onClick={() => setStep(1)} style={{ color: THEME.text2, fontSize: 10, fontWeight: 800, marginBottom: 30, background: "none", border: "none", cursor: "pointer" }}>&larr; VOLTAR</button>
             
             <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 30 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
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
                  {locationType === "PARTNER" ? "CONCLUIR RESERVA IMEDIATA" : "ENVIAR PARA ANÁLISE"}
                </button>
             </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: 60, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${THEME.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
              <ShieldCheck size={40} color={THEME.accent} />
            </div>
            <h2 style={{ fontFamily: THEME.fontD, fontSize: 42, fontWeight: 900, textTransform: "uppercase", marginBottom: 20 }}>Recebemos sua Solicitação</h2>
            <p style={{ color: THEME.text2, fontSize: 14, maxWidth: 400, margin: "0 auto 40px", lineHeight: 1.6 }}>
              O orçamento estimado foi salvo. Como trata-se de um local novo, nossa equipe técnica validará o CEP e a descrição em até 30 minutos para liberar o seu link de reserva.
            </p>
            <button 
              onClick={() => navigate("/")}
              style={{ border: `1px solid ${THEME.border}`, padding: "15px 40px", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 2, background: "none", color: "white", cursor: "pointer" }}
            >
              VOLTAR PARA A VITRINE
            </button>
          </motion.div>
        )}

      </div>
    </div>
  );
};

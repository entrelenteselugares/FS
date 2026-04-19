import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Calendar, ArrowRight, ShieldCheck } from "lucide-react";
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
  const [description, setDescription] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    // Busca parceiros cadastrados
    API.get("/public/partners").then(res => setPartners(res.data)).catch(() => {});
  }, []);

  // Lógica de Equipe 🛡️👥
  const calculateTeam = () => {
    if (attendees <= 50) return { senior: 1, aux: 0, cost: P.COST_SENIOR };
    if (attendees <= 65) return { senior: 1, aux: 1, cost: P.COST_SENIOR + P.COST_AUX };
    const seniorsNeeded = Math.ceil(attendees / 50);
    return { senior: seniorsNeeded, aux: 0, cost: seniorsNeeded * P.COST_SENIOR };
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
      eventDate, description, selectedServices, totalPrice, 
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
    } catch (err) {
      alert("Erro ao processar orçamento. Tente novamente.");
    }
  };

  return (
    <div style={{ background: THEME.bg, color: THEME.text, minHeight: "100vh", fontFamily: THEME.fontB, padding: "40px 20px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;900&family=Inter:wght@400;700&display=swap');
        input, select, textarea { background: #000 !important; border: 1px solid #1c1c1c !important; color: white !important; border-radius: 0 !important; padding: 15px !important; }
        input:focus { border-color: ${THEME.accent} !important; outline: none; }
      `}</style>

      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <header style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: 6, color: THEME.accent, marginBottom: 20 }}>Operations & Intelligence</div>
          <h1 style={{ fontFamily: THEME.fontD, fontSize: "clamp(40px, 8vw, 64px)", fontWeight: 900, textTransform: "uppercase", lineHeight: 0.9 }}>
            Máquina de <span style={{ color: THEME.text2 }}>Vendas</span>
          </h1>
        </header>

        {step === 1 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ background: THEME.bgCard, border: `1px solid ${THEME.border}`, padding: 40 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 30 }}>
              
              <div>
                <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>1. Selecione os Serviços</label>
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
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>2. Número de Convidados</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Users size={18} style={{ position: "absolute", left: 15, color: THEME.accent, pointerEvents: "none" }} />
                    <input type="number" value={attendees} onChange={e => setAttendees(Number(e.target.value))} style={{ width: "100%", paddingLeft: "48px !important" }} />
                  </div>
                  <div style={{ fontSize: 9, marginTop: 10, color: THEME.accent, fontWeight: 700, textTransform: "uppercase" }}>
                    Equipe Suggest: {team.senior} Sênior {team.aux > 0 && `+ ${team.aux} Auxiliar`}
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", marginBottom: 15, display: "block", color: THEME.text2 }}>3. Data do Evento</label>
                  <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                    <Calendar size={18} style={{ position: "absolute", left: 15, color: THEME.accent, pointerEvents: "none" }} />
                    <input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} style={{ width: "100%", paddingLeft: "48px !important" }} />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: `1px solid ${THEME.border}`, paddingTop: 30, marginTop: 20 }}>
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 800, color: THEME.text2, textTransform: "uppercase", marginBottom: 5 }}>Investimento Estimado</div>
                      <div style={{ fontFamily: THEME.fontD, fontSize: 44, fontWeight: 900, color: THEME.accent }}>R$ {totalPrice.toFixed(2)}</div>
                    </div>
                    <button 
                      onClick={() => setStep(2)}
                      style={{ background: THEME.accent, color: "black", padding: "15px 30px", fontWeight: 900, fontSize: 12, textTransform: "uppercase", letterSpacing: 2, display: "flex", alignItems: "center", gap: 10 }}
                    >
                      PRÓXIMO PASSO <ArrowRight size={16} />
                    </button>
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
                    <input required value={name} onChange={e => setName(e.target.value)} placeholder="NOME DO CONTRATANTE" />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>E-mail para Contato</label>
                    <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="EX: CONTATO@DOMINIO.COM" />
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 15 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Onde será o registro?</label>
                  <div style={{ display: "flex", gap: 10 }}>
                    <button 
                      type="button"
                      onClick={() => setLocationType("PARTNER")}
                      style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "PARTNER" ? THEME.accent : THEME.border}`, background: locationType === "PARTNER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: "white" }}
                    >PONTO PARCEIRO</button>
                    <button 
                      type="button"
                      onClick={() => setLocationType("OTHER")}
                      style={{ flex: 1, padding: 15, border: `1px solid ${locationType === "OTHER" ? THEME.accent : THEME.border}`, background: locationType === "OTHER" ? `${THEME.accent}10` : "transparent", fontSize: 10, fontWeight: 900, color: "white" }}
                    >OUTRO LOCAL</button>
                  </div>

                  {locationType === "PARTNER" ? (
                    <select required value={selectedPartnerId} onChange={e => setSelectedPartnerId(e.target.value)} style={{ width: "100%" }}>
                      <option value="">SELECIONE O PONTO PARCEIRO...</option>
                      {partners.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()} - {p.city || 'CAMPINAS'}</option>)}
                    </select>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      <input required value={customCep} onChange={e => setCustomCep(e.target.value)} placeholder="DIGITE O CEP DO LOCAL" />
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", color: THEME.text2 }}>Descreva seu evento com suas palavras</label>
                  <textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    rows={4} 
                    placeholder="CONTE-NOS MAIS DETALHES, OBJETIVOS E EXPECTATIVAS..."
                  />
                </div>

                <button 
                  type="submit"
                  style={{ background: THEME.accent, color: "black", padding: "20px", fontWeight: 900, fontSize: 14, textTransform: "uppercase", letterSpacing: 4, marginTop: 20 }}
                >
                  {locationType === "PARTNER" ? "CONCLUIR RESERVA IMEDIATA" : "SOLICITAR APROVAÇÃO TÉCNICA"}
                </button>
             </form>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ textAlign: "center", padding: 60, background: THEME.bgCard, border: `1px solid ${THEME.border}` }}>
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: `${THEME.accent}20`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 30px" }}>
              <ShieldCheck size={40} color={THEME.accent} />
            </div>
            <h2 style={{ fontFamily: THEME.fontD, fontSize: 42, fontWeight: 900, textTransform: "uppercase", marginBottom: 20 }}>Enviado para Aprovação</h2>
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

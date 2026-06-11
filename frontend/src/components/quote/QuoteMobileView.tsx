 
// 
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, CheckCircle2, MapPin, Building2, ArrowRight } from "lucide-react";

export const QuoteMobileView = (props: any) => {
  const { 
    step, setStep, nextStep, prevStep,
    locationType,
    category, setCategory,
    eventDate, setEventDate,
    selectedPartnerId, setSelectedPartnerId,
    partners,
    customCep, addressData, handleCepChange,
    availableServices, selectedServices, setSelectedServices,
    name, setName, email, setEmail, whatsapp, setWhatsapp, attendees, setAttendees,
    submitting, handleSubmit,
    totalPrice, getServicePrice,
    flowType,
    ticketUrl, setTicketUrl,
    fotoSegundoPromoCode, setFotoSegundoPromoCode
  } = props;

  const THEME = {
    bg: "#09090b", // zinc-950
    card: "#18181b", // zinc-900
    accent: "#85b9ac", // emerald-500
    text: "#fafafa",
    textMuted: "#a1a1aa"
  };

  const currentPartner = partners.find((p: any) => p.id === selectedPartnerId);

  // Success state
  if (props.createdQuoteId) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-zinc-950">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold uppercase text-white mb-2">Orçamento Enviado!</h2>
        
        <div className="bg-zinc-900 border border-white/10 px-6 py-4 rounded-xl mb-6">
          <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block mb-1">Protocolo</span>
          <span className="text-xl font-bold text-white tracking-widest">ORC-{props.createdQuoteId.slice(-6).toUpperCase()}</span>
        </div>

        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          Recebemos sua solicitação. Nossa equipe entrará em contato via WhatsApp para finalizar o orçamento.
        </p>
        
        <div className="flex flex-col gap-3 w-full max-w-xs mt-8">
          <button
            onClick={() => window.open('https://wa.me/5519981150440', '_blank')}
            className="w-full py-3.5 bg-emerald-500 text-black text-[11px] font-bold uppercase tracking-widest rounded-full"
          >
            Falar no WhatsApp
          </button>
          <button
            onClick={() => window.location.href = "/"}
            className="w-full py-3.5 border border-white/10 text-zinc-400 hover:text-white text-[11px] font-bold uppercase tracking-widest rounded-full"
          >
            Voltar ao Início
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col font-b selection:bg-emerald-500 selection:text-black pb-24" style={{ backgroundColor: THEME.bg, color: THEME.text }}>
      {/* Header Compacto */}
      <div className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md px-4 py-3 flex items-center border-b border-white/5">
        {step > 1 && (
          <button onClick={prevStep} className="p-1 -ml-1 mr-2 text-zinc-400 hover:text-white active:scale-95 transition-transform">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500">Passo {step} de 4</div>
          <div className="text-sm font-medium text-white/90">
            {step === 1 && "Local do Evento"}
            {step === 2 && "Servi�os Desejados"}
            {step === 3 && "Detalhes e Data"}
            {step === 4 && "Seus Dados"}
          </div>
        </div>
      </div>

      {flowType && (
        <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-3 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-sm">⭐</span>
            <div>
              <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-500">Jornada Selecionada</div>
              <div className="text-xs font-bold text-white">
                {flowType === "PACKAGE" && "Pacote Fechado: Essencial (R$ 1.900)"}
                {flowType === "PARTNER" && "Unidade Fixa (Casas Parceiras)"}
                {flowType === "CUSTOM" && "Orçamento Sob Medida"}
              </div>
            </div>
          </div>
          <button onClick={() => setStep(0)} className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 hover:text-white border-b border-white/10 pb-0.5">
            Trocar
          </button>
        </div>
      )}

      <div className="flex-1 px-4 py-4 space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-5"
          >
            {/* ====== PASSO 1: LOCAL ====== */}
            {step === 1 && (
              <div className="space-y-6">
                {/* Removidos botões de Local (Unidade Fixa vs Outro Local) pois é decidido na Landing Page pelo flowType */}

                {locationType === "PARTNER" && (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Escolha o Estabelecimento</label>
                    <div className="flex flex-col gap-2">
                      {partners.map((p: any) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPartnerId(p.id)}
                          className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${selectedPartnerId === p.id ? "bg-emerald-500/10 border-emerald-500/50" : "bg-zinc-900/30 border-white/5"}`}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedPartnerId === p.id ? "bg-emerald-500/20 text-emerald-500" : "bg-zinc-800 text-zinc-500"}`}>
                            {selectedPartnerId === p.id ? <CheckCircle2 size={16} /> : <Building2 size={16} />}
                          </div>
                          <div className="flex-1">
                            <div className={`text-sm font-medium ${selectedPartnerId === p.id ? "text-emerald-400" : "text-zinc-200"}`}>{p.name}</div>
                            <div className="text-[10px] text-zinc-500 uppercase tracking-widest">{p.city}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {locationType === "OTHER" && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-xs font-semibold text-emerald-500 uppercase tracking-wider ml-1 flex items-center gap-1"><MapPin size={12}/> CEP do Local</label>
                    <input
                      type="text"
                      placeholder="00000-000"
                      value={customCep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                    />
                    {addressData.logradouro && (
                      <div className="text-[10px] text-zinc-500 px-1">{addressData.logradouro}, {addressData.cidade}-{addressData.uf}</div>
                    )}
                  </div>
                )}

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Data do Evento</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}

            {/* ====== PASSO 2: SERVI�OS ====== */}
            {step === 2 && (
              <>
                {(locationType === "PARTNER" && currentPartner?.eventTypes && currentPartner.eventTypes.length > 0) ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo de Evento</label>
                    <div className="flex flex-wrap gap-2">
                      {currentPartner.eventTypes.map((type: string) => (
                        <button
                          key={type}
                          onClick={() => setCategory(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === type ? "bg-emerald-500 text-black border-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Tipo de Evento</label>
                    <div className="flex flex-wrap gap-2">
                      {["CASAMENTO", "CORPORATIVO", "ANIVERS�RIO", "FORMATURA"].map((type) => (
                        <button
                          key={type}
                          onClick={() => setCategory(type)}
                          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${category === type ? "bg-emerald-500 text-black border-emerald-500" : "bg-zinc-900 border-zinc-800 text-zinc-400"}`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Servi�os Oferecidos</label>
                  <div className="flex flex-col gap-2">
                    {availableServices.length === 0 ? (
                      <div className="p-4 text-center text-xs text-zinc-500 bg-zinc-900/30 rounded-lg border border-white/5">Nenhum servi�o dispon�vel para este tipo de evento.</div>
                    ) : (
                      availableServices.map((svc: any) => {
                        const isSelected = selectedServices.includes(svc.id);
                        return (
                          <button
                            key={svc.id}
                            onClick={() => {
                              setSelectedServices((prev: string[]) => 
                                prev.includes(svc.id) ? prev.filter(id => id !== svc.id) : [...prev, svc.id]
                              );
                            }}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-left transition-all ${isSelected ? "bg-emerald-500/10 border-emerald-500/50" : "bg-zinc-900/30 border-white/5"}`}
                          >
                            <div className={`w-6 h-6 rounded flex items-center justify-center shrink-0 border ${isSelected ? "bg-emerald-500 border-emerald-500 text-black" : "bg-zinc-900 border-zinc-700 text-transparent"}`}>
                              <CheckCircle2 size={14} />
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex items-center justify-between">
                                <span className={`text-sm font-medium ${isSelected ? "text-emerald-400" : "text-zinc-200"}`}>{svc.name}</span>
                                {getServicePrice && (
                                  <span className="text-xs font-bold text-zinc-500">
                                    {getServicePrice(svc.id) > 0 ? `+ R$${getServicePrice(svc.id)}` : ""}
                                  </span>
                                )}
                              </div>
                              {svc.description && (
                                <span className="text-[10px] text-zinc-500 mt-0.5 line-clamp-1">{svc.description}</span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </>
            )}

            {/* ====== PASSO 3: DETALHES ====== */}
            {step === 3 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Convidados (Aprox.)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {["Até 50", "50-100", "100-200"].map((opt) => (
                      <button
                        key={opt}
                        onClick={() => setAttendees(opt)}
                        className={`p-2 text-xs font-medium rounded-lg border text-center ${attendees === opt ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400" : "bg-zinc-900/50 border-white/5 text-zinc-400"}`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ====== PASSO 4: SEUS DADOS ====== */}
            {step === 4 && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Nome Completo</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">E-mail</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">WhatsApp</label>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Link de Venda de Ingressos (Opcional)</label>
                  <input
                    type="url"
                    placeholder="https://sympla.com/..."
                    value={ticketUrl || ''}
                    onChange={(e) => setTicketUrl(e.target.value)}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider ml-1">Seu Cupom Promocional (Opcional)</label>
                  <input
                    type="text"
                    placeholder="EX: FOTOSEGUNDO10"
                    value={fotoSegundoPromoCode || ''}
                    onChange={(e) => setFotoSegundoPromoCode(e.target.value.toUpperCase())}
                    className="w-full bg-zinc-900/80 border border-white/20 rounded-lg p-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Sticky Bottom Footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/90 backdrop-blur-md border-t border-white/5 pb-8">
        <div className="flex items-center gap-3">
          {totalPrice > 0 && (
            <div className="flex-1">
              <div className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest">Total Estimado</div>
              <div className="text-lg font-bold text-emerald-400">R$ {totalPrice.toFixed(2)}</div>
            </div>
          )}
          
          <button
            onClick={step < 4 ? nextStep : handleSubmit}
            disabled={submitting || (step === 1 && locationType === "PARTNER" && !selectedPartnerId) || (step === 2 && selectedServices.length === 0)}
            className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-black font-bold py-3.5 px-6 rounded-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <span className="text-sm">Enviando...</span>
            ) : step < 4 ? (
              <>
                <span className="text-sm uppercase tracking-wider">Avan�ar</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <span className="text-sm uppercase tracking-wider">Finalizar</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};


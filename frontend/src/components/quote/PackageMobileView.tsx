// @ts-nocheck
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Calendar, CheckCircle2, Camera, Video, Smartphone, Printer, ChevronLeft, Loader2, User, Mail, Phone, Zap, Star } from "lucide-react";
import { MOCK_PACKAGES } from "../../hooks/usePackageFlow";

const PACKAGE_ICONS: Record<string, React.ReactNode> = {
  pocket: <Camera size={20} />,
  essencial: <Zap size={20} />,
  premium: <Star size={20} />,
};

const PACKAGE_HIGHLIGHTS: Record<string, string[]> = {
  pocket: ["4h de cobertura", "1 fotógrafo", "100 fotos tratadas"],
  essencial: ["6h de cobertura", "Foto + Vídeo", "Aftermovie incluído"],
  premium: ["8h de cobertura", "2 foto + 1 vídeo", "Álbum impresso"],
};

export const PackageMobileView = (props: any) => {
  const {
    step, setStep, nextStep, prevStep,
    customCep, handleCepChange, isCepLoading, addressData,
    eventDate, setEventDate,
    name, setName, email, setEmail, whatsapp, setWhatsapp,
    description, setDescription,
    ticketUrl, setTicketUrl,
    fotoSegundoPromoCode, setFotoSegundoPromoCode,
    submitting, submitError, createdQuoteId, handleSubmit,
    selectedPackageId, setSelectedPackageId, availablePackages,
  } = props;

  const packages = availablePackages || MOCK_PACKAGES;
  const selectedPkg = packages.find((p: any) => p.id === selectedPackageId) || packages[1];

  const STEPS = [
    { n: 1, label: "Pacote & Local" },
    { n: 3, label: "Seus Dados" },
  ];
  const currentStepIndex = step === 1 ? 0 : 1;
  const totalSteps = 2;

  // Success state
  if (createdQuoteId) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center px-6 text-center bg-zinc-950">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6 border border-emerald-500/20">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-2xl font-black uppercase italic text-white tracking-tight mb-2">Orçamento Enviado!</h2>
        <p className="text-sm text-zinc-400 leading-relaxed max-w-xs">
          Recebemos sua solicitação. Nossa equipe entrará em contato via WhatsApp em até <strong className="text-white">2h</strong>.
        </p>
        <button
          onClick={() => window.location.href = "/"}
          className="mt-8 px-8 py-3.5 bg-emerald-500 text-black text-[11px] font-black uppercase tracking-widest rounded-full"
        >
          Voltar ao Início
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex flex-col bg-zinc-950 text-white pb-28">

      {/* ── Header ── */}
      <div className="sticky top-0 z-50 bg-zinc-950/90 backdrop-blur-md border-b border-white/5 px-4 py-3 flex items-center gap-3">
        {step > 1 && (
          <button onClick={prevStep} className="p-1 -ml-1 text-zinc-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="flex-1">
          <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
            Passo {currentStepIndex + 1} de {totalSteps}
          </p>
          <p className="text-sm font-bold text-white/90">{STEPS[currentStepIndex].label}</p>
        </div>
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === currentStepIndex ? "w-5 bg-emerald-500" : i < currentStepIndex ? "w-1.5 bg-emerald-500/40" : "w-1.5 bg-zinc-700"}`}
            />
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 px-4 py-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >

            {/* ======== STEP 1: Pacote + Local + Data ======== */}
            {step === 1 && (
              <>
                {/* Package cards */}
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Escolha seu pacote</p>
                  <div className="grid grid-cols-1 gap-3">
                    {packages.map((pkg: any) => {
                      const isSelected = pkg.id === selectedPackageId;
                      const highlights = PACKAGE_HIGHLIGHTS[pkg.id] || [];
                      return (
                        <button
                          key={pkg.id}
                          onClick={() => setSelectedPackageId(pkg.id)}
                          className={`relative text-left p-4 rounded-2xl border transition-all active:scale-[0.99] ${
                            isSelected
                              ? "bg-emerald-500/10 border-emerald-500/50 shadow-lg shadow-emerald-500/10"
                              : "bg-zinc-900/60 border-zinc-800 hover:border-zinc-600"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${isSelected ? "bg-emerald-500 text-black" : "bg-zinc-800 text-zinc-500"}`}>
                                {PACKAGE_ICONS[pkg.id] || <Camera size={18} />}
                              </div>
                              <div>
                                <p className={`text-sm font-black uppercase italic tracking-tight transition-colors ${isSelected ? "text-emerald-400" : "text-white"}`}>
                                  {pkg.name}
                                </p>
                                <p className="text-[10px] text-zinc-500 font-medium">{pkg.hours}h de cobertura</p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-base font-black italic transition-colors ${isSelected ? "text-emerald-400" : "text-zinc-300"}`}>
                                R$ {pkg.price.toLocaleString("pt-BR")}
                              </p>
                              {isSelected && (
                                <CheckCircle2 size={14} className="text-emerald-500 ml-auto mt-1" />
                              )}
                            </div>
                          </div>

                          {highlights.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1.5">
                              {highlights.map((h: string) => (
                                <span key={h} className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full transition-colors ${isSelected ? "bg-emerald-500/15 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                                  {h}
                                </span>
                              ))}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* CEP */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <MapPin size={11} className="text-emerald-500" /> CEP do Local
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="00000-000"
                      value={customCep}
                      onChange={(e) => handleCepChange(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                    />
                    {isCepLoading && (
                      <Loader2 size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 animate-spin" />
                    )}
                  </div>
                  {addressData?.logradouro && (
                    <p className="text-[10px] text-emerald-400 font-medium px-1">
                      {addressData.logradouro}, {addressData.bairro} — {addressData.cidade}/{addressData.uf}
                    </p>
                  )}
                </div>

                {/* Data */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Calendar size={11} className="text-emerald-500" /> Data do Evento
                  </label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white outline-none transition-colors"
                  />
                </div>
              </>
            )}

            {/* ======== STEP 3: Seus Dados ======== */}
            {step === 3 && (
              <>
                {/* Package summary */}
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500/15 rounded-xl flex items-center justify-center text-emerald-500 flex-shrink-0">
                    {PACKAGE_ICONS[selectedPackageId] || <Camera size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Pacote Selecionado</p>
                    <p className="text-sm font-black text-white uppercase italic">{selectedPkg?.name}</p>
                  </div>
                  <p className="text-base font-black text-emerald-400 italic flex-shrink-0">
                    R$ {selectedPkg?.price.toLocaleString("pt-BR")}
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { label: "Nome Completo", value: name, setter: setName, type: "text", icon: <User size={12} />, placeholder: "Como quer ser chamado" },
                    { label: "E-mail", value: email, setter: setEmail, type: "email", icon: <Mail size={12} />, placeholder: "seu@email.com" },
                    { label: "WhatsApp", value: whatsapp, setter: setWhatsapp, type: "tel", icon: <Phone size={12} />, placeholder: "(11) 99999-9999" },
                  ].map((field) => (
                    <div key={field.label} className="space-y-1.5">
                      <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                        <span className="text-emerald-500">{field.icon}</span> {field.label}
                      </label>
                      <input
                        type={field.type}
                        value={field.value}
                        onChange={(e) => field.setter(e.target.value)}
                        placeholder={field.placeholder}
                        className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                      />
                    </div>
                  ))}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Observações (Opcional)</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Tipo de evento, estilo, detalhes especiais..."
                      rows={3}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Link de Venda de Ingressos (Opcional)</label>
                    <input
                      type="url"
                      placeholder="https://sympla.com/..."
                      value={ticketUrl || ''}
                      onChange={(e) => setTicketUrl(e.target.value)}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Seu Cupom Promocional (Opcional)</label>
                    <input
                      type="text"
                      placeholder="EX: FOTOSEGUNDO10"
                      value={fotoSegundoPromoCode || ''}
                      onChange={(e) => setFotoSegundoPromoCode(e.target.value.toUpperCase())}
                      className="w-full bg-zinc-900/60 border border-zinc-800 focus:border-emerald-500/50 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 outline-none transition-colors"
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-[10px] font-black text-red-400 uppercase tracking-wider">
                    {submitError}
                  </div>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Sticky Bottom CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-950/95 backdrop-blur-xl border-t border-white/5 pb-6">
        <div className="flex items-center gap-3">
          {selectedPkg && step === 1 && (
            <div className="flex-1">
              <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">Pacote {selectedPkg.name}</p>
              <p className="text-lg font-black text-emerald-400 italic leading-none">
                R$ {selectedPkg.price.toLocaleString("pt-BR")}
              </p>
            </div>
          )}

          <button
            onClick={step === 1 ? nextStep : handleSubmit}
            disabled={submitting}
            className={`${step === 1 ? "flex-1" : "w-full"} bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-black font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]`}
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Enviando...</>
            ) : step === 1 ? (
              <>Continuar <ArrowRight size={15} /></>
            ) : (
              <>Solicitar Orçamento <ArrowRight size={15} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

import { useState } from "react";
import { X } from "lucide-react";
import { API } from "../../lib/api";
import type { Partner, ExpressFormData, ProfessionalService } from "./types";

interface ExpressSaleModalProps {
  network: Partner[];
  onClose: () => void;
  onSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

const INITIAL_FORM: ExpressFormData = {
  customerName: "",
  customerEmail: "",
  whatsapp: "",
  amount: 30,
  location: "",
  productType: "FOTOS",
  paymentMethod: "MONEY",
  internalNotes: "",
  editorId: "",
};

export function ExpressSaleModal({ network, onClose, onSuccess, onError }: ExpressSaleModalProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [form, setForm] = useState<ExpressFormData>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [professionalServices, setProfessionalServices] = useState<ProfessionalService[]>([]);
  const [isCustomProduct, setIsCustomProduct] = useState(false);
  const [customProductName, setCustomProductName] = useState("");

  useState(() => {
    API.get("profissional/me").then(r => {
      setProfessionalServices(r.data.proServices || []);
    });
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...form,
        productType: isCustomProduct ? customProductName.toUpperCase() : form.productType,
        method:
          form.productType === "SD_CARD" || form.productType === "ALBUM_IMPRESSO" || isCustomProduct
            ? "MONEY"
            : form.paymentMethod,
        internalNotes: `[${isCustomProduct ? 'CUSTOM' : form.productType}] ${form.internalNotes}`.trim(),
      };
      const { data } = await API.post("marketplace/express-sale", payload);

      if (data.isDigital && data.orderId) {
        onSuccess("Venda registrada! Abrindo portal de pagamento...");
        setTimeout(() => {
          window.location.href = `/checkout/${data.orderId}`;
          onClose();
        }, 1500);
        return;
      }
      onSuccess("Venda e Operação registradas com sucesso!");
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro na venda expressa.";
      onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const stepLabel = { 1: "Identificação", 2: "Configuração", 3: "Logística", 4: "Finalização" };

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4 backdrop-blur-xl bg-black/40 animate-in fade-in duration-300">
      <div className="w-full max-w-lg bg-theme-bg border border-theme-border shadow-[0_0_100px_rgba(0,0,0,0.1)] relative overflow-hidden flex flex-col min-h-[540px]">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-brand-tactical to-transparent" />
        <div className="absolute top-0 right-0 w-24 h-24 bg-brand-tactical/5 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none" />

        {/* Header */}
        <div className="p-5 md:p-8 border-b border-theme-border/60 space-y-3 relative z-10">
          <button onClick={onClose} className="absolute top-5 right-5 text-theme-muted hover:text-brand-tactical transition-all">
            <X size={20} />
          </button>
          <div className="space-y-0.5">
            <div className="text-[8px] md:text-[9px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Unidade de Venda Direta</div>
            <h2 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase italic leading-none">
              {stepLabel[step]}
            </h2>
          </div>
          <div className="flex gap-2 pt-1">
            {([1, 2, 3, 4] as const).map((s) => (
              <div key={s} className="flex-1 space-y-1">
                <div className={`h-[2px] transition-all duration-500 ${step >= s ? "bg-brand-tactical" : "bg-theme-border/20"}`} />
                <div className={`text-[9px] font-black uppercase tracking-widest ${step >= s ? "text-brand-tactical" : "text-theme-muted/20"}`}>
                  Fase 0{s}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="p-5 md:p-8 flex flex-col flex-grow relative z-10 overflow-y-auto max-h-[70vh]">
          {/* PHASE 1: Customer Data */}
          {step === 1 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">E-mail do Cliente *</label>
                  <input
                    type="email"
                    autoFocus
                    placeholder="cliente@exemplo.com"
                    value={form.customerEmail}
                    onChange={(e) => setForm((p) => ({ ...p, customerEmail: e.target.value }))}
                    onBlur={async () => {
                      if (!form.customerEmail || !form.customerEmail.includes("@")) return;
                      try {
                        const { data } = await API.get(`/public/auth/check?email=${form.customerEmail}`);
                        if (data.exists) {
                          setForm((prev) => ({ ...prev, customerName: data.name || prev.customerName, whatsapp: data.whatsapp || prev.whatsapp || "" }));
                        }
                      } catch { /* silent */ }
                    }}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Nome Completo</label>
                  <input
                    type="text"
                    placeholder="Ex: João Silva"
                    value={form.customerName}
                    onChange={(e) => setForm((p) => ({ ...p, customerName: e.target.value }))}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">WhatsApp</label>
                  <input
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={form.whatsapp}
                    onChange={(e) => setForm((p) => ({ ...p, whatsapp: e.target.value }))}
                    className="w-full bg-theme-bg-muted border border-theme-border p-4 text-theme-text outline-none focus:border-brand-tactical/50 transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* PHASE 2: Product & Amount */}
          {step === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Valor Nominal (R$)</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm((p) => ({ ...p, amount: Number(e.target.value) }))}
                      className="w-full bg-theme-bg-muted border border-theme-border p-5 text-brand-tactical font-heading font-black italic text-3xl outline-none"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-[11px] font-black text-theme-muted uppercase tracking-widest">BRL</div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Categoria de Ativo</label>
                  <div className="grid grid-cols-1 gap-2">
                    {/* Lista Dinâmica de Serviços do Profissional */}
                    {professionalServices.filter(s => s.catalogService || s.catalog).map((s) => {
                      const serviceName = s.catalogService?.name || s.catalog?.name || "Serviço Sem Nome";
                      const servicePrice = s.catalogService?.basePrice || s.catalog?.basePrice || 0;
                      
                      return (
                        <button
                          key={s.id}
                          onClick={() => {
                            setIsCustomProduct(false);
                            setForm((prev) => ({ ...prev, productType: serviceName, amount: Number(servicePrice) }));
                          }}
                          className={`p-4 text-left text-[11px] font-black uppercase tracking-widest border transition-all ${
                            !isCustomProduct && form.productType === serviceName
                              ? "bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg"
                              : "bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40"
                          }`}
                        >
                          🏷 {serviceName}
                        </button>
                      );
                    })}

                    {/* Opção de Venda Livre */}
                    <button
                      onClick={() => setIsCustomProduct(true)}
                      className={`p-4 text-left text-[11px] font-black uppercase tracking-widest border transition-all ${
                        isCustomProduct
                          ? "bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg"
                          : "bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40"
                      }`}
                    >
                      ✨ OUTRO / VENDA LIVRE
                    </button>

                    {isCustomProduct && (
                      <div className="space-y-2 mt-2 animate-in fade-in slide-in-from-top-2">
                        <label className="text-[8px] font-black text-brand-tactical uppercase tracking-widest italic ml-1">Descreva o Ativo / Serviço</label>
                        <input 
                          autoFocus
                          placeholder="EX: QUADRO PERSONALIZADO 50X70"
                          value={customProductName}
                          onChange={(e) => setCustomProductName(e.target.value.toUpperCase())}
                          className="w-full bg-theme-bg border-b-2 border-brand-tactical p-3 text-[11px] font-black text-theme-text outline-none uppercase placeholder:text-theme-muted/20"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 3: Delegation & Payment */}
          {step === 3 && (
            <div className="space-y-6 animate-in slide-in-from-right-4">
              <div className="space-y-4">
                {(form.productType === "FOTOS" || form.productType === "REELS") && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Delegar Edição (Split de 40%)</label>
                    <select
                      value={form.editorId}
                      onChange={(e) => setForm((p) => ({ ...p, editorId: e.target.value }))}
                      className="w-full bg-theme-bg-muted border border-brand-tactical/30 p-4 text-theme-text font-black text-[11px] uppercase outline-none focus:border-brand-tactical appearance-none cursor-pointer"
                    >
                      <option value="">EU MESMO (RECEBER 90%)</option>
                      {network.map((p) => (
                        <option key={p.id} value={p.id}>{p.nome.toUpperCase()} (PARCEIRO)</option>
                      ))}
                    </select>
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-theme-muted uppercase tracking-widest italic opacity-60">Metodologia de Liquidação</label>
                  <div className="grid grid-cols-1 gap-2">
                    {([
                      { id: "MONEY", label: "💵 DINHEIRO (ABATER COMISSÃO)" },
                      { id: "PIX", label: "⚡ PIX (RECEBIMENTO INSTANTÂNEO)" },
                      { id: "CARD", label: "💳 CARTÃO (MERCADO PAGO)" },
                    ] as const).map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setForm((p) => ({ ...p, paymentMethod: m.id }))}
                        className={`p-4 text-left text-[11px] font-black uppercase tracking-widest border transition-all ${
                          form.paymentMethod === m.id
                            ? "bg-brand-tactical text-zinc-950 border-brand-tactical shadow-lg"
                            : "bg-theme-bg-muted border-theme-border/60 text-theme-muted hover:border-brand-tactical/40"
                        }`}
                      >
                        {m.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* PHASE 4: Review */}
          {step === 4 && (
            <div className="space-y-6 animate-in zoom-in-95 duration-300">
              <div className="p-6 bg-brand-tactical/5 border border-brand-tactical/20 space-y-4">
                <div className="flex justify-between items-center border-b border-brand-tactical/10 pb-3">
                  <span className="text-[11px] font-black text-brand-tactical uppercase tracking-widest italic">Borderô de Transação</span>
                  <div className="w-2 h-2 rounded-full bg-brand-tactical animate-pulse" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Cliente</span>
                    <span className="text-[11px] font-black text-theme-text uppercase">{form.customerEmail}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-theme-muted uppercase tracking-widest">Produto</span>
                    <span className="text-[11px] font-black text-theme-text uppercase italic">{form.productType}</span>
                  </div>
                  <div className="pt-4 border-t border-brand-tactical/10">
                    <div className="flex justify-between items-end">
                      <span className="text-[11px] font-black text-brand-tactical uppercase italic">Total Líquido</span>
                      <span className="text-3xl font-heading font-black text-brand-tactical italic">
                        R$ {form.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="p-5 md:p-8 border-t border-theme-border/60 bg-theme-bg-muted/30 relative z-20">
          {step === 1 ? (
            <button
              disabled={!form.customerEmail}
              onClick={() => setStep(2)}
              className="w-full py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 disabled:opacity-40 shadow-xl shadow-brand-tactical/20 italic"
            >
              CONTINUAR OPERAÇÃO
            </button>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setStep((step - 1) as 1 | 2 | 3 | 4)}
                className="flex-1 py-4 bg-theme-bg-muted border border-theme-border text-theme-muted text-[11px] font-black uppercase tracking-widest italic"
              >
                Voltar
              </button>
              <button
                onClick={() => (step === 4 ? handleSubmit() : setStep((step + 1) as 1 | 2 | 3 | 4))}
                disabled={loading}
                className="flex-[2] py-4 bg-brand-tactical text-brand-text text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 shadow-xl shadow-brand-tactical/20 italic"
              >
                {loading
                  ? "PROCESSANDO..."
                  : step === 4
                  ? form.paymentMethod === "MONEY"
                    ? "FINALIZAR VENDA"
                    : "GERAR COBRANÇA"
                  : "PRÓXIMA FASE"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

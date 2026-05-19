import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Phone, Activity, X, ArrowRight } from "lucide-react";
import { API } from "../../lib/api";
import { QRCodeSVG } from "qrcode.react";

interface Coupon {
  id: string;
  code: string;
  discountPct?: number | null;
  discountAbs?: number | null;
  isFreeShipping?: boolean;
  usedCount: number;
  maxUses?: number | null;
  active: boolean;
  expiresAt?: string | null;
}

export function AdminGrowth() {
  const [activeTab, setActiveTab] = useState<"COUPONS" | "WHATSAPP">("COUPONS");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [waStatus, setWaStatus] = useState<{connected?: boolean, qrCode?: string} | null>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const [form, setForm] = useState({
    code: "",
    discountType: "PCT" as "PCT" | "ABS" | "FREE_SHIPPING",
    discountValue: "",
    maxUses: "",
    expiresAt: "",
  });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "COUPONS") {
        const { data } = await API.get("/admin/coupons");
        setCoupons(data.coupons || []);
      } else if (activeTab === "WHATSAPP") {
        const { data } = await API.get("/admin/whatsapp/status");
        setWaStatus(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openModal = () => {
    setForm({ code: "", discountType: "PCT", discountValue: "", maxUses: "", expiresAt: "" });
    setFormError("");
    setIsModalOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.code.trim()) { setFormError("Informe o código do cupom."); return; }
    if (form.discountType !== "FREE_SHIPPING" && (!form.discountValue || Number(form.discountValue) <= 0)) {
      setFormError("Informe um valor de desconto válido.");
      return;
    }

    setCreating(true);
    try {
      await API.post("/admin/coupons", {
        code: form.code.trim(),
        discountPct:  form.discountType === "PCT" ? Number(form.discountValue) : undefined,
        discountAbs:  form.discountType === "ABS" ? Number(form.discountValue) : undefined,
        isFreeShipping: form.discountType === "FREE_SHIPPING",
        maxUses:      form.maxUses ? Number(form.maxUses) : undefined,
        expiresAt:    form.expiresAt || undefined,
      });
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setFormError(err?.response?.data?.error || "Erro ao criar cupom.");
    } finally {
      setCreating(false);
    }
  };

    const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await API.patch(`/admin/coupons/${id}`, { active });
      fetchData();
    } catch (err) {
      console.error("Erro ao alterar status do cupom:", err);
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este cupom?")) return;
    try {
      await API.delete(`/admin/coupons/${id}`);
      fetchData();
    } catch (err) {
      console.error("Erro ao excluir cupom:", err);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative border-b border-theme-border/60 pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/5 blur-3xl rounded-full" />
        <div className="space-y-4 relative z-10">
          <h1 className="text-2xl sm:text-4xl md:text-5xl xl:text-6xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none truncate whitespace-nowrap">
            Motor de <span className="text-brand-tactical">Growth</span>
          </h1>
          <div className="flex items-center gap-4">
            <div className="h-1 w-12 bg-brand-tactical" />
            <p className="text-[9px] sm:text-[11px] font-black text-brand-tactical uppercase tracking-[0.2em] sm:tracking-[0.4em] italic truncate max-w-[80vw]">Expansão e Inteligência de Mercado</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-theme-border/40 overflow-x-auto hide-scrollbar">
        {[
          { id: "COUPONS", icon: Tag, label: "Cupons Genéricos" },
          { id: "WHATSAPP", icon: Phone, label: "Motor WhatsApp" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "COUPONS" | "WHATSAPP")}
            className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
              activeTab === tab.id ? "border-brand-tactical text-brand-tactical" : "border-transparent text-theme-text-muted hover:text-theme-text"
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="pt-4">
        {loading ? (
          <div className="p-12 flex justify-center"><div className="animate-spin text-brand-tactical"><Activity size={24} /></div></div>
        ) : activeTab === "COUPONS" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                id="btn-novo-cupom"
                onClick={openModal}
                className="flex items-center gap-2 px-4 py-2 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-colors"
              >
                <Plus size={14} /> Novo Cupom
              </button>
            </div>
            {coupons.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-theme-border rounded-xl">
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Nenhum cupom ativo</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="p-6 bg-theme-bg-muted border border-theme-border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm group hover:border-brand-tactical/30 transition-all">
                    <div>
                      <h4 className="text-xl font-black italic text-brand-tactical uppercase tracking-widest">{c.code}</h4>
                      <p className="text-[10px] font-bold text-theme-text-muted mt-1">
                        {c.isFreeShipping ? "FRETE GRÁTIS" : c.discountPct ? `${c.discountPct}% OFF` : `R$ ${Number(c.discountAbs).toFixed(2)} OFF`}
                        {" • "}{c.usedCount} usos
                        {c.maxUses ? ` / ${c.maxUses} máx` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <span className={`px-2 py-1 text-[8px] font-black uppercase rounded ${c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {c.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.id, !c.active)}
                          className={`px-3 py-1.5 text-[8px] font-black uppercase tracking-widest rounded border transition-colors cursor-pointer ${
                            c.active
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                        >
                          {c.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 text-[8px] font-black uppercase tracking-widest rounded transition-colors cursor-pointer"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 border border-theme-border bg-theme-bg-muted/50 rounded-3xl flex flex-col md:flex-row gap-8 items-center justify-center min-h-[400px]">
            {waStatus?.connected ? (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <Phone size={40} className="text-emerald-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-black italic text-theme-text uppercase">WhatsApp Conectado</h3>
                  <p className="text-[10px] font-black text-emerald-500 tracking-widest uppercase mt-2">Motor de notificações ativo</p>
                </div>
              </div>
            ) : waStatus?.qrCode ? (
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-black italic text-theme-text uppercase">Conectar Aparelho</h3>
                  <p className="text-[10px] font-black text-theme-text-muted tracking-widest uppercase mt-2">Leia o QR Code com seu WhatsApp</p>
                </div>
                <div className="p-4 bg-white inline-block rounded-2xl mx-auto shadow-2xl">
                  {waStatus.qrCode.startsWith("data:") || waStatus.qrCode.startsWith("http") ? (
                    <img src={waStatus.qrCode} alt="WhatsApp QR Code" className="w-[256px] h-[256px] object-contain" />
                  ) : (
                    <QRCodeSVG value={waStatus.qrCode} size={256} />
                  )}
                </div>
                <button onClick={fetchData} className="text-[10px] font-black uppercase text-brand-tactical hover:underline">Atualizar QR Code</button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-[10px] font-black text-theme-text-muted uppercase tracking-widest">Motor de WhatsApp Offline</p>
                <button onClick={fetchData} className="px-6 py-3 bg-brand-tactical text-brand-text text-[10px] font-black uppercase tracking-widest">Tentar Iniciar Sessão</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border/60 rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-8 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-tactical/10 rounded-xl flex items-center justify-center border border-brand-tactical/20">
                  <Tag className="text-brand-tactical" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-black uppercase italic tracking-tighter text-theme-text">Novo Cupom</h2>
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Criar cupom de desconto</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-all text-theme-muted">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-8 space-y-6">
              {/* Código */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Código do Cupom</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: VERAO10"
                  className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-black uppercase outline-none focus:border-brand-tactical rounded-xl tracking-widest"
                />
              </div>

              {/* Tipo de Desconto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Tipo</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value as "PCT" | "ABS" | "FREE_SHIPPING" })}
                    className="w-full bg-theme-bg border border-theme-border p-4 text-[10px] text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl cursor-pointer"
                  >
                    <option value="PCT">Percentual (%)</option>
                    <option value="ABS">Valor fixo (R$)</option>
                    <option value="FREE_SHIPPING">Frete Grátis</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">
                    {form.discountType === "FREE_SHIPPING" ? "Desconto" : form.discountType === "PCT" ? "Desconto (%)" : "Desconto (R$)"}
                  </label>
                  <input
                    type="number"
                    required={form.discountType !== "FREE_SHIPPING"}
                    disabled={form.discountType === "FREE_SHIPPING"}
                    min="0.01"
                    step="0.01"
                    value={form.discountType === "FREE_SHIPPING" ? "" : form.discountValue}
                    onChange={e => setForm({ ...form, discountValue: e.target.value })}
                    placeholder={form.discountType === "FREE_SHIPPING" ? "Grátis" : form.discountType === "PCT" ? "10" : "15.00"}
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-brand-tactical font-black outline-none focus:border-brand-tactical rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Usos máximos e validade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Máx. Usos (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[8px] font-black text-theme-muted uppercase tracking-widest block opacity-60">Validade (opcional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-black outline-none focus:border-brand-tactical rounded-xl"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">{formError}</p>
              )}

              {/* Footer */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-theme-border text-[10px] font-black uppercase tracking-widest text-theme-muted hover:text-white transition-all rounded-[16px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-[2] py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[16px] flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {creating ? "Criando..." : "Criar Cupom"}
                  {!creating && <ArrowRight size={16} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

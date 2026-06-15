import { useState, useEffect, useCallback } from "react";
import { Plus, Tag, Phone, X, ArrowRight, BarChart3, Users } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { API } from "../../lib/api";
import { toast } from "sonner";
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

interface Affiliate {
  id: string;
  nome: string;
  email: string;
  affiliatePayoutType: string;
}

interface AnalyticsData {
  marketplace: {
    funnel: { profileViews: number; eventViews: number; leads: number; orders: number; };
    topProfessionals: Array<{ id: string; nome: string; views: number; bookings: number; conversionRate: number; }>;
  };
  coupons: Array<{
    id: string; code: string; discountPct: number | null; discountAbs: number | null;
    usedCount: number; actualPaidUses: number; totalRevenueGenerated: number; active: boolean;
  }>;
}

export function AdminGrowth() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get("tab") as "COUPONS" | "WHATSAPP" | "ANALYTICS" | "AFFILIATES") || "COUPONS";
  const setActiveTab = (tab: "COUPONS" | "WHATSAPP" | "ANALYTICS" | "AFFILIATES") => setSearchParams(prev => { prev.set("tab", tab); return prev; }, { replace: true });
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [affiliates, setAffiliates] = useState<Affiliate[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
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
      } else if (activeTab === "AFFILIATES") {
        const { data } = await API.get("/admin/ambassadors");
        setAffiliates(data.ambassadors || []);
      } else if (activeTab === "WHATSAPP") {
        const { data } = await API.get("/admin/whatsapp/status");
        setWaStatus(data);
      } else if (activeTab === "ANALYTICS") {
        const { data: marketplace } = await API.get("/analytics/admin/marketplace");
        const { data: couponsData } = await API.get("/analytics/marketing/coupons");
        setAnalyticsData({ marketplace, coupons: couponsData });
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
      toast.success("Cupom criado com sucesso! 🏷️");
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setFormError(error?.response?.data?.error || "Erro ao criar cupom.");
    } finally {
      setCreating(false);
    }
  };

    const handleToggleActive = async (id: string, active: boolean) => {
    try {
      await API.patch(`/admin/coupons/${id}`, { active });
      fetchData();
      toast.success("Status do cupom atualizado!");
    } catch (err) {
      console.error("Erro ao alterar status do cupom:", err);
      toast.error("Erro ao alterar status do cupom.");
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir permanentemente este cupom?")) return;
    try {
      await API.delete(`/admin/coupons/${id}`);
      fetchData();
      toast.success("Cupom excluído com sucesso!");
    } catch (err) {
      console.error("Erro ao excluir cupom:", err);
      toast.error("Erro ao excluir cupom.");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="relative border-b border-theme-border pb-8 md:pb-12 space-y-4 md:space-y-6">
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-brand-tactical/10 blur-3xl rounded-full" />
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-3 md:gap-6 relative z-10">
          <div>
            <h2 className="text-2xl font-bold uppercase text-theme-text font-heading">Growth</h2>
            <p className="text-[10px] font-bold uppercase tracking-[0.5em] text-theme-muted mt-2">Expansão e Inteligência de Mercado</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="grid grid-cols-2 md:flex border-b border-theme-border gap-1">
        {[
          { id: "COUPONS", icon: Tag, label: "Cupons Genéricos" },
          { id: "AFFILIATES", icon: Users, label: "Afiliados" },
          { id: "WHATSAPP", icon: Phone, label: "Motor WhatsApp" },
          { id: "ANALYTICS", icon: BarChart3, label: "Relatórios & Analytics" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as "COUPONS" | "WHATSAPP" | "ANALYTICS" | "AFFILIATES")}
            className={`flex items-center gap-2 px-3 md:px-6 py-4 text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${
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
          <div className="py-24 text-center border border-theme-border bg-theme-bg animate-pulse text-[10px] text-theme-muted uppercase tracking-[0.5em] font-bold rounded-2xl">Sincronizando Dados de Crescimento...</div>
        ) : activeTab === "COUPONS" ? (
          <div className="space-y-4">
            <div className="flex justify-end">
              <button
                id="btn-novo-cupom"
                onClick={openModal}
                className="flex items-center gap-2 px-4 py-2 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest hover:bg-white transition-colors"
              >
                <Plus size={14} /> Novo Cupom
              </button>
            </div>
            {coupons.length === 0 ? (
              <div className="p-3 md:p-6 md:p-12 text-center border border-theme-border rounded-xl">
                <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">Nenhum cupom ativo</p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {coupons.map(c => (
                  <div key={c.id} className="p-3 md:p-6 bg-theme-bg-muted border border-theme-border rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm group hover:border-brand-tactical/30 transition-all">
                    <div>
                      <h4 className="text-xl font-bold text-brand-tactical uppercase tracking-widest">{c.code}</h4>
                      <p className="text-[10px] font-bold text-theme-text-muted mt-1">
                        {c.isFreeShipping ? "FRETE GRÁTIS" : c.discountPct ? `${c.discountPct}% OFF` : `R$ ${Number(c.discountAbs).toFixed(2)} OFF`}
                        {" • "}{c.usedCount} usos
                        {c.maxUses ? ` / ${c.maxUses} máx` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                      <span className={`px-2 py-1 text-[10px] font-black uppercase rounded ${c.active ? 'bg-brand-tactical/20 text-theme-brand' : 'bg-brand-danger/20 text-brand-danger'}`}>
                        {c.active ? 'Ativo' : 'Inativo'}
                      </span>
                      <div className="flex gap-2 opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c.id, !c.active)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded border transition-colors cursor-pointer ${
                            c.active
                              ? 'bg-brand-warning/10 border-brand-warning/30 text-brand-warning hover:bg-brand-warning/20'
                              : 'bg-brand-tactical/10 border-brand-tactical/30 text-theme-brand hover:bg-brand-tactical/20'
                          }`}
                        >
                          {c.active ? 'Pausar' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="px-3 py-1.5 bg-brand-danger/10 border border-brand-danger/30 text-brand-danger hover:bg-brand-danger/20 text-[10px] font-bold uppercase tracking-widest rounded transition-colors cursor-pointer"
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
        ) : activeTab === "WHATSAPP" ? (
          <div className="p-4 md:p-8 border border-theme-border bg-theme-bg-muted rounded-3xl flex flex-col md:flex-row gap-4 md:gap-8 items-center justify-center min-h-[400px]">
            {waStatus?.connected ? (
              <div className="text-center space-y-6">
                <div className="w-24 h-24 bg-brand-tactical/10 rounded-full flex items-center justify-center mx-auto">
                  <Phone size={40} className="text-theme-brand" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-theme-text uppercase">WhatsApp Conectado</h3>
                  <p className="text-[10px] font-bold text-theme-brand tracking-widest uppercase mt-2">Motor de notificações ativo</p>
                </div>
              </div>
            ) : waStatus?.qrCode ? (
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-theme-text uppercase">Conectar Aparelho</h3>
                  <p className="text-[10px] font-bold text-theme-text-muted tracking-widest uppercase mt-2">Leia o QR Code com seu WhatsApp</p>
                </div>
                <div className="p-4 bg-white inline-block rounded-2xl mx-auto shadow-2xl">
                  {waStatus.qrCode.startsWith("data:") || waStatus.qrCode.startsWith("http") ? (
                    <img src={waStatus.qrCode} alt="WhatsApp QR Code" className="w-[256px] h-[256px] object-contain" />
                  ) : (
                    <QRCodeSVG value={waStatus.qrCode} size={256} />
                  )}
                </div>
                <button onClick={fetchData} className="text-[10px] font-bold uppercase text-brand-tactical hover:underline">Atualizar QR Code</button>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">Motor de WhatsApp Offline</p>
                <button onClick={() => {
                  fetchData();
                  if (!waStatus?.connected && !waStatus?.qrCode) {
                    toast.info("Certifique-se de que o wa-worker está rodando separadamente (npm run dev no diretório wa-worker).");
                  }
                }} className="px-3 md:px-6 py-3 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest">Tentar Iniciar Sessão</button>
              </div>
            )}
          </div>
        ) : activeTab === "AFFILIATES" ? (
          <div className="space-y-4">
            {affiliates.length === 0 ? (
              <div className="p-3 md:p-6 md:p-12 text-center border border-theme-border rounded-xl">
                <p className="text-[10px] font-bold text-theme-text-muted uppercase tracking-widest">Nenhum afiliado encontrado</p>
              </div>
            ) : (
              <div className="bg-theme-bg-muted border border-theme-border rounded-2xl overflow-hidden">
                <table className="w-full text-left text-sm text-theme-text">
                  <thead className="bg-theme-bg/50 text-[10px] uppercase font-bold text-theme-text-muted tracking-widest">
                    <tr>
                      <th className="px-6 py-4">Nome / E-mail</th>
                      <th className="px-6 py-4">Tipo de Pagamento</th>
                      <th className="px-6 py-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {affiliates.map((aff: Affiliate) => (
                      <tr key={aff.id} className="border-t border-theme-border/50">
                        <td className="px-6 py-4">
                          <p className="font-bold text-brand-tactical">{aff.nome}</p>
                          <p className="text-[10px] text-theme-text-muted">{aff.email}</p>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={aff.affiliatePayoutType} 
                            onChange={async (e) => {
                              try {
                                await API.patch(`/admin/users/${aff.id}`, { affiliatePayoutType: e.target.value });
                                toast.success("Tipo de pagamento atualizado.");
                                fetchData();
                              } catch {
                                toast.error("Erro ao atualizar tipo de pagamento.");
                              }
                            }}
                            className="bg-theme-bg border border-theme-border p-2 text-xs rounded outline-none"
                          >
                            <option value="CREDIT">Crédito na Plataforma</option>
                            <option value="PIX">Transferência PIX</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <button className="px-3 py-1.5 bg-theme-bg border border-theme-border text-xs font-bold uppercase tracking-widest rounded transition-colors hover:border-brand-tactical/50">
                            Ver Detalhes
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {/* Marketplace Funnel */}
            {analyticsData?.marketplace && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Profile Views", value: analyticsData.marketplace.funnel.profileViews },
                  { label: "Event Views", value: analyticsData.marketplace.funnel.eventViews },
                  { label: "Total Leads", value: analyticsData.marketplace.funnel.leads },
                  { label: "Total Orders", value: analyticsData.marketplace.funnel.orders },
                ].map((stat, i) => (
                  <div key={i} className="p-3 md:p-6 bg-theme-bg-muted border border-theme-border rounded-2xl">
                    <p className="text-[10px] font-bold uppercase text-theme-text-muted tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-bold text-brand-tactical mt-2">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Top Professionals */}
            {analyticsData?.marketplace?.topProfessionals && (
              <div className="bg-theme-bg-muted border border-theme-border rounded-2xl p-3 md:p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-theme-text mb-4">Top Profissionais (Conversão)</h3>
                <div className="space-y-4">
                  {analyticsData.marketplace.topProfessionals.map((pro, idx: number) => (
                    <div key={pro.id} className="flex justify-between items-center text-sm">
                      <span className="font-bold">{idx + 1}. {pro.nome}</span>
                      <span className="text-theme-text-muted">{pro.conversionRate}% ({pro.bookings} reservas / {pro.views} views)</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Coupons Efficiency */}
            {analyticsData?.coupons && (
              <div className="bg-theme-bg-muted border border-theme-border rounded-2xl p-3 md:p-6">
                <h3 className="text-sm font-bold uppercase tracking-widest text-theme-text mb-4">Eficiência de Cupons</h3>
                <div className="space-y-4">
                  {analyticsData.coupons.map((c) => (
                    <div key={c.id} className="flex justify-between items-center text-sm border-b border-theme-border/50 pb-2">
                      <div>
                        <span className="font-bold text-brand-tactical">{c.code}</span>
                        <span className="text-xs text-theme-text-muted ml-2">({c.usedCount} usos)</span>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">Receita Gerada: R$ {Number(c.totalRevenueGenerated).toFixed(2)}</p>
                        <p className="text-[10px] text-theme-text-muted">Pedidos Pagos: {c.actualPaidUses}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Novo Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-theme-bg/80 backdrop-blur-xl" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-md bg-theme-card border border-theme-border rounded-[32px] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="p-4 md:p-8 border-b border-theme-border flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-brand-tactical/10 rounded-xl flex items-center justify-center border border-brand-tactical/20">
                  <Tag className="text-brand-tactical" size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-bold uppercase text-theme-text">Novo Cupom</h2>
                  <p className="text-[10px] md:text-[9px] font-bold uppercase tracking-wider md:tracking-widest opacity-40">Criar cupom de desconto</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-theme-bg-muted rounded-full transition-all text-theme-muted">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="p-4 md:p-8 space-y-6">
              {/* Código */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Código do Cupom</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="Ex: VERAO10"
                  className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-bold uppercase outline-none focus:border-brand-tactical rounded-xl tracking-widest"
                />
              </div>

              {/* Tipo de Desconto */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Tipo</label>
                  <select
                    value={form.discountType}
                    onChange={e => setForm({ ...form, discountType: e.target.value as "PCT" | "ABS" | "FREE_SHIPPING" })}
                    className="w-full bg-theme-bg border border-theme-border p-4 text-[10px] text-theme-text font-bold outline-none focus:border-brand-tactical rounded-xl cursor-pointer"
                  >
                    <option value="PCT">Percentual (%)</option>
                    <option value="ABS">Valor fixo (R$)</option>
                    <option value="FREE_SHIPPING">Frete Grátis</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">
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
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-brand-tactical font-bold outline-none focus:border-brand-tactical rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Usos máximos e validade */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Máx. Usos (opcional)</label>
                  <input
                    type="number"
                    min="1"
                    value={form.maxUses}
                    onChange={e => setForm({ ...form, maxUses: e.target.value })}
                    placeholder="Ilimitado"
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-bold outline-none focus:border-brand-tactical rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-theme-muted uppercase tracking-widest block opacity-60">Validade (opcional)</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={e => setForm({ ...form, expiresAt: e.target.value })}
                    className="w-full bg-theme-bg border border-theme-border p-4 text-sm text-theme-text font-bold outline-none focus:border-brand-tactical rounded-xl"
                  />
                </div>
              </div>

              {formError && (
                <p className="text-[10px] text-brand-danger font-bold uppercase tracking-widest">{formError}</p>
              )}

              {/* Footer */}
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-4 border border-theme-border text-[10px] font-bold uppercase tracking-widest text-theme-muted hover:text-theme-text transition-all rounded-[16px]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-[2] py-4 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest shadow-2xl shadow-brand-tactical/20 hover:brightness-110 transition-all rounded-[16px] flex items-center justify-center gap-3 disabled:opacity-50"
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

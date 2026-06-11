import React, { useState } from "react";
import { API } from "../../lib/api";
import { T } from "../../lib/theme";
import { Check, X, Camera, Laptop, HelpCircle, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function CustomServiceForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    pricingType: "HOURLY",
    isRemote: false,
    requiredEquipment: "",
    deliveryDays: "",
    minQuantity: "",
    networkJustification: "",
    estimatedMinutes: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await API.post("/profissional/services", {
        ...formData,
        price: Number(formData.price),
        deliveryDays: formData.deliveryDays ? Number(formData.deliveryDays) : undefined,
        minQuantity: formData.minQuantity ? Number(formData.minQuantity) : undefined,
        estimatedMinutes: formData.estimatedMinutes ? Number(formData.estimatedMinutes) : undefined,
      });
      setSuccess(true);
      setFormData({
        name: "",
        description: "",
        category: "",
        price: "",
        pricingType: "HOURLY",
        isRemote: false,
        requiredEquipment: "",
        deliveryDays: "",
        minQuantity: "",
        networkJustification: "",
        estimatedMinutes: ""
      });
    } catch (err: unknown) {
      const apiError = err as { response?: { data?: { error?: string } } };
      setError(apiError.response?.data?.error || "Erro ao enviar serviço para aprovação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ background: T.bg }}>
      <header className="pt-20 pb-10 border-b border-white/5 relative overflow-hidden">
        <button 
          onClick={() => navigate(-1)} 
          className="absolute top-6 left-6 z-50 flex items-center gap-2 px-5 py-2.5 bg-theme-bg/60 backdrop-blur-md border border-theme-border rounded-full text-theme-text hover:bg-brand-tactical hover:text-black transition-all shadow-xl"
        >
          <ChevronLeft size={16} />
          <span className="text-[10px] font-black uppercase tracking-widest">Voltar</span>
        </button>
        <div className="absolute inset-0 bg-brand-tactical/10 blur-3xl rounded-full -m-64 opacity-30" />
        <div className="max-w-[1000px] mx-auto px-4 md:px-6 relative z-10">
          <div className="w-12 h-1 bg-brand-tactical mb-6" />
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-theme-text uppercase tracking-tighter whitespace-normal italic pr-6">
            Novo Serviço
          </h1>
          <p className="text-[10px] text-theme-muted uppercase tracking-[0.4em] mt-4 font-black">
            Crie seus pacotes e precificação
          </p>
        </div>
      </header>

      <main className="max-w-[1000px] mx-auto px-4 md:px-6 py-12">
        {success && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-green-500/10 border border-green-500/20 text-green-400 flex items-center gap-4">
            <Check size={24} />
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">Serviço Enviado!</h3>
              <p className="text-xs opacity-80 mt-1">Seu serviço foi enviado e está em análise pela Rede.</p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 p-6 bg-red-500/10 border border-red-500/20 text-red-400 flex items-center gap-4">
            <X size={24} />
            <div>
              <h3 className="font-black uppercase tracking-widest text-sm">Erro ao enviar</h3>
              <p className="text-xs opacity-80 mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8 md:space-y-10 bg-theme-card border border-theme-border p-4 md:p-8 lg:p-12">
          
          {/* IDENTIFICAÇÃO */}
          <section className="space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">1. Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Nome do Serviço *</label>
                <input required type="text" placeholder="Ex: Cobertura de Casamento, Edição de Reels..."
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Categoria</label>
                <input type="text" placeholder="Ex: Casamento, Corporativo, Pós-produção..."
                  value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Descrição / O que está incluso *</label>
              <textarea required placeholder="Detalhe o que será entregue, quantas horas, formato final, etc."
                value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 text-xs text-white h-24 outline-none focus:border-brand-tactical transition-colors"
              />
            </div>
          </section>

          {/* FORMATO DO TRABALHO */}
          <section className="space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">2. Formato de Trabalho</h2>
            <div className="flex flex-wrap gap-4 mb-4">
            <label className={`cursor-pointer flex-1 border p-3 flex flex-col items-center justify-center gap-2 transition-colors ${!formData.isRemote ? 'bg-brand-tactical/10 border-brand-tactical text-brand-tactical' : 'bg-black border-white/10 text-theme-muted hover:border-white/30'}`}>
              <input type="radio" name="isRemote" className="hidden" checked={!formData.isRemote} onChange={() => setFormData({...formData, isRemote: false})} />
              <Camera size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center">Presencial (Em Campo)</span>
            </label>
            <label className={`cursor-pointer flex-1 border p-3 flex flex-col items-center justify-center gap-2 transition-colors ${formData.isRemote ? 'bg-brand-tactical/10 border-brand-tactical text-brand-tactical' : 'bg-black border-white/10 text-theme-muted hover:border-white/30'}`}>
              <input type="radio" name="isRemote" className="hidden" checked={formData.isRemote} onChange={() => setFormData({...formData, isRemote: true})} />
              <Laptop size={20} />
              <span className="text-[10px] font-black uppercase tracking-widest text-center">Remoto (Edição/Design)</span>
            </label>
            </div>
            <div>
              <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">
                {formData.isRemote ? 'Softwares Utilizados' : 'Equipamentos Necessários'}
              </label>
              <input type="text" placeholder={formData.isRemote ? "Ex: Premiere, Lightroom, Mac M1" : "Ex: Sony A7III, Lente 50mm, Flash, Drone"}
                value={formData.requiredEquipment} onChange={e => setFormData({...formData, requiredEquipment: e.target.value})}
                className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
              />
            </div>
          </section>

          {/* PRECIFICAÇÃO */}
          <section className="space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">3. Precificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Formato de Cobrança</label>
                <select 
                  value={formData.pricingType} onChange={e => setFormData({...formData, pricingType: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical appearance-none"
                >
                  <option value="HOURLY">Por Hora (Valor/Hora)</option>
                  <option value="FIXED">Pacote Fixo (Valor Fechado)</option>
                  <option value="PER_UNIT">Por Unidade (Por foto / Por minuto)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Preço (R$) *</label>
                <input required type="number" step="0.01" min="0" placeholder="0.00"
                  value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Mínimo de Contratação</label>
                <input type="number" min="0" placeholder={formData.pricingType === "HOURLY" ? "Horas mínimas" : formData.pricingType === "PER_UNIT" ? "Quantidade mínima" : "N/A"}
                  value={formData.minQuantity} onChange={e => setFormData({...formData, minQuantity: e.target.value})}
                  disabled={formData.pricingType === "FIXED"}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Prazo de Entrega (Dias)</label>
                <input type="number" min="0" placeholder="Dias úteis para entrega"
                  value={formData.deliveryDays} onChange={e => setFormData({...formData, deliveryDays: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
                />
              </div>
              <div>
                <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Duração Estimada (Minutos)</label>
                <input type="number" min="0" placeholder="Ex: 60, 120..."
                  value={formData.estimatedMinutes} onChange={e => setFormData({...formData, estimatedMinutes: e.target.value})}
                  className="w-full bg-black border border-white/10 p-3 text-xs text-white outline-none focus:border-brand-tactical transition-colors"
                />
              </div>
            </div>
          </section>

          {/* INFORMAÇÕES INTERNAS */}
          <section className="space-y-6">
            <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/5 pb-2">4. Revisão</h2>
            <div className="bg-theme-bg p-4 border border-white/5 flex gap-4">
              <HelpCircle className="text-brand-tactical shrink-0" size={20} />
              <div>
                <p className="text-xs text-theme-muted leading-relaxed">
                  Todos os serviços customizados passam por uma auditoria rápida da Rede FotoSegundo para garantir alinhamento de qualidade e preços com a tabela de franquias.
                </p>
                <div className="mt-4">
                  <label className="block text-[10px] text-theme-muted uppercase tracking-widest font-black mb-2">Justificativa / Link de Portfólio (Opcional)</label>
                  <textarea placeholder="Deixe um recado para a curadoria, caso necessário."
                    value={formData.networkJustification} onChange={e => setFormData({...formData, networkJustification: e.target.value})}
                    className="w-full bg-black border border-white/10 p-3 text-xs text-white h-20 outline-none focus:border-brand-tactical transition-colors"
                  />
                </div>
              </div>
            </div>
          </section>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-2.5 md:py-4 bg-brand-tactical text-[var(--brand-text)] text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50 rounded-xl"
          >
            {loading ? "Enviando..." : "Enviar Serviço para Aprovação"}
          </button>
        </form>
      </main>
    </div>
  );
}

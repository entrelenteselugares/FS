import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { API } from "../lib/api";
import { useTheme } from "../contexts/ThemeContextCore";
import { motion } from "framer-motion";
import { MapPin, Phone, MessageSquare, Calendar, Star, ArrowLeft, Clock, CheckCircle2, XCircle } from "lucide-react";
import { ThemeToggle } from "../components/ThemeToggle";

interface DayConfig {
  open: string;
  close: string;
  closed: boolean;
}

interface PartnerData {
  razaoSocial: string;
  address: string | null;
  phone: string | null;
  description: string | null;
  coverUrl: string | null;
  slug: string;
  servicePrices?: Record<string, number> | null;
  disabledServices?: string[];
  workingHours?: Record<string, DayConfig> | null;
  fixedDuration?: number | null;
}

interface RecentEvent {
  id: string;
  nomeNoivos: string;
  slug: string;
  dataEvento: string;
  coverPhotoUrl: string;
}

const DAY_NAMES: Record<string, string> = {
  mon: "Segunda", tue: "Terça", wed: "Quarta",
  thu: "Quinta", fri: "Sexta", sat: "Sábado", sun: "Domingo"
};

const DAY_ORDER = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

function formatCurrency(v: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);
}

export const PartnerLP: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [data, setData] = useState<{ partner: PartnerData; recentEvents: RecentEvent[] } | null>(null);
  const [catalog, setCatalog] = useState<{ id: string; name: string; description: string; basePrice: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      API.get(`/public/unidade-fixa/${slug}`),
      API.get("/public/configs/services"),
    ])
      .then(([partnerRes, catalogRes]) => {
        setData(partnerRes.data);
        setCatalog(catalogRes.data?.services || []);
      })
      .catch(() => navigate("/"))
      .finally(() => setLoading(false));
  }, [slug, navigate]);

  if (loading || !data) return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center text-[10px] text-theme-muted uppercase tracking-[0.5em] font-black animate-pulse">
      Sincronizando Localização...
    </div>
  );

  const { partner, recentEvents } = data;

  // Build active services: global catalog filtered by unit's disabledServices
  const disabled = partner.disabledServices || [];
  const activeServices = catalog.filter(svc => !disabled.includes(svc.id));

  // Working hours sorted
  const workingHours = partner.workingHours;
  const hasSchedule = workingHours && Object.keys(workingHours).length > 0;

  return (
    <div className="min-h-screen bg-theme-bg text-theme-text transition-colors duration-500 overflow-x-hidden">
      <style>{`
        @media (max-width: 768px) {
          .mobile-hero-title { font-size: clamp(32px, 12vw, 48px) !important; line-height: 1 !important; }
          .mobile-py { padding-top: 4rem !important; padding-bottom: 4rem !important; }
          .mobile-px { padding-left: 1.5rem !important; padding-right: 1.5rem !important; }
          .mobile-gap { gap: 40px !important; }
          .mobile-full-width { width: 100% !important; }
          .mobile-center { text-align: center !important; flex-direction: column !important; }
        }
      `}</style>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 w-full z-50 p-6 flex justify-between items-center pointer-events-none">
        <button
          onClick={() => navigate("/")}
          className="pointer-events-auto flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.3em] text-theme-muted hover:text-theme-text transition-all bg-theme-bg-muted/80 backdrop-blur-xl px-6 py-3 border border-theme-border"
        >
          <ArrowLeft size={14} /> Vitrine
        </button>

        <div className="pointer-events-auto flex items-center gap-6">
          <ThemeToggle />
          <img
            src="/logo-fs.png"
            alt="Logo"
            style={{ height: 28, objectFit: "contain", filter: theme === 'light' ? 'invert(1)' : 'none' }}
          />
        </div>
      </nav>

      {/* Hero / Cover */}
      <section className="relative h-[85vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0">
          <img
            src={partner.coverUrl || "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600"}
            className="w-full h-full object-cover opacity-60 grayscale scale-110"
            alt=""
          />
          <div className="absolute inset-0 bg-gradient-to-t from-theme-bg via-theme-bg/20 to-transparent" />
        </div>

        <div className="relative z-10 text-center px-6 max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
            <div className="text-proportional text-brand-tactical mb-6">Unidade Fixa Autorizada</div>
            <h1 className="heading-luxury mb-10 text-theme-text">
              {partner.razaoSocial}
            </h1>
            <div className="flex flex-wrap justify-center gap-8 text-proportional">
              <div className="flex items-center gap-3"><MapPin size={14} className="text-brand-tactical" /> {partner.address || "Campinas, SP"}</div>
              <div className="flex items-center gap-3"><Phone size={14} className="text-brand-tactical" /> {partner.phone || "(19) 98765-4321"}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Info + CTA */}
      <section className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 py-12 md:py-24 border-b border-theme-border">
        <div>
          <h2 className="text-3xl md:text-5xl font-black tracking-tighter mb-10 uppercase leading-none">Sobre a Unidade</h2>
          <p className="text-theme-muted leading-relaxed tracking-widest text-[12px] font-bold mb-12 uppercase">
            {partner.description || "Esta unidade é um parceiro estratégico da plataforma Foto Segundo, oferecendo infraestrutura otimizada para capturas profissionais de alto padrão."}
          </p>

          <div className="space-y-8">
            {[
              "Acesso prioritário para profissionais credenciados",
              "Iluminação natural otimizada para retratos",
              "Área privativa para fotos e cinema familiar",
              "Sincronização imediata de álbuns digitais"
            ].map(feat => (
              <div key={feat} className="flex items-center gap-5 text-[10px] font-bold uppercase tracking-[0.25em] text-theme-muted group">
                <div className="w-2 h-[1px] bg-brand-tactical transition-all group-hover:w-8" />
                {feat}
              </div>
            ))}
          </div>
        </div>

        <div className="lux-card flex flex-col justify-center items-center text-center">
          <Calendar className="text-brand-tactical mb-10" size={56} strokeWidth={1} />
          <h3 className="text-2xl md:text-4xl font-black tracking-tighter mb-6 uppercase leading-none">Agende seu Protocolo</h3>
          {partner.fixedDuration && (
            <p className="text-brand-tactical text-[10px] font-black uppercase tracking-[0.3em] mb-4">
              Sessão de {partner.fixedDuration}h
            </p>
          )}
          <p className="text-theme-muted text-[11px] font-bold uppercase tracking-[0.2em] leading-relaxed mb-12">
            Solicite cobertura fotográfica ou cinematográfica exclusiva para este local com condições especiais de unidade fixa parceira.
          </p>
          <button
            onClick={() => navigate(`/cotacao?partner=${partner.slug}`)}
            className="w-full py-6 bg-theme-text text-theme-bg text-[11px] font-bold uppercase tracking-[0.4em] hover:opacity-90 transition-all"
          >
            INICIAR ORÇAMENTO EXPRESS
          </button>
        </div>
      </section>

      {/* ── CATÁLOGO DE SERVIÇOS ── */}
      {activeServices.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 border-b border-theme-border space-y-16">
          <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.5em]">Serviços Disponíveis</p>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Catálogo desta Unidade</h2>
            </div>
            <p className="text-[10px] text-theme-muted font-bold uppercase tracking-[0.3em] max-w-xs">
              Preços configurados especificamente para {partner.razaoSocial}.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-theme-border/20 border border-theme-border/20 shadow-2xl overflow-hidden">
            {activeServices.map((svc) => {
              const localPrice = (partner.servicePrices as Record<string, number> | null)?.[svc.id];
              const displayPrice = localPrice ?? svc.basePrice;
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5 }}
                  className="bg-theme-bg-muted/20 p-10 group hover:bg-theme-bg-muted/40 transition-all duration-500"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-black uppercase tracking-tight italic text-theme-text group-hover:text-brand-tactical transition-colors">
                        {svc.name}
                      </h3>
                      {localPrice && localPrice !== svc.basePrice && (
                        <span className="text-[8px] font-black text-theme-muted uppercase tracking-widest line-through opacity-40">
                          Rede: {formatCurrency(svc.basePrice)}
                        </span>
                      )}
                    </div>
                    <span className="text-2xl font-black italic text-brand-tactical font-heading">
                      {formatCurrency(displayPrice)}
                    </span>
                  </div>
                  <p className="text-[10px] text-theme-muted font-medium leading-relaxed tracking-wide">
                    {svc.description}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── GRADE DE HORÁRIOS ── */}
      {hasSchedule && (
        <section className="max-w-7xl mx-auto px-6 py-24 md:py-32 border-b border-theme-border space-y-16">
          <div className="space-y-3">
            <p className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.5em]">Disponibilidade</p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">Horários de Funcionamento</h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {DAY_ORDER.map((day) => {
              const config = workingHours![day];
              if (!config) return null;
              return (
                <div
                  key={day}
                  className={`p-6 border text-center transition-all ${
                    config.closed
                      ? "border-theme-border/30 bg-theme-bg-muted/10 opacity-50"
                      : "border-brand-tactical/20 bg-brand-tactical/5 hover:bg-brand-tactical/10"
                  }`}
                >
                  <p className="text-[9px] font-black uppercase tracking-widest text-theme-muted mb-4">
                    {DAY_NAMES[day]}
                  </p>
                  {config.closed ? (
                    <div className="flex flex-col items-center gap-2">
                      <XCircle size={20} className="text-theme-muted/40" />
                      <span className="text-[9px] font-black text-theme-muted uppercase tracking-wider">Fechado</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <CheckCircle2 size={20} className="text-brand-tactical" />
                      <div className="flex items-center gap-1 text-[10px] font-black text-theme-text">
                        <Clock size={10} className="text-brand-tactical" />
                        {config.open}
                      </div>
                      <div className="text-[9px] font-bold text-theme-muted">até {config.close}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Recents Gallery */}
      <section className="py-24 md:py-40 px-6 max-w-7xl mx-auto mobile-py">
        <div className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-24 mobile-center">
          <div>
            <h2 className="text-5xl font-black tracking-tighter uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Registros Recentes</h2>
            <p className="text-[11px] text-theme-muted font-extrabold uppercase tracking-[0.35em] mt-3">Curadoria Editorial neste Local</p>
          </div>
          <div className="hidden md:flex items-center gap-3 text-theme-muted opacity-30">
            <Star size={18} fill="currentColor" />
            <Star size={18} fill="currentColor" />
            <Star size={18} fill="currentColor" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 mobile-gap">
          {recentEvents.length === 0 ? (
            <div className="col-span-full py-20 text-center border border-dashed border-theme-border text-[10px] text-theme-muted uppercase tracking-widest">
              Aguardando primeiros registros oficiais.
            </div>
          ) : recentEvents.map((evt) => (
            <motion.div
              key={evt.id}
              whileHover={{ scale: 0.98 }}
              onClick={() => navigate(`/e/${evt.slug || evt.id}`)}
              className="group cursor-pointer"
            >
              <div className="aspect-[4/5] overflow-hidden mb-8 bg-theme-bg-muted border border-theme-border relative">
                <img
                  src={evt.coverPhotoUrl || "https://images.unsplash.com/photo-1519741497674-611481863552?w=800"}
                  className="w-full h-full object-cover transition-all duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                  alt={evt.nomeNoivos}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-[10px] font-black uppercase tracking-[0.5em] border border-white/20 px-6 py-3 backdrop-blur-md">Ver Galeria</span>
                </div>
              </div>
              <h4 className="text-2xl font-black uppercase tracking-tighter mb-1 leading-none">{evt.nomeNoivos}</h4>
              <div className="text-[10px] text-theme-muted font-bold uppercase tracking-[0.3em]">{new Date(evt.dataEvento).toLocaleDateString('pt-BR', { year: 'numeric', month: 'short', day: '2-digit' })}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="py-24 md:py-40 bg-theme-bg-muted text-theme-text text-center border-t border-theme-border mobile-py">
        <div className="max-w-xl mx-auto px-6">
          <MessageSquare className="mx-auto mb-10 text-brand-tactical" size={40} />
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter mb-10 leading-none uppercase" style={{ fontFamily: "'Outfit', sans-serif" }}>Dúvidas sobre o Local?</h2>
          <p className="text-zinc-500 text-[11px] font-bold uppercase tracking-[0.3em] leading-relaxed mb-12">Entre em contato direto com a administração da unidade para suporte logístico e agendamento de visitas técnicas.</p>
          <div className="flex flex-col gap-4">
            <button className="px-12 py-6 bg-brand-tactical text-black text-[11px] font-black uppercase tracking-[0.4em] hover:brightness-110 transition-all">WhatsApp Unidade</button>
            <button onClick={() => navigate("/")} className="text-[10px] font-bold uppercase tracking-[0.8em] text-zinc-600 hover:text-white transition-colors mt-8">Voltar para Vitrine Global</button>
          </div>
        </div>
      </footer>
    </div>
  );
};

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, MapPin, Camera, Clock, Star,
  ChevronLeft, Lock, CheckCircle2, Zap
} from "lucide-react";
import { API } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";

interface ProService {
  id: string;
  name: string;
  description: string | null;
  basePrice: number;
  estimatedMinutes: number;
}

interface ProfProfile {
  id: string;
  userId: string;
  nome: string;
  profileImageUrl: string | null;
  address: string | null;
  isVerified: boolean;
  services: string[];
  otherHabilities: string | null;
  experienceYears: number;
  workflowType: string[];
  avgDeliveryHours: number;
  totalMissions: number;
  agilityPoints: number;
  proServices: ProService[];
  isSubscriber: boolean;
  memberSince: string;
}

interface BookingState {
  open: boolean;
  service: ProService | null;
  phone: string;
  loading: boolean;
  checkoutUrl: string | null;
}

function BookingModal({
  prof, state, onClose, onChange, onSubmit
}: {
  prof: ProfProfile;
  state: BookingState;
  onClose: () => void;
  onChange: (k: keyof BookingState, v: string | boolean | ProService | null) => void;
  onSubmit: () => void;
}) {
  if (!state.open || !state.service) return null;
  const fee = (state.service.basePrice * 0.2).toFixed(2);

  return (
    <div className="fixed inset-0 z-[5000] flex items-center justify-center p-6 bg-black/90 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-zinc-950 border border-brand-tactical/20 p-8 space-y-8 relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-1 relative z-10">
          <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic">Taxa de Reserva</p>
          <h2 className="text-2xl font-heading font-black text-white uppercase italic tracking-tight">
            Reservar {prof.nome}
          </h2>
          <p className="text-xs text-zinc-500 leading-relaxed">
            Pague a taxa de 20% (R$ {fee}) para receber o WhatsApp do profissional e alinhar os detalhes finais.
          </p>
        </div>

        <div className="relative z-10 space-y-4">
          <div className="p-4 bg-zinc-900 border border-zinc-800">
            <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Pacote Selecionado</p>
            <p className="text-sm font-black text-white mt-1">{state.service.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[10px] text-zinc-500 font-bold">Valor Completo</span>
              <span className="text-sm font-heading font-black text-white italic">
                R$ {state.service.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-brand-tactical font-black uppercase">Taxa de Reserva (20%)</span>
              <span className="text-lg font-heading font-black text-brand-tactical italic">R$ {fee}</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Seu WhatsApp (para contato)</label>
            <input
              className="w-full bg-zinc-900 border border-zinc-800 p-3 text-sm text-white placeholder-zinc-600 focus:border-brand-tactical/50 outline-none"
              placeholder="(11) 99999-9999"
              value={state.phone}
              onChange={e => onChange("phone", e.target.value)}
            />
          </div>

          <div className="p-3 bg-brand-tactical/5 border border-brand-tactical/20 flex items-start gap-3">
            <Lock size={14} className="text-brand-tactical mt-0.5 flex-shrink-0" />
            <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">
              Após o pagamento, o WhatsApp de <strong className="text-white">{prof.nome}</strong> será liberado para você por e-mail e notificação. O restante é pago diretamente ao profissional.
            </p>
          </div>
        </div>

        <div className="flex gap-3 relative z-10">
          <button
            onClick={onClose}
            className="flex-1 px-6 py-4 border border-zinc-800 text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:border-zinc-600 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={state.loading || !state.phone}
            className="flex-[2] px-6 py-4 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
          >
            {state.loading ? "PROCESSANDO..." : `PAGAR R$ ${fee}`}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

export default function ProfissionalProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [prof, setProf] = useState<ProfProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingState>({
    open: false, service: null, phone: "", loading: false, checkoutUrl: null
  });

  useEffect(() => {
    if (!id) return;
    API.get(`/marketplace/profissionais/${id}`)
      .then(r => setProf(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const cityFromAddress = (addr: string | null) => {
    if (!addr) return null;
    const p = addr.split("|");
    return p[4] ? `${p[4]}${p[5] ? `, ${p[5]}` : ""}` : null;
  };

  const handleBook = async () => {
    if (!booking.service || !booking.phone) return;
    setBooking(b => ({ ...b, loading: true }));
    try {
      const { data } = await API.post("/marketplace/profissionais/book", {
        profissionalId: prof?.id,
        packageDesc: booking.service.name,
        bookingFee: (booking.service.basePrice * 0.2).toFixed(2),
        clientePhone: booking.phone,
      });
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, "_blank");
        setBooking(b => ({ ...b, checkoutUrl: data.checkoutUrl, loading: false }));
      }
    } catch (err) {
      console.error(err);
      setBooking(b => ({ ...b, loading: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Profissional não encontrado.
      </div>
    );
  }

  const city = cityFromAddress(prof.address);

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar />
      <BookingModal
        prof={prof}
        state={booking}
        onClose={() => setBooking(b => ({ ...b, open: false }))}
        onChange={(k, v) => setBooking(b => ({ ...b, [k]: v }))}
        onSubmit={handleBook}
      />

      {/* Back */}
      <div className="max-w-5xl mx-auto px-6 pt-8">
        <Link to="/profissionais" className="inline-flex items-center gap-2 text-[10px] font-black text-zinc-500 uppercase tracking-widest hover:text-brand-tactical transition-colors">
          <ChevronLeft size={14} /> Voltar ao Diretório
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row gap-10 items-start"
        >
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 md:w-48 md:h-48 bg-zinc-800 overflow-hidden border-2 border-zinc-700">
              {prof.profileImageUrl ? (
                <img src={prof.profileImageUrl} alt={prof.nome} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">
                  <Camera size={48} />
                </div>
              )}
            </div>
            {prof.isVerified && (
              <div className="absolute -bottom-3 -right-3 bg-brand-tactical w-10 h-10 flex items-center justify-center border-4 border-zinc-950">
                <ShieldCheck size={18} className="text-black" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-4xl md:text-5xl font-heading font-black text-white uppercase italic tracking-tighter">
                  {prof.nome}
                </h1>
                {prof.isSubscriber && (
                  <span className="px-3 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5">
                    <Star size={8} fill="currentColor" /> PRO ASSINANTE
                  </span>
                )}
              </div>
              {city && (
                <p className="flex items-center gap-1.5 text-sm text-zinc-500 font-bold mt-2">
                  <MapPin size={14} /> {city}
                </p>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { label: "Anos Exp.", value: prof.experienceYears || "—" },
                { label: "Missões", value: prof.totalMissions },
                { label: "Entrega Média", value: prof.avgDeliveryHours > 0 ? `${prof.avgDeliveryHours}h` : "—" },
                { label: "Pontos", value: prof.agilityPoints, accent: true },
              ].map(s => (
                <div key={s.label} className="bg-zinc-900 border border-zinc-800 p-4 text-center">
                  <p className={`text-2xl font-heading font-black italic ${s.accent ? "text-brand-tactical" : "text-white"}`}>
                    {s.value}
                  </p>
                  <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Services chips */}
            <div className="flex flex-wrap gap-2">
              {prof.services.map(s => (
                <span key={s} className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                  {s}
                </span>
              ))}
              {prof.workflowType.includes("MOBILE") && (
                <span className="px-3 py-1 bg-zinc-800 border border-zinc-700 text-[9px] font-black text-brand-tactical uppercase tracking-widest">
                  MOBILE MAKER
                </span>
              )}
            </div>

            {prof.otherHabilities && (
              <p className="text-sm text-zinc-400 leading-relaxed max-w-xl">{prof.otherHabilities}</p>
            )}
          </div>
        </motion.div>
      </div>

      {/* Divider */}
      <div className="max-w-5xl mx-auto px-6">
        <div className="h-px bg-zinc-800" />
      </div>

      {/* Packages */}
      <div className="max-w-5xl mx-auto px-6 py-12 space-y-8">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-heading font-black text-white uppercase italic">Pacotes Disponíveis</h2>
          <div className="flex-1 h-px bg-zinc-800" />
        </div>

        {prof.proServices.length === 0 ? (
          <div className="py-16 text-center border border-dashed border-zinc-800">
            <Camera size={48} className="text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-600 text-sm uppercase tracking-widest font-black">
              Nenhum pacote cadastrado ainda
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {prof.proServices.map(svc => {
              const fee = (svc.basePrice * 0.2).toFixed(2);
              return (
                <motion.div
                  key={svc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-zinc-900 border border-zinc-800 hover:border-brand-tactical/30 transition-all p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1 flex-1">
                      <h3 className="text-base font-heading font-black text-white uppercase italic">{svc.name}</h3>
                      {svc.description && (
                        <p className="text-xs text-zinc-500 leading-relaxed">{svc.description}</p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-2xl font-heading font-black text-white italic">
                        R$ {svc.basePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <p className="text-[8px] text-zinc-600 uppercase tracking-widest font-black">Valor Total</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-zinc-500 font-bold uppercase">
                    <span className="flex items-center gap-1.5">
                      <Clock size={12} /> {Math.floor(svc.estimatedMinutes / 60)}h{svc.estimatedMinutes % 60 > 0 ? `${svc.estimatedMinutes % 60}m` : ""}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Zap size={12} className="text-brand-tactical" />
                      <span className="text-brand-tactical">Taxa: R$ {fee}</span>
                    </span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800">
                    <div className="flex items-center gap-2 mb-3 text-[9px] text-zinc-600 uppercase tracking-widest font-black">
                      <Lock size={10} />
                      Contato liberado após pagamento da taxa
                    </div>
                    {user ? (
                      <button
                        onClick={() => setBooking({ open: true, service: svc, phone: "", loading: false, checkoutUrl: null })}
                        className="w-full py-3.5 bg-brand-tactical text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all"
                      >
                        Reservar por R$ {fee}
                      </button>
                    ) : (
                      <Link
                        to={`/login?redirect=/pro/${prof.id}`}
                        className="block w-full py-3.5 bg-zinc-800 text-zinc-300 text-center text-[10px] font-black uppercase tracking-widest hover:bg-zinc-700 transition-all"
                      >
                        Faça login para reservar
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Trust badges */}
        <div className="mt-12 grid grid-cols-3 gap-4">
          {[
            { icon: <ShieldCheck size={20} />, label: "Verificado pela Foto Segundo", desc: "Identidade e experiência auditadas" },
            { icon: <Lock size={20} />, label: "Pagamento Seguro", desc: "Processado via Mercado Pago com proteção total" },
            { icon: <CheckCircle2 size={20} />, label: "Garantia de Contato", desc: "WhatsApp liberado imediatamente após confirmação" },
          ].map(b => (
            <div key={b.label} className="p-5 border border-zinc-800 text-center space-y-2">
              <div className="text-brand-tactical flex justify-center">{b.icon}</div>
              <p className="text-[9px] font-black text-white uppercase tracking-widest">{b.label}</p>
              <p className="text-[8px] text-zinc-500 font-medium leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

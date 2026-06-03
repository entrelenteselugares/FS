import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShieldCheck, MapPin, Camera, Clock, Star,
  ChevronLeft, Lock, CheckCircle2, Zap, Award, ArrowRight
} from "lucide-react";
import { API } from "../lib/api";
import { Navbar } from "../components/Navbar";
import { useAuth } from "../hooks/useAuth";
import { ProfessionalBadgesShowcase } from "../components/profissional/ProfessionalBadgesShowcase";

interface ProService {
  id: string;
  name: string;
  description: string | null;
  price?: number;
  basePrice: number;
  estimatedMinutes: number;
}

interface ProfProfile {
  id: string;
  userId: string;
  nome: string;
  profileImageUrl: string | null;
  coverImageUrl: string | null;
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
  city?: string | null;
  serviceRadiusKm?: number;
  badges?: any[];
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
  const activePrice = state.service.price || state.service.basePrice || 0;
  const fee = (activePrice * 0.2).toFixed(2);

  return (
    <div className="fixed inset-0 z-[5000] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xl">
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full sm:max-w-lg bg-zinc-950 border border-white/10 sm:rounded-2xl rounded-t-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/5">
          <p className="text-[9px] font-black text-brand-tactical uppercase tracking-widest italic mb-1">Taxa de Reserva</p>
          <h2 className="text-xl font-heading font-black text-white uppercase italic tracking-tight">
            Reservar {prof.nome}
          </h2>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Package info */}
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-4">
            <div>
              <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Pacote</p>
              <p className="text-sm font-black text-white">{state.service.name}</p>
            </div>
            <div className="text-right">
              <p className="text-xl font-heading font-black text-brand-tactical italic">R$ {fee}</p>
              <p className="text-[8px] text-zinc-500 font-bold uppercase">taxa (20%)</p>
            </div>
          </div>

          {/* Phone input */}
          <div>
            <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block mb-2">Seu WhatsApp</label>
            <input
              className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white placeholder-zinc-600 focus:border-brand-tactical/50 outline-none transition-colors"
              placeholder="(11) 99999-9999"
              value={state.phone}
              onChange={e => onChange("phone", e.target.value)}
            />
          </div>

          {/* Notice */}
          <div className="flex items-start gap-3 bg-brand-tactical/5 border border-brand-tactical/15 rounded-xl p-3.5">
            <Lock size={12} className="text-brand-tactical mt-0.5 flex-shrink-0" />
            <p className="text-[9px] text-zinc-400 leading-relaxed font-medium">
              Após o pagamento, o WhatsApp de <strong className="text-white">{prof.nome}</strong> será liberado por e-mail. O restante é pago diretamente ao profissional.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-3.5 border border-white/10 rounded-xl text-zinc-400 text-[10px] font-black uppercase tracking-widest hover:border-white/20 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={state.loading || !state.phone}
            className="flex-[2] px-4 py-3.5 bg-brand-tactical text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 disabled:opacity-40 transition-all"
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
  const [albums, setAlbums] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState<BookingState>({
    open: false, service: null, phone: "", loading: false, checkoutUrl: null
  });

  useEffect(() => {
    if (!id) return;
    Promise.all([
      API.get(`/marketplace/profissionais/${id}`),
      API.get(`/portfolio/${id}/albums`).catch(() => ({ data: [] }))
    ])
      .then(([profRes, albumsRes]) => {
        setProf(profRes.data);
        setAlbums(albumsRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  const cityFromAddress = (addr: string | null) => {
    if (prof?.city) return prof.city;
    if (!addr) return null;
    const p = addr.split("|");
    return p[4] ? `${p[4]}${p[5] ? `, ${p[5]}` : ""}` : null;
  };

  const handleBook = async () => {
    if (!booking.service || !booking.phone) return;
    setBooking(b => ({ ...b, loading: true }));
    const activePrice = booking.service.price || booking.service.basePrice || 0;
    try {
      const { data } = await API.post("/marketplace/profissionais/book", {
        profissionalId: prof?.id,
        packageDesc: booking.service.name,
        bookingFee: (activePrice * 0.2).toFixed(2),
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
        <div className="w-10 h-10 border-2 border-brand-tactical border-t-transparent rounded-full animate-spin" />
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

      {/* ── HERO ── */}
      <div className="relative">
        {/* Cover */}
        <div className="relative h-52 md:h-72 bg-zinc-900 overflow-hidden">
          {prof.coverImageUrl ? (
            <img src={prof.coverImageUrl} alt="Cover" className="w-full h-full object-cover opacity-70" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 flex items-center justify-center">
              <Camera size={56} className="text-zinc-700" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
        </div>

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <Link
            to="/profissionais"
            className="inline-flex items-center gap-1.5 text-[9px] font-black text-white/70 uppercase tracking-widest bg-black/40 backdrop-blur-sm border border-white/10 px-3 py-2 rounded-full hover:text-brand-tactical transition-colors"
          >
            <ChevronLeft size={12} /> Diretório
          </Link>
        </div>

        {/* Profile card overlapping cover */}
        <div className="max-w-5xl mx-auto px-4 md:px-6">
          <div className="-mt-20 relative z-10 pb-6">
            <div className="flex flex-col sm:flex-row gap-5 sm:items-end">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-2xl bg-zinc-800 overflow-hidden border-4 border-zinc-950 shadow-2xl">
                  {prof.profileImageUrl ? (
                    <img src={prof.profileImageUrl} alt={prof.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-zinc-900 text-3xl font-black">
                      {prof.nome.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2)}
                    </div>
                  )}
                </div>
                {prof.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-brand-tactical w-7 h-7 rounded-lg flex items-center justify-center border-2 border-zinc-950">
                    <ShieldCheck size={13} className="text-black" />
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div className="flex-1 min-w-0 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl md:text-4xl font-heading font-black text-white uppercase italic tracking-tighter leading-none">
                    {prof.nome}
                  </h1>
                  {prof.isSubscriber && (
                    <span className="px-2.5 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-brand-tactical text-[7px] font-black uppercase tracking-widest flex items-center gap-1 rounded-full">
                      <Star size={7} fill="currentColor" /> PRO
                    </span>
                  )}
                </div>

                {city && (
                  <div className="flex items-center gap-3 flex-wrap">
                    <p className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold">
                      <MapPin size={12} className="text-brand-tactical" /> {city}
                    </p>
                    {prof.serviceRadiusKm && (
                      <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest bg-zinc-900 border border-zinc-800 px-2 py-0.5 rounded-full">
                        Raio {prof.serviceRadiusKm}km
                      </span>
                    )}
                  </div>
                )}

                {/* Service tags */}
                <div className="flex flex-wrap gap-1.5">
                  {prof.services.slice(0, 5).map(s => (
                    <span key={s} className="px-2.5 py-1 bg-zinc-800/80 border border-zinc-700/50 text-[8px] font-black text-zinc-300 uppercase tracking-wider rounded-full">
                      {s}
                    </span>
                  ))}
                  {prof.workflowType.includes("MOBILE") && (
                    <span className="px-2.5 py-1 bg-brand-tactical/10 border border-brand-tactical/30 text-[8px] font-black text-brand-tactical uppercase tracking-wider rounded-full">
                      Mobile Maker
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── Compact Stats Bar ── */}
            <div className="mt-5 grid grid-cols-4 gap-2 bg-zinc-900/60 border border-zinc-800/60 rounded-2xl p-3">
              {[
                { label: "Exp.", value: prof.experienceYears ? `${prof.experienceYears}a` : "—" },
                { label: "Missões", value: prof.totalMissions ?? 0 },
                { label: "Entrega", value: prof.avgDeliveryHours > 0 ? `${prof.avgDeliveryHours}h` : "—" },
                { label: "Pontos", value: prof.agilityPoints, accent: true },
              ].map(s => (
                <div key={s.label} className="text-center py-2">
                  <p className={`text-xl font-heading font-black italic leading-none ${s.accent ? "text-brand-tactical" : "text-white"}`}>
                    {s.value}
                  </p>
                  <p className="text-[7px] text-zinc-600 uppercase tracking-widest font-black mt-1">{s.label}</p>
                </div>
              ))}
            </div>

            {prof.otherHabilities && (
              <p className="mt-4 text-sm text-zinc-400 leading-relaxed max-w-2xl">
                {prof.otherHabilities}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 space-y-14 pb-20">

        {/* ── PACKAGES ── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <Award size={16} className="text-brand-tactical" />
            <h2 className="text-sm font-heading font-black text-white uppercase italic tracking-widest">Pacotes Disponíveis</h2>
            <div className="flex-1 h-px bg-zinc-800" />
            <span className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">
              {prof.proServices.length} {prof.proServices.length === 1 ? "pacote" : "pacotes"}
            </span>
          </div>

          {prof.proServices.length === 0 ? (
            <div className="py-14 text-center border border-dashed border-zinc-800 rounded-2xl">
              <Camera size={36} className="text-zinc-700 mx-auto mb-3" />
              <p className="text-zinc-600 text-xs uppercase tracking-widest font-black">Nenhum pacote cadastrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 md:gap-4">
              {prof.proServices.map(svc => {
                const activePrice = svc.price || svc.basePrice || 0;
                const fee = (activePrice * 0.2).toFixed(2);
                const hrs = Math.floor(svc.estimatedMinutes / 60);
                const mins = svc.estimatedMinutes % 60;
                return (
                  <motion.div
                    key={svc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="group bg-zinc-900/60 border border-zinc-800/60 hover:border-brand-tactical/30 rounded-xl md:rounded-2xl p-2 md:p-5 flex flex-col gap-2 md:gap-4 transition-all hover:shadow-lg hover:shadow-brand-tactical/5"
                  >
                    {/* Top */}
                    <div className="flex flex-col md:flex-row items-start md:justify-between gap-1 md:gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-[9px] md:text-sm font-heading font-black text-white uppercase italic leading-tight line-clamp-3 md:line-clamp-none">{svc.name}</h3>
                        {svc.description && (
                          <p className="hidden md:block text-[10px] text-zinc-500 mt-1 leading-relaxed line-clamp-2">{svc.description}</p>
                        )}
                      </div>
                      <div className="flex-shrink-0 md:text-right mt-1 md:mt-0">
                        <p className="text-[10px] md:text-lg font-heading font-black text-brand-tactical md:text-white italic leading-none">
                          R$ {activePrice.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </p>
                        <p className="hidden md:block text-[7px] text-zinc-600 uppercase tracking-widest font-black mt-0.5">total</p>
                      </div>
                    </div>

                    {/* Meta */}
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-1 md:gap-3 text-[7px] md:text-[9px] text-zinc-500 font-bold uppercase mt-1 md:mt-0">
                      <span className="flex items-center gap-1">
                        <Clock size={8} className="md:w-[10px] md:h-[10px]" /> {hrs > 0 ? `${hrs}h` : ""}{mins > 0 ? `${mins}m` : ""}
                      </span>
                      <span className="flex items-center gap-1 text-zinc-400 md:text-brand-tactical">
                        <Zap size={8} className="md:w-[10px] md:h-[10px]" /> <span className="hidden md:inline">Taxa</span> R$ {fee}
                      </span>
                    </div>

                    {/* CTA */}
                    <div className="mt-auto pt-1 md:pt-2">
                      <div className="hidden md:flex items-center gap-1 text-[8px] text-zinc-700 font-black uppercase tracking-widest mb-2">
                        <Lock size={8} /> Contato após pagamento
                      </div>
                      {user ? (
                        <button
                          onClick={() => setBooking({ open: true, service: svc, phone: "", loading: false, checkoutUrl: null })}
                          className="w-full py-1.5 md:py-3 bg-brand-tactical text-black text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl hover:brightness-110 transition-all flex items-center justify-center gap-1 md:gap-2 group-hover:gap-3"
                        >
                          <span className="hidden md:inline">Reservar por R$ {fee}</span>
                          <span className="md:hidden text-center leading-tight">Reservar</span>
                          <ArrowRight size={8} className="md:w-[11px] md:h-[11px]" />
                        </button>
                      ) : (
                        <Link
                          to={`/login?redirect=/pro/${prof.id}`}
                          className="block w-full flex items-center justify-center py-1.5 md:py-3 bg-zinc-800 text-zinc-300 text-center text-[7px] md:text-[9px] font-black uppercase tracking-widest rounded-lg md:rounded-xl hover:bg-zinc-700 transition-all leading-tight"
                        >
                          <span className="hidden md:inline">Entrar para reservar</span>
                          <span className="md:hidden">Entrar</span>
                        </Link>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── PORTFOLIO ── */}
        {albums.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-6">
              <Camera size={16} className="text-brand-tactical" />
              <h2 className="text-sm font-heading font-black text-white uppercase italic tracking-widest">Portfólio</h2>
              <div className="flex-1 h-px bg-zinc-800" />
            </div>
            <div className="columns-2 sm:columns-3 gap-3 space-y-3">
              {albums.flatMap(album => (album.images || []).map((img: any) => (
                <div key={img.id} className="break-inside-avoid relative group overflow-hidden rounded-xl bg-zinc-900 border border-zinc-800/50">
                  <img src={img.watermarkedUrl || img.url} alt="Portfolio" className="w-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-black text-white uppercase tracking-widest truncate">{album.title}</p>
                  </div>
                </div>
              )))}
            </div>
          </section>
        )}

        {/* ── BADGES ── */}
        {prof.badges && prof.badges.length > 0 && (
          <section>
            <ProfessionalBadgesShowcase badges={prof.badges} />
          </section>
        )}

        {/* ── TRUST BAR ── */}
        <section>
          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: <ShieldCheck size={18} />, label: "Verificado", desc: "Identidade auditada pela Foto Segundo" },
              { icon: <Lock size={18} />, label: "Pagamento Seguro", desc: "Via Mercado Pago com proteção total" },
              { icon: <CheckCircle2 size={18} />, label: "Contato Garantido", desc: "WhatsApp liberado após confirmação" },
            ].map(b => (
              <div key={b.label} className="p-4 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl text-center space-y-2">
                <div className="text-brand-tactical flex justify-center">{b.icon}</div>
                <p className="text-[8px] font-black text-white uppercase tracking-wider">{b.label}</p>
                <p className="text-[7px] text-zinc-500 font-medium leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Check, X, ShieldCheck, MapPin, Briefcase, Users, ChevronRight } from "lucide-react";
import type { EventItem, UnitInvite } from "./types";
import { CalendarView } from "./CalendarView";

// Delivery timer sub-component
function DeadlineTimer({ event, type }: { event: EventItem; type: "FOTO" | "VIDEO" }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isDelivered = type === "FOTO" ? !!event.lightroomUrl : !!event.driveUrl;
  const targetMinutes = type === "FOTO" ? 30 : 48 * 60;

  useEffect(() => {
    if (isDelivered) return;
    const timer = setInterval(() => {
      const start = new Date(event.dataEvento).getTime();
      const target = start + targetMinutes * 60 * 1000;
      setTimeLeft(target - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [event.dataEvento, targetMinutes, isDelivered]);

  if (isDelivered) {
    return (
      <div className="flex items-center gap-2 text-brand-tactical text-[10px] font-black uppercase tracking-widest italic">
        <Check size={12} /> {type === "FOTO" ? "FOTOS OK" : "VÍDEO OK"}
      </div>
    );
  }

  const isOverdue = timeLeft < 0;
  const abs = Math.abs(timeLeft);
  const h = Math.floor(abs / (1000 * 60 * 60));
  const m = Math.floor((abs % (1000 * 60 * 60)) / (1000 * 60));
  const s = Math.floor((abs % (1000 * 60)) / 1000);
  const timeStr = h > 0 ? `${h}h ${m}m` : `${m}m ${s}s`;

  return (
    <div className={`text-[10px] font-black uppercase tracking-widest italic flex items-center gap-2 ${isOverdue ? "text-red-500" : "text-amber-500"}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
      {type === "FOTO" ? "📸 Foto: " : "🎬 Vídeo: "}
      {isOverdue ? `Atrasado ${timeStr}` : `SLA ${timeStr}`}
    </div>
  );
}

interface AgendaTabProps {
  events: EventItem[];
  unitInvites: UnitInvite[];
  activeTab: "agenda" | "convites";
  viewTab: "lista" | "calendario";
  currentMonth: Date;
  loading: boolean;
  userId: string | undefined;
  onSetCurrentMonth: (d: Date) => void;
  onSelectEvent: (ev: EventItem) => void;
  onRespond: (eventId: string, status: "ACCEPTED" | "REJECTED") => void;
  onRespondUnit: (inviteId: string, status: "ACCEPTED" | "REJECTED") => void;
  onDelegate: (eventId: string) => void;
}

export function AgendaTab({
  events,
  unitInvites,
  activeTab,
  viewTab,
  currentMonth,
  loading,
  userId,
  onSetCurrentMonth,
  onSelectEvent,
  onRespond,
  onRespondUnit,
  onDelegate,
}: AgendaTabProps) {
  const pendingEvents = events.filter(
    (ev) =>
      (ev.captacaoId === userId && ev.captacaoStatus === "PENDING") ||
      (ev.edicaoId === userId && ev.edicaoStatus === "PENDING")
  );
  const acceptedEvents = events.filter(
    (ev) =>
      (ev.captacaoId === userId && ev.captacaoStatus === "ACCEPTED") ||
      (ev.edicaoId === userId && ev.edicaoStatus === "ACCEPTED")
  );
  const displayEvents = activeTab === "agenda" ? acceptedEvents : pendingEvents;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {viewTab === "lista" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.4em]">
              Sincronizando Dados de Campo...
            </div>
          ) : displayEvents.length === 0 && unitInvites.length === 0 ? (
            <div className="py-24 text-center bg-theme-bg-muted/20 border border-dashed border-theme-border/40 text-theme-muted text-[10px] font-black uppercase tracking-[0.2em]">
              Nenhum registro encontrado para esta visualização.
            </div>
          ) : (
            <>
              {/* Unit Invites */}
              {activeTab === "convites" &&
                unitInvites.map((ui) => (
                  <div
                    key={ui.id}
                    className="bg-theme-bg border border-brand-tactical/60 p-4 md:p-6 relative overflow-hidden mb-4"
                    style={{ background: "linear-gradient(145deg, rgba(133,185,172,0.08) 0%, rgba(10,10,10,1) 100%)" }}
                  >
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-brand-tactical text-zinc-950 rounded-sm"><ShieldCheck size={18} /></div>
                          <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Oportunidade de Parceria Fixa</span>
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl md:text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{ui.cartorio.razaoSocial}</h3>
                          <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest italic">Base Operacional: {ui.cartorio.cidade} · Modalidade: {ui.tipo}</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => onRespondUnit(ui.id, "REJECTED")} className="px-8 py-4 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/10 italic flex items-center gap-2">
                          <X size={16} /> Recusar
                        </button>
                        <button onClick={() => onRespondUnit(ui.id, "ACCEPTED")} className="px-10 py-4 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] hover:brightness-110 italic flex items-center gap-2 shadow-lg shadow-brand-tactical/20">
                          <Check size={18} /> FIRMAR PARCERIA
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

              {/* Events */}
              {displayEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`bg-theme-bg border ${
                    activeTab === "agenda" ? "cursor-pointer hover:border-brand-tactical/50" : ""
                  } border-theme-border/60 p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-8 items-center relative overflow-hidden transition-all`}
                  onClick={() => activeTab === "agenda" && onSelectEvent(ev)}
                >
                  <div className={`absolute left-0 top-0 h-full w-1 ${ev.captacaoStatus === "PENDING" ? "bg-amber-500" : "bg-brand-tactical"}`} />
                  <div className="min-w-[70px] text-center md:text-left">
                    <div className="text-[8px] font-black text-theme-muted uppercase italic mb-0.5">DATA</div>
                    <div className="text-xl font-heading font-black text-theme-text italic leading-none uppercase">
                      {new Date(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}
                    </div>
                  </div>
                  <div className="flex-grow space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-heading font-black text-theme-text uppercase italic">{ev.nomeNoivos}</h3>
                      <div className={`px-2 py-0.5 text-[7px] font-black border ${ev.captacaoStatus === "ACCEPTED" ? "bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                        {ev.captacaoStatus === "ACCEPTED" ? "CONFIRMADO" : "PENDENTE"}
                      </div>
                    </div>
                    <div className="flex gap-4 text-[9px] text-theme-muted font-bold uppercase flex-wrap">
                      <span className="flex items-center gap-1"><MapPin size={10} /> {ev.location || "Campo"}</span>
                      <span className="flex items-center gap-1"><Briefcase size={10} /> {ev.captacaoId === userId ? "CAPTAÇÃO" : "EDIÇÃO"}</span>
                      <DeadlineTimer event={ev} type="FOTO" />
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {activeTab === "convites" ? (
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "REJECTED"); }} className="p-3 border border-red-500/30 text-red-500 hover:bg-red-500/10" title="Recusar">
                          <X size={14} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDelegate(ev.id); }}
                          className="px-4 py-3 border border-brand-tactical/40 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical/10 flex items-center gap-2"
                        >
                          <Users size={14} /> DELEGAR
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "ACCEPTED"); }} className="px-6 py-3 bg-brand-tactical text-brand-text text-[9px] font-black uppercase tracking-widest">
                          <Check size={14} /> ACEITAR
                        </button>
                      </div>
                    ) : (
                      <ChevronRight size={20} className="text-theme-muted" />
                    )}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <CalendarView
          events={displayEvents}
          currentMonth={currentMonth}
          setCurrentMonth={onSetCurrentMonth}
          onSelect={(ev) => { if (activeTab === "agenda") onSelectEvent(ev); }}
        />
      )}
    </div>
  );
}


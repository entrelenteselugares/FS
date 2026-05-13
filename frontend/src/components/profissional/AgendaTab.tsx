import { useState, useEffect, useMemo } from "react";
import { Check, X, ShieldCheck, MapPin, Briefcase, Users, ChevronRight, Camera, Video, Smartphone, Clock } from "lucide-react";
import type { EventItem, UnitInvite } from "./types";
import { CalendarView } from "./CalendarView";
import { parseDateSafe } from "../../lib/utils/formatters";

// Delivery timer sub-component
function DeadlineTimer({ event, type }: { event: EventItem; type: "FOTO" | "VIDEO" }) {
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const isDelivered = type === "FOTO" ? !!event.lightroomUrl : !!event.driveUrl;
  const targetMinutes = type === "FOTO" ? 30 : 48 * 60;

  useEffect(() => {
    if (isDelivered) return;
    const timer = setInterval(() => {
      const start = parseDateSafe(event.dataEvento).getTime();
      const target = start + targetMinutes * 60 * 1000;
      setTimeLeft(target - Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, [event.dataEvento, targetMinutes, isDelivered]);

  if (isDelivered) {
    return (
      <div className="flex items-center gap-1.5 text-brand-tactical text-[9px] font-black uppercase tracking-widest italic bg-brand-tactical/5 px-2 py-1 rounded-sm border border-brand-tactical/10">
        <Check size={10} /> {type === "FOTO" ? "FOTOS OK" : "VÍDEO OK"}
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
    <div className={`text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 px-2 py-1 rounded-sm border ${isOverdue ? "text-red-500 bg-red-500/5 border-red-500/10" : "text-amber-500 bg-amber-500/5 border-amber-500/10"}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-red-500 animate-pulse" : "bg-amber-500"}`} />
      {isOverdue ? `ATRASADO ${timeStr}` : `SLA ${timeStr}`}
    </div>
  );
}

interface AgendaTabProps {
  events: EventItem[];
  unitInvites: UnitInvite[];
  viewTab: "lista" | "calendario";
  currentMonth: Date;
  loading: boolean;
  userId: string | undefined;
  onSetCurrentMonth: (d: Date) => void;
  onSelectEvent: (ev: EventItem) => void;
  onRespond: (eventId: string, status: "ACCEPTED" | "REJECTED") => void;
  onRespondUnit: (inviteId: string, status: "ACCEPTED" | "REJECTED") => void;
  onDelegate: (eventId: string) => void;
  opportunities: EventItem[];
}

export function AgendaTab({
  events,
  unitInvites,
  viewTab,
  currentMonth,
  loading,
  userId,
  onSetCurrentMonth,
  onSelectEvent,
  onRespond,
  onRespondUnit,
  onDelegate,
  opportunities,
}: AgendaTabProps) {
  const pendingEvents = events.filter(
    (ev) =>
      (ev.captacaoId === userId && ev.captacaoStatus === "PENDING") ||
      (ev.edicaoId === userId && ev.edicaoStatus === "PENDING")
  );
  const acceptedEvents = events.filter(
    (ev) =>
      (ev.captacaoId === userId && ev.captacaoStatus === "ACCEPTED") ||
      (ev.edicaoId === userId && ev.edicaoStatus === "ACCEPTED") ||
      (ev.ownerId === userId)
  );
  
  // Combine all relevant events for a unified view
  const displayEvents = useMemo(() => {
    // Collect all unique events
    const all = new Map<string, EventItem>();
    [...acceptedEvents, ...pendingEvents, ...opportunities].forEach(ev => all.set(ev.id, ev));
    return Array.from(all.values()).sort((a, b) => parseDateSafe(a.dataEvento).getTime() - parseDateSafe(b.dataEvento).getTime());
  }, [acceptedEvents, pendingEvents, opportunities]);

  return (
    <div className="space-y-8">
      {viewTab === "lista" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.4em]">
              Sincronizando Dados de Campo...
            </div>
          ) : (displayEvents.length === 0 && unitInvites.length === 0) ? (
            <div className="py-24 text-center bg-theme-bg-muted/20 border border-dashed border-theme-border/40 text-theme-muted text-[10px] font-black uppercase tracking-[0.2em]">
              Nenhum registro encontrado para esta visualização.
            </div>
          ) : (
            <>
              {/* Opportunities (Public Calls) */}
              {opportunities.length > 0 && opportunities.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-yellow-400/5 border border-yellow-400/30 p-5 flex flex-col md:flex-row gap-6 md:gap-10 items-center relative overflow-hidden transition-all group mb-4"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-yellow-400" />
                  
                  {/* DATA COL */}
                  <div className="min-w-[80px] flex flex-col items-center md:items-start border-r border-theme-border/20 pr-6">
                    <div className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1">DATA</div>
                    <div className="text-2xl font-heading font-black text-theme-text italic leading-none uppercase tracking-tighter">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                    </div>
                    <div className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-1">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </div>
                  </div>

                  {/* INFO COL */}
                  <div className="flex-grow space-y-3">
                    <div className="flex items-center gap-4">
                      <h3 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">{ev.nomeNoivos}</h3>
                      <div className="px-2 py-0.5 text-[9px] font-black border bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
                        CHAMADA ABERTA
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-5 items-center">
                      <div className="flex gap-4 text-[9px] text-theme-muted font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={11} className="text-yellow-400 opacity-50" /> {ev.location || "Campo"}</span>
                        <span className="flex items-center gap-1.5 text-yellow-400"><Briefcase size={11} /> PEGAR TRABALHO</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center md:items-end gap-3 min-w-[150px]">
                    <button 
                      onClick={() => onRespond(ev.id, "ACCEPTED")} 
                      className="px-8 py-3 bg-yellow-400 text-black text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2 italic shadow-lg shadow-yellow-400/10"
                    >
                      <Check size={14} /> PEGAR AGORA
                    </button>
                  </div>
                </div>
              ))}

              {/* Unit Invites */}
              {unitInvites.length > 0 && unitInvites.map((ui) => (
                <div
                  key={ui.id}
                  className="bg-theme-bg-muted/40 border border-brand-tactical/60 p-4 md:p-6 relative overflow-hidden mb-4"
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
              {displayEvents.map((ev) => {
                const isAccepted = (ev.captacaoId === userId && ev.captacaoStatus === 'ACCEPTED') || 
                                 (ev.edicaoId === userId && ev.edicaoStatus === 'ACCEPTED') ||
                                 (ev.ownerId === userId);
                const isOpportunity = ev.isPublicCall && !ev.captacaoId;

                return (
                  <div
                    key={ev.id}
                    className={`bg-theme-bg border ${
                      isAccepted ? "cursor-pointer hover:border-brand-tactical/50" : ""
                    } border-theme-border/60 p-5 flex flex-col md:flex-row gap-6 md:gap-10 items-center relative overflow-hidden transition-all group mb-4`}
                    onClick={() => isAccepted && onSelectEvent(ev)}
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${ev.captacaoStatus === "PENDING" ? "bg-amber-500" : "bg-brand-tactical"}`} />
                    
                    {/* DATA COL */}
                    <div className="min-w-[80px] flex flex-col items-center md:items-start border-r border-theme-border/20 pr-6">
                      <div className="text-[9px] font-black text-theme-muted uppercase tracking-widest mb-1">DATA</div>
                      <div className="text-2xl font-heading font-black text-theme-text italic leading-none uppercase tracking-tighter">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                      </div>
                      <div className="text-[10px] font-bold text-brand-tactical uppercase tracking-widest mt-1">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                      </div>
                    </div>

                    {/* INFO COL */}
                    <div className="flex-grow space-y-3">
                      <div className="flex items-center gap-4">
                        <h3 className="text-xl md:text-2xl font-heading font-black text-theme-text uppercase italic tracking-tight">{ev.nomeNoivos}</h3>
                        <div className={`px-2 py-0.5 text-[9px] font-black border ${ev.captacaoStatus === "ACCEPTED" ? "bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                          {ev.captacaoStatus === "ACCEPTED" ? "CONFIRMADO" : "PENDENTE"}
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-5 items-center">
                        <div className="flex gap-2.5">
                          {ev.temFoto && <div className="p-1.5 bg-theme-bg-muted border border-theme-border/60 text-theme-text opacity-70" title="Foto"><Camera size={12} /></div>}
                          {ev.temVideo && <div className="p-1.5 bg-theme-bg-muted border border-theme-border/60 text-theme-text opacity-70" title="Vídeo"><Video size={12} /></div>}
                          {ev.temReels && <div className="p-1.5 bg-theme-bg-muted border border-theme-border/60 text-theme-text opacity-70" title="Reels/Mobile"><Smartphone size={12} /></div>}
                        </div>
                        
                        <div className="h-4 w-[1px] bg-theme-border/20 hidden md:block" />
                        
                        <div className="flex gap-4 text-[9px] text-theme-muted font-black uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-tactical opacity-50" /> {ev.location || "Campo"}</span>
                          <span className="flex items-center gap-1.5"><Briefcase size={11} className="text-brand-tactical opacity-50" /> {ev.captacaoId === userId ? "CAPTAÇÃO" : "EDIÇÃO"}</span>
                          {ev.eventHours && <span className="flex items-center gap-1.5"><Clock size={11} className="text-brand-tactical opacity-50" /> {ev.eventHours}H</span>}
                        </div>
                      </div>
                    </div>

                    {/* STATUS/SLA COL */}
                    <div className="flex flex-col items-center md:items-end gap-3 min-w-[150px]">
                      <div className="flex flex-col gap-1.5 items-center md:items-end w-full">
                        <DeadlineTimer event={ev} type="FOTO" />
                        {ev.temVideo && <DeadlineTimer event={ev} type="VIDEO" />}
                      </div>
                      
                      {!isAccepted && !isOpportunity ? (
                        <div className="flex gap-2">
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "REJECTED"); }} className="p-2.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 transition-all" title="Recusar">
                            <X size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelegate(ev.id); }}
                            className="px-3 py-2.5 border border-brand-tactical/40 text-brand-tactical text-[9px] font-black uppercase tracking-widest hover:bg-brand-tactical/10 flex items-center gap-2 transition-all"
                          >
                            <Users size={14} /> DELEGAR
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "ACCEPTED"); }} className="px-5 py-2.5 bg-brand-tactical text-brand-text text-[9px] font-black uppercase tracking-widest hover:brightness-110 transition-all">
                            <Check size={14} /> ACEITAR
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="hidden group-hover:block animate-in fade-in slide-in-from-right-2 text-[9px] font-black text-brand-tactical uppercase tracking-[0.2em]">GERENCIAR</div>
                          <ChevronRight size={20} className="text-theme-muted group-hover:text-brand-tactical transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      ) : (
        <CalendarView
          events={displayEvents}
          currentMonth={currentMonth}
          setCurrentMonth={onSetCurrentMonth}
          onSelect={(ev) => onSelectEvent(ev)}
          userId={userId}
        />
      )}
    </div>
  );
}


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
      <div className="flex items-center gap-1.5 text-brand-tactical text-[9px] font-black uppercase tracking-widest italic bg-brand-tactical/10 px-2 py-1 rounded-xl border border-brand-tactical/10">
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
    <div className={`text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 px-2 py-1 rounded-xl border ${isOverdue ? "text-red-500 bg-red-500/5 border-red-500/10" : "text-amber-500 bg-amber-500/5 border-amber-500/10"}`}>
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
      
  // Combine all relevant events for a unified view
  const displayEvents = useMemo(() => {
    // Collect all unique events
    const all = new Map<string, EventItem>();
    [...events, ...opportunities].forEach(ev => all.set(ev.id, ev));
    return Array.from(all.values()).sort((a, b) => parseDateSafe(a.dataEvento).getTime() - parseDateSafe(b.dataEvento).getTime());
  }, [events, opportunities]);

  return (
    <div className="space-y-8">
      {viewTab === "lista" ? (
        <div className="space-y-4">
          {loading ? (
            <div className="py-24 text-center text-theme-muted text-[10px] font-black uppercase tracking-[0.4em]">
              Sincronizando Dados de Campo...
            </div>
          ) : (displayEvents.length === 0 && unitInvites.length === 0) ? (
            <div className="py-24 text-center bg-theme-bg border  border-theme-border rounded-2xl text-theme-muted text-[10px] font-black uppercase tracking-[0.2em]">
              Nenhum registro encontrado para esta visualização.
            </div>
          ) : (
            <>
              {/* Opportunities (Public Calls) */}
              {opportunities.length > 0 && opportunities.map((ev) => (
                <div
                  key={ev.id}
                  className="bg-yellow-400/5 border border-yellow-400/30 rounded-xl p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center relative overflow-hidden transition-all group mb-3"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-yellow-400" />
                  
                  {/* DATA COL */}
                  <div className="min-w-[60px] flex flex-row md:flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-theme-border pb-2 md:pb-0 md:pr-4 gap-2 md:gap-0 w-full md:w-auto">
                    <div className="text-[9px] font-black text-theme-muted uppercase tracking-widest hidden md:block mb-1">DATA</div>
                    <div className="text-xl md:text-2xl font-heading font-black text-theme-text italic leading-none uppercase tracking-tighter">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                    </div>
                    <div className="text-[9px] md:text-[10px] font-bold text-yellow-400 uppercase tracking-widest mt-0 md:mt-1">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </div>
                  </div>

                  {/* INFO COL */}
                  <div className="flex-grow space-y-3">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <h3 className="text-lg md:text-xl font-heading font-black text-theme-text uppercase italic tracking-tight leading-none">{ev.title}</h3>
                      <div className="px-1.5 py-0.5 text-[8px] font-black border rounded-md bg-yellow-400/10 text-yellow-400 border-yellow-400/20">
                        CHAMADA ABERTA
                      </div>
                    </div>

                    {(ev.description || ev.itinerary) && (
                      <div className="space-y-1.5 pt-1">
                        {ev.description && (
                          <p className="text-xs text-theme-text/80 line-clamp-2 whitespace-pre-line leading-relaxed">{ev.description}</p>
                        )}
                        {ev.itinerary && (
                          <p className="text-xs text-theme-text/70 line-clamp-2"><strong className="text-theme-text/90 uppercase tracking-wider text-[10px]">Observações:</strong> {ev.itinerary}</p>
                        )}
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-5 items-center">
                      <div className="flex gap-4 text-[9px] text-theme-muted font-black uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={11} className="text-yellow-400 opacity-50" /> {ev.location || "Campo"}</span>
                        <span className="flex items-center gap-1.5 text-yellow-400"><Briefcase size={11} /> PEGAR TRABALHO</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[120px] w-full md:w-auto mt-2 md:mt-0">
                    <button 
                      onClick={() => onRespond(ev.id, "ACCEPTED")} 
                      className="w-full md:w-auto px-4 py-2 bg-yellow-400 text-black text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-yellow-400/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-yellow-400/20 transition-all flex items-center justify-center gap-2 italic shadow-lg shadow-yellow-400/10"
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
                  className="bg-theme-bg-muted border border-brand-tactical/60 rounded-xl p-4 relative overflow-hidden mb-3"
                >
                  <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-8 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-brand-tactical text-zinc-950 rounded-xl"><ShieldCheck size={18} /></div>
                        <span className="text-[10px] font-black text-brand-tactical uppercase tracking-[0.4em] italic">Oportunidade de Parceria Fixa</span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-2xl md:text-3xl font-heading font-black text-theme-text uppercase tracking-tighter italic leading-none">{ui.cartorio.razaoSocial}</h3>
                        <p className="text-[11px] font-bold text-theme-muted uppercase tracking-widest italic">Base Operacional: {ui.cartorio.cidade} · Modalidade: {ui.tipo}</p>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <button onClick={() => onRespondUnit(ui.id, "REJECTED")} className="px-6 py-3 border border-red-500/30 text-red-500 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/10 italic flex items-center gap-2">
                        <X size={16} /> Recusar
                      </button>
                      <button onClick={() => onRespondUnit(ui.id, "ACCEPTED")} className="px-8 py-3 bg-brand-tactical text-zinc-950 text-[11px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-brand-tactical/90 hover:scale-[1.02] hover:shadow-xl hover:shadow-brand-tactical/30 transition-all italic flex items-center gap-2 shadow-lg shadow-brand-tactical/20">
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
                    } border-theme-border rounded-xl p-3 md:p-4 flex flex-col md:flex-row gap-3 md:gap-6 items-start md:items-center relative overflow-hidden transition-all group mb-3`}
                    onClick={() => isAccepted && onSelectEvent(ev)}
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${ev.captacaoStatus === "PENDING" ? "bg-amber-500" : "bg-brand-tactical"}`} />
                    
                    {/* DATA COL */}
                    <div className="min-w-[60px] flex flex-row md:flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-theme-border pb-2 md:pb-0 md:pr-4 gap-2 md:gap-0 w-full md:w-auto">
                      <div className="text-[9px] font-black text-theme-muted uppercase tracking-widest hidden md:block mb-1">DATA</div>
                      <div className="text-xl md:text-2xl font-heading font-black text-theme-text italic leading-none uppercase tracking-tighter">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold text-brand-tactical uppercase tracking-widest mt-0 md:mt-1">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                      </div>
                    </div>

                    {/* INFO COL */}
                    <div className="flex-grow space-y-3">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <h3 className="text-lg md:text-xl font-heading font-black text-theme-text uppercase italic tracking-tight leading-none">{ev.title}</h3>
                        <div className={`px-1.5 py-0.5 text-[8px] font-black border rounded-md ${ev.captacaoStatus === "ACCEPTED" ? "bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20" : "bg-amber-500/10 text-amber-500 border-amber-500/20"}`}>
                          {ev.captacaoStatus === "ACCEPTED" ? "CONFIRMADO" : "PENDENTE"}
                        </div>
                      </div>

                      {(ev.description || ev.itinerary) && (
                        <div className="space-y-1.5 pt-1">
                          {ev.description && (
                            <p className="text-xs text-theme-text/80 line-clamp-2 whitespace-pre-line leading-relaxed">{ev.description}</p>
                          )}
                          {ev.itinerary && (
                            <p className="text-xs text-theme-text/70 line-clamp-2"><strong className="text-theme-text/90 uppercase tracking-wider text-[10px]">Observações:</strong> {ev.itinerary}</p>
                          )}
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-5 items-center">
                        <div className="flex gap-2.5">
                          {ev.temFoto && <div className="p-1.5 bg-theme-bg-muted border border-theme-border text-theme-text opacity-70 rounded-xl" title="Foto"><Camera size={12} /></div>}
                          {ev.temVideo && <div className="p-1.5 bg-theme-bg-muted border border-theme-border text-theme-text opacity-70 rounded-xl" title="Vídeo"><Video size={12} /></div>}
                          {ev.temReels && <div className="p-1.5 bg-theme-bg-muted border border-theme-border text-theme-text opacity-70 rounded-xl" title="Reels/Mobile"><Smartphone size={12} /></div>}
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
                    <div className="flex flex-col items-start md:items-end gap-2 min-w-[120px] w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border">
                      <div className="flex flex-row md:flex-col gap-1.5 items-center md:items-end w-full">
                        <DeadlineTimer event={ev} type="FOTO" />
                        {ev.temVideo && <DeadlineTimer event={ev} type="VIDEO" />}
                      </div>
                      
                      {!isAccepted && !isOpportunity ? (
                        <div className="flex gap-2 w-full md:w-auto">
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "REJECTED"); }} className="p-2 border border-red-500/30 text-red-500 rounded-lg hover:bg-red-500/10 transition-all flex-1 md:flex-none flex items-center justify-center" title="Recusar">
                            <X size={14} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onDelegate(ev.id); }}
                            className="px-2 py-2 border border-brand-tactical/40 text-brand-tactical text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-tactical/10 flex-1 md:flex-none flex items-center justify-center gap-1 transition-all"
                          >
                            <Users size={12} /> DELEGAR
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "ACCEPTED"); }} className="px-3 py-2 bg-brand-tactical text-brand-text text-[8px] font-black uppercase tracking-widest rounded-lg hover:bg-brand-tactical/90 transition-all flex-1 md:flex-none flex items-center justify-center gap-1">
                            <Check size={12} /> ACEITAR
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <div className="text-[9px] font-black text-brand-tactical uppercase tracking-[0.2em] opacity-80 md:opacity-0 md:group-hover:opacity-100 transition-opacity">GERENCIAR</div>
                          <ChevronRight size={16} className="text-brand-tactical transition-all" />
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


import { useState, useEffect, useMemo } from "react";
import { Check, X, MapPin, Briefcase, ChevronRight, Camera, Video, Smartphone, Clock, Calendar, LogOut, RefreshCw, CheckCircle } from "lucide-react";
import type { EventItem, UnitInvite } from "./types";
import { CalendarView } from "./CalendarView";
import { parseDateSafe } from "../../lib/utils/formatters";

const cleanDescription = (desc: string | null | undefined) => {
  if (!desc) return desc;
  const match = desc.match(/\[BUDGET_BREAKDOWN\][\s\S]*?\n\nOriginal:\s*/);
  if (match) {
    return desc.replace(match[0], "");
  }
  return desc;
};

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
      <div className="flex items-center gap-1.5 text-brand-tactical text-[9px] font-bold uppercase tracking-widest bg-brand-tactical/10 px-2 py-1 rounded-xl border border-brand-tactical/10">
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
    <div className={`text-[9px] font-black uppercase tracking-widest italic flex items-center gap-2 px-2 py-1 rounded-xl border ${isOverdue ? "text-brand-danger bg-brand-danger/5 border-brand-danger/10" : "text-brand-warning bg-brand-warning/5 border-brand-warning/10"}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${isOverdue ? "bg-brand-danger animate-pulse" : "bg-brand-warning"}`} />
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
  opportunities: EventItem[];
  calendarStatus?: {
    connected: boolean;
    credential?: {
      calendarId?: string;
      updatedAt?: string | Date;
    };
  };
  isSyncing?: boolean;
  onConnectCalendar?: () => void;
  onDisconnectCalendar?: () => void;
  onManualSync?: () => void;
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
  opportunities,
  calendarStatus,
  isSyncing,
  onConnectCalendar,
  onDisconnectCalendar,
  onManualSync
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
            <div className="py-24 text-center text-theme-muted text-[10px] font-bold uppercase tracking-[0.4em]">
              Sincronizando Dados de Campo...
            </div>
          ) : (displayEvents.length === 0 && unitInvites.length === 0) ? (
            <div className="py-24 text-center bg-theme-bg border border-theme-border rounded-2xl text-theme-muted text-[10px] font-bold uppercase tracking-[0.2em]">
              Nenhum registro encontrado para esta visualização.
            </div>
          ) : (
            <>
              {/* Opportunities (Public Calls) */}
              {opportunities.length > 0 && opportunities.map((ev) => (
                <div
                  key={`opp-${ev.id}`}
                  onClick={() => onSelectEvent(ev)}
                  className="bg-theme-bg border border-theme-border p-4 md:p-6 rounded-2xl cursor-pointer hover:border-brand-tactical/50 transition-all flex flex-col md:flex-row gap-4 md:gap-6 group relative overflow-hidden shadow-sm hover:shadow-lg"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-tactical opacity-50 group-hover:opacity-100 transition-opacity" />
                  
                  {/* DATA COL */}
                  <div className="min-w-[60px] flex flex-row md:flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-theme-border pb-2 md:pb-0 md:pr-4 gap-2 md:gap-0 w-full md:w-auto">
                    <div className="text-[9px] font-bold text-theme-muted uppercase tracking-widest hidden md:block mb-1">DATA</div>
                    <div className="text-xl md:text-2xl font-heading font-bold text-theme-text leading-none uppercase">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                    </div>
                    <div className="text-[9px] md:text-[10px] font-bold text-brand-tactical uppercase tracking-widest mt-0 md:mt-1">
                      {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                    </div>
                  </div>

                  {/* INFO COL */}
                  <div className="flex-grow space-y-3">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <h3 className="text-lg md:text-xl font-heading font-bold text-theme-text uppercase leading-none">{ev.title}</h3>
                      <div className="px-1.5 py-0.5 text-[10px] font-bold border rounded-md bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20">
                        OPORTUNIDADE
                      </div>
                    </div>

                    {(ev.description || ev.itinerary) && (
                      <div className="space-y-1.5 pt-1">
                        {ev.description && (
                          <p className="text-xs text-theme-text/80 line-clamp-2 whitespace-pre-line leading-relaxed">{cleanDescription(ev.description)}</p>
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
                      
                      <div className="flex gap-4 text-[9px] text-theme-muted font-bold uppercase tracking-widest">
                        <span className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-tactical opacity-50" /> {ev.location || "Campo"}</span>
                        <span className="flex items-center gap-1.5"><Briefcase size={11} className="text-brand-tactical opacity-50" /> {ev.captacaoId === userId ? "CAPTAÇÃO" : "EDIÇÃO"}</span>
                        {ev.eventHours && <span className="flex items-center gap-1.5"><Clock size={11} className="text-brand-tactical opacity-50" /> {(ev.eventDays && ev.eventDays > 1) ? `${ev.eventDays}D ` : ""}{ev.eventHours}H</span>}
                      </div>
                    </div>
                  </div>

                  {/* STATUS/SLA COL */}
                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[120px] w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border">
                    <div className="flex flex-row md:flex-col gap-1.5 items-center md:items-end w-full">
                      <DeadlineTimer event={ev} type="FOTO" />
                      {ev.temVideo && <DeadlineTimer event={ev} type="VIDEO" />}
                    </div>
                    
                    <div className="flex gap-2 w-full md:w-auto mt-2">
                      <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "ACCEPTED"); }} className="px-3 py-2 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-tactical/90 transition-all flex-1 md:flex-none flex items-center justify-center gap-1">
                        <Check size={12} /> ACEITAR OPORTUNIDADE
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Unit Invites */}
              {unitInvites.length > 0 && unitInvites.map((invite) => (
                <div
                  key={`invite-${invite.id}`}
                  className="bg-brand-warning/5 border border-brand-warning/20 p-4 md:p-6 rounded-2xl flex flex-col md:flex-row gap-4 md:gap-6 group relative overflow-hidden shadow-sm"
                >
                  <div className="absolute left-0 top-0 h-full w-1.5 bg-brand-warning" />
                  
                  <div className="min-w-[60px] flex flex-row md:flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-theme-border pb-2 md:pb-0 md:pr-4 gap-2 md:gap-0 w-full md:w-auto">
                    <div className="text-[9px] font-bold text-brand-warning uppercase tracking-widest hidden md:block mb-1">DATA</div>
                    <div className="text-xl md:text-2xl font-heading font-bold text-brand-warning leading-none uppercase">
                      {parseDateSafe(invite.createdAt || new Date().toISOString()).toLocaleDateString("pt-BR", { day: "2-digit" })}
                    </div>
                  </div>

                  <div className="flex-grow space-y-3">
                    <div className="flex flex-wrap items-center gap-2 md:gap-4">
                      <h3 className="text-lg md:text-xl font-heading font-bold text-theme-text uppercase leading-none">Convite para Residência</h3>
                      <div className="px-1.5 py-0.5 text-[10px] font-bold border rounded-md bg-brand-warning/10 text-brand-warning border-brand-warning/20">
                        CONVITE
                      </div>
                    </div>
                    <p className="text-xs text-theme-text/80 leading-relaxed max-w-lg">
                      A unidade <strong>{invite.cartorio.razaoSocial}</strong> te convidou para fazer parte da equipe.
                    </p>
                    <div className="flex gap-4 text-[9px] text-theme-muted font-bold uppercase tracking-widest">
                      <span className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-warning opacity-50" /> {invite.cartorio.cidade || "N/A"}</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-start md:items-end gap-2 min-w-[120px] w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border justify-center">
                    <div className="flex gap-2 w-full md:w-auto mt-2">
                      <button onClick={() => onRespondUnit(invite.id, "REJECTED")} className="p-2 border border-brand-danger/30 text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-all flex-1 md:flex-none flex items-center justify-center" title="Recusar">
                        <X size={14} />
                      </button>
                      <button onClick={() => onRespondUnit(invite.id, "ACCEPTED")} className="px-3 py-2 bg-brand-warning text-brand-warning text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-warning transition-all flex-1 md:flex-none flex items-center justify-center gap-1">
                        <Check size={12} /> ACEITAR
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Regular Events */}
              {events.length > 0 && events.map((ev) => {
                const isOpportunity = !!opportunities.find(o => o.id === ev.id);
                const isAccepted = ev.captacaoStatus === "ACCEPTED";
                if (isOpportunity) return null; // already rendered

                return (
                  <div
                    key={ev.id}
                    onClick={() => onSelectEvent(ev)}
                    className="bg-theme-bg border border-theme-border p-4 md:p-6 rounded-2xl cursor-pointer hover:border-brand-tactical/50 transition-all flex flex-col md:flex-row gap-4 md:gap-6 group relative overflow-hidden shadow-sm hover:shadow-lg"
                  >
                    <div className={`absolute left-0 top-0 h-full w-1.5 ${ev.captacaoStatus === "PENDING" ? "bg-brand-warning" : "bg-brand-tactical"}`} />
                    
                    {/* DATA COL */}
                    <div className="min-w-[60px] flex flex-row md:flex-col items-center md:items-start border-b md:border-b-0 md:border-r border-theme-border pb-2 md:pb-0 md:pr-4 gap-2 md:gap-0 w-full md:w-auto">
                      <div className="text-[9px] font-bold text-theme-muted uppercase tracking-widest hidden md:block mb-1">DATA</div>
                      <div className="text-xl md:text-2xl font-heading font-bold text-theme-text leading-none uppercase">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { day: "2-digit" })}
                      </div>
                      <div className="text-[9px] md:text-[10px] font-bold text-brand-tactical uppercase tracking-widest mt-0 md:mt-1">
                        {parseDateSafe(ev.dataEvento).toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                      </div>
                    </div>

                    {/* INFO COL */}
                    <div className="flex-grow space-y-3">
                      <div className="flex flex-wrap items-center gap-2 md:gap-4">
                        <h3 className="text-lg md:text-xl font-heading font-bold text-theme-text uppercase leading-none">{ev.title}</h3>
                        <div className={`px-1.5 py-0.5 text-[10px] font-black border rounded-md ${ev.captacaoStatus === "ACCEPTED" ? "bg-brand-tactical/10 text-brand-tactical border-brand-tactical/20" : "bg-brand-warning/10 text-brand-warning border-brand-warning/20"}`}>
                          {ev.captacaoStatus === "ACCEPTED" ? "CONFIRMADO" : "PENDENTE"}
                        </div>
                      </div>

                      {(ev.description || ev.itinerary) && (
                        <div className="space-y-1.5 pt-1">
                          {ev.description && (
                            <p className="text-xs text-theme-text/80 line-clamp-2 whitespace-pre-line leading-relaxed">{cleanDescription(ev.description)}</p>
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
                        
                        <div className="flex gap-4 text-[9px] text-theme-muted font-bold uppercase tracking-widest">
                          <span className="flex items-center gap-1.5"><MapPin size={11} className="text-brand-tactical opacity-50" /> {ev.location || "Campo"}</span>
                          <span className="flex items-center gap-1.5"><Briefcase size={11} className="text-brand-tactical opacity-50" /> {ev.captacaoId === userId ? "CAPTAÇÃO" : "EDIÇÃO"}</span>
                          {ev.eventHours && <span className="flex items-center gap-1.5"><Clock size={11} className="text-brand-tactical opacity-50" /> {(ev.eventDays && ev.eventDays > 1) ? `${ev.eventDays}D ` : ""}{ev.eventHours}H</span>}
                        </div>
                      </div>
                    </div>

                    {/* STATUS/SLA COL */}
                    <div className="flex flex-col items-start md:items-end gap-2 min-w-[120px] w-full md:w-auto mt-2 md:mt-0 pt-2 md:pt-0 border-t md:border-t-0 border-theme-border">
                      <div className="flex flex-row md:flex-col gap-1.5 items-center md:items-end w-full">
                        <DeadlineTimer event={ev} type="FOTO" />
                        {ev.temVideo && <DeadlineTimer event={ev} type="VIDEO" />}
                      </div>
                      
                      {!isAccepted ? (
                        <div className="flex gap-2 w-full md:w-auto mt-2">
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "REJECTED"); }} className="p-2 border border-brand-danger/30 text-brand-danger rounded-lg hover:bg-brand-danger/10 transition-all flex-1 md:flex-none flex items-center justify-center" title="Recusar">
                            <X size={14} />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); onRespond(ev.id, "ACCEPTED"); }} className="px-3 py-2 bg-brand-tactical text-brand-text text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-brand-tactical/90 transition-all flex-1 md:flex-none flex items-center justify-center gap-1">
                            <Check size={12} /> ACEITAR
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                          <div className="text-[9px] font-bold text-brand-tactical uppercase tracking-[0.2em] opacity-80 md:opacity-0 pointer-events-none md:group-hover:opacity-100 transition-opacity">GERENCIAR</div>
                          <ChevronRight size={16} className="text-brand-tactical transition-all" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </>
          )}

          {/* ── Google Calendar Sync Widget (Rodapé da Agenda) ── */}
          {onConnectCalendar && (
            <div className="mt-12 space-y-6 pt-12 border-t border-theme-border">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-8 bg-brand-tactical" />
                <p className="text-[10px] font-bold text-theme-muted uppercase tracking-[0.5em]">Sincronização Externa</p>
              </div>

              {!calendarStatus?.connected ? (
                <div className="bg-theme-bg border border-theme-border rounded-2xl p-6 text-center space-y-4 shadow-sm hover:shadow-md transition-all">
                  <div className="w-12 h-12 bg-theme-card border border-theme-border rounded-xl flex items-center justify-center text-theme-muted mx-auto">
                    <Calendar size={24} />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-theme-text uppercase">Conecte sua Agenda</h3>
                    <p className="text-[10px] text-theme-muted uppercase tracking-widest max-w-sm mx-auto">
                      Sincronize seu Google Calendar para que o sistema bloqueie automaticamente sua vitrine.
                    </p>
                  </div>
                  <button 
                    onClick={onConnectCalendar}
                    className="px-6 py-3 mt-4 bg-brand-tactical text-zinc-950 text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl hover:bg-brand-tactical/90 hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    CONECTAR GOOGLE CALENDAR
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-theme-bg border border-brand-tactical/30 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between group shadow-sm gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-brand-tactical/10 border border-brand-tactical/20 rounded-xl flex items-center justify-center text-brand-tactical shrink-0">
                        <CheckCircle size={20} />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-brand-tactical uppercase tracking-widest">Status: Conectado</p>
                        <p className="text-[9px] text-theme-muted font-bold uppercase tracking-widest mt-1">
                          ID da Agenda: <span className="opacity-70">{calendarStatus.credential?.calendarId || 'N/A'}</span>
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 w-full md:w-auto">
                      <button 
                        onClick={onManualSync}
                        disabled={isSyncing}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-theme-bg-muted border border-theme-border rounded-xl text-[9px] font-bold text-theme-text uppercase tracking-widest hover:bg-theme-border/50 transition-all disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                        {isSyncing ? "Sinc..." : "Sincronizar"}
                      </button>
                      <button 
                        onClick={onDisconnectCalendar}
                        className="p-2 text-theme-muted hover:text-brand-danger hover:bg-brand-danger/10 border border-theme-border hover:border-brand-danger/20 rounded-xl transition-all cursor-pointer shrink-0"
                        title="Desconectar"
                      >
                        <LogOut size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-theme-muted font-bold uppercase tracking-widest">
                      Última sinc.: {calendarStatus.credential?.updatedAt ? new Date(calendarStatus.credential.updatedAt).toLocaleString('pt-BR') : "Nenhuma"}
                    </p>
                  </div>
                </div>
              )}
            </div>
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


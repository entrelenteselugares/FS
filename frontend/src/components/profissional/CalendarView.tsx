import { parseDateSafe } from "../../lib/utils/formatters";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { EventItem } from "./types";

interface CalendarViewProps {
  events: EventItem[];
  currentMonth: Date;
  setCurrentMonth: (d: Date) => void;
  onSelect: (ev: EventItem) => void;
}

export function CalendarView({ events, currentMonth, setCurrentMonth, onSelect }: CalendarViewProps) {
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const getEventsOnDay = (d: number) =>
    events.filter((ev) => {
      const date = parseDateSafe(ev.dataEvento);
      return date.getDate() === d && date.getMonth() === month && date.getFullYear() === year;
    });

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
  ];

  return (
    <div className="bg-theme-bg border border-theme-border p-6 md:p-10 space-y-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-tactical/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
      <div className="flex items-center justify-between border-b border-theme-border pb-8 relative z-10">
        <h3 className="text-2xl font-heading font-black text-theme-text uppercase tracking-widest italic">
          {monthNames[month]} {year}
        </h3>
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
            className="p-3 bg-theme-bg-muted border border-theme-border text-theme-muted hover:text-brand-tactical transition-all"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
            className="p-3 bg-theme-bg-muted border border-theme-border text-theme-muted hover:text-brand-tactical transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 border-t border-l border-theme-border relative z-10">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"].map((d) => (
          <div
            key={d}
            className="text-center py-5 border-r border-b border-theme-border bg-theme-bg-muted/50 text-[10px] font-black text-theme-muted uppercase italic tracking-widest"
          >
            {d}
          </div>
        ))}
        {days.map((d, i) => (
          <div
            key={i}
            className="min-h-[120px] p-3 border-r border-b border-theme-border relative hover:bg-brand-tactical/5 transition-all"
          >
            {d && (
              <>
                <span className="text-[11px] font-black text-theme-muted/40">{d}</span>
                <div className="mt-3 space-y-2">
                  {getEventsOnDay(d).map((ev) => (
                    <button
                      key={ev.id}
                      onClick={() => onSelect(ev)}
                      className="w-full text-left p-2 bg-brand-tactical text-brand-text text-[8px] font-black uppercase truncate italic shadow-sm hover:brightness-110 transition-all"
                    >
                      {ev.nomeNoivos}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


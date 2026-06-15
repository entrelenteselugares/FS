import { useMemo, useState, useEffect } from "react";

export type EventPhase =
  | "scheduled"   // criado, > 7 dias para o evento
  | "approaching" // entre 7 dias e o início
  | "live"        // evento acontecendo agora
  | "closing"     // faltam 2h para o fim
  | "critical"    // falta 1h para o fim
  | "ended"       // evento encerrado (mas QR ainda aberto por 24h)
  | "archived";   // +24h após encerramento

export interface EventStatusInfo {
  phase: EventPhase;
  /** Tailwind bg color class */
  bg: string;
  /** CSS color (hex/hsl) for use outside Tailwind */
  color: string;
  /** Tailwind shadow/glow class */
  glow: string;
  /** Full tailwind class string ready to use on a dot element */
  dotClass: string;
  label: string;
  /** Whether the status dot should pulse */
  pulse: boolean;
  /** Whether the print queue accepts new photos */
  printQueueOpen: boolean;
  /** Whether the QR code for photo capture is open */
  qrOpen: boolean;
}

/**
 * Determines the current lifecycle phase of an event and returns
 * colour tokens + labels for the status dot.
 *
 * @param eventDate   ISO string of the event's start date/time
 * @param eventEndTime ISO string of the event's scheduled end time (optional – defaults to +eventHours from start)
 * @param eventHours  Duration of the event in hours (default 2)
 * @param isExpired   Explicit expired flag from the backend
 * @param active      Whether the event is active (backend flag)
 */
export function useEventStatus(
  eventDate?: string | null,
  eventEndTime?: string | null,
  eventHours = 2,
  isExpired?: boolean,
  active?: boolean
): EventStatusInfo {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    // Atualiza a cada 1 minuto para não ter renderizações infinitas, 
    // mas ainda reagir a mudanças de status baseadas no tempo
    const timer = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(timer);
  }, []);

  return useMemo(() => {

    // --- Resolve start & end timestamps ---
    let startMs: number | null = null;
    let endMs: number | null = null;

    if (eventDate) {
      try {
        startMs = new Date(eventDate).getTime();
      } catch {
        startMs = null;
      }
    }

    if (eventEndTime) {
      try {
        endMs = new Date(eventEndTime).getTime();
      } catch {
        endMs = null;
      }
    } else if (startMs !== null) {
      // Fallback: start + eventHours
      endMs = startMs + eventHours * 60 * 60 * 1000;
    }

    // --- Derived time deltas ---
    const msUntilStart = startMs !== null ? startMs - now : null;
    const msUntilEnd   = endMs   !== null ? endMs   - now : null;
    const msSinceEnd   = endMs   !== null ? now - endMs   : null;

    const HOUR_MS = 60 * 60 * 1000;
    const DAY_MS  = 24 * HOUR_MS;
    const DAYS_7  = 7 * DAY_MS;

    // --- Decide phase ---
    let phase: EventPhase;

    if (isExpired || active === false) {
      // Backend explicitly says it's over
      phase = msSinceEnd !== null && msSinceEnd > DAY_MS ? "archived" : "ended";
    } else if (msSinceEnd !== null && msSinceEnd > DAY_MS) {
      phase = "archived";
    } else if (msUntilEnd !== null && msUntilEnd <= 0) {
      phase = "ended"; // QR still open for 24h
    } else if (msUntilStart !== null && msUntilStart <= 0) {
      // O evento já começou
      const duration = endMs !== null && startMs !== null ? endMs - startMs : 0;
      
      if (msUntilEnd !== null && msUntilEnd <= 15 * 60 * 1000) {
        phase = "critical";
      } else if (msUntilEnd !== null && msUntilEnd <= 60 * 60 * 1000 && duration > 60 * 60 * 1000) {
        phase = "closing"; // só mostra Encerrando se for evento de mais de 1h
      } else {
        phase = "live"; // caso contrário, fica Ao Vivo
      }
    } else if (msUntilStart !== null && msUntilStart <= DAYS_7) {
      phase = "approaching";
    } else {
      phase = "scheduled";
    }

    // --- Map phase → visual tokens ---
    const MAP: Record<EventPhase, Omit<EventStatusInfo, "phase" | "dotClass">> = {
      scheduled: {
        bg: "bg-brand-info",
        color: "#3b82f6",
        glow: "shadow-[0_0_15px_rgba(59,130,246,0.7)]",
        label: "Agendado",
        pulse: false,
        printQueueOpen: false,
        qrOpen: false,
      },
      approaching: {
        // interpolates visually from blue → teal → green as days pass
        // We use teal as a midpoint colour
        bg: "bg-brand-tactical",
        color: "#2dd4bf",
        glow: "shadow-[0_0_15px_rgba(45,212,191,0.6)]",
        label: "Em Breve",
        pulse: true,
        printQueueOpen: false,
        qrOpen: false,
      },
      live: {
        bg: "bg-brand-tactical",
        color: "#85b9ac",
        glow: "shadow-[0_0_15px_rgba(133,185,172,0.7)]",
        label: "Ao Vivo",
        pulse: true,
        printQueueOpen: true,
        qrOpen: true,
      },
      closing: {
        bg: "bg-brand-warning",
        color: "#facc15",
        glow: "shadow-[0_0_15px_rgba(250,204,21,0.7)]",
        label: "Encerrando",
        pulse: true,
        printQueueOpen: true,
        qrOpen: true,
      },
      critical: {
        bg: "bg-brand-warning",
        color: "#f97316",
        glow: "shadow-[0_0_15px_rgba(249,115,22,0.7)]",
        label: "Últimos Minutos",
        pulse: true,
        printQueueOpen: true,
        qrOpen: true,
      },
      ended: {
        bg: "bg-brand-danger",
        color: "#ef4444",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.7)]",
        label: "Encerrado",
        pulse: false,
        printQueueOpen: false, // no new prints
        qrOpen: true,          // QR still open for 24h after end
      },
      archived: {
        bg: "bg-zinc-600",
        color: "#52525b",
        glow: "shadow-[0_0_8px_rgba(82,82,91,0.4)]",
        label: "Arquivado",
        pulse: false,
        printQueueOpen: false,
        qrOpen: false,
      },
    };

    const tokens = MAP[phase];
    const dotClass = [
      "rounded-full",
      tokens.bg,
      tokens.glow,
      tokens.pulse ? "animate-pulse" : "",
    ]
      .filter(Boolean)
      .join(" ");

    return { phase, dotClass, ...tokens };
  }, [eventDate, eventEndTime, eventHours, isExpired, active, now]);
}

import { useEventStatus } from "../hooks/useEventStatus";

interface EventStatusDotProps {
  eventDate?: string | null;
  eventEndTime?: string | null;
  eventHours?: number;
  isExpired?: boolean;
  active?: boolean;
  /** dot size tailwind class, default "w-2.5 h-2.5" */
  size?: string;
  showLabel?: boolean;
}

/**
 * Self-contained status dot component.
 * Use this inside .map() calls where you can't call hooks directly.
 */
export function EventStatusDot({
  eventDate,
  eventEndTime,
  eventHours = 2,
  isExpired,
  active,
  size = "w-2.5 h-2.5",
  showLabel = false,
}: EventStatusDotProps) {
  const status = useEventStatus(eventDate, eventEndTime, eventHours, isExpired, active);

  return (
    <div className="flex items-center gap-2">
      <span
        className={`rounded-full ${size} ${status.dotClass} flex-shrink-0`}
        title={status.label}
      />
      {showLabel && (
        <span className="text-[9px] font-bold uppercase tracking-widest"
          style={{ color: status.color }}>
          {status.label}
        </span>
      )}
    </div>
  );
}

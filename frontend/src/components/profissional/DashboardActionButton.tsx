import { type LucideIcon } from "lucide-react";

interface DashboardActionButtonProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  onClick: () => void;
  color: "emerald" | "cyan" | "amber";
  tag?: string;
}

const colorMap = {
  emerald: {
    border: "border-brand-tactical/30",
    hoverBorder: "hover:border-brand-tactical",
    bg: "bg-brand-tactical/10",
    text: "text-theme-brand",
  },
  cyan: {
    border: "border-brand-info/30",
    hoverBorder: "hover:border-brand-info",
    bg: "bg-brand-info/10",
    text: "text-brand-info",
  },
  amber: {
    border: "border-brand-warning/30",
    hoverBorder: "hover:border-brand-warning",
    bg: "bg-brand-warning/10",
    text: "text-brand-warning",
  }
};

export function DashboardActionButton({ 
  title, 
  subtitle, 
  icon: Icon, 
  onClick, 
  color
}: DashboardActionButtonProps) {
  const styles = colorMap[color];

  return (
    <div className="relative group h-full">
      <div className={`absolute inset-0 ${styles.bg} blur-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-all duration-700`} />
      <button
        onClick={onClick}
        className={`relative w-full h-full bg-theme-bg-muted border ${styles.border} rounded-xl p-2 md:p-5 flex flex-col items-center justify-center gap-1.5 md:gap-3 ${styles.hoverBorder} transition-all overflow-hidden shadow-lg group text-center cursor-pointer`}
      >
        <div className={`p-1.5 md:p-4 ${styles.bg} border ${styles.border} ${styles.text} rounded-lg shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={14} className="md:w-6 md:h-6" />
        </div>
        <div className="space-y-0 md:space-y-1">
          <h3 className="text-[9px] md:text-sm font-heading font-bold text-theme-text uppercase leading-tight px-1 break-words line-clamp-2">
            {title}
          </h3>
          <p className="hidden md:block text-[10px] md:text-[9px] font-bold text-theme-muted uppercase tracking-[0.2em] leading-tight opacity-70">
            {subtitle}
          </p>
        </div>
      </button>
    </div>
  );
}

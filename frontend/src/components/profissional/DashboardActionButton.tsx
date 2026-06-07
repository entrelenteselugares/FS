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
    border: "border-emerald-500/30",
    hoverBorder: "hover:border-emerald-500",
    bg: "bg-emerald-500/10",
    text: "text-emerald-500",
  },
  cyan: {
    border: "border-cyan-400/30",
    hoverBorder: "hover:border-cyan-400",
    bg: "bg-cyan-400/10",
    text: "text-cyan-400",
  },
  amber: {
    border: "border-amber-400/30",
    hoverBorder: "hover:border-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-400",
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
      <div className={`absolute inset-0 ${styles.bg} blur-xl opacity-0 group-hover:opacity-100 transition-all duration-700`} />
      <button
        onClick={onClick}
        className={`relative w-full h-full bg-theme-bg-muted border ${styles.border} rounded-xl p-3 md:p-5 flex flex-col items-center justify-center gap-2 md:gap-3 ${styles.hoverBorder} transition-all overflow-hidden shadow-lg group text-center cursor-pointer`}
      >
        <div className={`p-2.5 md:p-4 ${styles.bg} border ${styles.border} ${styles.text} rounded-lg shrink-0 group-hover:scale-110 transition-transform`}>
          <Icon size={18} className="md:w-6 md:h-6" />
        </div>
        <div className="space-y-0.5 md:space-y-1">
          <h3 className="text-[10px] md:text-sm font-heading font-black text-theme-text uppercase italic leading-tight px-1">
            {title}
          </h3>
          <p className="hidden md:block text-[8px] md:text-[9px] font-black text-theme-muted uppercase tracking-[0.2em] italic leading-tight opacity-70">
            {subtitle}
          </p>
        </div>
      </button>
    </div>
  );
}

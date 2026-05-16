import { ArrowRight, type LucideIcon } from "lucide-react";

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
    accent: "bg-emerald-500",
    shadow: "shadow-emerald-500/20"
  },
  cyan: {
    border: "border-cyan-400/30",
    hoverBorder: "hover:border-cyan-400",
    bg: "bg-cyan-400/10",
    text: "text-cyan-400",
    accent: "bg-cyan-400",
    shadow: "shadow-cyan-400/20"
  },
  amber: {
    border: "border-amber-400/30",
    hoverBorder: "hover:border-amber-400",
    bg: "bg-amber-400/10",
    text: "text-amber-400",
    accent: "bg-amber-400",
    shadow: "shadow-amber-400/20"
  }
};

export function DashboardActionButton({ 
  title, 
  subtitle, 
  icon: Icon, 
  onClick, 
  color,
  tag
}: DashboardActionButtonProps) {
  const styles = colorMap[color];

  return (
    <div className="relative group h-full">
      <div className={`absolute inset-0 ${styles.bg} blur-2xl opacity-0 group-hover:opacity-100 transition-all duration-700`} />
      <button
        onClick={onClick}
        className={`relative w-full h-full bg-theme-bg-muted border ${styles.border} p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 md:gap-6 ${styles.hoverBorder} transition-all overflow-hidden shadow-2xl group`}
      >
        <div className="flex items-center gap-4 md:gap-6 text-left">
          <div className={`p-4 ${styles.bg} border ${styles.border} ${styles.text} shrink-0`}>
            <Icon size={24} />
          </div>
          <div className="space-y-1">
            {tag && (
              <span className={`text-[8px] font-black uppercase tracking-[0.3em] italic ${styles.text}`}>
                {tag}
              </span>
            )}
            <h3 className="text-xl font-heading font-black text-theme-text uppercase italic leading-none">
              {title}
            </h3>
            <p className="text-[10px] font-black text-theme-muted uppercase tracking-[0.2em] italic leading-tight max-w-[180px]">
              {subtitle}
            </p>
          </div>
        </div>
        <div className={`w-full md:w-auto flex items-center justify-end md:justify-start gap-3 text-[10px] font-black ${styles.text} uppercase tracking-[0.3em] group-hover:translate-x-2 transition-all shrink-0 mt-2 md:mt-0`}>
          INICIAR <ArrowRight size={14} />
        </div>
      </button>
    </div>
  );
}

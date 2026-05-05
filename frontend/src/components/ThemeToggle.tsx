import { useTheme } from "../contexts/ThemeContextCore";
import { Moon, Sun } from "lucide-react";
import { T } from "../lib/theme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-3 bg-white/5 border border-white/10 hover:border-brand-tactical transition-all group relative overflow-hidden"
      title={theme === 'dark' ? "Ativar Modo Diurno" : "Ativar Modo Noturno"}
    >
      <div className="relative z-10 flex items-center justify-center">
        {theme === 'dark' ? (
          <Sun size={14} className="text-brand-tactical" />
        ) : (
          <Moon size={14} className="text-slate-900" />
        )}
      </div>
      <div className="absolute inset-0 bg-brand-tactical/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

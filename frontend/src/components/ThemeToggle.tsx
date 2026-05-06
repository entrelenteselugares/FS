import { useTheme } from "../contexts/ThemeContextCore";
import { Moon, Sun } from "lucide-react";


export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="p-3 transition-all group relative overflow-hidden"
      style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 0 }}
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

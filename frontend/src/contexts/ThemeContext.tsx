import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { API } from "../lib/api";

export type Theme = "dark" | "light";

export interface ThemeCtx {
  theme: Theme;
  toggle: () => void;
  isDark: boolean;
}

export const ThemeContext = createContext<ThemeCtx>(null!);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("fs_theme") as Theme;
    return saved ?? "dark";
  });

  // ── Sync Theme (Light/Dark) ──
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    localStorage.setItem("fs_theme", theme);
  }, [theme]);

  // ── Fetch Brand Identity (Dynamic Colors) ──
  useEffect(() => {
    API.get("/public/configs/theme")
      .then(({ data }) => {
        // SEGURANÇA: Bloqueia o verde olive legado e força o azul #85B9AC
        const isLegacy = (hex: string) => ["#5A6231", "#5a6231", "#5D6532", "#5d6532", "#ADC2BD", "#adc2bd"].includes(hex);
        
        const primary = isLegacy(data.brand_primary) ? "#85B9AC" : data.brand_primary;
        const tactical = isLegacy(data.brand_tactical) ? "#85B9AC" : data.brand_tactical;

        if (primary) {
          document.documentElement.style.setProperty("--brand-primary", primary);
        }
        if (tactical) {
          document.documentElement.style.setProperty("--brand-tactical", tactical);
        }
      })
      .catch(err => console.warn("Could not load dynamic theme:", err));
  }, []);

  const toggle = () => setTheme(t => t === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

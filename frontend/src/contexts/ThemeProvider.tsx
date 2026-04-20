import React, { useEffect, useState } from "react";
import { ThemeContext } from "./ThemeContext";
import type { Theme } from "./ThemeContext";
import { API } from "../lib/api";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  // ── Sync Theme (Light/Dark) ──
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("light", "dark");
    root.classList.add(theme);
    localStorage.setItem("theme", theme);
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

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

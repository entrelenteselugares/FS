import { useEffect, useState, type ReactNode } from "react";

import { ThemeContext, type Theme } from "./ThemeContextCore";



export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem("fs-theme") as Theme) || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    if (theme === 'dark') {
      document.documentElement.classList.remove("light");
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.classList.add("light");
    }
    localStorage.setItem("fs-theme", theme);
    console.log(`[Theme] Active Mode: ${theme.toUpperCase()}`);
  }, [theme]);

  const toggle = () => setTheme(prev => prev === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggle, isDark: theme === "dark" }}>
      {children}
    </ThemeContext.Provider>
  );
}

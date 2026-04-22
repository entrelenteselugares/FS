import { createContext, useContext } from "react";

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

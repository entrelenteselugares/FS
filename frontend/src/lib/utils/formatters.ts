/**
 * Centralized formatting utilities for Foto Segundo
 * Midnight Luxury Design System
 */

/**
 * Formats a number as Brazilian Real (BRL)
 */
export const formatCurrency = (val: number = 0) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

/**
 * Parses an ISO string (YYYY-MM-DD) safely to avoid timezone shifts.
 * If the string doesn't include time (T), it's parsed as a local date.
 */
export const parseDateSafe = (iso: string | null | undefined): Date => {
  if (!iso) return new Date(NaN);
  return iso.includes("T") ? new Date(iso) : new Date(iso.replace(/-/g, "/"));
};

/**
 * Formats an ISO string or Date to short Brazilian format (e.g., 03 MAI 2026)
 */
export const formatDateShort = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = parseDateSafe(iso);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
    .format(d)
    .toUpperCase();
};

/**
 * Formats an ISO string to full Brazilian locale date
 */
export const formatDateLocale = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = parseDateSafe(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("pt-BR");
};

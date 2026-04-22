import type React from "react";

/**
 * T — Tokens de Tema (Foto Segundo Design System)
 *
 * Use em TODOS os componentes React. Nunca hardcode hex.
 *
 * @example
 *   import { T } from "../lib/theme";
 *   <div style={{ background: T.bgCard, color: T.text }}>
 */
export const T = {
  // ── Backgrounds ───────────────────────────────────
  bg:      "var(--bg)",       // #0a0a0a
  bgCard:  "var(--bg-card)",  // #111111
  bgField: "var(--bg-field)", // #0c0c0c

  // ── Borders ───────────────────────────────────────
  border:  "var(--border)",   // #1c1c1c
  border2: "var(--border-2)", // #2a2a2a

  // ── Typography ────────────────────────────────────
  text:  "var(--text)",   // #f0ede8
  text2: "var(--text-2)", // #999999
  text3: "var(--text-3)", // #555555

  // ── Brand (TEAL — nunca usar #8a9a5b) ─────────────
  brand:       "var(--brand)",        // #85B9AC
  brandDark:   "var(--brand-dark)",   // #0d1f1d
  brandBorder: "var(--brand-border)", // #1a3530

  // ── Font Families ─────────────────────────────────
  fontD: "var(--font-d)", // Barlow Condensed — Display (900, uppercase)
  fontB: "var(--font-b)", // Inter            — Body (300-500)
} as const;

export type ThemeKey = keyof typeof T;

// ─────────────────────────────────────────────────────────────────────────────
// Btn — Estilos de Botão (Parte 2)
// ─────────────────────────────────────────────────────────────────────────────

/** Botão primário accent (brand teal, fundo escuro) */
export const BtnPrimary: React.CSSProperties = {
  background:    T.brand,
  color:         "#0a0a0a",
  border:        "none",
  padding:       "13px 24px",
  fontFamily:    T.fontD,
  fontWeight:    900,
  fontSize:      14,
  letterSpacing: 2,
  textTransform: "uppercase",
  cursor:        "pointer",
  display:       "inline-flex",
  alignItems:    "center",
  gap:           8,
  transition:    "opacity 0.2s",
};

/** Botão secundário outline */
export const BtnSecondary: React.CSSProperties = {
  background:    "transparent",
  color:         T.text2,
  border:        `1px solid ${T.border2}`,
  padding:       "11px 20px",
  fontFamily:    T.fontB,
  fontSize:      12,
  fontWeight:    400,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  cursor:        "pointer",
  display:       "inline-flex",
  alignItems:    "center",
  gap:           8,
  transition:    "border-color 0.2s, color 0.2s",
};

/** Botão ghost compacto (usado na nav e tabelas) */
export const BtnGhost: React.CSSProperties = {
  background:    "transparent",
  color:         T.text3,
  border:        `1px solid ${T.border}`,
  padding:       "8px 14px",
  fontFamily:    T.fontB,
  fontSize:      11,
  fontWeight:    400,
  letterSpacing: 1.2,
  textTransform: "uppercase",
  cursor:        "pointer",
  transition:    "color 0.2s, border-color 0.2s",
};

// ─────────────────────────────────────────────────────────────────────────────
// Input — Estilos de Campo (Parte 2)
// ─────────────────────────────────────────────────────────────────────────────

/** Wrapper de campo com label */
export const FieldWrap: React.CSSProperties = { marginBottom: 14 };

/** Label de campo (10px, uppercase, rastreado) */
export const FieldLabel: React.CSSProperties = {
  fontSize:      10,
  letterSpacing: 1.5,
  textTransform: "uppercase",
  color:         T.text3,
  display:       "block",
  marginBottom:  6,
  fontFamily:    T.fontB,
  fontWeight:    400,
};

/** Input padrão */
export const FieldInput: React.CSSProperties = {
  width:      "100%",
  background: T.bgField,
  border:     `1px solid ${T.border2}`,
  padding:    "11px 14px",
  fontSize:   13,
  color:      T.text,
  fontFamily: T.fontB,
  fontWeight: 300,
  outline:    "none",
  borderRadius: 0,
};

/** Select padrão */
export const FieldSelect: React.CSSProperties = {
  ...FieldInput,
  cursor: "pointer",
};

// ─────────────────────────────────────────────────────────────────────────────
// Card — Estilos de Card (Parte 2)
// ATENÇÃO: borderRadius ZERO em todos os cards.
// ─────────────────────────────────────────────────────────────────────────────

export const Card: React.CSSProperties = {
  background:   T.bgCard,
  border:       `1px solid ${T.border}`,
  borderRadius: 0,
  padding:      "1.25rem",
};

export const CardCompact: React.CSSProperties = {
  ...Card,
  padding: "0.875rem 1rem",
};

// ─────────────────────────────────────────────────────────────────────────────
// Badge — Estilos de Status (Parte 2)
// ─────────────────────────────────────────────────────────────────────────────

export const Badge = {
  /** APROVADO / ATIVO */
  approved: {
    background:   T.brandDark,
    border:       `1px solid ${T.brandBorder}`,
    color:        T.brand,
    padding:      "3px 10px",
    fontSize:     10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontFamily:   T.fontB,
    fontWeight:   500,
    display:      "inline-block",
  },
  /** PENDENTE / AGUARDANDO */
  pending: {
    background:   "#1a0d00",
    border:       "1px solid #3a2000",
    color:        "#f59e0b",
    padding:      "3px 10px",
    fontSize:     10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontFamily:   T.fontB,
    fontWeight:   500,
    display:      "inline-block",
  },
  /** ERRO / RECUSADO / CANCELADO */
  rejected: {
    background:   "#1a0a0a",
    border:       "1px solid #3a1a1a",
    color:        "#f87171",
    padding:      "3px 10px",
    fontSize:     10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontFamily:   T.fontB,
    fontWeight:   500,
    display:      "inline-block",
  },
  /** PROCESSANDO / EM TRÂNSITO */
  processing: {
    background:   "#0d0d1a",
    border:       "1px solid #1a1a3a",
    color:        "#818cf8",
    padding:      "3px 10px",
    fontSize:     10,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
    fontFamily:   T.fontB,
    fontWeight:   500,
    display:      "inline-block",
  },
} as const;

/**
 * Retorna o estilo de badge correspondente ao status de um pedido/item.
 * @param status — string do banco: "APROVADO", "PENDENTE", "REJEITADO", "CANCELADO", etc.
 */
export function getBadgeStyle(status?: string | null): React.CSSProperties {
  const s = (status ?? "").toUpperCase();
  if (s === "APROVADO" || s === "APPROVED" || s === "ACTIVE" || s === "PAID")
    return Badge.approved;
  if (s === "PENDENTE" || s === "PENDING" || s === "PRICED")
    return Badge.pending;
  if (s === "PROCESSANDO" || s === "PROCESSING" || s === "PRINTING" || s === "SHIPPED")
    return Badge.processing;
  return Badge.rejected; // REJEITADO, CANCELADO, EXPIRED, etc.
}

// ─────────────────────────────────────────────────────────────────────────────
// S — Estilos pré-compostos (backwards compat + convenência)
// ─────────────────────────────────────────────────────────────────────────────

export const S = {
  card:       Card,
  cardCompact: CardCompact,
  field:      FieldInput,
  label:      FieldLabel,
  fieldWrap:  FieldWrap,
  btnPrimary: BtnPrimary,
  btnSecondary: BtnSecondary,
  btnGhost:   BtnGhost,
  badge:      Badge,
  divider:    { borderTop: `1px solid ${T.border}` } as React.CSSProperties,
  heading: {
    fontFamily:    T.fontD,
    fontWeight:    900,
    textTransform: "uppercase" as const,
    letterSpacing: "0.5px",
    lineHeight:    1.05,
    color:         T.text,
  } as React.CSSProperties,
} as const;



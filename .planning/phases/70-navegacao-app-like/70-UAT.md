---
status: complete
phase: 70-navegacao-app-like
source: []
started: 2026-06-12T11:38:00Z
updated: 2026-06-12T11:38:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Mobile Header Minimalista
expected: Acessar o site via celular. O topo da tela deve exibir apenas o logo e o botão de carrinho. O menu do usuário, login e alternador de tema não devem aparecer no topo, mas sim no Drawer (ao clicar em "Opções" na BottomNav).
result: pass

### 2. Comportamento Nativo (Overscroll)
expected: Ao rolar a página para baixo rapidamente a partir do topo, o navegador não deve acionar o "pull-to-refresh" nativo. Textos do app não devem ficar selecionados em azul ao arrastar/segurar a tela (exceto campos de input).
result: pass

### 3. Smooth View Transitions
expected: Ao clicar em links de navegação para outras páginas internas, a tela deve realizar um cross-fade rápido (esmaecer e surgir) ao invés de piscar uma tela branca.
result: fixed
reported: "esta com bug, quand clico 'painel da franquia', passa identificar o usuario como admin do sistema"
severity: major
fix: "BottomNav.tsx role leak fixed — isProOrFranchise now strict role check only (commit 0af8d0b)"

## Summary

total: 3
passed: 2
issues: 1
pending: 0
skipped: 0

## Gaps

- truth: "Ao clicar em links de navegação para outras páginas internas, a tela deve realizar um cross-fade rápido (esmaecer e surgir) ao invés de piscar uma tela branca."
  status: failed
  reason: "User reported: esta com bug, quand clico 'painel da franquia', passa identificar o usuario como admin do sistema"
  severity: major
  test: 3
  artifacts: []
  missing: []


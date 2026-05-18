---
status: complete
phase: bugfix-isguest
source: []
started: 2026-05-18T13:24:00Z
updated: 2026-05-18T13:30:45Z
---

## Current Test

number: 1
name: Separação de Mídias PRO vs CONVIDADOS
expected: |
  Acesse a Galeria Pública do evento de teste (`/e/matheus-kurió-sr71` ou equivalente).
  1. Clicar na aba "CONVIDADOS".
  2. As fotos das panelas (#F001, #F002, etc.) devem ser exibidas exclusivamente nesta aba, já que não foram enviadas pelo profissional da captação.
  3. Clicar na aba "PRO".
  4. As fotos das panelas NÃO devem aparecer aqui.
awaiting: user response

## Tests

### 1. Separação de Mídias PRO vs CONVIDADOS
expected: As fotos de convidados devem ser renderizadas na aba "CONVIDADOS" e filtradas da aba "PRO".
result: pass

## Summary

total: 1
passed: 1
issues: 0
pending: 0
skipped: 0

## Gaps


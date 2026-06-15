---
status: complete
phase: hotfix-performance-sticky-navbar
source: []
started: 2026-06-14T23:19:00Z
updated: 2026-06-14T23:41:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Navbar fixa no scroll da EventPage (Android)

expected: Navbar permanece fixa no topo ao rolar a galeria de fotos para baixo no Android
result: pass

### 2. Galeria carrega imagens por lotes (virtualização)

expected: |
Ao entrar em um evento com 50+ fotos, apenas as primeiras 24 aparecem inicialmente.
Conforme você rola para baixo, mais 24 fotos vão aparecendo.
Um indicador de "Carregando mais X fotos..." aparece no final da lista.
result: pass

### 3. Vídeos na galeria não iniciam automaticamente

expected: |
Fotos de vídeo (shortId começando com 'V') na grade da galeria mostram
apenas um ícone ▶ estático — eles NÃO iniciam reprodução automática.
O vídeo só toca quando aberto em tela cheia.
result: pass

### 4. Imagens carregam progressivamente (lazy loading)

expected: |
Ao rolar rapidamente a galeria, imagens fora da tela aparecem como
esqueleto/placeholder cinza e carregam à medida que entram no viewport
(±200px). Não deve haver travamento de scroll durante o carregamento.
result: pass

### 5. Performance geral da galeria no Android

expected: |
Entrar em evento com 20+ fotos no Android. O scroll deve ser fluido,
sem engasgar ou travar. A lentidão anterior ao carregar imagens deve
estar notavelmente reduzida.
result: pass

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps

[none yet]

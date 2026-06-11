---
status: complete
phase: 35-grow
source: [35A-GROWTH-API-SUMMARY.md, 35B-GROWTH-UI-SUMMARY.md]
started: 2026-06-11T23:28:00Z
updated: 2026-06-11T23:28:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Cold Start Smoke Test
expected: Kill any running server/service. Clear ephemeral state (temp DBs, caches, lock files). Start the application from scratch. Server boots without errors, any seed/migration completes, and a primary query (health check, homepage load, or basic API call) returns live data.
result: pass

### 2. Admin Growth Dashboard Access
expected: Como admin, ao acessar o menu e clicar em "Growth", a nova interface `AdminGrowth` é carregada com as abas Cupons, Afiliados, Motor WhatsApp e Analytics visíveis.
result: issue
reported: "index-Bd5kzmi5.js:2 [SENTRY] Frontend inicializado. ... /api/public/events?type=WORLD_CUP&page=1:1  Failed to load resource: the server responded with a status of 500 () ..."
severity: blocker

### 3. Coupon Creation & Validation
expected: Como admin, criar um cupom de teste (ex: "BEMVINDO") do tipo PERCENTAGE com 50% de desconto. Em seguida, ir até a página de um Evento como cliente, adicionar fotos ao carrinho e abrir o Checkout. O campo "Tem um Cupom Especial?" deve estar visível e, ao aplicar "BEMVINDO", o desconto de 50% deve ser calculado no total final.
result: pass

### 4. 100% Discount / Free Rescue
expected: Criar um cupom de FRETE GRÁTIS ou 100% de desconto. No Checkout, ao aplicá-lo, a UI deve esconder o Mercado Pago Brick e exibir o botão "Resgate Gratuitamente", finalizando o pedido diretamente.
result: pass

### 5. Affiliate Management
expected: Como admin, na aba Afiliados do menu Growth, você deve ver a lista de Embaixadores. Alterar o select de "Tipo de Pagamento" entre PIX e CREDIT deve disparar o toast de sucesso e salvar a preferência corretamente.
result: issue
reported: "esta com bug, clico em transferencia pix e continua credito patforma"
severity: major

### 6. WhatsApp Status Monitor
expected: Como admin, na aba "Motor WhatsApp", o sistema deve exibir se a sessão está ativa ou exibir um QR Code para leitura caso o motor não esteja autenticado.
result: issue
reported: "clico e ao acontece nada, sera que eh proque eh versao local?"
severity: major

## Summary

total: 6
passed: 3
issues: 3
pending: 0
skipped: 0

## Gaps

- truth: "Como admin, ao acessar o menu e clicar em "Growth", a nova interface `AdminGrowth` é carregada com as abas Cupons, Afiliados, Motor WhatsApp e Analytics visíveis."
  status: failed
  reason: "User reported: index-Bd5kzmi5.js:2 [SENTRY] Frontend inicializado.\nindex-Bd5kzmi5.js:2 [Theme] Active Mode: DARK\ntoolbar.js:15 [MozBar] RPC Client initialized - URL: https://api.moz.com/jsonrpc, Mode: production\ntoolbar.js:69 [MozBar] Toolbar content script initialized\ntoolbar.js:69 [MozBar] Applying theme: dark\ntoolbar.js:48 [MozBar] Removed all link highlights\ntoolbar.js:50 [MozBar] Theme loaded from storage: system\ntoolbar.js:50 [MozBar] Theme state initialized: Object\n/api/auth/me:1  Failed to load resource: the server responded with a status of 401 ()\n/api/public/events?type=WORLD_CUP&page=1:1  Failed to load resource: the server responded with a status of 500 ()\nindex-Bd5kzmi5.js:2 The width(-1) and height(-1) of chart should be greater than 0,\n       please check the style of container, or the props width(100%) and height(100%),\n       or add a minWidth(0) or minHeight(undefined) or use aspect(undefined) to control the\n       height and width.\n(anonymous) @ index-Bd5kzmi5.js:2"
  severity: blocker
  test: 2
  artifacts: []
  missing: []

- truth: "Como admin, na aba Afiliados do menu Growth, você deve ver a lista de Embaixadores. Alterar o select de "Tipo de Pagamento" entre PIX e CREDIT deve disparar o toast de sucesso e salvar a preferência corretamente."
  status: failed
  reason: "User reported: esta com bug, clico em transferencia pix e continua credito patforma"
  severity: major
  test: 5
  artifacts: []
  missing: []

- truth: "Como admin, na aba "Motor WhatsApp", o sistema deve exibir se a sessão está ativa ou exibir um QR Code para leitura caso o motor não esteja autenticado."
  status: failed
  reason: "User reported: clico e ao acontece nada, sera que eh proque eh versao local?"
  severity: major
  test: 6
  artifacts: []
  missing: []

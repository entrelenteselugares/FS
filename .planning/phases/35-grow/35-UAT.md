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
result: pass

### 3. Coupon Creation & Validation
expected: Como admin, criar um cupom de teste (ex: "BEMVINDO") do tipo PERCENTAGE com 50% de desconto. Em seguida, ir até a página de um Evento como cliente, adicionar fotos ao carrinho e abrir o Checkout. O campo "Tem um Cupom Especial?" deve estar visível e, ao aplicar "BEMVINDO", o desconto de 50% deve ser calculado no total final.
result: pass

### 4. 100% Discount / Free Rescue
expected: Criar um cupom de FRETE GRÁTIS ou 100% de desconto. No Checkout, ao aplicá-lo, a UI deve esconder o Mercado Pago Brick e exibir o botão "Resgate Gratuitamente", finalizando o pedido diretamente.
result: pass

### 5. Affiliate Management
expected: Como admin, na aba Afiliados do menu Growth, você deve ver a lista de Embaixadores. Alterar o select de "Tipo de Pagamento" entre PIX e CREDIT deve disparar o toast de sucesso e salvar a preferência corretamente.
result: pass

### 6. WhatsApp Status Monitor
expected: Como admin, na aba "Motor WhatsApp", o sistema deve exibir se a sessão está ativa ou exibir um QR Code para leitura caso o motor não esteja autenticado.
result: pass

## Summary

total: 6
passed: 6
issues: 0
pending: 0
skipped: 0

## Gaps

Nenhum gap remanescente.

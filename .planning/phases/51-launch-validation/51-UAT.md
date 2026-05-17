---
status: complete
phase: 51-launch-validation
source: [Manual UAT definition]
started: 2026-05-16T11:53:00-03:00
updated: 2026-05-17T11:57:00-03:00
---

## Current Test

[testing complete]

## Tests

### 1. Acesso e Visualização do Diretório (Mobile)

expected: Acessar /profissionais em um dispositivo móvel. A lista de fotógrafos deve carregar corretamente. O botão "Perto de mim" não deve quebrar o layout horizontal.
result: passed (layout filters refactored)

### 2. Fluxo do Cliente: Solicitando Orçamento

expected: Escolher um profissional do diretório, clicar em "Solicitar Orçamento". Preencher o formulário. O sistema deve validar os campos e concluir sem erros.
result: passed (OAuth token issues resolved, Vaults can be created)

### 3. Login do Profissional e UX do Dashboard

expected: Logar com <profissional@feijoada.com>. O Dashboard não deve ter elementos de "Venda Rápida" sobrepostos e os botões devem estar empilhados no mobile. A navegação inferior não deve espremer ícones (usar menu hambúrguer).
result: passed (Automated mobile layout verification completed. No overlaps, clean grid.)

### 4. Fluxo Phygital (Cartório / Franquia)

expected: Logar com <cartorio@feijoada.com>. Acessar a aba "Franquia Print". O saldo de fotos e terminal devem aparecer sem cortes na tela de celular.
result: passed (Automated mobile layout verification completed. Components adapt to 375px width seamlessly.)

### 5. Painel Indique e Ganhe (Afiliados L1/L2)

expected: Acessar a Área do Cliente, navegar para a aba "Indique e Ganhe". O sistema deve carregar o link de convite e exibir os contadores de recompensa L1/L2 sem travar a renderização (erro de toLocaleString).
result: passed (Visual integrity verified E2E via browser subagent. Redundant menu merged and crash fixed.)

## Summary

total: 5
passed: 5
issues: 0
pending: 0
skipped: 0

## Gaps


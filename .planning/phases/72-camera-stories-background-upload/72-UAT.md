---
status: testing
phase: 72-camera-stories-background-upload
source: [72-PLAN.md]
started: 2026-06-14T12:09:00Z
updated: 2026-06-14T12:09:00Z
---

## Current Test

number: 1
name: Camera Stories Non-Blocking Capture
expected: |
  Ao capturar uma foto usando o botão da câmera na tela Phygital Capture, não deve aparecer a tela cheia de bloqueio ("Enviando Foto"). O usuário deve conseguir clicar novamente no botão da câmera quase que instantaneamente para capturar a próxima foto, enquanto a anterior começa a enviar na grade (grid) inferior.
awaiting: user response

## Tests

### 1. Camera Stories Non-Blocking Capture
**Status:** [ ] pending
**Expected:** Ao capturar uma foto usando o botão da câmera na tela Phygital Capture, não deve aparecer a tela cheia de bloqueio ("Enviando Foto"). O usuário deve conseguir clicar novamente no botão da câmera quase que instantaneamente para capturar a próxima foto, enquanto a anterior começa a enviar na grade (grid) inferior.

### 2. Global Background Upload
**Status:** [ ] pending
**Expected:** Enquanto as fotos estiverem enviando (aparecendo na grade com ícone de carregamento), navegue para outra página do app (ex: clique em Voltar). Os envios não devem ser cancelados e devem continuar ocorrendo silenciosamente (você pode verificar o terminal de rede ou voltar na tela Phygital para ver se terminaram).

### 3. Offline Queue Persistence (IndexedDB)
**Status:** [ ] pending
**Expected:** Capture uma ou duas fotos. Enquanto elas estiverem carregando, feche a aba/app completamente (recarregue a página de forma abrupta). Ao abrir o app novamente e ir para a tela Phygital Capture, as fotos devem reaparecer na grade de envios e retomar o upload automaticamente.

## Issues Found

*(None yet)*

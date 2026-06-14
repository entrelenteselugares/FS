---
status: complete
phase: 71-engajamento-via-push-e-camera-nativa
source: [manual-extraction]
started: 2026-06-12T12:48:00Z
updated: 2026-06-14T11:52:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Push Notification Registration
expected: |
  Acessar o aplicativo em um dispositivo móvel ou no Chrome e fazer login.
  O console do navegador (DevTools) deve exibir "[PUSH] Checking subscription..." e então registrar com sucesso o Service Worker para Push, sem erros de VAPID key (agora sincronizado na Vercel).
result: pass

### 2. Câmera Nativa Direta no Upload
expected: |
  No dispositivo móvel, acesse a página de um álbum (ex: VaultDetailPage).
  Ao clicar no botão de adicionar/fazer upload de foto, o celular deve abrir **diretamente** a interface da Câmera Traseira (native camera environment mode), sem passar por aquele menu intermediário do sistema operacional que pergunta "Câmera ou Arquivos?".
result: pass

### 3. Loop de Câmera Nativa e Persistência de Fila (IndexedDB)
expected: |
  Clicar em Câmera no EventPage ou BottomNav. O app deve abrir a câmera nativa em modo foto. Capturar várias fotos clicando em OK. Fechar/cancelar a câmera nativa. O usuário deve retornar ao PhygitalCapture com todas as fotos salvas na fila de upload. Atualizar a página e verificar se os itens permanecem.
result: pass

## Summary

total: 3
passed: 3
issues: 0
pending: 0
skipped: 0

## Gaps


---
status: testing
phase: bugfix-general
source: []
started: 2026-06-09T17:25:00Z
updated: 2026-06-09T17:25:00Z
---

## Current Test
<!-- OVERWRITE each test - shows where we are -->

number: 1
name: "1. Download de Álbuns Íntegro"
expected: |
  Acesse um álbum no Vault (`VaultDetailPage.tsx`), clique no botão para baixar o ZIP do álbum. 
  O arquivo deve ser baixado com sucesso e extraído/aberto normalmente no sistema operacional, sem apresentar aviso de arquivo corrompido.
awaiting: user response

## Tests

### 1. Download de Álbuns Íntegro
expected: "Acesse um álbum no Vault, baixe o ZIP. O arquivo deve abrir sem avisos de corrupção."
result: [pending]

### 2. Grid de 2 Colunas no Checkout
expected: "Acesse a tela de Checkout em um monitor desktop. Os itens do carrinho devem estar listados em 2 colunas lado-a-lado, e não todos empilhados numa única coluna vertical."
result: [pending]

### 3. Grid de 3 Colunas na Equipe
expected: "Acesse a visualização da Equipe (`TeamTab.tsx`) em desktop. Os cards de profissionais devem estar dispostos em um grid de até 3 colunas, melhorando o uso do espaço horizontal."
result: [pending]

### 4. Zoom do Crop Suave
expected: "Abra a ferramenta de upload de Foto de Perfil ou Capa de Evento. Ao arrastar a barra (slider) de zoom, o movimento da imagem deve ser extremamente suave e contínuo, sem os pulos/engasgos drásticos anteriores."
result: [pending]

### 5. Toggle de Venda de Fotos (Marca d'água)
expected: "Acesse as configurações do Evento. Mude o toggle de 'Venda de Fotos' para desligado (vermelho). Faça o upload de uma foto. A nova foto deve ser processada e exibida SEM a marca d'água da Foto Segundo."
result: [pending]

## Summary

total: 5
passed: 0
issues: 0
pending: 5
skipped: 0

## Gaps

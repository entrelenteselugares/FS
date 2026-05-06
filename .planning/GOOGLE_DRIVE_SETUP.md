# 📂 Guia de Integração: Google Drive Cold Storage (Cofres de Memórias)

Esta documentação serve como referência técnica para a arquitetura de armazenamento do **Foto Segundo**, consolidada em Maio de 2026 após a resolução de gargalos de cota de armazenamento.

## 🏗️ Arquitetura de Conexão (Híbrida)

O sistema foi projetado para suportar dois métodos de autenticação, priorizando a estabilidade e a cota de armazenamento:

1.  **OAuth2 (Refresh Token) - [RECOMENDADO]**:
    *   **Por que usar:** Em contas pessoais do Google (Gmail), as Service Accounts possuem **0MB** de cota de armazenamento. O OAuth2 permite que o servidor atue em nome do usuário, utilizando os 15GB+ de espaço da conta principal.
    *   **Variáveis no `.env`:** `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, `GOOGLE_DRIVE_REFRESH_TOKEN`.

2.  **Service Account (JWT) - [FALLBACK]**:
    *   **Por que usar:** Ideal para Google Workspace (contas empresariais) que utilizam **Shared Drives** (Drives Compartilhados), onde a cota é do Drive e não da conta individual.
    *   **Variáveis no `.env`**: `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.

## ⚙️ Configuração do Ambiente (`.env`)

```env
# Root Folder onde todos os cofres serão criados
GOOGLE_DRIVE_ROOT_FOLDER_ID="ID_DA_PASTA_RAIZ"

# Configuração OAuth2 (Cota do Usuário)
GOOGLE_DRIVE_CLIENT_ID="..."
GOOGLE_DRIVE_CLIENT_SECRET="..."
GOOGLE_DRIVE_REFRESH_TOKEN="..."
```

## 🚀 Fluxo de Upload e Resiliência

*   **Buffer Temporário:** Arquivos são gravados no `os.tmpdir()` antes do upload para garantir que o tamanho do stream seja conhecido (necessário para estabilidade na Vercel).
*   **Exponential Backoff:** Implementamos o helper `withRetry` que realiza até 3 tentativas com atraso progressivo em caso de falhas de rede (Erro 429, 503).
*   **Permissões Automáticas:** Todo arquivo enviado recebe a permissão `reader:anyone` para que o App e o Frontend consigam exibir as miniaturas via `thumbnailLink` nativo do Google.

## 🛑 Troubleshooting (Lições Aprendidas)

*   **Erro 403 (storageQuotaExceeded):** Se o erro for "Service Accounts do not have storage quota", significa que você está tentando usar uma Service Account em uma conta pessoal. Mude para o modo OAuth2/Refresh Token.
*   **Erro 404 (File not found):** Verifique se o `GOOGLE_DRIVE_ROOT_FOLDER_ID` foi compartilhado com o e-mail da Service Account (se estiver usando esse modo) ou se o ID pertence à conta logada no OAuth2.
*   **Quebras de linha na Private Key:** O sistema limpa automaticamente os `\n` literais usando `.replace(/\\n/g, '\n')`.

---
*Referência Técnica consolidada por Antigravity (IA) e Kurio.*

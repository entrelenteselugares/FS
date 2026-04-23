# Changelog Recente: Foto Segundo

## 2026-04-22 (Sessão Anterior)

### 🚀 Novas Funcionalidades
- **Self-Service Privacy (Área do Cliente)**: Clientes agora podem alternar a privacidade de seus eventos entre PÚBLICO e PRIVADO diretamente em seus painéis.
- **Smart Professional Allocation**: Automatização da escala de profissionais vinculados a Unidades Fixas.

### 🛠️ Estabilidade e Infraestrutura
- **Zero-Any TS Compliance**: Refatoração das páginas `AdminEvents` e `CheckoutPage`.
- **HMR/Fast Refresh Optimization**: Refatoração do `ThemeContext`.

## 2026-04-23 (Sessão Atual)

### 📊 Dashboard e BI (Admin Tower)
- **Sequential Stats Sync**: Refatoração do carregamento do dashboard para processamento sequencial, eliminando erros 500 intermitentes causados por concorrência de pool no ambiente serverless (Vercel).
- **KPI Reliability**: Corrigido o mismatch de nomes de campos (`activeEvents` vs `totalEvents`) e adicionados fallbacks de segurança para garantir que o dashboard nunca exiba cards vazios ou "NaN".
- **Real-time Debug Mode**: Implementado log de depuração no console do Admin para auditoria instantânea dos dados recebidos da API.

### 🔐 Segurança e Acesso
- **Temporary Password Persistence**: Adicionado o campo `tempPassword` ao modelo `Order` no Prisma. Agora, a senha provisória gerada no checkout é persistida e incluída nos e-mails de boas-vindas enviados via Webhook/Polling.
- **Pix Key Persistence (Unidade Fixa)**: Corrigida a persistência e exibição da chave PIX no painel do parceiro, garantindo que os dados bancários sejam carregados corretamente após o login.

### 🎨 Branding e UX
- **Official Favicon Sync**: Substituído o ícone das guias pelo logotipo oficial minimalista "FS Luxury", reforçando a identidade visual da marca em todas as páginas.
- **Dynamic Editorial Covers**: Implementado fallback dinâmico para capas de eventos. Eventos sem foto agora exibem automaticamente uma capa editorial elegante com logo e nome do evento em degradê.

### 🛠️ Correções Técnicas
- **TS Build Fixes**: Resolvido erro de tipagem no `EventPage.tsx` que impedia o build na Vercel devido a tratamento incompleto de mensagens de erro de pagamento.
- **Local QR Generator**: Removida dependência de API externa para QR Code Pix, implementando geração nativa via `qrcode.react` para carregamento instantâneo no Checkout.

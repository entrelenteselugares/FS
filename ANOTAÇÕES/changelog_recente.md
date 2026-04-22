# Changelog Recente: Foto Segundo

## 2026-04-22 (Sessão Atual)

### 🚀 Novas Funcionalidades
- **Self-Service Privacy (Área do Cliente)**: Clientes agora podem alternar a privacidade de seus eventos entre PÚBLICO e PRIVADO diretamente em seus painéis.
  - Mudança para Público: Extensão automática para 90 dias de validade.
  - Mudança para Privado: Redução para 15 dias de validade.
- **Smart Professional Allocation**: Automatização da escala de profissionais. Ao criar um evento vinculado a uma Unidade Fixa pelo Admin, o sistema agora atribui automaticamente o profissional marcado como **FIXO** daquela unidade, eliminando o status "Sem Profissional Designado".

### 🛠️ Estabilidade e Infraestrutura
- **Zero-Any TS Compliance**: Refatoração completa das páginas `AdminEvents` e `CheckoutPage` para remover todos os tipos `any`, garantindo 100% de segurança de tipos no build de produção.
- **HMR/Fast Refresh Optimization**: Refatoração do `ThemeContext` em uma arquitetura split (Core + Provider) para resolver avisos de Fast Refresh do Vite e acelerar o desenvolvimento local.
- **Default Theme Adjustment**: Alterado o tema padrão inicial para **Light (Diurno)** para novos usuários, mantendo a persistência da escolha do usuário via localStorage.

### 🧹 Manutenção de Dados
- **Limpeza de Pedidos**: Removidos registros de pedidos redundantes/pendentes antigos (ex: #7EASFU3Y) para manter a integridade financeira.
- **Luxury Style Fixes**: Finalizada a migração visual de todos os campos de formulário no Admin para o padrão **Midnight Luxury**.

### 🐞 Correções de Build (Vercel)
- Resolvidos erros `TS1382` (sintaxe JSX), `TS2304` (propriedades ausentes) e `TS2345/TS2339` (tipagem de interfaces de eventos).

# Phase 35: Growth & Retention Hub - Context

## Domain

Construção de ferramentas para alavancar vendas e engajamento. Isso inclui um sistema de cupons dinâmicos, um painel para embaixadores/afiliados (com links rastreáveis), automação de recuperação de carrinho abandonado e integração com WhatsApp para notificações.

## Decisions

### 1. Gestão de Cupons

- **Modelo:** Os cupons serão genéricos (ex: `VERAO20`, aplicáveis a quem tiver o código).
- **Uso Combinado:** O sistema deve aceitar **apenas um cupom por pedido**. O empilhamento de cupons não será permitido.

### 2. Modelo de Afiliados/Embaixadores

- **Rastreamento:** O link de afiliado irá gravar um cookie válido por **30 dias**.
- **Comissionamento e Resgate:** A plataforma deve suportar uma configuração individual por embaixador. O administrador deve poder escolher se o embaixador "X" recebe as comissões como **créditos na plataforma** ou se tem liberação para solicitar **saque direto via PIX**.

### 3. E-mails de Carrinho Abandonado

- **Gatilho de Disparo:** O sistema enviará um único e-mail de recuperação exatamente **24 horas** após a criação do pedido (carrinho) sem pagamento concluído.

### 4. Integração WhatsApp

- **Infraestrutura:** Utilizar o caminho extra-oficial via leitura de QR Code (ex: **Evolution API** ou **Baileys / WWebJS**) embutido no backend para não gerar custos por mensagem.
- O sistema precisará de uma tela administrativa para ler o QR Code da API e autenticar a sessão do robô disparador.

## Out of Scope

- Configuração de Chatbots complexos de atendimento no WhatsApp (O escopo é focado em envio de notificações transacionais de Growth).
- Múltiplos e-mails em cascata para carrinho abandonado (restrito ao disparo de 24 horas por agora).

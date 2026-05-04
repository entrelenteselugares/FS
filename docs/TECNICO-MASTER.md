# Documentação Técnica: Ecossistema Foto Segundo

## Versão: 1.0 (Auditoria Completa) | Status: Blindado

## 1. Motor de Pedidos Unificado (Order Engine)

O motor de pedidos centraliza a inteligência de vendas B2C, B2B e Ponto Fixo.

- **Venda Expressa**: Permite que fotógrafos em pontos fixos realizem vendas instantâneas em "um clique", criando automaticamente o cliente, o evento e o pedido.
- **Estados do Pedido**:
  - `PENDENTE`: Aguardando liquidação (PIX/Cartão).
  - `APROVADO`: Liquidação confirmada. Ativa o processamento de mídias.
  - `CANCELADO`: Estorno ou desistência.

## 2. Arquitetura de Impressão (Printer Agent)

O sistema Phygital utiliza um agente local desacoplado para garantir impressões instantâneas sem depender da estabilidade constante da nuvem.

- **Protocolo**: O backend sinaliza a venda aprovada via WebSocket/Polling.
- **Spooler**: O Agente de Impressão (Printer Agent) captura a imagem em alta resolução, aplica processamento local e despacha para o driver do sistema (CUPS/Windows Spooler).
- **Créditos**: Unidades Fixas consomem créditos de impressão pré-pagos gerenciados pelo Admin.

## 3. Modelo de Comissões e Split

A inteligência financeira utiliza o `PricingService` para realizar a divisão exata de valores:

- **Marketplace**: Divisões configuráveis entre Matriz, Captação (Vendedor), Edição (Editor) e Unidade (Cartório).
- **Venda Direta (10% Fixa)**: Modelo simplificado onde a plataforma retém 10% do bruto, e o restante é líquido para o profissional, descontadas as taxas de gateway.
- **Comissão Passiva B2B**: Bonificação automática para franqueadores que indicam profissionais ativos na rede.

## 4. Diretrizes de Segurança e Qualidade

- **Blindagem de Dados**: Todo o conteúdo é processado com marca d'água dinâmica antes da visualização pública.
- **Autenticação**: Baseada em JWT com tokens de acesso e refresh.

## 5. Gamificação V2 (Arquitetura de Fidelidade)

O ecossistema de gamificação incentiva a performance profissional e a lealdade do cliente através de incentivos financeiros e de status.

- **GamificationLedger**: Registro imutável de todas as transações de pontos e créditos. Atua como o "livro-razão" de recompensas para garantir integridade e auditabilidade.
- **Cashback do Cliente**: Devolução automática de 5% sobre o valor de pedidos no marketplace, creditada como `rewardCredits` para uso em novas compras ou impressões.
- **Pontos de Agilidade (SLA)**: Recompensa para profissionais que realizam a entrega de galerias (upload de links) em menos de 24h após o término do evento.
- **Tiering de Franquia**: Sistema de níveis (Bronze, Silver, Gold, Diamond) que promove franqueados automaticamente com base no volume de vendas aprovadas, desbloqueando prestígio e benefícios na rede.

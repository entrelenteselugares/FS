# Changelog Recente - Foto Segundo

Este documento registra as atualizações críticas realizadas para estabilização da plataforma e lançamento da versão "Midnight Luxury".

## 🚀 Abril 2026 - Sprint: Checkout Unificado & Integridade Financeira

### 💳 Pagamentos e Conversão

- **Checkout Unificado**: Substituição completa do paywall legado pelo novo checkout premium, oferecendo suporte nativo a Pix e cartão com resumo detalhado.
- **Selo 3x Sem Juros**: Implementação de sinalização visual estratégica no checkout para aumentar o ticket médio e conversão.
- **Auto-preenchimento Inteligente**: Integração com o perfil do usuário para preencher Nome, E-mail e WhatsApp automaticamente no fluxo de orçamento.

### 📊 Gestão Financeira e Auditoria

- **Auditoria por Projeto**: Refatoração da tela de pedidos para agrupar transações por Evento, eliminando a percepção de "duplicidade" em parcelas.
- **Trava de Sequenciamento**: Regra de negócio que bloqueia o pagamento da "Quitação" até que a "Reserva" seja confirmada, garantindo liquidez imediata.
- **Status Unificado**: Novo motor de status (QUITADO, PARCIAL, PENDENTE) para visão rápida da saúde financeira de cada projeto.

### 🏢 Unidades Fixas (Cartórios)

- **Automação de Regras de Unidade**: A `QuotePage` agora respeita dinamicamente as flags `fixedTime` e `hideDuration` configuradas no Admin.
- **UX Adaptativo**: Ocultação automática de seletores de tempo e duração para unidades que operam com modelos de preço fixo.

### 🧹 Estabilização Técnica

- **Type Safety Audit**: Correção de erros críticos de tipagem no `EventPage` e `QuotePage` que causavam falhas de build na Vercel.
- **Limpeza de Imports**: Remoção de bibliotecas e ícones não utilizados para otimização de performance.

---
> [!NOTE]
> Próximo foco: Monitoramento de Webhooks do Mercado Pago para automação total de liberações.

---
> [!NOTE]
> Próximo foco: Integração de notificações WhatsApp via CallMeBot para novos orçamentos.

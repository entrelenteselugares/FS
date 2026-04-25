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

### 🎨 Rede de Profissionais & UX
- **Sistema de Convites de Parceria**: Implementação do fluxo de "Aceite de Unidade Fixa". O profissional agora recebe convites e deve aceitar formalmente para ser exibido como residente de uma unidade.
- **Selo de Artista Residente**: Visualização dinâmica no dashboard do profissional, destacando parcerias ativas com unidades fixas.
- **Painel Técnico Premium**: Refatoração do modal de perfil para permitir a gestão detalhada de habilidades e equipamentos, seguindo o padrão Midnight Luxury.

### 🧹 Estabilização Técnica & Build
- **JSX Structural Fix**: Resolução de erros críticos de fechamento de tags no `ProfissionalDashboard.tsx` que impediam o build de produção.
- **Prisma Schema V2**: Evolução da tabela `CartorioProfissional` para suportar estados de convite (`PENDING`, `ACCEPTED`, `REJECTED`).
- **Type Safety Audit**: Eliminação de erros de tipagem no `profissional.controller.ts` e garantia de compilação limpa em todo o backend.

---
> [!IMPORTANT]
> A plataforma agora garante que nenhum profissional seja vinculado a uma unidade sem seu consentimento explícito.

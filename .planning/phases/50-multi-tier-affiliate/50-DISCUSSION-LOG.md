# Phase 50 Discussion Log: Multi-Tier Network Affiliate System

## 👥 Participants

- **Visionary/Founder:** USER
- **Builder/Agent:** Antigravity

## 📅 Discussion Details

- **Date:** 2026-05-17
- **Target Phase:** Phase 50 (Multi-Tier Network Affiliate System)

---

## 💬 Discussion Highlights & Choices

### 1. Profundidade da Rede e Comissões

- **Opções Apresentadas:**
  - Opção A: 2 Níveis de indicação (Direta + Indireta).
  - Opção B: 3 Níveis de indicação (Direta + Indireta + 3º nível).
  - Opção C: Configuração totalmente dinâmica de níveis pelo admin.
- **Decisão do Usuário:** Escolhido o modelo de **2 Níveis** (Opção A) com simulação matemática integrada de splits.
- **Simulação Aprovada:**
  - Nível 1 (Direto): 5%
  - Nível 2 (Indireto - Apenas VIPs): 2%
  - Overhead Total: 7% (extremamente seguro e não afeta as margens operacionais).

### 2. Controle de Saturação (Regra dos 50 VIPs)

- **Opções Apresentadas:**
  - Opção A: Primeiro 50 usuários ganham VIP automaticamente, outros vêem botão para pedir aprovação.
  - Opção B: Todo usuário pode pedir aprovação, primeiros 50 cliques garantem atalho VIP automático.
- **Decisão do Usuário:** Deixar a regra de **50 VIPs** transparente. Usuários pós-50 continuam participando do programa padrão de indicações direta de **Nível 1 (5%)**, mantendo a experiência consistente e natural. O Administrador pode eleger novos VIPs (multinível) manualmente a qualquer momento pelo painel `/admin/users`.

### 3. Modelagem de Dados

- **Decisão:** Criação de relação recursiva autorreferencial na tabela `users` (`referredById` referenciando `id` do pai). Essa modelagem permite que o backend suba a árvore de indicação até 2 níveis no momento do pagamento de comissão.

### 4. Interface (UI)

- **Decisão:** Integração perfeita do painel de afiliados à aba `/minha-conta` do usuário. O menu exibe opções completas de árvore multinível para VIPs e opções simplificadas de indicação simples para usuários STANDARD.

---

_Log generated successfully on 2026-05-17._

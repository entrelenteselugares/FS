# Guia do Sistema de Micro-Franquias de Impressão
**Versão:** v1.0 | **Última atualização:** 02/05/2026

---

## 1. Visão Estratégica

O módulo de **Micro-Franquias** transforma a Foto Segundo em uma **rede B2B2C de impressão descentralizada**. Em vez de a empresa operar um único ponto de impressão, qualquer fotógrafo parceiro pode se tornar um **Ponto de Impressão Phygital** dentro da sua região.

### Modelo de Créditos (Wallet Interna)
O repasse financeiro é feito via **créditos de impressão pré-pagos** — um modelo de carteira digital interna que elimina a necessidade de split de pagamentos em tempo real e burocracia de gateways. Cada crédito = 1 foto impressa.

---

## 2. Arquitetura de Dados

### Princípio Fundamental: Role Não Muda
> [!IMPORTANT]
> A promoção a franqueado **NÃO altera o `role` do usuário**. O fotógrafo permanece `PROFISSIONAL`. A capacidade de franquia é sinalizada pela **existência de um `FranchiseProfile` vinculado ao `userId`**.

```
User (role: PROFISSIONAL)
  └── FranchiseProfile?  ← presença = capacidade de franquia ativa
        ├── printCredits: Int     ← saldo atual de impressões
        ├── active: Boolean       ← ponto habilitado/suspenso
        └── CreditTransaction[]   ← ledger de movimentações
```

### Modelos Prisma Envolvidos
| Model | Tabela | Descrição |
|---|---|---|
| `FranchiseProfile` | `FranchiseProfile` | Perfil de franquia (1:1 com User) |
| `CreditTransaction` | `CreditTransaction` | Extrato de créditos (RECHARGE / CONSUME) |

---

## 3. API de Franquias (Backend)

**Base path**: `/api/admin/franchises`  
**Auth**: `requireAuth + requireRole("ADMIN")` em todos os endpoints

| Método | Rota | Controller | Descrição |
|---|---|---|---|
| `GET` | `/admin/franchises` | `listAll` | Lista usuários com FranchiseProfile |
| `POST` | `/admin/franchises/promote` | `promote` | Ativa franquia para usuário existente |
| `POST` | `/admin/franchises/credits` | `addCredits` | Recarrega créditos (registra no ledger) |
| `PATCH` | `/admin/franchises/:profileId/toggle` | `toggleActive` | Habilita/suspende o ponto |
| `DELETE` | `/admin/franchises/:profileId` | `remove` | Remove o FranchiseProfile (não deleta o usuário) |
| `GET` | `/admin/franchises/:profileId/statement` | `getStatement` | Extrato das últimas 50 transações |

### Multi-tenancy
- **ADMIN**: vê todos os franqueados da rede
- **Não-ADMIN**: vê apenas o próprio `FranchiseProfile` (filtrado por `userId`)

---

## 4. Frontend — Painel Admin (`AdminFranchises.tsx`)

### Ações disponíveis na tabela:
| Botão | Ícone | Cor | Função |
|---|---|---|---|
| Adicionar Créditos | `CreditCard` | Teal | Abre modal com seletor +100/-100 |
| Desativar / Reativar | `PowerOff / Power` | Âmbar / Verde | Chama `/toggle` |
| Remover Franquia | `Trash2` | Vermelho | Deleta o `FranchiseProfile` com confirmação |

### Modal "Novo Franqueado":
- Filtra lista de usuários: exclui `ADMIN` e quem **já tem** `franchiseProfile`
- Chama `POST /admin/franchises/promote` → cria o `FranchiseProfile` sem alterar o `role`

---

## 5. Frontend — Painel do Profissional (`ProfissionalDashboard.tsx`)

A aba **"Franquia Print"** aparece automaticamente no menu lateral quando o endpoint `GET /profissional/me` retorna `user.franchiseProfile !== null`.

### O que o franqueado vê:
- **Saldo de créditos** (número grande, fica âmbar quando < 50)
- **Status** do ponto (Ativo / Inativo)
- **Banner de alerta** quando saldo < 50 fotos

> [!NOTE]
> O profissional **não pode se auto-recarregar**. Para adicionar créditos, o Admin deve acessar o painel de Franquias → botão CreditCard → confirmar recarga.

---

## 6. Fluxo Operacional Completo

```
Admin cria franquia
  → POST /admin/franchises/promote { userId }
  → FranchiseProfile criado (printCredits: 0, active: true)
  → Fotógrafo vê aba "Franquia Print" no seu dashboard

Admin recarrega créditos
  → POST /admin/franchises/credits { profileId, amount, description }
  → printCredits += amount (transação atômica via prisma.$transaction)
  → CreditTransaction criada (type: RECHARGE)

Convidado escaneia QR Code no evento
  → Motor Phygital processa foto
  → printer-agent (IoT) imprime na Epson L3250
  → printCredits -= 1 (type: CONSUME) [a implementar]

Admin monitora saldo
  → GET /admin/franchises → vê saldo atual
  → GET /admin/franchises/:id/statement → extrato completo
```

---

## 7. Backlog / Próximos Passos

- [ ] **Consumo automático de crédito**: Integrar dedução no fluxo do `PhygitalController` ao confirmar impressão
- [ ] **Alerta proativo**: Notificação WhatsApp ao Admin quando saldo de algum ponto < 50
- [ ] **Relatório de franqueado**: Mostrar histórico de transações no painel do profissional (já tem endpoint `getStatement`)
- [ ] **Transferência de créditos**: Permitir que Admin mova créditos entre pontos da rede
- [ ] **Renovação automática por pack**: Planos mensais de créditos com renovação automática

---

## 8. Regras Inegociáveis

> [!IMPORTANT]
> **Nunca mudar o `role` do usuário para `FRANCHISEE`** ao ativar uma franquia. Use exclusivamente `franchiseProfile.upsert`. O role `FRANCHISEE` foi depreciado em 02/05/2026.

> [!WARNING]
> O `role = FRANCHISEE` ainda existe no `ProtectedRoute` e `DashboardRedirect` como **fallback de compatibilidade** para usuários que possam ter sido promovidos antes da depreciação. Esses usuários são redirecionados para `/profissional`.

> [!NOTE]
> Todo endpoint de `/admin/franchises` exige `requireRole("ADMIN")`. Nenhum franqueado acessa diretamente as rotas admin — ele acessa apenas via `GET /profissional/me` que inclui o `franchiseProfile` na resposta.

---

*Arquivo: `SISTEMA_FRANQUIAS.md` | Módulo: Expansão Phygital*

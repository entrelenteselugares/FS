# 🧹 SCRIPT SQL DE LIMPEZA - FOTO SEGUNDO

Este script foi projetado para resetar o ambiente de produção/testes, eliminando dados transacionais e gerados por usuários, enquanto preserva a infraestrutura de catálogo e perfis.

## ⚠️ AVISO DE SEGURANÇA

Este comando é **irreversível**. Execute-o apenas quando desejar zerar as operações do sistema.

---

## SQL para o Editor do Supabase

```sql
-- 1. LIMPEZA DE PEDIDOS E VENDAS
TRUNCATE TABLE "order_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "orders" RESTART IDENTITY CASCADE;

-- 2. LIMPEZA DE OPERAÇÕES PHYGITAL
TRUNCATE TABLE "phygital_prints" RESTART IDENTITY CASCADE;

-- 3. LIMPEZA DE EVENTOS, MÍDIAS E INTERAÇÕES
TRUNCATE TABLE "event_media" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "photo_likes" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "calendar_slots" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "events" RESTART IDENTITY CASCADE;

-- 4. LIMPEZA DE FINANCEIRO E CRÉDITOS
TRUNCATE TABLE "credit_transactions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "print_redemptions" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "user_points" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "payout_items" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "weekly_payouts" RESTART IDENTITY CASCADE;

-- 5. LIMPEZA DE ORÇAMENTOS E LEADS
TRUNCATE TABLE "quotes" RESTART IDENTITY CASCADE;

-- 6. LIMPEZA DE LOGS E PROMOCIONAIS
TRUNCATE TABLE "audit_logs" RESTART IDENTITY CASCADE;
TRUNCATE TABLE "contests" RESTART IDENTITY CASCADE;

-- NOTA: O comando RESTART IDENTITY reseta os contadores de ID (Serial/Autoincrement)
-- O modificador CASCADE garante que registros vinculados sejam removidos na ordem correta.
```

---

## 🛡️ O QUE É PRESERVADO (NÃO APAGAR)

As seguintes tabelas **não** são afetadas por este script, garantindo que o sistema continue configurado:

1. **users**: Seus logins e senhas permanecem ativos.
2. **profissionais / cartorios / franchise_profiles**: Os perfis e especialidades continuam lá.
3. **service_catalog**: O catálogo mestre de serviços (Fotografia, Vídeo, etc) é mantido.
4. **print_products**: Os produtos de impressão configurados são mantidos.
5. **platform_configs**: Suas taxas e chaves de configuração permanecem.
6. **professional_services**: Os serviços que cada fotógrafo já configurou para si são mantidos.
7. **print_suppliers**: Seus fornecedores de impressão continuam cadastrados.

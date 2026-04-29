-- ============================================================================
-- TRIGGER: Deleção em cascata ao remover usuário do Supabase Auth
-- ============================================================================
-- Como aplicar:
--   1. Acesse o Supabase Dashboard do projeto
--   2. Vá em: SQL Editor → New Query
--   3. Cole este SQL completo e clique em "Run"
--
-- O que isso faz:
--   Quando um usuário é deletado de auth.users (pelo dashboard ou pela API),
--   este trigger dispara automaticamente e remove TODOS os dados relacionados
--   do banco da aplicação (public.*), na ordem correta de dependências.
-- ============================================================================

-- 1. Função principal que executa a limpeza em cascata
CREATE OR REPLACE FUNCTION public.handle_user_deletion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER  -- Executa com privilégios de superusuário para acessar todas as tabelas
SET search_path = public
AS $$
DECLARE
  v_user_id TEXT := OLD.id::TEXT;
  v_prof_ids TEXT[];
  v_cartorio_ids TEXT[];
  v_owned_event_ids TEXT[];
  v_all_order_ids TEXT[];
BEGIN
  RAISE LOG '[USER DELETION] Iniciando limpeza para userId: %', v_user_id;

  -- ── 1. PhotoLikes ────────────────────────────────────────────────────────
  DELETE FROM photo_likes WHERE "userId" = v_user_id;

  -- ── 2. PrintRedemptions ──────────────────────────────────────────────────
  DELETE FROM print_redemptions WHERE "userId" = v_user_id;

  -- ── 3. UserPoints ────────────────────────────────────────────────────────
  DELETE FROM user_points WHERE "userId" = v_user_id;

  -- ── 4. ProfessionalNetwork (favoritos em ambas as direções) ──────────────
  DELETE FROM professional_networks
  WHERE "userId" = v_user_id OR "partnerId" = v_user_id;

  -- ── 5. Coletar IDs dos eventos PRÓPRIOS do usuário (como cartorioUserId) ──
  SELECT ARRAY(
    SELECT id FROM events WHERE "cartorioUserId" = v_user_id
  ) INTO v_owned_event_ids;

  -- ── 6. Se há eventos próprios, limpa todos os filhos ─────────────────────
  IF array_length(v_owned_event_ids, 1) > 0 THEN

    -- Coleta todas as orders desses eventos
    SELECT ARRAY(
      SELECT id FROM orders WHERE "eventId" = ANY(v_owned_event_ids)
    ) INTO v_all_order_ids;

    -- Remove order_items das orders
    IF array_length(v_all_order_ids, 1) > 0 THEN
      DELETE FROM order_items WHERE "orderId" = ANY(v_all_order_ids);
    END IF;

    -- Remove orders dos eventos
    DELETE FROM orders WHERE "eventId" = ANY(v_owned_event_ids);

    -- Remove media dos eventos
    DELETE FROM event_media WHERE "eventId" = ANY(v_owned_event_ids);

    -- Remove likes dos eventos
    DELETE FROM photo_likes WHERE "eventId" = ANY(v_owned_event_ids);

    -- Remove os eventos
    DELETE FROM events WHERE id = ANY(v_owned_event_ids);

    RAISE LOG '[USER DELETION] Eventos próprios removidos: %', array_length(v_owned_event_ids, 1);
  END IF;

  -- ── 7. Orders onde é cliente (eventos de outros) ──────────────────────────
  SELECT ARRAY(
    SELECT id FROM orders WHERE "clienteId" = v_user_id
  ) INTO v_all_order_ids;

  IF array_length(v_all_order_ids, 1) > 0 THEN
    DELETE FROM order_items WHERE "orderId" = ANY(v_all_order_ids);
    DELETE FROM orders WHERE id = ANY(v_all_order_ids);
  END IF;

  -- ── 8. Desvincula eventos onde é captação/edição (não deleta o evento) ────
  UPDATE events SET
    "captacaoId" = NULL,
    "captacaoStatus" = 'PENDING'
  WHERE "captacaoId" = v_user_id;

  UPDATE events SET
    "edicaoId" = NULL,
    "edicaoStatus" = 'PENDING'
  WHERE "edicaoId" = v_user_id;

  -- ── 9. Desvincula orders onde é editor ───────────────────────────────────
  UPDATE orders SET "editorId" = NULL WHERE "editorId" = v_user_id;

  -- ── 10. Perfil Profissional e seus filhos ─────────────────────────────────
  SELECT ARRAY(
    SELECT id FROM profissionais WHERE "userId" = v_user_id
  ) INTO v_prof_ids;

  IF array_length(v_prof_ids, 1) > 0 THEN
    DELETE FROM cartorio_profissionais WHERE "profissionalId" = ANY(v_prof_ids);
    DELETE FROM professional_services WHERE "profissionalId" = ANY(v_prof_ids);
    DELETE FROM profissionais WHERE id = ANY(v_prof_ids);
    RAISE LOG '[USER DELETION] Perfil profissional removido.';
  END IF;

  -- ── 11. Perfil Cartório e seus filhos ────────────────────────────────────
  SELECT ARRAY(
    SELECT id FROM cartorios WHERE "userId" = v_user_id
  ) INTO v_cartorio_ids;

  IF array_length(v_cartorio_ids, 1) > 0 THEN
    DELETE FROM cartorio_profissionais WHERE "cartorioId" = ANY(v_cartorio_ids);
    DELETE FROM cartorios WHERE id = ANY(v_cartorio_ids);
    RAISE LOG '[USER DELETION] Perfil cartório removido.';
  END IF;

  -- ── 12. AuditLogs (mantém para conformidade, apenas anonimiza) ───────────
  UPDATE audit_logs SET "userId" = NULL WHERE "userId" = v_user_id;

  -- ── 13. Remove o usuário da tabela pública ────────────────────────────────
  DELETE FROM users WHERE id = v_user_id;

  RAISE LOG '[USER DELETION] ✅ Limpeza completa para userId: %', v_user_id;

  RETURN OLD;
END;
$$;

-- 2. Remove trigger antigo (se existir) para evitar duplicata
DROP TRIGGER IF EXISTS on_auth_user_deleted ON auth.users;

-- 3. Cria o trigger na tabela auth.users do Supabase
CREATE TRIGGER on_auth_user_deleted
  AFTER DELETE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_deletion();

-- 4. Verifica se o trigger foi criado corretamente
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_deleted';

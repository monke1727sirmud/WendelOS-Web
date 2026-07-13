/*
# Fix function security: immutable search_path + restrict EXECUTE grants

Issues addressed:
1. Mutable search_path on get_user_usage, create_user_quota, set_updated_at
   — Fixed by adding SET search_path = '' and fully-qualifying all table/type references.
2. anon + authenticated roles can call SECURITY DEFINER functions directly via RPC
   — Fixed by revoking EXECUTE from PUBLIC/anon/authenticated on functions that
     must not be called directly.

Changes:
- get_user_usage:     SET search_path = '', REVOKE from anon+authenticated, GRANT to authenticated only (it needs it for quota reads)
- create_user_quota:  SET search_path = '', REVOKE from anon+authenticated entirely (trigger-only, no direct RPC needed)
- set_updated_at:     SET search_path = '' (if it exists), no EXECUTE change needed (SECURITY INVOKER is fine)
- is_username_taken:  REVOKE from anon+authenticated (anon should not probe usernames)
*/

-- ── 1. get_user_usage ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_usage(uid uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT json_build_object(
    'files_count',          (SELECT COUNT(*)               FROM public.files        WHERE user_id = uid),
    'folders_count',        (SELECT COUNT(*)               FROM public.files        WHERE user_id = uid AND type = 'folder'),
    'storage_bytes',        (SELECT COALESCE(SUM(size_bytes), 0) FROM public.files  WHERE user_id = uid),
    'notes_count',          (SELECT COUNT(*)               FROM public.notes        WHERE user_id = uid),
    'events_count',         (SELECT COUNT(*)               FROM public.events       WHERE user_id = uid),
    'installed_apps_count', (SELECT COUNT(*)               FROM public.installed_apps WHERE user_id = uid)
  );
$$;

-- Revoke broad execute, then grant only to authenticated (anon never needs quota data)
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_usage(uuid) TO authenticated;

-- ── 2. create_user_quota ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_user_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- This is a trigger function — no role should be able to call it directly via RPC
REVOKE EXECUTE ON FUNCTION public.create_user_quota() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_user_quota() FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_user_quota() FROM authenticated;

-- ── 3. set_updated_at (fix search_path only — keep existing grants) ───────────
DO $$
BEGIN
  -- Only patch if the function exists (it was created in an earlier migration)
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'set_updated_at'
  ) THEN
    EXECUTE $f$
      CREATE OR REPLACE FUNCTION public.set_updated_at()
      RETURNS trigger
      LANGUAGE plpgsql
      SECURITY INVOKER
      SET search_path = ''
      AS $body$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $body$
    $f$;
  END IF;
END;
$$;

-- ── 4. is_username_taken — revoke anon execute ───────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'is_username_taken'
  ) THEN
    REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM PUBLIC;
    REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM anon;
    REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM authenticated;
    -- Re-grant to authenticated only (signed-in users checking username availability)
    GRANT  EXECUTE ON FUNCTION public.is_username_taken(text) TO authenticated;
  END IF;
END;
$$;

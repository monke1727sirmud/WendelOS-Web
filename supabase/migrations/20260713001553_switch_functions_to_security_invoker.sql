-- Switch both functions to SECURITY INVOKER.
-- All queried tables have RLS enabled, so the calling user's own policies
-- govern what rows are visible — no definer privileges needed.

CREATE OR REPLACE FUNCTION public.get_user_usage(uid uuid)
RETURNS json
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT json_build_object(
    'files_count',          (SELECT COUNT(*)                    FROM public.files         WHERE user_id = uid),
    'folders_count',        (SELECT COUNT(*)                    FROM public.files         WHERE user_id = uid AND type = 'folder'),
    'storage_bytes',        (SELECT COALESCE(SUM(size_bytes),0) FROM public.files         WHERE user_id = uid),
    'notes_count',          (SELECT COUNT(*)                    FROM public.notes         WHERE user_id = uid),
    'events_count',         (SELECT COUNT(*)                    FROM public.events        WHERE user_id = uid),
    'installed_apps_count', (SELECT COUNT(*)                    FROM public.installed_apps WHERE user_id = uid)
  );
$$;

-- Revoke from everyone; authenticated users can still call it via RPC because
-- SECURITY INVOKER + RLS means they only ever see their own rows.
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_usage(uuid) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.get_user_usage(uuid) TO authenticated;

-- is_username_taken: SECURITY INVOKER — profiles has RLS, so the query runs
-- as the caller.  The SELECT policy on profiles must allow this; if profiles
-- has a public-read policy for username uniqueness checks, that is intentional.
CREATE OR REPLACE FUNCTION public.is_username_taken(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY INVOKER
STABLE
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE username = p_username);
$$;

REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_username_taken(text) FROM authenticated;
GRANT  EXECUTE ON FUNCTION public.is_username_taken(text) TO authenticated;

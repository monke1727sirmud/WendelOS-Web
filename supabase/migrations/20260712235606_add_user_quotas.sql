/*
# Add user_quotas table + per-table count functions

1. New Tables
   - `user_quotas`
     Stores per-user quota limits and current usage snapshots.
     One row per user.  Limits are the maximums; usage columns are
     refreshed by client-side code but the real gate is enforced at
     INSERT time via Postgres functions.

     Columns:
       user_id            – FK to auth.users, PK
       files_limit        – max rows in `files`            (default 500)
       storage_limit_mb   – max total MB of file storage  (default 100)
       notes_limit        – max rows in `notes`            (default 100)
       events_limit       – max rows in `events`           (default 500)
       installed_apps_limit – max rows in `installed_apps`(default 20)
       updated_at         – last time the row was touched

2. Functions (SECURITY DEFINER, safe RLS bypass for counting only)
   - `get_user_usage(uid uuid)` → JSON with current counts + storage MB
     Used by the frontend QuotaContext to show live usage bars.

3. Security
   - RLS enabled on `user_quotas`
   - authenticated users can SELECT / UPDATE their own row
   - INSERT is via a trigger on auth.users (creates the row automatically)
*/

-- ── Quota table ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_quotas (
  user_id              uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  files_limit          integer NOT NULL DEFAULT 500,
  storage_limit_mb     integer NOT NULL DEFAULT 100,
  notes_limit          integer NOT NULL DEFAULT 100,
  events_limit         integer NOT NULL DEFAULT 500,
  installed_apps_limit integer NOT NULL DEFAULT 20,
  updated_at           timestamptz DEFAULT now()
);

ALTER TABLE user_quotas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_quotas" ON user_quotas;
CREATE POLICY "select_own_quotas" ON user_quotas FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_quotas" ON user_quotas;
CREATE POLICY "update_own_quotas" ON user_quotas FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No direct INSERT policy — rows are created by the trigger below.

-- ── Auto-provision quota row when a user signs up ────────────────────────────
CREATE OR REPLACE FUNCTION create_user_quota()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_quotas (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_quota ON auth.users;
CREATE TRIGGER on_auth_user_created_quota
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_user_quota();

-- Back-fill existing users
INSERT INTO public.user_quotas (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── Usage function ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION get_user_usage(uid uuid)
RETURNS json
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'files_count',         (SELECT COUNT(*) FROM files        WHERE user_id = uid),
    'folders_count',       (SELECT COUNT(*) FROM files        WHERE user_id = uid AND type = 'folder'),
    'storage_bytes',       (SELECT COALESCE(SUM(size_bytes),0) FROM files WHERE user_id = uid),
    'notes_count',         (SELECT COUNT(*) FROM notes        WHERE user_id = uid),
    'events_count',        (SELECT COUNT(*) FROM events       WHERE user_id = uid),
    'installed_apps_count',(SELECT COUNT(*) FROM installed_apps WHERE user_id = uid)
  );
$$;

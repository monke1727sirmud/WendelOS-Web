/*
# WendelOS profiles table - username to email mapping

1. New Tables
- `profiles` — stores a unique username for each auth user, plus the synthetic
  email used internally by Supabase Auth (format: `<username>@wendelos.local`).
  This lets users sign in with a username + password while Supabase Auth still
  operates with an email under the hood.

2. Security
- RLS enabled on `profiles`.
- Owner-scoped CRUD: each authenticated user can only read/write their own profile row.
- user_id defaults to auth.uid() so inserts that omit it still succeed.
- A SECURITY DEFINER function `is_username_taken` allows anon + authenticated
  callers to check username availability before signing up.
*/

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  synthetic_email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_profile" ON profiles;
CREATE POLICY "delete_own_profile" ON profiles FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION is_username_taken(p_username text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM profiles WHERE username = p_username);
$$;

GRANT EXECUTE ON FUNCTION is_username_taken(text) TO anon, authenticated;

CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

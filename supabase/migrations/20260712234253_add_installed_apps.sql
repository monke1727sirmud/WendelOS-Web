/*
# Add installed_apps table for App Store feature

1. New Tables
   - `installed_apps`
     - `id` (uuid, primary key)
     - `user_id` (uuid, FK to auth.users, owner-scoped)
     - `app_id` (text, catalog ID from the store)
     - `name` (text, display name)
     - `icon` (text, lucide icon name)
     - `url` (text, the web app URL to embed)
     - `color` (text, gradient color for the icon)
     - `category` (text, e.g. 'productivity', 'tools', 'games')
     - `installed_at` (timestamptz)

2. Security
   - RLS enabled, owner-scoped via user_id DEFAULT auth.uid()
   - 4 separate policies (select/insert/update/delete) for authenticated users
*/

CREATE TABLE IF NOT EXISTS installed_apps (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id      text NOT NULL,
  name        text NOT NULL,
  icon        text NOT NULL DEFAULT 'Globe',
  url         text NOT NULL,
  color       text NOT NULL DEFAULT 'from-sky-400 to-sky-600',
  category    text NOT NULL DEFAULT 'other',
  installed_at timestamptz DEFAULT now(),
  UNIQUE (user_id, app_id)
);

ALTER TABLE installed_apps ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_installed_apps" ON installed_apps;
CREATE POLICY "select_own_installed_apps" ON installed_apps FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_installed_apps" ON installed_apps;
CREATE POLICY "insert_own_installed_apps" ON installed_apps FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_installed_apps" ON installed_apps;
CREATE POLICY "update_own_installed_apps" ON installed_apps FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_installed_apps" ON installed_apps;
CREATE POLICY "delete_own_installed_apps" ON installed_apps FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

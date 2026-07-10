/*
# WebOS - Desktop Operating System Schema

This migration creates the complete database schema for a web-based desktop OS.
All data is multi-user (owner-scoped) since the app requires sign-in.

1. New Tables
- `user_settings` — per-user OS preferences (wallpaper, theme, accent color, security timeouts)
- `files` — virtual file system (folders + files with paths, content, metadata)
- `notes` — quick sticky notes pinned to the desktop
- `desktop_windows` — persisted window state (which apps are open, position, size, z-index)
- `events` — calendar events (title, start/end, location, description)

2. Security
- RLS enabled on EVERY table.
- Each table has 4 owner-scoped CRUD policies (SELECT/INSERT/UPDATE/DELETE) using auth.uid().
- Owner columns default to auth.uid() so inserts that omit user_id still succeed.
- No public/anon access — every request requires an authenticated session.
*/

-- ============================================================
-- user_settings: per-user OS preferences
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  wallpaper text NOT NULL DEFAULT 'aurora',
  theme text NOT NULL DEFAULT 'dark' CHECK (theme IN ('dark','light')),
  accent_color text NOT NULL DEFAULT 'sky' CHECK (accent_color IN ('sky','emerald','amber','rose','cyan','violet')),
  auto_lock_minutes integer NOT NULL DEFAULT 5 CHECK (auto_lock_minutes >= 0 AND auto_lock_minutes <= 120),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_settings" ON user_settings;
CREATE POLICY "select_own_settings" ON user_settings FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_settings" ON user_settings;
CREATE POLICY "insert_own_settings" ON user_settings FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_settings" ON user_settings;
CREATE POLICY "update_own_settings" ON user_settings FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_settings" ON user_settings;
CREATE POLICY "delete_own_settings" ON user_settings FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- files: virtual file system
-- ============================================================
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES files(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'file' CHECK (type IN ('file','folder')),
  content text,
  mime_type text DEFAULT 'text/plain',
  size_bytes bigint DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_files" ON files;
CREATE POLICY "select_own_files" ON files FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_files" ON files;
CREATE POLICY "insert_own_files" ON files FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_files" ON files;
CREATE POLICY "update_own_files" ON files FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_files" ON files;
CREATE POLICY "delete_own_files" ON files FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_files_user_parent ON files(user_id, parent_id);

-- ============================================================
-- notes: sticky notes on desktop
-- ============================================================
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled',
  content text NOT NULL DEFAULT '',
  color text NOT NULL DEFAULT 'amber' CHECK (color IN ('amber','rose','emerald','sky','violet','slate')),
  pos_x double precision NOT NULL DEFAULT 80,
  pos_y double precision NOT NULL DEFAULT 80,
  width integer NOT NULL DEFAULT 240,
  height integer NOT NULL DEFAULT 240,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_notes" ON notes;
CREATE POLICY "select_own_notes" ON notes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_notes" ON notes;
CREATE POLICY "insert_own_notes" ON notes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_notes" ON notes;
CREATE POLICY "update_own_notes" ON notes FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_notes" ON notes;
CREATE POLICY "delete_own_notes" ON notes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- desktop_windows: persisted window positions/sizes
-- ============================================================
CREATE TABLE IF NOT EXISTS desktop_windows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  app_id text NOT NULL,
  title text NOT NULL,
  pos_x integer NOT NULL DEFAULT 120,
  pos_y integer NOT NULL DEFAULT 80,
  width integer NOT NULL DEFAULT 720,
  height integer NOT NULL DEFAULT 520,
  z_index integer NOT NULL DEFAULT 10,
  is_minimized boolean NOT NULL DEFAULT false,
  is_maximized boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE desktop_windows ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_windows" ON desktop_windows;
CREATE POLICY "select_own_windows" ON desktop_windows FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_windows" ON desktop_windows;
CREATE POLICY "insert_own_windows" ON desktop_windows FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_windows" ON desktop_windows;
CREATE POLICY "update_own_windows" ON desktop_windows FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_windows" ON desktop_windows;
CREATE POLICY "delete_own_windows" ON desktop_windows FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ============================================================
-- events: calendar events
-- ============================================================
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  location text,
  start_at timestamptz NOT NULL,
  end_at timestamptz NOT NULL,
  color text NOT NULL DEFAULT 'sky' CHECK (color IN ('sky','emerald','amber','rose','cyan','violet')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_events" ON events;
CREATE POLICY "select_own_events" ON events FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_events" ON events;
CREATE POLICY "insert_own_events" ON events FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_events" ON events;
CREATE POLICY "update_own_events" ON events FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_events" ON events;
CREATE POLICY "delete_own_events" ON events FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_events_user_start ON events(user_id, start_at);

-- ============================================================
-- updated_at trigger helper
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_settings_updated ON user_settings;
CREATE TRIGGER trg_user_settings_updated BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_files_updated ON files;
CREATE TRIGGER trg_files_updated BEFORE UPDATE ON files
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notes_updated ON notes;
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

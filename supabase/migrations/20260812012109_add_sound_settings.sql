ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS sound_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS sfx_volume integer NOT NULL DEFAULT 50;

COMMENT ON COLUMN user_settings.sound_enabled IS 'Whether UI sound effects are enabled';
COMMENT ON COLUMN user_settings.sfx_volume IS 'UI sound effects volume, 0-100';

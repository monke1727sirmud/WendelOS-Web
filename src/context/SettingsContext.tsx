import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { DEFAULT_SETTINGS, type UserSettings } from '../lib/types';
import { useAuth } from './AuthContext';

interface SettingsContextValue {
  settings: UserSettings;
  loading: boolean;
  update: (patch: Partial<UserSettings>) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider');
  return ctx;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user, authState } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from('user_settings')
      .select('wallpaper, theme, accent_color, auto_lock_minutes')
      .eq('user_id', uid)
      .maybeSingle();

    if (data) {
      setSettings({
        wallpaper: data.wallpaper,
        theme: data.theme,
        accent_color: data.accent_color,
        auto_lock_minutes: data.auto_lock_minutes,
      });
    } else {
      const { error } = await supabase.from('user_settings').insert({ user_id: uid });
      if (!error) {
        setSettings(DEFAULT_SETTINGS);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (authState === 'authenticated' && user) {
      setLoading(true);
      void loadSettings(user.id);
    } else if (authState === 'unauthenticated') {
      setSettings(DEFAULT_SETTINGS);
      setLoading(true);
    }
  }, [authState, user, loadSettings]);

  const update = useCallback(
    async (patch: Partial<UserSettings>) => {
      if (!user) return;
      const next = { ...settings, ...patch };
      setSettings(next);
      await supabase.from('user_settings').upsert({
        user_id: user.id,
        wallpaper: next.wallpaper,
        theme: next.theme,
        accent_color: next.accent_color,
        auto_lock_minutes: next.auto_lock_minutes,
      });
    },
    [user, settings]
  );

  return (
    <SettingsContext.Provider value={{ settings, loading, update }}>
      {children}
    </SettingsContext.Provider>
  );
}

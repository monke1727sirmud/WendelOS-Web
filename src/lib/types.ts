export type AppId =
  | 'files'
  | 'notes'
  | 'editor'
  | 'calculator'
  | 'terminal'
  | 'settings'
  | 'browser'
  | 'calendar'
  | 'sysmon'
  | 'music'
  | 'about';

export interface WindowInstance {
  id: string;
  app_id: AppId;
  title: string;
  icon: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  z_index: number;
  is_minimized: boolean;
  is_maximized: boolean;
  payload?: Record<string, unknown>;
}

export interface UserSettings {
  wallpaper: string;
  theme: 'dark' | 'light';
  accent_color: string;
  auto_lock_minutes: number;
}

export const DEFAULT_SETTINGS: UserSettings = {
  wallpaper: 'tuxedo',
  theme: 'dark',
  accent_color: 'sky',
  auto_lock_minutes: 5,
};

export interface FileNode {
  id: string;
  name: string;
  parent_id: string | null;
  type: 'file' | 'folder';
  content: string | null;
  mime_type: string;
  size_bytes: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  color: string;
  pos_x: number;
  pos_y: number;
  width: number;
  height: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  start_at: string;
  end_at: string;
  color: string;
  created_at: string;
}

export const WALLPAPERS = [
  'tuxedo',
  'arch',
  'debian',
  'fedora',
  'ubuntu',
  'gentoo',
  'neon',
] as const;

export const ACCENT_COLORS = [
  'sky',
  'emerald',
  'amber',
  'rose',
  'cyan',
  'violet',
] as const;

export const NOTE_COLORS = [
  'amber',
  'rose',
  'emerald',
  'sky',
  'violet',
  'slate',
] as const;

export function wallpaperCss(wp: string): string {
  const map: Record<string, string> = {
    tuxedo:
      'radial-gradient(ellipse 80% 60% at 20% 0%, #0f2a4a 0%, transparent 60%), radial-gradient(ellipse 70% 50% at 80% 20%, #1a1a2e 0%, transparent 55%), radial-gradient(ellipse 60% 80% at 50% 100%, #16213e 0%, transparent 60%), linear-gradient(180deg, #0a0e1a 0%, #0d1117 100%)',
    arch:
      'linear-gradient(135deg, #1793d1 0%, #0a3d62 40%, #0d1117 100%)',
    debian:
      'radial-gradient(ellipse 90% 70% at 30% 30%, #d70a53 0%, transparent 50%), linear-gradient(180deg, #1a0a12 0%, #0d0d0d 100%)',
    fedora:
      'radial-gradient(ellipse 80% 60% at 50% 0%, #294172 0%, transparent 55%), radial-gradient(ellipse 70% 50% at 20% 100%, #3c6eb4 0%, transparent 50%), linear-gradient(180deg, #0a1626 0%, #0d1b2a 100%)',
    ubuntu:
      'radial-gradient(circle at 50% 50%, #e95420 0%, transparent 30%), radial-gradient(ellipse 90% 70% at 50% 100%, #2c001e 0%, transparent 60%), linear-gradient(180deg, #1a0a14 0%, #2c001e 100%)',
    gentoo:
      'radial-gradient(ellipse 80% 60% at 30% 20%, #54487a 0%, transparent 55%), linear-gradient(135deg, #0d1117 0%, #1a1a2e 50%, #54487a 100%)',
    neon:
      'radial-gradient(at 0% 0%, #0f172a 0px, transparent 50%), radial-gradient(at 100% 0%, #1e293b 0px, transparent 50%), radial-gradient(at 100% 100%, #0f172a 0px, transparent 50%), radial-gradient(at 0% 100%, #1e293b 0px, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1a1f2e 100%)',
  };
  return map[wp] ?? map.tuxedo;
}

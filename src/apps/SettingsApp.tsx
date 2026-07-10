import { useState } from 'react';
import {
  Palette, Shield, User, Monitor, LogOut, Check,
  Loader2, Moon, Sun, Clock,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { WALLPAPERS, ACCENT_COLORS, wallpaperCss } from '../lib/types';

type Tab = 'appearance' | 'security' | 'account';

export default function SettingsApp() {
  const { settings, update } = useSettings();
  const { user, username, signOut, autoLockMinutes, setAutoLockMinutes } = useAuth();
  const [tab, setTab] = useState<Tab>('appearance');
  const [saving, setSaving] = useState<string | null>(null);

  const handleUpdate = async (patch: Parameters<typeof update>[0]) => {
    setSaving(JSON.stringify(patch));
    await update(patch);
    setSaving(null);
  };

  const tabs: { id: Tab; label: string; icon: typeof Palette }[] = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'account', label: 'Account', icon: User },
  ];

  return (
    <div className="flex h-full bg-slate-900">
      {/* Sidebar */}
      <div className="w-44 shrink-0 border-r border-white/10 bg-slate-800/30 p-3">
        <h2 className="mb-4 px-2 text-sm font-semibold text-white">Settings</h2>
        <div className="space-y-1">
          {tabs.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  tab === t.id
                    ? 'bg-accent-500/20 text-accent-300'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className="h-4 w-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        {tab === 'appearance' && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <Monitor className="h-4 w-4 text-accent-400" /> Wallpaper
              </h3>
              <p className="mb-3 text-xs text-slate-500">Choose your desktop background</p>
              <div className="grid grid-cols-4 gap-3">
                {WALLPAPERS.map((wp) => (
                  <button
                    key={wp}
                    onClick={() => void handleUpdate({ wallpaper: wp })}
                    className={`group relative h-20 rounded-lg border-2 transition ${
                      settings.wallpaper === wp
                        ? 'border-accent-500'
                        : 'border-white/10 hover:border-white/30'
                    }`}
                    style={{ background: wallpaperCss(wp) }}
                  >
                    {settings.wallpaper === wp && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="rounded-full bg-accent-500 p-1">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      </div>
                    )}
                    <span className="absolute bottom-1 left-1.5 text-[10px] font-medium capitalize text-white/80">
                      {wp}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <Palette className="h-4 w-4 text-accent-400" /> Accent Color
              </h3>
              <p className="mb-3 text-xs text-slate-500">Personalize your system color</p>
              <div className="flex gap-3">
                {ACCENT_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => void handleUpdate({ accent_color: color })}
                    className={`flex h-10 w-10 items-center justify-center rounded-full transition ${
                      settings.accent_color === color
                        ? 'ring-2 ring-white/50 ring-offset-2 ring-offset-slate-900'
                        : 'hover:scale-110'
                    }`}
                    style={{ background: `var(--accent-${color}-500)` }}
                  >
                    {settings.accent_color === color && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                {settings.theme === 'dark' ? (
                  <Moon className="h-4 w-4 text-accent-400" />
                ) : (
                  <Sun className="h-4 w-4 text-accent-400" />
                )}{' '}
                Theme
              </h3>
              <p className="mb-3 text-xs text-slate-500">Switch between light and dark mode</p>
              <div className="flex gap-2">
                {(['dark', 'light'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => void handleUpdate({ theme: t })}
                    className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-xs font-medium capitalize transition ${
                      settings.theme === t
                        ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                        : 'border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {t === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold text-white">
                <Clock className="h-4 w-4 text-accent-400" /> Auto-Lock
              </h3>
              <p className="mb-3 text-xs text-slate-500">
                Automatically lock the screen after inactivity
              </p>
              <div className="grid grid-cols-4 gap-2">
                {[0, 1, 5, 15, 30, 60].map((m) => (
                  <button
                    key={m}
                    onClick={() => {
                      setAutoLockMinutes(m);
                      void handleUpdate({ auto_lock_minutes: m });
                    }}
                    className={`rounded-lg border py-2.5 text-xs font-medium transition ${
                      autoLockMinutes === m
                        ? 'border-accent-500 bg-accent-500/20 text-accent-300'
                        : 'border-white/10 text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    {m === 0 ? 'Never' : `${m}m`}
                  </button>
                ))}
              </div>
              <p className="mt-3 text-xs text-slate-600">
                When enabled, the screen locks after {autoLockMinutes === 0 ? 'no timeout' : `${autoLockMinutes} minutes`} of inactivity. Re-enter your password to unlock.
              </p>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Shield className="h-4 w-4 text-emerald-400" />
                Security Features Active
              </div>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  PKCE authentication flow
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Row-level security on all data
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Session-based token management
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Auto-refresh tokens (80% threshold)
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Auto-lock on inactivity
                </li>
                <li className="flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Password re-verification to unlock
                </li>
              </ul>
            </div>
          </div>
        )}

        {tab === 'account' && (
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-2xl font-bold text-white">
                {(username?.[0] ?? '?').toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">@{username}</p>
                <p className="text-xs text-slate-500">Signed in via Supabase Auth (PAM)</p>
              </div>
            </div>

            <div className="rounded-lg border border-white/10 bg-slate-800/30 p-4">
              <h3 className="mb-3 text-sm font-semibold text-white">Session Info</h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">User ID</span>
                  <span className="font-mono text-slate-400">{user?.id?.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Last sign in</span>
                  <span className="text-slate-400">
                    {user?.last_sign_in_at
                      ? new Date(user.last_sign_in_at).toLocaleString()
                      : '—'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Auto-lock</span>
                  <span className="text-slate-400">
                    {autoLockMinutes === 0 ? 'Disabled' : `${autoLockMinutes} minutes`}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={() => void signOut()}
              className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        )}

        {saving && (
          <div className="fixed bottom-20 right-8 flex items-center gap-2 rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300 shadow-lg">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" />
            Saving...
          </div>
        )}
      </div>
    </div>
  );
}

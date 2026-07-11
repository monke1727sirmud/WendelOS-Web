import { useState } from 'react';
import {
  Palette, Shield, User, Monitor, LogOut, Check, Loader2,
  Moon, Sun, Clock, Lock, Database, Zap, ChevronRight,
  Bell, Wifi,
} from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';
import { WALLPAPERS, ACCENT_COLORS, wallpaperCss } from '../lib/types';

type Tab = 'appearance' | 'security' | 'account' | 'notifications' | 'network';

const TABS: { id: Tab; label: string; icon: React.ComponentType<{className?:string}>; desc: string }[] = [
  { id: 'appearance', label: 'Appearance',    icon: Palette,  desc: 'Wallpaper, colors, theme' },
  { id: 'security',   label: 'Privacy & Security', icon: Shield, desc: 'Lock, auth, RLS' },
  { id: 'account',    label: 'Account',       icon: User,     desc: 'Profile, session' },
  { id: 'notifications', label: 'Notifications', icon: Bell,  desc: 'Alerts, badges' },
  { id: 'network',    label: 'Network',       icon: Wifi,     desc: 'Connections, DNS' },
];

export default function SettingsApp() {
  const { settings, update } = useSettings();
  const { user, username, signOut, autoLockMinutes, setAutoLockMinutes } = useAuth();
  const [tab, setTab] = useState<Tab>('appearance');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleUpdate = async (patch: Parameters<typeof update>[0]) => {
    setSaving(true); setSaved(false);
    await update(patch);
    setSaving(false); setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  return (
    <div className="flex h-full bg-[#1c1c1e]">
      {/* macOS System Preferences-style sidebar */}
      <div className="flex w-52 shrink-0 flex-col border-r border-white/8 bg-[#252528]">
        <div className="border-b border-white/8 px-4 py-3">
          <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">System Settings</p>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex w-full items-center gap-3 px-3 py-2.5 text-left transition ${
                  tab === t.id ? 'bg-accent-500/15 text-white' : 'text-white/50 hover:bg-white/5 hover:text-white/80'
                }`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                  tab === t.id ? 'bg-accent-500/25 text-accent-400' : 'bg-white/6 text-white/40'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium leading-tight">{t.label}</p>
                  <p className={`text-[10px] leading-tight ${tab === t.id ? 'text-white/40' : 'text-white/25'}`}>{t.desc}</p>
                </div>
                {tab === t.id && <ChevronRight className="ml-auto h-3 w-3 shrink-0 text-white/30" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* macOS-style section header */}
        <div className="sticky top-0 z-10 border-b border-white/8 bg-[#1c1c1e]/90 px-6 py-4 backdrop-blur-sm">
          <h2 className="text-base font-semibold text-white">{TABS.find(t => t.id === tab)?.label}</h2>
          <p className="text-xs text-white/35">{TABS.find(t => t.id === tab)?.desc}</p>
        </div>

        <div className="p-6 space-y-6">
          {tab === 'appearance' && (
            <>
              {/* Wallpaper */}
              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-accent-400" />
                  <h3 className="text-sm font-semibold text-white">Desktop Wallpaper</h3>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {WALLPAPERS.map(wp => (
                    <button key={wp} onClick={() => void handleUpdate({ wallpaper: wp })}
                      className={`group relative h-20 overflow-hidden rounded-xl border-2 transition ${
                        settings.wallpaper === wp ? 'border-accent-500 shadow-lg shadow-accent-500/25' : 'border-white/8 hover:border-white/25'
                      }`} style={{ background: wallpaperCss(wp) }}>
                      {settings.wallpaper === wp && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="rounded-full bg-accent-500 p-1 shadow"><Check className="h-3 w-3 text-white" /></div>
                        </div>
                      )}
                      <span className="absolute bottom-1.5 left-2 text-[10px] font-medium capitalize text-white/80" style={{textShadow:'0 1px 3px rgba(0,0,0,0.8)'}}>{wp}</span>
                    </button>
                  ))}
                </div>
              </section>

              {/* Accent color */}
              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Palette className="h-4 w-4 text-accent-400" />
                  <h3 className="text-sm font-semibold text-white">Accent Color</h3>
                </div>
                <div className="flex gap-3">
                  {ACCENT_COLORS.map(color => (
                    <button key={color} onClick={() => void handleUpdate({ accent_color: color })}
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        settings.accent_color === color ? 'scale-110 ring-2 ring-white/40 ring-offset-2 ring-offset-[#1c1c1e]' : 'opacity-70 hover:opacity-100 hover:scale-105'
                      }`} style={{ background: `var(--accent-${color}-500)` }}>
                      {settings.accent_color === color && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                    </button>
                  ))}
                </div>
                <p className="mt-3 text-xs text-white/25 capitalize">Selected: {settings.accent_color}</p>
              </section>

              {/* Theme */}
              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-4 flex items-center gap-2">
                  {settings.theme === 'dark' ? <Moon className="h-4 w-4 text-accent-400" /> : <Sun className="h-4 w-4 text-accent-400" />}
                  <h3 className="text-sm font-semibold text-white">Appearance Mode</h3>
                </div>
                <div className="flex gap-3">
                  {(['dark','light'] as const).map(t => (
                    <button key={t} onClick={() => void handleUpdate({ theme: t })}
                      className={`flex flex-1 items-center justify-center gap-2 rounded-xl border py-3 text-sm font-medium capitalize transition ${
                        settings.theme === t ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-white/8 text-white/40 hover:bg-white/5 hover:text-white/70'
                      }`}>
                      {t === 'dark' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} {t}
                    </button>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'security' && (
            <>
              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-accent-400" />
                  <div>
                    <h3 className="text-sm font-semibold text-white">Auto-Lock</h3>
                    <p className="text-xs text-white/35">Lock screen after inactivity</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0,1,5,15,30,60].map(m => (
                    <button key={m} onClick={() => { setAutoLockMinutes(m); void handleUpdate({ auto_lock_minutes: m }); }}
                      className={`rounded-xl border py-2.5 text-xs font-medium transition ${
                        autoLockMinutes === m ? 'border-accent-500 bg-accent-500/15 text-accent-300' : 'border-white/8 text-white/40 hover:bg-white/5 hover:text-white/70'
                      }`}>
                      {m === 0 ? 'Never' : `${m}m`}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-4 w-4 text-emerald-400" />
                  <h3 className="text-sm font-semibold text-white">Security Status</h3>
                </div>
                <div className="space-y-2.5">
                  {[
                    { label: 'PKCE authentication flow', icon: Lock },
                    { label: 'Row-level security on all data', icon: Database },
                    { label: 'Session-based token management', icon: Shield },
                    { label: 'Auto-refresh tokens', icon: Zap },
                    { label: 'Auto-lock on inactivity', icon: Clock },
                  ].map(({ label, icon: Icon }) => (
                    <div key={label} className="flex items-center gap-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10 px-3 py-2">
                      <Icon className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="text-xs text-white/60">{label}</span>
                      <Check className="ml-auto h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          {tab === 'account' && (
            <>
              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))' }}>
                    {(username?.[0] ?? '?').toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">@{username}</p>
                    <p className="text-xs text-white/35">WendelOS Local Account</p>
                    <p className="text-[10px] text-white/20 font-mono mt-0.5">{user?.id?.slice(0, 16)}...</p>
                  </div>
                </div>
              </section>

              <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
                <h3 className="mb-4 text-sm font-semibold text-white">Session Details</h3>
                <div className="space-y-2.5">
                  {[
                    { label: 'User ID', value: (user?.id?.slice(0,8) ?? '') + '...' },
                    { label: 'Last sign in', value: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString() : '—' },
                    { label: 'Auto-lock', value: autoLockMinutes === 0 ? 'Disabled' : `${autoLockMinutes} minutes` },
                    { label: 'Auth provider', value: 'Supabase Auth (PAM)' },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2.5">
                      <span className="text-xs text-white/40">{label}</span>
                      <span className="text-xs font-mono text-white/60">{value}</span>
                    </div>
                  ))}
                </div>
              </section>

              <button onClick={() => void signOut()}
                className="flex items-center gap-2 rounded-xl border border-red-500/25 bg-red-500/8 px-4 py-3 text-sm font-medium text-red-400/80 transition hover:bg-red-500/15 hover:text-red-400">
                <LogOut className="h-4 w-4" /> Sign Out of WendelOS
              </button>
            </>
          )}

          {tab === 'notifications' && (
            <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <p className="text-sm text-white/40 text-center py-8">Notification preferences coming soon.</p>
            </section>
          )}

          {tab === 'network' && (
            <section className="rounded-2xl border border-white/8 bg-white/3 p-5">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
                  <Wifi className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">WendelNet</p>
                  <p className="text-xs text-emerald-400">Connected</p>
                </div>
              </div>
              <div className="space-y-2 text-xs">
                {[{ label: 'IP Address', value: '10.0.0.42' }, { label: 'DNS', value: '1.1.1.1, 8.8.8.8' }, { label: 'Gateway', value: '10.0.0.1' }].map(r => (
                  <div key={r.label} className="flex justify-between rounded-lg border border-white/5 bg-white/3 px-3 py-2">
                    <span className="text-white/40">{r.label}</span><span className="font-mono text-white/60">{r.value}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {/* Save toast */}
      {(saving || saved) && (
        <div className="fixed bottom-20 right-6 flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/90 px-3 py-2 text-xs shadow-xl backdrop-blur-xl">
          {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-400" /> : <Check className="h-3.5 w-3.5 text-emerald-400" />}
          {saving ? 'Saving...' : 'Saved'}
        </div>
      )}
    </div>
  );
}

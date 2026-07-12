import { useState, useEffect, useRef, type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Search, Lock as LockIcon, LogOut, Power,
  Wifi, Volume2, BatteryFull, BatteryLow,
  TerminalSquare, ChevronUp, Bell, Bluetooth,
  Sun, Moon, Settings2, X, BatteryMedium,
} from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';
import type { AppId, InstalledApp } from '../lib/types';

type IconName = keyof typeof LucideIcons;
type IconType = ComponentType<{ className?: string }>;

interface AppEntry { id: AppId; label: string; icon: string; gradient: string; }

const APPS: AppEntry[] = [
  { id: 'files',      label: 'Files',          icon: 'Folder',         gradient: 'from-sky-400 to-sky-600' },
  { id: 'notes',      label: 'Notes',          icon: 'StickyNote',     gradient: 'from-yellow-400 to-amber-500' },
  { id: 'editor',     label: 'Text Editor',    icon: 'FileText',       gradient: 'from-amber-400 to-orange-600' },
  { id: 'calculator', label: 'Calculator',     icon: 'Calculator',     gradient: 'from-slate-400 to-slate-600' },
  { id: 'terminal',   label: 'Terminal',       icon: 'TerminalSquare', gradient: 'from-emerald-400 to-emerald-700' },
  { id: 'browser',    label: 'Browser',        icon: 'Globe',          gradient: 'from-blue-400 to-blue-600' },
  { id: 'calendar',   label: 'Calendar',       icon: 'Calendar',       gradient: 'from-red-400 to-red-600' },
  { id: 'sysmon',     label: 'System Monitor', icon: 'Activity',       gradient: 'from-red-400 to-rose-600' },
  { id: 'music',      label: 'Music',          icon: 'Music',          gradient: 'from-pink-400 to-rose-500' },
  { id: 'settings',   label: 'Settings',       icon: 'Settings',       gradient: 'from-slate-500 to-slate-700' },
  { id: 'about',      label: 'About',          icon: 'Info',           gradient: 'from-cyan-400 to-cyan-600' },
  { id: 'store',      label: 'App Store',      icon: 'Store',          gradient: 'from-cyan-400 to-blue-500' },
];

const DOCK_APPS = APPS.slice(0, 8);

function useBattery() {
  const [level, setLevel] = useState(85);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number }> };
    if (nav.getBattery) nav.getBattery().then(b => setLevel(Math.round(b.level * 100))).catch(() => {});
  }, []);
  return level;
}

function BatteryIcon({ level }: { level: number }) {
  if (level > 60) return <BatteryFull className="h-3.5 w-3.5" />;
  if (level > 30) return <BatteryMedium className="h-3.5 w-3.5" />;
  return <BatteryLow className="h-3.5 w-3.5 text-red-400" />;
}

export default function Taskbar() {
  const { windows, activeId, openApp, toggleFromTaskbar } = useWindowManager();
  const { username, lock, signOut } = useAuth();
  const { settings, update: updateSettings } = useSettings();
  const [startOpen, setStartOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(new Date());
  const [notifications] = useState(2);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(65);
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(false);
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const battery = useBattery();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadInstalled = async () => {
      const { data } = await supabase.from('installed_apps').select('*').order('installed_at');
      if (data) setInstalledApps(data as InstalledApp[]);
    };
    void loadInstalled();
    window.addEventListener('focus', loadInstalled);
    return () => window.removeEventListener('focus', loadInstalled);
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setStartOpen(false); setTrayOpen(false); setSearch('');
      }
    };
    window.addEventListener('mousedown', handler);
    return () => window.removeEventListener('mousedown', handler);
  }, []);

  const filtered = APPS.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));
  const initial = username?.[0]?.toUpperCase() ?? '?';
  const openOne = (id: AppId, payload?: Record<string, unknown>) => {
    openApp(id, payload ? { payload, title: payload.name as string, icon: payload.icon as string, width: 1000, height: 680 } : undefined);
    setStartOpen(false);
    setSearch('');
  };

  return (
    <>
      {/* ── Android-style status bar ── */}
      <div className="fixed top-0 left-0 right-0 z-[600] flex h-7 items-center justify-between bg-black/70 px-4 backdrop-blur-md select-none">
        <div className="flex items-center gap-1.5">
          <TerminalSquare className="h-3 w-3 text-white/50" />
          <span className="font-mono text-[10px] font-semibold tracking-widest text-white/40 uppercase">WendelOS</span>
        </div>
        <div className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/45 truncate max-w-xs">
          {activeId ? (windows.find(w => w.id === activeId)?.title ?? '') : ''}
        </div>
        <div className="flex items-center gap-2 text-white/55">
          {notifications > 0 && (
            <div className="relative">
              <Bell className="h-3 w-3" />
              <span className="absolute -top-1 -right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white">{notifications}</span>
            </div>
          )}
          <Wifi className={`h-3 w-3 ${wifiOn ? 'text-white/55' : 'text-white/20'}`} />
          <BatteryFull className="h-3 w-3" />
          <span className="tabular-nums text-[10px]">{time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
      </div>

      {/* ── Panels (Start + Quick Settings) — single ref wrapper ── */}
      <div ref={panelRef}>
        {/* Windows 11-style Start Menu */}
        {startOpen && (
          <div className="animate-slide-up fixed bottom-[76px] left-2 z-[500] w-80 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            style={{ background: 'rgba(20,20,25,0.97)', backdropFilter: 'blur(48px) saturate(200%)' }}>

            {/* User header */}
            <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3.5"
              style={{ background: 'linear-gradient(135deg, rgba(var(--accent-500-rgb),0.15) 0%, transparent 100%)' }}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white shadow-lg"
                style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))' }}>
                {initial}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">@{username}</p>
                <p className="text-[10px] text-white/30">WendelOS · Local Session</p>
              </div>
            </div>

            {/* Search */}
            <div className="border-b border-white/8 p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search apps…"
                  className="w-full rounded-xl border border-white/8 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-white/20 outline-none focus:border-accent-500/40 focus:bg-white/8" />
              </div>
            </div>

            {/* Pinned grid — Windows 11 style */}
            {!search ? (
              <div className="p-4">
                <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Pinned</p>
                <div className="grid grid-cols-4 gap-2">
                  {APPS.slice(0, 8).map(app => {
                    const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                    const isOpen = windows.some(w => w.app_id === app.id);
                    return (
                      <button key={app.id} onClick={() => openOne(app.id)}
                        className="group flex flex-col items-center gap-1.5 rounded-xl p-2 transition hover:bg-white/8 active:bg-white/12">
                        <div className={`relative flex h-11 w-11 items-center justify-center rounded-[14px] bg-gradient-to-br ${app.gradient} shadow-md transition group-hover:scale-105 group-hover:shadow-lg`}
                          style={{ boxShadow: '0 3px 12px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.2)' }}>
                          <Icon className="h-5 w-5 text-white drop-shadow-sm" />
                          {isOpen && <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#141419] bg-accent-400" />}
                        </div>
                        <span className="text-center text-[10px] text-white/50 group-hover:text-white/80 transition leading-tight">{app.label}</span>
                      </button>
                    );
                  })}
                </div>
                {APPS.length > 8 && (
                  <div className="mt-3 border-t border-white/8 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">All Apps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {APPS.slice(8).map(app => {
                        const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                        return (
                          <button key={app.id} onClick={() => openOne(app.id as AppId)}
                            className="flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-[11px] text-white/50 transition hover:bg-white/8 hover:text-white/80">
                            <Icon className="h-3.5 w-3.5" />{app.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                {installedApps.length > 0 && (
                  <div className="mt-3 border-t border-white/8 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-white/25">Installed Apps</p>
                    <div className="flex flex-wrap gap-1.5">
                      {installedApps.map(app => {
                        const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.Globe) as IconType;
                        return (
                          <button key={app.id} onClick={() => openOne('webapp', { url: app.url, name: app.name, icon: app.icon, color: app.color })}
                            className="flex items-center gap-1.5 rounded-lg border border-white/8 px-2.5 py-1.5 text-[11px] text-white/50 transition hover:bg-white/8 hover:text-white/80">
                            <Icon className="h-3.5 w-3.5" />{app.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Search results */
              <div className="max-h-56 overflow-y-auto scrollbar-thin py-1">
                {filtered.map(app => {
                  const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                  const isOpen = windows.some(w => w.app_id === app.id);
                  return (
                    <button key={app.id} onClick={() => openOne(app.id)}
                      className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-white/8">
                      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${app.gradient} shadow`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                      <span className="text-sm text-white/70">{app.label}</span>
                      {isOpen && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400" />}
                    </button>
                  );
                })}
                {filtered.length === 0 && <p className="py-6 text-center text-xs text-white/25">No apps found</p>}
              </div>
            )}

            {/* Power row — Linux session controls */}
            <div className="flex items-center justify-between border-t border-white/8 bg-black/25 px-4 py-2.5">
              <span className="font-mono text-[10px] uppercase tracking-wider text-white/20">Session</span>
              <div className="flex gap-1">
                {[
                  { icon: LockIcon,  title: 'Lock',      action: lock,              hover: 'hover:bg-white/10 hover:text-white' },
                  { icon: LogOut,    title: 'Sign Out',  action: () => void signOut(), hover: 'hover:bg-amber-500/20 hover:text-amber-300' },
                  { icon: Power,     title: 'Power Off', action: () => void signOut(), hover: 'hover:bg-red-500/20 hover:text-red-400' },
                ].map(({ icon: Ico, title, action, hover }) => (
                  <button key={title} onClick={action} title={title}
                    className={`flex h-7 w-7 items-center justify-center rounded-lg text-white/35 transition ${hover}`}>
                    <Ico className="h-3.5 w-3.5" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Android/macOS Quick Settings */}
        {trayOpen && (
          <div className="animate-slide-up fixed bottom-[76px] right-2 z-[500] w-72 overflow-hidden rounded-2xl border border-white/10 shadow-2xl"
            style={{ background: 'rgba(20,20,25,0.97)', backdropFilter: 'blur(48px) saturate(200%)' }}>

            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="text-xs font-semibold text-white/70">Quick Settings</span>
              <button onClick={() => setTrayOpen(false)} className="text-white/30 hover:text-white transition"><X className="h-3.5 w-3.5" /></button>
            </div>

            {/* Toggle grid — Android tiles */}
            <div className="grid grid-cols-4 gap-2 border-b border-white/8 p-3">
              {[
                { label: 'Wi-Fi',     icon: Wifi,      active: wifiOn,              onToggle: () => setWifiOn(v => !v) },
                { label: 'Bluetooth', icon: Bluetooth, active: btOn,                onToggle: () => setBtOn(v => !v) },
                { label: 'Dark Mode', icon: Moon,      active: settings.theme === 'dark', onToggle: () => void updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' }) },
                { label: 'Do Not Disturb', icon: Bell, active: false,              onToggle: () => {} },
              ].map(({ label, icon: Ico, active, onToggle }) => (
                <button key={label} onClick={onToggle}
                  className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 text-center transition ${
                    active ? 'bg-accent-500/25 text-accent-300' : 'bg-white/5 text-white/35 hover:bg-white/10 hover:text-white/60'
                  }`}>
                  <Ico className="h-4 w-4" />
                  <span className="text-[9px] font-medium leading-tight">{label}</span>
                </button>
              ))}
            </div>

            {/* Sliders */}
            <div className="space-y-3 border-b border-white/8 p-4">
              {[
                { icon: Sun,     value: brightness, onChange: (v: number) => setBrightness(v), label: 'Brightness' },
                { icon: Volume2, value: volume,     onChange: (v: number) => setVolume(v),     label: 'Volume' },
              ].map(({ icon: Ico, value, onChange, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <Ico className="h-3.5 w-3.5 shrink-0 text-white/35" />
                  <div className="relative flex-1 h-1.5 rounded-full bg-white/8 cursor-pointer"
                    onClick={e => { const r = e.currentTarget.getBoundingClientRect(); onChange(Math.round(((e.clientX - r.left) / r.width) * 100)); }}>
                    <div className="h-full rounded-full bg-accent-500/70 transition-all" style={{ width: `${value}%` }} />
                  </div>
                  <span className="w-7 text-right text-[10px] tabular-nums text-white/25">{value}</span>
                </div>
              ))}
            </div>

            {/* Battery + time + settings shortcut */}
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-1.5 text-xs text-white/40">
                <BatteryIcon level={battery} />
                <span>{battery}%</span>
              </div>
              <div className="text-xs text-white/25 tabular-nums">
                {time.toLocaleString([], { weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false })}
              </div>
              <button onClick={() => { openApp('settings'); setTrayOpen(false); }}
                className="flex items-center gap-1 text-[10px] text-white/30 hover:text-white/60 transition">
                <Settings2 className="h-3 w-3" /> More
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Bottom bar: Start | Dock | Tray ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[400] flex h-[72px] items-end justify-between px-3 pb-2 pointer-events-none">
        {/* Windows Start button */}
        <div className="pointer-events-auto">
          <button
            onClick={() => { setStartOpen(v => !v); setTrayOpen(false); }}
            className={`flex h-11 items-center gap-2 rounded-xl px-3 transition-all ${
              startOpen
                ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/35'
                : 'border border-white/10 bg-black/50 text-white/60 hover:bg-white/10 hover:text-white backdrop-blur-xl'
            }`}
          >
            <TerminalSquare className="h-5 w-5" />
            <span className="hidden text-xs font-semibold sm:inline">Start</span>
          </button>
        </div>

        {/* macOS-style centered Dock */}
        <div className="pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 flex items-end gap-0.5 rounded-2xl border border-white/12 bg-black/55 px-2 py-1.5 shadow-2xl backdrop-blur-2xl"
          style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)' }}>
          {DOCK_APPS.map(app => {
            const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
            const openWins = windows.filter(w => w.app_id === app.id);
            const isActive = openWins.some(w => w.id === activeId);
            const isOpen = openWins.length > 0;
            return (
              <div key={app.id} className="group relative flex flex-col items-center">
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/85 px-2.5 py-1 text-[11px] font-medium text-white/85 opacity-0 shadow-xl backdrop-blur-sm transition-opacity group-hover:opacity-100">
                  {app.label}
                </div>
                <button
                  onClick={() => openWins.length > 0 ? toggleFromTaskbar(openWins[0].id) : openApp(app.id)}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 group-hover:scale-[1.28] group-hover:-translate-y-1.5 ${
                    isActive
                      ? 'bg-gradient-to-br ' + app.gradient + ' text-white shadow-lg'
                      : isOpen
                        ? 'bg-white/15 text-white'
                        : 'bg-white/8 text-white/60 hover:bg-white/15 hover:text-white'
                  }`}
                  style={isActive ? { boxShadow: '0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.2)' } : {}}
                >
                  <Icon className="h-5 w-5" />
                </button>
                <div className={`mt-0.5 h-1 w-1 rounded-full transition-all ${isOpen ? (isActive ? 'bg-accent-400' : 'bg-white/35') : 'bg-transparent'}`} />
              </div>
            );
          })}

          {/* Overflow windows not in dock */}
          {windows.filter(w => !DOCK_APPS.some(d => d.id === w.app_id)).length > 0 && (
            <>
              <div className="mx-1 h-8 w-px self-center bg-white/10" />
              {windows.filter(w => !DOCK_APPS.some(d => d.id === w.app_id)).map(w => {
                const Icon = (LucideIcons[w.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                const isAct = w.id === activeId;
                return (
                  <div key={w.id} className="group relative flex flex-col items-center">
                    <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/85 px-2.5 py-1 text-[11px] text-white/85 opacity-0 backdrop-blur-sm transition-opacity group-hover:opacity-100">
                      {w.title}
                    </div>
                    <button onClick={() => toggleFromTaskbar(w.id)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 group-hover:scale-[1.28] group-hover:-translate-y-1.5 ${isAct ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white' : 'bg-white/8 text-white/60 hover:bg-white/15'}`}>
                      <Icon className="h-5 w-5" />
                    </button>
                    <div className={`mt-0.5 h-1 w-1 rounded-full ${isAct ? 'bg-accent-400' : 'bg-white/35'}`} />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* System tray — bottom right */}
        <div className="pointer-events-auto">
          <button
            onClick={() => { setTrayOpen(v => !v); setStartOpen(false); }}
            className={`flex h-11 items-center gap-2.5 rounded-xl px-3 transition-all ${
              trayOpen
                ? 'border border-accent-500/40 bg-accent-500/15 text-accent-300'
                : 'border border-white/10 bg-black/50 text-white/55 hover:bg-white/10 hover:text-white/80'
            } backdrop-blur-xl`}
          >
            <div className="flex items-center gap-1.5">
              <Wifi className={`h-3.5 w-3.5 ${wifiOn ? '' : 'opacity-30'}`} />
              <BatteryIcon level={battery} />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold tabular-nums leading-none">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-[9px] leading-none mt-0.5 text-white/30">
                {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <ChevronUp className={`h-3 w-3 text-white/30 transition-transform ${trayOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </>
  );
}

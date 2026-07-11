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
import type { AppId } from '../lib/types';

type IconName = keyof typeof LucideIcons;
type IconType = ComponentType<{ className?: string }>;

interface AppEntry { id: AppId; label: string; icon: string; }

const APPS: AppEntry[] = [
  { id: 'files',      label: 'Files',          icon: 'Folder' },
  { id: 'notes',      label: 'Notes',          icon: 'StickyNote' },
  { id: 'editor',     label: 'Text Editor',    icon: 'FileText' },
  { id: 'calculator', label: 'Calculator',     icon: 'Calculator' },
  { id: 'terminal',   label: 'Terminal',       icon: 'TerminalSquare' },
  { id: 'browser',    label: 'Browser',        icon: 'Globe' },
  { id: 'calendar',   label: 'Calendar',       icon: 'Calendar' },
  { id: 'sysmon',     label: 'System Monitor', icon: 'Activity' },
  { id: 'music',      label: 'Music',          icon: 'Music' },
  { id: 'settings',   label: 'Settings',       icon: 'Settings' },
  { id: 'about',      label: 'About',          icon: 'Info' },
];

const DOCK_APPS: AppEntry[] = [
  { id: 'files',      label: 'Files',    icon: 'Folder' },
  { id: 'browser',    label: 'Browser',  icon: 'Globe' },
  { id: 'terminal',   label: 'Terminal', icon: 'TerminalSquare' },
  { id: 'editor',     label: 'Editor',   icon: 'FileText' },
  { id: 'notes',      label: 'Notes',    icon: 'StickyNote' },
  { id: 'music',      label: 'Music',    icon: 'Music' },
  { id: 'calendar',   label: 'Calendar', icon: 'Calendar' },
  { id: 'settings',   label: 'Settings', icon: 'Settings' },
];

function useBattery() {
  const [level, setLevel] = useState(85);
  useEffect(() => {
    const nav = navigator as Navigator & { getBattery?: () => Promise<{ level: number; charging: boolean }> };
    if (nav.getBattery) {
      nav.getBattery().then((b) => setLevel(Math.round(b.level * 100))).catch(() => {});
    }
  }, []);
  return level;
}

function BatteryIcon({ level }: { level: number }) {
  if (level > 60) return <BatteryFull className="h-4 w-4" />;
  if (level > 30) return <BatteryMedium className="h-4 w-4" />;
  return <BatteryLow className="h-4 w-4 text-red-400" />;
}

export default function Taskbar() {
  const { windows, activeId, openApp, toggleFromTaskbar } = useWindowManager();
  const { username, lock, signOut } = useAuth();
  const { settings } = useSettings();
  const [startOpen, setStartOpen] = useState(false);
  const [trayOpen, setTrayOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(new Date());
  const [notifications] = useState(3);
  const [brightness, setBrightness] = useState(80);
  const [volume, setVolume] = useState(65);
  const [wifiOn, setWifiOn] = useState(true);
  const [btOn, setBtOn] = useState(false);
  const battery = useBattery();
  const startRef = useRef<HTMLDivElement>(null);
  const trayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false); setSearch('');
      }
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        setTrayOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  const filtered = APPS.filter((a) => a.label.toLowerCase().includes(search.toLowerCase()));
  const initial = username?.[0]?.toUpperCase() ?? '?';

  const handleAppClick = (id: AppId) => { openApp(id); setStartOpen(false); setSearch(''); };

  return (
    <>
      {/* ── Android-style status bar at top ── */}
      <div className="fixed top-0 left-0 right-0 z-[600] flex h-7 items-center justify-between bg-black/60 px-4 backdrop-blur-md">
        {/* Left: OS name */}
        <div className="flex items-center gap-1.5">
          <TerminalSquare className="h-3 w-3 text-white/50" />
          <span className="font-mono text-[10px] font-medium tracking-widest text-white/40 uppercase">WendelOS</span>
        </div>
        {/* Center: active window title */}
        <div className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/50 truncate max-w-xs">
          {activeId ? windows.find(w => w.id === activeId)?.title ?? '' : ''}
        </div>
        {/* Right: Android-style status icons */}
        <div className="flex items-center gap-2.5 text-white/60">
          {notifications > 0 && (
            <div className="relative">
              <Bell className="h-3 w-3" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 text-[7px] font-bold text-white leading-none">{notifications}</span>
            </div>
          )}
          <Wifi className={`h-3 w-3 ${wifiOn ? 'text-white/60' : 'text-white/20'}`} />
          <BatteryIcon level={battery} />
          <span className="text-[10px] tabular-nums">{battery}%</span>
          <span className="text-[10px] tabular-nums text-white/50">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </span>
        </div>
      </div>

      {/* ── Windows-style Start Menu ── */}
      {startOpen && (
        <div
          ref={startRef}
          className="animate-slide-up fixed bottom-[76px] left-2 z-[500] w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header with user */}
          <div className="flex items-center gap-3 border-b border-white/8 bg-gradient-to-r from-accent-600/20 to-transparent px-4 py-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold text-white shadow">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">@{username}</p>
              <p className="text-[10px] text-slate-500">WendelOS User</p>
            </div>
          </div>

          {/* Search */}
          <div className="p-3 border-b border-white/8">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full rounded-lg border border-white/8 bg-white/5 py-2 pl-8 pr-3 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500/50 focus:bg-white/8"
              />
            </div>
          </div>

          {/* App list */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
            {filtered.map((app) => {
              const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
              const isOpen = windows.some(w => w.app_id === app.id);
              return (
                <button
                  key={app.id}
                  onClick={() => handleAppClick(app.id)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 transition hover:bg-white/8 active:bg-white/12"
                >
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isOpen ? 'bg-accent-500/20 text-accent-400' : 'bg-white/8 text-slate-300'}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-slate-200">{app.label}</span>
                  {isOpen && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-400" />}
                </button>
              );
            })}
            {filtered.length === 0 && <p className="py-6 text-center text-xs text-slate-500">No apps found</p>}
          </div>

          {/* Power row — Linux style */}
          <div className="flex items-center justify-between border-t border-white/8 bg-black/20 px-4 py-2.5">
            <span className="text-[10px] text-slate-600 font-mono uppercase tracking-wider">Session</span>
            <div className="flex gap-1">
              <button onClick={lock} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white" title="Lock">
                <LockIcon className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => void signOut()} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-500/70 hover:text-white" title="Sign Out">
                <LogOut className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => void signOut()} className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-600/80 hover:text-white" title="Power Off">
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Android Quick Settings / Notification Panel ── */}
      {trayOpen && (
        <div
          ref={trayRef}
          className="animate-slide-up fixed bottom-[76px] right-2 z-[500] w-72 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur-2xl"
        >
          <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
            <span className="text-xs font-semibold text-white">Quick Settings</span>
            <button onClick={() => setTrayOpen(false)} className="text-slate-500 hover:text-white transition"><X className="h-3.5 w-3.5" /></button>
          </div>

          {/* Toggle grid — Android quick tiles */}
          <div className="grid grid-cols-4 gap-2 p-3 border-b border-white/8">
            {[
              { label: 'Wi-Fi', icon: Wifi, active: wifiOn, toggle: () => setWifiOn(v => !v) },
              { label: 'Bluetooth', icon: Bluetooth, active: btOn, toggle: () => setBtOn(v => !v) },
              { label: 'Dark', icon: Moon, active: settings.theme === 'dark', toggle: () => {} },
              { label: 'DND', icon: Bell, active: false, toggle: () => {} },
            ].map(({ label, icon: Icon, active, toggle }) => (
              <button
                key={label}
                onClick={toggle}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-2.5 transition ${active ? 'bg-accent-500/25 text-accent-400' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[9px] font-medium leading-none">{label}</span>
              </button>
            ))}
          </div>

          {/* Sliders */}
          <div className="space-y-3 p-4 border-b border-white/8">
            <div className="flex items-center gap-3">
              <Sun className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input type="range" min={10} max={100} value={brightness} onChange={e => setBrightness(+e.target.value)}
                className="flex-1 h-1 accent-sky-400 cursor-pointer" />
              <span className="w-7 text-right text-[10px] text-slate-500">{brightness}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <input type="range" min={0} max={100} value={volume} onChange={e => setVolume(+e.target.value)}
                className="flex-1 h-1 accent-sky-400 cursor-pointer" />
              <span className="w-7 text-right text-[10px] text-slate-500">{volume}%</span>
            </div>
          </div>

          {/* Battery / time */}
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <BatteryIcon level={battery} />
              <span>{battery}% battery</span>
            </div>
            <button onClick={() => { openApp('settings'); setTrayOpen(false); }} className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition">
              <Settings2 className="h-3 w-3" /> Settings
            </button>
          </div>
        </div>
      )}

      {/* ── Bottom bar: Start | Dock | Tray ── */}
      <div className="fixed bottom-0 left-0 right-0 z-[400] flex h-[72px] items-end pb-2 px-3 justify-between">
        {/* Windows-style Start button — bottom left */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => { setStartOpen(v => !v); setTrayOpen(false); }}
            className={`flex h-11 items-center gap-2 rounded-xl px-3 transition ${
              startOpen ? 'bg-accent-500 text-white shadow-lg shadow-accent-500/30' : 'bg-black/40 text-slate-300 hover:bg-white/10 hover:text-white backdrop-blur-xl border border-white/10'
            }`}
          >
            <TerminalSquare className="h-5 w-5" />
            <span className="text-xs font-semibold hidden sm:inline">Start</span>
          </button>
        </div>

        {/* macOS-style centered Dock */}
        <div className="absolute left-1/2 bottom-2 -translate-x-1/2 flex items-end gap-1 rounded-2xl border border-white/10 bg-black/50 px-2 py-1.5 backdrop-blur-2xl shadow-2xl">
          {DOCK_APPS.map((app) => {
            const Icon = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
            const openWins = windows.filter(w => w.app_id === app.id);
            const isActive = openWins.some(w => w.id === activeId);
            const isOpen = openWins.length > 0;
            return (
              <div key={app.id} className="group relative flex flex-col items-center">
                {/* Tooltip */}
                <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 backdrop-blur-sm border border-white/10">
                  {app.label}
                </div>
                <button
                  onClick={() => { if (openWins.length > 0) toggleFromTaskbar(openWins[0].id); else openApp(app.id); }}
                  className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 group-hover:scale-125 group-hover:-translate-y-1 ${
                    isActive
                      ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-lg shadow-accent-500/40'
                      : isOpen
                        ? 'bg-white/15 text-white'
                        : 'bg-white/8 text-slate-300 hover:bg-white/15 hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </button>
                {/* Running dot */}
                <div className={`mt-0.5 h-1 w-1 rounded-full transition-all ${isOpen ? (isActive ? 'bg-accent-400 scale-110' : 'bg-slate-500') : 'bg-transparent'}`} />
              </div>
            );
          })}

          {/* Separator + running extras */}
          {windows.filter(w => !DOCK_APPS.some(d => d.id === w.app_id)).length > 0 && (
            <>
              <div className="mx-1 h-8 w-px bg-white/10 self-center" />
              {windows.filter(w => !DOCK_APPS.some(d => d.id === w.app_id)).map(w => {
                const Icon = (LucideIcons[w.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                const isAct = w.id === activeId;
                return (
                  <div key={w.id} className="group relative flex flex-col items-center">
                    <div className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[10px] font-medium text-white opacity-0 transition-opacity group-hover:opacity-100 border border-white/10">
                      {w.title}
                    </div>
                    <button
                      onClick={() => toggleFromTaskbar(w.id)}
                      className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-150 group-hover:scale-125 group-hover:-translate-y-1 ${isAct ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white' : 'bg-white/8 text-slate-300 hover:bg-white/15'}`}
                    >
                      <Icon className="h-5 w-5" />
                    </button>
                    <div className={`mt-0.5 h-1 w-1 rounded-full ${isAct ? 'bg-accent-400' : 'bg-slate-500'}`} />
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Android/Windows system tray — bottom right */}
        <div className="flex items-center gap-2">
          {/* Tray toggle */}
          <button
            onClick={() => { setTrayOpen(v => !v); setStartOpen(false); }}
            className={`flex h-11 items-center gap-2.5 rounded-xl px-3 transition ${
              trayOpen ? 'bg-accent-500/20 border border-accent-500/40' : 'bg-black/40 border border-white/10 hover:bg-white/10'
            } backdrop-blur-xl`}
          >
            <div className="flex items-center gap-1.5 text-slate-300">
              <Wifi className={`h-3.5 w-3.5 ${wifiOn ? '' : 'opacity-30'}`} />
              <BatteryIcon level={battery} />
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[11px] font-semibold tabular-nums text-slate-200 leading-none">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
              </span>
              <span className="text-[9px] text-slate-500 leading-none mt-0.5">
                {time.toLocaleDateString([], { month: 'short', day: 'numeric' })}
              </span>
            </div>
            <ChevronUp className={`h-3 w-3 text-slate-500 transition-transform ${trayOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
    </>
  );
}

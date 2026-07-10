import { useState, useEffect, useRef, type ComponentType } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  Search, Lock as LockIcon, LogOut,
  Wifi, Volume2, BatteryFull, TerminalSquare,
} from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { useAuth } from '../context/AuthContext';
import type { AppId } from '../lib/types';

type IconName = keyof typeof LucideIcons;
type IconType = ComponentType<{ className?: string }>;

interface AppEntry {
  id: AppId;
  label: string;
  icon: string;
}

const APPS: AppEntry[] = [
  { id: 'files', label: 'Files', icon: 'Folder' },
  { id: 'notes', label: 'Notes', icon: 'StickyNote' },
  { id: 'editor', label: 'Text Editor', icon: 'FileText' },
  { id: 'calculator', label: 'Calculator', icon: 'Calculator' },
  { id: 'terminal', label: 'Terminal', icon: 'TerminalSquare' },
  { id: 'browser', label: 'Browser', icon: 'Globe' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'sysmon', label: 'System Monitor', icon: 'Activity' },
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
  { id: 'about', label: 'About', icon: 'Info' },
];

const QUICK_APPS: AppEntry[] = [
  { id: 'files', label: 'Files', icon: 'Folder' },
  { id: 'browser', label: 'Browser', icon: 'Globe' },
  { id: 'terminal', label: 'Terminal', icon: 'TerminalSquare' },
  { id: 'editor', label: 'Editor', icon: 'FileText' },
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'sysmon', label: 'System Monitor', icon: 'Activity' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export default function Taskbar() {
  const { windows, activeId, openApp, toggleFromTaskbar } = useWindowManager();
  const { username, lock, signOut } = useAuth();
  const [startOpen, setStartOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [time, setTime] = useState(new Date());
  const startRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (startRef.current && !startRef.current.contains(e.target as Node)) {
        setStartOpen(false);
      }
    };
    if (startOpen) {
      window.addEventListener('mousedown', handleClick);
      return () => window.removeEventListener('mousedown', handleClick);
    }
  }, [startOpen]);

  const filtered = APPS.filter((a) =>
    a.label.toLowerCase().includes(search.toLowerCase())
  );

  const handleAppClick = (id: AppId) => {
    openApp(id);
    setStartOpen(false);
    setSearch('');
  };

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <>
      {/* Start Menu */}
      {startOpen && (
        <div
          ref={startRef}
          className="animate-slide-up fixed bottom-16 left-1/2 z-[500] w-[460px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-2xl"
        >
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-gradient-to-r from-accent-500/10 to-transparent px-4 py-3">
            <TerminalSquare className="h-5 w-5 text-accent-400" />
            <span className="text-sm font-semibold text-white">WendelOS</span>
            <span className="text-[10px] text-slate-500">Applications Menu</span>
          </div>

          {/* Search */}
          <div className="border-b border-white/10 p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search apps..."
                className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-10 pr-3 text-sm text-white placeholder-slate-600 outline-none focus:border-accent-500"
              />
            </div>
          </div>

          {/* App grid */}
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin p-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider text-slate-500">
              All Applications
            </p>
            <div className="grid grid-cols-3 gap-1">
              {filtered.map((app) => {
                const Icon: IconType = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
                return (
                  <button
                    key={app.id}
                    onClick={() => handleAppClick(app.id)}
                    className="flex flex-col items-center gap-2 rounded-lg p-3 transition hover:bg-white/10"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slate-700 to-slate-800 text-accent-400 shadow-inner">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-xs font-medium text-slate-300">{app.label}</span>
                  </button>
                );
              })}
              {filtered.length === 0 && (
                <p className="col-span-3 py-8 text-center text-sm text-slate-500">
                  No apps found
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between border-t border-white/10 bg-black/20 px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-sm font-bold text-white">
                {initial}
              </div>
              <span className="text-xs font-medium text-slate-300">
                @{username}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={lock}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
                title="Lock screen"
              >
                <LockIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => void signOut()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-500/80 hover:text-white"
                title="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 z-[400] flex h-14 items-center gap-2 border-t border-white/10 bg-slate-900/80 px-3 backdrop-blur-2xl">
        {/* Start button */}
        <button
          onClick={() => setStartOpen((v) => !v)}
          className={`flex h-10 items-center gap-2 rounded-lg px-3 transition ${
            startOpen
              ? 'bg-accent-500 text-white'
              : 'text-slate-400 hover:bg-white/10 hover:text-white'
          }`}
          title="Applications"
        >
          <TerminalSquare className="h-5 w-5" />
          <span className="hidden text-xs font-semibold sm:inline">WendelOS</span>
        </button>

        <div className="mx-1 h-6 w-px bg-white/10" />

        {/* Quick launch */}
        <div className="flex items-center gap-1">
          {QUICK_APPS.map((app) => {
            const Icon: IconType = (LucideIcons[app.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
            const openWin = windows.find((w) => w.app_id === app.id);
            return (
              <button
                key={app.id}
                onClick={() => {
                  if (openWin) toggleFromTaskbar(openWin.id);
                  else openApp(app.id);
                }}
                className={`group relative flex h-10 w-10 items-center justify-center rounded-lg transition ${
                  openWin
                    ? activeId === openWin.id
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                    : 'text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
                title={app.label}
              >
                <Icon className="h-5 w-5" />
                {openWin && (
                  <div
                    className={`absolute -bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                      activeId === openWin.id ? 'bg-accent-400' : 'bg-slate-500'
                    }`}
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Running windows (not in quick launch) */}
        <div className="flex items-center gap-1">
          {windows
            .filter((w) => !QUICK_APPS.some((q) => q.id === w.app_id))
            .map((w) => {
              const Icon: IconType = (LucideIcons[w.icon as IconName] ?? LucideIcons.AppWindow) as IconType;
              return (
                <button
                  key={w.id}
                  onClick={() => toggleFromTaskbar(w.id)}
                  className={`flex h-10 items-center gap-2 rounded-lg px-3 transition ${
                    activeId === w.id
                      ? 'bg-white/15 text-white'
                      : 'bg-white/5 text-slate-300 hover:bg-white/10'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="max-w-[100px] truncate text-xs font-medium">
                    {w.title}
                  </span>
                </button>
              );
            })}
        </div>

        {/* System tray */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Wifi className="h-4 w-4" />
            <Volume2 className="h-4 w-4" />
            <BatteryFull className="h-4 w-4" />
          </div>
          <div className="flex flex-col items-end text-right">
            <span className="text-xs font-medium tabular-nums text-slate-200">
              {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
            </span>
            <span className="text-[10px] text-slate-500">
              {time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

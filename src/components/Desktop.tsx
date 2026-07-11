import { useState, useRef, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import type { AppId } from '../lib/types';

type IconName = keyof typeof LucideIcons;

interface DesktopIcon { id: AppId; label: string; icon: string; }

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'files',      label: 'Files',          icon: 'Folder' },
  { id: 'browser',    label: 'Browser',        icon: 'Globe' },
  { id: 'terminal',   label: 'Terminal',       icon: 'TerminalSquare' },
  { id: 'editor',     label: 'Text Editor',    icon: 'FileText' },
  { id: 'notes',      label: 'Notes',          icon: 'StickyNote' },
  { id: 'calculator', label: 'Calculator',     icon: 'Calculator' },
  { id: 'sysmon',     label: 'System Monitor', icon: 'Activity' },
  { id: 'music',      label: 'Music',          icon: 'Music' },
  { id: 'calendar',   label: 'Calendar',       icon: 'Calendar' },
  { id: 'settings',   label: 'Settings',       icon: 'Settings' },
];

interface ContextMenu { x: number; y: number; iconId: AppId | null; }

export default function Desktop() {
  const { openApp } = useWindowManager();
  const [selected, setSelected] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ContextMenu | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  const handleDesktopClick = useCallback((e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-desktop-icon]')) setSelected(null);
    if (!(e.target as HTMLElement).closest('[data-ctx-menu]')) setCtx(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleDesktopClick);
    return () => window.removeEventListener('mousedown', handleDesktopClick);
  }, [handleDesktopClick]);

  const handleContextMenu = (e: React.MouseEvent, iconId: AppId | null) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, iconId });
  };

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0"
      style={{ top: 28, bottom: 76 }}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Icon grid — top-left, flowing down then right */}
      <div className="absolute top-0 left-0 flex flex-col flex-wrap gap-1 p-3" style={{ maxHeight: '100%' }}>
        {DESKTOP_ICONS.map((icon) => {
          const Icon = (LucideIcons[icon.icon as IconName] ?? LucideIcons.AppWindow) as React.ComponentType<{ className?: string }>;
          const isSel = selected === icon.id;
          return (
            <button
              key={icon.id}
              data-desktop-icon
              onClick={() => setSelected(icon.id)}
              onDoubleClick={() => openApp(icon.id)}
              onContextMenu={(e) => handleContextMenu(e, icon.id)}
              className={`group flex w-[76px] flex-col items-center gap-1.5 rounded-xl p-2 transition-all ${
                isSel ? 'bg-accent-500/20 ring-1 ring-accent-500/40' : 'hover:bg-white/8'
              }`}
            >
              {/* macOS-style icon with gradient bg */}
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg transition-all group-hover:scale-105 group-hover:shadow-xl ${
                isSel
                  ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white shadow-accent-500/40'
                  : 'bg-gradient-to-br from-slate-700/80 to-slate-800/80 text-slate-200 group-hover:from-slate-600/80 group-hover:to-slate-700/80'
              }`}
                style={{
                  backdropFilter: 'blur(12px)',
                  boxShadow: isSel
                    ? '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.15)'
                    : '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.08)'
                }}
              >
                <Icon className="h-7 w-7" />
              </div>
              <span
                className={`text-center text-[11px] font-medium leading-tight w-full ${isSel ? 'text-white' : 'text-white/90'}`}
                style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
              >
                {icon.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Right-click context menu — Linux/Windows hybrid */}
      {ctx && (
        <div
          ref={ctxRef}
          data-ctx-menu
          className="fixed z-[9000] w-52 overflow-hidden rounded-xl border border-white/12 bg-slate-900/95 py-1 shadow-2xl backdrop-blur-2xl animate-scale-in"
          style={{
            left: Math.min(ctx.x, window.innerWidth - 224),
            top: Math.min(ctx.y, window.innerHeight - 200),
          }}
        >
          {ctx.iconId ? (
            <>
              <button onClick={() => { openApp(ctx.iconId!); setCtx(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.ExternalLink className="h-4 w-4 text-slate-400" />
                Open
              </button>
              <button onClick={() => { openApp(ctx.iconId!); setCtx(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.AppWindow className="h-4 w-4 text-slate-400" />
                Open in new window
              </button>
              <div className="my-1 border-t border-white/8" />
              <button onClick={() => setCtx(null)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-400 hover:bg-white/8 transition">
                <LucideIcons.Info className="h-4 w-4" />
                Properties
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { openApp('settings'); setCtx(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.Settings className="h-4 w-4 text-slate-400" />
                Display Settings
              </button>
              <button onClick={() => setCtx(null)}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.RefreshCw className="h-4 w-4 text-slate-400" />
                Refresh Desktop
              </button>
              <div className="my-1 border-t border-white/8" />
              <button onClick={() => { openApp('terminal'); setCtx(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.TerminalSquare className="h-4 w-4 text-accent-400" />
                Open Terminal Here
              </button>
              <button onClick={() => { openApp('files'); setCtx(null); }}
                className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-slate-200 hover:bg-white/10 transition">
                <LucideIcons.Folder className="h-4 w-4 text-accent-400" />
                Open Files
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

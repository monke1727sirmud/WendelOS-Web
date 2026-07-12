import { useState, useRef, useEffect, useCallback } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import { supabase } from '../lib/supabase';
import type { AppId, InstalledApp } from '../lib/types';

type IconName = keyof typeof LucideIcons;

interface DesktopIcon {
  id: string;
  appId: AppId;
  label: string;
  icon: string;
  gradient: string;
  shadow: string;
  webPayload?: { url: string; name: string; icon: string; color: string };
}

const BUILTIN_ICONS: Omit<DesktopIcon, 'appId'>[] = [
  { id: 'files',      label: 'Files',          icon: 'Folder',         gradient: 'from-sky-400 to-sky-600',        shadow: 'shadow-sky-500/40' },
  { id: 'browser',    label: 'Browser',        icon: 'Globe',          gradient: 'from-blue-400 to-blue-600',      shadow: 'shadow-blue-500/40' },
  { id: 'terminal',   label: 'Terminal',       icon: 'TerminalSquare', gradient: 'from-emerald-400 to-emerald-700', shadow: 'shadow-emerald-500/40' },
  { id: 'editor',     label: 'Text Editor',    icon: 'FileText',       gradient: 'from-amber-400 to-orange-600',   shadow: 'shadow-amber-500/40' },
  { id: 'notes',      label: 'Notes',          icon: 'StickyNote',     gradient: 'from-yellow-400 to-amber-500',   shadow: 'shadow-yellow-500/40' },
  { id: 'calculator', label: 'Calculator',     icon: 'Calculator',     gradient: 'from-slate-400 to-slate-600',    shadow: 'shadow-slate-500/30' },
  { id: 'sysmon',     label: 'System Monitor', icon: 'Activity',       gradient: 'from-red-400 to-rose-600',       shadow: 'shadow-red-500/40' },
  { id: 'music',      label: 'Music',          icon: 'Music',          gradient: 'from-pink-400 to-rose-500',      shadow: 'shadow-pink-500/40' },
  { id: 'calendar',   label: 'Calendar',       icon: 'Calendar',       gradient: 'from-red-400 to-red-600',        shadow: 'shadow-red-500/40' },
  { id: 'settings',   label: 'Settings',       icon: 'Settings',       gradient: 'from-slate-500 to-slate-700',    shadow: 'shadow-slate-500/30' },
  { id: 'store',      label: 'App Store',      icon: 'Store',          gradient: 'from-cyan-400 to-blue-500',      shadow: 'shadow-cyan-500/40' },
];

interface ContextMenu { x: number; y: number; iconId: string | null; }

export default function Desktop() {
  const { openApp } = useWindowManager();
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [ctx, setCtx] = useState<ContextMenu | null>(null);
  const ctxRef = useRef<HTMLDivElement>(null);

  const loadInstalled = useCallback(async () => {
    const { data } = await supabase.from('installed_apps').select('*').order('installed_at');
    if (data) setInstalledApps(data as InstalledApp[]);
  }, []);

  useEffect(() => { void loadInstalled(); }, [loadInstalled]);

  // Refresh when window gains focus (e.g. after installing in Store)
  useEffect(() => {
    const handler = () => { void loadInstalled(); };
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [loadInstalled]);

  const allIcons: DesktopIcon[] = [
    ...BUILTIN_ICONS.map(i => ({ ...i, appId: i.id as AppId })),
    ...installedApps.map(app => ({
      id: `webapp-${app.app_id}`,
      appId: 'webapp' as AppId,
      label: app.name,
      icon: app.icon,
      gradient: app.color,
      shadow: 'shadow-slate-500/30',
      webPayload: { url: app.url, name: app.name, icon: app.icon, color: app.color },
    })),
  ];

  const handleDesktopClick = useCallback((e: MouseEvent) => {
    if (!(e.target as HTMLElement).closest('[data-desktop-icon]')) setSelected(null);
    if (!(e.target as HTMLElement).closest('[data-ctx-menu]')) setCtx(null);
  }, []);

  useEffect(() => {
    window.addEventListener('mousedown', handleDesktopClick);
    return () => window.removeEventListener('mousedown', handleDesktopClick);
  }, [handleDesktopClick]);

  const handleContextMenu = (e: React.MouseEvent, iconId: string | null) => {
    e.preventDefault();
    setCtx({ x: e.clientX, y: e.clientY, iconId });
  };

  const openIcon = (icon: DesktopIcon) => {
    if (icon.webPayload) {
      openApp('webapp', {
        title: icon.label,
        icon: icon.icon,
        width: 1000,
        height: 680,
        payload: icon.webPayload,
      });
    } else {
      openApp(icon.appId);
    }
  };

  return (
    <div
      className="absolute inset-0"
      style={{ top: 28, bottom: 76 }}
      onContextMenu={(e) => handleContextMenu(e, null)}
    >
      {/* Desktop icon grid — macOS top-left flow */}
      <div className="absolute top-0 left-0 flex flex-col flex-wrap gap-1 p-4" style={{ maxHeight: '100%' }}>
        {allIcons.map((icon) => {
          const Icon = (LucideIcons[icon.icon as IconName] ?? LucideIcons.AppWindow) as React.ComponentType<{ className?: string }>;
          const isSel = selected === icon.id;
          return (
            <button
              key={icon.id}
              data-desktop-icon
              onClick={() => setSelected(icon.id)}
              onDoubleClick={() => openIcon(icon)}
              onContextMenu={(e) => handleContextMenu(e, icon.id)}
              className={`group flex w-[76px] flex-col items-center gap-1.5 rounded-xl p-2 transition-all select-none ${
                isSel ? 'bg-white/12' : 'hover:bg-white/6'
              }`}
            >
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-[18px] bg-gradient-to-br shadow-lg transition-all duration-150 group-hover:scale-110 group-hover:-translate-y-0.5 group-active:scale-95 ${icon.gradient} ${icon.shadow} ${
                  isSel ? 'scale-105 brightness-110' : ''
                }`}
                style={{
                  boxShadow: isSel
                    ? `0 6px 20px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.25)`
                    : `0 4px 14px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)`,
                }}
              >
                <Icon className="h-7 w-7 text-white drop-shadow-sm" />
              </div>
              <span
                className={`text-center text-[11px] font-medium leading-tight w-full px-0.5 rounded transition-colors ${
                  isSel ? 'bg-accent-500/60 text-white' : 'text-white/90'
                }`}
                style={{ textShadow: isSel ? 'none' : '0 1px 4px rgba(0,0,0,0.9), 0 0 12px rgba(0,0,0,0.7)' }}
              >
                {icon.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Context menu */}
      {ctx && (
        <div
          ref={ctxRef}
          data-ctx-menu
          className="fixed z-[9000] w-52 overflow-hidden rounded-xl border border-white/10 py-1 shadow-2xl animate-scale-in"
          style={{
            left: Math.min(ctx.x, window.innerWidth - 224),
            top: Math.min(ctx.y, window.innerHeight - 240),
            background: 'rgba(28,28,32,0.97)',
            backdropFilter: 'blur(40px) saturate(180%)',
          }}
        >
          {ctx.iconId ? (
            <>
              <div className="px-3 py-1.5 border-b border-white/8 mb-1">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">
                  {allIcons.find(i => i.id === ctx.iconId)?.label}
                </p>
              </div>
              <CtxItem icon={LucideIcons.ExternalLink} label="Open" onClick={() => {
                const icon = allIcons.find(i => i.id === ctx.iconId);
                if (icon) openIcon(icon);
                setCtx(null);
              }} />
              {allIcons.find(i => i.id === ctx.iconId)?.webPayload && (
                <CtxItem icon={LucideIcons.Trash2} label="Remove from Desktop" onClick={() => setCtx(null)} muted />
              )}
              <div className="my-1 border-t border-white/8" />
              <CtxItem icon={LucideIcons.Info} label="Properties" onClick={() => setCtx(null)} muted />
            </>
          ) : (
            <>
              <div className="px-3 py-1.5 border-b border-white/8 mb-1">
                <p className="text-[10px] font-semibold text-white/30 uppercase tracking-wider">Desktop</p>
              </div>
              <CtxItem icon={LucideIcons.Settings} label="Display Settings" onClick={() => { openApp('settings'); setCtx(null); }} />
              <CtxItem icon={LucideIcons.Store} label="App Store" onClick={() => { openApp('store'); setCtx(null); }} accent />
              <CtxItem icon={LucideIcons.RefreshCw} label="Refresh Desktop" onClick={() => { void loadInstalled(); setCtx(null); }} />
              <div className="my-1 border-t border-white/8" />
              <CtxItem icon={LucideIcons.TerminalSquare} label="Open Terminal" onClick={() => { openApp('terminal'); setCtx(null); }} accent />
              <CtxItem icon={LucideIcons.Folder} label="Open Files" onClick={() => { openApp('files'); setCtx(null); }} accent />
              <CtxItem icon={LucideIcons.Activity} label="System Monitor" onClick={() => { openApp('sysmon'); setCtx(null); }} />
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CtxItem({
  icon: Icon, label, onClick, muted, accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  muted?: boolean;
  accent?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition hover:bg-white/8 active:bg-white/12 ${
        muted ? 'text-white/35' : accent ? 'text-accent-300' : 'text-white/75'
      }`}
    >
      <Icon className={`h-3.5 w-3.5 ${muted ? 'text-white/20' : accent ? 'text-accent-400' : 'text-white/40'}`} />
      {label}
    </button>
  );
}

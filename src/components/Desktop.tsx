import { useState, useRef, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useWindowManager } from '../context/WindowManagerContext';
import type { AppId } from '../lib/types';

type IconName = keyof typeof LucideIcons;

interface DesktopIcon {
  id: AppId;
  label: string;
  icon: string;
}

const DESKTOP_ICONS: DesktopIcon[] = [
  { id: 'files', label: 'Files', icon: 'Folder' },
  { id: 'browser', label: 'Browser', icon: 'Globe' },
  { id: 'terminal', label: 'Terminal', icon: 'TerminalSquare' },
  { id: 'editor', label: 'Text Editor', icon: 'FileText' },
  { id: 'notes', label: 'Notes', icon: 'StickyNote' },
  { id: 'calculator', label: 'Calculator', icon: 'Calculator' },
  { id: 'sysmon', label: 'System Monitor', icon: 'Activity' },
  { id: 'music', label: 'Music', icon: 'Music' },
  { id: 'calendar', label: 'Calendar', icon: 'Calendar' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
];

export default function Desktop() {
  const { openApp } = useWindowManager();
  const [selected, setSelected] = useState<string | null>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (desktopRef.current?.contains(e.target as Node)) {
        const target = e.target as HTMLElement;
        if (!target.closest('[data-desktop-icon]')) {
          setSelected(null);
        }
      }
    };
    window.addEventListener('mousedown', handleClick);
    return () => window.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div
      ref={desktopRef}
      className="absolute inset-0 bottom-14 flex flex-col flex-wrap gap-1 p-4"
    >
      {DESKTOP_ICONS.map((icon) => {
        const Icon = (LucideIcons[icon.icon as IconName] ?? LucideIcons.AppWindow) as React.ComponentType<{ className?: string }>;
        const isSel = selected === icon.id;
        return (
          <button
            key={icon.id}
            data-desktop-icon
            onClick={() => setSelected(icon.id)}
            onDoubleClick={() => openApp(icon.id)}
            className={`group flex w-20 flex-col items-center gap-1.5 rounded-lg p-2.5 transition ${
              isSel ? 'bg-white/15' : 'hover:bg-white/10'
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl shadow-lg transition ${
                isSel
                  ? 'bg-gradient-to-br from-accent-400 to-accent-600 text-white'
                  : 'bg-white/10 text-white group-hover:bg-white/20'
              }`}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span
              className={`text-center text-[11px] font-medium leading-tight ${
                isSel ? 'text-white' : 'text-white/90'
              }`}
              style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
            >
              {icon.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

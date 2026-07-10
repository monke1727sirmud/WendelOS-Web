import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Minus, Square, X, Copy as Restore,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { WindowInstance } from '../lib/types';
import { useWindowManager } from '../context/WindowManagerContext';

type IconName = keyof typeof LucideIcons;

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  const Icon = LucideIcons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? LucideIcons.AppWindow;
}

const TASKBAR_HEIGHT = 56;
const MIN_W = 280;
const MIN_H = 200;

interface DragState {
  startX: number;
  startY: number;
  origX: number;
  origY: number;
}

interface ResizeState {
  startX: number;
  startY: number;
  origW: number;
  origH: number;
  origX: number;
  origY: number;
  dir: string;
}

export default function Window({
  win,
  children,
}: {
  win: WindowInstance;
  children: ReactNode;
}) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindow, activeId } =
    useWindowManager();
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const Icon = getIcon(win.icon);
  const isActive = activeId === win.id;

  const handleDragStart = useCallback(
    (e: React.MouseEvent) => {
      if (win.is_maximized) return;
      if ((e.target as HTMLElement).closest('button')) return;
      focusWindow(win.id);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: win.pos_x,
        origY: win.pos_y,
      };
      setIsDragging(true);
    },
    [win.id, win.pos_x, win.pos_y, win.is_maximized, focusWindow]
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      const newX = dragRef.current.origX + dx;
      const newY = Math.max(0, dragRef.current.origY + dy);
      updateWindow(win.id, { pos_x: newX, pos_y: newY });
    };

    const handleUp = () => {
      dragRef.current = null;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [isDragging, win.id, updateWindow]);

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, dir: string) => {
      e.stopPropagation();
      if (win.is_maximized) return;
      focusWindow(win.id);
      resizeRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        origW: win.width,
        origH: win.height,
        origX: win.pos_x,
        origY: win.pos_y,
        dir,
      };
    },
    [win.id, win.width, win.height, win.pos_x, win.pos_y, win.is_maximized, focusWindow]
  );

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      let { origW, origH, origX, origY } = r;
      let newW = origW;
      let newH = origH;
      let newX = origX;
      let newY = origY;

      if (r.dir.includes('e')) newW = Math.max(MIN_W, origW + dx);
      if (r.dir.includes('s')) newH = Math.max(MIN_H, origH + dy);
      if (r.dir.includes('w')) {
        newW = Math.max(MIN_W, origW - dx);
        newX = origX + (origW - newW);
      }
      if (r.dir.includes('n')) {
        newH = Math.max(MIN_H, origH - dy);
        newY = Math.max(0, origY + (origH - newH));
      }
      updateWindow(win.id, {
        width: newW,
        height: newH,
        pos_x: newX,
        pos_y: newY,
      });
    };

    const handleUp = () => {
      resizeRef.current = null;
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [win.id, updateWindow]);

  if (win.is_minimized) return null;

  const style: React.CSSProperties = win.is_maximized
    ? {
        left: 0,
        top: 0,
        width: '100vw',
        height: `calc(100vh - ${TASKBAR_HEIGHT}px)`,
        zIndex: win.z_index,
      }
    : {
        left: win.pos_x,
        top: win.pos_y,
        width: win.width,
        height: win.height,
        zIndex: win.z_index,
      };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden rounded-xl border transition-shadow ${
        isActive
          ? 'border-white/20 window-shadow'
          : 'border-white/10 shadow-lg'
      } ${isDragging ? '' : 'transition-[box-shadow]'}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      <div className="flex flex-1 flex-col bg-slate-900/95 backdrop-blur-xl">
        {/* Title bar */}
        <div
          onMouseDown={handleDragStart}
          onDoubleClick={() => toggleMaximize(win.id)}
          className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 bg-slate-800/80 px-3 select-none"
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <Icon className="h-4 w-4 shrink-0 text-accent-400" />
            <span className="truncate text-xs font-medium text-slate-300">{win.title}</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => minimizeWindow(win.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              title="Minimize"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => toggleMaximize(win.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
              title={win.is_maximized ? 'Restore' : 'Maximize'}
            >
              {win.is_maximized ? (
                <Restore className="h-3 w-3" />
              ) : (
                <Square className="h-3 w-3" />
              )}
            </button>
            <button
              onClick={() => closeWindow(win.id)}
              className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-500/80 hover:text-white"
              title="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{children}</div>
      </div>

      {/* Resize handles */}
      {!win.is_maximized && (
        <>
          <div onMouseDown={(e) => handleResizeStart(e, 'n')} className="absolute -top-1 left-2 right-2 h-2 cursor-n-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 's')} className="absolute -bottom-1 left-2 right-2 h-2 cursor-s-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'w')} className="absolute -left-1 top-2 bottom-2 w-2 cursor-w-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'e')} className="absolute -right-1 top-2 bottom-2 w-2 cursor-e-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'nw')} className="absolute -left-1 -top-1 h-3 w-3 cursor-nw-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'ne')} className="absolute -right-1 -top-1 h-3 w-3 cursor-ne-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'sw')} className="absolute -left-1 -bottom-1 h-3 w-3 cursor-sw-resize" />
          <div onMouseDown={(e) => handleResizeStart(e, 'se')} className="absolute -right-1 -bottom-1 h-3 w-3 cursor-se-resize" />
        </>
      )}
    </div>
  );
}

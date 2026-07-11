import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Minus, Maximize2, X } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { WindowInstance } from '../lib/types';
import { useWindowManager } from '../context/WindowManagerContext';

type IconName = keyof typeof LucideIcons;

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  const Icon = LucideIcons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? LucideIcons.AppWindow;
}

const TASKBAR_HEIGHT = 72;
const MIN_W = 280;
const MIN_H = 200;

interface DragState { startX: number; startY: number; origX: number; origY: number; }
interface ResizeState { startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; dir: string; }

export default function Window({ win, children }: { win: WindowInstance; children: ReactNode }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindow, activeId } = useWindowManager();
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  const Icon = getIcon(win.icon);
  const isActive = activeId === win.id;

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (win.is_maximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.pos_x, origY: win.pos_y };
    setIsDragging(true);
  }, [win.id, win.pos_x, win.pos_y, win.is_maximized, focusWindow]);

  useEffect(() => {
    if (!isDragging) return;
    const handleMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updateWindow(win.id, { pos_x: dragRef.current.origX + dx, pos_y: Math.max(28, dragRef.current.origY + dy) });
    };
    const handleUp = () => { dragRef.current = null; setIsDragging(false); };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [isDragging, win.id, updateWindow]);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    if (win.is_maximized) return;
    focusWindow(win.id);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height, origX: win.pos_x, origY: win.pos_y, dir };
  }, [win.id, win.width, win.height, win.pos_x, win.pos_y, win.is_maximized, focusWindow]);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      const dx = e.clientX - r.startX;
      const dy = e.clientY - r.startY;
      let newW = r.origW, newH = r.origH, newX = r.origX, newY = r.origY;
      if (r.dir.includes('e')) newW = Math.max(MIN_W, r.origW + dx);
      if (r.dir.includes('s')) newH = Math.max(MIN_H, r.origH + dy);
      if (r.dir.includes('w')) { newW = Math.max(MIN_W, r.origW - dx); newX = r.origX + (r.origW - newW); }
      if (r.dir.includes('n')) { newH = Math.max(MIN_H, r.origH - dy); newY = Math.max(28, r.origY + (r.origH - newH)); }
      updateWindow(win.id, { width: newW, height: newH, pos_x: newX, pos_y: newY });
    };
    const handleUp = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => { window.removeEventListener('mousemove', handleMove); window.removeEventListener('mouseup', handleUp); };
  }, [win.id, updateWindow]);

  if (win.is_minimized) return null;

  const style: React.CSSProperties = win.is_maximized
    ? { left: 0, top: 28, width: '100vw', height: `calc(100vh - ${TASKBAR_HEIGHT + 28}px)`, zIndex: win.z_index }
    : { left: win.pos_x, top: win.pos_y, width: win.width, height: win.height, zIndex: win.z_index };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden transition-shadow ${
        win.is_maximized ? '' : 'rounded-xl'
      } ${isActive ? 'shadow-2xl shadow-black/60 ring-1 ring-white/15' : 'shadow-lg shadow-black/40 ring-1 ring-white/8'}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* macOS-style frosted glass title bar */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={() => toggleMaximize(win.id)}
        className={`flex h-9 shrink-0 items-center px-3 select-none transition-colors ${
          isActive
            ? 'bg-white/[0.08] backdrop-blur-2xl border-b border-white/10'
            : 'bg-black/30 backdrop-blur-xl border-b border-white/5'
        }`}
      >
        {/* macOS traffic-light buttons */}
        <div
          className="flex items-center gap-1.5 mr-3"
          onMouseEnter={() => setHoverControls(true)}
          onMouseLeave={() => setHoverControls(false)}
        >
          {/* Close — red */}
          <button
            onClick={() => closeWindow(win.id)}
            title="Close"
            className="group relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/20 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && <X className="h-2 w-2 text-[#820005] absolute" strokeWidth={3} />}
          </button>
          {/* Minimize — yellow */}
          <button
            onClick={() => minimizeWindow(win.id)}
            title="Minimize"
            className="group relative flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-black/20 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && <Minus className="h-2 w-2 text-[#7d4e00] absolute" strokeWidth={3} />}
          </button>
          {/* Maximize — green */}
          <button
            onClick={() => toggleMaximize(win.id)}
            title={win.is_maximized ? 'Restore' : 'Maximize'}
            className="group relative flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-black/20 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && <Maximize2 className="h-1.5 w-1.5 text-[#005e15] absolute" strokeWidth={3} />}
          </button>
        </div>

        {/* Title — centered like macOS */}
        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-hidden">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white/60' : 'text-white/30'}`} />
          <span className={`truncate text-[12px] font-medium ${isActive ? 'text-white/80' : 'text-white/40'}`}>
            {win.title}
          </span>
        </div>

        {/* Right spacer to balance traffic lights */}
        <div className="w-[54px]" />
      </div>

      {/* Content area */}
      <div className={`flex-1 overflow-hidden bg-slate-900/95 backdrop-blur-xl`}>
        {children}
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

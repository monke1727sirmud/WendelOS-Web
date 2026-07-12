import { useRef, useCallback, useEffect, useState, type ReactNode } from 'react';
import { Minus, Maximize2, X, Minimize2 } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import type { WindowInstance } from '../lib/types';
import { useWindowManager } from '../context/WindowManagerContext';

type IconName = keyof typeof LucideIcons;

function getIcon(name: string): React.ComponentType<{ className?: string }> {
  const Icon = LucideIcons[name as IconName] as React.ComponentType<{ className?: string }> | undefined;
  return Icon ?? LucideIcons.AppWindow;
}

const TASKBAR_HEIGHT = 72;
const STATUS_BAR_HEIGHT = 28;
const MIN_W = 320;
const MIN_H = 220;

interface DragState { startX: number; startY: number; origX: number; origY: number; }
interface ResizeState { startX: number; startY: number; origW: number; origH: number; origX: number; origY: number; dir: string; }

export default function Window({ win, children }: { win: WindowInstance; children: ReactNode }) {
  const { focusWindow, closeWindow, minimizeWindow, toggleMaximize, updateWindow, activeId } = useWindowManager();
  const dragRef = useRef<DragState | null>(null);
  const resizeRef = useRef<ResizeState | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoverControls, setHoverControls] = useState(false);
  const [mounted, setMounted] = useState(false);
  const Icon = getIcon(win.icon);
  const isActive = activeId === win.id;

  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (win.is_maximized) return;
    if ((e.target as HTMLElement).closest('button')) return;
    focusWindow(win.id);
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: win.pos_x, origY: win.pos_y };
    setIsDragging(true);
  }, [win.id, win.pos_x, win.pos_y, win.is_maximized, focusWindow]);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      updateWindow(win.id, {
        pos_x: dragRef.current.origX + dx,
        pos_y: Math.max(STATUS_BAR_HEIGHT, dragRef.current.origY + dy),
      });
    };
    const onUp = () => { dragRef.current = null; setIsDragging(false); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [isDragging, win.id, updateWindow]);

  const handleResizeStart = useCallback((e: React.MouseEvent, dir: string) => {
    e.stopPropagation();
    if (win.is_maximized) return;
    focusWindow(win.id);
    resizeRef.current = { startX: e.clientX, startY: e.clientY, origW: win.width, origH: win.height, origX: win.pos_x, origY: win.pos_y, dir };
  }, [win.id, win.width, win.height, win.pos_x, win.pos_y, win.is_maximized, focusWindow]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      const dx = e.clientX - r.startX, dy = e.clientY - r.startY;
      let newW = r.origW, newH = r.origH, newX = r.origX, newY = r.origY;
      if (r.dir.includes('e')) newW = Math.max(MIN_W, r.origW + dx);
      if (r.dir.includes('s')) newH = Math.max(MIN_H, r.origH + dy);
      if (r.dir.includes('w')) { newW = Math.max(MIN_W, r.origW - dx); newX = r.origX + (r.origW - newW); }
      if (r.dir.includes('n')) { newH = Math.max(MIN_H, r.origH - dy); newY = Math.max(STATUS_BAR_HEIGHT, r.origY + (r.origH - newH)); }
      updateWindow(win.id, { width: newW, height: newH, pos_x: newX, pos_y: newY });
    };
    const onUp = () => { resizeRef.current = null; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
  }, [win.id, updateWindow]);

  if (win.is_minimized) return null;

  const style: React.CSSProperties = win.is_maximized
    ? { left: 0, top: STATUS_BAR_HEIGHT, width: '100vw', height: `calc(100vh - ${TASKBAR_HEIGHT + STATUS_BAR_HEIGHT}px)`, zIndex: win.z_index }
    : { left: win.pos_x, top: win.pos_y, width: win.width, height: win.height, zIndex: win.z_index };

  return (
    <div
      className={`absolute flex flex-col overflow-hidden transition-all duration-200 ${
        win.is_maximized ? '' : 'rounded-xl'
      } ${
        isActive
          ? 'shadow-[0_20px_60px_rgba(0,0,0,0.7),0_4px_16px_rgba(0,0,0,0.5)] ring-1 ring-white/12'
          : 'shadow-[0_8px_32px_rgba(0,0,0,0.5)] ring-1 ring-white/6'
      } ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.94]'}`}
      style={style}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar — macOS frosted glass */}
      <div
        onMouseDown={handleDragStart}
        onDoubleClick={() => toggleMaximize(win.id)}
        className={`group flex h-[38px] shrink-0 select-none items-center px-3 transition-colors ${
          isActive
            ? 'border-b border-white/10'
            : 'border-b border-white/5'
        }`}
        style={{
          background: isActive
            ? 'linear-gradient(180deg, rgba(50,50,55,0.95) 0%, rgba(35,35,40,0.95) 100%)'
            : 'linear-gradient(180deg, rgba(28,28,30,0.95) 0%, rgba(22,22,24,0.95) 100%)',
          backdropFilter: 'blur(40px) saturate(180%)',
        }}
      >
        {/* macOS traffic lights */}
        <div
          className="flex items-center gap-1.5 mr-3 shrink-0"
          onMouseEnter={() => setHoverControls(true)}
          onMouseLeave={() => setHoverControls(false)}
        >
          <button
            onClick={() => closeWindow(win.id)}
            title="Close"
            className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#ff5f57] ring-1 ring-black/25 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && <X className="absolute h-2 w-2 text-[#820005]" strokeWidth={2.5} />}
          </button>
          <button
            onClick={() => minimizeWindow(win.id)}
            title="Minimize"
            className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#febc2e] ring-1 ring-black/25 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && <Minus className="absolute h-2 w-2 text-[#7d4e00]" strokeWidth={2.5} />}
          </button>
          <button
            onClick={() => toggleMaximize(win.id)}
            title={win.is_maximized ? 'Restore' : 'Maximize'}
            className="relative flex h-3 w-3 items-center justify-center rounded-full bg-[#28c840] ring-1 ring-black/25 transition hover:brightness-90 active:brightness-75"
          >
            {hoverControls && (
              win.is_maximized
                ? <Minimize2 className="absolute h-1.5 w-1.5 text-[#005e15]" strokeWidth={2.5} />
                : <Maximize2 className="absolute h-1.5 w-1.5 text-[#005e15]" strokeWidth={2.5} />
            )}
          </button>
        </div>

        {/* Centered title — macOS style */}
        <div className="flex flex-1 items-center justify-center gap-1.5 overflow-hidden min-w-0">
          <Icon className={`h-3.5 w-3.5 shrink-0 ${isActive ? 'text-white/50' : 'text-white/25'}`} />
          <span className={`truncate text-[12px] font-medium tracking-tight ${isActive ? 'text-white/75' : 'text-white/35'}`}>
            {win.title}
          </span>
        </div>

        {/* Spacer to balance traffic lights */}
        <div className="w-[54px] shrink-0" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background: '#1c1c1e' }}>
        {children}
      </div>

      {/* Resize handles */}
      {!win.is_maximized && (
        <>
          <div onMouseDown={e => handleResizeStart(e, 'n')}  className="absolute -top-1 left-3 right-3 h-2 cursor-n-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 's')}  className="absolute -bottom-1 left-3 right-3 h-2 cursor-s-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'w')}  className="absolute -left-1 top-3 bottom-3 w-2 cursor-w-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'e')}  className="absolute -right-1 top-3 bottom-3 w-2 cursor-e-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'nw')} className="absolute -left-1 -top-1 h-4 w-4 cursor-nw-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'ne')} className="absolute -right-1 -top-1 h-4 w-4 cursor-ne-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'sw')} className="absolute -left-1 -bottom-1 h-4 w-4 cursor-sw-resize z-10" />
          <div onMouseDown={e => handleResizeStart(e, 'se')} className="absolute -right-1 -bottom-1 h-4 w-4 cursor-se-resize z-10" />
        </>
      )}
    </div>
  );
}

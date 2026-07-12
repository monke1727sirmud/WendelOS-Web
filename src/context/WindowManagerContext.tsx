import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import type { AppId, WindowInstance } from '../lib/types';

interface OpenOptions {
  title?: string;
  icon?: string;
  width?: number;
  height?: number;
  payload?: Record<string, unknown>;
}

interface WindowManagerValue {
  windows: WindowInstance[];
  activeId: string | null;
  openApp: (appId: AppId, opts?: OpenOptions) => void;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  toggleMaximize: (id: string) => void;
  updateWindow: (id: string, patch: Partial<WindowInstance>) => void;
  toggleFromTaskbar: (id: string) => void;
}

const WindowManagerContext = createContext<WindowManagerValue | null>(null);

export function useWindowManager() {
  const ctx = useContext(WindowManagerContext);
  if (!ctx) throw new Error('useWindowManager must be used within WindowManagerProvider');
  return ctx;
}

const APP_DEFAULTS: Record<AppId, { title: string; icon: string; width: number; height: number }> = {
  files: { title: 'Files', icon: 'Folder', width: 780, height: 520 },
  notes: { title: 'Notes', icon: 'StickyNote', width: 300, height: 300 },
  editor: { title: 'Text Editor', icon: 'FileText', width: 680, height: 520 },
  calculator: { title: 'Calculator', icon: 'Calculator', width: 320, height: 480 },
  terminal: { title: 'Terminal', icon: 'TerminalSquare', width: 680, height: 440 },
  settings: { title: 'Settings', icon: 'Settings', width: 640, height: 520 },
  browser: { title: 'Browser', icon: 'Globe', width: 900, height: 600 },
  calendar: { title: 'Calendar', icon: 'Calendar', width: 820, height: 560 },
  sysmon: { title: 'System Monitor', icon: 'Activity', width: 680, height: 520 },
  music: { title: 'Music', icon: 'Music', width: 480, height: 560 },
  about: { title: 'About WendelOS', icon: 'Info', width: 480, height: 540 },
  store: { title: 'App Store', icon: 'Store', width: 860, height: 580 },
  webapp: { title: 'Web App', icon: 'Globe', width: 1000, height: 680 },
};

let zCounter = 100;
let idCounter = 0;

export function WindowManagerProvider({ children }: { children: ReactNode }) {
  const [windows, setWindows] = useState<WindowInstance[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const offsetRef = useRef(0);

  const focusWindow = useCallback((id: string) => {
    zCounter += 1;
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, z_index: zCounter, is_minimized: false } : w))
    );
    setActiveId(id);
  }, []);

  const openApp = useCallback(
    (appId: AppId, opts?: OpenOptions) => {
      const existing = windows.find((w) => w.app_id === appId && !opts?.payload);
      if (existing) {
        focusWindow(existing.id);
        return;
      }

      const defaults = APP_DEFAULTS[appId];
      idCounter += 1;
      offsetRef.current = (offsetRef.current + 1) % 8;
      zCounter += 1;
      const offset = offsetRef.current * 28;
      const newWin: WindowInstance = {
        id: `win-${idCounter}`,
        app_id: appId,
        title: opts?.title ?? defaults.title,
        icon: opts?.icon ?? defaults.icon,
        pos_x: 80 + offset,
        pos_y: 60 + offset,
        width: opts?.width ?? defaults.width,
        height: opts?.height ?? defaults.height,
        z_index: zCounter,
        is_minimized: false,
        is_maximized: false,
        payload: opts?.payload,
      };
      setWindows((prev) => [...prev, newWin]);
      setActiveId(newWin.id);
    },
    [windows, focusWindow]
  );

  const closeWindow = useCallback((id: string) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const minimizeWindow = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_minimized: true } : w))
    );
    setActiveId((prev) => (prev === id ? null : prev));
  }, []);

  const toggleMaximize = useCallback((id: string) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, is_maximized: !w.is_maximized } : w))
    );
  }, []);

  const updateWindow = useCallback((id: string, patch: Partial<WindowInstance>) => {
    setWindows((prev) => prev.map((w) => (w.id === id ? { ...w, ...patch } : w)));
  }, []);

  const toggleFromTaskbar = useCallback(
    (id: string) => {
      const win = windows.find((w) => w.id === id);
      if (!win) return;
      if (win.is_minimized) {
        focusWindow(id);
      } else if (activeId === id) {
        minimizeWindow(id);
      } else {
        focusWindow(id);
      }
    },
    [windows, activeId, focusWindow, minimizeWindow]
  );

  return (
    <WindowManagerContext.Provider
      value={{
        windows,
        activeId,
        openApp,
        closeWindow,
        focusWindow,
        minimizeWindow,
        toggleMaximize,
        updateWindow,
        toggleFromTaskbar,
      }}
    >
      {children}
    </WindowManagerContext.Provider>
  );
}

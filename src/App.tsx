import { useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { WindowManagerProvider, useWindowManager } from './context/WindowManagerContext';
import { QuotaProvider } from './context/QuotaContext';
import LoginScreen from './components/LoginScreen';
import LockScreen from './components/LockScreen';
import Desktop from './components/Desktop';
import Taskbar from './components/Taskbar';
import Window from './components/Window';
import { wallpaperCss, type AppId } from './lib/types';

import FilesApp from './apps/FilesApp';
import NotesApp from './apps/NotesApp';
import EditorApp from './apps/EditorApp';
import CalculatorApp from './apps/CalculatorApp';
import TerminalApp from './apps/TerminalApp';
import SettingsApp from './apps/SettingsApp';
import BrowserApp from './apps/BrowserApp';
import CalendarApp from './apps/CalendarApp';
import SystemMonitorApp from './apps/SystemMonitorApp';
import MusicPlayerApp from './apps/MusicPlayerApp';
import AboutApp from './apps/AboutApp';
import StoreApp from './apps/StoreApp';
import WebAppViewer from './apps/WebAppViewer';

function renderApp(appId: AppId, payload?: Record<string, unknown>) {
  switch (appId) {
    case 'files':      return <FilesApp />;
    case 'notes':      return <NotesApp />;
    case 'editor':     return <EditorApp payload={payload} />;
    case 'calculator': return <CalculatorApp />;
    case 'terminal':   return <TerminalApp />;
    case 'settings':   return <SettingsApp />;
    case 'browser':    return <BrowserApp />;
    case 'calendar':   return <CalendarApp />;
    case 'sysmon':     return <SystemMonitorApp />;
    case 'music':      return <MusicPlayerApp />;
    case 'about':      return <AboutApp />;
    case 'store':      return <StoreApp />;
    case 'webapp':
      if (payload?.url) {
        return (
          <WebAppViewer
            url={payload.url as string}
            name={payload.name as string ?? 'Web App'}
            icon={payload.icon as string ?? 'Globe'}
            color={payload.color as string ?? 'from-sky-400 to-sky-600'}
          />
        );
      }
      return <BrowserApp />;
    default:
      return null;
  }
}

function DesktopShell() {
  const { settings } = useSettings();
  const { windows } = useWindowManager();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark', 'light');
    root.classList.add(settings.theme);
    root.classList.remove(
      'accent-sky', 'accent-emerald', 'accent-amber',
      'accent-rose', 'accent-cyan', 'accent-violet'
    );
    root.classList.add(`accent-${settings.accent_color}`);
  }, [settings.theme, settings.accent_color]);

  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: wallpaperCss(settings.wallpaper) }}
    >
      <Desktop />
      {windows.map((win) => (
        <Window key={win.id} win={win}>
          {renderApp(win.app_id, win.payload)}
        </Window>
      ))}
      <Taskbar />
    </div>
  );
}

function AppContent() {
  const { authState, isLocked } = useAuth();

  if (authState === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-pulse-soft rounded-xl bg-gradient-to-br from-accent-400 to-accent-600" />
          <p className="text-sm text-slate-500">Loading WendelOS...</p>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <LoginScreen />;
  }

  return (
    <>
      <DesktopShell />
      {isLocked && <LockScreen />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <WindowManagerProvider>
          <QuotaProvider>
            <AppContent />
          </QuotaProvider>
        </WindowManagerProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

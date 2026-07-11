import { useState, useEffect } from 'react';
import { Lock, Loader2, Eye, EyeOff, Power, LogOut, TerminalSquare, Wifi, BatteryFull, Bell, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

function StatusBar() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <div className="absolute top-0 left-0 right-0 z-30 flex h-7 items-center justify-between bg-black/60 px-4 backdrop-blur-md select-none">
      <div className="flex items-center gap-1.5">
        <TerminalSquare className="h-3 w-3 text-white/50" />
        <span className="font-mono text-[10px] font-medium tracking-widest text-white/40 uppercase">WendelOS</span>
      </div>
      <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/35">Screen Locked</span>
      <div className="flex items-center gap-2.5 text-white/50">
        <Bell className="h-3 w-3" />
        <Wifi className="h-3 w-3" />
        <BatteryFull className="h-3 w-3" />
        <span className="text-[10px] tabular-nums">
          {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </span>
      </div>
    </div>
  );
}

export default function LockScreen() {
  const { username, unlock, signOut } = useAuth();
  const { settings } = useSettings();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());
  const [shake, setShake] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    setError(null);
    const { error: err } = await unlock(password);
    setLoading(false);
    if (err) {
      setError('Incorrect password');
      setPassword('');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden select-none">
      {/* Blurred desktop wallpaper overlay */}
      <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-3xl" />

      {/* Android status bar */}
      <StatusBar />

      <div className="relative z-10 flex h-full flex-col items-center justify-center" style={{ paddingTop: 28 }}>

        {/* Clock — same style as LoginScreen lock view */}
        <div className="mb-12 text-center">
          <div
            className="text-[88px] font-thin text-white leading-none"
            style={{ letterSpacing: '-0.04em', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}
          >
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
          </div>
          <div className="mt-3 text-base font-light text-white/45 tracking-widest uppercase">
            {time.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>

        {/* macOS-style user + unlock card */}
        <div className="w-full max-w-[300px] px-4">
          {/* Avatar */}
          <div className="mb-5 flex flex-col items-center gap-2.5">
            <div
              className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-bold text-white ring-2 ring-white/15"
              style={{
                background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
              }}
            >
              {initial}
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-white/80">@{username}</p>
              <p className="text-[10px] text-white/30 mt-0.5">WendelOS · Locked</p>
            </div>
          </div>

          {/* Frosted glass card */}
          <div
            className={`rounded-2xl border border-white/10 p-5 shadow-2xl transition-transform ${shake ? 'animate-[wiggle_0.4s_ease-in-out]' : ''}`}
            style={{
              background: 'rgba(10, 15, 30, 0.75)',
              backdropFilter: 'blur(40px) saturate(180%)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
            }}
          >
            <form onSubmit={handleUnlock} className="space-y-2.5">
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter password"
                  autoFocus
                  autoComplete="current-password"
                  className={`w-full rounded-xl border bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-white/20 outline-none text-center transition ${
                    error
                      ? 'border-red-500/40 focus:ring-1 focus:ring-red-500/20'
                      : 'border-white/8 focus:border-accent-400/50 focus:ring-1 focus:ring-accent-400/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/20 hover:text-white/50 transition"
                >
                  {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {error && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] text-red-400">
                  <AlertCircle className="h-3 w-3" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
                style={{
                  background: 'linear-gradient(180deg, var(--accent-400) 0%, var(--accent-600) 100%)',
                  boxShadow: '0 4px 16px color-mix(in srgb, var(--accent-500) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
                }}
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Unlock'}
              </button>
            </form>
          </div>

          {/* Linux-style session controls below card */}
          <div className="mt-4 flex items-center justify-center gap-1">
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-white/30 transition hover:bg-white/8 hover:text-white/60"
            >
              <LogOut className="h-3 w-3" />
              Sign out
            </button>
            <div className="h-3 w-px bg-white/10" />
            <button
              onClick={() => void signOut()}
              className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] text-white/30 transition hover:bg-red-500/15 hover:text-red-400"
            >
              <Power className="h-3 w-3" />
              Power off
            </button>
          </div>
        </div>

        {/* Auto-lock notice — bottom */}
        <div className="absolute bottom-5 text-[10px] font-mono text-white/15 tracking-wider uppercase">
          Auto-locked after {settings.auto_lock_minutes}m of inactivity
        </div>
      </div>

      <style>{`
        @keyframes wiggle {
          0%,100% { transform: translateX(0); }
          20% { transform: translateX(-6px); }
          40% { transform: translateX(6px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }
      `}</style>
    </div>
  );
}

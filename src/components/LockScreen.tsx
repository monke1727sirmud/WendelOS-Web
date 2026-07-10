import { useState, useEffect } from 'react';
import { Lock, Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export default function LockScreen() {
  const { username, unlock, signOut } = useAuth();
  const { settings } = useSettings();
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [time, setTime] = useState(new Date());

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
      setError('Incorrect password. Try again.');
      setPassword('');
    } else {
      setPassword('');
    }
  };

  const initial = username?.[0]?.toUpperCase() ?? '?';

  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-2xl" />

      <div className="relative z-10 flex flex-col items-center px-6">
        <div className="mb-6 text-center">
          <p className="text-7xl font-extralight tabular-nums tracking-tighter text-white">
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}
          </p>
          <p className="mt-2 text-sm font-light text-slate-400">
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="mb-6 flex flex-col items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-600 text-3xl font-bold text-white shadow-lg shadow-accent-500/30">
            {initial}
          </div>
          <p className="mt-4 text-sm font-medium text-white">@{username}</p>
        </div>

        <form onSubmit={handleUnlock} className="w-full max-w-xs">
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type={showPw ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password to unlock"
              autoFocus
              autoComplete="current-password"
              className={`w-full rounded-xl border bg-white/5 py-3 pl-10 pr-10 text-center text-sm text-white placeholder-slate-500 outline-none transition ${
                error
                  ? 'border-red-500/50 focus:ring-2 focus:ring-red-500/20'
                  : 'border-white/10 focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && <p className="mt-2 text-center text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/20 transition hover:bg-accent-600 disabled:opacity-40"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Unlock'
            )}
          </button>
        </form>

        <button
          onClick={() => void signOut()}
          className="mt-6 text-xs text-slate-500 transition hover:text-slate-300"
        >
          Sign out instead
        </button>
      </div>

      <div className="absolute bottom-6 left-0 right-0 text-center text-xs text-slate-600">
        WendelOS locked - auto-lock active ({settings.auto_lock_minutes}m)
      </div>
    </div>
  );
}

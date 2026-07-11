import { useState, useMemo, useCallback, useEffect } from 'react';
import {
  Lock, User, Eye, EyeOff, ChevronRight, Loader2,
  TerminalSquare, X, Check, AlertCircle, Wifi,
  BatteryFull, Bell, Power, LogIn, UserPlus,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

function scorePassword(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-red-400', 'bg-amber-400', 'bg-yellow-400', 'bg-emerald-400', 'bg-emerald-300'];
  return { score: s, label: labels[s], color: colors[s] };
}

function Clock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="select-none text-center">
      <div className="text-[88px] font-thin text-white leading-none" style={{ letterSpacing: '-0.04em', textShadow: '0 4px 40px rgba(0,0,0,0.6)' }}>
        {time}
      </div>
      <div className="mt-3 text-base font-light text-white/55 tracking-widest uppercase">{date}</div>
    </div>
  );
}

/* Android-style status bar — mirrors the desktop one */
function StatusBar({ centerLabel }: { centerLabel?: string }) {
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
      {centerLabel && (
        <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-medium text-white/40 truncate max-w-xs">
          {centerLabel}
        </span>
      )}
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

export default function LoginScreen() {
  const { signIn, signUp, isUsernameTaken } = useAuth();

  const [view, setView] = useState<'lock' | 'signin' | 'signup'>('lock');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  const pwScore = useMemo(() => scorePassword(password), [password]);

  const checkUsername = useCallback(async (name: string) => {
    if (!USERNAME_REGEX.test(name) || name.length < 3) { setUsernameStatus('idle'); return; }
    setUsernameStatus('checking');
    const taken = await isUsernameTaken(name);
    setUsernameStatus(taken ? 'taken' : 'available');
  }, [isUsernameTaken]);

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setError(null);
    if (view === 'signup' && val.length >= 3) void checkUsername(val);
    else setUsernameStatus('idle');
  };

  const handleBack = () => {
    setView('lock');
    setPassword('');
    setError(null);
    setUsernameStatus('idle');
  };

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) { setError('Please enter a username.'); return; }
    if (username.trim().length < 3) { setError('Username must be at least 3 characters.'); return; }
    if (!USERNAME_REGEX.test(username.trim())) { setError('Letters, numbers, and underscores only.'); return; }
    if (!password) { setError('Please enter your password.'); return; }
    if (view === 'signup' && password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (view === 'signup' && usernameStatus === 'taken') { setError('That username is already taken.'); return; }

    setLoading(true);
    const fn = view === 'signin' ? signIn : signUp;
    const { error: err } = await fn(username.trim(), password);
    setLoading(false);

    if (err) {
      if (err.toLowerCase().includes('already') || err.includes('already taken')) setError('That username is already taken.');
      else if (err.toLowerCase().includes('invalid') || err.toLowerCase().includes('credentials')) setError('Invalid username or password.');
      else setError(err);
    }
  }, [view, username, password, usernameStatus, signIn, signUp]);

  const fillTestAccount = () => {
    setUsername('testuser');
    setPassword('testpassword123');
    setError(null);
    if (view === 'lock') setView('signin');
  };

  const initial = username ? username[0].toUpperCase() : null;

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Wallpaper — same style as desktop wallpaper system */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
      />
      <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" />

      {/* Android status bar */}
      <StatusBar centerLabel={view === 'signin' ? 'Sign In' : view === 'signup' ? 'Create Account' : undefined} />

      {/* ── LOCK VIEW — clock + user tile ── */}
      {view === 'lock' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-14 animate-fade-in" style={{ paddingTop: 28 }}>
          <Clock />

          {/* macOS-style user tile */}
          <button
            onClick={() => setView('signin')}
            className="group flex flex-col items-center gap-4 transition"
          >
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-600/80 to-slate-800/80 ring-2 ring-white/15 shadow-2xl backdrop-blur-xl transition-all duration-200 group-hover:ring-white/40 group-hover:scale-105"
              style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)' }}
            >
              <User className="h-11 w-11 text-white/60" strokeWidth={1.5} />
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <span className="text-base font-semibold text-white/80 group-hover:text-white transition">Guest / User</span>
              <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/8 px-3 py-1 text-[11px] text-white/40 backdrop-blur-sm group-hover:bg-white/15 group-hover:text-white/60 transition">
                <Lock className="h-2.5 w-2.5" />
                Click to sign in
                <ChevronRight className="h-2.5 w-2.5" />
              </div>
            </div>
          </button>

          {/* Bottom dock-style row — Windows power + test badge */}
          <div className="absolute bottom-6 left-0 right-0 flex items-center justify-between px-6">
            {/* Linux power hint */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-white/20 uppercase tracking-widest">
              <Power className="h-3 w-3" />
              <span>WendelOS 1.0</span>
            </div>

            {/* Test account — amber badge */}
            <button
              onClick={fillTestAccount}
              className="flex items-center gap-2 rounded-xl border border-amber-400/25 bg-amber-400/8 px-3 py-1.5 text-[11px] text-amber-300/60 backdrop-blur-sm transition hover:bg-amber-400/18 hover:text-amber-300 hover:border-amber-400/40"
            >
              <span className="font-mono font-bold tracking-wider text-amber-400/70">TEST</span>
              <span className="text-amber-400/30">—</span>
              <span>Sign in with test account</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* ── SIGN IN / SIGN UP ── */}
      {(view === 'signin' || view === 'signup') && (
        <div className="absolute inset-0 z-10 flex items-center justify-center animate-fade-in" style={{ paddingTop: 28 }}>
          <div className="w-full max-w-[340px] px-4">

            {/* Avatar + title — macOS login style */}
            <div className="mb-5 flex flex-col items-center gap-3">
              <div
                className="flex h-[72px] w-[72px] items-center justify-center rounded-full text-2xl font-bold text-white shadow-2xl ring-2 ring-white/15 transition-all"
                style={{
                  background: initial
                    ? 'linear-gradient(135deg, var(--accent-400), var(--accent-700))'
                    : 'linear-gradient(135deg, #334155, #1e293b)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.15)',
                }}
              >
                {initial ?? <User className="h-8 w-8 text-white/60" strokeWidth={1.5} />}
              </div>
              <div className="text-center">
                <h1 className="text-lg font-semibold text-white leading-tight" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>
                  {view === 'signin'
                    ? (username ? `Welcome, @${username}` : 'Sign In')
                    : 'Create Account'}
                </h1>
                <p className="text-[11px] text-white/35 mt-0.5">WendelOS · Local Session</p>
              </div>
            </div>

            {/* macOS frosted glass card */}
            <div
              className="rounded-2xl border border-white/10 p-5 shadow-2xl"
              style={{
                background: 'rgba(10, 15, 30, 0.75)',
                backdropFilter: 'blur(40px) saturate(180%)',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <form onSubmit={handleSubmit} className="space-y-2.5">
                {/* Username */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-[13px] text-white/25 select-none">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      autoComplete="username"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoFocus
                      className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-8 pr-9 text-sm text-white placeholder-white/20 outline-none transition focus:border-accent-400/50 focus:bg-white/8 focus:ring-1 focus:ring-accent-400/20"
                    />
                    {view === 'signup' && usernameStatus !== 'idle' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="h-3.5 w-3.5 animate-spin text-white/25" />}
                        {usernameStatus === 'available' && <Check className="h-3.5 w-3.5 text-emerald-400" />}
                        {usernameStatus === 'taken' && <X className="h-3.5 w-3.5 text-rose-400" />}
                      </div>
                    )}
                  </div>
                  {view === 'signup' && (
                    <p className={`mt-1 text-[10px] pl-1 ${
                      usernameStatus === 'available' ? 'text-emerald-400' :
                      usernameStatus === 'taken' ? 'text-rose-400' : 'text-white/20'
                    }`}>
                      {usernameStatus === 'available' ? 'Username available'
                        : usernameStatus === 'taken' ? 'Username taken'
                        : '3+ chars — letters, numbers, underscores'}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder={view === 'signup' ? 'password (min 8 chars)' : 'password'}
                      autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                      className="w-full rounded-xl border border-white/8 bg-white/5 py-2.5 pl-9 pr-9 text-sm text-white placeholder-white/20 outline-none transition focus:border-accent-400/50 focus:bg-white/8 focus:ring-1 focus:ring-accent-400/20"
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
                  {view === 'signup' && password.length > 0 && (
                    <div className="mt-1.5 pl-1">
                      <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => (
                          <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i < pwScore.score ? pwScore.color : 'bg-white/8'}`} />
                        ))}
                      </div>
                      <p className="mt-0.5 text-[10px] text-white/25">{pwScore.label}</p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/15 bg-red-500/8 px-3 py-2 text-[11px] text-red-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* macOS-style primary button */}
                <button
                  type="submit"
                  disabled={loading || (view === 'signup' && usernameStatus === 'taken')}
                  className="mt-0.5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-40"
                  style={{
                    background: 'linear-gradient(180deg, var(--accent-400) 0%, var(--accent-600) 100%)',
                    boxShadow: '0 4px 16px color-mix(in srgb, var(--accent-500) 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.2)',
                  }}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : view === 'signin' ? (
                    <><LogIn className="h-4 w-4" /> Sign In</>
                  ) : (
                    <><UserPlus className="h-4 w-4" /> Create Account</>
                  )}
                </button>
              </form>

              {/* Switch mode */}
              <div className="mt-4 flex items-center gap-2">
                <div className="flex-1 border-t border-white/6" />
                <span className="text-[10px] text-white/20">or</span>
                <div className="flex-1 border-t border-white/6" />
              </div>
              <div className="mt-3 text-center text-xs text-white/25">
                {view === 'signin' ? (
                  <span>No account?{' '}
                    <button onClick={() => { setView('signup'); setError(null); setPassword(''); }}
                      className="font-semibold text-accent-400 hover:text-accent-300 transition">
                      Register
                    </button>
                  </span>
                ) : (
                  <span>Have an account?{' '}
                    <button onClick={() => { setView('signin'); setError(null); setPassword(''); setUsernameStatus('idle'); }}
                      className="font-semibold text-accent-400 hover:text-accent-300 transition">
                      Sign in
                    </button>
                  </span>
                )}
              </div>
            </div>

            {/* Back — Linux breadcrumb style */}
            <button
              onClick={handleBack}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-[11px] text-white/25 transition hover:text-white/50"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Back to lock screen
            </button>

            {/* Test badge — Windows notification card style */}
            <div className="mt-4 flex justify-center">
              <button
                onClick={fillTestAccount}
                className="flex items-center gap-2 rounded-xl border border-amber-400/20 bg-amber-400/6 px-3 py-2 text-[11px] text-amber-300/55 backdrop-blur-sm transition hover:bg-amber-400/12 hover:text-amber-300/80 hover:border-amber-400/35"
              >
                <span className="font-mono font-bold tracking-wider text-amber-400/65">TEST</span>
                <span className="text-amber-400/25">—</span>
                <span>Fill test account credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

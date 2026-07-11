import { useState, useMemo, useCallback, useEffect } from 'react';
import { Lock, User, Eye, EyeOff, ChevronRight, Loader2, TerminalSquare, X, Check, AlertCircle } from 'lucide-react';
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
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const date = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  return (
    <div className="select-none text-center">
      <div className="text-8xl font-thin tracking-tight text-white drop-shadow-2xl" style={{ fontFamily: 'Inter, system-ui, sans-serif', letterSpacing: '-0.03em' }}>
        {time}
      </div>
      <div className="mt-2 text-lg font-light text-white/70 tracking-wide">{date}</div>
    </div>
  );
}

export default function LoginScreen() {
  const { signIn, signUp, isUsernameTaken } = useAuth();

  // view: 'lock' = fullscreen clock/user picker, 'signin' = login form, 'signup' = register form
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
      if (err.toLowerCase().includes('already') || err.includes('already taken')) {
        setError('That username is already taken.');
      } else if (err.toLowerCase().includes('invalid') || err.toLowerCase().includes('credentials')) {
        setError('Invalid username or password.');
      } else {
        setError(err);
      }
    }
  }, [view, username, password, usernameStatus, signIn, signUp]);

  const fillTestAccount = () => {
    setUsername('testuser');
    setPassword('testpassword123');
    setError(null);
    if (view === 'lock') setView('signin');
  };

  const initial = username ? username[0].toUpperCase() : '?';

  return (
    <div className="fixed inset-0 overflow-hidden select-none">
      {/* Wallpaper */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(https://images.pexels.com/photos/1525041/pexels-photo-1525041.jpeg?auto=compress&cs=tinysrgb&w=1920)' }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Top-left system label */}
      <div className="absolute top-6 left-8 z-20 flex items-center gap-2 opacity-60">
        <TerminalSquare className="h-4 w-4 text-white" strokeWidth={2} />
        <span className="font-mono text-xs text-white tracking-widest uppercase">WendelOS 1.0</span>
      </div>

      {/* Lock screen — clock + user tile */}
      {view === 'lock' && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-16 animate-fade-in">
          <Clock />
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setView('signin')}
              className="group flex flex-col items-center gap-3 transition"
            >
              <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 ring-2 ring-white/20 shadow-2xl transition-all group-hover:ring-white/50 group-hover:scale-105">
                <User className="h-10 w-10 text-white/70" strokeWidth={1.5} />
              </div>
              <span className="text-base font-medium text-white/80 group-hover:text-white transition">Guest / User</span>
              <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs text-white/50 backdrop-blur-sm group-hover:bg-white/20 transition">
                Click to sign in
                <ChevronRight className="h-3 w-3" />
              </div>
            </button>
          </div>

          {/* Test account badge */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
            <button
              onClick={fillTestAccount}
              className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2 text-xs text-amber-300 backdrop-blur-sm transition hover:bg-amber-400/20 hover:border-amber-400/50"
            >
              <span className="font-mono font-semibold">TEST</span>
              <span className="text-amber-400/60">|</span>
              <span>Sign in with test account</span>
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* Sign-in form */}
      {(view === 'signin' || view === 'signup') && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center animate-fade-in">
          <div className="w-full max-w-sm px-4">
            {/* Avatar */}
            <div className="mb-6 flex flex-col items-center gap-3">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 text-3xl font-semibold text-white shadow-2xl ring-2 ring-white/20">
                {username ? initial : <User className="h-9 w-9 text-white/80" strokeWidth={1.5} />}
              </div>
              {view === 'signin' && (
                <h2 className="text-xl font-semibold text-white drop-shadow">
                  {username ? `@${username}` : 'Sign In'}
                </h2>
              )}
              {view === 'signup' && (
                <h2 className="text-xl font-semibold text-white drop-shadow">Create Account</h2>
              )}
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-2xl">
              <form onSubmit={handleSubmit} className="space-y-3">

                {/* Username — always shown */}
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-mono text-sm text-white/30">@</span>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => handleUsernameChange(e.target.value)}
                      placeholder="username"
                      autoComplete="username"
                      autoCapitalize="off"
                      spellCheck={false}
                      autoFocus
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-8 pr-10 text-sm text-white placeholder-white/25 outline-none transition focus:border-accent-400/60 focus:bg-white/8 focus:ring-2 focus:ring-accent-400/20"
                    />
                    {view === 'signup' && usernameStatus !== 'idle' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {usernameStatus === 'checking' && <Loader2 className="h-4 w-4 animate-spin text-white/30" />}
                        {usernameStatus === 'available' && <Check className="h-4 w-4 text-emerald-400" />}
                        {usernameStatus === 'taken' && <X className="h-4 w-4 text-rose-400" />}
                      </div>
                    )}
                  </div>
                  {view === 'signup' && (
                    <p className={`mt-1.5 text-[11px] ${
                      usernameStatus === 'available' ? 'text-emerald-400' :
                      usernameStatus === 'taken' ? 'text-rose-400' :
                      'text-white/25'
                    }`}>
                      {usernameStatus === 'available' ? 'Username is available' :
                       usernameStatus === 'taken' ? 'Username is taken' :
                       '3+ chars, letters/numbers/underscore'}
                    </p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                    <input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setError(null); }}
                      placeholder={view === 'signup' ? 'password (min 8 chars)' : 'password'}
                      autoComplete={view === 'signin' ? 'current-password' : 'new-password'}
                      className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-9 pr-10 text-sm text-white placeholder-white/25 outline-none transition focus:border-accent-400/60 focus:bg-white/8 focus:ring-2 focus:ring-accent-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/25 transition hover:text-white/60"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>

                  {view === 'signup' && password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[0,1,2,3,4].map(i => (
                          <div key={i} className={`h-0.5 flex-1 rounded-full transition-all ${i < pwScore.score ? pwScore.color : 'bg-white/10'}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-white/30">{pwScore.label}</p>
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    {error}
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading || (view === 'signup' && usernameStatus === 'taken')}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-accent-500 py-3 text-sm font-semibold text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600 active:scale-[0.98] disabled:opacity-40"
                >
                  {loading
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : view === 'signin' ? 'Sign In' : 'Create Account'
                  }
                </button>
              </form>

              {/* Toggle mode */}
              <div className="mt-4 text-center text-xs text-white/30">
                {view === 'signin' ? (
                  <>No account?{' '}
                    <button onClick={() => { setView('signup'); setError(null); setPassword(''); }}
                      className="text-accent-400 hover:text-accent-300 transition font-medium">
                      Create one
                    </button>
                  </>
                ) : (
                  <>Already have an account?{' '}
                    <button onClick={() => { setView('signin'); setError(null); setPassword(''); setUsernameStatus('idle'); }}
                      className="text-accent-400 hover:text-accent-300 transition font-medium">
                      Sign in
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Back button */}
            <button
              onClick={handleBack}
              className="mt-4 flex w-full items-center justify-center gap-1.5 text-xs text-white/30 transition hover:text-white/60"
            >
              <ChevronRight className="h-3 w-3 rotate-180" />
              Back to lock screen
            </button>

            {/* Test account badge */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={fillTestAccount}
                className="flex items-center gap-2 rounded-full border border-amber-400/25 bg-amber-400/8 px-4 py-2 text-xs text-amber-300/70 backdrop-blur-sm transition hover:bg-amber-400/15 hover:text-amber-300 hover:border-amber-400/40"
              >
                <span className="font-mono font-bold tracking-wider text-amber-400/80">TEST</span>
                <span className="text-amber-400/30">—</span>
                <span>Fill test account credentials</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

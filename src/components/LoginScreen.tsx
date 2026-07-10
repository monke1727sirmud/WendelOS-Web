import { useState, useMemo, useCallback } from 'react';
import { Lock, User, Eye, EyeOff, ArrowRight, Loader2, TerminalSquare, AtSign } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Mode = 'signin' | 'signup';

function scorePassword(pw: string): { score: number; label: string; color: string } {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;

  const labels = ['Too short', 'Weak', 'Fair', 'Good', 'Strong', 'Excellent'];
  const colors = ['bg-red-500', 'bg-red-500', 'bg-amber-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-400'];
  return { score, label: labels[score], color: colors[score] };
}

const USERNAME_REGEX = /^[a-zA-Z0-9_]+$/;

export default function LoginScreen() {
  const { signIn, signUp, isUsernameTaken } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [usernameStatus, setUsernameStatus] = useState<'idle' | 'checking' | 'taken' | 'available'>('idle');

  const pwScore = useMemo(() => scorePassword(password), [password]);

  const checkUsername = useCallback(
    async (name: string) => {
      if (name.length < 3) {
        setUsernameStatus('idle');
        return;
      }
      setUsernameStatus('checking');
      const taken = await isUsernameTaken(name);
      setUsernameStatus(taken ? 'taken' : 'available');
    },
    [isUsernameTaken]
  );

  const handleUsernameChange = (val: string) => {
    setUsername(val);
    setError(null);
    if (mode === 'signup' && val.length >= 3) {
      void checkUsername(val);
    } else {
      setUsernameStatus('idle');
    }
  };

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setSuccess(null);

      if (!username.trim() || !password) {
        setError('Please fill in all fields.');
        return;
      }
      if (username.trim().length < 3) {
        setError('Username must be at least 3 characters long.');
        return;
      }
      if (!USERNAME_REGEX.test(username.trim())) {
        setError('Username can only contain letters, numbers, and underscores.');
        return;
      }
      if (mode === 'signup' && password.length < 8) {
        setError('Password must be at least 8 characters long.');
        return;
      }

      setLoading(true);
      const fn = mode === 'signin' ? signIn : signUp;
      const { error: err } = await fn(username.trim(), password);
      setLoading(false);

      if (err) {
        if (err.toLowerCase().includes('already') || err.includes('already taken')) {
          setError('That username is already taken. Try another one.');
        } else if (err.includes('Invalid login') || err.includes('invalid credentials')) {
          setError('Invalid username or password. Please try again.');
        } else {
          setError(err);
        }
      } else if (mode === 'signup') {
        setSuccess('Account created! Welcome to WendelOS.');
      }
    },
    [mode, username, password, signIn, signUp]
  );

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden bg-slate-950">
      <div className="absolute inset-0 opacity-40">
        <div className="absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-accent-600/30 blur-[120px]" />
        <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-emerald-600/20 blur-[120px]" />
        <div className="absolute top-1/3 right-1/4 h-[400px] w-[400px] rounded-full bg-rose-600/15 blur-[100px]" />
      </div>

      <div className="relative z-10 w-full max-w-md px-6">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg shadow-accent-500/30">
            <TerminalSquare className="h-8 w-8 text-white" strokeWidth={2.2} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-white">WendelOS</h1>
          <p className="mt-1.5 text-sm text-slate-400">
            Linux-inspired desktop in your browser
          </p>
          <p className="mt-1 font-mono text-[10px] text-slate-600">
            v1.0 "Tuxedo" - wsh 1.0.0
          </p>
        </div>

        <div className="glass rounded-2xl border border-white/10 p-8 shadow-2xl">
          <div className="mb-6 flex gap-1 rounded-lg bg-black/30 p-1">
            {(['signin', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setError(null);
                  setSuccess(null);
                  setUsernameStatus('idle');
                }}
                className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                  mode === m
                    ? 'bg-accent-500 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
                {mode === 'signup' && usernameStatus !== 'idle' && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    {usernameStatus === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                    )}
                    {usernameStatus === 'available' && (
                      <span className="text-[10px] font-semibold text-emerald-400">FREE</span>
                    )}
                    {usernameStatus === 'taken' && (
                      <span className="text-[10px] font-semibold text-rose-400">TAKEN</span>
                    )}
                  </div>
                )}
              </div>
              {mode === 'signup' && usernameStatus === 'taken' && (
                <p className="mt-1.5 text-xs text-rose-400">This username is already in use.</p>
              )}
              {mode === 'signup' && usernameStatus === 'available' && (
                <p className="mt-1.5 text-xs text-emerald-400">Username is available.</p>
              )}
              {mode === 'signup' && usernameStatus === 'idle' && (
                <p className="mt-1.5 text-xs text-slate-600">3+ characters, letters/numbers/underscore only.</p>
              )}
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min 8 characters' : 'Enter password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  className="w-full rounded-lg border border-white/10 bg-black/30 py-2.5 pl-10 pr-10 text-sm text-white placeholder-slate-600 outline-none transition focus:border-accent-500 focus:ring-2 focus:ring-accent-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === 'signup' && password.length > 0 && (
                <div className="mt-2.5">
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i < pwScore.score ? pwScore.color : 'bg-white/10'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500">
                    {pwScore.label}
                    {pwScore.score >= 4 && ' - use uppercase, numbers & symbols'}
                  </p>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-sm text-red-300">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || (mode === 'signup' && usernameStatus === 'taken')}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 py-2.5 text-sm font-semibold text-white shadow-lg shadow-accent-500/20 transition hover:bg-accent-600 disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          <AtSign className="mr-1 inline h-3 w-3" />
          Username-based authentication - No email required
        </p>
      </div>
    </div>
  );
}

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type AuthState = 'loading' | 'authenticated' | 'unauthenticated';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  authState: AuthState;
  username: string;
  isLocked: boolean;
  lock: () => void;
  unlock: (password: string) => Promise<{ error: string | null }>;
  signIn: (
    username: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signUp: (
    username: string,
    password: string
  ) => Promise<{ error: string | null }>;
  isUsernameTaken: (username: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  autoLockMinutes: number;
  setAutoLockMinutes: (m: number) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

const LOCK_KEY = 'wendelos_locked';
const SYNTHETIC_DOMAIN = 'wendelos.local';

function toSyntheticEmail(username: string) {
  return `${username.toLowerCase()}@${SYNTHETIC_DOMAIN}`;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthState>('loading');
  const [isLocked, setIsLocked] = useState(false);
  const [username, setUsername] = useState('');
  const [autoLockMinutes, setAutoLockMinutesState] = useState(5);
  const lockTimerRef = useRef<number | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const clearLockTimer = useCallback(() => {
    if (lockTimerRef.current) {
      window.clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, []);

  const armLockTimer = useCallback(
    (minutes: number) => {
      clearLockTimer();
      if (minutes <= 0) return;
      const ms = minutes * 60 * 1000;
      lockTimerRef.current = window.setTimeout(() => {
        setIsLocked(true);
        sessionStorage.setItem(LOCK_KEY, '1');
      }, ms);
    },
    [clearLockTimer]
  );

  const resetActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    if (authState === 'authenticated' && !isLocked) {
      armLockTimer(autoLockMinutes);
    }
  }, [authState, isLocked, autoLockMinutes, armLockTimer]);

  const loadUsername = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('username')
      .eq('user_id', userId)
      .maybeSingle();
    if (data?.username) {
      setUsername(data.username);
    } else {
      const email = session?.user?.email ?? '';
      const fallback = email.split('@')[0] ?? 'user';
      setUsername(fallback);
    }
  }, [session]);

  useEffect(() => {
    const init = (async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      setAuthState(data.session ? 'authenticated' : 'unauthenticated');
      if (data.session && sessionStorage.getItem(LOCK_KEY) === '1') {
        setIsLocked(true);
      }
      if (data.session?.user?.id) {
        await loadUsername(data.session.user.id);
      }
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      (async () => {
        setSession(sess);
        setAuthState(sess ? 'authenticated' : 'unauthenticated');
        if (sess?.user?.id) {
          await loadUsername(sess.user.id);
        } else {
          setUsername('');
        }
        if (!sess) {
          setIsLocked(false);
          sessionStorage.removeItem(LOCK_KEY);
          clearLockTimer();
        }
      })();
    });

    const activityHandler = () => resetActivity();
    const events: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'scroll',
      'touchstart',
    ];
    events.forEach((e) => window.addEventListener(e, activityHandler, { passive: true }));

    return () => {
      sub.subscription.unsubscribe();
      clearLockTimer();
      events.forEach((e) => window.removeEventListener(e, activityHandler));
      void init;
    };
  }, [clearLockTimer, resetActivity, loadUsername]);

  useEffect(() => {
    if (authState === 'authenticated' && !isLocked) {
      armLockTimer(autoLockMinutes);
    }
  }, [authState, isLocked, autoLockMinutes, armLockTimer]);

  const isUsernameTaken = useCallback(async (uname: string): Promise<boolean> => {
    const { data, error } = await supabase.rpc('is_username_taken', {
      p_username: uname.toLowerCase(),
    });
    if (error) return false;
    return data === true;
  }, []);

  const signIn = useCallback(
    async (uname: string, password: string) => {
      const email = toSyntheticEmail(uname);
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      return { error: error?.message ?? null };
    },
    []
  );

  const signUp = useCallback(async (uname: string, password: string) => {
    const email = toSyntheticEmail(uname);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').insert({
        user_id: data.user.id,
        username: uname.toLowerCase(),
        synthetic_email: email,
      });
      if (profileError) {
        if (profileError.code === '23505') {
          return { error: 'That username is already taken.' };
        }
        return { error: profileError.message };
      }
      setUsername(uname.toLowerCase());
    }
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    clearLockTimer();
    sessionStorage.removeItem(LOCK_KEY);
    setIsLocked(false);
    setUsername('');
    await supabase.auth.signOut();
  }, [clearLockTimer]);

  const lock = useCallback(() => {
    setIsLocked(true);
    sessionStorage.setItem(LOCK_KEY, '1');
  }, []);

  const unlock = useCallback(async (password: string) => {
    if (!session?.user?.email) return { error: 'No active session' };
    const { error } = await supabase.auth.signInWithPassword({
      email: session.user.email,
      password,
    });
    if (error) return { error: error.message };
    setIsLocked(false);
    sessionStorage.removeItem(LOCK_KEY);
    armLockTimer(autoLockMinutes);
    return { error: null };
  }, [session, autoLockMinutes, armLockTimer]);

  const setAutoLockMinutes = useCallback(
    (m: number) => {
      setAutoLockMinutesState(m);
      if (authState === 'authenticated' && !isLocked) armLockTimer(m);
    },
    [authState, isLocked, armLockTimer]
  );

  return (
    <AuthContext.Provider
      value={{
        user: session?.user ?? null,
        session,
        authState,
        username,
        isLocked,
        lock,
        unlock,
        signIn,
        signUp,
        isUsernameTaken,
        signOut,
        autoLockMinutes,
        setAutoLockMinutes,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

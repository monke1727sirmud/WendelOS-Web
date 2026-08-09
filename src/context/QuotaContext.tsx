import {
  createContext, useContext, useState, useEffect, useCallback,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';

export interface QuotaLimits {
  files_limit: number;
  storage_limit_mb: number;
  notes_limit: number;
  events_limit: number;
  installed_apps_limit: number;
}

export interface QuotaUsage {
  files_count: number;
  folders_count: number;
  storage_bytes: number;
  notes_count: number;
  events_count: number;
  installed_apps_count: number;
}

export interface QuotaState {
  limits: QuotaLimits;
  usage: QuotaUsage;
  loading: boolean;
  refresh: () => Promise<void>;
  /** Returns true if the resource is at or over its limit */
  isOver: (resource: QuotaResource) => boolean;
  /** 0-1 fill fraction */
  fraction: (resource: QuotaResource) => number;
}

export type QuotaResource =
  | 'files'
  | 'storage'
  | 'notes'
  | 'events'
  | 'installed_apps';

const DEFAULT_LIMITS: QuotaLimits = {
  files_limit: 500,
  storage_limit_mb: 100,
  notes_limit: 100,
  events_limit: 500,
  installed_apps_limit: 20,
};

const DEFAULT_USAGE: QuotaUsage = {
  files_count: 0,
  folders_count: 0,
  storage_bytes: 0,
  notes_count: 0,
  events_count: 0,
  installed_apps_count: 0,
};

const QuotaContext = createContext<QuotaState>({
  limits: DEFAULT_LIMITS,
  usage: DEFAULT_USAGE,
  loading: true,
  refresh: async () => {},
  isOver: () => false,
  fraction: () => 0,
});

export function QuotaProvider({ children }: { children: ReactNode }) {
  const { authState, isDevPreview } = useAuth();
  const [limits, setLimits] = useState<QuotaLimits>(DEFAULT_LIMITS);
  const [usage, setUsage] = useState<QuotaUsage>(DEFAULT_USAGE);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (authState !== 'authenticated') return;
    if (isDevPreview) {
      setLimits(DEFAULT_LIMITS);
      setUsage(DEFAULT_USAGE);
      setLoading(false);
      return;
    }
    const [limitsRes, usageRes] = await Promise.all([
      supabase.from('user_quotas').select('*').maybeSingle(),
      supabase.rpc('get_user_usage', { uid: (await supabase.auth.getUser()).data.user?.id ?? '' }),
    ]);
    if (limitsRes.data) setLimits(limitsRes.data as QuotaLimits);
    if (usageRes.data) setUsage(usageRes.data as QuotaUsage);
    setLoading(false);
  }, [authState, isDevPreview]);

  useEffect(() => {
    if (authState === 'authenticated') void refresh();
  }, [authState, refresh]);

  const isOver = useCallback((resource: QuotaResource): boolean => {
    switch (resource) {
      case 'files':         return usage.files_count >= limits.files_limit;
      case 'storage':       return usage.storage_bytes >= limits.storage_limit_mb * 1024 * 1024;
      case 'notes':         return usage.notes_count >= limits.notes_limit;
      case 'events':        return usage.events_count >= limits.events_limit;
      case 'installed_apps': return usage.installed_apps_count >= limits.installed_apps_limit;
    }
  }, [usage, limits]);

  const fraction = useCallback((resource: QuotaResource): number => {
    switch (resource) {
      case 'files':         return Math.min(1, usage.files_count / Math.max(1, limits.files_limit));
      case 'storage':       return Math.min(1, usage.storage_bytes / Math.max(1, limits.storage_limit_mb * 1024 * 1024));
      case 'notes':         return Math.min(1, usage.notes_count / Math.max(1, limits.notes_limit));
      case 'events':        return Math.min(1, usage.events_count / Math.max(1, limits.events_limit));
      case 'installed_apps': return Math.min(1, usage.installed_apps_count / Math.max(1, limits.installed_apps_limit));
    }
  }, [usage, limits]);

  return (
    <QuotaContext.Provider value={{ limits, usage, loading, refresh, isOver, fraction }}>
      {children}
    </QuotaContext.Provider>
  );
}

export function useQuota() {
  return useContext(QuotaContext);
}

/** Formats bytes to human-readable string */
export function fmtBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import { useState, useEffect, useCallback } from 'react';
import {
  Store, Download, Trash2, ExternalLink, Search,
  Star, Loader2, Check, Package, X, Globe,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { supabase } from '../lib/supabase';
import { APP_CATALOG, type CatalogApp, type InstalledApp } from '../lib/types';
import { useWindowManager } from '../context/WindowManagerContext';

type IconName = keyof typeof LucideIcons;

const CATEGORIES = [
  { id: 'all',          label: 'All' },
  { id: 'featured',     label: 'Featured' },
  { id: 'productivity', label: 'Productivity' },
  { id: 'development',  label: 'Development' },
  { id: 'design',       label: 'Design' },
  { id: 'media',        label: 'Media' },
  { id: 'games',        label: 'Games' },
  { id: 'tools',        label: 'Tools' },
  { id: 'reference',    label: 'Reference' },
];

function AppIcon({ icon, color, size = 'md' }: { icon: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const Icon = (LucideIcons[icon as IconName] ?? LucideIcons.Globe) as React.ComponentType<{ className?: string }>;
  const sizes = { sm: 'h-10 w-10 rounded-xl', md: 'h-14 w-14 rounded-2xl', lg: 'h-20 w-20 rounded-3xl' };
  const iconSizes = { sm: 'h-5 w-5', md: 'h-7 w-7', lg: 'h-10 w-10' };
  return (
    <div className={`flex shrink-0 items-center justify-center bg-gradient-to-br ${color} ${sizes[size]} shadow-lg`}
      style={{ boxShadow: '0 4px 16px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.18)' }}>
      <Icon className={`${iconSizes[size]} text-white drop-shadow-sm`} />
    </div>
  );
}

export default function StoreApp() {
  const { openApp } = useWindowManager();
  const [installed, setInstalled] = useState<InstalledApp[]>([]);
  const [loading, setLoading] = useState(true);
  const [installing, setInstalling] = useState<Set<string>>(new Set());
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [detail, setDetail] = useState<CatalogApp | null>(null);

  const loadInstalled = useCallback(async () => {
    const { data } = await supabase.from('installed_apps').select('*');
    if (data) setInstalled(data as InstalledApp[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadInstalled(); }, [loadInstalled]);

  const isInstalled = (appId: string) => installed.some(a => a.app_id === appId);

  const install = async (app: CatalogApp) => {
    if (isInstalled(app.id)) return;
    setInstalling(prev => new Set(prev).add(app.id));
    await supabase.from('installed_apps').insert({
      app_id: app.id,
      name: app.name,
      icon: app.icon,
      url: app.url,
      color: app.color,
      category: app.category,
    });
    await loadInstalled();
    setInstalling(prev => { const n = new Set(prev); n.delete(app.id); return n; });
  };

  const uninstall = async (app: CatalogApp) => {
    await supabase.from('installed_apps').delete().eq('app_id', app.id);
    await loadInstalled();
    setDetail(null);
  };

  const open = (app: CatalogApp) => {
    openApp('webapp', {
      title: app.name,
      icon: app.icon,
      width: 1000,
      height: 680,
      payload: { url: app.url, name: app.name, icon: app.icon, color: app.color },
    });
  };

  const filtered = APP_CATALOG.filter(app => {
    const matchCat = category === 'all' ? true : category === 'featured' ? !!app.featured : app.category === category;
    const matchSearch = search === '' || app.name.toLowerCase().includes(search.toLowerCase()) || app.tags.some(t => t.includes(search.toLowerCase()));
    return matchCat && matchSearch;
  });

  return (
    <div className="flex h-full bg-[#1c1c1e]">
      {/* Sidebar */}
      <div className="flex w-44 shrink-0 flex-col border-r border-white/8 bg-[#252528]">
        <div className="border-b border-white/8 p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/25 pointer-events-none" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
              className="w-full rounded-xl border border-white/8 bg-white/5 py-2 pl-8 pr-2 text-xs text-white placeholder-white/20 outline-none focus:border-accent-500/40" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
          {CATEGORIES.map(c => (
            <button key={c.id} onClick={() => { setCategory(c.id); setSearch(''); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-xs transition ${
                category === c.id && !search ? 'bg-accent-500/15 text-accent-300 border-l-2 border-accent-500' : 'text-white/40 hover:bg-white/5 hover:text-white/70 border-l-2 border-transparent'
              }`}>
              {c.id === 'featured' && <Star className="h-3.5 w-3.5" />}
              {c.id !== 'featured' && <Package className="h-3.5 w-3.5" />}
              {c.label}
            </button>
          ))}

          {installed.length > 0 && (
            <>
              <div className="mx-3 my-2 border-t border-white/8" />
              <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white/20">Installed</p>
              {installed.map(app => (
                <button key={app.id} onClick={() => open({ ...app, app_id: app.app_id, description: '', tags: [], id: app.app_id } as unknown as CatalogApp)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-white/40 hover:bg-white/5 hover:text-white/70 transition border-l-2 border-transparent">
                  <AppIcon icon={app.icon} color={app.color} size="sm" />
                  <span className="truncate">{app.name}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 border-b border-white/8 bg-[#1c1c1e] px-5 py-3.5">
          <Store className="h-5 w-5 text-accent-400" />
          <div>
            <h1 className="text-sm font-semibold text-white">App Store</h1>
            <p className="text-[11px] text-white/30">{filtered.length} apps · {installed.length} installed</p>
          </div>
        </div>

        {/* Featured banner (when on 'all' or 'featured') */}
        {(category === 'all' || category === 'featured') && !search && (
          <div className="border-b border-white/8 p-4">
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">Featured</p>
            <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-thin">
              {APP_CATALOG.filter(a => a.featured).map(app => {
                const inst = isInstalled(app.id);
                return (
                  <div key={app.id} onClick={() => setDetail(app)}
                    className="group relative flex w-48 shrink-0 cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/8 bg-[#252528] transition hover:border-white/20 hover:shadow-xl">
                    <div className={`flex h-24 items-center justify-center bg-gradient-to-br ${app.color} opacity-80`}>
                      <AppIcon icon={app.icon} color={app.color} size="lg" />
                    </div>
                    <div className="p-3">
                      <p className="text-xs font-semibold text-white">{app.name}</p>
                      <p className="mt-0.5 text-[10px] text-white/30 line-clamp-2">{app.description}</p>
                    </div>
                    {inst && <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 shadow"><Check className="h-3 w-3 text-white" /></div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* App grid */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
          {loading ? (
            <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
          ) : (
            <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))' }}>
              {filtered.map(app => {
                const inst = isInstalled(app.id);
                const isInstalling = installing.has(app.id);
                return (
                  <div key={app.id} onClick={() => setDetail(app)}
                    className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-white/6 bg-[#252528] p-3.5 transition hover:border-white/15 hover:bg-[#2c2c30]">
                    <AppIcon icon={app.icon} color={app.color} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-white/85 truncate">{app.name}</p>
                        {app.featured && <Star className="h-3 w-3 text-amber-400 shrink-0" />}
                      </div>
                      <p className="mt-0.5 text-[11px] text-white/35 truncate capitalize">{app.category}</p>
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      {inst && (
                        <button onClick={e => { e.stopPropagation(); open(app); }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-white/40 transition hover:bg-white/10 hover:text-white">
                          <ExternalLink className="h-3.5 w-3.5" />
                        </button>
                      )}
                      <button onClick={e => { e.stopPropagation(); inst ? void uninstall(app) : void install(app); }}
                        disabled={isInstalling}
                        className={`flex h-7 min-w-[70px] items-center justify-center gap-1.5 rounded-lg text-xs font-medium transition ${
                          inst
                            ? 'border border-white/10 text-white/40 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400'
                            : 'bg-accent-500 text-white hover:bg-accent-600'
                        } disabled:opacity-50`}>
                        {isInstalling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> :
                          inst ? <><Trash2 className="h-3.5 w-3.5" /> Remove</> :
                          <><Download className="h-3.5 w-3.5" /> Get</>}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detail sheet */}
      {detail && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setDetail(null)}>
          <div className="animate-scale-in w-96 overflow-hidden rounded-3xl border border-white/12 bg-[#252528] shadow-2xl" onClick={e => e.stopPropagation()}>
            {/* Header banner */}
            <div className={`relative flex h-32 items-end justify-center bg-gradient-to-br ${detail.color}`}>
              <div className="absolute inset-0 opacity-30"
                style={{ background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15) 0%, transparent 70%)' }} />
              <div className="mb-4">
                <AppIcon icon={detail.icon} color={detail.color} size="lg" />
              </div>
              <button onClick={() => setDetail(null)} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50 transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              <div className="mb-1 flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{detail.name}</h2>
                {detail.featured && <Star className="h-4 w-4 text-amber-400" />}
              </div>
              <p className="mb-1 text-xs font-medium capitalize text-white/30">{detail.category}</p>
              <p className="text-sm text-white/60 leading-relaxed">{detail.description}</p>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {detail.tags.map(t => (
                  <span key={t} className="rounded-full border border-white/8 bg-white/4 px-2.5 py-0.5 text-[10px] text-white/40">{t}</span>
                ))}
              </div>

              <div className="mt-4 flex items-center gap-1.5 text-[11px] text-white/25">
                <Globe className="h-3 w-3" />
                <span className="truncate font-mono">{detail.url}</span>
              </div>

              <div className="mt-4 flex gap-2">
                {isInstalled(detail.id) && (
                  <button onClick={() => open(detail)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-500 py-2.5 text-sm font-semibold text-white transition hover:bg-accent-600">
                    <ExternalLink className="h-4 w-4" /> Open
                  </button>
                )}
                <button onClick={() => isInstalled(detail.id) ? void uninstall(detail) : void install(detail)}
                  disabled={installing.has(detail.id)}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition disabled:opacity-50 ${
                    isInstalled(detail.id)
                      ? 'border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      : 'bg-accent-500 text-white hover:bg-accent-600'
                  }`}>
                  {installing.has(detail.id) ? <Loader2 className="h-4 w-4 animate-spin" /> :
                    isInstalled(detail.id) ? <><Trash2 className="h-4 w-4" /> Uninstall</> :
                    <><Download className="h-4 w-4" /> Install</>}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

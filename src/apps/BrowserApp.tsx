import { useState, useCallback } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Globe, Lock, Star, BookOpen, X, Plus } from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Wikipedia',    url: 'https://en.wikipedia.org',         icon: BookOpen, color: 'bg-slate-600/30' },
  { label: 'OpenStreetMap',url: 'https://www.openstreetmap.org',    icon: Globe,    color: 'bg-emerald-500/15' },
  { label: 'MDN Web Docs', url: 'https://developer.mozilla.org',    icon: Star,     color: 'bg-orange-500/15' },
  { label: 'Example.com',  url: 'https://example.com',              icon: Globe,    color: 'bg-sky-500/15' },
];

interface Tab { id: string; url: string | null; title: string; }

export default function BrowserApp() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: 'tab-1', url: null, title: 'New Tab' }]);
  const [activeTab, setActiveTab] = useState('tab-1');
  const [urlInput, setUrlInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);

  const currentTab = tabs.find(t => t.id === activeTab)!;

  const navigate = useCallback((target: string) => {
    let full = target.trim();
    if (!full) return;
    if (!full.startsWith('http://') && !full.startsWith('https://')) full = 'https://' + full;
    const newHist = [...history.slice(0, histIdx + 1), full];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setUrlInput(full);
    setLoading(true);
    setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: full, title: new URL(full).hostname } : t));
  }, [history, histIdx, activeTab]);

  const goBack = () => {
    if (histIdx > 0) { const idx = histIdx - 1; setHistIdx(idx); setUrlInput(history[idx]); setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: history[idx] } : t)); }
  };
  const goForward = () => {
    if (histIdx < history.length - 1) { const idx = histIdx + 1; setHistIdx(idx); setUrlInput(history[idx]); setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: history[idx] } : t)); }
  };
  const reload = () => { if (currentTab.url) { setLoading(true); setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: null } : t)); setTimeout(() => setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: history[histIdx] } : t)), 50); } };
  const goHome = () => { setTabs(prev => prev.map(t => t.id === activeTab ? { ...t, url: null, title: 'New Tab' } : t)); setUrlInput(''); setHistory([]); setHistIdx(-1); };

  const addTab = () => {
    const id = `tab-${Date.now()}`;
    setTabs(prev => [...prev, { id, url: null, title: 'New Tab' }]);
    setActiveTab(id);
    setUrlInput('');
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) { setTabs([{ id: 'tab-new', url: null, title: 'New Tab' }]); setActiveTab('tab-new'); return; }
    const idx = tabs.findIndex(t => t.id === id);
    const remaining = tabs.filter(t => t.id !== id);
    setTabs(remaining);
    if (activeTab === id) setActiveTab(remaining[Math.max(0, idx - 1)].id);
  };

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e]">
      {/* macOS Safari-style tab bar */}
      <div className="flex items-center gap-0 border-b border-white/8 bg-[#252528] px-2 pt-2">
        <div className="flex items-end gap-0.5 flex-1 overflow-x-auto">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => { setActiveTab(tab.id); setUrlInput(tab.url ?? ''); }}
              className={`group relative flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 text-xs transition-all min-w-[80px] max-w-[160px] ${
                activeTab === tab.id ? 'bg-[#1c1c1e] text-white/80' : 'text-white/30 hover:bg-white/5 hover:text-white/50'
              }`}>
              <Globe className="h-3 w-3 shrink-0" />
              <span className="truncate">{tab.title}</span>
              <button onClick={e => closeTab(tab.id, e)} className="ml-auto shrink-0 rounded-full p-0.5 text-white/20 opacity-0 group-hover:opacity-100 hover:bg-white/15 hover:text-white transition">
                <X className="h-2.5 w-2.5" />
              </button>
            </button>
          ))}
        </div>
        <button onClick={addTab} className="mb-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-white/25 hover:bg-white/8 hover:text-white transition">
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Navigation toolbar */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-[#1c1c1e] px-3 py-2">
        <button onClick={goBack} disabled={histIdx <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={reload} disabled={!currentTab.url}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
          <RotateCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={goHome}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white">
          <Home className="h-4 w-4" />
        </button>

        {/* URL bar — macOS Safari pill style */}
        <form onSubmit={e => { e.preventDefault(); navigate(urlInput); }} className="flex-1">
          <div className="relative flex items-center rounded-lg border border-white/8 bg-white/5 transition focus-within:border-accent-500/40 focus-within:bg-white/8">
            <Lock className="absolute left-3 h-3 w-3 text-emerald-400/60 pointer-events-none" />
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)} placeholder="Search or enter address"
              className="w-full bg-transparent py-1.5 pl-8 pr-3 text-xs text-white/70 placeholder-white/20 outline-none" />
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {currentTab.url ? (
          <iframe key={currentTab.url} src={currentTab.url} title="browser" className="h-full w-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-8 bg-[#1c1c1e] p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg shadow-accent-500/30">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">WendelOS Browser</h2>
              <p className="mt-1 text-xs text-white/30">Powered by WebKit — Enter a URL or pick a quick link</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_LINKS.map(link => {
                const Icon = link.icon;
                return (
                  <button key={link.url} onClick={() => navigate(link.url)}
                    className={`flex flex-col items-center gap-2 rounded-2xl border border-white/8 ${link.color} p-4 transition hover:border-white/20 hover:scale-105`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/8">
                      <Icon className="h-5 w-5 text-white/60" />
                    </div>
                    <span className="text-[11px] font-medium text-white/50">{link.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

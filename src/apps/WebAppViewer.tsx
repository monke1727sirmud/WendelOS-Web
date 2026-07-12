import { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Globe, Lock,
  AlertTriangle, ExternalLink, Home,
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';

type IconName = keyof typeof LucideIcons;

interface Props {
  url: string;
  name: string;
  icon: string;
  color: string;
}

export default function WebAppViewer({ url, name, icon, color }: Props) {
  const Icon = (LucideIcons[icon as IconName] ?? LucideIcons.Globe) as React.ComponentType<{ className?: string }>;
  const [currentUrl, setCurrentUrl] = useState(url);
  const [inputUrl, setInputUrl] = useState(url);
  const [history, setHistory] = useState<string[]>([url]);
  const [histIdx, setHistIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const key = useRef(0);
  const [iframeKey, setIframeKey] = useState(0);

  const navigateTo = (target: string) => {
    let full = target.trim();
    if (full === currentUrl) { reload(); return; }
    if (!full.startsWith('http://') && !full.startsWith('https://')) full = 'https://' + full;
    const newHist = [...history.slice(0, histIdx + 1), full];
    setHistory(newHist);
    setHistIdx(newHist.length - 1);
    setCurrentUrl(full);
    setInputUrl(full);
    setLoading(true);
    setFailed(false);
    key.current++;
    setIframeKey(key.current);
  };

  const reload = () => {
    setLoading(true);
    setFailed(false);
    key.current++;
    setIframeKey(key.current);
  };

  const goBack = () => {
    if (histIdx <= 0) return;
    const idx = histIdx - 1;
    setHistIdx(idx);
    const target = history[idx];
    setCurrentUrl(target);
    setInputUrl(target);
    setLoading(true);
    setFailed(false);
    key.current++;
    setIframeKey(key.current);
  };

  const goForward = () => {
    if (histIdx >= history.length - 1) return;
    const idx = histIdx + 1;
    setHistIdx(idx);
    const target = history[idx];
    setCurrentUrl(target);
    setInputUrl(target);
    setLoading(true);
    setFailed(false);
    key.current++;
    setIframeKey(key.current);
  };

  // Detect iframe load failure after timeout
  useEffect(() => {
    const timer = setTimeout(() => {
      // If still loading after 15s, might be blocked
    }, 15000);
    return () => clearTimeout(timer);
  }, [iframeKey]);

  const hostname = (() => { try { return new URL(currentUrl).hostname; } catch { return currentUrl; } })();
  const isHttps = currentUrl.startsWith('https://');

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e]">
      {/* App header — branded toolbar */}
      <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2"
        style={{ background: 'linear-gradient(180deg, rgba(40,40,45,0.95) 0%, rgba(28,28,30,0.95) 100%)' }}>

        {/* App identity badge */}
        <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${color} shadow-sm`}>
          <Icon className="h-3.5 w-3.5 text-white" />
        </div>

        {/* Nav controls */}
        <button onClick={goBack} disabled={histIdx <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={goForward} disabled={histIdx >= history.length - 1}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
          <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={reload}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white">
          <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button onClick={() => navigateTo(url)}
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/35 transition hover:bg-white/8 hover:text-white">
          <Home className="h-3.5 w-3.5" />
        </button>

        {/* URL bar */}
        <form onSubmit={e => { e.preventDefault(); navigateTo(inputUrl); }} className="flex-1">
          <div className="relative flex items-center rounded-lg border border-white/8 bg-white/5 transition focus-within:border-accent-500/40 focus-within:bg-white/8">
            {isHttps
              ? <Lock className="absolute left-2.5 h-3 w-3 text-emerald-400/70 pointer-events-none shrink-0" />
              : <Globe className="absolute left-2.5 h-3 w-3 text-white/30 pointer-events-none shrink-0" />}
            <input value={inputUrl} onChange={e => setInputUrl(e.target.value)}
              onFocus={e => e.target.select()}
              className="w-full bg-transparent py-1.5 pl-8 pr-3 text-xs text-white/70 placeholder-white/20 outline-none"
            />
          </div>
        </form>

        {/* Open in browser */}
        <a href={currentUrl} target="_blank" rel="noopener noreferrer"
          className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-white/8 hover:text-white">
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Content */}
      <div className="relative flex-1 overflow-hidden">
        {/* Loading bar */}
        {loading && (
          <div className="absolute left-0 top-0 z-10 h-0.5 w-full overflow-hidden bg-white/5">
            <div className="h-full animate-[loadBar_1.5s_ease-in-out_infinite] bg-accent-500" />
          </div>
        )}

        {failed ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 bg-[#1c1c1e] p-8 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/10">
              <AlertTriangle className="h-8 w-8 text-amber-400" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Unable to load {name}</h3>
              <p className="mt-1.5 text-xs text-white/35 max-w-xs leading-relaxed">
                This site may block embedding, use X-Frame-Options, or require direct browser access.
              </p>
              <p className="mt-1 font-mono text-[10px] text-white/20">{hostname}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={reload}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/50 transition hover:bg-white/8 hover:text-white">
                <RotateCw className="h-3.5 w-3.5" /> Retry
              </button>
              <a href={currentUrl} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-xl bg-accent-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-accent-600">
                <ExternalLink className="h-3.5 w-3.5" /> Open in new tab
              </a>
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            key={iframeKey}
            src={currentUrl}
            title={name}
            className="h-full w-full border-0"
            onLoad={() => setLoading(false)}
            onError={() => { setLoading(false); setFailed(true); }}
          />
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-[#252528] px-4 py-1 text-[10px] text-white/20 select-none">
        <div className="flex items-center gap-1.5">
          {isHttps ? <Lock className="h-2.5 w-2.5 text-emerald-400/60" /> : <Globe className="h-2.5 w-2.5" />}
          <span className="font-mono">{hostname}</span>
        </div>
        <span>{loading ? 'Loading…' : 'Done'}</span>
      </div>

      <style>{`@keyframes loadBar { 0% { transform: translateX(-100%) scaleX(0.3); } 50% { transform: translateX(0%) scaleX(0.7); } 100% { transform: translateX(100%) scaleX(0.3); } }`}</style>
    </div>
  );
}

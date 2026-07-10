import { useState, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, RotateCw, Home, Globe, Lock, Star,
} from 'lucide-react';

const QUICK_LINKS = [
  { label: 'Wikipedia', url: 'https://en.wikipedia.org' },
  { label: 'OpenStreetMap', url: 'https://www.openstreetmap.org' },
  { label: 'MDN Web Docs', url: 'https://developer.mozilla.org' },
  { label: 'Example.com', url: 'https://example.com' },
];

export default function BrowserApp() {
  const [url, setUrl] = useState('');
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [loading, setLoading] = useState(false);

  const navigate = useCallback(
    (target: string) => {
      let full = target.trim();
      if (!full) return;
      if (!full.startsWith('http://') && !full.startsWith('https://')) {
        full = 'https://' + full;
      }
      const newHist = [...history.slice(0, histIdx + 1), full];
      setHistory(newHist);
      setHistIdx(newHist.length - 1);
      setCurrentUrl(full);
      setUrl(full);
      setLoading(true);
    },
    [history, histIdx]
  );

  const goBack = () => {
    if (histIdx > 0) {
      const idx = histIdx - 1;
      setHistIdx(idx);
      setCurrentUrl(history[idx]);
      setUrl(history[idx]);
    }
  };

  const goForward = () => {
    if (histIdx < history.length - 1) {
      const idx = histIdx + 1;
      setHistIdx(idx);
      setCurrentUrl(history[idx]);
      setUrl(history[idx]);
    }
  };

  const reload = () => {
    if (currentUrl) {
      setLoading(true);
      setCurrentUrl(null);
      setTimeout(() => setCurrentUrl(history[histIdx]), 50);
    }
  };

  const goHome = () => {
    setCurrentUrl(null);
    setUrl('');
    setHistory([]);
    setHistIdx(-1);
  };

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/50 px-3 py-2">
        <button
          onClick={goBack}
          disabled={histIdx <= 0}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={goForward}
          disabled={histIdx >= history.length - 1}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          onClick={reload}
          disabled={!currentUrl}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <RotateCw className="h-4 w-4" />
        </button>
        <button
          onClick={goHome}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <Home className="h-4 w-4" />
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate(url);
          }}
          className="flex flex-1 items-center"
        >
          <div className="relative w-full">
            <Lock className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-emerald-400" />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Search or enter address"
              className="w-full rounded-full border border-white/10 bg-black/30 py-1.5 pl-8 pr-3 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500"
            />
          </div>
        </form>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden bg-white">
        {currentUrl ? (
          <iframe
            key={currentUrl + loading}
            src={currentUrl}
            title="browser"
            className="h-full w-full border-0"
            onLoad={() => setLoading(false)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        ) : (
          <div className="flex h-full flex-col items-center justify-center bg-slate-900 gap-6 p-8">
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600">
                <Globe className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-lg font-semibold text-white">WendelOS Browser</h2>
              <p className="mt-1 text-sm text-slate-500">Enter a URL or pick a quick link below</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {QUICK_LINKS.map((link) => (
                <button
                  key={link.url}
                  onClick={() => navigate(link.url)}
                  className="flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-slate-800/50 p-4 transition hover:border-accent-500/40 hover:bg-slate-700/50"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-500/20">
                    <Star className="h-5 w-5 text-accent-400" />
                  </div>
                  <span className="text-xs font-medium text-slate-300">{link.label}</span>
                </button>
              ))}
            </div>

            {loading && (
              <p className="text-xs text-slate-500">Loading...</p>
            )}
          </div>
        )}
      </div>

      {loading && currentUrl && (
        <div className="absolute bottom-2 right-2 flex items-center gap-2 rounded-full bg-slate-800 px-3 py-1.5 text-xs text-slate-400 shadow-lg">
          <RotateCw className="h-3 w-3 animate-spin" />
          Loading...
        </div>
      )}
    </div>
  );
}

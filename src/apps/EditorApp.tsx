import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, FileText, Download, Type, Hash, AlignLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useWindowManager } from '../context/WindowManagerContext';

export default function EditorApp({ payload }: { payload?: Record<string, unknown> }) {
  useWindowManager();
  const fileId = payload?.fileId as string | undefined;
  const fileName = payload?.fileName as string | undefined;

  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(!!fileId);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(true);

  const loadFile = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    const { data } = await supabase.from('files').select('content').eq('id', fileId).maybeSingle();
    if (data) { setContent(data.content ?? ''); setOriginalContent(data.content ?? ''); }
    setLoading(false);
  }, [fileId]);

  useEffect(() => { void loadFile(); }, [loadFile]);

  const handleSave = async () => {
    if (!fileId) { setDirty(false); return; }
    setSaving(true);
    const { error } = await supabase.from('files').update({ content, size_bytes: new Blob([content]).size }).eq('id', fileId);
    if (!error) { setOriginalContent(content); setDirty(false); }
    setSaving(false);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.metaKey || e.ctrlKey) && e.key === 's') { e.preventDefault(); if (dirty) void handleSave(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [dirty, content]);

  const lines = content.split('\n').length;
  const chars = content.length;
  const words = content.trim() ? content.trim().split(/\s+/).length : 0;
  const lastLine = content.split('\n'); const col = lastLine[lastLine.length - 1]?.length ?? 0;

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e]">
      {/* macOS TextEdit-style toolbar */}
      <div className="flex items-center gap-2 border-b border-white/8 bg-[#252528] px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-accent-400 shrink-0" />
          <span className="text-xs font-medium text-white/60 truncate">{fileName ?? 'Untitled'}</span>
          {dirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />}
        </div>

        <div className="ml-auto flex items-center gap-1">
          {/* Font size */}
          <div className="flex items-center gap-1 rounded-lg border border-white/8 bg-white/4 px-1">
            <button onClick={() => setFontSize(f => Math.max(10, f - 2))} className="px-1.5 py-1 text-xs text-white/30 hover:text-white transition">−</button>
            <span className="text-[10px] text-white/30 tabular-nums">{fontSize}</span>
            <button onClick={() => setFontSize(f => Math.min(24, f + 2))} className="px-1.5 py-1 text-xs text-white/30 hover:text-white transition">+</button>
          </div>
          {/* Word wrap */}
          <button onClick={() => setWordWrap(v => !v)}
            className={`flex h-7 items-center gap-1 rounded-md px-2 text-[10px] transition ${wordWrap ? 'bg-accent-500/15 text-accent-400' : 'text-white/30 hover:bg-white/8'}`}>
            <AlignLeft className="h-3 w-3" /> Wrap
          </button>
          <button onClick={() => {
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob); const a = document.createElement('a');
            a.href = url; a.download = fileName ?? 'untitled.txt'; a.click(); URL.revokeObjectURL(url);
          }} className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-white/40 transition hover:bg-white/8 hover:text-white">
            <Download className="h-3.5 w-3.5" /> Export
          </button>
          <button onClick={handleSave} disabled={!dirty || saving}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent-500 px-3 text-xs font-medium text-white transition hover:bg-accent-600 disabled:opacity-40">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      {/* Editor area */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-white/30" /></div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Line numbers — VS Code / Linux editor style */}
          <div className="flex select-none flex-col border-r border-white/5 bg-[#161618] px-3 pt-4 text-right font-mono text-white/15" style={{ fontSize: fontSize - 2, lineHeight: `${fontSize * 1.6}px`, minWidth: '3rem' }}>
            {Array.from({ length: lines }, (_, i) => <div key={i}>{i + 1}</div>)}
          </div>
          <textarea value={content} onChange={e => { setContent(e.target.value); setDirty(e.target.value !== originalContent); }}
            spellCheck={false}
            className="flex-1 resize-none bg-[#1c1c1e] p-4 font-mono text-white/80 outline-none scrollbar-thin placeholder-white/15"
            style={{ fontSize, lineHeight: fontSize * 1.6 + 'px', userSelect: 'text', WebkitUserSelect: 'text', whiteSpace: wordWrap ? 'pre-wrap' : 'pre' }}
            placeholder="Start typing…" />
        </div>
      )}

      {/* Windows VS Code-style status bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-[#007acc]/80 px-3 py-1 text-[10px] text-white/70 select-none">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><Hash className="h-3 w-3" /> Ln {lines}, Col {col}</span>
          <span className="flex items-center gap-1"><Type className="h-3 w-3" /> {chars} chars</span>
          <span>{words} words</span>
        </div>
        <div className="flex items-center gap-3">
          <span>UTF-8</span>
          <span>Plain Text</span>
          <span className={dirty ? 'text-amber-300' : 'text-white/40'}>{dirty ? '● Unsaved' : '✓ Saved'}</span>
        </div>
      </div>
    </div>
  );
}

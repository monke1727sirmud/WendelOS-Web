import { useState, useEffect, useCallback } from 'react';
import { Save, Loader2, FileText, Download } from 'lucide-react';
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

  const loadFile = useCallback(async () => {
    if (!fileId) return;
    setLoading(true);
    const { data } = await supabase
      .from('files')
      .select('content, name')
      .eq('id', fileId)
      .maybeSingle();
    if (data) {
      setContent(data.content ?? '');
      setOriginalContent(data.content ?? '');
    }
    setLoading(false);
  }, [fileId]);

  useEffect(() => {
    void loadFile();
  }, [loadFile]);

  const handleChange = (val: string) => {
    setContent(val);
    setDirty(val !== originalContent);
  };

  const handleSave = async () => {
    if (!fileId) {
      setDirty(false);
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('files')
      .update({ content, size_bytes: new Blob([content]).size })
      .eq('id', fileId);
    if (!error) {
      setOriginalContent(content);
      setDirty(false);
    }
    setSaving(false);
  };

  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName ?? 'untitled.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = content.split('\n').length;
  const charCount = content.length;
  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (dirty) void handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [dirty, content]);

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/50 px-3 py-2">
        <FileText className="h-4 w-4 text-accent-400" />
        <span className="text-xs font-medium text-slate-300">
          {fileName ?? 'Untitled'}
        </span>
        {dirty && <span className="text-xs text-amber-400">●</span>}

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={handleDownload}
            className="flex h-7 items-center gap-1.5 rounded-md px-2.5 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="flex h-7 items-center gap-1.5 rounded-md bg-accent-500 px-3 text-xs font-medium text-white transition hover:bg-accent-600 disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Save
          </button>
        </div>
      </div>

      {/* Editor */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={(e) => handleChange(e.target.value)}
          spellCheck={false}
          className="flex-1 resize-none bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-200 outline-none scrollbar-thin"
          placeholder="Start typing..."
          style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
        />
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-800/50 px-3 py-1.5 text-[11px] text-slate-500">
        <div className="flex gap-4">
          <span>Ln {lineCount}</span>
          <span>Chars {charCount}</span>
          <span>Words {wordCount}</span>
        </div>
        <span>{dirty ? 'Unsaved changes' : 'Saved'}</span>
      </div>
    </div>
  );
}

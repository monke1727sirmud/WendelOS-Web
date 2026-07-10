import { useState, useEffect, useCallback } from 'react';
import {
  Plus, Trash2, Loader2, StickyNote, Search,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Note } from '../lib/types';

const COLOR_MAP: Record<string, { bg: string; border: string; dot: string }> = {
  amber: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', dot: 'bg-amber-400' },
  rose: { bg: 'bg-rose-500/15', border: 'border-rose-500/30', dot: 'bg-rose-400' },
  emerald: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', dot: 'bg-emerald-400' },
  sky: { bg: 'bg-sky-500/15', border: 'border-sky-500/30', dot: 'bg-sky-400' },
  violet: { bg: 'bg-violet-500/15', border: 'border-violet-500/30', dot: 'bg-violet-400' },
  slate: { bg: 'bg-slate-500/15', border: 'border-slate-500/30', dot: 'bg-slate-400' },
};

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (data) setNotes(data as Note[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  const handleCreate = async () => {
    const colors = ['amber', 'rose', 'emerald', 'sky', 'violet'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { data } = await supabase
      .from('notes')
      .insert({ title: 'New Note', content: '', color })
      .select('*')
      .single();
    if (data) {
      setNotes((prev) => [data as Note, ...prev]);
      setSelected(data.id);
    }
  };

  const handleUpdate = async (id: string, patch: Partial<Note>) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, ...patch } : n))
    );
    await supabase.from('notes').update(patch).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes((prev) => prev.filter((n) => n.id !== id));
    setSelected(null);
  };

  const filtered = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notes.find((n) => n.id === selected);

  return (
    <div className="flex h-full bg-slate-900">
      {/* Sidebar */}
      <div className="flex w-48 shrink-0 flex-col border-r border-white/10 bg-slate-800/30">
        <div className="p-3">
          <button
            onClick={handleCreate}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent-500 py-2 text-xs font-semibold text-white transition hover:bg-accent-600"
          >
            <Plus className="h-4 w-4" />
            New Note
          </button>
        </div>

        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search notes..."
              className="w-full rounded-md border border-white/10 bg-black/30 py-1.5 pl-8 pr-2 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-slate-500" />
            </div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-slate-500">No notes</p>
          ) : (
            filtered.map((note) => {
              const c = COLOR_MAP[note.color] ?? COLOR_MAP.amber;
              return (
                <button
                  key={note.id}
                  onClick={() => setSelected(note.id)}
                  className={`mb-1 w-full rounded-lg border p-2.5 text-left transition ${
                    selected === note.id
                      ? `${c.bg} ${c.border}`
                      : 'border-transparent hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <div className={`h-2 w-2 rounded-full ${c.dot}`} />
                    <span className="truncate text-xs font-medium text-slate-200">
                      {note.title || 'Untitled'}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[10px] text-slate-500">
                    {note.content || 'Empty note'}
                  </p>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex flex-1 flex-col">
        {activeNote ? (
          <>
            <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/30 px-4 py-2">
              <div className="flex gap-1">
                {Object.entries(COLOR_MAP).map(([name, c]) => (
                  <button
                    key={name}
                    onClick={() => void handleUpdate(activeNote.id, { color: name })}
                    className={`h-4 w-4 rounded-full ${c.dot} transition ${
                      activeNote.color === name ? 'ring-2 ring-white/40' : 'opacity-60 hover:opacity-100'
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => void handleDelete(activeNote.id)}
                className="ml-auto flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-red-500/80 hover:text-white"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            <input
              value={activeNote.title}
              onChange={(e) => void handleUpdate(activeNote.id, { title: e.target.value })}
              placeholder="Note title..."
              className="border-b border-white/5 bg-transparent px-4 py-3 text-lg font-semibold text-white outline-none placeholder-slate-600"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            />
            <textarea
              value={activeNote.content}
              onChange={(e) => void handleUpdate(activeNote.id, { content: e.target.value })}
              placeholder="Write something..."
              className="flex-1 resize-none bg-transparent p-4 text-sm leading-relaxed text-slate-300 outline-none scrollbar-thin placeholder-slate-600"
              style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
            />
            <div className="border-t border-white/10 bg-slate-800/30 px-4 py-1.5 text-[10px] text-slate-500">
              Last edited {new Date(activeNote.updated_at).toLocaleString()}
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 text-slate-500">
            <StickyNote className="h-12 w-12 opacity-30" />
            <p className="text-sm">Select a note or create a new one</p>
          </div>
        )}
      </div>
    </div>
  );
}

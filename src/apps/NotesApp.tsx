import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Loader2, StickyNote, Search, Pin, MoreHorizontal } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Note } from '../lib/types';

const COLOR_MAP: Record<string, { bg: string; border: string; dot: string; header: string }> = {
  amber:   { bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   header: 'bg-amber-500/15' },
  rose:    { bg: 'bg-rose-500/10',    border: 'border-rose-500/20',    dot: 'bg-rose-400',    header: 'bg-rose-500/15' },
  emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', dot: 'bg-emerald-400', header: 'bg-emerald-500/15' },
  sky:     { bg: 'bg-sky-500/10',     border: 'border-sky-500/20',     dot: 'bg-sky-400',     header: 'bg-sky-500/15' },
  violet:  { bg: 'bg-violet-500/10',  border: 'border-violet-500/20',  dot: 'bg-violet-400',  header: 'bg-violet-500/15' },
  slate:   { bg: 'bg-slate-500/10',   border: 'border-slate-500/20',   dot: 'bg-slate-400',   header: 'bg-slate-500/15' },
};

export default function NotesApp() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const loadNotes = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('notes').select('*').order('updated_at', { ascending: false });
    if (data) setNotes(data as Note[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadNotes(); }, [loadNotes]);

  const handleCreate = async () => {
    const colors = ['amber', 'rose', 'emerald', 'sky', 'violet'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const { data } = await supabase.from('notes').insert({ title: 'New Note', content: '', color }).select('*').single();
    if (data) { setNotes(prev => [data as Note, ...prev]); setSelected(data.id); }
  };

  const handleUpdate = async (id: string, patch: Partial<Note>) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
    await supabase.from('notes').update(patch).eq('id', id);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('notes').delete().eq('id', id);
    setNotes(prev => prev.filter(n => n.id !== id));
    setSelected(null);
  };

  const filtered = notes.filter(n =>
    n.title.toLowerCase().includes(search.toLowerCase()) ||
    n.content.toLowerCase().includes(search.toLowerCase())
  );

  const activeNote = notes.find(n => n.id === selected);
  const c = activeNote ? (COLOR_MAP[activeNote.color] ?? COLOR_MAP.amber) : null;

  return (
    <div className="flex h-full bg-[#1c1c1e]">
      {/* Sidebar — macOS Notes style */}
      <div className="flex w-52 shrink-0 flex-col border-r border-white/8 bg-[#252528]">
        {/* Toolbar */}
        <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
          <button onClick={handleCreate}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/20 text-accent-400 transition hover:bg-accent-500/30">
            <Plus className="h-4 w-4" />
          </button>
          <span className="flex-1 text-xs font-semibold text-white/60">Notes</span>
          <span className="text-[10px] text-white/20">{notes.length}</span>
        </div>

        {/* Search */}
        <div className="border-b border-white/8 px-3 py-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search notes"
              className="w-full rounded-lg border border-white/8 bg-white/4 py-1.5 pl-6 pr-2 text-[11px] text-white placeholder-white/20 outline-none focus:border-accent-500/40" />
          </div>
        </div>

        {/* Note list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin py-1">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-4 w-4 animate-spin text-white/30" /></div>
          ) : filtered.length === 0 ? (
            <p className="py-8 text-center text-xs text-white/20">No notes</p>
          ) : (
            filtered.map(note => {
              const nc = COLOR_MAP[note.color] ?? COLOR_MAP.amber;
              return (
                <button key={note.id} onClick={() => setSelected(note.id)}
                  className={`w-full px-3 py-2.5 text-left transition border-b border-white/5 last:border-0 ${
                    selected === note.id ? `${nc.bg} border-l-2 ${nc.border}` : 'hover:bg-white/4 border-l-2 border-transparent'
                  }`}>
                  <div className="flex items-start gap-2">
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${nc.dot}`} />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-white/80">{note.title || 'Untitled'}</p>
                      <p className="mt-0.5 text-[10px] text-white/30 truncate">{new Date(note.updated_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</p>
                      <p className="mt-0.5 line-clamp-1 text-[10px] text-white/25">{note.content || 'No additional text'}</p>
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Editor */}
      {activeNote && c ? (
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Note toolbar — color picker + actions */}
          <div className={`flex items-center gap-2 border-b border-white/8 px-4 py-2 ${c.header}`}>
            <div className="flex gap-1.5">
              {Object.entries(COLOR_MAP).map(([name, nc]) => (
                <button key={name} onClick={() => void handleUpdate(activeNote.id, { color: name })}
                  className={`h-4 w-4 rounded-full ${nc.dot} transition-all ${
                    activeNote.color === name ? 'scale-125 ring-2 ring-white/40' : 'opacity-50 hover:opacity-100'
                  }`} />
              ))}
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white transition">
                <Pin className="h-3.5 w-3.5" />
              </button>
              <button className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 hover:bg-white/8 hover:text-white transition">
                <MoreHorizontal className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => void handleDelete(activeNote.id)}
                className="flex h-7 w-7 items-center justify-center rounded-md text-white/30 transition hover:bg-red-500/20 hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Title */}
          <input value={activeNote.title} onChange={e => void handleUpdate(activeNote.id, { title: e.target.value })}
            placeholder="Note title…"
            className="border-b border-white/5 bg-transparent px-5 py-4 text-lg font-semibold text-white outline-none placeholder-white/15"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />

          {/* Metadata row */}
          <div className="flex items-center gap-3 border-b border-white/5 px-5 py-2 text-[10px] text-white/25">
            <span>{new Date(activeNote.updated_at).toLocaleString()}</span>
            <span>·</span>
            <span>{activeNote.content.split(/\s+/).filter(Boolean).length} words</span>
          </div>

          {/* Body */}
          <textarea value={activeNote.content} onChange={e => void handleUpdate(activeNote.id, { content: e.target.value })}
            placeholder="Write something…"
            className="flex-1 resize-none bg-transparent p-5 text-sm leading-relaxed text-white/70 outline-none scrollbar-thin placeholder-white/15"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-white/20">
          <StickyNote className="h-16 w-16 opacity-20" strokeWidth={1} />
          <p className="text-sm">Select a note or create a new one</p>
          <button onClick={handleCreate}
            className="mt-1 flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-xs text-white/40 transition hover:bg-white/5 hover:text-white/60">
            <Plus className="h-3.5 w-3.5" /> New Note
          </button>
        </div>
      )}
    </div>
  );
}

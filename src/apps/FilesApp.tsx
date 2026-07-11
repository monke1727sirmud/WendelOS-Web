import { useState, useEffect, useCallback } from 'react';
import {
  Folder, FileText, FilePlus, FolderPlus, Trash2,
  ChevronLeft, ChevronRight, Home, Search, Loader2, Download,
  FileCode, Grid3X3, List, ChevronRight as Caret, HardDrive,
  Star, Clock, Tag, MoreHorizontal, Info,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FileNode } from '../lib/types';
import { useWindowManager } from '../context/WindowManagerContext';

function fileIcon(name: string, type: 'file' | 'folder') {
  if (type === 'folder') return Folder;
  if (/\.(js|ts|tsx|jsx|json|html|css|py|go|rs|java)$/.test(name)) return FileCode;
  return FileText;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const SIDEBAR_SECTIONS = [
  {
    label: 'Favorites',
    items: [
      { id: null, label: 'Home', icon: Home },
      { id: 'recents', label: 'Recents', icon: Clock },
      { id: 'starred', label: 'Starred', icon: Star },
    ],
  },
  {
    label: 'Locations',
    items: [
      { id: 'disk', label: 'WendelOS Disk', icon: HardDrive },
      { id: 'tags', label: 'Tagged Files', icon: Tag },
    ],
  },
];

export default function FilesApp() {
  const { openApp } = useWindowManager();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Home' },
  ]);
  const [historyStack, setHistoryStack] = useState<(string | null)[]>([null]);
  const [histIdx, setHistIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState<null | 'file' | 'folder'>(null);
  const [newName, setNewName] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const loadFiles = useCallback(async (parentId: string | null) => {
    setLoading(true);
    const { data } = await supabase
      .from('files').select('*')
      .is('parent_id', parentId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });
    if (data) setFiles(data as FileNode[]);
    setLoading(false);
  }, []);

  useEffect(() => { void loadFiles(currentParent); }, [currentParent, loadFiles]);

  const navigateTo = (folder: FileNode) => {
    const next = [...historyStack.slice(0, histIdx + 1), folder.id];
    setHistoryStack(next);
    setHistIdx(next.length - 1);
    setCurrentParent(folder.id);
    setBreadcrumb(prev => [...prev, { id: folder.id, name: folder.name }]);
    setSelected(null);
  };

  const goBack = () => {
    if (histIdx <= 0) return;
    const idx = histIdx - 1;
    setHistIdx(idx);
    const target = historyStack[idx];
    setCurrentParent(target);
    setBreadcrumb(prev => prev.slice(0, prev.length - 1));
    setSelected(null);
  };

  const goForward = () => {
    if (histIdx >= historyStack.length - 1) return;
    const idx = histIdx + 1;
    setHistIdx(idx);
    setCurrentParent(historyStack[idx]);
    setSelected(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) { setCreating(null); return; }
    const type = creating === 'folder' ? 'folder' : 'file';
    const { data } = await supabase.from('files')
      .insert({ name: newName.trim(), parent_id: currentParent, type, content: type === 'file' ? '' : null, size_bytes: 0 })
      .select('*').single();
    if (data) setFiles(prev => [...prev, data as FileNode]);
    setNewName(''); setCreating(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('files').delete().eq('id', id);
    setFiles(prev => prev.filter(f => f.id !== id));
    setSelected(null);
  };

  const handleOpen = (file: FileNode) => {
    if (file.type === 'folder') navigateTo(file);
    else openApp('editor', { title: file.name, payload: { fileId: file.id, fileName: file.name } });
  };

  const filtered = files.filter(f => f.name.toLowerCase().includes(search.toLowerCase()));
  const selectedFile = files.find(f => f.id === selected);

  return (
    <div className="flex h-full bg-[#1c1c1e] text-slate-200">
      {/* macOS Finder-style sidebar */}
      <div className="flex w-44 shrink-0 flex-col border-r border-white/8 bg-[#252528]">
        <div className="flex-1 overflow-y-auto py-3">
          {SIDEBAR_SECTIONS.map(section => (
            <div key={section.label} className="mb-3">
              <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wider text-white/25">
                {section.label}
              </p>
              {section.items.map(item => {
                const Icon = item.icon;
                const isActive = currentParent === item.id && !['recents','starred','tags','disk'].includes(item.id ?? '');
                return (
                  <button
                    key={item.label}
                    onClick={() => {
                      if (item.id === null) { setCurrentParent(null); setBreadcrumb([{ id: null, name: 'Home' }]); }
                    }}
                    className={`flex w-full items-center gap-2 rounded-md mx-1.5 px-2 py-1.5 text-xs transition ${
                      isActive ? 'bg-accent-500/20 text-accent-300' : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                    }`}
                    style={{ width: 'calc(100% - 12px)' }}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
        {/* Disk usage bar */}
        <div className="border-t border-white/8 p-3">
          <p className="mb-1.5 text-[10px] text-white/30">WendelOS Disk</p>
          <div className="h-1 rounded-full bg-white/8">
            <div className="h-full w-2/5 rounded-full bg-accent-500/60" />
          </div>
          <p className="mt-1 text-[9px] text-white/20">23.4 GB of 64 GB</p>
        </div>
      </div>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* macOS Finder-style toolbar */}
        <div className="flex items-center gap-1.5 border-b border-white/8 bg-[#1c1c1e]/80 px-3 py-2 backdrop-blur-sm">
          <button onClick={goBack} disabled={histIdx <= 0}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button onClick={goForward} disabled={histIdx >= historyStack.length - 1}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/8 hover:text-white disabled:opacity-20">
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Breadcrumb — Windows Explorer style */}
          <div className="flex items-center gap-0.5 overflow-hidden rounded-md border border-white/8 bg-white/4 px-2 py-1 text-xs">
            {breadcrumb.map((crumb, i) => (
              <div key={i} className="flex items-center gap-0.5">
                {i > 0 && <Caret className="h-3 w-3 text-white/20" />}
                <button onClick={() => {
                  setCurrentParent(crumb.id);
                  setBreadcrumb(breadcrumb.slice(0, i + 1));
                  setSelected(null);
                }} className="text-white/60 hover:text-white transition rounded px-1">
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-1">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/25" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search"
                className="w-28 rounded-md border border-white/8 bg-white/4 py-1 pl-6 pr-2 text-xs text-white placeholder-white/20 outline-none focus:border-accent-500/40 focus:w-40 transition-all" />
            </div>
            {/* View toggle */}
            <div className="flex rounded-md border border-white/8 overflow-hidden">
              <button onClick={() => setViewMode('grid')}
                className={`flex h-7 w-7 items-center justify-center text-xs transition ${viewMode === 'grid' ? 'bg-white/12 text-white' : 'text-white/30 hover:bg-white/6'}`}>
                <Grid3X3 className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setViewMode('list')}
                className={`flex h-7 w-7 items-center justify-center text-xs transition ${viewMode === 'list' ? 'bg-white/12 text-white' : 'text-white/30 hover:bg-white/6'}`}>
                <List className="h-3.5 w-3.5" />
              </button>
            </div>
            <button onClick={() => setCreating('folder')} title="New folder"
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/8 hover:text-white">
              <FolderPlus className="h-4 w-4" />
            </button>
            <button onClick={() => setCreating('file')} title="New file"
              className="flex h-7 w-7 items-center justify-center rounded-md text-white/40 transition hover:bg-white/8 hover:text-white">
              <FilePlus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* File area */}
        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
            {loading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-white/30" />
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-1">
                {filtered.map(file => {
                  const Icon = fileIcon(file.name, file.type);
                  const isSel = selected === file.id;
                  return (
                    <div key={file.id} onClick={() => setSelected(file.id)} onDoubleClick={() => handleOpen(file)}
                      className={`group flex cursor-default flex-col items-center gap-1.5 rounded-lg p-2.5 transition select-none ${
                        isSel ? 'bg-accent-500/20 ring-1 ring-accent-500/30' : 'hover:bg-white/5'
                      }`}>
                      <Icon className={`h-11 w-11 ${file.type === 'folder' ? 'text-accent-400' : 'text-slate-400'}`} />
                      <span className="line-clamp-2 w-full text-center text-[11px] text-slate-300">{file.name}</span>
                    </div>
                  );
                })}
                {creating && (
                  <div className="flex flex-col items-center gap-1.5 rounded-lg p-2.5">
                    {creating === 'folder' ? <Folder className="h-11 w-11 text-accent-400" /> : <FileText className="h-11 w-11 text-slate-400" />}
                    <input autoFocus value={newName} onChange={e => setNewName(e.target.value)}
                      onBlur={handleCreate} onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') { setCreating(null); setNewName(''); } }}
                      className="w-full rounded border border-accent-500/50 bg-black/40 px-1 py-0.5 text-center text-[11px] text-white outline-none" />
                  </div>
                )}
                {filtered.length === 0 && !creating && (
                  <div className="col-span-full flex flex-col items-center justify-center gap-2 py-20 text-white/20">
                    <Folder className="h-12 w-12 opacity-30" />
                    <p className="text-sm">This folder is empty</p>
                  </div>
                )}
              </div>
            ) : (
              /* List view — Windows Explorer style */
              <div className="rounded-lg overflow-hidden border border-white/8">
                <div className="grid grid-cols-[1fr_80px_100px] border-b border-white/8 bg-white/4 px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-white/30">
                  <span>Name</span><span className="text-right">Size</span><span className="text-right">Modified</span>
                </div>
                {filtered.length === 0 && !creating ? (
                  <p className="py-10 text-center text-xs text-white/25">Empty folder</p>
                ) : (
                  filtered.map(file => {
                    const Icon = fileIcon(file.name, file.type);
                    const isSel = selected === file.id;
                    return (
                      <div key={file.id} onClick={() => setSelected(file.id)} onDoubleClick={() => handleOpen(file)}
                        className={`grid cursor-default grid-cols-[1fr_80px_100px] items-center border-b border-white/5 px-3 py-2 text-xs transition last:border-0 ${
                          isSel ? 'bg-accent-500/15' : 'hover:bg-white/5'
                        }`}>
                        <div className="flex items-center gap-2 overflow-hidden">
                          <Icon className={`h-4 w-4 shrink-0 ${file.type === 'folder' ? 'text-accent-400' : 'text-slate-400'}`} />
                          <span className="truncate text-slate-300">{file.name}</span>
                        </div>
                        <span className="text-right tabular-nums text-white/30">{file.type === 'file' ? formatSize(file.size_bytes) : '—'}</span>
                        <span className="text-right text-white/25">{new Date(file.updated_at).toLocaleDateString()}</span>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>

          {/* Inspector panel — macOS style */}
          {selectedFile && (
            <div className="w-48 shrink-0 border-l border-white/8 bg-[#252528] p-4 text-xs">
              <div className="mb-3 flex flex-col items-center gap-2 border-b border-white/8 pb-4">
                {selectedFile.type === 'folder'
                  ? <Folder className="h-14 w-14 text-accent-400" />
                  : <FileText className="h-14 w-14 text-slate-400" />}
                <p className="text-center text-[11px] font-medium text-white break-all">{selectedFile.name}</p>
              </div>
              <div className="space-y-2 text-[10px]">
                <div className="flex justify-between"><span className="text-white/30">Kind</span><span className="text-white/60 capitalize">{selectedFile.type}</span></div>
                <div className="flex justify-between"><span className="text-white/30">Size</span><span className="text-white/60">{formatSize(selectedFile.size_bytes)}</span></div>
                <div className="flex justify-between"><span className="text-white/30">Modified</span><span className="text-white/60">{new Date(selectedFile.updated_at).toLocaleDateString()}</span></div>
              </div>
              <div className="mt-4 flex gap-1.5">
                {selectedFile.type === 'file' && (
                  <button onClick={() => {
                    const blob = new Blob([selectedFile.content ?? ''], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a'); a.href = url; a.download = selectedFile.name; a.click(); URL.revokeObjectURL(url);
                  }} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/10 py-1.5 text-[10px] text-white/50 hover:bg-white/8 hover:text-white transition">
                    <Download className="h-3 w-3" /> Export
                  </button>
                )}
                <button onClick={() => void handleDelete(selectedFile.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-red-500/20 py-1.5 text-[10px] text-red-400/60 hover:bg-red-500/10 hover:text-red-400 transition">
                  <Trash2 className="h-3 w-3" /> Delete
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Windows-style status bar */}
        <div className="flex items-center justify-between border-t border-white/8 bg-[#252528] px-4 py-1.5 text-[10px] text-white/25">
          <span>{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
          {selectedFile && <span className="flex items-center gap-1"><Info className="h-3 w-3" /> {selectedFile.name} {selectedFile.type === 'file' ? `— ${formatSize(selectedFile.size_bytes)}` : '(folder)'}</span>}
          <span className="flex items-center gap-1"><MoreHorizontal className="h-3 w-3" /> WendelFS</span>
        </div>
      </div>
    </div>
  );
}

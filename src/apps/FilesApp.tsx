import { useState, useEffect, useCallback } from 'react';
import {
  Folder, FileText, FilePlus, FolderPlus, Trash2,
  ChevronLeft, Home, Search, Loader2, Download, FileCode,
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

export default function FilesApp() {
  const { openApp } = useWindowManager();
  const [files, setFiles] = useState<FileNode[]>([]);
  const [currentParent, setCurrentParent] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<{ id: string | null; name: string }[]>([
    { id: null, name: 'Home' },
  ]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [creating, setCreating] = useState<null | 'file' | 'folder'>(null);
  const [newName, setNewName] = useState('');

  const loadFiles = useCallback(async (parentId: string | null) => {
    setLoading(true);
    const { data, error } = await supabase
      .from('files')
      .select('*')
      .is('parent_id', parentId)
      .order('type', { ascending: true })
      .order('name', { ascending: true });

    if (!error && data) {
      setFiles(data as FileNode[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadFiles(currentParent);
  }, [currentParent, loadFiles]);

  const navigateTo = (folder: FileNode) => {
    setCurrentParent(folder.id);
    setBreadcrumb((prev) => [...prev, { id: folder.id, name: folder.name }]);
    setSelected(null);
  };

  const navigateBreadcrumb = (index: number) => {
    const target = breadcrumb[index];
    setCurrentParent(target.id);
    setBreadcrumb(breadcrumb.slice(0, index + 1));
    setSelected(null);
  };

  const handleCreate = async () => {
    if (!newName.trim()) {
      setCreating(null);
      return;
    }
    const type = creating === 'folder' ? 'folder' : 'file';
    const { data } = await supabase
      .from('files')
      .insert({
        name: newName.trim(),
        parent_id: currentParent,
        type,
        content: type === 'file' ? '' : null,
        size_bytes: 0,
      })
      .select('*')
      .single();
    if (data) {
      setFiles((prev) => [...prev, data as FileNode]);
    }
    setNewName('');
    setCreating(null);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('files').delete().eq('id', id);
    setFiles((prev) => prev.filter((f) => f.id !== id));
    setSelected(null);
  };

  const handleOpen = (file: FileNode) => {
    if (file.type === 'folder') {
      navigateTo(file);
    } else {
      openApp('editor', {
        title: file.name,
        payload: { fileId: file.id, fileName: file.name },
      });
    }
  };

  const handleDownload = (file: FileNode) => {
    const blob = new Blob([file.content ?? ''], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Toolbar */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/50 px-3 py-2">
        <button
          onClick={() => navigateBreadcrumb(Math.max(0, breadcrumb.length - 2))}
          disabled={breadcrumb.length <= 1}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white disabled:opacity-30"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => {
            setCurrentParent(null);
            setBreadcrumb([{ id: null, name: 'Home' }]);
            setSelected(null);
          }}
          className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <Home className="h-4 w-4" />
        </button>

        {/* Breadcrumb */}
        <div className="flex items-center gap-1 overflow-hidden">
          {breadcrumb.map((crumb, i) => (
            <div key={i} className="flex items-center gap-1">
              {i > 0 && <span className="text-slate-600">/</span>}
              <button
                onClick={() => navigateBreadcrumb(i)}
                className="rounded px-1.5 py-0.5 text-xs font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                {crumb.name}
              </button>
            </div>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search..."
              className="w-32 rounded-md border border-white/10 bg-black/30 py-1.5 pl-8 pr-2 text-xs text-white placeholder-slate-600 outline-none focus:border-accent-500"
            />
          </div>
          <button
            onClick={() => setCreating('folder')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="New folder"
          >
            <FolderPlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setCreating('file')}
            className="flex h-7 w-7 items-center justify-center rounded-md text-slate-400 transition hover:bg-white/10 hover:text-white"
            title="New file"
          >
            <FilePlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* File grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : filtered.length === 0 && !creating ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 text-slate-500">
            <Folder className="h-12 w-12 opacity-30" />
            <p className="text-sm">This folder is empty</p>
            <p className="text-xs text-slate-600">Use the toolbar to create files and folders</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-2">
            {filtered.map((file) => {
              const Icon = fileIcon(file.name, file.type);
              const isSel = selected === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelected(file.id)}
                  onDoubleClick={() => handleOpen(file)}
                  className={`group flex cursor-pointer flex-col items-center gap-1.5 rounded-lg p-2.5 transition ${
                    isSel ? 'bg-accent-500/20 ring-1 ring-accent-500/40' : 'hover:bg-white/5'
                  }`}
                >
                  <Icon
                    className={`h-10 w-10 ${
                      file.type === 'folder'
                        ? 'text-accent-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span className="line-clamp-2 w-full text-center text-[11px] font-medium text-slate-300">
                    {file.name}
                  </span>
                  <span className="text-[9px] text-slate-600">
                    {file.type === 'file' ? formatSize(file.size_bytes) : '—'}
                  </span>

                  {isSel && (
                    <div className="flex gap-1">
                      {file.type === 'file' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(file);
                          }}
                          className="rounded p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
                        >
                          <Download className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleDelete(file.id);
                        }}
                        className="rounded p-1 text-slate-400 transition hover:bg-red-500/80 hover:text-white"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {creating && (
              <div className="flex flex-col items-center gap-1.5 rounded-lg p-2.5">
                {creating === 'folder' ? (
                  <Folder className="h-10 w-10 text-accent-400" />
                ) : (
                  <FileText className="h-10 w-10 text-slate-400" />
                )}
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onBlur={handleCreate}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreate();
                    if (e.key === 'Escape') {
                      setCreating(null);
                      setNewName('');
                    }
                  }}
                  placeholder={creating === 'folder' ? 'Folder name' : 'File name'}
                  className="w-full rounded border border-accent-500 bg-black/40 px-1.5 py-1 text-center text-[11px] text-white outline-none"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-white/10 bg-slate-800/50 px-3 py-1.5 text-[11px] text-slate-500">
        <span>{filtered.length} items</span>
        {selected && (
          <span>
            {files.find((f) => f.id === selected)?.type === 'file'
              ? `Selected: ${files.find((f) => f.id === selected)?.name}`
              : `Folder: ${files.find((f) => f.id === selected)?.name}`}
          </span>
        )}
      </div>
    </div>
  );
}

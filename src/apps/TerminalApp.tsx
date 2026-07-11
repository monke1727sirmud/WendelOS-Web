import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

interface Line { type: 'input' | 'output' | 'error' | 'system'; text: string; }

const NEOFETCH_LOGO = `       _____          
      /     \\         
     | ()() |   WendelOS 1.0 "Tuxedo"
      \\  ^  /    Kernel: wendel-6.7.0-browser-x86_64
       |||||     Shell: wsh 2.0.0
       |||||     DE: Wendel Desktop (macOS+Linux hybrid)
                 WM: wendel-compositor
                 Terminal: wterm 2.0
                 Theme: {{THEME}} [{{ACCENT}}]
                 CPU: Virtual @ 3.2GHz (4 cores)
                 Memory: {{MEMUSED}} / 16 GiB
                 Uptime: {{UPTIME}}`;

const BANNER = `\x1b[1mWendelOS\x1b[0m wsh 2.0.0 — Linux/macOS/Windows hybrid desktop
Type \x1b[33mhelp\x1b[0m for available commands.
`;

function uptimeStr() {
  const ms = performance.now(), s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m ${s % 60}s`;
}

export default function TerminalApp() {
  const { username, signOut, lock } = useAuth();
  const { openApp } = useWindowManager();
  const { settings } = useSettings();
  const [lines, setLines] = useState<Line[]>([{ type: 'system', text: BANNER }]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [currentParent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostname = 'wendel-os';
  const cwd = '~';

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [lines]);

  const appendLines = (newLines: Line[]) => setLines(prev => [...prev, ...newLines]);

  const runCommand = useCallback(async (cmd: string): Promise<Line[]> => {
    const parts = cmd.trim().split(/\s+/);
    const command = parts[0]?.toLowerCase();
    const args = parts.slice(1);
    const flags = args.filter(a => a.startsWith('-'));
    const realArgs = args.filter(a => !a.startsWith('-'));

    switch (command) {
      case '': return [];
      case 'help':
        return [{ type: 'output', text:
`\x1b[1;34m╔═════════════════ WendelOS wsh 2.0 ══════════════════╗\x1b[0m
\x1b[1;34m║\x1b[0m  \x1b[1;33mFile Operations\x1b[0m                                   \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m    ls [-l]  pwd  cat  mkdir  touch  rm  nano       \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m  \x1b[1;33mSystem\x1b[0m                                            \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m    uname [-a]  neofetch  free  ps  top  date       \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m    uptime  whoami  hostname  clear  history        \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m  \x1b[1;33mApps\x1b[0m                                               \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m    open <app>  settings  about                     \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m  \x1b[1;33mSession\x1b[0m                                            \x1b[1;34m║\x1b[0m
\x1b[1;34m║\x1b[0m    lock  logout  echo  sudo                        \x1b[1;34m║\x1b[0m
\x1b[1;34m╚═════════════════════════════════════════════════════╝\x1b[0m`
        }];
      case 'echo': return [{ type: 'output', text: args.join(' ') }];
      case 'whoami': return [{ type: 'output', text: username }];
      case 'hostname': return [{ type: 'output', text: hostname }];
      case 'date': return [{ type: 'output', text: new Date().toString() }];
      case 'uptime':
        return [{ type: 'output', text: ` up ${uptimeStr()},  1 user,  load average: 0.${Math.floor(Math.random()*99)}, 0.42, 0.38` }];
      case 'uname':
        return [{ type: 'output', text: flags.includes('-a') ? `WendelOS wendel-os 6.7.0-browser-x86_64 #1 SMP PREEMPT_DYNAMIC x86_64 GNU/Linux` : 'WendelOS' }];
      case 'neofetch':
        return [{ type: 'output', text: NEOFETCH_LOGO
          .replace('{{THEME}}', settings.theme === 'dark' ? 'Dark' : 'Light')
          .replace('{{ACCENT}}', settings.accent_color)
          .replace('{{MEMUSED}}', `${(Math.random()*4+4).toFixed(1)} GiB`)
          .replace('{{UPTIME}}', uptimeStr()) }];
      case 'free':
        return [{ type: 'output', text:
`               total        used        free      shared  buff/cache   available
Mem:           16Gi        4.2Gi       8.1Gi       256Mi       3.7Gi        11Gi
Swap:         2.0Gi          0B       2.0Gi` }];
      case 'ps': {
        const procs = [['1','root','/sbin/init'],['1024',username,'/usr/bin/wendel-compositor'],['1088',username,'wendel-panel'],['1156',username,'wterm'],['1789','postgres','postgres: writer'],['2048',username,'pipewire-pulse']];
        return [{ type: 'output', text: `  PID USER         COMMAND\n` + procs.map(p => `${p[0].padStart(5)} ${p[1].padEnd(12)} ${p[2]}`).join('\n') }];
      }
      case 'pwd': return [{ type: 'output', text: `/home/${username}` }];
      case 'clear': setLines([]); return [];
      case 'history':
        return [{ type: 'output', text: history.map((h,i) => `  ${(i+1).toString().padStart(3)}  ${h}`).join('\n') || '(empty)' }];
      case 'ls': {
        const { data } = await supabase.from('files').select('name, type, size_bytes, updated_at')
          .is('parent_id', currentParent).order('type', { ascending: true }).order('name', { ascending: true });
        if (!data || data.length === 0) return [];
        if (flags.includes('-l')) {
          const text = data.map(f => {
            const perm = f.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
            const size = f.type === 'folder' ? '4096' : String(f.size_bytes || 0);
            const date = new Date(f.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
            return `${perm}  ${username}  ${size.padStart(8)}  ${date}  ${f.type === 'folder' ? f.name + '/' : f.name}`;
          }).join('\n');
          return [{ type: 'output', text: `total ${data.length}\n${text}` }];
        }
        return [{ type: 'output', text: data.map(f => f.type === 'folder' ? `\x1b[1;34m${f.name}/\x1b[0m` : f.name).join('   ') }];
      }
      case 'cat': {
        if (!realArgs[0]) return [{ type: 'error', text: 'cat: missing operand' }];
        const { data } = await supabase.from('files').select('content, type').eq('name', realArgs[0]).is('parent_id', currentParent).maybeSingle();
        if (!data) return [{ type: 'error', text: `cat: ${realArgs[0]}: No such file or directory` }];
        if (data.type === 'folder') return [{ type: 'error', text: `cat: ${realArgs[0]}: Is a directory` }];
        return [{ type: 'output', text: data.content ?? '' }];
      }
      case 'mkdir': {
        if (!realArgs[0]) return [{ type: 'error', text: 'mkdir: missing operand' }];
        const { error } = await supabase.from('files').insert({ name: realArgs[0], parent_id: currentParent, type: 'folder', content: null });
        if (error) return [{ type: 'error', text: `mkdir: ${error.message}` }];
        return [];
      }
      case 'touch': {
        if (!realArgs[0]) return [{ type: 'error', text: 'touch: missing operand' }];
        const { error } = await supabase.from('files').insert({ name: realArgs[0], parent_id: currentParent, type: 'file', content: '', size_bytes: 0 });
        if (error) return [{ type: 'error', text: `touch: ${error.message}` }];
        return [];
      }
      case 'rm': {
        if (!realArgs[0]) return [{ type: 'error', text: 'rm: missing operand' }];
        const { error } = await supabase.from('files').delete().eq('name', realArgs[0]).is('parent_id', currentParent);
        if (error) return [{ type: 'error', text: `rm: ${error.message}` }];
        return [];
      }
      case 'nano': {
        if (!realArgs[0]) return [{ type: 'error', text: 'nano: missing operand' }];
        const { data } = await supabase.from('files').select('id, name').eq('name', realArgs[0]).is('parent_id', currentParent).maybeSingle();
        if (data) { openApp('editor', { title: data.name, payload: { fileId: data.id, fileName: data.name } }); }
        else {
          const { data: created } = await supabase.from('files').insert({ name: realArgs[0], parent_id: currentParent, type: 'file', content: '', size_bytes: 0 }).select('id, name').single();
          if (created) openApp('editor', { title: created.name, payload: { fileId: created.id, fileName: created.name } });
        }
        return [{ type: 'output', text: `Opening ${realArgs[0]}...` }];
      }
      case 'top': openApp('sysmon'); return [{ type: 'output', text: 'Launching system monitor...' }];
      case 'open': {
        const validApps = ['files','notes','editor','calculator','browser','calendar','settings','sysmon','music'];
        const app = realArgs[0]?.toLowerCase();
        if (!app || !validApps.includes(app)) return [{ type: 'error', text: `open: ${realArgs[0] ?? ''}: unknown app. Valid: ${validApps.join(', ')}` }];
        openApp(app as Parameters<typeof openApp>[0]);
        return [{ type: 'output', text: `Launching ${app}...` }];
      }
      case 'settings':
        return [{ type: 'output', text: `wallpaper: ${settings.wallpaper}\ntheme: ${settings.theme}\naccent: ${settings.accent_color}\nauto_lock: ${settings.auto_lock_minutes === 0 ? 'disabled' : settings.auto_lock_minutes + 'm'}` }];
      case 'lock': lock(); return [{ type: 'output', text: 'Locking screen...' }];
      case 'logout': await signOut(); return [];
      case 'about':
        return [{ type: 'output', text: `WendelOS 1.0 "Tuxedo"\nLinux + macOS + Windows hybrid desktop for the browser.\nKernel: wendel-6.7.0-browser-x86_64 | Shell: wsh 2.0.0` }];
      case 'sudo':
        return [{ type: 'error', text: `${username} is not in the sudoers file. This incident will be reported.` }];
      case 'apt': case 'apt-get':
        return [{ type: 'error', text: `E: Unable to locate package ${realArgs.join(' ')}` }];
      case 'brew':
        return [{ type: 'error', text: `brew: command not found. This isn't macOS... or is it? 🐧` }];
      case 'winget':
        return [{ type: 'error', text: `winget: not available. Try apt or brew.` }];
      default:
        return [{ type: 'error', text: `wsh: command not found: ${command}. Type 'help' for available commands.` }];
    }
  }, [username, settings, openApp, signOut, lock, history, currentParent]);

  const handleSubmit = async () => {
    const cmd = input;
    setHistory(prev => [...prev, cmd]);
    setHistIdx(-1);
    setInput('');
    appendLines([{ type: 'input', text: cmd }]);
    const output = await runCommand(cmd);
    if (output.length > 0) appendLines(output);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { void handleSubmit(); }
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx); setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx !== -1) {
        const idx = histIdx + 1;
        if (idx >= history.length) { setHistIdx(-1); setInput(''); }
        else { setHistIdx(idx); setInput(history[idx]); }
      }
    } else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); setLines([]); }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-[#0d1117]" onClick={() => inputRef.current?.focus()}>
      {/* Terminal header bar — Linux tmux style */}
      <div className="flex items-center justify-between border-b border-white/8 bg-[#161b22] px-3 py-1.5 select-none">
        <span className="font-mono text-[10px] text-white/25">{username}@{hostname} — wsh 2.0</span>
        <div className="flex items-center gap-3 text-[10px] text-white/20 font-mono">
          <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}</span>
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3 font-mono text-sm">
        {lines.map((line, i) => (
          <div key={i} className={`whitespace-pre-wrap break-all leading-relaxed ${
            line.type === 'input' ? 'text-white/90' :
            line.type === 'error' ? 'text-red-400' :
            line.type === 'system' ? 'text-accent-400/80' :
            'text-slate-300'
          }`}>
            {line.type === 'input' ? (
              <span>
                <span className="text-emerald-400">{username}</span>
                <span className="text-white/30">@</span>
                <span className="text-blue-400">{hostname}</span>
                <span className="text-white/30">:</span>
                <span className="text-accent-400">{cwd}</span>
                <span className="text-white/50">$ </span>
                <span className="text-white">{line.text}</span>
              </span>
            ) : line.text}
          </div>
        ))}

        {/* Input line */}
        <div className="flex items-center">
          <span className="text-emerald-400">{username}</span>
          <span className="text-white/30">@</span>
          <span className="text-blue-400">{hostname}</span>
          <span className="text-white/30">:</span>
          <span className="text-accent-400">{cwd}</span>
          <span className="text-white/50">$ </span>
          <input ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
            autoFocus spellCheck={false}
            className="flex-1 bg-transparent text-white caret-accent-400 outline-none"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }} />
        </div>
      </div>

      {/* tmux-style status bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-[#161b22] px-3 py-1 font-mono text-[10px] select-none">
        <span className="text-accent-400/60">wsh 2.0</span>
        <span className="text-white/20">0: bash</span>
        <span className="text-white/20">{history.length} cmd{history.length !== 1 ? 's' : ''}</span>
      </div>
    </div>
  );
}

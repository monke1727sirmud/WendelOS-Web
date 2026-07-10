import { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWindowManager } from '../context/WindowManagerContext';
import { useSettings } from '../context/SettingsContext';
import { supabase } from '../lib/supabase';

interface Line {
  type: 'input' | 'output' | 'error';
  text: string;
}

const NEOFETCH_LOGO = `       _____          
      /     \\         
     | ()() |   WendelOS 1.0 "Tuxedo"
      \\  ^  /    Kernel: wendel-6.7.0-browser-x86_64
       |||||     Shell: wsh 1.0.0
       |||||     DE: Wendel Desktop Environment
                 WM: wendel-compositor
                 Terminal: wterm
                 Theme: {{THEME}} [{{ACCENT}}]
                 CPU: Virtual @ 3.2GHz (4 cores)
                 Memory: {{MEMUSED}} / 16 GiB
                 Uptime: {{UPTIME}}`;

const BANNER = `WendelOS 1.0 "Tuxedo" - wsh 1.0.0
Type 'help' for available commands.

`;

function uptimeStr() {
  const ms = performance.now();
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${s % 60}s`;
}

export default function TerminalApp() {
  const { username, signOut, lock } = useAuth();
  const { openApp } = useWindowManager();
  const { settings } = useSettings();
  const [lines, setLines] = useState<Line[]>([
    { type: 'output', text: BANNER },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [histIdx, setHistIdx] = useState(-1);
  const [cwd] = useState('~');
  const [currentParent] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const hostname = 'wendel-os';

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  const appendLines = (newLines: Line[]) => {
    setLines((prev) => [...prev, ...newLines]);
  };

  const runCommand = useCallback(
    async (cmd: string): Promise<Line[]> => {
      const parts = cmd.trim().split(/\s+/);
      const command = parts[0]?.toLowerCase();
      const args = parts.slice(1);
      const flags = args.filter((a) => a.startsWith('-'));
      const realArgs = args.filter((a) => !a.startsWith('-'));

      switch (command) {
        case '':
          return [];

        case 'help':
          return [
            {
              type: 'output',
              text: `WendelOS shell - available commands:

  File Operations:
    ls [-l]            List directory contents
    pwd                Print working directory
    cat <file>         Display file contents
    mkdir <name>       Create a directory
    touch <name>       Create an empty file
    rm <name>          Remove a file or directory
    nano <file>        Open file in text editor

  System:
    uname [-a]         Print system information
    neofetch           Display system info with logo
    whoami             Print current user
    hostname           Print system hostname
    date               Print current date and time
    uptime             Show system uptime
    top                Open system monitor
    free               Show memory usage
    ps                 List running processes

  Session:
    clear              Clear the terminal
    history            Show command history
    echo <text>        Print text
    open <app>         Launch an application
    settings           Show current settings
    lock               Lock the screen
    logout             End session
    about              About WendelOS`,
            },
          ];

        case 'echo':
          return [{ type: 'output', text: args.join(' ') }];

        case 'whoami':
          return [{ type: 'output', text: username }];

        case 'hostname':
          return [{ type: 'output', text: hostname }];

        case 'date':
          return [{ type: 'output', text: new Date().toString() }];

        case 'uptime':
          return [{ type: 'output', text: ` ${new Date().toLocaleTimeString('en-US', { hour12: false })} up ${uptimeStr()},  1 user,  load average: 0.${Math.floor(Math.random() * 99)}, 0.42, 0.38` }];

        case 'uname':
          if (flags.includes('-a')) {
            return [{ type: 'output', text: `WendelOS wendel-os 6.7.0-browser-x86_64 #1 SMP PREEMPT_DYNAMIC $(date -u +%Y-%m-%d) x86_64 GNU/Linux` }];
          }
          return [{ type: 'output', text: 'WendelOS' }];

        case 'neofetch':
          return [
            {
              type: 'output',
              text: NEOFETCH_LOGO
                .replace('{{THEME}}', settings.theme === 'dark' ? 'Dark' : 'Light')
                .replace('{{ACCENT}}', settings.accent_color)
                .replace('{{MEMUSED}}', `${(Math.random() * 4 + 4).toFixed(1)} GiB`)
                .replace('{{UPTIME}}', uptimeStr()),
            },
          ];

        case 'free':
          return [
            {
              type: 'output',
              text: `               total        used        free      shared  buff/cache   available
Mem:           16Gi        4.2Gi       8.1Gi       256Mi       3.7Gi        11Gi
Swap:         2.0Gi          0B       2.0Gi`,
            },
          ];

        case 'ps': {
          const procs = [
            ['1', 'root', '/sbin/init'],
            ['1024', username, '/usr/bin/wendel-compositor'],
            ['1088', username, 'wendel-panel --bar'],
            ['1156', username, 'wterm'],
            ['1789', 'postgres', 'postgres: writer'],
            ['2048', username, 'pipewire-pulse'],
          ];
          return [
            {
              type: 'output',
              text: `  PID USER         COMMAND\n` + procs.map((p) => `${p[0].padStart(5)} ${p[1].padEnd(12)} ${p[2]}`).join('\n'),
            },
          ];
        }

        case 'pwd':
          return [{ type: 'output', text: cwd === '~' ? `/home/${username}` : cwd }];

        case 'clear':
          setLines([]);
          return [];

        case 'history':
          return [
            {
              type: 'output',
              text: history.map((h, i) => `  ${(i + 1).toString().padStart(3)}  ${h}`).join('\n') || '(empty)',
            },
          ];

        case 'ls': {
          const { data } = await supabase
            .from('files')
            .select('name, type, size_bytes, updated_at')
            .is('parent_id', currentParent)
            .order('type', { ascending: true })
            .order('name', { ascending: true });

          if (!data || data.length === 0) {
            return [];
          }

          if (flags.includes('-l')) {
            const text = data
              .map((f) => {
                const perm = f.type === 'folder' ? 'drwxr-xr-x' : '-rw-r--r--';
                const size = f.type === 'folder' ? '4096' : (f.size_bytes || 0).toString();
                const date = new Date(f.updated_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
                const name = f.type === 'folder' ? f.name + '/' : f.name;
                return `${perm}  ${username}  ${size.padStart(8)}  ${date}  ${name}`;
              })
              .join('\n');
            return [{ type: 'output', text: `total ${data.length}\n${text}` }];
          }

          const names = data.map((f) => (f.type === 'folder' ? f.name + '/' : f.name));
          return [{ type: 'output', text: names.join('   ') }];
        }

        case 'cat': {
          if (!realArgs[0]) return [{ type: 'error', text: 'cat: missing operand' }];
          const { data } = await supabase
            .from('files')
            .select('content, type')
            .eq('name', realArgs[0])
            .is('parent_id', currentParent)
            .maybeSingle();
          if (!data) return [{ type: 'error', text: `cat: ${realArgs[0]}: No such file or directory` }];
          if (data.type === 'folder') return [{ type: 'error', text: `cat: ${realArgs[0]}: Is a directory` }];
          return [{ type: 'output', text: data.content ?? '' }];
        }

        case 'mkdir': {
          if (!realArgs[0]) return [{ type: 'error', text: 'mkdir: missing operand' }];
          const { error } = await supabase
            .from('files')
            .insert({ name: realArgs[0], parent_id: currentParent, type: 'folder', content: null });
          if (error) return [{ type: 'error', text: `mkdir: ${error.message}` }];
          return [];
        }

        case 'touch': {
          if (!realArgs[0]) return [{ type: 'error', text: 'touch: missing operand' }];
          const { error } = await supabase
            .from('files')
            .insert({ name: realArgs[0], parent_id: currentParent, type: 'file', content: '', size_bytes: 0 });
          if (error) return [{ type: 'error', text: `touch: ${error.message}` }];
          return [];
        }

        case 'rm': {
          if (!realArgs[0]) return [{ type: 'error', text: 'rm: missing operand' }];
          const { error } = await supabase
            .from('files')
            .delete()
            .eq('name', realArgs[0])
            .is('parent_id', currentParent);
          if (error) return [{ type: 'error', text: `rm: ${error.message}` }];
          return [];
        }

        case 'nano': {
          if (!realArgs[0]) return [{ type: 'error', text: 'nano: missing operand' }];
          const { data } = await supabase
            .from('files')
            .select('id, name')
            .eq('name', realArgs[0])
            .is('parent_id', currentParent)
            .maybeSingle();
          if (data) {
            openApp('editor', { title: data.name, payload: { fileId: data.id, fileName: data.name } });
          } else {
            const { data: created } = await supabase
              .from('files')
              .insert({ name: realArgs[0], parent_id: currentParent, type: 'file', content: '', size_bytes: 0 })
              .select('id, name')
              .single();
            if (created) {
              openApp('editor', { title: created.name, payload: { fileId: created.id, fileName: created.name } });
            }
          }
          return [{ type: 'output', text: `Opening ${realArgs[0]} in nano...` }];
        }

        case 'top':
          openApp('sysmon');
          return [{ type: 'output', text: 'Launching system monitor...' }];

        case 'open': {
          const validApps = ['files', 'notes', 'editor', 'calculator', 'browser', 'calendar', 'settings', 'sysmon', 'music'];
          const app = realArgs[0]?.toLowerCase();
          if (!app || !validApps.includes(app)) {
            return [{ type: 'error', text: `open: ${realArgs[0] ?? ''}: unknown application. Valid: ${validApps.join(', ')}` }];
          }
          openApp(app as 'files' | 'notes' | 'editor' | 'calculator' | 'browser' | 'calendar' | 'settings' | 'sysmon' | 'music');
          return [{ type: 'output', text: `Launching ${app}...` }];
        }

        case 'settings':
          return [
            {
              type: 'output',
              text: `wallpaper: ${settings.wallpaper}
theme: ${settings.theme}
accent: ${settings.accent_color}
auto_lock: ${settings.auto_lock_minutes === 0 ? 'disabled' : settings.auto_lock_minutes + 'm'}`,
            },
          ];

        case 'lock':
          lock();
          return [{ type: 'output', text: 'Locking screen...' }];

        case 'logout':
          await signOut();
          return [{ type: 'output', text: 'Session ending...' }];

        case 'about':
          return [
            {
              type: 'output',
              text: `WendelOS 1.0 "Tuxedo"
A Linux-inspired desktop operating system for the browser.
Built with React, Tailwind CSS, and Supabase.
Kernel: wendel-6.7.0-browser-x86_64 | Shell: wsh 1.0.0`,
            },
          ];

        case 'sudo':
          return [{ type: 'error', text: `${username} is not in the sudoers file. This incident will be reported.` }];

        case 'apt':
        case 'apt-get':
          return [{ type: 'error', text: `E: Unable to locate package ${realArgs.join(' ')}` }];

        default:
          return [{ type: 'error', text: `wsh: command not found: ${command}. Type 'help' for available commands.` }];
      }
    },
    [username, settings, openApp, signOut, lock, history, currentParent, cwd]
  );

  const handleSubmit = async () => {
    const cmd = input;
    setHistory((prev) => [...prev, cmd]);
    setHistIdx(-1);
    setInput('');

    appendLines([{ type: 'input', text: cmd }]);

    const output = await runCommand(cmd);
    if (output.length > 0) {
      appendLines(output);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      void handleSubmit();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const idx = histIdx === -1 ? history.length - 1 : Math.max(0, histIdx - 1);
        setHistIdx(idx);
        setInput(history[idx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (histIdx !== -1) {
        const idx = histIdx + 1;
        if (idx >= history.length) {
          setHistIdx(-1);
          setInput('');
        } else {
          setHistIdx(idx);
          setInput(history[idx]);
        }
      }
    } else if (e.key === 'l' && e.ctrlKey) {
      e.preventDefault();
      setLines([]);
    }
  };

  const prompt = `${username}@${hostname}:${cwd}$`;

  return (
    <div
      className="flex h-full flex-col bg-slate-950 font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-all ${
              line.type === 'input'
                ? 'text-accent-400'
                : line.type === 'error'
                ? 'text-red-400'
                : 'text-slate-300'
            }`}
          >
            {line.type === 'input' ? (
              <span>
                <span className="text-emerald-400">{prompt}</span>
                {' '}
                {line.text}
              </span>
            ) : (
              line.text
            )}
          </div>
        ))}

        {/* Active input line */}
        <div className="flex items-center">
          <span className="text-emerald-400">{prompt}</span>
          <span className="text-slate-500">&nbsp;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            spellCheck={false}
            className="flex-1 bg-transparent text-accent-400 outline-none"
            style={{ userSelect: 'text', WebkitUserSelect: 'text' }}
          />
        </div>
      </div>
    </div>
  );
}

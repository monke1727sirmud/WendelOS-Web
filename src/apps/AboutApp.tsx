import { Terminal, Shield, Lock, Database, Zap, Cpu, MemoryStick, HardDrive } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ASCII_LOGO = `    _____
   /     \\
  | ()() |
   \\  ^  /
    |||||
    |||||`;

const SYSINFO: { label: string; value: string }[] = [
  { label: 'OS', value: 'WendelOS 1.0 "Tuxedo"' },
  { label: 'Kernel', value: '6.7.0-browser-x86_64' },
  { label: 'Shell', value: 'wsh 1.0.0' },
  { label: 'DE', value: 'Wendel Desktop Environment' },
  { label: 'WM', value: 'wendel-compositor' },
  { label: 'Terminal', value: 'wterm' },
  { label: 'CPU', value: 'Virtual @ 3.2GHz (4)' },
  { label: 'Memory', value: '4.2 GiB / 16 GiB' },
  { label: 'Disk', value: '23.4 GiB / 64 GiB' },
  { label: 'Uptime', value: '2h 14m' },
];

export default function AboutApp() {
  const { username } = useAuth();

  const features = [
    { icon: Shield, title: 'PKCE Auth', desc: 'Secure session management' },
    { icon: Lock, title: 'Auto-Lock', desc: 'Inactivity-based locking' },
    { icon: Database, title: 'RLS Policies', desc: 'Per-user data isolation' },
    { icon: Zap, title: 'Live Sync', desc: 'Instant cloud persistence' },
  ];

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-thin bg-slate-900 p-6">
      {/* Neofetch-style banner */}
      <div className="mb-6 flex gap-6 rounded-xl border border-white/10 bg-black/30 p-5">
        {/* ASCII Logo */}
        <pre className="shrink-0 font-mono text-xs leading-tight text-accent-400 select-none">
{ASCII_LOGO}
        </pre>

        {/* System info */}
        <div className="flex-1 space-y-1 font-mono text-xs">
          {SYSINFO.map((row) => (
            <div key={row.label} className="flex gap-2">
              <span className="shrink-0 font-semibold text-accent-400">{row.label}</span>
              <span className="text-slate-300">{row.value}</span>
            </div>
          ))}
          <div className="mt-2 flex gap-1">
            <span className="h-3 w-3 rounded-sm bg-black" />
            <span className="h-3 w-3 rounded-sm bg-red-500" />
            <span className="h-3 w-3 rounded-sm bg-emerald-500" />
            <span className="h-3 w-3 rounded-sm bg-yellow-500" />
            <span className="h-3 w-3 rounded-sm bg-blue-500" />
            <span className="h-3 w-3 rounded-sm bg-violet-500" />
            <span className="h-3 w-3 rounded-sm bg-cyan-500" />
            <span className="h-3 w-3 rounded-sm bg-slate-300" />
          </div>
        </div>
      </div>

      {/* Center branding */}
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-white">WendelOS</h1>
        <p className="mt-1 text-xs text-slate-500">A Linux-inspired desktop OS for the browser</p>
        <p className="mt-2 text-[10px] text-slate-600">
          User: @{username} | Built with React + Tailwind + Supabase
        </p>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3">
        {features.map((f) => {
          const Icon = f.icon;
          return (
            <div
              key={f.title}
              className="rounded-xl border border-white/10 bg-slate-800/50 p-3"
            >
              <Icon className="h-5 w-5 text-accent-400" />
              <p className="mt-2 text-xs font-semibold text-white">{f.title}</p>
              <p className="text-[10px] text-slate-500">{f.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Tech stack */}
      <div className="mt-4 rounded-xl border border-white/10 bg-slate-800/30 p-4">
        <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold text-white">
          <Terminal className="h-4 w-4 text-accent-400" /> Installed Packages
        </h3>
        <div className="grid grid-cols-2 gap-1 font-mono text-[10px] text-slate-400">
          <span>react 18.3.1</span>
          <span>tailwindcss 3.4.1</span>
          <span>supabase-js 2.57</span>
          <span>lucide-react 0.344</span>
          <span>vite 5.4.2</span>
          <span>typescript 5.5.3</span>
          <span>wsh 1.0.0</span>
          <span>wterm 1.0.0</span>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-slate-600">
        <Cpu className="h-3 w-3" />
        <MemoryStick className="h-3 w-3" />
        <HardDrive className="h-3 w-3" />
        <span>WendelOS is free and open source</span>
      </div>
    </div>
  );
}

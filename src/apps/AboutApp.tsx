import { TerminalSquare, Shield, Lock, Database, Zap, Cpu, MemoryStick, HardDrive, Clock, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ASCII_LOGO = `    _____
   /     \\
  | ()() |
   \\  ^  /
    |||||
    |||||`;

const SYSINFO = [
  { label: 'OS',       value: 'WendelOS 1.0 "Tuxedo"' },
  { label: 'Kernel',   value: '6.7.0-browser-x86_64' },
  { label: 'Shell',    value: 'wsh 2.0.0' },
  { label: 'DE',       value: 'Wendel Desktop (Linux+macOS+Win)' },
  { label: 'WM',       value: 'wendel-compositor' },
  { label: 'Terminal', value: 'wterm 2.0' },
  { label: 'CPU',      value: 'Virtual @ 3.2GHz (4 cores)' },
  { label: 'Memory',   value: '4.2 GiB / 16 GiB' },
  { label: 'Disk',     value: '23.4 GiB / 64 GiB' },
  { label: 'Uptime',   value: '2h 14m' },
];

export default function AboutApp() {
  const { username } = useAuth();

  return (
    <div className="flex h-full flex-col overflow-y-auto scrollbar-thin bg-[#1c1c1e] p-5 space-y-4">
      {/* Neofetch banner */}
      <div className="flex gap-5 rounded-2xl border border-white/8 bg-[#0d1117] p-5">
        <pre className="shrink-0 font-mono text-xs leading-tight text-accent-400 select-none">{ASCII_LOGO}</pre>
        <div className="flex-1 space-y-1 font-mono text-xs min-w-0">
          {SYSINFO.map(row => (
            <div key={row.label} className="flex gap-2 min-w-0">
              <span className="shrink-0 font-semibold text-accent-400">{row.label}</span>
              <span className="text-slate-300 truncate">{row.value}</span>
            </div>
          ))}
          <div className="mt-2 flex gap-1">
            {['bg-black','bg-red-500','bg-emerald-500','bg-yellow-500','bg-blue-500','bg-violet-500','bg-cyan-500','bg-slate-300'].map((c,i) => (
              <span key={i} className={`h-3 w-3 rounded-sm ${c}`} />
            ))}
          </div>
        </div>
      </div>

      {/* Branding */}
      <div className="rounded-2xl border border-white/8 bg-[#252528] p-5 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-400 to-accent-600 shadow-lg">
          <TerminalSquare className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-xl font-bold text-white">WendelOS</h1>
        <p className="mt-1 text-xs text-white/35">Linux · macOS · Windows — one desktop, three philosophies</p>
        <p className="mt-2 text-[10px] text-white/20 font-mono">@{username} · React 18 + Tailwind + Supabase</p>
        <div className="mt-4 flex justify-center gap-3 text-[10px]">
          {[
            { label: 'Linux kernel', color: 'text-amber-400' },
            { label: 'macOS UI', color: 'text-sky-400' },
            { label: 'Windows shell', color: 'text-emerald-400' },
          ].map(({ label, color }) => (
            <span key={label} className={`rounded-full border border-white/8 px-2.5 py-1 ${color}`}>{label}</span>
          ))}
        </div>
      </div>

      {/* Security features */}
      <div className="rounded-2xl border border-white/8 bg-[#252528] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-white">
          <Shield className="h-4 w-4 text-emerald-400" /> Security Features
        </h3>
        <div className="grid grid-cols-2 gap-2">
          {[
            { icon: Lock,     title: 'PKCE Auth',    desc: 'Secure session flow' },
            { icon: Database, title: 'RLS Policies', desc: 'Per-user data isolation' },
            { icon: Zap,      title: 'Auto-refresh', desc: '80% threshold rotation' },
            { icon: Clock,    title: 'Auto-lock',    desc: 'Inactivity screen lock' },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-xl border border-white/5 bg-white/3 p-3">
              <Icon className="h-4 w-4 text-accent-400 mb-1.5" />
              <p className="text-xs font-semibold text-white/70">{title}</p>
              <p className="text-[10px] text-white/30">{desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tech stack */}
      <div className="rounded-2xl border border-white/8 bg-[#0d1117] p-5">
        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold text-white/60">
          <TerminalSquare className="h-3.5 w-3.5 text-accent-400" /> Installed Packages
        </h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 font-mono text-[10px] text-white/30">
          {['react 18.3.1','tailwindcss 3.4.1','supabase-js 2.57','lucide-react 0.344','vite 5.4.2','typescript 5.5.3','wsh 2.0.0','wterm 2.0.0'].map(pkg => (
            <span key={pkg}>{pkg}</span>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-[10px] text-white/15 pb-2">
        <Cpu className="h-3 w-3" /><MemoryStick className="h-3 w-3" /><HardDrive className="h-3 w-3" /><Globe className="h-3 w-3" />
        <span>WendelOS is free and open source</span>
      </div>
    </div>
  );
}

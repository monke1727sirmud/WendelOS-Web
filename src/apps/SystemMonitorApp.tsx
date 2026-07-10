import { useState, useEffect, useCallback } from 'react';
import {
  Activity, Cpu, MemoryStick, HardDrive, Network, RefreshCw,
} from 'lucide-react';

interface ProcRow {
  pid: number;
  user: string;
  cpu: number;
  mem: number;
  command: string;
}

const BASE_PROCS: ProcRow[] = [
  { pid: 1, user: 'root', cpu: 0.0, mem: 0.1, command: '/sbin/init' },
  { pid: 2, user: 'root', cpu: 0.0, mem: 0.0, command: '[kthreadd]' },
  { pid: 412, user: 'systemd+', cpu: 0.2, mem: 1.4, command: '/lib/systemd/systemd-resolved' },
  { pid: 587, user: 'systemd+', cpu: 0.1, mem: 0.8, command: '/lib/systemd/systemd-timesyncd' },
  { pid: 901, user: 'root', cpu: 0.0, mem: 0.3, command: '/usr/sbin/sshd -D' },
  { pid: 1024, user: 'wendel', cpu: 1.2, mem: 3.1, command: '/usr/bin/wendel-compositor' },
  { pid: 1088, user: 'wendel', cpu: 0.5, mem: 2.0, command: 'wendel-panel --bar' },
  { pid: 1156, user: 'wendel', cpu: 8.4, mem: 12.3, command: 'node /opt/wendel/apps/terminal' },
  { pid: 1204, user: 'wendel', cpu: 2.1, mem: 8.7, command: 'node /opt/wendel/apps/browser' },
  { pid: 1332, user: 'wendel', cpu: 0.3, mem: 1.5, command: 'node /opt/wendel/apps/files' },
  { pid: 1401, user: 'wendel', cpu: 15.2, mem: 18.4, command: 'node /opt/wendel/apps/sysmon' },
  { pid: 1567, user: 'wendel', cpu: 0.1, mem: 0.9, command: 'dbus-daemon --session' },
  { pid: 1789, user: 'postgres', cpu: 0.4, mem: 4.2, command: 'postgres: writer process' },
  { pid: 1790, user: 'postgres', cpu: 0.2, mem: 3.8, command: 'postgres: wal writer' },
  { pid: 2048, user: 'wendel', cpu: 0.8, mem: 2.3, command: 'pipewire-pulse' },
];

function jitter(val: number, max: number) {
  const v = val + (Math.random() - 0.5) * max;
  return Math.max(0, Math.round(v * 10) / 10);
}

function Gauge({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Cpu; color: string }) {
  const pct = Math.min(100, Math.round(value));
  return (
    <div className="rounded-xl border border-white/10 bg-slate-800/40 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs font-medium text-slate-400">
        <Icon className="h-4 w-4" style={{ color }} />
        {label}
      </div>
      <div className="mb-1.5 flex items-baseline gap-1">
        <span className="text-2xl font-bold tabular-nums text-white">{pct}</span>
        <span className="text-sm text-slate-500">%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-black/40">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function SystemMonitorApp() {
  const [procs, setProcs] = useState<ProcRow[]>(BASE_PROCS);
  const [cpuUsage, setCpuUsage] = useState(23);
  const [memUsage, setMemUsage] = useState(41);
  const [diskUsage, setDiskUsage] = useState(67);
  const [netUsage, setNetUsage] = useState(12);
  const [uptime, setUptime] = useState(0);
  const [sortKey, setSortKey] = useState<'cpu' | 'mem' | 'pid'>('cpu');
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setCpuUsage((v) => jitter(v, 15));
      setMemUsage((v) => jitter(v, 5));
      setDiskUsage((v) => jitter(v, 2));
      setNetUsage((v) => jitter(v, 20));
      setProcs((prev) =>
        prev.map((p) => ({
          ...p,
          cpu: p.pid === 1401 ? jitter(p.cpu, 8) : jitter(p.cpu, 3),
          mem: jitter(p.mem, 0.5),
        }))
      );
    }, 2000);
    return () => clearInterval(t);
  }, [running]);

  const sorted = useCallback(() => {
    const arr = [...procs];
    arr.sort((a, b) => {
      if (sortKey === 'cpu') return b.cpu - a.cpu;
      if (sortKey === 'mem') return b.mem - a.mem;
      return a.pid - b.pid;
    });
    return arr;
  }, [procs, sortKey])();

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h}h ${m}m ${sec}s`;
  };

  const totalMem = 16;
  const usedMem = (memUsage / 100) * totalMem;

  return (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-white/10 bg-slate-800/50 px-4 py-2.5">
        <Activity className="h-4 w-4 text-accent-400" />
        <span className="text-sm font-semibold text-white">System Monitor</span>
        <span className="text-xs text-slate-500">wendel-os</span>
        <button
          onClick={() => setRunning((v) => !v)}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 px-2.5 py-1 text-xs text-slate-400 transition hover:bg-white/10 hover:text-white"
        >
          <RefreshCw className={`h-3 w-3 ${running ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />
          {running ? 'Pause' : 'Resume'}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4">
        {/* Gauges */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Gauge label="CPU" value={cpuUsage} icon={Cpu} color="var(--accent-500)" />
          <Gauge label="Memory" value={memUsage} icon={MemoryStick} color="#10b981" />
          <Gauge label="Disk I/O" value={diskUsage} icon={HardDrive} color="#f59e0b" />
          <Gauge label="Network" value={netUsage} icon={Network} color="#f43f5e" />
        </div>

        {/* Summary */}
        <div className="mb-4 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg border border-white/10 bg-slate-800/30 py-2.5">
            <p className="text-xs text-slate-500">Uptime</p>
            <p className="text-sm font-semibold tabular-nums text-white">{formatUptime(uptime)}</p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-800/30 py-2.5">
            <p className="text-xs text-slate-500">Memory</p>
            <p className="text-sm font-semibold tabular-nums text-white">
              {usedMem.toFixed(1)} / {totalMem} GB
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-slate-800/30 py-2.5">
            <p className="text-xs text-slate-500">Processes</p>
            <p className="text-sm font-semibold tabular-nums text-white">{procs.length}</p>
          </div>
        </div>

        {/* Process table */}
        <div className="overflow-hidden rounded-lg border border-white/10">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400">
                <th
                  onClick={() => setSortKey('pid')}
                  className="cursor-pointer px-3 py-2 text-left font-medium hover:text-white"
                >
                  PID
                </th>
                <th className="px-3 py-2 text-left font-medium">USER</th>
                <th
                  onClick={() => setSortKey('cpu')}
                  className="cursor-pointer px-3 py-2 text-right font-medium hover:text-white"
                >
                  CPU%
                </th>
                <th
                  onClick={() => setSortKey('mem')}
                  className="cursor-pointer px-3 py-2 text-right font-medium hover:text-white"
                >
                  MEM%
                </th>
                <th className="px-3 py-2 text-left font-medium">COMMAND</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((p, i) => (
                <tr
                  key={p.pid}
                  className={`border-t border-white/5 transition hover:bg-white/5 ${
                    i % 2 === 0 ? 'bg-black/10' : ''
                  }`}
                >
                  <td className="px-3 py-1.5 tabular-nums text-slate-400">{p.pid}</td>
                  <td className="px-3 py-1.5 text-slate-400">{p.user}</td>
                  <td className="px-3 py-1.5 text-right tabular-nums">
                    <span className={p.cpu > 5 ? 'font-semibold text-accent-400' : 'text-slate-300'}>
                      {p.cpu.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-right tabular-nums text-slate-300">
                    {p.mem.toFixed(1)}
                  </td>
                  <td className="px-3 py-1.5 font-mono text-slate-300">{p.command}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

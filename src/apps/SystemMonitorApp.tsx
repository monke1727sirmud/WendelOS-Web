import { useState, useEffect, useCallback } from 'react';
import { Cpu, MemoryStick, HardDrive, Network, RefreshCw, Activity } from 'lucide-react';

interface ProcRow { pid: number; user: string; cpu: number; mem: number; command: string; }

const BASE_PROCS: ProcRow[] = [
  { pid: 1,    user: 'root',     cpu: 0.0,  mem: 0.1,  command: '/sbin/init' },
  { pid: 2,    user: 'root',     cpu: 0.0,  mem: 0.0,  command: '[kthreadd]' },
  { pid: 412,  user: 'systemd+', cpu: 0.2,  mem: 1.4,  command: '/lib/systemd/systemd-resolved' },
  { pid: 901,  user: 'root',     cpu: 0.0,  mem: 0.3,  command: '/usr/sbin/sshd -D' },
  { pid: 1024, user: 'wendel',   cpu: 1.2,  mem: 3.1,  command: '/usr/bin/wendel-compositor' },
  { pid: 1088, user: 'wendel',   cpu: 0.5,  mem: 2.0,  command: 'wendel-panel --bar' },
  { pid: 1156, user: 'wendel',   cpu: 8.4,  mem: 12.3, command: 'node /opt/wendel/terminal' },
  { pid: 1204, user: 'wendel',   cpu: 2.1,  mem: 8.7,  command: 'node /opt/wendel/browser' },
  { pid: 1332, user: 'wendel',   cpu: 0.3,  mem: 1.5,  command: 'node /opt/wendel/files' },
  { pid: 1401, user: 'wendel',   cpu: 15.2, mem: 18.4, command: 'node /opt/wendel/sysmon' },
  { pid: 1789, user: 'postgres', cpu: 0.4,  mem: 4.2,  command: 'postgres: writer process' },
  { pid: 2048, user: 'wendel',   cpu: 0.8,  mem: 2.3,  command: 'pipewire-pulse' },
];

function jitter(val: number, max: number) { return Math.max(0, Math.round((val + (Math.random() - 0.5) * max) * 10) / 10); }

function SparkLine({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * 100},${100 - (v / max) * 90}`).join(' ');
  return (
    <svg viewBox="0 0 100 100" className="w-full h-8" preserveAspectRatio="none">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
    </svg>
  );
}

function Gauge({ label, value, icon: Icon, color, unit = '%', history }: {
  label: string; value: number; icon: React.ComponentType<{className?:string}>; color: string; unit?: string; history: number[];
}) {
  const pct = Math.min(100, Math.round(value));
  return (
    <div className="rounded-2xl border border-white/8 bg-[#252528] p-4 flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span style={{ color }}><Icon className="h-4 w-4" /></span>
          <span className="text-xs font-medium text-white/50">{label}</span>
        </div>
        <span className="text-xl font-bold tabular-nums text-white">{pct}<span className="text-xs font-normal text-white/30 ml-0.5">{unit}</span></span>
      </div>
      {/* Sparkline */}
      <SparkLine values={history} color={color} />
      {/* Bar */}
      <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function SystemMonitorApp() {
  const [procs, setProcs] = useState<ProcRow[]>(BASE_PROCS);
  const [cpuVal, setCpuVal] = useState(23);
  const [memVal, setMemVal] = useState(41);
  const [diskVal, setDiskVal] = useState(67);
  const [netVal, setNetVal] = useState(12);
  const [cpuHist, setCpuHist] = useState<number[]>(Array(20).fill(23));
  const [memHist, setMemHist] = useState<number[]>(Array(20).fill(41));
  const [uptime, setUptime] = useState(0);
  const [sortKey, setSortKey] = useState<'cpu'|'mem'|'pid'>('cpu');
  const [running, setRunning] = useState(true);

  useEffect(() => {
    const start = Date.now();
    const t = setInterval(() => setUptime(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => {
      setCpuVal(v => { const n = jitter(v, 15); setCpuHist(h => [...h.slice(-19), n]); return n; });
      setMemVal(v => { const n = jitter(v, 5); setMemHist(h => [...h.slice(-19), n]); return n; });
      setDiskVal(v => jitter(v, 2));
      setNetVal(v => jitter(v, 20));
      setProcs(prev => prev.map(p => ({ ...p, cpu: p.pid === 1401 ? jitter(p.cpu, 8) : jitter(p.cpu, 3), mem: jitter(p.mem, 0.5) })));
    }, 2000);
    return () => clearInterval(t);
  }, [running]);

  const sorted = useCallback(() => {
    return [...procs].sort((a, b) => sortKey === 'cpu' ? b.cpu - a.cpu : sortKey === 'mem' ? b.mem - a.mem : a.pid - b.pid);
  }, [procs, sortKey])();

  const fmt = (s: number) => { const h = Math.floor(s/3600), m = Math.floor((s%3600)/60); return `${h}h ${m}m ${s%60}s`; };
  const usedMem = ((memVal / 100) * 16).toFixed(1);

  return (
    <div className="flex h-full flex-col bg-[#1c1c1e] text-white/80">
      {/* Header — Linux htop style */}
      <div className="flex items-center gap-3 border-b border-white/8 bg-[#252528] px-4 py-2.5">
        <Activity className="h-4 w-4 text-accent-400" />
        <span className="text-sm font-semibold text-white">System Monitor</span>
        <span className="font-mono text-[10px] text-white/25">wendel-os</span>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-[10px] text-white/20 font-mono">uptime {fmt(uptime)}</span>
          <button onClick={() => setRunning(v => !v)}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1 text-xs text-white/40 transition hover:bg-white/8 hover:text-white">
            <RefreshCw className={`h-3 w-3 ${running ? 'animate-spin' : ''}`} style={{ animationDuration: '2s' }} />
            {running ? 'Pause' : 'Resume'}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
        {/* Gauges with sparklines */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Gauge label="CPU" value={cpuVal} icon={Cpu} color="var(--accent-500)" history={cpuHist} />
          <Gauge label="Memory" value={memVal} icon={MemoryStick} color="#10b981" history={memHist} />
          <Gauge label="Disk I/O" value={diskVal} icon={HardDrive} color="#f59e0b" history={Array(20).fill(diskVal)} />
          <Gauge label="Network" value={netVal} icon={Network} color="#f43f5e" history={Array(20).fill(netVal)} />
        </div>

        {/* Summary row — Windows Task Manager style */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Uptime', value: fmt(uptime) },
            { label: 'Memory used', value: `${usedMem} / 16 GB` },
            { label: 'Processes', value: `${procs.length}` },
            { label: 'Threads', value: `${procs.length * 4}` },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-white/8 bg-[#252528] px-3 py-2.5 text-center">
              <p className="text-[10px] text-white/25">{label}</p>
              <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">{value}</p>
            </div>
          ))}
        </div>

        {/* Process table — Linux top / htop style */}
        <div className="overflow-hidden rounded-xl border border-white/8">
          <div className="bg-[#252528]">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/8 text-white/30">
                  {[
                    { key: 'pid', label: 'PID', align: 'left' },
                    { key: null, label: 'USER', align: 'left' },
                    { key: 'cpu', label: 'CPU%', align: 'right' },
                    { key: 'mem', label: 'MEM%', align: 'right' },
                    { key: null, label: 'COMMAND', align: 'left' },
                  ].map(({ key, label, align }) => (
                    <th key={label} onClick={() => key && setSortKey(key as 'cpu'|'mem'|'pid')}
                      className={`px-3 py-2 font-semibold uppercase tracking-wider ${key ? 'cursor-pointer hover:text-white' : ''} text-${align}`}>
                      {label}{key === sortKey ? ' ▼' : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => (
                  <tr key={p.pid} className={`border-t border-white/5 transition hover:bg-white/4 ${i % 2 === 0 ? 'bg-black/8' : ''}`}>
                    <td className="px-3 py-1.5 tabular-nums text-white/30 font-mono">{p.pid}</td>
                    <td className="px-3 py-1.5 text-white/40">{p.user}</td>
                    <td className="px-3 py-1.5 text-right tabular-nums">
                      <div className="flex items-center justify-end gap-1.5">
                        <div className="w-12 h-1 rounded-full bg-white/8 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${Math.min(100, p.cpu * 5)}%`, background: 'var(--accent-500)' }} />
                        </div>
                        <span className={p.cpu > 5 ? 'text-accent-400 font-semibold' : 'text-white/50'}>{p.cpu.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="px-3 py-1.5 text-right tabular-nums text-white/40">{p.mem.toFixed(1)}</td>
                    <td className="px-3 py-1.5 font-mono text-white/50 truncate max-w-[180px]">{p.command}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

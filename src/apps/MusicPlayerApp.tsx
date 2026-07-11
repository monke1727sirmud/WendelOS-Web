import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, VolumeX, ListMusic, Heart,
} from 'lucide-react';

interface Track { id: number; title: string; artist: string; album: string; duration: number; cover: string; }

const TRACKS: Track[] = [
  { id: 1, title: 'Midnight Protocol',  artist: 'Neon Cipher',    album: 'Terminal Velocity',     duration: 214, cover: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 2, title: 'Root Access',        artist: 'The Sudoers',    album: 'Privilege Escalation',  duration: 187, cover: 'https://images.pexels.com/photos/1370549/pexels-photo-1370549.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 3, title: 'Kernel Panic',       artist: 'OOM Killer',     album: 'Segmentation Fault',    duration: 245, cover: 'https://images.pexels.com/photos/1611548/pexels-photo-1611548.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 4, title: 'Tuxedo Junction',    artist: 'Penguin Quartet', album: 'Ice Cold Jazz',        duration: 198, cover: 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 5, title: 'Daemon Dance',       artist: 'Fork Bomb',      album: 'Process Tree',          duration: 172, cover: 'https://images.pexels.com/photos/1530028/pexels-photo-1530028.jpeg?auto=compress&cs=tinysrgb&w=400' },
  { id: 6, title: 'Inotify',            artist: 'File Watchers',  album: 'Event Loop',            duration: 233, cover: 'https://images.pexels.com/photos/1402754/pexels-photo-1402754.jpeg?auto=compress&cs=tinysrgb&w=400' },
];

function fmtTime(s: number) { const m = Math.floor(s / 60); return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`; }

export default function MusicPlayerApp() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const track = TRACKS[trackIdx];

  const next = useCallback(() => {
    setProgress(0);
    if (shuffle) { let i = Math.floor(Math.random() * TRACKS.length); if (i === trackIdx) i = (i + 1) % TRACKS.length; setTrackIdx(i); }
    else setTrackIdx(i => (i + 1) % TRACKS.length);
  }, [shuffle, trackIdx]);

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setProgress(p => { if (p >= track.duration) { if (repeat) return 0; next(); return 0; } return p + 1; });
      }, 1000);
    }
    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [playing, track.duration, repeat, next]);

  const pct = Math.round((progress / track.duration) * 100);

  return (
    <div className="flex h-full bg-[#1c1c1e]">
      {/* Playlist sidebar — macOS Music style */}
      <div className="flex w-52 shrink-0 flex-col border-r border-white/8 bg-[#161618]">
        <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2.5">
          <ListMusic className="h-4 w-4 text-accent-400" />
          <span className="flex-1 text-xs font-semibold text-white/60">Library</span>
          <span className="text-[10px] text-white/20">{TRACKS.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {TRACKS.map((t, i) => (
            <button key={t.id} onClick={() => { setTrackIdx(i); setProgress(0); setPlaying(true); }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                i === trackIdx ? 'bg-accent-500/15 border-l-2 border-accent-500' : 'hover:bg-white/4 border-l-2 border-transparent'
              }`}>
              <img src={t.cover} alt="" className="h-9 w-9 rounded-lg object-cover shadow-md" />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${i === trackIdx ? 'text-accent-300' : 'text-white/70'}`}>{t.title}</p>
                <p className="truncate text-[10px] text-white/30">{t.artist}</p>
              </div>
              {liked.has(t.id) && <Heart className="h-3 w-3 shrink-0 text-rose-400 fill-rose-400" />}
            </button>
          ))}
        </div>
      </div>

      {/* Now playing */}
      <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden p-6">
        {/* Blurred album art background */}
        <div className="absolute inset-0 opacity-20 blur-3xl scale-110"
          style={{ backgroundImage: `url(${track.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1c1c1e]" />

        <div className="relative z-10 flex w-full flex-col items-center gap-5 flex-1 justify-center">
          {/* Album art */}
          <div className="relative">
            <div className={`absolute -inset-4 rounded-3xl blur-2xl transition-opacity ${playing ? 'opacity-50' : 'opacity-20'}`}
              style={{ background: 'var(--accent-500)' }} />
            <img src={track.cover} alt={track.album}
              className={`relative h-48 w-48 rounded-2xl object-cover shadow-2xl transition-all duration-500 ${playing ? 'scale-100' : 'scale-95 brightness-75'}`} />
          </div>

          {/* Track info + like */}
          <div className="flex w-full max-w-xs items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-white">{track.title}</h3>
              <p className="text-xs text-white/40">{track.artist} · {track.album}</p>
            </div>
            <button onClick={() => setLiked(prev => { const n = new Set(prev); n.has(track.id) ? n.delete(track.id) : n.add(track.id); return n; })}
              className="mt-0.5 transition hover:scale-110">
              <Heart className={`h-5 w-5 transition ${liked.has(track.id) ? 'fill-rose-400 text-rose-400' : 'text-white/20 hover:text-white/40'}`} />
            </button>
          </div>

          {/* Progress */}
          <div className="w-full max-w-xs">
            <div className="relative h-1 overflow-hidden rounded-full bg-white/8 cursor-pointer" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setProgress(Math.round(((e.clientX - rect.left) / rect.width) * track.duration));
            }}>
              <div className="h-full rounded-full bg-accent-500 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/25">
              <span>{fmtTime(progress)}</span><span>-{fmtTime(track.duration - progress)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => setShuffle(v => !v)} className={`transition ${shuffle ? 'text-accent-400' : 'text-white/25 hover:text-white/50'}`}>
              <Shuffle className="h-4 w-4" />
            </button>
            <button onClick={() => { setProgress(0); setTrackIdx(i => (i - 1 + TRACKS.length) % TRACKS.length); }} className="text-white/60 hover:text-white transition">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={() => setPlaying(v => !v)}
              className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))', boxShadow: '0 6px 24px color-mix(in srgb, var(--accent-500) 50%, transparent)' }}>
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <button onClick={next} className="text-white/60 hover:text-white transition">
              <SkipForward className="h-5 w-5" />
            </button>
            <button onClick={() => setRepeat(v => !v)} className={`transition ${repeat ? 'text-accent-400' : 'text-white/25 hover:text-white/50'}`}>
              <Repeat className="h-4 w-4" />
            </button>
          </div>

          {/* Volume */}
          <div className="flex w-full max-w-xs items-center gap-2">
            <button onClick={() => setMuted(v => !v)} className="text-white/25 hover:text-white/50 transition">
              {muted || volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>
            <div className="relative flex-1 h-1 rounded-full bg-white/8 cursor-pointer" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              setVolume(Math.round(((e.clientX - rect.left) / rect.width) * 100));
              setMuted(false);
            }}>
              <div className="h-full rounded-full bg-white/40 transition-all" style={{ width: `${muted ? 0 : volume}%` }} />
            </div>
            <span className="w-7 text-right text-[10px] tabular-nums text-white/20">{muted ? 0 : volume}</span>
          </div>
        </div>

        {/* Equalizer bars */}
        {playing && (
          <div className="absolute right-3 top-3 flex items-end gap-0.5 z-10">
            {[0,1,2,3].map(i => (
              <div key={i} className="w-1 rounded-full bg-accent-400/60"
                style={{ height: '12px', animation: `eqBar 0.6s ease-in-out ${i * 0.15}s infinite alternate` }} />
            ))}
          </div>
        )}
      </div>

      <style>{`@keyframes eqBar { 0% { height: 4px; } 100% { height: 18px; } }`}</style>
    </div>
  );
}

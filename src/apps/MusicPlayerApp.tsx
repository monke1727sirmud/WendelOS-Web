import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, Music, ListMusic,
} from 'lucide-react';

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
}

const TRACKS: Track[] = [
  {
    id: 1,
    title: 'Midnight Protocol',
    artist: 'Neon Cipher',
    album: 'Terminal Velocity',
    duration: 214,
    cover: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 2,
    title: 'Root Access',
    artist: 'The Sudoers',
    album: 'Privilege Escalation',
    duration: 187,
    cover: 'https://images.pexels.com/photos/1370549/pexels-photo-1370549.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 3,
    title: 'Kernel Panic',
    artist: 'OOM Killer',
    album: 'Segmentation Fault',
    duration: 245,
    cover: 'https://images.pexels.com/photos/1611548/pexels-photo-1611548.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 4,
    title: 'Tuxedo Junction',
    artist: 'Penguin Quartet',
    album: 'Ice Cold Jazz',
    duration: 198,
    cover: 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 5,
    title: 'Daemon Dance',
    artist: 'Fork Bomb',
    album: 'Process Tree',
    duration: 172,
    cover: 'https://images.pexels.com/photos/1530028/pexels-photo-1530028.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
  {
    id: 6,
    title: 'Inotify',
    artist: 'File Watchers',
    album: 'Event Loop',
    duration: 233,
    cover: 'https://images.pexels.com/photos/1402754/pexels-photo-1402754.jpeg?auto=compress&cs=tinysrgb&w=400',
  },
];

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

export default function MusicPlayerApp() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const intervalRef = useRef<number | null>(null);

  const track = TRACKS[trackIdx];

  const next = useCallback(() => {
    setProgress(0);
    if (shuffle) {
      let idx = Math.floor(Math.random() * TRACKS.length);
      if (idx === trackIdx) idx = (idx + 1) % TRACKS.length;
      setTrackIdx(idx);
    } else {
      setTrackIdx((i) => (i + 1) % TRACKS.length);
    }
  }, [shuffle, trackIdx]);

  const prev = useCallback(() => {
    setProgress(0);
    setTrackIdx((i) => (i - 1 + TRACKS.length) % TRACKS.length);
  }, []);

  useEffect(() => {
    if (playing) {
      intervalRef.current = window.setInterval(() => {
        setProgress((p) => {
          if (p >= track.duration) {
            if (repeat) return 0;
            next();
            return 0;
          }
          return p + 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
  }, [playing, track.duration, repeat, next]);

  const togglePlay = () => setPlaying((v) => !v);

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    setProgress(Number(e.target.value));
  };

  const pct = (progress / track.duration) * 100;

  return (
    <div className="flex h-full bg-slate-900">
      {/* Playlist */}
      <div className="hidden w-56 shrink-0 flex-col border-r border-white/10 bg-slate-800/30 sm:flex">
        <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2.5">
          <ListMusic className="h-4 w-4 text-accent-400" />
          <span className="text-xs font-semibold text-white">Playlist</span>
          <span className="ml-auto text-[10px] text-slate-500">{TRACKS.length} tracks</span>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {TRACKS.map((t, i) => (
            <button
              key={t.id}
              onClick={() => {
                setTrackIdx(i);
                setProgress(0);
                setPlaying(true);
              }}
              className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
                i === trackIdx
                  ? 'bg-accent-500/20 border-l-2 border-accent-500'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
            >
              <img
                src={t.cover}
                alt=""
                className="h-9 w-9 rounded-md object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className={`truncate text-xs font-medium ${i === trackIdx ? 'text-accent-300' : 'text-slate-300'}`}>
                  {t.title}
                </p>
                <p className="truncate text-[10px] text-slate-500">{t.artist}</p>
              </div>
              <span className="text-[10px] tabular-nums text-slate-600">{fmtTime(t.duration)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Now playing */}
      <div className="flex flex-1 flex-col items-center justify-center p-6">
        {/* Album art */}
        <div className="relative mb-5">
          <div
            className={`absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent-500/40 to-violet-500/30 blur-xl transition-opacity ${
              playing ? 'opacity-100' : 'opacity-30'
            }`}
          />
          <img
            src={track.cover}
            alt={track.album}
            className={`relative h-44 w-44 rounded-2xl object-cover shadow-2xl transition-transform duration-500 ${
              playing ? 'scale-100' : 'scale-95'
            }`}
          />
        </div>

        {/* Track info */}
        <h3 className="text-base font-semibold text-white">{track.title}</h3>
        <p className="mt-0.5 text-xs text-slate-400">{track.artist} - {track.album}</p>

        {/* Progress bar */}
        <div className="mt-5 w-full max-w-xs">
          <input
            type="range"
            min={0}
            max={track.duration}
            value={progress}
            onChange={handleSeek}
            className="w-full accent-accent-500"
            style={{
              background: `linear-gradient(to right, var(--accent-500) ${pct}%, rgba(255,255,255,0.1) ${pct}%)`,
              borderRadius: '4px',
              height: '4px',
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
          <div className="mt-1 flex justify-between text-[10px] tabular-nums text-slate-500">
            <span>{fmtTime(progress)}</span>
            <span>{fmtTime(track.duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={() => setShuffle((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              shuffle ? 'text-accent-400 bg-accent-500/15' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Shuffle className="h-4 w-4" />
          </button>
          <button
            onClick={prev}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:text-white"
          >
            <SkipBack className="h-5 w-5" />
          </button>
          <button
            onClick={togglePlay}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 transition hover:bg-accent-600"
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
          </button>
          <button
            onClick={next}
            className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-300 transition hover:text-white"
          >
            <SkipForward className="h-5 w-5" />
          </button>
          <button
            onClick={() => setRepeat((v) => !v)}
            className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
              repeat ? 'text-accent-400 bg-accent-500/15' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Repeat className="h-4 w-4" />
          </button>
        </div>

        {/* Volume */}
        <div className="mt-5 flex w-full max-w-xs items-center gap-2">
          <Volume2 className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="range"
            min={0}
            max={100}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            className="w-full accent-accent-500"
            style={{
              background: `linear-gradient(to right, var(--accent-500) ${volume}%, rgba(255,255,255,0.1) ${volume}%)`,
              borderRadius: '4px',
              height: '4px',
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
          <span className="w-8 text-right text-[10px] tabular-nums text-slate-500">{volume}</span>
        </div>
      </div>

      {/* Mini equalizer indicator */}
      {playing && (
        <div className="absolute right-3 top-3 flex items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1 rounded-full bg-accent-400"
              style={{
                height: '12px',
                animation: `eqBar 0.6s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
      {!playing && (
        <div className="absolute right-3 top-3 flex items-end gap-0.5">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-1.5 w-1 rounded-full bg-slate-600" style={{ marginBottom: '10.5px' }} />
          ))}
        </div>
      )}
      <style>{`
        @keyframes eqBar {
          0% { height: 4px; }
          100% { height: 16px; }
        }
      `}</style>
      <Music className="sr-only" />
    </div>
  );
}

import { useState, useEffect, useRef, useCallback, type ReactNode } from 'react';
import {
  Play, Pause, SkipForward, SkipBack, Shuffle, Repeat,
  Volume2, VolumeX, ListMusic, Heart, Search, Loader2, X, Globe,
} from 'lucide-react';
import { SynthPlayer } from '../lib/synthAudio';

interface Track {
  id: number;
  title: string;
  artist: string;
  album: string;
  duration: number;
  cover: string;
  streamUrl?: string;
  source: 'synth' | 'remote';
}

const TRACKS: Track[] = [
  { id: 1, title: 'Midnight Protocol',  artist: 'Neon Cipher',     album: 'Terminal Velocity',    duration: 214, cover: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
  { id: 2, title: 'Root Access',        artist: 'The Sudoers',     album: 'Privilege Escalation', duration: 187, cover: 'https://images.pexels.com/photos/1370549/pexels-photo-1370549.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
  { id: 3, title: 'Kernel Panic',       artist: 'OOM Killer',      album: 'Segmentation Fault',   duration: 245, cover: 'https://images.pexels.com/photos/1611548/pexels-photo-1611548.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
  { id: 4, title: 'Tuxedo Junction',    artist: 'Penguin Quartet', album: 'Ice Cold Jazz',        duration: 198, cover: 'https://images.pexels.com/photos/1389429/pexels-photo-1389429.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
  { id: 5, title: 'Daemon Dance',       artist: 'Fork Bomb',       album: 'Process Tree',         duration: 172, cover: 'https://images.pexels.com/photos/1530028/pexels-photo-1530028.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
  { id: 6, title: 'Inotify',            artist: 'File Watchers',  album: 'Event Loop',           duration: 233, cover: 'https://images.pexels.com/photos/1402754/pexels-photo-1402754.jpeg?auto=compress&cs=tinysrgb&w=400', source: 'synth' },
];

interface AudiusTrack {
  id: string;
  title: string;
  user: { name: string };
  genre?: string;
  duration: number;
  artwork?: { '150x150'?: string; '480x480'?: string };
  downloadable?: boolean;
}

const AUDIUS_APP_NAME = 'WendelOS';

function fmtTime(s: number) {
  const m = Math.floor(s / 60);
  return `${m}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
}

export default function MusicPlayerApp() {
  const [trackIdx, setTrackIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(75);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [liked, setLiked] = useState<Set<number>>(new Set());
  const [muted, setMuted] = useState(false);

  // Search state
  const [view, setView] = useState<'library' | 'search'>('library');
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [remoteLibrary, setRemoteLibrary] = useState<Track[]>([]);

  const intervalRef = useRef<number | null>(null);
  const synthRef = useRef<SynthPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const searchTimerRef = useRef<number | null>(null);
  const audiusHostRef = useRef<string | null>(null);

  const allTracks = [...TRACKS, ...remoteLibrary];
  const track = allTracks[trackIdx] ?? TRACKS[0];

  // Fetch an Audius host on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('https://api.audius.co/');
        const data = await res.json() as { data: string[] };
        if (data.data && data.data.length > 0) {
          audiusHostRef.current = data.data[0];
        }
      } catch {
        // Fallback to a known host
        audiusHostRef.current = 'https://discoveryprovider.audius.co';
      }
    })();
  }, []);

  useEffect(() => {
    synthRef.current = new SynthPlayer();
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';

    const audio = audioRef.current;
    const onTimeUpdate = () => {
      if (audio.duration && isFinite(audio.duration) && audio.duration > 0) {
        setProgress(Math.floor(audio.currentTime));
      }
    };
    const onEnded = () => {
      if (repeat) {
        audio.currentTime = 0;
        void audio.play().catch(() => {});
      } else {
        setPlaying(false);
        setProgress(0);
        setTrackIdx(i => (i + 1) % allTracks.length);
      }
    };
    const onError = () => setPlaying(false);

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('error', onError);

    return () => {
      synthRef.current?.dispose();
      synthRef.current = null;
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('error', onError);
      audio.pause();
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    synthRef.current?.setVolume(volume / 100);
    if (audioRef.current) audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    synthRef.current?.setMuted(muted);
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  const stopAllAudio = useCallback(() => {
    synthRef.current?.pause();
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
  }, []);

  const next = useCallback(() => {
    setProgress(0);
    if (shuffle) {
      let i = Math.floor(Math.random() * allTracks.length);
      if (i === trackIdx) i = (i + 1) % allTracks.length;
      setTrackIdx(i);
    } else {
      setTrackIdx(i => (i + 1) % allTracks.length);
    }
  }, [shuffle, trackIdx, allTracks.length]);

  useEffect(() => {
    if (!playing) { stopAllAudio(); return; }

    if (track.source === 'remote' && track.streamUrl && audioRef.current) {
      synthRef.current?.pause();
      audioRef.current.src = track.streamUrl;
      void audioRef.current.play().catch(() => setPlaying(false));
      // Use interval as fallback for progress if duration metadata is slow
      intervalRef.current = window.setInterval(() => {
        const a = audioRef.current;
        if (a && (!a.duration || !isFinite(a.duration))) {
          setProgress(p => p + 1);
        }
      }, 1000);
    } else {
      if (audioRef.current) audioRef.current.pause();
      synthRef.current?.play(track.id);
      intervalRef.current = window.setInterval(() => {
        setProgress(p => {
          if (p >= track.duration) { if (repeat) return 0; next(); return 0; }
          return p + 1;
        });
      }, 1000);
    }

    return () => { if (intervalRef.current) window.clearInterval(intervalRef.current); };
  }, [playing, track.id, track.duration, track.streamUrl, track.source, repeat, next, stopAllAudio]);

  // Debounced search against Audius API (free, no key, full-length streams)
  useEffect(() => {
    if (view !== 'search') return;
    if (!query.trim()) { setSearchResults([]); setSearchError(null); return; }

    setSearching(true);
    setSearchError(null);
    if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current);
    searchTimerRef.current = window.setTimeout(async () => {
      const host = audiusHostRef.current ?? 'https://discoveryprovider.audius.co';
      try {
        const res = await fetch(
          `${host}/v1/tracks/search?query=${encodeURIComponent(query)}&app_name=${AUDIUS_APP_NAME}&limit=25`
        );
        if (!res.ok) throw new Error('Search failed');
        const data = await res.json() as { data?: AudiusTrack[] };
        if (!data.data) { setSearchResults([]); return; }

        const mapped: Track[] = data.data
          .filter(t => !t.downloadable || t.downloadable)
          .map(t => ({
            id: parseInt(t.id, 36) || Math.floor(Math.random() * 1e9),
            title: t.title,
            artist: t.user?.name ?? 'Unknown Artist',
            album: t.genre ? `${t.genre}` : 'Audius',
            duration: Math.round((t.duration || 0) / 1000),
            cover: t.artwork?.['480x480'] ?? t.artwork?.['150x150'] ?? '',
            streamUrl: `${host}/v1/tracks/${t.id}/stream?app_name=${AUDIUS_APP_NAME}`,
            source: 'remote' as const,
          }));
        setSearchResults(mapped);
      } catch {
        setSearchError('Could not reach the music database. Check your connection and try again.');
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 500);

    return () => { if (searchTimerRef.current) window.clearTimeout(searchTimerRef.current); };
  }, [query, view]);

  const playTrack = useCallback((_t: Track, idx: number) => {
    stopAllAudio();
    setTrackIdx(idx);
    setProgress(0);
    setPlaying(true);
  }, [stopAllAudio]);

  const addToLibrary = useCallback((t: Track) => {
    setRemoteLibrary(prev => {
      if (prev.some(x => x.id === t.id)) return prev;
      return [...prev, t];
    });
  }, []);

  const pct = Math.round((progress / (track.duration || 1)) * 100);

  const renderTrackList = (tracks: Track[], startIdx: number): ReactNode => (
    <div className="flex-1 overflow-y-auto scrollbar-thin">
      {tracks.length === 0 && !searching && !searchError && view === 'search' && query.trim() && (
        <p className="px-3 py-8 text-center text-xs text-white/30">No results found.</p>
      )}
      {tracks.map((t, i) => {
        const globalIdx = startIdx + i;
        const isActive = globalIdx === trackIdx;
        return (
          <button
            key={`${t.id}-${i}`}
            onClick={() => playTrack(t, globalIdx)}
            className={`flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition ${
              isActive ? 'bg-accent-500/15 border-l-2 border-accent-500' : 'hover:bg-white/4 border-l-2 border-transparent'
            }`}
          >
            {t.cover ? (
              <img src={t.cover} alt="" className="h-9 w-9 rounded-lg object-cover shadow-md" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
                <Globe className="h-4 w-4 text-accent-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className={`truncate text-xs font-medium ${isActive ? 'text-accent-300' : 'text-white/70'}`}>{t.title}</p>
              <p className="truncate text-[10px] text-white/30">{t.artist}</p>
            </div>
            {t.source === 'remote' && (
              <span className="flex items-center gap-0.5 text-[8px] text-emerald-400/60">
                <Globe className="h-2.5 w-2.5" /> Full
              </span>
            )}
            {liked.has(t.id) && <Heart className="h-3 w-3 shrink-0 text-rose-400 fill-rose-400" />}
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="flex h-full bg-[#1c1c1e]">
      {/* Playlist sidebar */}
      <div className="flex w-56 shrink-0 flex-col border-r border-white/8 bg-[#161618]">
        {/* Tabs */}
        <div className="flex border-b border-white/8">
          <button
            onClick={() => setView('library')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
              view === 'library' ? 'text-accent-300 bg-accent-500/10' : 'text-white/30 hover:text-white/50 hover:bg-white/3'
            }`}
          >
            <ListMusic className="h-3.5 w-3.5" /> Library
          </button>
          <button
            onClick={() => setView('search')}
            className={`flex flex-1 items-center justify-center gap-1.5 py-2.5 text-xs font-semibold transition ${
              view === 'search' ? 'text-accent-300 bg-accent-500/10' : 'text-white/30 hover:text-white/50 hover:bg-white/3'
            }`}
          >
            <Search className="h-3.5 w-3.5" /> Search
          </button>
        </div>

        {view === 'library' ? (
          <>
            <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
              <ListMusic className="h-4 w-4 text-accent-400" />
              <span className="flex-1 text-xs font-semibold text-white/60">All Tracks</span>
              <span className="text-[10px] text-white/20">{allTracks.length}</span>
            </div>
            {renderTrackList(allTracks, 0)}
          </>
        ) : (
          <>
            {/* Search bar */}
            <div className="border-b border-white/8 p-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/30" />
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search artists, songs..."
                  autoFocus
                  className="w-full rounded-lg border border-white/8 bg-white/5 py-2 pl-8 pr-8 text-xs text-white placeholder-white/25 outline-none focus:border-accent-500/50"
                />
                {query && (
                  <button
                    onClick={() => setQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <p className="mt-2 flex items-center gap-1 text-[9px] text-white/20">
                <Globe className="h-2.5 w-2.5" /> Powered by Audius — full-length tracks
              </p>
            </div>

            {searching && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-accent-400" />
              </div>
            )}

            {searchError && (
              <div className="px-3 py-6 text-center">
                <p className="text-xs text-red-400/70">{searchError}</p>
                <button
                  onClick={() => setQuery(query + ' ')}
                  className="mt-2 text-[10px] text-accent-400 hover:underline"
                >
                  Retry
                </button>
              </div>
            )}

            {!searching && !searchError && searchResults.length > 0 && (
              <>
                <div className="flex items-center gap-2 border-b border-white/8 px-3 py-2">
                  <span className="flex-1 text-xs font-semibold text-white/60">Results ({searchResults.length})</span>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {searchResults.map((t, i) => {
                    const inLib = remoteLibrary.some(x => x.id === t.id);
                    void i;
                    return (
                      <div
                        key={t.id}
                        className="group flex w-full items-center gap-2.5 px-3 py-2.5 text-left hover:bg-white/4 border-l-2 border-transparent"
                      >
                        {t.cover ? (
                          <img src={t.cover} alt="" className="h-9 w-9 rounded-lg object-cover shadow-md" />
                        ) : (
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/15">
                            <Globe className="h-4 w-4 text-accent-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium text-white/70">{t.title}</p>
                          <p className="truncate text-[10px] text-white/30">{t.artist} · {t.album}</p>
                        </div>
                        <button
                          onClick={() => {
                            addToLibrary(t);
                            const newLib = [...remoteLibrary, t];
                            const newIdx = TRACKS.length + newLib.length - 1;
                            playTrack(t, newIdx);
                          }}
                          className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-500/15 text-accent-300 transition hover:bg-accent-500/25"
                          title="Add to library and play"
                        >
                          <Play className="h-3.5 w-3.5 ml-0.5" />
                        </button>
                        <button
                          onClick={() => addToLibrary(t)}
                          disabled={inLib}
                          className={`flex h-7 w-7 items-center justify-center rounded-lg transition ${
                            inLib
                              ? 'bg-emerald-500/10 text-emerald-400/40 cursor-default'
                              : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white/70'
                          }`}
                          title={inLib ? 'Already in your library' : 'Add to library'}
                        >
                          {inLib ? <Heart className="h-3.5 w-3.5 fill-emerald-400/40" /> : <Heart className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </>
            )}

            {!searching && !searchError && !query.trim() && (
              <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
                <Search className="h-8 w-8 text-white/10 mb-3" />
                <p className="text-xs text-white/30">Search for any song or artist</p>
                <p className="mt-1 text-[10px] text-white/15">Full-length tracks from Audius</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Now playing */}
      <div className="relative flex flex-1 flex-col items-center justify-between overflow-hidden p-6">
        <div className="absolute inset-0 opacity-20 blur-3xl scale-110"
          style={track.cover ? { backgroundImage: `url(${track.cover})`, backgroundSize: 'cover', backgroundPosition: 'center' } : { background: 'var(--accent-500)' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1c1c1e]" />

        <div className="relative z-10 flex w-full flex-col items-center gap-5 flex-1 justify-center">
          {/* Album art */}
          <div className="relative">
            <div className={`absolute -inset-4 rounded-3xl blur-2xl transition-opacity ${playing ? 'opacity-50' : 'opacity-20'}`}
              style={{ background: 'var(--accent-500)' }} />
            {track.cover ? (
              <img src={track.cover} alt={track.album}
                className={`relative h-48 w-48 rounded-2xl object-cover shadow-2xl transition-all duration-500 ${playing ? 'scale-100' : 'scale-95 brightness-75'}`} />
            ) : (
              <div className={`relative flex h-48 w-48 items-center justify-center rounded-2xl shadow-2xl transition-all duration-500 ${playing ? 'scale-100' : 'scale-95 brightness-75'}`}
                style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-700))' }}>
                <Globe className="h-16 w-16 text-white/30" />
              </div>
            )}
          </div>

          {/* Track info + like */}
          <div className="flex w-full max-w-xs items-start justify-between">
            <div className="min-w-0">
              <h3 className="truncate text-base font-semibold text-white">{track.title}</h3>
              <p className="truncate text-xs text-white/40">{track.artist} · {track.album}</p>
              {track.source === 'remote' && (
                <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] text-emerald-400">
                  <Globe className="h-2.5 w-2.5" /> Streaming from Audius
                </span>
              )}
            </div>
            <button onClick={() => setLiked(prev => { const n = new Set(prev); if (n.has(track.id)) n.delete(track.id); else n.add(track.id); return n; })}
              className="mt-0.5 shrink-0 transition hover:scale-110">
              <Heart className={`h-5 w-5 transition ${liked.has(track.id) ? 'fill-rose-400 text-rose-400' : 'text-white/20 hover:text-white/40'}`} />
            </button>
          </div>

          {/* Progress */}
          <div className="w-full max-w-xs">
            <div className="relative h-1 overflow-hidden rounded-full bg-white/8 cursor-pointer" onClick={e => {
              const rect = e.currentTarget.getBoundingClientRect();
              const newTime = Math.round(((e.clientX - rect.left) / rect.width) * track.duration);
              setProgress(newTime);
              if (track.source === 'remote' && audioRef.current && audioRef.current.duration && isFinite(audioRef.current.duration)) {
                audioRef.current.currentTime = (newTime / track.duration) * audioRef.current.duration;
              }
            }}>
              <div className="h-full rounded-full bg-accent-500 transition-all duration-300" style={{ width: `${pct}%` }} />
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] tabular-nums text-white/25">
              <span>{fmtTime(progress)}</span><span>-{fmtTime(Math.max(0, track.duration - progress))}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => setShuffle(v => !v)} className={`transition ${shuffle ? 'text-accent-400' : 'text-white/25 hover:text-white/50'}`}>
              <Shuffle className="h-4 w-4" />
            </button>
            <button onClick={() => {
              setProgress(0);
              setTrackIdx(i => {
                const ni = (i - 1 + allTracks.length) % allTracks.length;
                return ni;
              });
            }} className="text-white/60 hover:text-white transition">
              <SkipBack className="h-5 w-5" />
            </button>
            <button onClick={() => setPlaying(v => !v)}
              className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-xl transition hover:scale-105 active:scale-95"
              style={{ background: 'linear-gradient(135deg, var(--accent-400), var(--accent-600))', boxShadow: '0 6px 24px color-mix(in srgb, var(--accent-500) 50%, transparent)' }}>
              {playing ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
            </button>
            <button onClick={() => { next(); }} className="text-white/60 hover:text-white transition">
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

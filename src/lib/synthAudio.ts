// Web Audio synth engine — generates synthwave-style loops so the OS can play
// real sound without external audio files. Each track id maps to a distinct pattern.

const NOTE: Record<string, number> = {
  Bb2: 116.54, C3: 130.81, D3: 146.83, Eb3: 155.56, E3: 164.81, F3: 174.61,
  G3: 196.00, Ab3: 207.65, A3: 220.00, Bb3: 233.08, B3: 246.94,
  C4: 261.63, D4: 293.66, Eb4: 311.13, E4: 329.63, F4: 349.23, G4: 392.00,
  Ab4: 415.30, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, Eb5: 622.25, E5: 659.25, F5: 698.46, G5: 783.99,
  A5: 880.00, B5: 987.77, C6: 1046.50, D6: 1174.66,
};

type Step = number; // frequency in Hz; 0 means rest

interface Pattern {
  bpm: number;
  bass: Step[];
  lead: Step[];
  pad: Step[];
}

const n = (name: string) => NOTE[name];

const PATTERNS: Record<number, Pattern> = {
  1: { // Midnight Protocol — C minor
    bpm: 120,
    bass: [n('C3'), n('C3'), n('G3'), n('C3'), n('Ab3'), n('Ab3'), n('Eb3'), n('G3')],
    lead: [n('Eb5'), 0, n('G5'), n('C6'), n('Ab4'), 0, n('Eb5'), n('G5')],
    pad:  [n('C4'), n('Eb4'), n('G4'), n('C5'), n('Ab3'), n('C4'), n('Eb4'), n('G4')],
  },
  2: { // Root Access — A minor
    bpm: 128,
    bass: [n('A3'), n('A3'), n('E3'), n('A3'), n('F3'), n('F3'), n('C3'), n('E3')],
    lead: [n('A4'), 0, n('C5'), n('E5'), n('A5'), 0, n('E5'), n('C5')],
    pad:  [n('A3'), n('C4'), n('E4'), n('A4'), n('F3'), n('A3'), n('C4'), n('E4')],
  },
  3: { // Kernel Panic — E minor, driving
    bpm: 140,
    bass: [n('E3'), n('E3'), n('B3'), n('E3'), n('D3'), n('D3'), n('A3'), n('B3')],
    lead: [n('B4'), 0, n('E5'), n('B4'), n('G5'), 0, n('A5'), n('B5')],
    pad:  [n('E3'), n('G3'), n('B3'), n('E4'), n('D3'), n('E3'), n('G3'), n('B3')],
  },
  4: { // Tuxedo Junction — F major, jazzy
    bpm: 100,
    bass: [n('F3'), n('F3'), n('C3'), n('F3'), n('Bb2'), n('Bb2'), n('F3'), n('C3')],
    lead: [n('A4'), n('F5'), n('A4'), n('C5'), n('A4'), 0, n('G5'), n('A4')],
    pad:  [n('F3'), n('A3'), n('C4'), n('F4'), n('Bb2'), n('D3'), n('F3'), n('A3')],
  },
  5: { // Daemon Dance — D minor
    bpm: 135,
    bass: [n('D3'), n('D3'), n('A3'), n('D3'), n('C3'), n('C3'), n('G3'), n('A3')],
    lead: [n('D5'), 0, n('F5'), n('A5'), n('D6'), 0, n('A5'), n('F5')],
    pad:  [n('D3'), n('F3'), n('A3'), n('D4'), n('C3'), n('D3'), n('F3'), n('A3')],
  },
  6: { // Inotify — G major
    bpm: 110,
    bass: [n('G3'), n('G3'), n('D3'), n('G3'), n('E3'), n('E3'), n('B3'), n('D3')],
    lead: [n('D5'), 0, n('G5'), n('B5'), n('D5'), 0, n('B4'), n('D5')],
    pad:  [n('G3'), n('B3'), n('D4'), n('G4'), n('E3'), n('G3'), n('B3'), n('D4')],
  },
};

export class SynthPlayer {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private currentTrack = 0;
  private isPlaying = false;
  private step = 0;
  private nextNoteTime = 0;
  private timer: number | null = null;
  private volume = 0.75;
  private muted = false;

  private ensureContext() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.filter = this.ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 3200;
      this.master.gain.value = this.muted ? 0 : this.volume;
      this.master.connect(this.filter);
      this.filter.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.master && this.ctx && !this.muted) {
      this.master.gain.setTargetAtTime(v, this.ctx.currentTime, 0.01);
    }
  }

  setMuted(m: boolean) {
    this.muted = m;
    if (this.master && this.ctx) {
      this.master.gain.setTargetAtTime(m ? 0 : this.volume, this.ctx.currentTime, 0.01);
    }
  }

  play(trackId: number) {
    this.ensureContext();
    if (this.currentTrack !== trackId || !this.isPlaying) {
      this.currentTrack = trackId;
      this.step = 0;
      if (this.ctx) this.nextNoteTime = this.ctx.currentTime + 0.06;
    }
    this.isPlaying = true;
    this.scheduler();
  }

  pause() {
    this.isPlaying = false;
    if (this.timer) { window.clearTimeout(this.timer); this.timer = null; }
  }

  dispose() {
    this.pause();
    if (this.ctx) void this.ctx.close();
    this.ctx = null;
    this.master = null;
    this.filter = null;
  }

  private scheduler = () => {
    if (!this.ctx || !this.isPlaying) return;
    const pattern = PATTERNS[this.currentTrack] ?? PATTERNS[1];
    const secPerStep = 60 / pattern.bpm / 2; // eighth notes
    while (this.nextNoteTime < this.ctx.currentTime + 0.12) {
      this.scheduleStep(pattern, this.step, this.nextNoteTime);
      this.nextNoteTime += secPerStep;
      this.step = (this.step + 1) % pattern.bass.length;
    }
    this.timer = window.setTimeout(this.scheduler, 25);
  };

  private scheduleStep(pattern: Pattern, step: number, time: number) {
    const bass = pattern.bass[step];
    if (bass) this.playNote(bass, time, 'sawtooth', 0.16, 0.42);
    const lead = pattern.lead[step];
    if (lead) this.playNote(lead, time, 'square', 0.07, 0.28);
    const pad = pattern.pad[step];
    if (pad) this.playNote(pad, time, 'sine', 0.05, 0.55);
  }

  private playNote(freq: number, time: number, type: OscillatorType, gain: number, dur: number) {
    if (!this.ctx || !this.master) return;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    env.gain.setValueAtTime(0, time);
    env.gain.linearRampToValueAtTime(gain, time + 0.012);
    env.gain.exponentialRampToValueAtTime(0.0008, time + dur);
    osc.connect(env);
    env.connect(this.master);
    osc.start(time);
    osc.stop(time + dur + 0.05);
  }
}

// Short UI sound effects via Web Audio API — no audio files needed.
// Shared singleton so any component can fire a blip without plumbing.

type SfxName = 'click' | 'open' | 'close' | 'toggle' | 'error' | 'pop' | 'delete' | 'success';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let enabled = true;
let volume = 0.5;

function ensure(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = enabled ? volume : 0;
    master.connect(ctx.destination);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function blip(freq: number, time: number, type: OscillatorType, gain: number, dur: number) {
  const c = ensure();
  if (!c || !master) return;
  const osc = c.createOscillator();
  const env = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, time);
  env.gain.setValueAtTime(0, time);
  env.gain.linearRampToValueAtTime(gain, time + 0.008);
  env.gain.exponentialRampToValueAtTime(0.0008, time + dur);
  osc.connect(env);
  env.connect(master);
  osc.start(time);
  osc.stop(time + dur + 0.04);
}

const FX: Record<SfxName, (c: AudioContext) => void> = {
  click:   c => blip(880, c.currentTime, 'square', 0.05, 0.06),
  toggle:  c => blip(660, c.currentTime, 'triangle', 0.06, 0.08),
  pop:     c => blip(1200, c.currentTime, 'sine', 0.07, 0.05),
  open:    c => { blip(523, c.currentTime, 'sine', 0.06, 0.09); blip(784, c.currentTime + 0.06, 'sine', 0.05, 0.1); },
  close:   c => { blip(784, c.currentTime, 'sine', 0.05, 0.07); blip(392, c.currentTime + 0.05, 'sine', 0.05, 0.1); },
  delete:  c => { blip(440, c.currentTime, 'sawtooth', 0.06, 0.08); blip(220, c.currentTime + 0.06, 'sawtooth', 0.05, 0.12); },
  error:   c => { blip(200, c.currentTime, 'sawtooth', 0.07, 0.14); blip(180, c.currentTime + 0.1, 'sawtooth', 0.06, 0.16); },
  success: c => { blip(523, c.currentTime, 'sine', 0.06, 0.08); blip(659, c.currentTime + 0.07, 'sine', 0.06, 0.08); blip(784, c.currentTime + 0.14, 'sine', 0.06, 0.12); },
};

export function playSfx(name: SfxName) {
  const c = ensure();
  if (!c) return;
  FX[name]?.(c);
}

export function setSfxEnabled(v: boolean) {
  enabled = v;
  if (master && ctx) master.gain.setTargetAtTime(v ? volume : 0, ctx.currentTime, 0.01);
}

export function setSfxVolume(v: number) {
  volume = v;
  if (master && ctx && enabled) master.gain.setTargetAtTime(v, ctx.currentTime, 0.01);
}

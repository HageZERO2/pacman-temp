import type { Settings } from './storage';

export type SfxName =
  | 'pellet' | 'crystal' | 'eatEnemy' | 'death' | 'gift' | 'star' | 'extraLife'
  | 'levelUp' | 'gameOver' | 'click' | 'hover' | 'buy' | 'start' | 'denied';

export type Track = 'menu' | 'game';

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

interface Song {
  bpm: number;
  melody: (number | null)[];
  chords: number[][];
  bass: number[];
  shaker: boolean;
}

// Original compositions (G major, pentatonic-leaning), one chord per bar of 8 eighth notes.
const SONGS: Record<Track, Song> = {
  menu: {
    bpm: 92,
    melody: [
      74, null, 76, 74, 71, null, 67, null, 69, 71, 74, null, 71, null, null, null,
      76, null, 79, 76, 74, null, 71, null, 69, null, 71, 69, 67, null, null, null,
      71, null, 74, 71, 69, null, 64, null, 67, 69, 71, null, 74, null, 76, null,
      79, null, 76, 74, 71, null, 74, null, 69, null, 66, 69, 67, null, null, null,
    ],
    chords: [[67, 71, 74], [64, 67, 71], [60, 64, 67], [62, 66, 69], [64, 67, 71], [60, 64, 67], [60, 64, 67], [62, 66, 69]],
    bass: [43, 40, 36, 38, 40, 36, 36, 38],
    shaker: false,
  },
  game: {
    bpm: 128,
    melody: [
      67, 71, 74, 71, 76, null, 74, null, 72, 76, 79, 76, 74, null, 71, null,
      69, 72, 76, 72, 74, null, 71, 69, 67, null, 71, null, 69, null, null, null,
      67, 71, 74, 71, 79, null, 76, null, 72, 76, 81, 79, 76, null, 74, null,
      72, 71, 69, 72, 71, 69, 67, 66, 67, null, 74, null, 67, null, null, null,
    ],
    chords: [[67, 71, 74], [60, 64, 67], [60, 64, 69], [62, 66, 69], [67, 71, 74], [60, 64, 67], [62, 66, 69], [55, 62, 67]],
    bass: [43, 36, 45, 38, 43, 36, 38, 43],
    shaker: true,
  },
};

class AudioEngine {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private settings: Settings | null = null;
  private track: Track | null = null;
  private step = 0;
  private nextTime = 0;
  private timer: number | null = null;
  private ducked = false;
  private lastPellet = 0;
  private pelletFlip = false;

  get unlocked() {
    return this.ctx !== null && this.ctx.state === 'running';
  }

  /** Must be called from a user gesture; browsers block audio until then. */
  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.musicBus = this.ctx.createGain();
      this.sfxBus = this.ctx.createGain();
      this.musicBus.connect(this.master);
      this.sfxBus.connect(this.master);
      this.master.connect(this.ctx.destination);
      this.noise = this.ctx.createBuffer(1, this.ctx.sampleRate, this.ctx.sampleRate);
      const data = this.noise.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      this.applyVolumes();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
    if (this.track && this.timer === null) this.startScheduler();
  }

  applySettings(s: Settings) {
    this.settings = s;
    this.applyVolumes();
  }

  private applyVolumes() {
    if (!this.ctx || !this.settings) return;
    const s = this.settings;
    const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(s.muted ? 0 : s.master, t, 0.02);
    this.musicBus.gain.setTargetAtTime(s.music * 0.38 * (this.ducked ? 0.35 : 1), t, 0.05);
    this.sfxBus.gain.setTargetAtTime(s.sfx * 0.7, t, 0.02);
  }

  setDucked(ducked: boolean) {
    this.ducked = ducked;
    this.applyVolumes();
  }

  playMusic(track: Track) {
    if (this.track === track) return;
    this.track = track;
    this.step = 0;
    if (this.ctx) {
      this.nextTime = this.ctx.currentTime + 0.1;
      if (this.timer === null) this.startScheduler();
    }
  }

  stopMusic() {
    this.track = null;
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
  }

  private startScheduler() {
    if (!this.ctx) return;
    this.nextTime = Math.max(this.nextTime, this.ctx.currentTime + 0.05);
    this.timer = window.setInterval(() => this.schedule(), 40);
  }

  private schedule() {
    if (!this.ctx || !this.track) return;
    const song = SONGS[this.track];
    const eighth = 60 / song.bpm / 2;
    while (this.nextTime < this.ctx.currentTime + 0.2) {
      const t = this.nextTime;
      const i = this.step % song.melody.length;
      const bar = Math.floor(i / 8) % song.chords.length;
      const note = song.melody[i];
      if (note !== null) this.bell(this.musicBus, midi(note), t, 0.22, 1.1);
      if (i % 8 === 0) {
        song.chords[bar].forEach((n) => this.pad(midi(n - 12), t, eighth * 8));
        this.pluck(midi(song.bass[bar]), t, eighth * 3);
      }
      if (i % 8 === 4) this.pluck(midi(song.bass[bar] + 7), t, eighth * 2);
      if (song.shaker) this.shaker(t, i % 2 ? 0.05 : 0.025);
      this.nextTime += eighth;
      this.step++;
    }
  }

  private env(gain: GainNode, t: number, peak: number, attack: number, decay: number) {
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  }

  private osc(type: OscillatorType, freq: number, t: number, dur: number, peak: number, dest: AudioNode, attack = 0.005) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    this.env(g, t, peak, attack, dur);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + attack + dur + 0.05);
    return o;
  }

  private bell(dest: AudioNode, f: number, t: number, peak: number, dur: number) {
    this.osc('sine', f, t, dur, peak, dest);
    this.osc('sine', f * 3.01, t, dur * 0.25, peak * 0.25, dest);
    this.osc('triangle', f * 2, t, dur * 0.4, peak * 0.12, dest);
  }

  private pad(f: number, t: number, dur: number) {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 1100;
    filter.connect(this.musicBus);
    for (const detune of [-6, 6]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = f;
      o.detune.value = detune;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(0.035, t + dur * 0.3);
      g.gain.linearRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(filter);
      o.start(t);
      o.stop(t + dur + 0.05);
    }
  }

  private pluck(f: number, t: number, dur: number) {
    this.osc('triangle', f, t, dur, 0.16, this.musicBus);
  }

  private shaker(t: number, peak: number) {
    const ctx = this.ctx!;
    const src = ctx.createBufferSource();
    src.buffer = this.noise;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 7000;
    const g = ctx.createGain();
    this.env(g, t, peak, 0.003, 0.06);
    src.connect(hp).connect(g).connect(this.musicBus);
    src.start(t, Math.random() * 0.5);
    src.stop(t + 0.1);
  }

  private sweep(type: OscillatorType, from: number, to: number, t: number, dur: number, peak: number) {
    const o = this.osc(type, from, t, dur, peak, this.sfxBus);
    o.frequency.exponentialRampToValueAtTime(to, t + dur);
  }

  private arp(notes: number[], t: number, gap: number, peak = 0.3, dur = 0.5) {
    notes.forEach((n, i) => this.bell(this.sfxBus, midi(n), t + i * gap, peak, dur));
  }

  play(name: SfxName) {
    if (!this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime + 0.005;
    switch (name) {
      case 'pellet': {
        if (t - this.lastPellet < 0.05) return;
        this.lastPellet = t;
        this.pelletFlip = !this.pelletFlip;
        this.osc('triangle', this.pelletFlip ? 1318 : 1568, t, 0.07, 0.12, this.sfxBus);
        break;
      }
      case 'crystal':
        this.arp([72, 76, 79, 84, 88], t, 0.05, 0.25, 0.6);
        this.sweep('sawtooth', 200, 900, t, 0.3, 0.04);
        break;
      case 'eatEnemy':
        this.sweep('square', 300, 1400, t, 0.22, 0.08);
        this.bell(this.sfxBus, midi(88), t + 0.2, 0.25, 0.5);
        break;
      case 'death': {
        const o = this.osc('sawtooth', 700, t, 1.1, 0.12, this.sfxBus);
        o.frequency.exponentialRampToValueAtTime(80, t + 1.1);
        const lfo = this.ctx.createOscillator();
        const lg = this.ctx.createGain();
        lfo.frequency.value = 9;
        lg.gain.value = 40;
        lfo.connect(lg).connect(o.frequency);
        lfo.start(t);
        lfo.stop(t + 1.2);
        break;
      }
      case 'gift':
        this.arp([79, 83, 86, 91], t, 0.07, 0.3, 0.7);
        break;
      case 'star':
        this.arp([84, 88, 91, 96, 91, 96], t, 0.045, 0.22, 0.4);
        break;
      case 'extraLife':
        this.arp([67, 71, 74, 79, 83, 86], t, 0.08, 0.28, 0.6);
        break;
      case 'levelUp':
        this.arp([67, 71, 74, 79, 74, 79, 83, 86], t, 0.11, 0.3, 0.8);
        break;
      case 'gameOver':
        this.arp([74, 70, 67, 62], t, 0.28, 0.3, 1.0);
        break;
      case 'start':
        this.arp([67, 74, 71, 79, 76, 83], t, 0.12, 0.25, 0.5);
        break;
      case 'click':
        this.osc('sine', 880, t, 0.06, 0.18, this.sfxBus);
        this.osc('sine', 1320, t + 0.03, 0.05, 0.1, this.sfxBus);
        break;
      case 'hover':
        this.osc('sine', 1760, t, 0.035, 0.05, this.sfxBus);
        break;
      case 'buy':
        this.osc('square', 988, t, 0.08, 0.08, this.sfxBus);
        this.osc('square', 1319, t + 0.08, 0.35, 0.08, this.sfxBus);
        this.arp([84, 91], t + 0.08, 0.06, 0.2, 0.5);
        break;
      case 'denied':
        this.osc('square', 180, t, 0.12, 0.08, this.sfxBus);
        this.osc('square', 140, t + 0.12, 0.18, 0.08, this.sfxBus);
        break;
    }
  }
}

export const audio = new AudioEngine();

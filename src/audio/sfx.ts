import { asset } from "../asset";

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let bed: HTMLAudioElement | null = null;
let hiddenBound = false;

const getCtx = () => {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    applySfx();
    master.connect(ctx.destination);
  }
  return ctx;
};

export function unlockAudio() {
  const c = getCtx();
  if (c.state === "suspended") void c.resume();
  bindHide();
}

const bindHide = () => {
  if (hiddenBound) return;
  hiddenBound = true;
  document.addEventListener("visibilitychange", () => {
    if (!bed) return;
    if (document.hidden) bed.pause();
    else if (bedOn && bed.paused) void bed.play().catch(() => {});
  });
};

let bedOn = false;

const PREF_KEY = "artwave-audio-v1";
let musicVol = 0.72;
let sfxVol = 0.8;

const clamp = (n: number) => Math.min(1, Math.max(0, n));

const persistPrefs = () => {
  localStorage.setItem(PREF_KEY, JSON.stringify({ music: musicVol, sfx: sfxVol }));
};

const applyMusic = () => {
  if (bed) bed.volume = musicVol * 0.46;
};

const applySfx = () => {
  if (master) master.gain.value = 0.04 + sfxVol * 0.22;
};

const loadPrefs = () => {
  try {
    const raw = localStorage.getItem(PREF_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as { music?: number; sfx?: number };
    if (typeof parsed.music === "number") musicVol = clamp(parsed.music);
    if (typeof parsed.sfx === "number") sfxVol = clamp(parsed.sfx);
  } catch {
    /* keep defaults */
  }
};

loadPrefs();

export function getAudioPrefs() {
  return { music: musicVol, sfx: sfxVol };
}

export function setMusicVolume(value: number) {
  musicVol = clamp(value);
  persistPrefs();
  applyMusic();
}

export function setSfxVolume(value: number) {
  sfxVol = clamp(value);
  persistPrefs();
  applySfx();
}

const tone = (
  freq: number,
  dur: number,
  type: OscillatorType,
  gain: number,
  at = 0,
  slide?: number,
) => {
  const c = getCtx();
  if (!master || c.state !== "running") return;
  const t = c.currentTime + at;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(40, slide), t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain, t + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g);
  g.connect(master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
};

const noise = (dur: number, gain: number) => {
  const c = getCtx();
  if (!master || c.state !== "running") return;
  if (!noiseBuf) {
    const n = Math.floor(c.sampleRate * 0.2);
    noiseBuf = c.createBuffer(1, n, c.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  }
  const src = c.createBufferSource();
  const g = c.createGain();
  const t = c.currentTime;
  src.buffer = noiseBuf;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(g);
  g.connect(master);
  src.start(t);
};

export const sfx = {
  ui() {
    unlockAudio();
    tone(880, 0.05, "triangle", 0.06);
  },
  tap() {
    unlockAudio();
    tone(640, 0.04, "square", 0.04);
  },
  miss() {
    unlockAudio();
    tone(160, 0.1, "sine", 0.07, 0, 90);
  },
  match(impact = 1) {
    unlockAudio();
    tone(420 + impact * 70, 0.08, "triangle", 0.07);
  },
  cascade(depth: number) {
    unlockAudio();
    const n = Math.min(3, depth);
    for (let i = 0; i < n; i++) tone(520 + i * 90, 0.07, "triangle", 0.04, i * 0.05);
  },
  blast() {
    unlockAudio();
    noise(0.14, 0.09);
  },
  collect() {
    unlockAudio();
    tone(720, 0.07, "sine", 0.06);
  },
  perfect() {
    unlockAudio();
    tone(880, 0.08, "sine", 0.07);
    tone(1174, 0.1, "triangle", 0.04, 0.04);
  },
  row() {
    unlockAudio();
    tone(392, 0.1, "triangle", 0.06);
    tone(523, 0.12, "triangle", 0.05, 0.06);
  },
  hit() {
    unlockAudio();
    noise(0.08, 0.08);
  },
  booster() {
    unlockAudio();
    tone(360, 0.14, "sawtooth", 0.05, 0, 720);
  },
  win() {
    unlockAudio();
    [523, 659, 784].forEach((f, i) => tone(f, 0.18, "triangle", 0.07, i * 0.07));
  },
  lose() {
    unlockAudio();
    tone(220, 0.18, "sine", 0.07, 0, 140);
  },
};

const BEDS = [asset("audio/bed-b.mp3"), asset("audio/bed-a.mp3")];
let bedIndex = 0;

const getBed = () => {
  if (!bed) {
    bed = new Audio(BEDS[0]);
    bed.preload = "auto";
    applyMusic();
    bed.addEventListener("ended", () => {
      bedIndex = (bedIndex + 1) % BEDS.length;
      if (!bed) return;
      bed.src = BEDS[bedIndex];
      if (bedOn && !document.hidden) void bed.play().catch(() => {});
    });
  }
  return bed;
};

export function startBed() {
  unlockAudio();
  bedOn = true;
  const track = getBed();
  applyMusic();
  if (track.paused) void track.play().catch(() => {});
}

export function duckBed() {
  startBed();
}

export function stopBed() {
  if (!bed) return;
  bed.pause();
}

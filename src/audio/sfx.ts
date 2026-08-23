let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let bedTimer = 0;
let bedOn = false;

const getCtx = () => {
  if (!ctx) {
    ctx = new AudioContext();
    master = ctx.createGain();
    master.gain.value = 0.22;
    master.connect(ctx.destination);
  }
  return ctx;
};

export function unlockAudio() {
  const c = getCtx();
  if (c.state === "suspended") void c.resume();
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

const noise = (dur: number, gain: number, at = 0) => {
  const c = getCtx();
  if (!master || c.state !== "running") return;
  const n = Math.floor(c.sampleRate * dur);
  const buf = c.createBuffer(1, n, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < n; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / n);
  const src = c.createBufferSource();
  const g = c.createGain();
  const t = c.currentTime + at;
  src.buffer = buf;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(g);
  g.connect(master);
  src.start(t);
};

export const sfx = {
  ui() {
    unlockAudio();
    tone(880, 0.06, "triangle", 0.07);
  },
  tap() {
    unlockAudio();
    tone(640, 0.05, "square", 0.05);
  },
  miss() {
    unlockAudio();
    tone(160, 0.12, "sine", 0.08, 0, 90);
  },
  match(impact = 1) {
    unlockAudio();
    const base = 420 + impact * 70;
    tone(base, 0.1, "triangle", 0.09);
    tone(base * 1.5, 0.14, "sine", 0.05, 0.03);
  },
  cascade(depth: number) {
    unlockAudio();
    const n = Math.min(5, depth);
    for (let i = 0; i < n; i++) {
      tone(520 + i * 90, 0.09, "triangle", 0.055, i * 0.055);
    }
  },
  blast() {
    unlockAudio();
    noise(0.18, 0.12);
    tone(240, 0.22, "sawtooth", 0.06, 0, 80);
  },
  collect() {
    unlockAudio();
    tone(720, 0.08, "sine", 0.07);
    tone(960, 0.1, "triangle", 0.05, 0.04);
  },
  hit() {
    unlockAudio();
    noise(0.1, 0.1);
    tone(110, 0.14, "square", 0.07, 0, 70);
  },
  booster() {
    unlockAudio();
    tone(360, 0.16, "sawtooth", 0.07, 0, 720);
    tone(540, 0.18, "triangle", 0.05, 0.05);
  },
  win() {
    unlockAudio();
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, "triangle", 0.08, i * 0.08));
  },
  lose() {
    unlockAudio();
    tone(220, 0.2, "sine", 0.08, 0, 140);
    tone(164, 0.28, "triangle", 0.06, 0.1, 90);
  },
};

export function startBed() {
  unlockAudio();
  if (bedOn) return;
  bedOn = true;
  const pulse = () => {
    if (!bedOn) return;
    tone(196, 0.55, "sine", 0.018);
    tone(294, 0.7, "triangle", 0.012, 0.12);
    bedTimer = window.setTimeout(pulse, 2200);
  };
  pulse();
}

export function stopBed() {
  bedOn = false;
  window.clearTimeout(bedTimer);
}

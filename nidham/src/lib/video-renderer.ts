export interface RenderScene {
  sceneNumber: number;
  narration: string;
  visuals: string;
  duration: number;
  shotType?: string;
  textOverlay?: string;
}

export interface RenderOptions {
  scenes: RenderScene[];
  platform: string;
  resolution: { width: number; height: number };
  bgMusic?: { enabled: boolean; volume: number };
  brandColor?: string;
  title?: string;
}

function hexToRgba(h: string, a: number) {
  const r = parseInt(h.slice(1, 3), 16), g = parseInt(h.slice(3, 5), 16), b = parseInt(h.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath();
}

function wrap(text: string, max: number): string[] {
  const r: string[] = []; let c = '';
  for (const w of text.split(' ')) {
    if ((c + ' ' + w).length > max) { r.push(c); c = w; } else c = c ? c + ' ' + w : w;
  }
  if (c) r.push(c); return r;
}

const THEMES = [
  { p: '#1e1b4b', s: '#0f172a', a: '#22d3ee' }, { p: '#164e63', s: '#0f172a', a: '#2dd4bf' },
  { p: '#064e3b', s: '#0f172a', a: '#34d399' }, { p: '#78350f', s: '#0f172a', a: '#fbbf24' },
  { p: '#881337', s: '#0f172a', a: '#fb7185' }, { p: '#4c1d95', s: '#0f172a', a: '#a78bfa' },
];

interface Pt { x: number; y: number; vx: number; vy: number; s: number; a: number; l: number }

function mkPts(n: number, w: number, h: number): Pt[] {
  return Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, vx: (Math.random() - 0.5) * 0.3, vy: -0.2 - Math.random() * 0.5, s: 1 + Math.random() * 3, a: 0.1 + Math.random() * 0.3, l: 1 }));
}

function updPts(pts: Pt[], w: number, h: number, dt: number) {
  for (const p of pts) {
    p.x += p.vx * dt * 60; p.y += p.vy * dt * 60; p.l -= dt * 0.02;
    if (p.y < -10 || p.l <= 0) { p.y = h + 10; p.x = Math.random() * w; p.l = 1; p.a = 0.1 + Math.random() * 0.3; }
    if (p.x < 0) p.x = w; if (p.x > w) p.x = 0;
  }
}

function drawPts(ctx: CanvasRenderingContext2D, pts: Pt[]) {
  for (const p of pts) { ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 6.28); ctx.fillStyle = `rgba(255,255,255,${p.a * p.l})`; ctx.fill(); }
}

class AudioEngine {
  private ctx: AudioContext | null = null;
  private mg: GainNode | null = null;
  private dest: MediaStreamAudioDestinationNode | null = null;
  private nodes: any[] = [];

  get stream() { return this.dest?.stream ?? null; }

  async init() {
    this.ctx = new AudioContext();
    this.mg = this.ctx.createGain(); this.mg.gain.value = 1;
    this.dest = this.ctx.createMediaStreamDestination();
    this.mg.connect(this.dest);
    if (this.ctx.state === 'suspended') await this.ctx.resume();
  }

  addPad(v = 0.12) {
    if (!this.ctx || !this.mg) return () => {};
    const c = this.ctx;
    const g = c.createGain(); g.gain.value = v; g.connect(this.mg); this.nodes.push(g);
    const o1 = c.createOscillator(), o2 = c.createOscillator();
    o1.type = 'sine'; o2.type = 'triangle'; o1.frequency.value = 220; o2.frequency.value = 277.18;
    o1.detune.value = 5; o2.detune.value = -3;
    const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 500; f.Q.value = 0.5;
    const lfo = c.createOscillator(), lfoG = c.createGain();
    lfo.frequency.value = 0.1; lfoG.gain.value = 100; lfo.connect(lfoG); lfoG.connect(f.frequency); lfo.start();
    o1.connect(f); o2.connect(f); f.connect(g); o1.start(); o2.start();
    this.nodes.push(o1, o2, f, lfo, lfoG);
    return () => { try { o1.stop(); o2.stop(); lfo.stop(); } catch {} o1.disconnect(); o2.disconnect(); f.disconnect(); lfo.disconnect(); lfoG.disconnect(); g.disconnect(); this.nodes = this.nodes.filter(n => ![o1, o2, f, lfo, lfoG, g].includes(n)); };
  }

  chime() {
    if (!this.ctx || !this.mg) return;
    const c = this.ctx, n = c.currentTime;
    const g = c.createGain(); g.gain.setValueAtTime(0.08, n); g.gain.exponentialRampToValueAtTime(0.001, n + 0.5); g.connect(this.mg);
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(880, n); o.frequency.exponentialRampToValueAtTime(1760, n + 0.15); o.connect(g); o.start(n); o.stop(n + 0.5);
    this.nodes.push(o, g);
    setTimeout(() => { o.disconnect(); g.disconnect(); this.nodes = this.nodes.filter(n => ![o, g].includes(n)); }, 600);
  }

  close() {
    for (const n of this.nodes) try { n.stop?.(); n.disconnect(); } catch {}
    this.nodes = []; this.ctx?.close(); this.ctx = null; this.mg = null; this.dest = null;
  }
}

export class VideoRenderer {
  private c: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mr: MediaRecorder | null = null;
  private chunks: Blob[] = [];
  private ae: AudioEngine;
  private pts: Pt[] = [];
  private af: number = 0;
  private lft: number = 0;
  private rst: number = 0;
  private padStop: (() => void) | null = null;

  constructor(width = 1080, height = 1920) {
    this.c = document.createElement('canvas'); this.c.width = width; this.c.height = height;
    const ctx = this.c.getContext('2d'); if (!ctx) throw new Error('Canvas 2D unavailable');
    this.ctx = ctx; this.ae = new AudioEngine();
  }

  private bg(theme: typeof THEMES[0], t: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    const a = t * 0.02;
    const g = ctx.createLinearGradient(w * 0.5 + Math.cos(a) * w * 0.3, h * 0.5 + Math.sin(a) * h * 0.3, w * 0.5 + Math.cos(a + 3.14) * w * 0.3, h * 0.5 + Math.sin(a + 3.14) * h * 0.3);
    g.addColorStop(0, theme.p); g.addColorStop(0.5, theme.s); g.addColorStop(1, theme.p);
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const v = ctx.createRadialGradient(w * 0.5, h * 0.5, h * 0.1, w * 0.5, h * 0.5, h * 0.8);
    v.addColorStop(0, 'rgba(255,255,255,0.03)'); v.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = v; ctx.fillRect(0, 0, w, h);
  }

  private decor(t: number, p: number) {
    drawPts(this.ctx, this.pts);
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    ctx.save(); ctx.globalAlpha = 0.12 * p;
    const ly = h * 0.08 + Math.sin(t * 0.001) * h * 0.01;
    const lg = ctx.createLinearGradient(w * 0.1, 0, w * 0.9, 0);
    lg.addColorStop(0, 'transparent'); lg.addColorStop(0.3, 'rgba(255,255,255,0.3)'); lg.addColorStop(0.7, 'rgba(255,255,255,0.3)'); lg.addColorStop(1, 'transparent');
    ctx.strokeStyle = lg; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(w * 0.1, ly); ctx.quadraticCurveTo(w * 0.3, ly + Math.sin(t * 0.0013) * 5, w * 0.5, ly); ctx.quadraticCurveTo(w * 0.7, ly - Math.sin(t * 0.0007) * 5, w * 0.9, ly); ctx.stroke();
    ctx.restore();
  }

  private sceneInfo(n: number, t: number, th: typeof THEMES[0], p: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    ctx.save(); ctx.globalAlpha = p;
    const bw = w * 0.18, bh = h * 0.045;
    ctx.fillStyle = hexToRgba(th.a, 0.15); roundRect(ctx, w * 0.04, h * 0.04, bw, bh, h * 0.012); ctx.fill();
    ctx.fillStyle = th.a; ctx.font = `bold ${h * 0.024}px "Cairo", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(`المشهد ${n}/${t}`, w * 0.04 + bw * 0.5, h * 0.04 + bh * 0.5);
    ctx.restore();
  }

  private vText(text: string, p: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    const lines = wrap(text, 25), sy = h * 0.28;
    ctx.save(); ctx.globalAlpha = Math.min(1, p * 2);
    ctx.shadowColor = 'rgba(255,255,255,0.1)'; ctx.shadowBlur = 20;
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.font = `bold ${h * 0.038}px "Cairo", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => {
      const lp = Math.min(1, Math.max(0, (p - i * 0.15) * 2));
      ctx.save(); ctx.globalAlpha = lp; ctx.fillText(l, w * 0.5 + (1 - lp) * w * 0.1, sy + i * h * 0.06); ctx.restore();
    });
    ctx.restore();
  }

  private narration(text: string, p: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    const lines = wrap(text, 30), by = h * 0.78, bh = Math.max(lines.length * h * 0.05 + h * 0.05, h * 0.11);
    ctx.save(); ctx.globalAlpha = Math.min(1, p);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; roundRect(ctx, w * 0.04, by, w * 0.92, bh, h * 0.015); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.font = `${h * 0.027}px "Cairo", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    lines.forEach((l, i) => ctx.fillText(l, w * 0.5, by + bh * 0.3 + i * h * 0.045));
    ctx.restore();
  }

  private shotTag(st: string, th: typeof THEMES[0], p: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    const labels: Record<string, string> = { close_up: 'لقطة قريبة', medium: 'لقطة متوسطة', wide: 'لقطة واسعة', extreme_wide: 'لقطة واسعة جداً', over_shoulder: 'فوق الكتف', point_of_view: 'وجهة نظر', detail: 'تفصيلية', two_shot: 'لقطة ثنائية' };
    const label = labels[st] ?? st;
    ctx.save(); ctx.globalAlpha = Math.min(1, p * 1.5);
    const tw = w * 0.25, th_h = h * 0.035;
    ctx.fillStyle = hexToRgba(th.a, 0.2); roundRect(ctx, w * 0.04, h * 0.1, tw, th_h, h * 0.01); ctx.fill();
    ctx.fillStyle = th.a; ctx.font = `${h * 0.022}px "Cairo", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(label, w * 0.04 + tw * 0.5, h * 0.1 + th_h * 0.5);
    ctx.restore();
  }

  private overlay(text: string, th: typeof THEMES[0], p: number) {
    if (!text) return;
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    ctx.save(); ctx.globalAlpha = Math.min(1, p);
    ctx.font = `bold ${h * 0.03}px "Cairo", sans-serif`;
    const tw = ctx.measureText(text).width, pw = tw + w * 0.04, ph = h * 0.06;
    ctx.fillStyle = hexToRgba(th.a, 0.85); roundRect(ctx, w * 0.5 - pw * 0.5, h * 0.63, pw, ph, h * 0.015); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, w * 0.5, h * 0.63 + ph * 0.5);
    ctx.restore();
  }

  private progBar(i: number, t: number, p: number) {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    ctx.save(); ctx.globalAlpha = 0.6;
    const by = h * 0.97, bw = w * 0.8, bx = w * 0.1, bh = h * 0.004;
    ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRect(ctx, bx, by, bw, bh, h * 0.002); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; roundRect(ctx, bx, by, bw * ((i + 1 + p) / t), bh, h * 0.002); ctx.fill();
    ctx.restore();
  }

  private wm() {
    const ctx = this.ctx, w = this.c.width, h = this.c.height;
    ctx.save(); ctx.globalAlpha = 0.12; ctx.font = `${h * 0.02}px "Cairo", sans-serif`; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#fff'; ctx.fillText('nidhamhr.com', w * 0.04, h * 0.045); ctx.restore();
  }

  private frame(scene: RenderScene, idx: number, total: number, time: number, prog: number) {
    const ctx = this.ctx, th = THEMES[idx % THEMES.length];
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    this.bg(th, time); this.decor(time, prog);
    this.sceneInfo(scene.sceneNumber, total, th, prog);
    if (scene.shotType) this.shotTag(scene.shotType, th, prog);
    this.vText(scene.visuals, prog);
    if (scene.textOverlay) this.overlay(scene.textOverlay, th, prog);
    this.narration(scene.narration, prog);
    this.progBar(idx, total, prog);
    this.wm();
  }

  private crossfade(from: RenderScene, fi: number, to: RenderScene, ti: number, tt: number, t: number, fp: number) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.c.width, this.c.height);
    if (fp < 0.5) {
      const p = fp * 2; this.frame(from, fi, tt, t, 1 - p * 0.3);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.c.width, this.c.height); ctx.restore();
    } else {
      const p = (fp - 0.5) * 2; this.frame(to, ti, tt, t, p);
      ctx.save(); ctx.globalAlpha = 1 - p; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.c.width, this.c.height); ctx.restore();
    }
  }

  async startRecording(bgMusic = false) {
    this.chunks = [];
    this.ae = new AudioEngine();
    await this.ae.init();

    const vs = this.c.captureStream(30);
    const as = this.ae.stream;
    const ms = as && as.getAudioTracks().length > 0
      ? new MediaStream([...vs.getVideoTracks(), ...as.getAudioTracks()])
      : vs;

    const mime = ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'].find(m => MediaRecorder.isTypeSupported(m)) ?? 'video/webm';
    this.mr = new MediaRecorder(ms, { mimeType: mime, videoBitsPerSecond: 12_000_000 });
    this.mr.ondataavailable = (e) => { if (e.data.size > 0) this.chunks.push(e.data); };
    this.mr.start(1000);

    if (bgMusic) this.padStop = this.ae.addPad(0.12);
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mr) { resolve(new Blob([], { type: 'video/webm' })); return; }
      this.mr.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mr?.mimeType ?? 'video/webm' });
        this.padStop?.(); this.ae.close(); resolve(blob);
      };
      this.mr.stop();
    });
  }

  speakText(text: string, lang = 'ar-SA', rate = 0.9): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) { reject(new Error('TTS not supported')); return; }
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = rate; u.pitch = 1; u.volume = 1;
      const voices = window.speechSynthesis.getVoices();
      const ar = voices.find(v => v.lang.startsWith('ar') && (v.name.includes('Arabic') || v.name.includes('Hoda')));
      if (ar) u.voice = ar;
      u.onend = () => resolve(); u.onerror = (e) => reject(e);
      window.speechSynthesis.speak(u);
    });
  }

  async renderFullVideo(scenes: RenderScene[], onProgress?: (s: number, t: number) => void, bgMusic = false): Promise<Blob> {
    this.pts = mkPts(60, this.c.width, this.c.height);
    await this.startRecording(bgMusic);
    this.rst = performance.now();

    for (let i = 0; i < scenes.length; i++) {
      onProgress?.(i + 1, scenes.length);
      const ttsPromise = this.speakText(scenes[i].narration);
      await this.animateScene(scenes[i], i, scenes.length, scenes[i].duration);
      await ttsPromise;
      if (i < scenes.length - 1) {
        this.ae.chime();
        await this.doCrossfade(scenes[i], i, scenes[i + 1], i + 1, scenes.length);
      }
    }
    return this.stopRecording();
  }

  private animateScene(scene: RenderScene, idx: number, total: number, dur: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const cb = (time: number) => {
        const el = (time - start) / 1000, p = Math.min(1, el / dur);
        const dt = this.lft ? (time - this.lft) / 1000 : 0.016;
        updPts(this.pts, this.c.width, this.c.height, dt); this.lft = time;
        this.frame(scene, idx, total, (time - this.rst) / 1000, p);
        p < 1 ? (this.af = requestAnimationFrame(cb)) : (this.frame(scene, idx, total, (time - this.rst) / 1000, 1), resolve());
      };
      this.af = requestAnimationFrame(cb);
    });
  }

  private doCrossfade(from: RenderScene, fi: number, to: RenderScene, ti: number, tt: number): Promise<void> {
    return new Promise((resolve) => {
      const start = performance.now();
      const cb = (time: number) => {
        const fp = Math.min(1, (time - start) / 500);
        this.crossfade(from, fi, to, ti, tt, (time - this.rst) / 1000, fp);
        fp < 1 ? requestAnimationFrame(cb) : resolve();
      };
      requestAnimationFrame(cb);
    });
  }

  renderStaticScene(scene: RenderScene, idx: number, total: number) {
    this.pts = mkPts(60, this.c.width, this.c.height);
    this.frame(scene, idx, total, 0, 1);
  }

  renderScene(scene: RenderScene, idx: number, total: number) {
    this.frame(scene, idx, total, 0, 1);
  }

  getCanvas() { return this.c; }

  destroy() { if (this.af) cancelAnimationFrame(this.af); this.padStop?.(); this.ae.close(); }
}

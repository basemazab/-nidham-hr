// Video rendering engine — TTS + Canvas scenes + MediaRecorder export

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

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Scene background gradients
const SCENE_BGS = [
  ["from-indigo-900 via-purple-900 to-slate-900", "#1e1b4b", "#0f172a"],
  ["from-cyan-900 via-blue-900 to-slate-900", "#164e63", "#0f172a"],
  ["from-emerald-900 via-teal-900 to-slate-900", "#064e3b", "#0f172a"],
  ["from-amber-900 via-orange-900 to-slate-900", "#78350f", "#0f172a"],
  ["from-rose-900 via-pink-900 to-slate-900", "#881337", "#0f172a"],
  ["from-violet-900 via-fuchsia-900 to-slate-900", "#4c1d95", "#0f172a"],
];

export class VideoRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private audioContext: AudioContext | null = null;

  constructor(width = 1080, height = 1920) {
    this.canvas = document.createElement("canvas");
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx = this.canvas.getContext("2d")!;
  }

  async renderScene(
    scene: RenderScene,
    index: number,
    totalScenes: number,
  ): Promise<void> {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const bg = SCENE_BGS[index % SCENE_BGS.length];

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, bg[1]);
    grad.addColorStop(1, bg[2]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative circles
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(
        w * (0.2 + i * 0.3),
        h * (0.3 + Math.sin(i * 2) * 0.2),
        w * 0.3,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = `rgba(255,255,255,0.03)`;
      ctx.fill();
    }

    // Scene number badge
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.beginPath();
    ctx.roundRect(w * 0.05, h * 0.04, w * 0.15, h * 0.04, h * 0.01);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.font = `bold ${h * 0.022}px "Cairo", sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText(`المشهد ${scene.sceneNumber}/${totalScenes}`, w * 0.17, h * 0.068);

    // Shot type tag
    if (scene.shotType) {
      const shotLabel =
        {
          close_up: "لقطة قريبة",
          medium: "لقطة متوسطة",
          wide: "لقطة واسعة",
          extreme_wide: "لقطة واسعة جداً",
          over_shoulder: "فوق الكتف",
          point_of_view: "وجهة نظر",
          detail: "تفصيلية",
          two_shot: "لقطة ثنائية",
        }[scene.shotType] ?? scene.shotType;
      ctx.fillStyle = "rgba(6,182,212,0.2)";
      ctx.beginPath();
      ctx.roundRect(w * 0.05, h * 0.1, w * 0.3, h * 0.032, h * 0.008);
      ctx.fill();
      ctx.fillStyle = "#22d3ee";
      ctx.font = `bold ${h * 0.02}px "Cairo", sans-serif`;
      ctx.textAlign = "right";
      ctx.fillText(shotLabel, w * 0.32, h * 0.123);
    }

    // Main visual description
    const visualWords = scene.visuals.split(" ");
    const lines: string[] = [];
    let currentLine = "";
    const maxChars = 25;
    for (const word of visualWords) {
      if ((currentLine + " " + word).length > maxChars) {
        lines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = currentLine ? currentLine + " " + word : word;
      }
    }
    if (currentLine) lines.push(currentLine);

    const visualY = h * 0.28;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.font = `bold ${h * 0.035}px "Cairo", sans-serif`;
    ctx.textAlign = "center";
    lines.forEach((line, i) => {
      ctx.fillText(line, w * 0.5, visualY + i * h * 0.055);
    });

    // Text overlay if provided
    if (scene.textOverlay) {
      ctx.fillStyle = "rgba(6,182,212,0.85)";
      ctx.font = `bold ${h * 0.028}px "Cairo", sans-serif`;
      ctx.textAlign = "center";
      const overlayY = h * 0.65;
      // Background pill
      const tw = ctx.measureText(scene.textOverlay).width;
      ctx.beginPath();
      ctx.roundRect(
        w * 0.5 - tw * 0.5 - w * 0.02,
        overlayY - h * 0.022,
        tw + w * 0.04,
        h * 0.055,
        h * 0.01,
      );
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(scene.textOverlay, w * 0.5, overlayY + h * 0.012);
    }

    // Narration text at bottom
    const narrationWords = scene.narration.split(" ");
    const nLines: string[] = [];
    let nLine = "";
    const nMaxChars = 30;
    for (const word of narrationWords) {
      if ((nLine + " " + word).length > nMaxChars) {
        nLines.push(nLine);
        nLine = word;
      } else {
        nLine = nLine ? nLine + " " + word : word;
      }
    }
    if (nLine) nLines.push(nLine);

    // Narration box at bottom
    const boxY = h * 0.78;
    const boxH = Math.max(nLines.length * h * 0.05 + h * 0.04, h * 0.1);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.beginPath();
    ctx.roundRect(w * 0.04, boxY, w * 0.92, boxH, h * 0.015);
    ctx.fill();

    // Quote mark
    ctx.fillStyle = "rgba(255,255,255,0.15)";
    ctx.font = `${h * 0.06}px serif`;
    ctx.textAlign = "right";
    ctx.fillText("❝", w * 0.9, boxY + h * 0.06);

    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.font = `${h * 0.025}px "Cairo", sans-serif`;
    ctx.textAlign = "center";
    const textY = boxY + h * 0.05;
    nLines.forEach((line, i) => {
      ctx.fillText(line, w * 0.5, textY + (i + 1) * h * 0.045);
    });

    // Scene progress bar at bottom
    const barY = h * 0.97;
    ctx.fillStyle = "rgba(255,255,255,0.1)";
    ctx.beginPath();
    ctx.roundRect(w * 0.1, barY, w * 0.8, h * 0.006, h * 0.003);
    ctx.fill();
    ctx.fillStyle = "rgba(6,182,212,0.6)";
    ctx.beginPath();
    ctx.roundRect(
      w * 0.1,
      barY,
      w * 0.8 * ((index + 1) / totalScenes),
      h * 0.006,
      h * 0.003,
    );
    ctx.fill();

    // Brand watermark
    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.font = `${h * 0.018}px "Cairo", sans-serif`;
    ctx.textAlign = "left";
    ctx.fillText("nidhamhr.com", w * 0.04, h * 0.05);
  }

  speakText(
    text: string,
    lang = "ar-SA",
    rate = 0.9,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!window.speechSynthesis) {
        reject(new Error("TTS not supported"));
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = 1;
      utterance.volume = 1;
      // Try to find an Arabic voice
      const voices = window.speechSynthesis.getVoices();
      const arVoice = voices.find(
        (v) =>
          v.lang.startsWith("ar") &&
          (v.name.includes("Arabic") || v.name.includes("Zira") || v.name.includes("Hoda")),
      );
      if (arVoice) utterance.voice = arVoice;
      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(e);
      window.speechSynthesis.speak(utterance);
    });
  }

  startRecording(): void {
    this.recordedChunks = [];
    const stream = this.canvas.captureStream(30);
    this.audioContext = new AudioContext();
    // Try to capture audio from the system
    try {
      const dest = this.audioContext.createMediaStreamDestination();
      // We'll add audio tracks from TTS later
      const combined = new MediaStream([
        ...stream.getVideoTracks(),
        ...dest.stream.getAudioTracks(),
      ]);
      this.mediaRecorder = new MediaRecorder(combined, {
        mimeType: MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
          ? "video/webm;codecs=vp9"
          : "video/webm",
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start();
    } catch {
      // Fallback: video only
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });
      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };
      this.mediaRecorder.start();
    }
  }

  stopRecording(): Promise<Blob> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder) {
        resolve(new Blob([], { type: "video/webm" }));
        return;
      }
      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.recordedChunks, {
          type: this.mediaRecorder?.mimeType ?? "video/webm",
        });
        resolve(blob);
      };
      this.mediaRecorder.stop();
      if (this.audioContext) {
        this.audioContext.close();
        this.audioContext = null;
      }
    });
  }

  async renderFullVideo(
    scenes: RenderScene[],
    onProgress?: (scene: number, total: number) => void,
  ): Promise<Blob> {
    this.startRecording();

    for (let i = 0; i < scenes.length; i++) {
      const scene = scenes[i];
      onProgress?.(i + 1, scenes.length);

      // Render visual scene
      await this.renderScene(scene, i, scenes.length);

      // Play TTS for this scene's narration
      const startTime = performance.now();
      const ttsPromise = this.speakText(scene.narration);
      const renderDuration = scene.duration * 1000;

      // Keep rendering frames until narration + min duration
      while (performance.now() - startTime < renderDuration) {
        await this.sleep(100);
        // Redraw the same scene (could add subtle animation)
        this.renderScene(scene, i, scenes.length);
      }

      // Wait for TTS to finish if still going
      await ttsPromise;
    }

    return this.stopRecording();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}

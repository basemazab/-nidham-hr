// ============================================================================
// generate-voiceover.mjs — Arabic, male, enthusiastic voiceover for the
// Nidham marketing/explainer videos, using the Gemini TTS API.
// ============================================================================
//
// Why this exists: the agent can't synthesize speech itself, but Google's
// Gemini API has a built-in text-to-speech model with selectable voices and
// natural-language STYLE control — and you already have a GEMINI_API_KEY.
// This script turns every narration line in VIDEO_SCRIPTS.md into a WAV clip.
//
// ── Usage ───────────────────────────────────────────────────────────────────
//   1. Make sure GEMINI_API_KEY is set (it already is in .env.local / Vercel).
//      Locally:  set GEMINI_API_KEY=...   (Windows)   then run from /nidham:
//   2.  node tools/generate-voiceover.mjs
//   3. Output: voiceover/<videoId>/scene-NN.wav  (24kHz mono)
//      Drag them onto the matching scenes in CapCut / your Video Studio export.
//
//   Pick a different male voice:   set VOICE=Puck    (then run again)
//   Good male/energetic voices: Fenrir (excitable), Puck (upbeat),
//                               Charon (informative), Orus (firm).
//
// No external dependencies — uses Node 18+ global fetch + fs.
// ============================================================================

import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.TTS_MODEL || "gemini-2.5-flash-preview-tts";
const VOICE = process.env.VOICE || "Fenrir"; // male, excitable
const STYLE = "انطق النص الآتي بصوت رجل متحمّس وواضح وبنبرة إعلانية قوية تجذب الانتباه:";

if (!API_KEY) {
  console.error("✗ GEMINI_API_KEY مش موجود. حطّه في البيئة وحاول تاني.");
  process.exit(1);
}

// Narration lines mirror VIDEO_SCRIPTS.md (scene order = file order).
const VIDEOS = [
  {
    id: "01-explainer",
    scenes: [
      "عندك شركة في مصر؟ يبقى عندك صداع اسمه: مرتبات، تأمينات، حضور، وغرامات!",
      "اتفرّج على نِظام — نظام الموارد البشرية المصري اللي بيعمل ده كله مكانك، وبالعربي.",
      "المرتبات؟ بتتحسب تلقائياً — تأمينات قانون ألفين وستة وعشرين، ضرايب، أوفر تايم، وسلف. كشف مرتبات كامل في دقايق بدل أيام.",
      "الحضور؟ من موبايل الموظف بالجي بي إس والسيلفي — من غير أجهزة بصمة غالية. حتى في فروع ومواقع كتير.",
      "والأقوى: درع الامتثال — بيراقب شركتك وينبّهك قبل أي غرامة من مكتب العمل أو التأمينات.",
      "كمان: نماذج رسمية جاهزة، بوت واتساب للموظفين، وإدارة عملاء، واستوديو تسويق بالذكاء الاصطناعي.",
      "نظام واحد بدل خمس أنظمة — بالعربي، ومصمم لقانون العمل المصري.",
      "جرّبه مجاناً النهارده — من غير بطاقة ائتمان. نِظام... شغلك أسهل.",
    ],
  },
  {
    id: "02-compliance-shield",
    scenes: [
      "غرامة تأمينات واحدة ممكن تاكل أرباح شهر كامل! وانت مش واخد بالك.",
      "عشان كده عملنا حاجة مفيش نظام تاني في الشرق الأوسط بيعملها: درع الامتثال.",
      "بيفحص بيانات شركتك تلقائياً، ويقولك بالظبط: تأمينات متأخرة، مستندات قربت تنتهي، فترات اختبار، ومستحقات — قبل ما تتحوّل لغرامة.",
      "وبيديك رقم واحد واضح: مؤشر امتثالك من مية — وتعرّضك للغرامات بالجنيه.",
      "وكمان تقرير امتثال جاهز تطبعه وتطلّعه في أي تفتيش. راحة بال حقيقية.",
      "كل نظام تاني بينظّم بس. نِظام بيحميك. جرّبه مجاناً.",
    ],
  },
  {
    id: "03-hook-30s",
    scenes: [
      "لو لسه بتحسب مرتبات شركتك على إكسيل — انت بتضيّع وقتك وفلوسك!",
      "نِظام بيحسب المرتبات والتأمينات والضرايب تلقائياً، وياخد الحضور من الموبايل بالجي بي إس.",
      "وبينبّهك قبل أي غرامة من مكتب العمل. نظام موارد بشرية مصري كامل — بالعربي.",
      "وفيه باقة مجانية! دوّر على نِظام دلوقتي.",
    ],
  },
];

// Wrap raw PCM (signed 16-bit LE) in a minimal WAV container so it plays
// everywhere. Gemini returns 24kHz mono by default.
function pcmToWav(pcm, sampleRate = 24000, channels = 1, bitDepth = 16) {
  const blockAlign = (channels * bitDepth) / 8;
  const byteRate = sampleRate * blockAlign;
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(channels, 22);
  h.writeUInt32LE(sampleRate, 24);
  h.writeUInt32LE(byteRate, 28);
  h.writeUInt16LE(blockAlign, 32);
  h.writeUInt16LE(bitDepth, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

function rateFromMime(mime) {
  const m = /rate=(\d+)/.exec(mime || "");
  return m ? parseInt(m[1], 10) : 24000;
}

async function synth(text) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const body = {
    contents: [{ parts: [{ text: `${STYLE}\n"${text}"` }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } },
      },
    },
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 300)}`);
  }
  const json = await res.json();
  const part = json?.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
  if (!part) throw new Error("مفيش صوت في الرد (راجع المفتاح/الموديل).");
  const pcm = Buffer.from(part.inlineData.data, "base64");
  return pcmToWav(pcm, rateFromMime(part.inlineData.mimeType));
}

async function main() {
  console.log(`🎙️  الصوت: ${VOICE} · الموديل: ${MODEL}\n`);
  const root = join(process.cwd(), "voiceover");
  for (const video of VIDEOS) {
    const dir = join(root, video.id);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    console.log(`📹 ${video.id}`);
    for (let i = 0; i < video.scenes.length; i++) {
      const n = String(i + 1).padStart(2, "0");
      try {
        const wav = await synth(video.scenes[i]);
        writeFileSync(join(dir, `scene-${n}.wav`), wav);
        console.log(`   ✓ scene-${n}.wav`);
      } catch (err) {
        console.error(`   ✗ scene-${n}: ${err.message}`);
      }
    }
  }
  console.log(`\n✅ خلص. الملفات في: ${root}`);
  console.log("ركّبها على المشاهد في CapCut أو استوديو الفيديو حسب الجدول.");
}

main();

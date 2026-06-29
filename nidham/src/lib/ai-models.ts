// ============================================================================
// AI Model selector — multi-provider fallback for "effectively unlimited" free
// ============================================================================
//
// The chat agent and other LLM endpoints used to be hard-coded to Gemini
// Flash. That's great for quality but the free tier (20 RPM, 1500 RPD)
// hits its ceiling in real use within minutes — especially when each
// tool-using turn costs 3-4 API calls.
//
// This module exposes a single function `pickAgentModel()` that returns
// the best LANGUAGE model available given the configured API keys, using
// this priority order:
//
//   1) Groq gpt-oss-120b                   — 30 RPM, ~30k RPD (free)
//      Supports json_schema AND tool calling. The 120B size matters for
//      complex Marketing Studio schemas (SEO returns 10-25 keyword
//      objects with enums; gpt-oss-20b reliably fails to produce valid
//      JSON for those). Slightly slower than 20B but bullet-proof on
//      structured output, which is what users hit first.
//   2) Groq gpt-oss-20b                    — 30 RPM, ~100k RPD (free)
//      Fast secondary for simpler schemas + chat. Different rate-limit
//      bucket from 120B so an exhausted primary gracefully degrades.
//   3) Groq Llama 4 Scout 17B              — 30 RPM, 14k RPD (free)
//      Third option in the Groq family if both gpt-oss variants are
//      hammered. Also supports json_schema.
//   4) Gemini 2.5 Flash Lite               — 60 RPM, 1.5k RPD (free)
//      Final fallback when all Groq is exhausted, or the only provider
//      when GROQ_API_KEY isn't set.
//
// Why not Llama 3.3 70B Versatile or Llama 3.1 8B Instant: Groq's
// docs (https://console.groq.com/docs/structured-outputs#supported-models)
// list them as supporting json_object only — NOT json_schema. The Vercel
// AI SDK 6.x sends json_schema by default for generateObject, so those
// models error with "This model does not support response format `json_schema`".
//
// Tenants can override the default order via env var:
//   AI_AGENT_MODEL = "groq:openai/gpt-oss-120b"
//   AI_AGENT_MODEL = "groq:openai/gpt-oss-20b"
//   AI_AGENT_MODEL = "groq:meta-llama/llama-4-scout-17b-16e-instruct"
//   AI_AGENT_MODEL = "gemini:gemini-2.5-flash"
//   AI_AGENT_MODEL = "gemini:gemini-2.5-flash-lite"
//
// PDF parsing still pins to Gemini Flash via `pickPdfModel()` because
// multimodal + OCR isn't available on Groq's Llama lineup.

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModel } from "ai";

// ----------------------------------------------------------------------------
// Public types
// ----------------------------------------------------------------------------
export type AgentModelInfo = {
  model: LanguageModel;
  /** "groq" | "gemini" | "nara" — for telemetry / debugging logs */
  provider: "groq" | "gemini" | "nara";
  /** Underlying model name, e.g. "llama-3.3-70b-versatile" */
  modelName: string;
};

// ----------------------------------------------------------------------------
// Lazy-initialised provider singletons. Each call returns the same
// underlying SDK instance so requests share connection pools.
// ----------------------------------------------------------------------------
function getGroqProvider() {
  if (!process.env.GROQ_API_KEY) return null;
  return createGroq({ apiKey: process.env.GROQ_API_KEY });
}

function getGoogleProvider() {
  if (!process.env.GEMINI_API_KEY) return null;
  return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
}

// NaraRouter — an OpenAI-COMPATIBLE gateway (https://router.bynara.id/v1) that
// routes to strong models (Claude Sonnet 4.5, GPT, Mistral…) with a generous
// free DAILY token pool. Added as an extra provider so the assistant + other
// AI features keep working when the Gemini/Groq free quotas run out.
// `.chat()` forces the /chat/completions endpoint (Nara doesn't implement the
// OpenAI "responses" API). The routed model is configurable via NARA_MODEL.
// `mistral-large` — the strongest TOOL-CALLING model on Basem's free Nara tier
// (others: mimo-v2.5-free/pro = reasoning models with iffy tool support,
// mistral-medium-3-5 = smaller but has vision). The 21-tool agent needs
// reliable function-calling, so default to mistral-large. Override via
// NARA_MODEL env if the free model list changes.
const NARA_MODEL = process.env.NARA_MODEL || "mistral-large";
function getNaraProvider() {
  // Canonical var is NARA_API_KEY; we also accept KEY_nara — the name Basem's
  // Vercel actually accepted for the sk-nry key. NARA_API_KEY takes precedence
  // when present, so migrating later is a no-op for the code.
  const key = process.env.NARA_API_KEY || process.env.KEY_nara;
  if (!key) return null;
  return createOpenAI({
    baseURL: "https://router.bynara.id/v1",
    apiKey: key,
    name: "nara",
  });
}
function naraModelInfo(): AgentModelInfo | null {
  // DISABLED 2026-06-29 (opt-in via NARA_ENABLED). NaraRouter's free tier began
  // gating calls behind "telegram_required: Please bind your Telegram account at
  // /settings to continue" and returned that text AS the model completion — so it
  // leaked to USERS on every AI feature that routed to Nara (memo, CV analyzer,
  // chat). Returning null makes everything fall back to the proven free providers
  // (Gemini/Groq). Re-enable only after binding Telegram on the Nara account:
  // set NARA_ENABLED=1 in the env.
  if (!process.env.NARA_ENABLED) return null;
  const nara = getNaraProvider();
  if (!nara) return null;
  return { provider: "nara", modelName: NARA_MODEL, model: nara.chat(NARA_MODEL) };
}

// ----------------------------------------------------------------------------
// pickAgentModel — choose the best available LLM for the chat agent
// ----------------------------------------------------------------------------
// Priority:
//   1) Honor AI_AGENT_MODEL env var if set ("groq:..." or "gemini:...")
//   2) Otherwise prefer Groq gpt-oss-120b (best at structured output)
//   3) Fall back to Gemini Flash Lite
// Throws if NO provider is configured — every tenant must have at least
// one API key in env. The error message is bilingual so the surfaced
// 500 in the UI tells HR what to do.
export function pickAgentModel(): AgentModelInfo {
  const groq = getGroqProvider();
  const google = getGoogleProvider();

  // 1) Explicit override via env var
  const override = process.env.AI_AGENT_MODEL;
  if (override) {
    const [providerName, ...rest] = override.split(":");
    const modelName = rest.join(":");
    if (providerName === "groq" && groq && modelName) {
      return { provider: "groq", modelName, model: groq(modelName) };
    }
    if (providerName === "gemini" && google && modelName) {
      return { provider: "gemini", modelName, model: google(modelName) };
    }
    // fall through to defaults if the override is malformed
  }

  // NOTE: Nara is NOT primary here. This picker feeds tool-using flows (e.g.
  // the support chat's diagnostics/ticket tools), and tool-calling via the Nara
  // OpenAI-compatible router proved unreliable (the agent claimed actions done
  // that never executed). Proven tool-callers (Groq/Gemini) go first; Nara stays
  // as the big-quota FALLBACK via availableModels() so features never hard-stop.

  // 2) Default: Groq gpt-oss-120b — bullet-proof for complex schemas + tools.
  // The 20B variant intermittently returns "Failed to generate JSON"
  // for the SEO / Personas / Ad-copy schemas which have 10-25 items
  // each with nested enums. 120B handles them reliably; same json_schema
  // + tool-calling support, same 30 RPM, just lower RPD (30k vs 100k).
  // RPD isn't the bottleneck for a Marketing Studio that runs a few
  // dozen requests per active tenant per day.
  if (groq) {
    return {
      provider: "groq",
      modelName: "openai/gpt-oss-120b",
      model: groq("openai/gpt-oss-120b"),
    };
  }

  // 3) Fallback: Gemini Flash Lite — works with just GEMINI_API_KEY
  if (google) {
    return {
      provider: "gemini",
      modelName: "gemini-2.5-flash-lite",
      model: google("gemini-2.5-flash-lite"),
    };
  }

  throw new Error(
    "AI configuration missing — set GROQ_API_KEY (recommended) or GEMINI_API_KEY in env",
  );
}

// ----------------------------------------------------------------------------
// pickAgentModelLargeContext — preferred picker for the /api/ai/agent route
// ----------------------------------------------------------------------------
// The agent route differs from Marketing Studio / single-shot generations:
//   - File uploads (Excel/PDF) inject 5-12k tokens of JSON into the messages
//   - Tool calls + multi-turn confirmations stack up history fast
//   - System prompt is large (~3k tokens of Arabic instructions + column maps)
// Groq's free tier caps gpt-oss-120b at 8k TPM and gpt-oss-20b at 12k TPM
// per request, which 80-employee imports routinely blow through ("Request
// too large for model openai/gpt-oss-120b ... Limit 8000, Requested 12672").
//
// Gemini Flash Lite's free tier has a much higher per-request budget
// (1M+ tokens). So for the agent specifically, we prefer Gemini first
// and fall back to Groq only when Gemini isn't configured.
//
// This is OPPOSITE of pickAgentModel()'s normal Groq-first ordering.
// We keep the normal helper for everything else (chat assistant, marketing
// studio tools) where requests are tiny and Groq's latency wins.
export function pickAgentModelLargeContext(): AgentModelInfo {
  const groq = getGroqProvider();
  const google = getGoogleProvider();

  // Honor explicit operator override first.
  const override = process.env.AI_AGENT_MODEL;
  if (override) {
    const [providerName, ...rest] = override.split(":");
    const modelName = rest.join(":");
    if (providerName === "groq" && groq && modelName) {
      return { provider: "groq", modelName, model: groq(modelName) };
    }
    if (providerName === "gemini" && google && modelName) {
      return { provider: "gemini", modelName, model: google(modelName) };
    }
  }

  // NaraRouter primary when configured (big free daily pool; mimo models even
  // carry a 1M context). Gemini/Groq stay as automatic fallbacks.
  const nara = naraModelInfo();
  if (nara) return nara;

  // 1) Gemini first — TPM headroom for file uploads.
  if (google) {
    return {
      provider: "gemini",
      modelName: "gemini-2.5-flash",
      model: google("gemini-2.5-flash"),
    };
  }

  // 2) Groq as fallback. gpt-oss-20b has 12k TPM (vs 120b's 8k), giving
  //    SLIGHTLY more room for file context. Still tight; if even this
  //    fails the agent will surface the TPM error.
  if (groq) {
    return {
      provider: "groq",
      modelName: "openai/gpt-oss-20b",
      model: groq("openai/gpt-oss-20b"),
    };
  }

  throw new Error(
    "AI configuration missing — set GEMINI_API_KEY (recommended for agent) or GROQ_API_KEY",
  );
}

// ----------------------------------------------------------------------------
// pickAgentModelStreaming — picker for the STREAMING conversational agent
// (/api/ai/agent), which uses `streamText` (one model per request, NO mid-
// stream fallback) and a heavy payload.
// ----------------------------------------------------------------------------
// That route carries a ~8.5k-token FIXED overhead (its big Arabic system prompt
// enumerates all 21 tools, plus the 21 tool schemas the SDK serializes) BEFORE
// any conversation, and it runs up to 10 tool steps per turn — each step re-
// sends the whole payload AND accumulates tool results. So:
//   - Groq free tier (gpt-oss-120b 8k TPM, 20b 12k TPM) CANNOT host it — the
//     payload balloons past the cap mid-loop ("Request too large").
//   - It MUST run on a 1M-context model = Gemini.
//
// Among Gemini free models we pick **flash-lite**, NOT flash, because:
//   - same 1M context (fits the payload), tool-calling supported;
//   - LARGER free daily quota (≈1000 RPD vs flash's ≈250) — a 10-call-per-turn
//     agent drains a small quota fast, which is exactly what caused the
//     "وصلنا الحد المؤقت" (RESOURCE_EXHAUSTED) failures;
//   - a SEPARATE quota bucket from flash, which CV screening + /api/ai/chat
//     use — so those and the agent no longer starve each other.
// Groq gpt-oss-20b is the last-resort fallback for Gemini-less deployments
// (size-fragile on this route, but better than a hard 500).
export function pickAgentModelStreaming(): AgentModelInfo {
  const groq = getGroqProvider();
  const google = getGoogleProvider();

  const override = process.env.AI_AGENT_MODEL;
  if (override) {
    const [providerName, ...rest] = override.split(":");
    const modelName = rest.join(":");
    if (providerName === "groq" && groq && modelName) {
      return { provider: "groq", modelName, model: groq(modelName) };
    }
    if (providerName === "gemini" && google && modelName) {
      return { provider: "gemini", modelName, model: google(modelName) };
    }
  }

  // The 21-tool agent MUST execute tools reliably — claiming "done" without
  // actually calling a tool is worse than a rate-limit. Tool-calling through the
  // Nara router proved unreliable, so the agent uses a PROVEN tool-caller
  // (Gemini flash-lite, then Groq). streamText pins one model (no fallback), so
  // reliability beats Nara's bigger quota here; the onError net + the user's
  // retry cover the rarer quota stop.
  if (google) {
    return {
      provider: "gemini",
      modelName: "gemini-2.5-flash-lite",
      model: google("gemini-2.5-flash-lite"),
    };
  }

  if (groq) {
    return {
      provider: "groq",
      modelName: "openai/gpt-oss-20b",
      model: groq("openai/gpt-oss-20b"),
    };
  }

  throw new Error(
    "AI configuration missing — set GEMINI_API_KEY (recommended for the agent) or GROQ_API_KEY in env",
  );
}

// ----------------------------------------------------------------------------
// pickFallbackAgentModel — used when the primary returns a quota error
// ----------------------------------------------------------------------------
// Returns the OTHER configured provider, so an exhausted Groq quota falls
// through to Gemini and vice-versa. Returns null if no fallback is
// available, meaning the caller should surface the original error.
export function pickFallbackAgentModel(
  primary: AgentModelInfo,
): AgentModelInfo | null {
  const groq = getGroqProvider();
  const google = getGoogleProvider();

  if (primary.provider === "groq") {
    // Chain: 120B (primary) -> 20B -> llama-4-scout -> Gemini
    if (groq && primary.modelName === "openai/gpt-oss-120b") {
      return {
        provider: "groq",
        modelName: "openai/gpt-oss-20b",
        model: groq("openai/gpt-oss-20b"),
      };
    }
    if (groq && primary.modelName === "openai/gpt-oss-20b") {
      return {
        provider: "groq",
        modelName: "meta-llama/llama-4-scout-17b-16e-instruct",
        model: groq("meta-llama/llama-4-scout-17b-16e-instruct"),
      };
    }
    // If we're already on Llama 4 Scout, fall through to Gemini.
    if (google) {
      return {
        provider: "gemini",
        modelName: "gemini-2.5-flash-lite",
        model: google("gemini-2.5-flash-lite"),
      };
    }
  }

  if (primary.provider === "gemini") {
    if (groq) {
      return {
        provider: "groq",
        modelName: "openai/gpt-oss-120b",
        model: groq("openai/gpt-oss-120b"),
      };
    }
  }

  return null;
}

// ----------------------------------------------------------------------------
// pickHighTpmModel — on a "Request too large / TPM / context-length" error,
// stepping the Groq family 120b→20b→scout may STILL be too small. Jump
// straight to the model with the most per-request headroom available:
//   Gemini 2.5 Flash (1M+ tokens) > Groq gpt-oss-20b (12k) > nothing.
// Returns null if no model bigger than `current` is configured.
// ----------------------------------------------------------------------------
export function pickHighTpmModel(
  current: AgentModelInfo,
): AgentModelInfo | null {
  const groq = getGroqProvider();
  const google = getGoogleProvider();

  // Gemini Flash has the largest budget by far — prefer it unless we're
  // already on a Gemini model.
  if (google && current.provider !== "gemini") {
    return {
      provider: "gemini",
      modelName: "gemini-2.5-flash",
      model: google("gemini-2.5-flash"),
    };
  }
  // No Gemini key (Groq-only deployment): 20b's 12k TPM beats 120b's 8k.
  if (
    groq &&
    current.provider === "groq" &&
    current.modelName !== "openai/gpt-oss-20b"
  ) {
    return {
      provider: "groq",
      modelName: "openai/gpt-oss-20b",
      model: groq("openai/gpt-oss-20b"),
    };
  }
  return null;
}

// ----------------------------------------------------------------------------
// friendlyAiError — map any provider error to a short Arabic message safe to
// show end users. NEVER leaks raw English / model names / TPM internals (the
// "Request too large for model openai/gpt-oss-120b ... Limit 8000" string).
// Used by the streaming routes' onError handlers.
// ----------------------------------------------------------------------------
export function friendlyAiError(err: unknown): string {
  if (isContextTooLargeError(err)) {
    return "الرسالة طويلة شوية على المساعد — اختصرها أو ابدأ محادثة جديدة وجرّب تاني 🙏";
  }
  if (isQuotaError(err)) {
    return "المساعد عليه ضغط دلوقتي (وصلنا الحد المؤقت) — جرّب تاني بعد دقيقة 🙏";
  }
  return "حصل خطأ مؤقت في المساعد — جرّب تاني بعد لحظات. لو تكرر، سجّله من صفحة مهندس النظام.";
}

// ----------------------------------------------------------------------------
// isQuotaError — heuristic to detect "free tier exhausted" errors so the
// caller can swap to a fallback model gracefully.
// ----------------------------------------------------------------------------
export function isQuotaError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("quota") ||
    lower.includes("rate limit") ||
    lower.includes("rate-limit") ||
    lower.includes("429") ||
    lower.includes("exceeded") ||
    lower.includes("resource_exhausted")
  );
}

// ----------------------------------------------------------------------------
// isContextTooLargeError — the request exceeded the model's PER-REQUEST token
// budget (Groq free tier caps gpt-oss-120b at 8k TPM, 20b at 12k). This is NOT
// a "wait and it clears" quota — retrying the SAME model always fails. The fix
// is to jump to a model with more headroom (Gemini Flash = 1M+), which
// callWithFallback does when this returns true.
//
// Groq surfaces it as: "Request too large for model `openai/gpt-oss-120b` ...
// on tokens per minute (TPM): Limit 8000, Requested 9005, please reduce your
// message size and try again." Other providers say "context length exceeded".
// ----------------------------------------------------------------------------
export function isContextTooLargeError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  const lower = msg.toLowerCase();
  return (
    lower.includes("request too large") ||
    lower.includes("too large") ||
    lower.includes("tokens per minute") ||
    lower.includes("tpm") ||
    lower.includes("reduce your message size") ||
    lower.includes("context length") ||
    lower.includes("context_length_exceeded") ||
    lower.includes("maximum context") ||
    lower.includes("context window") ||
    lower.includes("too many tokens") ||
    lower.includes("input is too long") ||
    lower.includes("prompt is too long") ||
    lower.includes("string too long") ||
    // HTTP 413 Payload Too Large
    lower.includes("413")
  );
}

// ----------------------------------------------------------------------------
// isRetryableError — broader detector covering quota AND transient
// provider-side outages (model overload, 5xx, "high demand", timeouts).
// We retry these via the fallback chain instead of bubbling them up.
// ----------------------------------------------------------------------------
export function isRetryableError(err: unknown): boolean {
  if (!err) return false;
  const msg =
    typeof err === "string"
      ? err
      : err instanceof Error
        ? err.message
        : JSON.stringify(err);
  const lower = msg.toLowerCase();
  return (
    isQuotaError(err) ||
    // "Request too large / TPM / context length" — fixable by swapping to a
    // bigger-context model, which callWithFallback does on this signal.
    isContextTooLargeError(err) ||
    lower.includes("overloaded") ||
    lower.includes("high demand") ||
    lower.includes("currently experiencing") ||
    lower.includes("temporarily") ||
    lower.includes("service unavailable") ||
    lower.includes("internal server error") ||
    lower.includes("bad gateway") ||
    lower.includes("gateway timeout") ||
    lower.includes("503") ||
    lower.includes("502") ||
    lower.includes("504") ||
    lower.includes("500") ||
    lower.includes("etimedout") ||
    lower.includes("econnreset") ||
    lower.includes("aborted") ||
    // Treat "model capability mismatch" as retryable so the fallback
    // chain can swap to a compatible model. Most commonly hit when an
    // older Groq model is asked for json_schema (only json_object support).
    lower.includes("does not support response format") ||
    lower.includes("response_format") ||
    lower.includes("does not support") ||
    lower.includes("not supported") ||
    // Treat schema-validation failures as retryable so a smaller model
    // that produced syntactically-bad JSON falls through to a bigger
    // one. Groq surfaces this as "Failed to generate JSON. Please
    // adjust your prompt. See 'failed_generation'". Happens most on
    // complex schemas (SEO with 10-25 keyword objects).
    lower.includes("failed to generate json") ||
    lower.includes("failed_generation") ||
    lower.includes("adjust your prompt") ||
    // Vercel AI SDK wraps schema-validation issues as AI_NoObject /
    // AI_TypeValidation / no-object-generated errors. Same fallback
    // logic applies — let a bigger / different-family model try.
    lower.includes("no-object-generated") ||
    lower.includes("no object generated") ||
    lower.includes("ai_noobject") ||
    lower.includes("typevalidation")
  );
}

// ----------------------------------------------------------------------------
// callWithFallback — run an AI request through the model chain. If the
// primary returns a retryable error (overload, quota, 5xx), automatically
// retry with the next model in the fallback chain. Surfaces the LAST
// error if every provider in the chain fails.
//
// Use this from any feature that wants resilient AI calls without
// hand-rolling the retry logic per call site.
//
// `pickPrimary` lets the caller flip the chain head: most features want
// the default Groq-first order (`pickAgentModel`); the chat-agent / file-
// upload routes need `pickAgentModelLargeContext` (Gemini first) because
// Groq's per-request TPM cap chokes on 5-12k-token file payloads.
// Either way the FALLBACK direction is symmetric — pickFallbackAgentModel
// flips providers, so a Gemini-first chain still falls back through Groq.
// ----------------------------------------------------------------------------
// All configured models, in a sensible fallback order: BOTH Gemini buckets
// first (1M context; flash + flash-lite are SEPARATE free-tier quota buckets,
// so when flash is exhausted flash-lite still works), then Groq tiers ordered
// by per-request budget (20b 12k → 120b 8k → scout). callWithFallback dedupes
// this against the chosen primary so each model is attempted at most once.
function availableModels(): AgentModelInfo[] {
  const groq = getGroqProvider();
  const google = getGoogleProvider();
  const list: AgentModelInfo[] = [];
  // NaraRouter first — biggest free daily pool, so callWithFallback routes spill
  // onto it before exhausting Gemini/Groq.
  const nara = naraModelInfo();
  if (nara) list.push(nara);
  if (google) {
    list.push({ provider: "gemini", modelName: "gemini-2.5-flash", model: google("gemini-2.5-flash") });
    list.push({ provider: "gemini", modelName: "gemini-2.5-flash-lite", model: google("gemini-2.5-flash-lite") });
  }
  if (groq) {
    list.push({ provider: "groq", modelName: "openai/gpt-oss-20b", model: groq("openai/gpt-oss-20b") });
    list.push({ provider: "groq", modelName: "openai/gpt-oss-120b", model: groq("openai/gpt-oss-120b") });
    list.push({ provider: "groq", modelName: "meta-llama/llama-4-scout-17b-16e-instruct", model: groq("meta-llama/llama-4-scout-17b-16e-instruct") });
  }
  return list;
}

export async function callWithFallback<T>(
  fn: (model: AgentModelInfo) => Promise<T>,
  pickPrimary: () => AgentModelInfo = pickAgentModel,
): Promise<T> {
  const tried: string[] = [];
  let lastError: unknown = null;

  // Build ONE deduped chain: the caller's primary first, then every other
  // configured model. Each model is attempted AT MOST ONCE. This kills the
  // ping-pong the old pairwise fallback caused (gemini→groq→gemini→groq…) and
  // guarantees we actually reach gemini-2.5-flash-lite — the fresh quota bucket
  // / 1M-context escape for "Request too large" when flash is exhausted.
  const chain: AgentModelInfo[] = [];
  const seen = new Set<string>();
  const add = (m: AgentModelInfo | null) => {
    if (!m) return;
    const k = `${m.provider}:${m.modelName}`;
    if (!seen.has(k)) {
      seen.add(k);
      chain.push(m);
    }
  };
  add(pickPrimary());
  for (const m of availableModels()) add(m);

  // Once a request proves too large, the model with the SMALLEST per-request
  // budget (Groq gpt-oss-120b = 8k TPM) can't possibly fit — skip it.
  let tooLargeSeen = false;

  for (const cursor of chain) {
    if (
      tooLargeSeen &&
      cursor.provider === "groq" &&
      cursor.modelName === "openai/gpt-oss-120b"
    ) {
      continue;
    }
    const label = `${cursor.provider}:${cursor.modelName}`;
    tried.push(label);
    try {
      return await fn(cursor);
    } catch (err) {
      lastError = err;
      console.warn(`[ai-models] ${label} failed:`, errorSummary(err));
      if (!isRetryableError(err)) {
        // Non-retryable: bail immediately (e.g. bad schema, auth issue).
        throw err;
      }
      if (isContextTooLargeError(err)) tooLargeSeen = true;
    }
  }

  // Build a SPECIFIC error message that tells the operator exactly
  // what's wrong + what to do about it. Three branches:
  //   1) Only one provider was configured AND it hit quota — biggest
  //      fix is adding a second free API key (Groq is the easy one).
  //   2) Both providers were tried + quota — wait or upgrade plan.
  //   3) Pure transient overload — just retry in a minute.
  const msg =
    lastError instanceof Error ? lastError.message : String(lastError);
  const isQuota = isQuotaError(lastError);
  const hasGroq = !!process.env.GROQ_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const onlyOneProvider = !hasGroq || !hasGemini;

  if (isQuota && onlyOneProvider) {
    const missing = !hasGroq ? "GROQ_API_KEY" : "GEMINI_API_KEY";
    const signupUrl = !hasGroq
      ? "https://console.groq.com/keys"
      : "https://aistudio.google.com/app/apikey";
    const dailyLimit = !hasGroq
      ? "14,000 request/يوم مجاناً"
      : "1,500 request/يوم";
    throw new Error(
      `وصلنا للحد اليومي للـ AI ولسه ما عندكش provider ثاني. ` +
        `الحل: ضيف مفتاح ${missing} (مجاني — ${dailyLimit}) من ${signupUrl} ` +
        `وحطه في Vercel Environment Variables. اللي اتجرّب: ${tried.join(" → ")}.`,
    );
  }

  if (isQuota) {
    throw new Error(
      `وصلنا للحد اليومي لكل الـ AI providers. استنى لبكرة (الـ quota بتتجدد كل 24 ساعة) أو ارفع الـ Gemini لخطة مدفوعة. اللي اتجرّب: ${tried.join(" → ")}.`,
    );
  }

  throw new Error(
    `كل الـ AI providers مزدحمين دلوقتي. جرّب بعد دقيقة. (${tried.join(" → ")}) — ${msg.slice(0, 100)}`,
  );
}

function errorSummary(err: unknown): string {
  if (err instanceof Error) {
    return err.message.slice(0, 200);
  }
  return String(err).slice(0, 200);
}

// ----------------------------------------------------------------------------
// pickPdfModel — multimodal model for PDF OCR/extraction.
// Groq's Llama lineup doesn't support image/PDF input, so we always use
// Gemini here. The chat agent's higher-RPM path doesn't apply because
// PDF uploads are much lower volume than chat turns anyway.
// ----------------------------------------------------------------------------
export function pickPdfModel() {
  const google = getGoogleProvider();
  if (!google) {
    throw new Error(
      "PDF parsing requires GEMINI_API_KEY (multimodal/OCR not available on Groq)",
    );
  }
  return google("gemini-2.5-flash");
}

// ----------------------------------------------------------------------------
// multimodalModelChain — ordered fallback for FILE-reading (PDF/image) calls.
// Groq has no vision, so this is Gemini-only — but flash and flash-lite are
// SEPARATE free-tier quota buckets, so when flash is exhausted ("You exceeded
// your current quota") flash-lite often still has room. Callers should loop
// this with maxRetries:0 and fall through on isRetryableError — retrying the
// SAME exhausted model (the SDK default) is pointless for a quota error.
// ----------------------------------------------------------------------------
export function multimodalModelChain(): {
  modelName: string;
  model: LanguageModel;
}[] {
  const google = getGoogleProvider();
  if (!google) return [];
  return [
    { modelName: "gemini-2.5-flash", model: google("gemini-2.5-flash") },
    { modelName: "gemini-2.5-flash-lite", model: google("gemini-2.5-flash-lite") },
  ];
}

// ----------------------------------------------------------------------------
// Provider availability summary — surfaced in /admin so the operator can
// see which keys are configured without exposing them.
// ----------------------------------------------------------------------------
export function getProviderStatus() {
  return {
    groq: !!process.env.GROQ_API_KEY,
    gemini: !!process.env.GEMINI_API_KEY,
    primary: process.env.GROQ_API_KEY
      ? "groq:openai/gpt-oss-120b"
      : process.env.GEMINI_API_KEY
        ? "gemini:gemini-2.5-flash-lite"
        : "none",
  };
}

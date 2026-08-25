// ============================================================
// 👑 KIRONG AI — IMAGE GENERATION ENGINE V1
// Pollinations.ai (primary, free) + Hugging Face (fallback)
// ============================================================

"use strict";

const HUGGINGFACE_KEYS = parseKeys(
  process.env.HUGGINGFACE_API_KEYS ||
  process.env.HUGGINGFACE_API_KEY
);

// Fast, free-tier-friendly model. Override with an env var if you
// prefer a different Hugging Face text-to-image model.
const HF_MODEL =
  process.env.HUGGINGFACE_IMAGE_MODEL ||
  "black-forest-labs/FLUX.1-schnell";

const MAX_PROMPT_LENGTH = 600;

// Give the function more headroom than the default 10s, and bail out
// of a slow provider before Vercel kills the whole function — that's
// what was producing the raw platform-crash "[object Object]" error.
export const config = {
  maxDuration: 30
};

const PROVIDER_TIMEOUT_MS = 12000;

async function fetchWithTimeout(url, options = {}, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ============================================================
// 🧩 PARSE MULTIPLE API KEYS (same pattern as chat.js)
// ============================================================

function parseKeys(value) {
  if (!value) return [];
  return String(value)
    .split(/[\n,]+/)
    .map(key => key.trim())
    .filter(Boolean);
}

function rotateKey(keys, index) {
  if (!keys.length) return null;
  return keys[index % keys.length];
}

// ============================================================
// 🧹 CLEAN PROMPT
// ============================================================

function cleanPrompt(prompt) {
  if (typeof prompt !== "string") return "";
  return prompt.trim().slice(0, MAX_PROMPT_LENGTH);
}

// ============================================================
// 👤 GET USER ID (kept for future Pro-gating in Phase 4 —
// not enforced yet, so this endpoint doesn't touch users.js)
// ============================================================

function getUserId(req, body) {
  const fromBody = body?.userId;
  const fromHeader = req.headers["x-kirong-user-id"];
  const id = fromBody || fromHeader || "anonymous";
  return String(id).trim().slice(0, 100);
}

// ============================================================
// 🎨 PROVIDER 1: POLLINATIONS.AI (free, no API key, URL-based)
// ============================================================

async function tryPollinations(prompt) {
  const seed = Math.floor(Math.random() * 1000000);

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1024&height=1024&seed=${seed}&nologo=true`;

  // Lightweight HEAD check so we don't return a broken URL to the
  // frontend, without downloading the full image on the server.
  const check = await fetchWithTimeout(url, { method: "HEAD" });

  if (!check.ok) {
    throw new Error(`Pollinations ${check.status}`);
  }

  return { provider: "pollinations", image: url };
}

// ============================================================
// 🎨 PROVIDER 2: HUGGING FACE INFERENCE API (fallback)
// ============================================================

async function tryHuggingFace(prompt) {
  if (!HUGGINGFACE_KEYS.length) {
    throw new Error("Hugging Face unavailable.");
  }

  const key = rotateKey(
    HUGGINGFACE_KEYS,
    Math.floor(Math.random() * HUGGINGFACE_KEYS.length)
  );

  const response = await fetchWithTimeout(
    `https://api-inference.huggingface.co/models/${HF_MODEL}`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${key}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ inputs: prompt })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    // HF sometimes returns 200 with a JSON error (e.g. "model is loading")
    const text = await response.text();
    throw new Error(`Hugging Face did not return an image: ${text.slice(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;

  return { provider: "huggingface", image: dataUrl };
}

// ============================================================
// 🌐 CORS
// ============================================================

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Kirong-User-Id");
  res.setHeader("Content-Type", "application/json; charset=utf-8");
}

// ============================================================
// 🚀 MAIN HANDLER
// ============================================================

export default async function handler(req, res) {
  setCors(res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed." });
  }

  try {
    const body = req.body || {};
    const prompt = cleanPrompt(body.prompt);

    if (!prompt) {
      return res.status(400).json({
        ok: false,
        error: "Describe what image you want."
      });
    }

    const userId = getUserId(req, body);
    void userId; // reserved for Phase 4 Pro-gating

    const providers = [tryPollinations, tryHuggingFace];
    const errors = [];
    let result = null;

    for (const tryProvider of providers) {
      try {
        result = await tryProvider(prompt);
        break;
      } catch (error) {
        const isTimeout = error?.name === "AbortError";
        errors.push(
          isTimeout
            ? `${tryProvider.name} timed out`
            : String(error?.message || "Unknown error").slice(0, 200)
        );
      }
    }

    if (!result) {
      throw new Error(`All image providers failed. ${JSON.stringify(errors)}`);
    }

    return res.status(200).json({
      ok: true,
      type: "image",
      image: result.image,
      provider: result.provider,
      prompt,
      text: "🎨 Here's your image!"
    });
  } catch (error) {
    console.error("KIRONG IMAGE ERROR:", error);

    return res.status(500).json({
      ok: false,
      type: "error",
      error: "Image generation is temporarily unavailable.",
      text: "Image generation is temporarily unavailable.",
      code: "IMAGE_SERVER_ERROR"
    });
  }
}

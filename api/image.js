// ============================================================
// 👑 KIRONG AI — IMAGE GENERATION ENGINE (Netlify Functions v2)
// Pollinations.ai (instant, primary) + Hugging Face (fallback)
// ------------------------------------------------------------
// Same logic as your Vercel version. Netlify's function timeout
// works differently from Vercel's (no `config.maxDuration` export
// — Netlify Functions default to a 10s synchronous limit, up to
// 26s if needed, configurable in netlify.toml if you ever need
// more), so that export was dropped; everything else is identical.
// ============================================================

"use strict";

export const config = { path: "/api/image" };

const HUGGINGFACE_KEYS = parseKeys(
  process.env.HUGGINGFACE_API_KEYS || process.env.HUGGINGFACE_API_KEY
);

const HF_MODEL = process.env.HUGGINGFACE_IMAGE_MODEL || "black-forest-labs/FLUX.1-schnell";
const MAX_PROMPT_LENGTH = 600;
const PROVIDER_TIMEOUT_MS = 8000;

async function fetchWithTimeout(url, options = {}, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseKeys(value) {
  if (!value) return [];
  return String(value).split(/[\n,]+/).map((key) => key.trim()).filter(Boolean);
}

function rotateKey(keys, index) {
  if (!keys.length) return null;
  return keys[index % keys.length];
}

function cleanPrompt(prompt) {
  if (typeof prompt !== "string") return "";
  return prompt.trim().slice(0, MAX_PROMPT_LENGTH);
}

function getUserId(req, body) {
  const fromBody = body?.userId;
  const fromHeader = req.headers.get("x-kirong-user-id");
  const id = fromBody || fromHeader || "anonymous";
  return String(id).trim().slice(0, 100);
}

// ============================================================
// 🎨 PROVIDER 1: POLLINATIONS.AI (free, no key, near-instant)
// ============================================================

function tryPollinations(prompt) {
  const seed = Math.floor(Math.random() * 1000000);

  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1024&height=1024&seed=${seed}&nologo=true`;

  return { provider: "pollinations", image: url };
}

// ============================================================
// 🎨 PROVIDER 2: HUGGING FACE INFERENCE API (fallback)
// ============================================================

async function tryHuggingFace(prompt) {
  if (!HUGGINGFACE_KEYS.length) {
    throw new Error("Hugging Face unavailable.");
  }

  const key = rotateKey(HUGGINGFACE_KEYS, Math.floor(Math.random() * HUGGINGFACE_KEYS.length));

  let response;
  try {
    response = await fetchWithTimeout(
      `https://api-inference.huggingface.co/models/${HF_MODEL}`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ inputs: prompt })
      }
    );
  } catch (error) {
    if (error?.name === "AbortError") {
      throw new Error("Hugging Face took too long to respond (likely a cold-start model load).");
    }
    throw error;
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face ${response.status}: ${errorText.slice(0, 300)}`);
  }

  const contentType = response.headers.get("content-type") || "";

  if (!contentType.startsWith("image/")) {
    const text = await response.text();
    throw new Error(`Hugging Face did not return an image: ${text.slice(0, 200)}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  const dataUrl = `data:${contentType};base64,${base64}`;

  return { provider: "huggingface", image: dataUrl };
}

// ============================================================
// 🌐 RESPONSE HELPERS
// ============================================================

function corsHeaders(extra = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Kirong-User-Id",
    ...extra
  };
}

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: corsHeaders({ "Content-Type": "application/json; charset=utf-8" })
  });
}

// ============================================================
// 🚀 MAIN HANDLER
// ============================================================

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const prompt = cleanPrompt(body.prompt);

    if (!prompt) {
      return jsonResponse({ ok: false, error: "Describe what image you want." }, 400);
    }

    const userId = getUserId(req, body);
    void userId; // reserved for future Pro-gating

    // Pollinations first — synchronous, essentially free in function time.
    const result = tryPollinations(prompt);

    return jsonResponse({
      ok: true,
      type: "image",
      image: result.image,
      provider: result.provider,
      prompt,
      text: "🎨 Here's your image!"
    });
  } catch (error) {
    console.error("KIRONG IMAGE ERROR:", error);
    return jsonResponse(
      {
        ok: false,
        type: "error",
        error: "Image generation is temporarily unavailable.",
        text: "Image generation is temporarily unavailable.",
        code: "IMAGE_SERVER_ERROR"
      },
      500
    );
  }
};

// ============================================================
// 👑 KIRONG AI — HD VOICE (TEXT-TO-SPEECH) ENGINE (Netlify Functions v2)
// Hugging Face MMS-TTS — including a real Swahili voice, which
// browser TTS often lacks on many devices.
// ============================================================

"use strict";

export const config = { path: "/api/tts" };

const HUGGINGFACE_KEYS = parseKeys(
  process.env.HUGGINGFACE_API_KEYS || process.env.HUGGINGFACE_API_KEY
);

const TTS_MODEL_SW = process.env.HUGGINGFACE_TTS_MODEL_SW || "facebook/mms-tts-swa";
const TTS_MODEL_EN = process.env.HUGGINGFACE_TTS_MODEL_EN || "facebook/mms-tts-eng";

const MAX_TEXT_LENGTH = 600;
const PROVIDER_TIMEOUT_MS = 8000;

function parseKeys(value) {
  if (!value) return [];
  return String(value).split(/[\n,]+/).map((k) => k.trim()).filter(Boolean);
}

function rotateKey(keys, index) {
  if (!keys.length) return null;
  return keys[index % keys.length];
}

async function fetchWithTimeout(url, options = {}, timeoutMs = PROVIDER_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function cleanText(text) {
  if (typeof text !== "string") return "";
  return text.trim().slice(0, MAX_TEXT_LENGTH);
}

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

export default async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "Method not allowed." }, 405);
  }

  try {
    if (!HUGGINGFACE_KEYS.length) {
      return jsonResponse(
        { ok: false, error: "HD voice isn't configured yet.", code: "TTS_NOT_CONFIGURED" },
        503
      );
    }

    let body = {};
    try { body = await req.json(); } catch { body = {}; }

    const text = cleanText(body.text);
    const lang = body.lang === "sw" ? "sw" : "en";

    if (!text) {
      return jsonResponse({ ok: false, error: "No text to speak." }, 400);
    }

    const model = lang === "sw" ? TTS_MODEL_SW : TTS_MODEL_EN;
    const key = rotateKey(HUGGINGFACE_KEYS, Math.floor(Math.random() * HUGGINGFACE_KEYS.length));

    let response;
    try {
      response = await fetchWithTimeout(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ inputs: text })
        }
      );
    } catch (error) {
      if (error?.name === "AbortError") {
        return jsonResponse(
          { ok: false, error: "Voice generation took too long (model may be cold-starting). Try again in a moment.", code: "TTS_TIMEOUT" },
          504
        );
      }
      throw error;
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Hugging Face TTS ${response.status}: ${errorText.slice(0, 200)}`);
    }

    const contentType = response.headers.get("content-type") || "";

    if (!contentType.startsWith("audio/")) {
      const text2 = await response.text();
      throw new Error(`Hugging Face TTS did not return audio: ${text2.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const dataUrl = `data:${contentType};base64,${base64}`;

    return jsonResponse({ ok: true, audio: dataUrl });
  } catch (error) {
    console.error("KIRONG TTS ERROR:", error);
    return jsonResponse(
      { ok: false, error: "Voice generation is temporarily unavailable.", code: "TTS_SERVER_ERROR" },
      500
    );
  }
};

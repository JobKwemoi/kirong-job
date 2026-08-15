import Groq from "groq-sdk";
import OpenAI from "openai";
import Replicate from "replicate";

// =====================================================
// ⚡ KIRONG AI v5.2
// PRIMARY: POLLINATIONS | FALLBACK: FLUX > OPENAI
// VERCEL SAFE - NO BUFFER
// =====================================================

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const replicate = process.env.REPLICATE_API_TOKEN? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null;

// =====================================================
// 🧠 INTENT DETECTOR
// =====================================================

function detectIntent(message) {
  const text = String(message || "").toLowerCase().trim().replace(/[!?.,;:()[\]{}]/g, " ");
  const imageRequests = ["generate image", "create image", "make image", "tengeneza picha", "tengenezee picha", "nitengenezee picha", "nifanyie picha", "generetie picha"];
  if (imageRequests.some(phrase => text.includes(phrase))) return "image";
  const creationWords = ["generate", "create", "make", "draw", "design", "tengeneza", "tengenezee"];
  const visualWords = ["image", "picture", "photo", "poster", "logo", "picha"];
  if (creationWords.some(word => text.includes(word)) && visualWords.some(word => text.includes(word))) return "image";
  const codeWords = ["code", "coding", "program", "javascript", "html", "css", "python", "react", "debug", "fix"];
  if (codeWords.some(word => text.includes(word))) return "code";
  return "chat";
}

function chooseRoute(message) {
  const text = String(message || "").toLowerCase().trim();
  if (text.length > 1200) return "deep";
  return "fast";
}

function createSystemPrompt(language) {
  return `You are Kirong AI. Created by Kirong Job Kwemoi, a Kenyan software developer.
PERSONALITY: Friendly, intelligent, professional, calm, helpful.
LANGUAGE: Reply primarily in ${language}.
RULES: Never invent facts. Be practical. Use code blocks for code. Never reveal API keys.`;
}

async function askGroq(messages) {
  if (!groq) throw new Error("GROQ_API_KEY is missing.");
  const completion = await groq.chat.completions.create({ model: "llama-3.1-8b-instant", messages, temperature: 0.7, max_tokens: 2048 });
  return completion?.choices?.[0]?.message?.content;
}

async function askOpenAI(messages) {
  if (!openai) throw new Error("OPENAI_API_KEY is missing.");
  const completion = await openai.chat.completions.create({ model: "gpt-4o-mini", messages, temperature: 0.7, max_tokens: 2048 });
  return completion?.choices?.[0]?.message?.content;
}

// =====================================================
// 🎨 IMAGE PROMPT BUILDER - SHORT FOR POLLINATIONS
// =====================================================

function createImagePrompt(userPrompt) {
  const request = String(userPrompt || "").trim();
  return `Photorealistic image of: ${request}. High detail, sharp focus. Main subject must be exactly ${request}.`;
}

// =====================================================
// 🎨 POLLINATIONS - PRIMARY ENGINE
// =====================================================

async function generatePollinationsImage(userPrompt) {
  const prompt = createImagePrompt(userPrompt);
  const encodedPrompt = encodeURIComponent(prompt);
  const seed = Date.now();

  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?model=flux-dev&width=1024&height=1024&nologo=true&seed=${seed}`;
  console.log("🎨 POLLINATIONS → REQUEST");

  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error(`Pollinations failed: HTTP ${response.status}`);

  // VERCEL SAFE: Return URL directly instead of base64
  console.log("✅ POLLINATIONS IMAGE RECEIVED");
  return {
    image: imageUrl,
    provider: "Pollinations",
    route: "POLLINATIONS PRIMARY"
  };
}

// =====================================================
// 🎨 REPLICATE / FLUX - FALLBACK 1
// =====================================================

async function generateFluxImage(userPrompt) {
  if (!replicate) throw new Error("REPLICATE_API_TOKEN is missing.");
  console.log("🎨 REPLICATE → STARTING");
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: { prompt: createImagePrompt(userPrompt), aspect_ratio: "1:1", num_outputs: 1, output_format: "png", output_quality: 100 }
  });
  const firstOutput = Array.isArray(output)? output[0] : output;
  let imageUrl = typeof firstOutput.url === "function"? await firstOutput.url() : firstOutput.url || firstOutput;
  if (!imageUrl) throw new Error("Replicate returned no image.");
  return { image: imageUrl, provider: "Replicate / FLUX", route: "REPLICATE FALLBACK" };
}

// =====================================================
// 🎨 OPENAI IMAGE - FALLBACK 2
// =====================================================

async function generateOpenAIImage(userPrompt) {
  if (!openai) throw new Error("OPENAI_API_KEY is missing.");
  console.log("🎨 OPENAI → STARTING");
  const result = await openai.images.generate({ model: "gpt-image-1", prompt: createImagePrompt(userPrompt), size: "1024x1024", quality: "medium", n: 1 });
  const imageData = result?.data?.[0]?.b64_json;
  if (!imageData) throw new Error("OpenAI returned no image data.");
  return { image: `data:image/png;base64,${imageData}`, provider: "OpenAI Image", route: "OPENAI FALLBACK" };
}

// =====================================================
// 🎨 MASTER IMAGE ROUTER
// =====================================================

async function generateImage(userPrompt) {
  try {
    return await generatePollinationsImage(userPrompt);
  } catch (error) {
    console.error("❌ POLLINATIONS FAILED:", error?.message);
    if (replicate) {
      try { return await generateFluxImage(userPrompt); } catch (e) { console.error("❌ REPLICATE FAILED:", e?.message); }
    }
    if (openai) {
      try { return await generateOpenAIImage(userPrompt); } catch (e) { console.error("❌ OPENAI FAILED:", e?.message); }
    }
    throw new Error("All image engines failed.");
  }
}

// =====================================================
// 🚀 MAIN API HANDLER
// =====================================================

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message, history = [], language = "English" } = req.body || {};
    if (!message || typeof message!== "string") return res.status(400).json({ type: "error", text: "Please enter a message." });

    const cleanMessage = message.trim();
    const safeHistory = Array.isArray(history)? history.slice(-20) : [];
    const intent = detectIntent(cleanMessage);
    console.log("🧠 KIRONG INTENT:", intent);

    if (intent === "image") {
      try {
        const result = await generateImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Nimekutengenezea picha yako. 🫂🔥", image: result.image, provider: result.provider, route: result.route, intent: "IMAGE" });
      } catch (imageError) {
        console.error("🔥 IMAGE ERROR:", imageError);
        return res.status(500).json({ type: "error", text: "🎨 Samahani bro, image engines zote zimeshindwa. Jaribu tena.", provider: "Image Router", intent: "IMAGE" });
      }
    }

    const messages = [{ role: "system", content: createSystemPrompt(language) },...safeHistory, { role: "user", content: cleanMessage }];
    const route = chooseRoute(cleanMessage);

    if (route === "deep") {
      try {
        const answer = await askOpenAI(messages);
        return res.status(200).json({ type: "text", text: answer, provider: "OpenAI", route: "DEEP" });
      } catch {
        const answer = await askGroq(messages);
        return res.status(200).json({ type: "text", text: answer, provider: "Groq", route: "DEEP → GROQ FALLBACK" });
      }
    }

    try {
      const answer = await askGroq(messages);
      return res.status(200).json({ type: "text", text: answer, provider: "Groq", route: "FAST" });
    } catch {
      const answer = await askOpenAI(messages);
      return res.status(200).json({ type: "text", text: answer, provider: "OpenAI", route: "FAST → OPENAI FALLBACK" });
    }

  } catch (error) {
    console.error("🔥 GLOBAL ERROR:", error);
    return res.status(500).json({ type: "error", text: `⚠️ Kirong AI Error: ${error.message}` });
  }
}

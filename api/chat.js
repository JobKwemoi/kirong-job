import Groq from "groq-sdk";
import OpenAI from "openai";
import Replicate from "replicate";

// =====================================================
// ⚡ KIRONG AI v5.0 SUPERPOWER
// Groq + OpenAI + FLUX + KENYA MODE
// NO POLLINATIONS - TOO UNRELIABLE
// =====================================================

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const replicate = process.env.REPLICATE_API_TOKEN? new Replicate({ auth: process.env.REPLICATE_API_TOKEN }) : null;

// =====================================================
// 🇰🇪 KENYA SUPERPOWERS
// =====================================================

function kenyaSuperpower(message) {
  const text = message.toLowerCase();

  // 1. M-PESA CALCULATOR
  if (text.includes("m-pesa") || text.includes("mpesa") || text.includes("shwari")) {
    return `💰 **M-PESA HELPER**\n\nNipe amount na nataka nikuhesabie:\n- M-PESA transaction fees\n- Mshwari interest ya 7.5% per year\n- KCB M-PESA rates\n\nMfano: "hesabu 50k kwa mshwari 3 months"`;
  }

  // 2. MATATU FARE
  if (text.includes("matatu") || text.includes("fare") || text.includes("nauli")) {
    return `🚌 **MATATU FARE GUIDE**\n\nNipe route nikuambie approximate fare:\n- Eldoret - Nairobi: ~800-1200 KES\n- Nairobi - Nakuru: ~300-400 KES\nUnaenda wapi captain?`;
  }

  // 3. BUSINESS IDEAS
  if (text.includes("biashara") || text.includes("business") || text.includes("pesa")) {
    return `💡 **KENYA BUSINESS IDEAS**\n\nNa 10k unaeza anza:\n1. **M-PESA Shop** - capital 8k-15k\n2. **Mama Mboga** - profit 500-1k per day\n3. **Mitumba** - Gikomba bales\n4. **Bodaboda** - daily 1k-2k\nUnataka niandike full business plan?`;
  }

  // 4. SHENG MODE
- if (text.includes("sheng") || text.includes("msee") || text.includes("niaje")) {
    return `🔥 **SHENG MODE ON**\n\nNiaje mshikaji! Niko hapa kukuassist. Uliza chochote kwa sheng nitakujibu poa 😎`;
  }

  return null;
}

// =====================================================
// 🧠 INTENT DETECTOR
// =====================================================

function detectIntent(message) {
  const text = String(message || "").toLowerCase().trim().replace(/[!?.,;:()[\]{}]/g, " ");
  const imageRequests = ["generate image", "create image", "make image", "tengeneza picha", "tengenezee picha", "nitengenezee picha", "nifanyie picha"];
  if (imageRequests.some(phrase => text.includes(phrase))) return "image";
  const creationWords = ["generate", "create", "make", "draw", "design", "tengeneza", "tengenezee", "nifanyie"];
  const visualWords = ["image", "picture", "photo", "poster", "logo", "picha"];
  if (creationWords.some(word => text.includes(word)) && visualWords.some(word => text.includes(word))) return "image";
  const codeWords = ["code", "coding", "program", "javascript", "html", "css", "python", "react", "node", "api", "website", "build", "fix", "debug"];
  if (codeWords.some(word => text.includes(word))) return "code";
  return "chat";
}

// =====================================================
// 🧠 SYSTEM PROMPT - SUPERPOWER
// =====================================================

function createSystemPrompt(language) {
  return `You are Kirong AI v5.0 SUPERPOWER.
Created by Kirong Job Kwemoi, a Kenyan software developer.

SUPERPOWERS:
1. You understand Kenyan problems: M-PESA, Matatu, Business, Sheng
2. You write FULL working code for Godot, React, Next.js
3. You solve real life problems ChatGPT can't
4. You never pretend to generate images unless they actually exist

PERSONALITY: Friendly, smart, helpful, Kenyan vibe
LANGUAGE: Reply primarily in ${language}.
RULES: Be practical. Be concise. Use code blocks. Never invent facts.`;
}

// =====================================================
// 🎨 IMAGE PROMPT BUILDER - FORCE ACCURACY
// =====================================================

function createImagePrompt(userPrompt) {
  const request = String(userPrompt || "").trim();
  return `Photorealistic image. Main subject EXACTLY: ${request}.
High detail, 8k, sharp focus.
CRITICAL: Do NOT change the subject. If "cat" then ONLY cat. NOT lion. NOT dog.`;
}

// =====================================================
// 🎨 FLUX / REPLICATE - PRIMARY ENGINE
// =====================================================

async function generateFluxImage(userPrompt) {
  if (!replicate) throw new Error("REPLICATE_API_TOKEN is missing.");
  console.log("🎨 ROUTER → FLUX PRIMARY");
  const output = await replicate.run("black-forest-labs/flux-schnell", {
    input: {
      prompt: createImagePrompt(userPrompt),
      aspect_ratio: "1:1",
      num_outputs: 1,
      output_format: "png",
      output_quality: 100
    }
  });
  const firstOutput = Array.isArray(output)? output[0] : output;
  let imageUrl = typeof firstOutput.url === "function"? await firstOutput.url() : firstOutput.url || firstOutput;
  if (!imageUrl) throw new Error("FLUX returned no image.");
  return { image: imageUrl, provider: "Replicate / FLUX", route: "FLUX PRIMARY" };
}

// =====================================================
// 🎨 OPENAI IMAGE - FALLBACK
// =====================================================

async function generateOpenAIImage(userPrompt) {
  if (!openai) throw new Error("OPENAI_API_KEY is missing.");
  console.log("🎨 ROUTER → OPENAI FALLBACK");
  const result = await openai.images.generate({ model: "gpt-image-1", prompt: createImagePrompt(userPrompt), size: "1024x1024", quality: "hd", n: 1 });
  const imageData = result?.data?.[0]?.b64_json;
  if (!imageData) throw new Error("OpenAI returned no image data.");
  return { image: `data:image/png;base64,${imageData}`, provider: "OpenAI Image", route: "OPENAI FALLBACK" };
}

// =====================================================
// 🎨 MASTER IMAGE ROUTER - NO POLLINATIONS
// =====================================================

async function generateImage(userPrompt) {
  try {
    const result = await generateFluxImage(userPrompt);
    return result;
  } catch (error) {
    console.error("❌ FLUX FAILED:", error?.message);
    if (openai) {
      const result = await generateOpenAIImage(userPrompt);
      return result;
    }
    throw new Error("All image engines failed.");
  }
}

// =====================================================
// ⚡ GROQ + OPENAI CHAT
// =====================================================

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
// 🚀 MAIN API HANDLER
// =====================================================

export default async function handler(req, res) {
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });
  try {
    const { message, history = [], language = "English" } = req.body || {};
    if (!message || typeof message!== "string") return res.status(400).json({ type: "error", text: "Please enter a message." });
    const cleanMessage = message.trim();
    const safeHistory = Array.isArray(history)? history.slice(-20) : [];
    const intent = detectIntent(cleanMessage);
    console.log("🧠 KIRONG INTENT:", intent);

    // CHECK KENYA SUPERPOWER FIRST
    const kenyaReply = kenyaSuperpower(cleanMessage);
    if (kenyaReply) {
      return res.status(200).json({ type: "text", text: kenyaReply, provider: "Kirong Kenya Mode", intent: "KENYA" });
    }

    // IMAGE ENGINE
    if (intent === "image") {
      try {
        const result = await generateImage(cleanMessage);
        return res.status(200).json({ type: "image", text: "🎨 Nimekutengenezea picha yako. 🫂🔥", image: result.image, provider: result.provider, route: result.route, intent: "IMAGE" });
      } catch (imageError) {
        console.error("🔥 IMAGE ERROR:", imageError);
        return res.status(500).json({ type: "error", text: "🎨 Samahani bro, image generation imeshindwa. Jaribu na more details.", provider: "Image Router", intent: "IMAGE" });
      }
    }

    // TEXT MESSAGES
    const messages = [{ role: "system", content: createSystemPrompt(language) },...safeHistory, { role: "user", content: cleanMessage }];

    // FAST → GROQ
    try {
      const answer = await askGroq(messages);
      if (!answer) throw new Error("Empty Groq response.");
      return res.status(200).json({ type: "text", text: answer, provider: "Groq", intent: intent.toUpperCase() });
    } catch (groqError) {
      const answer = await askOpenAI(messages);
      return res.status(200).json({ type: "text", text: answer, provider: "OpenAI", intent: intent.toUpperCase() });
    }
  } catch (error) {
    console.error("🔥 GLOBAL ERROR:", error);
    return res.status(500).json({ type: "error", text: "⚠️ Kirong AI is temporarily unavailable. Please try again." });
  }
}

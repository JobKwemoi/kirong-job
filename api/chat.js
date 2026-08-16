import Groq from "groq-sdk";
import OpenAI from "openai";
import { HfInference } from '@huggingface/inference';

const groq = process.env.GROQ_API_KEY? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const openai = process.env.OPENAI_API_KEY? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const hf = process.env.HUGGINGFACE_API_KEY? new HfInference(process.env.HUGGINGFACE_API_KEY) : null;

function detectIntent(message) {
  const text = String(message || "").toLowerCase();
  if (text.includes("picha") || text.includes("ndege") || text.includes("simba") || text.includes("generate image")) return "image";
  return "chat";
}

function createImagePrompt(userPrompt) {
  let request = String(userPrompt || "").replace(/nigeneretie|tengeneza|picha ya|generate image of/gi, "").trim();
  request = request.replace(/ndege/gi, "airplane").replace(/mlima/gi, "mountain");
  return `Photorealistic, 8k, ultra detailed: ${request}`;
}

async function generateHuggingFaceImage(userPrompt) {
  if (!hf) throw new Error("HUGGINGFACE_API_KEY missing");
  console.log("🎨 HUGGINGFACE → PRIMARY");
  
  const blob = await hf.textToImage({
    model: 'black-forest-labs/FLUX.1-schnell', // Hii ni mbio na ni FREE
    inputs: createImagePrompt(userPrompt),
    parameters: { num_inference_steps: 4, guidance_scale: 0 }
  });
  
  const arrayBuffer = await blob.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');
  return { image: `data:image/png;base64,${base64}`, provider: "HuggingFace FLUX" };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method!== "POST") return res.status(405).json({ type: "error", text: "Method Not Allowed" });

  try {
    const { message, history = [], language = "English" } = req.body || {};
    const cleanMessage = message.trim();
    const intent = detectIntent(cleanMessage);

    if (intent === "image") {
      let lastError = "";
      // TRY 1: HUGGINGFACE
      try {
        const result = await generateHuggingFaceImage(cleanMessage);
        return res.status(200).json({ type: "image", text: `🎨 Hii hapa: ${cleanMessage} 🫂🔥`, image: result.image, provider: result.provider });
      } catch (e) { lastError = `HF: ${e.message}`; }

      // TRY 2: POLLINATIONS BACKUP
      try {
        const prompt = createImagePrompt(cleanMessage);
        const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?model=flux-dev&width=1024&height=1024&nologo=true`;
        const response = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        return res.status(200).json({ type: "image", text: `🎨 Hii hapa: ${cleanMessage} 🫂🔥`, image: `data:image/png;base64,${base64}`, provider: "Pollinations" });
      } catch (e) { lastError += ` | Pollinations: ${e.message}`; }

      return res.status(500).json({ type: "error", text: `🎨 Zote zimeshindwa bro.\n\nError: ${lastError}` });
    }

    const messages = [{ role: "system", content: `You are Kirong AI. Reply in ${language}` },...history, { role: "user", content: cleanMessage }];
    const answer = await groq.chat.completions.create({model:"llama-3.1-8b-instant",messages}).then(r=>r.choices[0].message.content);
    return res.status(200).json({ type: "text", text: answer });

  } catch (error) {
    return res.status(500).json({ type: "error", text: `⚠️ Error: ${error.message}` });
  }
}
